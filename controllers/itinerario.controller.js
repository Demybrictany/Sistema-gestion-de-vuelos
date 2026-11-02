const Itinerario = require('../models/itinerario.model');
const Pasajero = require('../models/pasajero.model');
const Aeropuerto = require('../models/aeropuerto.model');

// Valida las referencias y las reglas de negocio del itinerario. Se usa
// tanto en el alta como en la actualización para que un PUT no pueda
// dejar datos que el POST rechazaría.
const validarContenido = async ({
  id_pasajero,
  origen_principal,
  destino_final,
  fecha_inicio,
  fecha_fin,
}) => {
  const pasajero = await Pasajero.findByPk(id_pasajero);

  if (!pasajero) {
    return 'El pasajero seleccionado no existe';
  }

  const origen = await Aeropuerto.findByPk(origen_principal);
  const destino = await Aeropuerto.findByPk(destino_final);

  if (!origen || !destino) {
    return 'El aeropuerto de origen o destino no existe';
  }

  if (Number(origen_principal) === Number(destino_final)) {
    return 'El origen y el destino final no pueden ser el mismo';
  }

  if (new Date(fecha_fin) < new Date(fecha_inicio)) {
    return 'La fecha final no puede ser anterior a la fecha de inicio';
  }

  return null;
};

// Obtener todos los itinerarios
const obtenerItinerarios = async (req, res) => {
  try {
    const itinerarios = await Itinerario.findAll({
      include: [
        {
          model: Pasajero,
          as: 'pasajero',
        },
        {
          model: Aeropuerto,
          as: 'aeropuerto_origen',
        },
        {
          model: Aeropuerto,
          as: 'aeropuerto_destino',
        },
      ],
    });

    res.status(200).json(itinerarios);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: 'Error al obtener los itinerarios',
    });
  }
};

// Obtener itinerario por ID
const obtenerItinerarioPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const itinerario = await Itinerario.findByPk(id, {
      include: [
        {
          model: Pasajero,
          as: 'pasajero',
        },
        {
          model: Aeropuerto,
          as: 'aeropuerto_origen',
        },
        {
          model: Aeropuerto,
          as: 'aeropuerto_destino',
        },
      ],
    });

    if (!itinerario) {
      return res.status(404).json({
        mensaje: 'Itinerario no encontrado',
      });
    }

    res.status(200).json(itinerario);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: 'Error al obtener el itinerario',
    });
  }
};

// Crear itinerario
const crearItinerario = async (req, res) => {
  try {
    const {
      id_pasajero,
      codigo_reserva,
      origen_principal,
      destino_final,
      fecha_inicio,
      fecha_fin,
    } = req.body;

    if (
      !id_pasajero ||
      !codigo_reserva ||
      !origen_principal ||
      !destino_final ||
      !fecha_inicio ||
      !fecha_fin
    ) {
      return res.status(400).json({
        mensaje: 'Faltan datos obligatorios del itinerario',
      });
    }

    const errorContenido = await validarContenido({
      id_pasajero,
      origen_principal,
      destino_final,
      fecha_inicio,
      fecha_fin,
    });

    if (errorContenido) {
      return res.status(400).json({
        mensaje: errorContenido,
      });
    }

    const nuevoItinerario = await Itinerario.create({
      id_pasajero,
      codigo_reserva,
      origen_principal,
      destino_final,
      fecha_inicio,
      fecha_fin,
      estado: 'PROGRAMADO',
    });

    res.status(201).json({
      mensaje: 'Itinerario creado correctamente',
      itinerario: nuevoItinerario,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: 'Error al crear el itinerario',
    });
  }
};

// Actualizar itinerario
const actualizarItinerario = async (req, res) => {
  try {
    const { id } = req.params;

    const itinerario = await Itinerario.findByPk(id);

    if (!itinerario) {
      return res.status(404).json({
        mensaje: 'Itinerario no encontrado',
      });
    }

    const datosActualizar = { ...req.body };

    Object.keys(datosActualizar).forEach((campo) => {
      if (datosActualizar[campo] === undefined) {
        delete datosActualizar[campo];
      }
    });

    // Se validan los valores resultantes (los enviados o los actuales),
    // para que una actualización parcial no rompa las reglas del alta.
    const errorContenido = await validarContenido({
      id_pasajero: datosActualizar.id_pasajero ?? itinerario.id_pasajero,
      origen_principal:
        datosActualizar.origen_principal ?? itinerario.origen_principal,
      destino_final:
        datosActualizar.destino_final ?? itinerario.destino_final,
      fecha_inicio: datosActualizar.fecha_inicio ?? itinerario.fecha_inicio,
      fecha_fin: datosActualizar.fecha_fin ?? itinerario.fecha_fin,
    });

    if (errorContenido) {
      return res.status(400).json({
        mensaje: errorContenido,
      });
    }

    await itinerario.update(datosActualizar);

    res.status(200).json({
      mensaje: 'Itinerario actualizado correctamente',
      itinerario,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: 'Error al actualizar el itinerario',
    });
  }
};

// Eliminar itinerario
const eliminarItinerario = async (req, res) => {
  try {
    const { id } = req.params;

    const itinerario = await Itinerario.findByPk(id);

    if (!itinerario) {
      return res.status(404).json({
        mensaje: 'Itinerario no encontrado',
      });
    }

    await itinerario.destroy();

    res.status(200).json({
      mensaje: 'Itinerario eliminado correctamente',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: 'Error al eliminar el itinerario',
    });
  }
};

module.exports = {
  obtenerItinerarios,
  obtenerItinerarioPorId,
  crearItinerario,
  actualizarItinerario,
  eliminarItinerario,
};
