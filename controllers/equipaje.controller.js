const Equipaje = require('../models/equipaje.model');
const Pasajero = require('../models/pasajero.model');
const Aeropuerto = require('../models/aeropuerto.model');
const BandaEquipaje = require('../models/banda_equipaje.model');

// Obtener todos los equipajes
const obtenerEquipajes = async (req, res) => {
  try {
    const equipajes = await Equipaje.findAll({
      include: [
        {
          model: Pasajero,
          as: 'pasajero',
        },
        {
          model: Aeropuerto,
          as: 'aeropuertoOrigen',
        },
        {
          model: Aeropuerto,
          as: 'aeropuertoDestino',
        },
        {
          model: BandaEquipaje,
          as: 'bandaActual',
        },
      ],
    });

    res.status(200).json(equipajes);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener los equipajes',
      error: error.message,
    });
  }
};

// Obtener equipaje por ID
const obtenerEquipajePorId = async (req, res) => {
  try {
    const { id } = req.params;

    const equipaje = await Equipaje.findByPk(id, {
      include: [
        { model: Pasajero, as: 'pasajero' },
        { model: Aeropuerto, as: 'aeropuertoOrigen' },
        { model: Aeropuerto, as: 'aeropuertoDestino' },
        { model: BandaEquipaje, as: 'bandaActual' },
      ],
    });

    if (!equipaje) {
      return res.status(404).json({
        mensaje: 'Equipaje no encontrado',
      });
    }

    res.status(200).json(equipaje);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener el equipaje',
      error: error.message,
    });
  }
};

// Crear equipaje
const crearEquipaje = async (req, res) => {
  try {
    const {
      codigo_equipaje,
      id_pasajero,
      peso,
      origen,
      destino_final,
      id_banda_actual,
      observaciones,
    } = req.body;

    if (!codigo_equipaje || !id_pasajero || !origen || !destino_final) {
      return res.status(400).json({
        mensaje:
          'Código de equipaje, pasajero, origen y destino final son obligatorios',
      });
    }

    if (peso !== undefined && peso !== null && peso < 0) {
      return res.status(400).json({
        mensaje: 'El peso del equipaje no puede ser negativo',
      });
    }

    const pasajero = await Pasajero.findByPk(id_pasajero);

    if (!pasajero) {
      return res.status(400).json({
        mensaje: 'El pasajero seleccionado no existe',
      });
    }

    const aeropuertoOrigen = await Aeropuerto.findByPk(origen);
    const aeropuertoDestino = await Aeropuerto.findByPk(destino_final);

    if (!aeropuertoOrigen || !aeropuertoDestino) {
      return res.status(400).json({
        mensaje: 'El aeropuerto de origen o destino no existe',
      });
    }

    if (origen === destino_final) {
      return res.status(400).json({
        mensaje: 'El origen y el destino final no pueden ser el mismo',
      });
    }

    if (id_banda_actual) {
      const banda = await BandaEquipaje.findByPk(id_banda_actual);

      if (!banda) {
        return res.status(400).json({
          mensaje: 'La banda de equipaje seleccionada no existe',
        });
      }
    }

    const nuevoEquipaje = await Equipaje.create({
      codigo_equipaje,
      id_pasajero,
      peso,
      origen,
      destino_final,
      id_banda_actual,
      estado: 'REGISTRADO',
      observaciones,
    });

    res.status(201).json({
      mensaje: 'Equipaje registrado correctamente',
      equipaje: nuevoEquipaje,
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al registrar el equipaje',
      error: error.message,
    });
  }
};

// Actualizar equipaje
const actualizarEquipaje = async (req, res) => {
  try {
    const { id } = req.params;

    const equipaje = await Equipaje.findByPk(id);

    if (!equipaje) {
      return res.status(404).json({
        mensaje: 'Equipaje no encontrado',
      });
    }

    const {
      peso,
      id_banda_actual,
      estado,
      observaciones,
    } = req.body;

    if (peso !== undefined && peso !== null && peso < 0) {
      return res.status(400).json({
        mensaje: 'El peso del equipaje no puede ser negativo',
      });
    }

    if (id_banda_actual) {
      const banda = await BandaEquipaje.findByPk(id_banda_actual);

      if (!banda) {
        return res.status(400).json({
          mensaje: 'La banda de equipaje seleccionada no existe',
        });
      }
    }

    const datosActualizar = {
      peso,
      id_banda_actual,
      estado,
      observaciones,
    };

    Object.keys(datosActualizar).forEach((campo) => {
      if (datosActualizar[campo] === undefined) {
        delete datosActualizar[campo];
      }
    });

    await equipaje.update(datosActualizar);

    res.status(200).json({
      mensaje: 'Equipaje actualizado correctamente',
      equipaje,
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al actualizar el equipaje',
      error: error.message,
    });
  }
};

// Eliminar equipaje
const eliminarEquipaje = async (req, res) => {
  try {
    const { id } = req.params;

    const equipaje = await Equipaje.findByPk(id);

    if (!equipaje) {
      return res.status(404).json({
        mensaje: 'Equipaje no encontrado',
      });
    }

    await equipaje.destroy();

    res.status(200).json({
      mensaje: 'Equipaje eliminado correctamente',
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al eliminar el equipaje',
      error: error.message,
    });
  }
};

module.exports = {
  obtenerEquipajes,
  obtenerEquipajePorId,
  crearEquipaje,
  actualizarEquipaje,
  eliminarEquipaje,
};
