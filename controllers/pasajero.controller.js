const Pasajero = require('../models/pasajero.model');

// Obtener todos los pasajeros
const obtenerPasajeros = async (req, res) => {
  try {
    const pasajeros = await Pasajero.findAll();

    res.status(200).json(pasajeros);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener los pasajeros',
      error: error.message,
    });
  }
};

// Obtener pasajero por ID
const obtenerPasajeroPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const pasajero = await Pasajero.findByPk(id);

    if (!pasajero) {
      return res.status(404).json({
        mensaje: 'Pasajero no encontrado',
      });
    }

    res.status(200).json(pasajero);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener el pasajero',
      error: error.message,
    });
  }
};

// Crear pasajero
const crearPasajero = async (req, res) => {
  try {
    const {
      nombres,
      apellidos,
      fecha_nacimiento,
      nacionalidad,
      pasaporte,
      correo,
      telefono,
      estado,
    } = req.body;

    if (!nombres || !apellidos) {
      return res.status(400).json({
        mensaje: 'Los nombres y apellidos son obligatorios',
      });
    }

    const nuevoPasajero = await Pasajero.create({
      nombres,
      apellidos,
      fecha_nacimiento,
      nacionalidad,
      pasaporte,
      correo,
      telefono,
      estado,
    });

    res.status(201).json({
      mensaje: 'Pasajero creado correctamente',
      pasajero: nuevoPasajero,
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al crear el pasajero',
      error: error.message,
    });
  }
};

// Actualizar pasajero
const actualizarPasajero = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      nombres,
      apellidos,
      fecha_nacimiento,
      nacionalidad,
      pasaporte,
      correo,
      telefono,
      estado,
    } = req.body;

    const pasajero = await Pasajero.findByPk(id);

    if (!pasajero) {
      return res.status(404).json({
        mensaje: 'Pasajero no encontrado',
      });
    }

    const datosActualizar = {
      nombres,
      apellidos,
      fecha_nacimiento,
      nacionalidad,
      pasaporte,
      correo,
      telefono,
      estado,
    };

    // Evitar reemplazar datos existentes con undefined
    Object.keys(datosActualizar).forEach((campo) => {
      if (datosActualizar[campo] === undefined) {
        delete datosActualizar[campo];
      }
    });

    await pasajero.update(datosActualizar);

    res.status(200).json({
      mensaje: 'Pasajero actualizado correctamente',
      pasajero,
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al actualizar el pasajero',
      error: error.message,
    });
  }
};

// Eliminar pasajero
const eliminarPasajero = async (req, res) => {
  try {
    const { id } = req.params;

    const pasajero = await Pasajero.findByPk(id);

    if (!pasajero) {
      return res.status(404).json({
        mensaje: 'Pasajero no encontrado',
      });
    }

    await pasajero.destroy();

    res.status(200).json({
      mensaje: 'Pasajero eliminado correctamente',
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al eliminar el pasajero',
      error: error.message,
    });
  }
};

module.exports = {
  obtenerPasajeros,
  obtenerPasajeroPorId,
  crearPasajero,
  actualizarPasajero,
  eliminarPasajero,
};
