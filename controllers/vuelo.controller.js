const { Op } = require('sequelize');

const Vuelo = require('../models/vuelo.model');
const Aeropuerto = require('../models/aeropuerto.model');
const Puerta = require('../models/puerta.model');


// Obtener todos los vuelos
const obtenerVuelos = async (req, res) => {
  try {
    const vuelos = await Vuelo.findAll({
      include: [
        {
          model: Aeropuerto,
          as: 'aeropuerto_origen',
        },
        {
          model: Aeropuerto,
          as: 'aeropuerto_destino',
        },
        {
          model: Puerta,
          as: 'puerta',
        },
      ],
    });

    res.status(200).json(vuelos);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener los vuelos',
      error: error.message,
    });
  }
};


// Obtener vuelo por ID
const obtenerVueloPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const vuelo = await Vuelo.findByPk(id, {
      include: [
        {
          model: Aeropuerto,
          as: 'aeropuerto_origen',
        },
        {
          model: Aeropuerto,
          as: 'aeropuerto_destino',
        },
        {
          model: Puerta,
          as: 'puerta',
        },
      ],
    });

    if (!vuelo) {
      return res.status(404).json({
        mensaje: 'Vuelo no encontrado',
      });
    }

    res.status(200).json(vuelo);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener el vuelo',
      error: error.message,
    });
  }
};


// Crear vuelo
const crearVuelo = async (req, res) => {
  try {
    const {
      codigo_vuelo,
      id_aeropuerto_origen,
      id_aeropuerto_destino,
      fecha_salida,
      hora_salida,
      fecha_llegada,
      hora_llegada,
      id_puerta,
      capacidad_pasajeros,
      observaciones,
    } = req.body;

    if (
      !codigo_vuelo ||
      !id_aeropuerto_origen ||
      !id_aeropuerto_destino ||
      !fecha_salida ||
      !hora_salida ||
      !fecha_llegada ||
      !hora_llegada
    ) {
      return res.status(400).json({
        mensaje: 'Faltan datos obligatorios del vuelo',
      });
    }

    if (id_aeropuerto_origen === id_aeropuerto_destino) {
      return res.status(400).json({
        mensaje: 'El aeropuerto de origen y destino no pueden ser el mismo',
      });
    }

    const origen = await Aeropuerto.findByPk(id_aeropuerto_origen);
    const destino = await Aeropuerto.findByPk(id_aeropuerto_destino);

    if (!origen || !destino) {
      return res.status(400).json({
        mensaje: 'El aeropuerto de origen o destino no existe',
      });
    }

    const salida = new Date(`${fecha_salida}T${hora_salida}`);
    const llegada = new Date(`${fecha_llegada}T${hora_llegada}`);

    if (llegada <= salida) {
      return res.status(400).json({
        mensaje: 'La fecha y hora de llegada deben ser posteriores a la salida',
      });
    }

    if (capacidad_pasajeros !== undefined && capacidad_pasajeros < 0) {
      return res.status(400).json({
        mensaje: 'La capacidad de pasajeros no puede ser negativa',
      });
    }

    if (id_puerta) {
      const puerta = await Puerta.findByPk(id_puerta);

      if (!puerta) {
        return res.status(400).json({
          mensaje: 'La puerta seleccionada no existe',
        });
      }

      if (puerta.estado !== 'DISPONIBLE') {
        return res.status(400).json({
          mensaje: 'La puerta seleccionada no está disponible',
        });
      }

      const conflicto = await Vuelo.findOne({
        where: {
          id_puerta,
          estado: {
            [Op.ne]: 'CANCELADO',
          },
          [Op.and]: [
            sequelizeWhereFechaHoraMenor(fecha_llegada, hora_llegada),
            sequelizeWhereFechaHoraMayor(fecha_salida, hora_salida),
          ],
        },
      });

      if (conflicto) {
        return res.status(409).json({
          mensaje: 'La puerta ya está asignada a otro vuelo en ese horario',
        });
      }
    }

    const nuevoVuelo = await Vuelo.create({
      codigo_vuelo,
      id_aeropuerto_origen,
      id_aeropuerto_destino,
      fecha_salida,
      hora_salida,
      fecha_llegada,
      hora_llegada,
      id_puerta,
      estado: 'PROGRAMADO',
      capacidad_pasajeros,
      observaciones,
    });

    res.status(201).json({
      mensaje: 'Vuelo creado correctamente',
      vuelo: nuevoVuelo,
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al crear el vuelo',
      error: error.message,
    });
  }
};


// Funciones para comprobar traslapes de horarios
const sequelizeWhereFechaHoraMenor = (fechaLlegada, horaLlegada) => ({
  [Op.or]: [
    {
      fecha_salida: {
        [Op.lt]: fechaLlegada,
      },
    },
    {
      fecha_salida: fechaLlegada,
      hora_salida: {
        [Op.lt]: horaLlegada,
      },
    },
  ],
});

const sequelizeWhereFechaHoraMayor = (fechaSalida, horaSalida) => ({
  [Op.or]: [
    {
      fecha_llegada: {
        [Op.gt]: fechaSalida,
      },
    },
    {
      fecha_llegada: fechaSalida,
      hora_llegada: {
        [Op.gt]: horaSalida,
      },
    },
  ],
});


// Actualizar vuelo
const actualizarVuelo = async (req, res) => {
  try {
    const { id } = req.params;

    const vuelo = await Vuelo.findByPk(id);

    if (!vuelo) {
      return res.status(404).json({
        mensaje: 'Vuelo no encontrado',
      });
    }

    const datosActualizar = { ...req.body };

    // Todos los vuelos se crean PROGRAMADOS.
    // Después sí pueden cambiar de estado.
    if (datosActualizar.capacidad_pasajeros < 0) {
      return res.status(400).json({
        mensaje: 'La capacidad de pasajeros no puede ser negativa',
      });
    }

    await vuelo.update(datosActualizar);

    res.status(200).json({
      mensaje: 'Vuelo actualizado correctamente',
      vuelo,
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al actualizar el vuelo',
      error: error.message,
    });
  }
};


// Eliminar vuelo
const eliminarVuelo = async (req, res) => {
  try {
    const { id } = req.params;

    const vuelo = await Vuelo.findByPk(id);

    if (!vuelo) {
      return res.status(404).json({
        mensaje: 'Vuelo no encontrado',
      });
    }

    await vuelo.destroy();

    res.status(200).json({
      mensaje: 'Vuelo eliminado correctamente',
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al eliminar el vuelo',
      error: error.message,
    });
  }
};


module.exports = {
  obtenerVuelos,
  obtenerVueloPorId,
  crearVuelo,
  actualizarVuelo,
  eliminarVuelo,
};
