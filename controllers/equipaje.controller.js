const Equipaje = require('../models/equipaje.model');
const Pasajero = require('../models/pasajero.model');
const Aeropuerto = require('../models/aeropuerto.model');
const BandaEquipaje = require('../models/banda_equipaje.model');

const asyncHandler = require('../lib/async-handler');
const { ErrorConEstado } = require('../lib/errores');
const {
  registrarTramo: registrarTramoService,
  cambiarBanda: cambiarBandaService,
  cambiarEstado: cambiarEstadoService,
  obtenerEquipajesDePasajero,
} = require('../services/equipaje.service');

const INCLUDE_EQUIPAJE = [
  { model: Pasajero, as: 'pasajero' },
  { model: Aeropuerto, as: 'aeropuertoOrigen' },
  { model: Aeropuerto, as: 'aeropuertoDestino' },
  { model: BandaEquipaje, as: 'bandaActual' },
];

const contextoDe = (req) => ({
  idUsuario: req.usuario?.id_usuario || null,
  ip: req.ip,
});

const obtenerEquipajes = asyncHandler(async (req, res) => {
  const equipajes = await Equipaje.findAll({
    include: INCLUDE_EQUIPAJE,
    order: [['created_at', 'DESC']],
  });

  res.status(200).json(equipajes);
});

const obtenerMisEquipajes = asyncHandler(async (req, res) => {
  if (!req.usuario?.id_pasajero) {
    throw new ErrorConEstado(
      400,
      'El usuario no está vinculado a una ficha de pasajero'
    );
  }

  const equipajes = await obtenerEquipajesDePasajero(req.usuario.id_pasajero);

  res.status(200).json(equipajes);
});

const obtenerEquipajePorId = asyncHandler(async (req, res) => {
  const equipaje = await Equipaje.findByPk(req.params.id, {
    include: INCLUDE_EQUIPAJE,
  });

  if (!equipaje) {
    throw new ErrorConEstado(404, 'Equipaje no encontrado');
  }

  if (
    req.usuario.rol === 'PASAJERO' &&
    equipaje.id_pasajero !== req.usuario.id_pasajero
  ) {
    throw new ErrorConEstado(
      403,
      'No tienes permisos para consultar este equipaje'
    );
  }

  res.status(200).json(equipaje);
});

const crearEquipaje = asyncHandler(async (req, res) => {
  const {
    codigo_equipaje,
    id_pasajero,
    peso,
    origen,
    destino_final,
    id_banda_actual,
    observaciones,
  } = req.body;

  if (origen === destino_final) {
    throw new ErrorConEstado(
      400,
      'El origen y el destino final no pueden ser el mismo'
    );
  }

  const pasajero = await Pasajero.findByPk(id_pasajero);
  if (!pasajero) {
    throw new ErrorConEstado(400, 'El pasajero seleccionado no existe');
  }

  const aeropuertoOrigen = await Aeropuerto.findByPk(origen);
  const aeropuertoDestino = await Aeropuerto.findByPk(destino_final);

  if (!aeropuertoOrigen || !aeropuertoDestino) {
    throw new ErrorConEstado(
      400,
      'El aeropuerto de origen o destino no existe'
    );
  }

  if (id_banda_actual) {
    const banda = await BandaEquipaje.findByPk(id_banda_actual);
    if (!banda) {
      throw new ErrorConEstado(
        400,
        'La banda de equipaje seleccionada no existe'
      );
    }
  }

  const equipaje = await Equipaje.create({
    codigo_equipaje,
    id_pasajero,
    peso,
    origen,
    destino_final,
    id_banda_actual,
    estado: 'REGISTRADO',
    observaciones,
  });

  res.status(201).json({
    mensaje: 'Equipaje registrado correctamente',
    equipaje,
  });
});

const actualizarEquipaje = asyncHandler(async (req, res) => {
  const equipaje = await Equipaje.findByPk(req.params.id);

  if (!equipaje) {
    throw new ErrorConEstado(404, 'Equipaje no encontrado');
  }

  await equipaje.update(req.body);

  res.status(200).json({
    mensaje: 'Equipaje actualizado correctamente',
    equipaje: await Equipaje.findByPk(req.params.id, {
      include: INCLUDE_EQUIPAJE,
    }),
  });
});

const registrarTramo = asyncHandler(async (req, res) => {
  const resultado = await registrarTramoService({
    idEquipaje: req.params.id,
    datos: req.body,
    contexto: contextoDe(req),
  });

  res.status(201).json({
    mensaje: 'Tramo de equipaje registrado correctamente',
    ...resultado,
  });
});

const cambiarBanda = asyncHandler(async (req, res) => {
  const equipaje = await cambiarBandaService({
    idEquipaje: req.params.id,
    datos: req.body,
    contexto: contextoDe(req),
  });

  res.status(200).json({
    mensaje: 'Banda de equipaje actualizada correctamente',
    equipaje,
  });
});

const cambiarEstado = asyncHandler(async (req, res) => {
  const equipaje = await cambiarEstadoService({
    idEquipaje: req.params.id,
    datos: req.body,
    contexto: contextoDe(req),
  });

  res.status(200).json({
    mensaje: 'Estado del equipaje actualizado correctamente',
    equipaje,
  });
});

const eliminarEquipaje = asyncHandler(async (req, res) => {
  const equipaje = await Equipaje.findByPk(req.params.id);

  if (!equipaje) {
    throw new ErrorConEstado(404, 'Equipaje no encontrado');
  }

  await equipaje.destroy();

  res.status(200).json({
    mensaje: 'Equipaje eliminado correctamente',
  });
});

module.exports = {
  obtenerEquipajes,
  obtenerMisEquipajes,
  obtenerEquipajePorId,
  crearEquipaje,
  actualizarEquipaje,
  registrarTramo,
  cambiarBanda,
  cambiarEstado,
  eliminarEquipaje,
};
