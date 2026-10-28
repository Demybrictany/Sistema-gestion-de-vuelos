const { Op } = require('sequelize');

const Notificacion = require('../models/notificacion.model');
const Pasajero = require('../models/pasajero.model');
const Vuelo = require('../models/vuelo.model');
const Equipaje = require('../models/equipaje.model');

const asyncHandler = require('../lib/async-handler');
const { ErrorConEstado } = require('../lib/errores');

const INCLUDE_NOTIFICACION = [
  { model: Pasajero, as: 'pasajero' },
  { model: Vuelo, as: 'vuelo' },
  { model: Equipaje, as: 'equipaje' },
];

const obtenerNotificaciones = asyncHandler(async (req, res) => {
  const notificaciones = await Notificacion.findAll({
    include: INCLUDE_NOTIFICACION,
    order: [['fecha_envio', 'DESC']],
  });

  res.status(200).json(notificaciones);
});

const obtenerMisNotificaciones = asyncHandler(async (req, res) => {
  if (!req.usuario?.id_pasajero) {
    throw new ErrorConEstado(
      400,
      'El usuario no está vinculado a una ficha de pasajero'
    );
  }

  const where = { id_pasajero: req.usuario.id_pasajero };

  if (req.query.leida === 'true' || req.query.leida === 'false') {
    where.leida = req.query.leida === 'true';
  }

  const notificaciones = await Notificacion.findAll({
    where,
    include: INCLUDE_NOTIFICACION,
    order: [['fecha_envio', 'DESC']],
  });

  res.status(200).json(notificaciones);
});

const obtenerNotificacionPorId = asyncHandler(async (req, res) => {
  const notificacion = await Notificacion.findByPk(req.params.id, {
    include: INCLUDE_NOTIFICACION,
  });

  if (!notificacion) {
    throw new ErrorConEstado(404, 'Notificación no encontrada');
  }

  res.status(200).json(notificacion);
});

const crearNotificacion = asyncHandler(async (req, res) => {
  const {
    id_pasajero,
    id_vuelo,
    id_equipaje,
    tipo,
    titulo,
    mensaje,
  } = req.body;

  const pasajero = await Pasajero.findByPk(id_pasajero);
  if (!pasajero) {
    throw new ErrorConEstado(400, 'El pasajero no existe');
  }

  if (id_vuelo) {
    const vuelo = await Vuelo.findByPk(id_vuelo);
    if (!vuelo) {
      throw new ErrorConEstado(400, 'El vuelo no existe');
    }
  }

  if (id_equipaje) {
    const equipaje = await Equipaje.findByPk(id_equipaje);
    if (!equipaje) {
      throw new ErrorConEstado(400, 'El equipaje no existe');
    }
  }

  const notificacion = await Notificacion.create({
    id_pasajero,
    id_vuelo,
    id_equipaje,
    tipo,
    titulo,
    mensaje,
    leida: false,
  });

  res.status(201).json({
    mensaje: 'Notificación creada correctamente',
    notificacion,
  });
});

const actualizarNotificacion = asyncHandler(async (req, res) => {
  const notificacion = await Notificacion.findByPk(req.params.id);

  if (!notificacion) {
    throw new ErrorConEstado(404, 'Notificación no encontrada');
  }

  const datos = { ...req.body };

  if (datos.leida === true && !notificacion.leida) {
    datos.fecha_lectura = new Date();
  }

  if (datos.leida === false) {
    datos.fecha_lectura = null;
  }

  await notificacion.update(datos);

  res.status(200).json({
    mensaje: 'Notificación actualizada correctamente',
    notificacion,
  });
});

const marcarLeida = asyncHandler(async (req, res) => {
  const notificacion = await Notificacion.findByPk(req.params.id);

  if (!notificacion) {
    throw new ErrorConEstado(404, 'Notificación no encontrada');
  }

  if (
    req.usuario.rol === 'PASAJERO' &&
    notificacion.id_pasajero !== req.usuario.id_pasajero
  ) {
    throw new ErrorConEstado(
      403,
      'No tienes permisos para modificar esta notificación'
    );
  }

  if (!notificacion.leida) {
    await notificacion.update({
      leida: true,
      fecha_lectura: new Date(),
    });
  }

  res.status(200).json({
    mensaje: 'Notificación marcada como leída',
    notificacion,
  });
});

const marcarTodasLeidas = asyncHandler(async (req, res) => {
  if (!req.usuario?.id_pasajero) {
    throw new ErrorConEstado(
      400,
      'El usuario no está vinculado a una ficha de pasajero'
    );
  }

  const [cantidad] = await Notificacion.update(
    {
      leida: true,
      fecha_lectura: new Date(),
    },
    {
      where: {
        id_pasajero: req.usuario.id_pasajero,
        leida: false,
      },
    }
  );

  res.status(200).json({
    mensaje: 'Notificaciones marcadas como leídas',
    actualizadas: cantidad,
  });
});

const eliminarNotificacion = asyncHandler(async (req, res) => {
  const notificacion = await Notificacion.findByPk(req.params.id);

  if (!notificacion) {
    throw new ErrorConEstado(404, 'Notificación no encontrada');
  }

  await notificacion.destroy();

  res.status(200).json({
    mensaje: 'Notificación eliminada correctamente',
  });
});

module.exports = {
  obtenerNotificaciones,
  obtenerMisNotificaciones,
  obtenerNotificacionPorId,
  crearNotificacion,
  actualizarNotificacion,
  marcarLeida,
  marcarTodasLeidas,
  eliminarNotificacion,
};
