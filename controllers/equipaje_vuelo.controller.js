const EquipajeVuelo = require('../models/equipaje_vuelo.model');
const Equipaje = require('../models/equipaje.model');
const Vuelo = require('../models/vuelo.model');
const BandaEquipaje = require('../models/banda_equipaje.model');
const Usuario = require('../models/usuario.model');

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
    res.status(500).json({
      mensaje: 'Error al obtener los equipajes de los vuelos',
      error: error.message,
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
    res.status(500).json({
      mensaje: 'Error al obtener el registro',
      error: error.message,
    });
  }
};

// Registrar equipaje en un vuelo
const crearEquipajeVuelo = async (req, res) => {
  try {
    const {
      id_equipaje,
      id_vuelo,
      id_banda_origen,
      id_banda_destino,
      orden_vuelo,
      registrado_por,
    } = req.body;

    if (!id_equipaje || !id_vuelo) {
      return res.status(400).json({
        mensaje: 'El equipaje y el vuelo son obligatorios',
      });
    }

    const equipaje = await Equipaje.findByPk(id_equipaje);

    if (!equipaje) {
      return res.status(400).json({
        mensaje: 'El equipaje seleccionado no existe',
      });
    }

    const vuelo = await Vuelo.findByPk(id_vuelo);

    if (!vuelo) {
      return res.status(400).json({
        mensaje: 'El vuelo seleccionado no existe',
      });
    }

    if (id_banda_origen) {
      const bandaOrigen = await BandaEquipaje.findByPk(id_banda_origen);

      if (!bandaOrigen) {
        return res.status(400).json({
          mensaje: 'La banda de origen no existe',
        });
      }
    }

    if (id_banda_destino) {
      const bandaDestino = await BandaEquipaje.findByPk(id_banda_destino);

      if (!bandaDestino) {
        return res.status(400).json({
          mensaje: 'La banda de destino no existe',
        });
      }
    }

    if (registrado_por) {
      const usuario = await Usuario.findByPk(registrado_por);

      if (!usuario) {
        return res.status(400).json({
          mensaje: 'El usuario que realiza el registro no existe',
        });
      }
    }

    if (orden_vuelo !== undefined && orden_vuelo < 1) {
      return res.status(400).json({
        mensaje: 'El orden del vuelo debe ser mayor o igual a 1',
      });
    }

    // Evitar registrar dos veces el mismo equipaje en el mismo vuelo
    const existente = await EquipajeVuelo.findOne({
      where: {
        id_equipaje,
        id_vuelo,
      },
    });

    if (existente) {
      return res.status(409).json({
        mensaje: 'El equipaje ya está registrado en este vuelo',
      });
    }

    const nuevoRegistro = await EquipajeVuelo.create({
      id_equipaje,
      id_vuelo,
      id_banda_origen,
      id_banda_destino,
      orden_vuelo,
      estado: 'REGISTRADO',
      registrado_por,
    });

    res.status(201).json({
      mensaje: 'Equipaje asignado al vuelo correctamente',
      equipaje_vuelo: nuevoRegistro,
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al asignar el equipaje al vuelo',
      error: error.message,
    });
  }
};

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
    res.status(500).json({
      mensaje: 'Error al actualizar el registro',
      error: error.message,
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
    res.status(500).json({
      mensaje: 'Error al eliminar el registro',
      error: error.message,
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
