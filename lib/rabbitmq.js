const amqp = require('amqplib');

// ============================================================
// Topología de mensajería del sistema.
//
//   API ──publish──▶ exchange (topic) ──▶ cola de notificaciones
//                                              │
//                                              ▼
//                                           worker
//                                              │
//                        fallo definitivo ──▶ cola de fallidos
//                        fallo temporal  ──▶ cola de reintentos (TTL)
// ============================================================

const EXCHANGE = process.env.RABBITMQ_EXCHANGE || 'sistema.vuelos';
const EXCHANGE_FALLIDAS =
  process.env.RABBITMQ_EXCHANGE_FALLIDAS || `${EXCHANGE}.fallidas`;
const QUEUE = process.env.RABBITMQ_QUEUE || 'notificaciones.pasajeros';
const QUEUE_FALLIDAS =
  process.env.RABBITMQ_QUEUE_FALLIDAS || 'notificaciones.fallidas';
const QUEUE_REINTENTOS =
  process.env.RABBITMQ_QUEUE_REINTENTOS || 'notificaciones.reintentos';

const ROUTING_KEY = 'notificacion.creada';
const ROUTING_KEY_FALLIDA = 'notificacion.fallida';

let conexion = null;
let canal = null;
let conectando = null;
let ultimoError = null;
let avisoSinUrl = false;

const configurado = () => Boolean(process.env.RABBITMQ_URL);

const reiniciar = () => {
  canal = null;
  conexion = null;
  conectando = null;
};

// Declara exchange, colas y enlaces. Es idempotente: se puede ejecutar
// tanto desde el publicador como desde el worker.
const asegurarTopologia = async (ch) => {
  await ch.assertExchange(EXCHANGE, 'topic', { durable: true });
  await ch.assertExchange(EXCHANGE_FALLIDAS, 'direct', { durable: true });

  await ch.assertQueue(QUEUE, {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': EXCHANGE_FALLIDAS,
      'x-dead-letter-routing-key': ROUTING_KEY_FALLIDA,
    },
  });
  await ch.bindQueue(QUEUE, EXCHANGE, 'notificacion.*');

  await ch.assertQueue(QUEUE_FALLIDAS, { durable: true });
  await ch.bindQueue(QUEUE_FALLIDAS, EXCHANGE_FALLIDAS, ROUTING_KEY_FALLIDA);

  // La cola de reintentos no tiene consumidor: el TTL del mensaje lo
  // devuelve al exchange principal para que el worker lo vuelva a tomar.
  await ch.assertQueue(QUEUE_REINTENTOS, {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': EXCHANGE,
      'x-dead-letter-routing-key': ROUTING_KEY,
    },
  });
};

const conectar = async () => {
  if (!configurado()) {
    if (!avisoSinUrl) {
      console.warn(
        '[rabbitmq] RABBITMQ_URL no configurada; la mensajería queda desactivada.'
      );
      avisoSinUrl = true;
    }
    return null;
  }

  if (canal) {
    return canal;
  }

  if (conectando) {
    return conectando;
  }

  conectando = (async () => {
    const conn = await amqp.connect(process.env.RABBITMQ_URL);

    conn.on('error', (error) => {
      ultimoError = error.message;
      console.error('[rabbitmq] Error de conexión:', error.message);
    });

    conn.on('close', () => {
      reiniciar();
    });

    const ch = await conn.createConfirmChannel();

    ch.on('error', (error) => {
      ultimoError = error.message;
      console.error('[rabbitmq] Error de canal:', error.message);
    });

    ch.on('close', () => {
      reiniciar();
    });

    await asegurarTopologia(ch);

    conexion = conn;
    canal = ch;
    ultimoError = null;

    return ch;
  })();

  try {
    return await conectando;
  } catch (error) {
    ultimoError = error.message;
    reiniciar();
    throw error;
  } finally {
    conectando = null;
  }
};

// Publica un evento y espera la confirmación del broker. Nunca lanza:
// si RabbitMQ no está disponible, la operación de negocio continúa.
const publicarEvento = async (routingKey, payload) => {
  let ch;

  try {
    ch = await conectar();
  } catch (error) {
    return { publicado: false, motivo: error.message };
  }

  if (!ch) {
    return { publicado: false, motivo: 'RABBITMQ_URL no configurada' };
  }

  try {
    const contenido = Buffer.from(JSON.stringify(payload));

    const opciones = {
      persistent: true,
      contentType: 'application/json',
      timestamp: Math.floor(Date.now() / 1000),
      headers: { origen: 'api' },
    };

    if (payload.id_notificacion) {
      opciones.messageId = `notificacion-${payload.id_notificacion}`;
    }

    const aceptado = ch.publish(EXCHANGE, routingKey, contenido, opciones);

    if (!aceptado) {
      await new Promise((resolve) => ch.once('drain', resolve));
    }

    await ch.waitForConfirms();

    return { publicado: true };
  } catch (error) {
    ultimoError = error.message;
    console.error(
      '[rabbitmq] No se pudo publicar el evento:',
      error.message
    );
    return { publicado: false, motivo: error.message };
  }
};

const estadoRabbit = () => ({
  configurado: configurado(),
  conectado: Boolean(canal),
  exchange: EXCHANGE,
  cola: QUEUE,
  cola_fallidas: QUEUE_FALLIDAS,
  error: ultimoError,
});

const cerrarRabbit = async () => {
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

  reiniciar();
};

module.exports = {
  EXCHANGE,
  EXCHANGE_FALLIDAS,
  QUEUE,
  QUEUE_FALLIDAS,
  QUEUE_REINTENTOS,
  ROUTING_KEY,
  ROUTING_KEY_FALLIDA,
  asegurarTopologia,
  conectar,
  publicarEvento,
  estadoRabbit,
  cerrarRabbit,
};
