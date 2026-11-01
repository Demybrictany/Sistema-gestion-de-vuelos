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
        intento: 1,
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

  try {
    const resultado = await enviarCorreo({
      para: destinatario,
      asunto: notificacion.titulo,
      texto: notificacion.mensaje,
    });

    await entrega.update({
      destinatario,
      estado: resultado.estado,
      intento: (entrega.intento || 0) + 1,
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
      intento: (entrega.intento || 0) + 1,
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
