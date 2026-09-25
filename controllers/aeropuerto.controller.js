const Aeropuerto = require('../models/aeropuerto.model');

// Obtener todos los aeropuertos
const obtenerAeropuertos = async (req, res) => {
  try {
    const aeropuertos = await Aeropuerto.findAll();

    res.status(200).json(aeropuertos);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener los aeropuertos',
      error: error.message,
    });
  }
};

// Obtener aeropuerto por ID
const obtenerAeropuertoPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const aeropuerto = await Aeropuerto.findByPk(id);

    if (!aeropuerto) {
      return res.status(404).json({
        mensaje: 'Aeropuerto no encontrado',
      });
    }

    res.status(200).json(aeropuerto);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener el aeropuerto',
      error: error.message,
    });
  }
};

// Crear aeropuerto
const crearAeropuerto = async (req, res) => {
  try {
    const {
      codigo_iata,
      nombre,
      ciudad,
      pais,
      estado,
    } = req.body;

    if (!codigo_iata || !nombre || !ciudad || !pais) {
      return res.status(400).json({
        mensaje:
          'Código IATA, nombre, ciudad y país son obligatorios',
      });
    }

    // El código IATA debe tener exactamente 3 caracteres
    if (codigo_iata.length !== 3) {
      return res.status(400).json({
        mensaje: 'El código IATA debe tener exactamente 3 caracteres',
      });
    }

    const nuevoAeropuerto = await Aeropuerto.create({
      codigo_iata: codigo_iata.toUpperCase(),
      nombre,
      ciudad,
      pais,
      estado,
    });

    res.status(201).json({
      mensaje: 'Aeropuerto creado correctamente',
      aeropuerto: nuevoAeropuerto,
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al crear el aeropuerto',
      error: error.message,
    });
  }
};

// Actualizar aeropuerto
const actualizarAeropuerto = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      codigo_iata,
      nombre,
      ciudad,
      pais,
      estado,
    } = req.body;

    const aeropuerto = await Aeropuerto.findByPk(id);

    if (!aeropuerto) {
      return res.status(404).json({
        mensaje: 'Aeropuerto no encontrado',
      });
    }

    if (codigo_iata && codigo_iata.length !== 3) {
      return res.status(400).json({
        mensaje: 'El código IATA debe tener exactamente 3 caracteres',
      });
    }

    const datosActualizar = {
      codigo_iata: codigo_iata
        ? codigo_iata.toUpperCase()
        : undefined,
      nombre,
      ciudad,
      pais,
      estado,
    };

    // Evitar reemplazar datos existentes con undefined
    Object.keys(datosActualizar).forEach((campo) => {
      if (datosActualizar[campo] === undefined) {
        delete datosActualizar[campo];
      }
    });

    await aeropuerto.update(datosActualizar);

    res.status(200).json({
      mensaje: 'Aeropuerto actualizado correctamente',
      aeropuerto,
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al actualizar el aeropuerto',
      error: error.message,
    });
  }
};

// Eliminar aeropuerto
const eliminarAeropuerto = async (req, res) => {
  try {
    const { id } = req.params;

    const aeropuerto = await Aeropuerto.findByPk(id);

    if (!aeropuerto) {
      return res.status(404).json({
        mensaje: 'Aeropuerto no encontrado',
      });
    }

    await aeropuerto.destroy();

    res.status(200).json({
      mensaje: 'Aeropuerto eliminado correctamente',
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al eliminar el aeropuerto',
      error: error.message,
    });
  }
};

module.exports = {
  obtenerAeropuertos,
  obtenerAeropuertoPorId,
  crearAeropuerto,
  actualizarAeropuerto,
  eliminarAeropuerto,
};