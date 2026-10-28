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

// Actualizar registro
const actualizarEquipajeVuelo = async (req, res) => {
  try {
    const { id } = req.params;

    const registro = await EquipajeVuelo.findByPk(id);

    if (!registro) {
      return res.status(404).json({
        mensaje: 'Registro de equipaje y vuelo no encontrado',
      });
    }

    const {
      id_banda_origen,
      id_banda_destino,
      orden_vuelo,
      estado,
      registrado_por,
    } = req.body;

    if (orden_vuelo !== undefined && orden_vuelo < 1) {
      return res.status(400).json({
        mensaje: 'El orden del vuelo debe ser mayor o igual a 1',
      });
    }

    const datosActualizar = {
      id_banda_origen,
      id_banda_destino,
      orden_vuelo,
      estado,
      registrado_por,
    };

    Object.keys(datosActualizar).forEach((campo) => {
      if (datosActualizar[campo] === undefined) {
        delete datosActualizar[campo];
      }
    });

    await registro.update(datosActualizar);

    res.status(200).json({
      mensaje: 'Registro actualizado correctamente',
      equipaje_vuelo: registro,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: 'Error al actualizar el registro',
    });
  }
};

// Eliminar registro
const eliminarEquipajeVuelo = async (req, res) => {
  try {
    const { id } = req.params;

    const registro = await EquipajeVuelo.findByPk(id);

    if (!registro) {
      return res.status(404).json({
        mensaje: 'Registro de equipaje y vuelo no encontrado',
      });
    }

    await registro.destroy();

    res.status(200).json({
      mensaje: 'Registro eliminado correctamente',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: 'Error al eliminar el registro',
    });
  }
};

module.exports = {
  obtenerEquipajesVuelos,
  obtenerEquipajeVueloPorId,
  crearEquipajeVuelo,
  actualizarEquipajeVuelo,
  eliminarEquipajeVuelo,
};
