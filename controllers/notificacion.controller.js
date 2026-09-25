const Notificacion = require('../models/notificacion.model');
const Pasajero = require('../models/pasajero.model');
const Vuelo = require('../models/vuelo.model');
const Equipaje = require('../models/equipaje.model');

// Obtener todas las notificaciones
const obtenerNotificaciones = async (req, res) => {
  try {
    const notificaciones = await Notificacion.findAll({
      include: [
        {
          model: Pasajero,
          as: 'pasajero',
        },
        {
          model: Vuelo,
          as: 'vuelo',
        },
        {
          model: Equipaje,
          as: 'equipaje',
        },
      ],
      order: [['fecha_envio', 'DESC']],
    });

    res.status(200).json(notificaciones);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener las notificaciones',
      error: error.message,
    });
  }
};

// Obtener notificación por ID
const obtenerNotificacionPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const notificacion = await Notificacion.findByPk(id, {
      include: [
        { model: Pasajero, as: 'pasajero' },
        { model: Vuelo, as: 'vuelo' },
        { model: Equipaje, as: 'equipaje' },
      ],
    });

    if (!notificacion) {
      return res.status(404).json({
        mensaje: 'Notificación no encontrada',
      });
    }

    res.status(200).json(notificacion);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener la notificación',
      error: error.message,
    });
  }
};

// Crear notificación
const crearNotificacion = async (req, res) => {
  try {
    const {
      id_pasajero,
      id_vuelo,
      id_equipaje,
      tipo,
      titulo,
      mensaje,
    } = req.body;

    if (!id_pasajero || !tipo || !titulo || !mensaje) {
      return res.status(400).json({
        mensaje:
          'Pasajero, tipo, título y mensaje son obligatorios',
      });
    }

    const pasajero = await Pasajero.findByPk(id_pasajero);

    if (!pasajero) {
      return res.status(400).json({
        mensaje: 'El pasajero no existe',
      });
    }

    if (id_vuelo) {
      const vuelo = await Vuelo.findByPk(id_vuelo);

      if (!vuelo) {
        return res.status(400).json({
          mensaje: 'El vuelo no existe',
        });
      }
    }

    if (id_equipaje) {
      const equipaje = await Equipaje.findByPk(id_equipaje);

      if (!equipaje) {
        return res.status(400).json({
          mensaje: 'El equipaje no existe',
        });
      }
    }

    const nuevaNotificacion = await Notificacion.create({
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
      notificacion: nuevaNotificacion,
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al crear la notificación',
      error: error.message,
    });
  }
};

// Actualizar notificación
const actualizarNotificacion = async (req, res) => {
  try {
    const { id } = req.params;

    const notificacion = await Notificacion.findByPk(id);

    if (!notificacion) {
      return res.status(404).json({
        mensaje: 'Notificación no encontrada',
      });
    }

    const {
      tipo,
      titulo,
      mensaje,
      leida,
    } = req.body;

    const datosActualizar = {
      tipo,
      titulo,
      mensaje,
      leida,
    };

    // Si se marca como leída, registrar fecha de lectura
    if (leida === true && !notificacion.leida) {
      datosActualizar.fecha_lectura = new Date();
    }

    // Si vuelve a marcarse como no leída
    if (leida === false) {
      datosActualizar.fecha_lectura = null;
    }

    Object.keys(datosActualizar).forEach((campo) => {
      if (datosActualizar[campo] === undefined) {
        delete datosActualizar[campo];
      }
    });

    await notificacion.update(datosActualizar);

    res.status(200).json({
      mensaje: 'Notificación actualizada correctamente',
      notificacion,
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al actualizar la notificación',
      error: error.message,
    });
  }
};

// Eliminar notificación
const eliminarNotificacion = async (req, res) => {
  try {
    const { id } = req.params;

    const notificacion = await Notificacion.findByPk(id);

    if (!notificacion) {
      return res.status(404).json({
        mensaje: 'Notificación no encontrada',
      });
    }

    await notificacion.destroy();

    res.status(200).json({
      mensaje: 'Notificación eliminada correctamente',
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al eliminar la notificación',
      error: error.message,
    });
  }
};

module.exports = {
  obtenerNotificaciones,
  obtenerNotificacionPorId,
  crearNotificacion,
  actualizarNotificacion,
  eliminarNotificacion,
};
