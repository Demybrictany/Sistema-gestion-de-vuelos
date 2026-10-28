const Vuelo = require('../models/vuelo.model');
const Aeropuerto = require('../models/aeropuerto.model');
const Puerta = require('../models/puerta.model');

const asyncHandler = require('../lib/async-handler');
const { ErrorConEstado } = require('../lib/errores');
const {
  crearVuelo: crearVueloService,
  actualizarVuelo: actualizarVueloService,
  cambiarEstadoVuelo,
  reprogramarVuelo,
  cambiarPuertaVuelo,
  cancelarVuelo,
  obtenerVuelosDePasajero,
} = require('../services/vuelo.service');

const INCLUDE_VUELO = [
  { model: Aeropuerto, as: 'aeropuerto_origen' },
  { model: Aeropuerto, as: 'aeropuerto_destino' },
  { model: Puerta, as: 'puerta' },
];

const contextoDe = (req) => ({
  idUsuario: req.usuario?.id_usuario || null,
  ip: req.ip,
});

const obtenerVuelos = asyncHandler(async (req, res) => {
  const vuelos = await Vuelo.findAll({
    include: INCLUDE_VUELO,
    order: [
      ['fecha_salida', 'ASC'],
      ['hora_salida', 'ASC'],
    ],
  });

  res.status(200).json(vuelos);
});

const obtenerVueloPorId = asyncHandler(async (req, res) => {
  const vuelo = await Vuelo.findByPk(req.params.id, {
    include: INCLUDE_VUELO,
  });

  if (!vuelo) {
    throw new ErrorConEstado(404, 'Vuelo no encontrado');
  }

  res.status(200).json(vuelo);
});

const crearVuelo = asyncHandler(async (req, res) => {
  const vuelo = await crearVueloService(req.body, contextoDe(req));

  res.status(201).json({
    mensaje: 'Vuelo creado correctamente',
    vuelo,
  });
});

const actualizarVuelo = asyncHandler(async (req, res) => {
  const { vuelo, cambios } = await actualizarVueloService({
    idVuelo: req.params.id,
    datos: req.body,
    motivo: req.body.motivo,
    contexto: contextoDe(req),
  });

  res.status(200).json({
    mensaje: 'Vuelo actualizado correctamente',
    vuelo,
    cambios: Object.keys(cambios),
  });
});

const cambiarEstado = asyncHandler(async (req, res) => {
  const { vuelo, cambios } = await cambiarEstadoVuelo(
    req.params.id,
    req.body,
    contextoDe(req)
  );

  res.status(200).json({
    mensaje: 'Estado del vuelo actualizado correctamente',
    vuelo,
    cambios: Object.keys(cambios),
  });
});

const reprogramar = asyncHandler(async (req, res) => {
  const { vuelo, cambios } = await reprogramarVuelo(
    req.params.id,
    req.body,
    contextoDe(req)
  );

  res.status(200).json({
    mensaje: 'Vuelo reprogramado correctamente',
    vuelo,
    cambios: Object.keys(cambios),
  });
});

const cambiarPuerta = asyncHandler(async (req, res) => {
  const { vuelo, cambios } = await cambiarPuertaVuelo(
    req.params.id,
    req.body,
    contextoDe(req)
  );

  res.status(200).json({
    mensaje: 'Puerta del vuelo actualizada correctamente',
    vuelo,
    cambios: Object.keys(cambios),
  });
});

const cancelar = asyncHandler(async (req, res) => {
  const { vuelo, cambios } = await cancelarVuelo(
    req.params.id,
    req.body,
    contextoDe(req)
  );

  res.status(200).json({
    mensaje: 'Vuelo cancelado correctamente',
    vuelo,
    cambios: Object.keys(cambios),
  });
});

const eliminarVuelo = asyncHandler(async (req, res) => {
  const vuelo = await Vuelo.findByPk(req.params.id);

  if (!vuelo) {
    throw new ErrorConEstado(404, 'Vuelo no encontrado');
  }

  await vuelo.destroy();

  res.status(200).json({
    mensaje: 'Vuelo eliminado correctamente',
  });
});

const obtenerMisVuelos = asyncHandler(async (req, res) => {
  if (!req.usuario?.id_pasajero) {
    throw new ErrorConEstado(
      400,
      'El usuario no está vinculado a una ficha de pasajero'
    );
  }

  const vuelos = await obtenerVuelosDePasajero(req.usuario.id_pasajero);

  res.status(200).json(vuelos);
});

module.exports = {
  obtenerVuelos,
  obtenerVueloPorId,
  crearVuelo,
  actualizarVuelo,
  cambiarEstado,
  reprogramar,
  cambiarPuerta,
  cancelar,
  eliminarVuelo,
  obtenerMisVuelos,
};
