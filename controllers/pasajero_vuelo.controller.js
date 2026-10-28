const PasajeroVuelo = require('../models/pasajero_vuelo.model');
const Pasajero = require('../models/pasajero.model');
const Vuelo = require('../models/vuelo.model');
const Itinerario = require('../models/itinerario.model');
const Usuario = require('../models/usuario.model');

const asyncHandler = require('../lib/async-handler');
const {
  asignarPasajero,
  actualizarAsignacion,
  eliminarAsignacion,
} = require('../services/pasajero_vuelo.service');

const INCLUDE_ASIGNACION = [
  { model: Pasajero, as: 'pasajero' },
  { model: Vuelo, as: 'vuelo' },
  { model: Itinerario, as: 'itinerario' },
  {
    model: Usuario,
    as: 'usuario_registro',
    attributes: { exclude: ['password_hash'] },
  },
];

const contextoDe = (req) => ({
  idUsuario: req.usuario?.id_usuario || null,
});

// Obtener todos los registros
const obtenerPasajerosVuelos = asyncHandler(async (req, res) => {
  const registros = await PasajeroVuelo.findAll({
    include: INCLUDE_ASIGNACION,
  });

  res.status(200).json(registros);
});

// Obtener registro por ID
const obtenerPasajeroVueloPorId = asyncHandler(async (req, res) => {
  const registro = await PasajeroVuelo.findByPk(req.params.id, {
    include: INCLUDE_ASIGNACION,
  });

  if (!registro) {
    res.status(404).json({
      mensaje: 'Registro de pasajero y vuelo no encontrado',
    });
    return;
  }

  res.status(200).json(registro);
});

// Registrar pasajero en un vuelo (cupo y duplicados validados en transacción)
const crearPasajeroVuelo = asyncHandler(async (req, res) => {
  const registro = await asignarPasajero({
    datos: req.body,
    contexto: contextoDe(req),
  });

  res.status(201).json({
    mensaje: 'Pasajero registrado en el vuelo correctamente',
    pasajero_vuelo: registro,
  });
});

// Actualizar registro
const actualizarPasajeroVuelo = asyncHandler(async (req, res) => {
  const registro = await actualizarAsignacion({
    idAsignacion: req.params.id,
    datos: req.body,
    contexto: contextoDe(req),
  });

  res.status(200).json({
    mensaje: 'Registro actualizado correctamente',
    pasajero_vuelo: registro,
  });
});

// Eliminar registro
const eliminarPasajeroVuelo = asyncHandler(async (req, res) => {
  await eliminarAsignacion(req.params.id);

  res.status(200).json({
    mensaje: 'Registro eliminado correctamente',
  });
});

module.exports = {
  obtenerPasajerosVuelos,
  obtenerPasajeroVueloPorId,
  crearPasajeroVuelo,
  actualizarPasajeroVuelo,
  eliminarPasajeroVuelo,
};
