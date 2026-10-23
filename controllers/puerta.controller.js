
const Puerta = require('../models/puerta.model');

// Obtener todas las puertas
const obtenerPuertas = async (req, res) => {
  try {
    const puertas = await Puerta.findAll();

    res.status(200).json(puertas);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener las puertas',
      error: error.message,
    });
  }
};

// Obtener puerta por ID
const obtenerPuertaPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const puerta = await Puerta.findByPk(id);

    if (!puerta) {
      return res.status(404).json({
        mensaje: 'Puerta no encontrada',
      });
    }

    res.status(200).json(puerta);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener la puerta',
      error: error.message,
    });
  }
};

// Crear puerta
const crearPuerta = async (req, res) => {
  try {
    const { numero, zona, estado } = req.body;

    if (!numero) {
      return res.status(400).json({
        mensaje: 'El número de la puerta es obligatorio',
      });
    }

    const nuevaPuerta = await Puerta.create({
      numero,
      zona,
      estado,
    });

    res.status(201).json({
      mensaje: 'Puerta creada correctamente',
      puerta: nuevaPuerta,
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al crear la puerta',
      error: error.message,
    });
  }
};

// Actualizar puerta
const actualizarPuerta = async (req, res) => {
  try {
    const { id } = req.params;
    const { numero, zona, estado } = req.body;

    const puerta = await Puerta.findByPk(id);

    if (!puerta) {
      return res.status(404).json({
        mensaje: 'Puerta no encontrada',
      });
    }

    const datosActualizar = {
      numero,
      zona,
      estado,
    };

    // Evitar reemplazar datos existentes con undefined
    Object.keys(datosActualizar).forEach((campo) => {
      if (datosActualizar[campo] === undefined) {
        delete datosActualizar[campo];
      }
    });

    await puerta.update(datosActualizar);

    res.status(200).json({
      mensaje: 'Puerta actualizada correctamente',
      puerta,
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al actualizar la puerta',
      error: error.message,
    });
  }
};

// Eliminar puerta
const eliminarPuerta = async (req, res) => {
  try {
    const { id } = req.params;

    const puerta = await Puerta.findByPk(id);

    if (!puerta) {
      return res.status(404).json({
        mensaje: 'Puerta no encontrada',
      });
    }

    await puerta.destroy();

    res.status(200).json({
      mensaje: 'Puerta eliminada correctamente',
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al eliminar la puerta',
      error: error.message,
    });
  }
};

module.exports = {
  obtenerPuertas,
  obtenerPuertaPorId,
  crearPuerta,
  actualizarPuerta,
  eliminarPuerta,
};