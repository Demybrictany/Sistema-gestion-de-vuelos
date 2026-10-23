const Escala = require('../models/escala.model');
const Itinerario = require('../models/itinerario.model');
const Vuelo = require('../models/vuelo.model');
const Aeropuerto = require('../models/aeropuerto.model');
const Puerta = require('../models/puerta.model');

// Obtener todas las escalas
const obtenerEscalas = async (req, res) => {
  try {
    const escalas = await Escala.findAll({
      include: [
        {
          model: Itinerario,
          as: 'itinerario',
        },
        {
          model: Vuelo,
          as: 'vuelo',
        },
        {
          model: Aeropuerto,
          as: 'aeropuertoLlegada',
        },
        {
          model: Aeropuerto,
          as: 'aeropuertoSalida',
        },
        {
          model: Puerta,
          as: 'puertaLlegada',
        },
        {
          model: Puerta,
          as: 'puertaSalida',
        },
      ],
    });

    res.status(200).json(escalas);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener las escalas',
      error: error.message,
    });
  }
};

// Obtener escala por ID
const obtenerEscalaPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const escala = await Escala.findByPk(id, {
      include: [
        { model: Itinerario, as: 'itinerario' },
        { model: Vuelo, as: 'vuelo' },
        { model: Aeropuerto, as: 'aeropuertoLlegada' },
        { model: Aeropuerto, as: 'aeropuertoSalida' },
        { model: Puerta, as: 'puertaLlegada' },
        { model: Puerta, as: 'puertaSalida' },
      ],
    });

    if (!escala) {
      return res.status(404).json({
        mensaje: 'Escala no encontrada',
      });
    }

    res.status(200).json(escala);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener la escala',
      error: error.message,
    });
  }
};

// Crear escala
const crearEscala = async (req, res) => {
  try {
    const {
      id_itinerario,
      id_vuelo,
      numero_escala,
      aeropuerto_llegada,
      aeropuerto_salida,
      hora_llegada,
      hora_salida,
      id_puerta_llegada,
      id_puerta_salida,
    } = req.body;

    if (
      !id_itinerario ||
      !id_vuelo ||
      !numero_escala ||
      !aeropuerto_llegada ||
      !aeropuerto_salida ||
      !hora_llegada
    ) {
      return res.status(400).json({
        mensaje: 'Faltan datos obligatorios de la escala',
      });
    }

    const itinerario = await Itinerario.findByPk(id_itinerario);

    if (!itinerario) {
      return res.status(400).json({
        mensaje: 'El itinerario no existe',
      });
    }

    const vuelo = await Vuelo.findByPk(id_vuelo);

    if (!vuelo) {
      return res.status(400).json({
        mensaje: 'El vuelo no existe',
      });
    }

    const aeropuertoLlegada =
      await Aeropuerto.findByPk(aeropuerto_llegada);

    const aeropuertoSalida =
      await Aeropuerto.findByPk(aeropuerto_salida);

    if (!aeropuertoLlegada || !aeropuertoSalida) {
      return res.status(400).json({
        mensaje: 'El aeropuerto de llegada o salida no existe',
      });
    }

    // Verificar puerta de llegada
    if (id_puerta_llegada) {
      const puertaLlegada =
        await Puerta.findByPk(id_puerta_llegada);

      if (!puertaLlegada) {
        return res.status(400).json({
          mensaje: 'La puerta de llegada no existe',
        });
      }
    }

    // Verificar puerta de salida
    if (id_puerta_salida) {
      const puertaSalida =
        await Puerta.findByPk(id_puerta_salida);

      if (!puertaSalida) {
        return res.status(400).json({
          mensaje: 'La puerta de salida no existe',
        });
      }
    }

    if (
      hora_salida &&
      new Date(hora_salida) <= new Date(hora_llegada)
    ) {
      return res.status(400).json({
        mensaje:
          'La hora de salida de la escala debe ser posterior a la llegada',
      });
    }

    // Evitar repetir el número de escala dentro del itinerario
    const escalaExistente = await Escala.findOne({
      where: {
        id_itinerario,
        numero_escala,
      },
    });

    if (escalaExistente) {
      return res.status(409).json({
        mensaje:
          'Ya existe este número de escala dentro del itinerario',
      });
    }

    const nuevaEscala = await Escala.create({
      id_itinerario,
      id_vuelo,
      numero_escala,
      aeropuerto_llegada,
      aeropuerto_salida,
      hora_llegada,
      hora_salida,
      id_puerta_llegada,
      id_puerta_salida,
      estado: 'PENDIENTE',
    });

    res.status(201).json({
      mensaje: 'Escala creada correctamente',
      escala: nuevaEscala,
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al crear la escala',
      error: error.message,
    });
  }
};

// Actualizar escala
const actualizarEscala = async (req, res) => {
  try {
    const { id } = req.params;

    const escala = await Escala.findByPk(id);

    if (!escala) {
      return res.status(404).json({
        mensaje: 'Escala no encontrada',
      });
    }

    const datosActualizar = { ...req.body };

    Object.keys(datosActualizar).forEach((campo) => {
      if (datosActualizar[campo] === undefined) {
        delete datosActualizar[campo];
      }
    });

    await escala.update(datosActualizar);

    res.status(200).json({
      mensaje: 'Escala actualizada correctamente',
      escala,
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al actualizar la escala',
      error: error.message,
    });
  }
};

// Eliminar escala
const eliminarEscala = async (req, res) => {
  try {
    const { id } = req.params;

    const escala = await Escala.findByPk(id);

    if (!escala) {
      return res.status(404).json({
        mensaje: 'Escala no encontrada',
      });
    }

    await escala.destroy();

    res.status(200).json({
      mensaje: 'Escala eliminada correctamente',
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al eliminar la escala',
      error: error.message,
    });
  }
};

module.exports = {
  obtenerEscalas,
  obtenerEscalaPorId,
  crearEscala,
  actualizarEscala,
  eliminarEscala,
};
