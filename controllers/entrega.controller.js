const EntregaNotificacion = require('../models/entrega_notificacion.model');
const Notificacion = require('../models/notificacion.model');

const asyncHandler = require('../lib/async-handler');
const { ErrorConEstado } = require('../lib/errores');

const ESTADOS = ['PENDIENTE', 'ENVIADA', 'SIMULADA', 'FALLIDA'];
const CANALES = ['CORREO', 'PUSH', 'SMS'];

const listarEntregas = asyncHandler(async (req, res) => {
  const where = {};

  if (req.query.estado) {
    if (!ESTADOS.includes(req.query.estado)) {
      throw new ErrorConEstado(400, 'Estado de entrega inválido');
    }
    where.estado = req.query.estado;
  }

  if (req.query.canal) {
    if (!CANALES.includes(req.query.canal)) {
      throw new ErrorConEstado(400, 'Canal de entrega inválido');
    }
    where.canal = req.query.canal;
  }

  if (req.query.id_notificacion) {
    const idNotificacion = Number(req.query.id_notificacion);
    if (!Number.isInteger(idNotificacion) || idNotificacion <= 0) {
      throw new ErrorConEstado(400, 'id_notificacion inválido');
    }
    where.id_notificacion = idNotificacion;
  }

  const entregas = await EntregaNotificacion.findAll({
    where,
    order: [['created_at', 'DESC']],
    limit: 200,
  });

  res.status(200).json(entregas);
});

const resumenEntregas = asyncHandler(async (req, res) => {
  const filas = await EntregaNotificacion.count({ group: ['estado'] });

  const porEstado = {
    PENDIENTE: 0,
    ENVIADA: 0,
    SIMULADA: 0,
    FALLIDA: 0,
  };

  for (const fila of filas) {
    porEstado[fila.estado] = Number(fila.count);
  }

  const total = Object.values(porEstado).reduce(
    (acumulado, valor) => acumulado + valor,
    0
  );

  res.status(200).json({ total, por_estado: porEstado });
});

const listarEntregasDeNotificacion = asyncHandler(async (req, res) => {
  const idNotificacion = Number(req.params.id);

  if (!Number.isInteger(idNotificacion) || idNotificacion <= 0) {
    throw new ErrorConEstado(400, 'Id de notificación inválido');
  }

  const notificacion = await Notificacion.findByPk(idNotificacion);

  if (!notificacion) {
    throw new ErrorConEstado(404, 'Notificación no encontrada');
  }

  const entregas = await EntregaNotificacion.findAll({
    where: { id_notificacion: idNotificacion },
    order: [['created_at', 'DESC']],
  });

  res.status(200).json(entregas);
});

module.exports = {
  listarEntregas,
  resumenEntregas,
  listarEntregasDeNotificacion,
};
