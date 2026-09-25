const HistorialEquipaje = require('../models/historial_equipaje.model');
const Equipaje = require('../models/equipaje.model');
const BandaEquipaje = require('../models/banda_equipaje.model');
const Vuelo = require('../models/vuelo.model');
const Usuario = require('../models/usuario.model');

// Obtener todo el historial
const obtenerHistorialEquipajes = async (req, res) => {
  try {
    const historial = await HistorialEquipaje.findAll({
      include: [
        {
          model: Equipaje,
          as: 'equipaje',
        },
        {
          model: BandaEquipaje,
          as: 'banda',
        },
        {
          model: Vuelo,
          as: 'vuelo',
        },
        {
          model: Usuario,
          as: 'usuarioRegistro',
          attributes: {
            exclude: ['password_hash'],
          },
        },
      ],
      order: [['fecha_registro', 'DESC']],
    });

    res.status(200).json(historial);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener el historial de equipajes',
      error: error.message,
    });
  }
};

// Obtener registro por ID
const obtenerHistorialEquipajePorId = async (req, res) => {
  try {
    const { id } = req.params;

    const historial = await HistorialEquipaje.findByPk(id, {
      include: [
        { model: Equipaje, as: 'equipaje' },
        { model: BandaEquipaje, as: 'banda' },
        { model: Vuelo, as: 'vuelo' },
        {
          model: Usuario,
          as: 'usuarioRegistro',
          attributes: {
            exclude: ['password_hash'],
          },
        },
      ],
    });

    if (!historial) {
      return res.status(404).json({
        mensaje: 'Registro de historial no encontrado',
      });
    }

    res.status(200).json(historial);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener el historial del equipaje',
      error: error.message,
    });
  }
};

// Obtener historial de un equipaje específico
const obtenerHistorialPorEquipaje = async (req, res) => {
  try {
    const { idEquipaje } = req.params;

    const historial = await HistorialEquipaje.findAll({
      where: {
        id_equipaje: idEquipaje,
      },
      include: [
        {
          model: BandaEquipaje,
          as: 'banda',
        },
        {
          model: Vuelo,
          as: 'vuelo',
        },
        {
          model: Usuario,
          as: 'usuarioRegistro',
          attributes: {
            exclude: ['password_hash'],
          },
        },
      ],
      order: [['fecha_registro', 'DESC']],
    });

    res.status(200).json(historial);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener el historial del equipaje',
      error: error.message,
    });
  }
};

// Crear registro de historial
const crearHistorialEquipaje = async (req, res) => {
  try {
    const {
      id_equipaje,
      ubicacion,
      id_banda,
      id_vuelo,
      estado_anterior,
      estado_nuevo,
      observaciones,
      registrado_por,
    } = req.body;

    if (!id_equipaje) {
      return res.status(400).json({
        mensaje: 'El equipaje es obligatorio',
      });
    }

    const equipaje = await Equipaje.findByPk(id_equipaje);

    if (!equipaje) {
      return res.status(400).json({
        mensaje: 'El equipaje no existe',
      });
    }

    if (id_banda) {
      const banda = await BandaEquipaje.findByPk(id_banda);

      if (!banda) {
        return res.status(400).json({
          mensaje: 'La banda de equipaje no existe',
        });
      }
    }

    if (id_vuelo) {
      const vuelo = await Vuelo.findByPk(id_vuelo);

      if (!vuelo) {
        return res.status(400).json({
          mensaje: 'El vuelo no existe',
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

    const nuevoHistorial = await HistorialEquipaje.create({
      id_equipaje,
      ubicacion,
      id_banda,
      id_vuelo,
      estado_anterior,
      estado_nuevo,
      observaciones,
      registrado_por,
    });

    res.status(201).json({
      mensaje: 'Movimiento del equipaje registrado correctamente',
      historial: nuevoHistorial,
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al registrar el historial del equipaje',
      error: error.message,
    });
  }
};

// Eliminar registro
const eliminarHistorialEquipaje = async (req, res) => {
  try {
    const { id } = req.params;

    const historial = await HistorialEquipaje.findByPk(id);

    if (!historial) {
      return res.status(404).json({
        mensaje: 'Registro de historial no encontrado',
      });
    }

    await historial.destroy();

    res.status(200).json({
      mensaje: 'Registro de historial eliminado correctamente',
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al eliminar el historial del equipaje',
      error: error.message,
    });
  }
};

module.exports = {
  obtenerHistorialEquipajes,
  obtenerHistorialEquipajePorId,
  obtenerHistorialPorEquipaje,
  crearHistorialEquipaje,
  eliminarHistorialEquipaje,
};
