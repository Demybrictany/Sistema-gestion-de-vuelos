const HistorialVuelo = require('../models/historial_vuelo.model');
const Vuelo = require('../models/vuelo.model');
const Usuario = require('../models/usuario.model');

// Obtener todo el historial
const obtenerHistorialVuelos = async (req, res) => {
  try {
    const historial = await HistorialVuelo.findAll({
      include: [
        {
          model: Vuelo,
          as: 'vuelo',
        },
        {
          model: Usuario,
          as: 'usuarioModificacion',
          attributes: {
            exclude: ['password_hash'],
          },
        },
      ],
      order: [['fecha_modificacion', 'DESC']],
    });

    res.status(200).json(historial);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener el historial de vuelos',
      error: error.message,
    });
  }
};

// Obtener historial por ID
const obtenerHistorialVueloPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const historial = await HistorialVuelo.findByPk(id, {
      include: [
        {
          model: Vuelo,
          as: 'vuelo',
        },
        {
          model: Usuario,
          as: 'usuarioModificacion',
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
      mensaje: 'Error al obtener el historial del vuelo',
      error: error.message,
    });
  }
};

// Obtener historial de un vuelo específico
const obtenerHistorialPorVuelo = async (req, res) => {
  try {
    const { idVuelo } = req.params;

    const historial = await HistorialVuelo.findAll({
      where: {
        id_vuelo: idVuelo,
      },
      include: [
        {
          model: Usuario,
          as: 'usuarioModificacion',
          attributes: {
            exclude: ['password_hash'],
          },
        },
      ],
      order: [['fecha_modificacion', 'DESC']],
    });

    res.status(200).json(historial);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener el historial del vuelo',
      error: error.message,
    });
  }
};

// Crear registro de historial
const crearHistorialVuelo = async (req, res) => {
  try {
    const {
      id_vuelo,
      campo_modificado,
      valor_anterior,
      valor_nuevo,
      motivo,
      modificado_por,
    } = req.body;

    if (!id_vuelo || !campo_modificado) {
      return res.status(400).json({
        mensaje: 'El vuelo y el campo modificado son obligatorios',
      });
    }

    const vuelo = await Vuelo.findByPk(id_vuelo);

    if (!vuelo) {
      return res.status(400).json({
        mensaje: 'El vuelo no existe',
      });
    }

    if (modificado_por) {
      const usuario = await Usuario.findByPk(modificado_por);

      if (!usuario) {
        return res.status(400).json({
          mensaje: 'El usuario que realizó la modificación no existe',
        });
      }
    }

    const nuevoHistorial = await HistorialVuelo.create({
      id_vuelo,
      campo_modificado,
      valor_anterior,
      valor_nuevo,
      motivo,
      modificado_por,
    });

    res.status(201).json({
      mensaje: 'Cambio del vuelo registrado correctamente',
      historial: nuevoHistorial,
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al registrar el historial del vuelo',
      error: error.message,
    });
  }
};

// Eliminar registro
const eliminarHistorialVuelo = async (req, res) => {
  try {
    const { id } = req.params;

    const historial = await HistorialVuelo.findByPk(id);

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
      mensaje: 'Error al eliminar el historial del vuelo',
      error: error.message,
    });
  }
};

module.exports = {
  obtenerHistorialVuelos,
  obtenerHistorialVueloPorId,
  obtenerHistorialPorVuelo,
  crearHistorialVuelo,
  eliminarHistorialVuelo,
};
