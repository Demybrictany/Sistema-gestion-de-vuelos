const BandaEquipaje = require('../models/banda_equipaje.model');

// Obtener todas las bandas
const obtenerBandas = async (req, res) => {
  try {
    const bandas = await BandaEquipaje.findAll();

    res.status(200).json(bandas);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener las bandas de equipaje',
      error: error.message,
    });
  }
};

// Obtener banda por ID
const obtenerBandaPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const banda = await BandaEquipaje.findByPk(id);

    if (!banda) {
      return res.status(404).json({
        mensaje: 'Banda de equipaje no encontrada',
      });
    }

    res.status(200).json(banda);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener la banda de equipaje',
      error: error.message,
    });
  }
};

// Crear banda
const crearBanda = async (req, res) => {
  try {
    const { numero, zona, estado } = req.body;

    if (!numero) {
      return res.status(400).json({
        mensaje: 'El número de la banda es obligatorio',
      });
    }

    const nuevaBanda = await BandaEquipaje.create({
      numero,
      zona,
      estado,
    });

    res.status(201).json({
      mensaje: 'Banda de equipaje creada correctamente',
      banda: nuevaBanda,
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al crear la banda de equipaje',
      error: error.message,
    });
  }
};

// Actualizar banda
const actualizarBanda = async (req, res) => {
  try {
    const { id } = req.params;
    const { numero, zona, estado } = req.body;

    const banda = await BandaEquipaje.findByPk(id);

    if (!banda) {
      return res.status(404).json({
        mensaje: 'Banda de equipaje no encontrada',
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

    await banda.update(datosActualizar);

    res.status(200).json({
      mensaje: 'Banda de equipaje actualizada correctamente',
      banda,
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al actualizar la banda de equipaje',
      error: error.message,
    });
  }
};

// Eliminar banda
const eliminarBanda = async (req, res) => {
  try {
    const { id } = req.params;

    const banda = await BandaEquipaje.findByPk(id);

    if (!banda) {
      return res.status(404).json({
        mensaje: 'Banda de equipaje no encontrada',
      });
    }

    await banda.destroy();

    res.status(200).json({
      mensaje: 'Banda de equipaje eliminada correctamente',
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al eliminar la banda de equipaje',
      error: error.message,
    });
  }
};

module.exports = {
  obtenerBandas,
  obtenerBandaPorId,
  crearBanda,
  actualizarBanda,
  eliminarBanda,
};