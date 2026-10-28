const PasajeroVuelo = require('../models/pasajero_vuelo.model');
const Pasajero = require('../models/pasajero.model');
const Vuelo = require('../models/vuelo.model');
const Itinerario = require('../models/itinerario.model');
const Usuario = require('../models/usuario.model');

// Obtener todos los registros
const obtenerPasajerosVuelos = async (req, res) => {
  try {
    const registros = await PasajeroVuelo.findAll({
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
          model: Itinerario,
          as: 'itinerario',
        },
        {
          model: Usuario,
          as: 'usuario_registro',
          attributes: {
            exclude: ['password_hash'],
          },
        },
      ],
    });

    res.status(200).json(registros);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: 'Error al obtener los pasajeros de los vuelos',
    });
  }
};

// Obtener registro por ID
const obtenerPasajeroVueloPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const registro = await PasajeroVuelo.findByPk(id, {
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
          model: Itinerario,
          as: 'itinerario',
        },
        {
          model: Usuario,
          as: 'usuario_registro',
          attributes: {
            exclude: ['password_hash'],
          },
        },
      ],
    });

    if (!registro) {
      return res.status(404).json({
        mensaje: 'Registro de pasajero y vuelo no encontrado',
      });
    }

    res.status(200).json(registro);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: 'Error al obtener el registro',
    });
  }
};

// Registrar pasajero en un vuelo
const crearPasajeroVuelo = async (req, res) => {
  try {
    const {
      id_pasajero,
      id_vuelo,
      id_itinerario,
      numero_asiento,
      registrado_por,
    } = req.body;

    if (!id_pasajero || !id_vuelo) {
      return res.status(400).json({
        mensaje: 'El pasajero y el vuelo son obligatorios',
      });
    }

    const pasajero = await Pasajero.findByPk(id_pasajero);

    if (!pasajero) {
      return res.status(400).json({
        mensaje: 'El pasajero seleccionado no existe',
      });
    }

    const vuelo = await Vuelo.findByPk(id_vuelo);

    if (!vuelo) {
      return res.status(400).json({
        mensaje: 'El vuelo seleccionado no existe',
      });
    }

    if (['CANCELADO', 'FINALIZADO', 'ATERRIZADO'].includes(vuelo.estado)) {
      return res.status(400).json({
        mensaje: `No se puede asignar pasajeros a un vuelo en estado ${vuelo.estado}`,
      });
    }

    const asignados = await PasajeroVuelo.count({
      where: { id_vuelo: vuelo.id_vuelo },
    });

    if (
      vuelo.capacidad_pasajeros > 0 &&
      asignados >= vuelo.capacidad_pasajeros
    ) {
      return res.status(409).json({
        mensaje: 'El vuelo alcanzó su capacidad máxima de pasajeros',
      });
    }

    if (id_itinerario) {
      const itinerario = await Itinerario.findByPk(id_itinerario);

      if (!itinerario) {
        return res.status(400).json({
          mensaje: 'El itinerario seleccionado no existe',
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

    // Comprobar que el pasajero no esté registrado dos veces
    // en el mismo vuelo
    const existente = await PasajeroVuelo.findOne({
      where: {
        id_pasajero,
        id_vuelo,
      },
    });

    if (existente) {
      return res.status(409).json({
        mensaje: 'El pasajero ya está registrado en este vuelo',
      });
    }

    const nuevoRegistro = await PasajeroVuelo.create({
      id_pasajero,
      id_vuelo,
      id_itinerario,
      numero_asiento,
      estado: 'RESERVADO',
      registrado_por,
    });

    res.status(201).json({
      mensaje: 'Pasajero registrado en el vuelo correctamente',
      pasajero_vuelo: nuevoRegistro,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: 'Error al registrar el pasajero en el vuelo',
    });
  }
};

// Actualizar registro
const actualizarPasajeroVuelo = async (req, res) => {
  try {
    const { id } = req.params;

    const registro = await PasajeroVuelo.findByPk(id);

    if (!registro) {
      return res.status(404).json({
        mensaje: 'Registro de pasajero y vuelo no encontrado',
      });
    }

    const {
      id_itinerario,
      numero_asiento,
      estado,
      registrado_por,
    } = req.body;

    const datosActualizar = {
      id_itinerario,
      numero_asiento,
      estado,
      registrado_por,
    };

    Object.keys(datosActualizar).forEach((campo) => {
      if (datosActualizar[campo] === undefined) {
        delete datosActualizar[campo];
      }
    });

    await registro.update(datosActualizar);

    res.status(200).json({
      mensaje: 'Registro actualizado correctamente',
      pasajero_vuelo: registro,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: 'Error al actualizar el registro',
    });
  }
};

// Eliminar registro
const eliminarPasajeroVuelo = async (req, res) => {
  try {
    const { id } = req.params;

    const registro = await PasajeroVuelo.findByPk(id);

    if (!registro) {
      return res.status(404).json({
        mensaje: 'Registro de pasajero y vuelo no encontrado',
      });
    }

    await registro.destroy();

    res.status(200).json({
      mensaje: 'Registro eliminado correctamente',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: 'Error al eliminar el registro',
    });
  }
};

module.exports = {
  obtenerPasajerosVuelos,
  obtenerPasajeroVueloPorId,
  crearPasajeroVuelo,
  actualizarPasajeroVuelo,
  eliminarPasajeroVuelo,
};
