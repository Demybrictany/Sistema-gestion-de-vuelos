const EquipajeVuelo = require('../models/equipaje_vuelo.model');
const Equipaje = require('../models/equipaje.model');
const Vuelo = require('../models/vuelo.model');
const BandaEquipaje = require('../models/banda_equipaje.model');
const Usuario = require('../models/usuario.model');

const asyncHandler = require('../lib/async-handler');
const { registrarTramo } = require('../services/equipaje.service');

// Obtener todos
const obtenerEquipajesVuelos = async (req, res) => {
  try {
    const registros = await EquipajeVuelo.findAll({
      include: [
        {
          model: Equipaje,
          as: 'equipaje',
        },
        {
          model: Vuelo,
          as: 'vuelo',
        },
        {
          model: BandaEquipaje,
          as: 'bandaOrigen',
        },
        {
          model: BandaEquipaje,
          as: 'bandaDestino',
        },
        {
          model: Usuario,
          as: 'usuarioRegistro',
          attributes: {
            exclude: ['password_hash'],
          },
        },
      ],
    });

    res.status(200).json(registros);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: 'Error al obtener los equipajes de los vuelos',
    });
  }
};

// Obtener por ID
const obtenerEquipajeVueloPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const registro = await EquipajeVuelo.findByPk(id, {
      include: [
        { model: Equipaje, as: 'equipaje' },
        { model: Vuelo, as: 'vuelo' },
        { model: BandaEquipaje, as: 'bandaOrigen' },
        { model: BandaEquipaje, as: 'bandaDestino' },
        {
          model: Usuario,
          as: 'usuarioRegistro',
          attributes: {
            exclude: ['password_hash'],
          },
        },
      ],
    });

    if (!registro) {
      return res.status(404).json({
        mensaje: 'Registro de equipaje y vuelo no encontrado',
      });
    }

    res.status(200).json(registro);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: 'Error al obtener el registro',
    });
  }
};

// Registrar equipaje en un vuelo (mismo flujo de negocio que /equipajes/:id/tramos)
const crearEquipajeVuelo = asyncHandler(async (req, res) => {
  const {
    id_equipaje,
    id_vuelo,
    id_banda_origen,
    id_banda_destino,
  } = req.body;

  const resultado = await registrarTramo({
    idEquipaje: id_equipaje,
    datos: {
      id_vuelo,
      id_banda_origen,
      id_banda_destino,
    },
    contexto: {
      idUsuario: req.usuario?.id_usuario || null,
    },
  });

  res.status(201).json({
    mensaje: 'Equipaje asignado al vuelo correctamente',
    ...resultado,
  });
});

module.exports = {
  obtenerEquipajesVuelos,
  obtenerEquipajeVueloPorId,
  crearEquipajeVuelo,
};
