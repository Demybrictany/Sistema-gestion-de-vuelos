const { QueryTypes } = require('sequelize');

const sequelize = require('../db/database');
const Notificacion = require('../models/notificacion.model');
const Pasajero = require('../models/pasajero.model');
const EntregaNotificacion = require('../models/entrega_notificacion.model');
const Auditoria = require('../models/auditoria.model');

const { enviarCorreo } = require('../lib/correo');

// Una entrega ya resuelta no se vuelve a enviar si el broker reintenta
// el mismo mensaje.
const ESTADOS_TERMINALES = new Set(['ENVIADA', 'SIMULADA']);

const registrarLog = async ({
  accion,
  descripcion,
  idEntrega = null,
  idNotificacion,
}) => {
  try {
    await Auditoria.create({
      id_usuario: null,
      accion,
      tabla_afectada: 'entregas_notificacion',
      id_registro:
        idEntrega != null ? String(idEntrega) : String(idNotificacion),
      descripcion,
    });
  } catch (error) {
    // El log no debe tumbar la entrega.
    console.error(
      '[entregas] No se pudo registrar la auditoría:',
      error.message
    );
  }
};

const obtenerEntrega = async (idNotificacion) => {
  try {
    const [entrega] = await EntregaNotificacion.findOrCreate({
      where: { id_notificacion: idNotificacion, canal: 'CORREO' },
      defaults: {
        estado: 'PENDIENTE',
        intento: 0,
      },
    });

    return entrega;
  } catch (error) {
    // Dos mensajes simultáneos pueden chocar con la restricción única.
    if (error.name === 'SequelizeUniqueConstraintError') {
      return EntregaNotificacion.findOne({
        where: { id_notificacion: idNotificacion, canal: 'CORREO' },
      });
    }

    throw error;
  }
};

// Reclama la entrega de forma atómica antes de enviar el correo. Si dos
// mensajes del mismo aviso llegan a la vez, solo uno actualiza la fila;
// el otro se descarta como duplicado. Así no se envía dos veces.
const reclamarEntrega = async (idEntrega) => {
  const [reclamo] = await sequelize.query(
    `UPDATE entregas_notificacion
        SET intento = intento + 1
      WHERE id_entrega = :idEntrega
        AND estado NOT IN ('ENVIADA', 'SIMULADA')
      RETURNING intento`,
    {
      replacements: { idEntrega },
      type: QueryTypes.SELECT,
    }
  );

  return reclamo || null;
};

const procesarNotificacion = async ({ id_notificacion }) => {
  const notificacion = await Notificacion.findByPk(id_notificacion, {
    include: [{ model: Pasajero, as: 'pasajero' }],
  });

  if (!notificacion) {
    const error = new Error(
      `La notificación ${id_notificacion} no existe`
    );
    error.noReintentar = true;
    throw error;
  }

  const destinatario = notificacion.pasajero?.correo || null;
  const entrega = await obtenerEntrega(id_notificacion);

  if (ESTADOS_TERMINALES.has(entrega.estado)) {
    return { estado: entrega.estado, duplicada: true };
  }

  const reclamo = await reclamarEntrega(entrega.id_entrega);

  if (!reclamo) {
    // Otro worker ganó el reclamo y está enviando este mismo aviso.
    const actual = await EntregaNotificacion.findByPk(entrega.id_entrega);

    return {
      estado: actual?.estado || 'PENDIENTE',
      duplicada: true,
    };
  }

  try {
    const resultado = await enviarCorreo({
      para: destinatario,
      asunto: notificacion.titulo,
      texto: notificacion.mensaje,
    });

    await entrega.update({
      destinatario,
      estado: resultado.estado,
      intento: reclamo.intento,
      detalle: resultado.detalle,
      fecha_entrega: new Date(),
    });

    await registrarLog({
      accion: `ENTREGA_${resultado.estado}`,
      descripcion:
        `Notificación ${id_notificacion} (${notificacion.tipo}): ` +
        resultado.detalle,
      idEntrega: entrega.id_entrega,
      idNotificacion: id_notificacion,
    });

    return {
      estado: resultado.estado,
      detalle: resultado.detalle,
      duplicada: false,
    };
  } catch (error) {
    await entrega.update({
      destinatario,
      estado: 'FALLIDA',
      intento: reclamo.intento,
      detalle: error.message,
      fecha_entrega: new Date(),
    });

    await registrarLog({
      accion: 'ENTREGA_FALLIDA',
      descripcion: `Notificación ${id_notificacion}: ${error.message}`,
      idEntrega: entrega.id_entrega,
      idNotificacion: id_notificacion,
    });

    throw error;
  }
};

module.exports = { procesarNotificacion };
