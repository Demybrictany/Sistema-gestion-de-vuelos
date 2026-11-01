require('dotenv').config();

const amqp = require('amqplib');
const { z } = require('zod');

const {
  asegurarTopologia,
  QUEUE,
  QUEUE_REINTENTOS,
} = require('../lib/rabbitmq');
const { procesarNotificacion } = require('../services/entrega.service');

// Registra las asociaciones de Sequelize y los hooks del sistema.
require('../models');

const EventoSchema = z.object({
  evento: z.literal('notificacion.creada'),
  id_notificacion: z.coerce.number().int().positive(),
  ocurrido_en: z.string().optional(),
});

const MAX_REINTENTOS = Number(process.env.RABBITMQ_MAX_REINTENTOS || 3);
const TTL_REINTENTO_MS = Number(
  process.env.RABBITMQ_TTL_REINTENTO_MS || 5000
);
const PREFETCH = Number(process.env.RABBITMQ_PREFETCH || 10);

let conexion = null;
let canal = null;
let cerrando = false;

const enviarAReintento = async (mensaje, reintento) => {
  canal.sendToQueue(QUEUE_REINTENTOS, mensaje.content, {
    persistent: true,
    contentType: 'application/json',
    expiration: String(TTL_REINTENTO_MS),
    headers: {
      ...(mensaje.properties.headers || {}),
      'x-reintento': reintento + 1,
    },
  });

  await canal.waitForConfirms();
  canal.ack(mensaje);
};

const manejarMensaje = async (mensaje) => {
  if (!mensaje) {
    return;
  }

  const reintento = Number(mensaje.properties.headers?.['x-reintento'] || 0);
  let datos;

  try {
    datos = EventoSchema.parse(JSON.parse(mensaje.content.toString()));
  } catch (error) {
    console.error(
      '[worker] Mensaje inválido; se envía a la cola de fallidos:',
      error.message
    );
    canal.nack(mensaje, false, false);
    return;
  }

  try {
    const resultado = await procesarNotificacion(datos);

    console.log(
      `[worker] Notificación ${datos.id_notificacion}: ${resultado.estado}` +
        (resultado.duplicada ? ' (ya entregada)' : '')
    );

    canal.ack(mensaje);
  } catch (error) {
    if (error.noReintentar || reintento >= MAX_REINTENTOS) {
      console.error(
        `[worker] Notificación ${datos.id_notificacion} a fallidos: ` +
          error.message
      );
      canal.nack(mensaje, false, false);
      return;
    }

    console.warn(
      `[worker] Reintento ${reintento + 1}/${MAX_REINTENTOS} para la ` +
        `notificación ${datos.id_notificacion}: ${error.message}`
    );

    try {
      await enviarAReintento(mensaje, reintento);
    } catch (reintentoError) {
      console.error(
        '[worker] No se pudo programar el reintento:',
        reintentoError.message
      );
      canal.nack(mensaje, false, true);
    }
  }
};

const iniciar = async () => {
  if (!process.env.RABBITMQ_URL) {
    console.log(
      '[worker] RABBITMQ_URL no configurada. No hay worker de notificaciones.'
    );
    return;
  }

  conexion = await amqp.connect(process.env.RABBITMQ_URL);

  conexion.on('error', (error) => {
    console.error('[worker] Error de conexión:', error.message);
  });
  conexion.on('close', () => {
    console.warn('[worker] Conexión con RabbitMQ cerrada.');

    // Sin conexión el worker queda vivo pero sin consumir. Se termina con
    // error para que el supervisor (Render, PM2, systemd) lo reinicie.
    if (!cerrando) {
      console.error('[worker] El worker se detiene para ser reiniciado.');
      process.exit(1);
    }
  });

  canal = await conexion.createConfirmChannel();

  canal.on('error', (error) => {
    console.error('[worker] Error de canal:', error.message);
  });

  canal.on('close', () => {
    if (!cerrando) {
      console.error('[worker] Canal cerrado; el worker se detiene.');
      process.exit(1);
    }
  });

  await asegurarTopologia(canal);
  canal.prefetch(PREFETCH);
  await canal.consume(QUEUE, manejarMensaje, { noAck: false });

  console.log(`[worker] Escuchando la cola ${QUEUE}.`);
};

const cerrar = async (codigo = 0) => {
  cerrando = true;

  try {
    if (canal) {
      await canal.close();
    }
  } catch (error) {
    // Ignorar errores al cerrar.
  }

  try {
    if (conexion) {
      await conexion.close();
    }
  } catch (error) {
    // Ignorar errores al cerrar.
  }

  process.exit(codigo);
};

process.on('SIGINT', () => cerrar(0));
process.on('SIGTERM', () => cerrar(0));

iniciar().catch((error) => {
  console.error('[worker] No se pudo iniciar:', error.message);
  process.exit(1);
});
