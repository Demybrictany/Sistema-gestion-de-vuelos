const { Op } = require('sequelize');

const sequelize = require('../db/database');
const PasajeroVuelo = require('../models/pasajero_vuelo.model');
const Pasajero = require('../models/pasajero.model');
const Vuelo = require('../models/vuelo.model');
const Itinerario = require('../models/itinerario.model');
const Usuario = require('../models/usuario.model');

const { ErrorConEstado } = require('../lib/errores');

const INCLUDE_ASIGNACION = [
  { model: Pasajero, as: 'pasajero' },
  { model: Vuelo, as: 'vuelo' },
  { model: Itinerario, as: 'itinerario' },
  {
    model: Usuario,
    as: 'usuario_registro',
    attributes: { exclude: ['password_hash'] },
  },
];

// Estados de vuelo que todavía admiten asignaciones.
const ESTADOS_VUELO_ABIERTOS = [
  'PROGRAMADO',
  'RETRASADO',
  'ABORDANDO',
  'ABORDADO',
];

// Una reserva cancelada libera su lugar en el vuelo.
const ESTADO_QUE_LIBERA_CUPO = 'CANCELADO';

const obtenerAsignacion = (idAsignacion, transaction) =>
  PasajeroVuelo.findByPk(idAsignacion, {
    include: INCLUDE_ASIGNACION,
    transaction,
  });

const bloquearVuelo = async (idVuelo, transaction) => {
  const vuelo = await Vuelo.findByPk(idVuelo, {
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  if (!vuelo) {
    throw new ErrorConEstado(400, 'El vuelo seleccionado no existe');
  }

  return vuelo;
};

const contarPasajerosActivos = (idVuelo, transaction) =>
  PasajeroVuelo.count({
    where: {
      id_vuelo: idVuelo,
      estado: { [Op.ne]: ESTADO_QUE_LIBERA_CUPO },
    },
    transaction,
  });

const validarCupo = async ({ vuelo, transaction }) => {
  if (vuelo.capacidad_pasajeros <= 0) {
    return;
  }

  const ocupados = await contarPasajerosActivos(vuelo.id_vuelo, transaction);

  if (ocupados >= vuelo.capacidad_pasajeros) {
    throw new ErrorConEstado(
      409,
      'El vuelo alcanzó su capacidad máxima de pasajeros'
    );
  }
};

const validarItinerario = async ({ idItinerario, idPasajero, transaction }) => {
  if (!idItinerario) {
    return null;
  }

  const itinerario = await Itinerario.findByPk(idItinerario, { transaction });

  if (!itinerario) {
    throw new ErrorConEstado(400, 'El itinerario seleccionado no existe');
  }

  if (itinerario.id_pasajero !== idPasajero) {
    throw new ErrorConEstado(
      400,
      'El itinerario no pertenece al pasajero seleccionado'
    );
  }

  return itinerario;
};

const asignarPasajero = async ({ datos, contexto }) => {
  return sequelize.transaction(async (transaction) => {
    // Bloquear el vuelo serializa las asignaciones concurrentes: el conteo
    // de cupo se hace después del bloqueo, dentro de la misma transacción.
    const vuelo = await bloquearVuelo(datos.id_vuelo, transaction);

    if (!ESTADOS_VUELO_ABIERTOS.includes(vuelo.estado)) {
      throw new ErrorConEstado(
        400,
        `No se puede asignar pasajeros a un vuelo en estado ${vuelo.estado}`
      );
    }

    const pasajero = await Pasajero.findByPk(datos.id_pasajero, {
      transaction,
    });

    if (!pasajero) {
      throw new ErrorConEstado(400, 'El pasajero seleccionado no existe');
    }

    if (pasajero.estado !== 'ACTIVO') {
      throw new ErrorConEstado(400, 'El pasajero no se encuentra activo');
    }

    await validarItinerario({
      idItinerario: datos.id_itinerario,
      idPasajero: pasajero.id_pasajero,
      transaction,
    });

    const existente = await PasajeroVuelo.findOne({
      where: {
        id_pasajero: pasajero.id_pasajero,
        id_vuelo: vuelo.id_vuelo,
      },
      transaction,
    });

    if (existente) {
      throw new ErrorConEstado(
        409,
        'El pasajero ya está registrado en este vuelo'
      );
    }

    const estado = datos.estado || 'RESERVADO';

    if (estado !== ESTADO_QUE_LIBERA_CUPO) {
      await validarCupo({ vuelo, transaction });
    }

    const registro = await PasajeroVuelo.create(
      {
        id_pasajero: pasajero.id_pasajero,
        id_vuelo: vuelo.id_vuelo,
        id_itinerario: datos.id_itinerario ?? null,
        numero_asiento: datos.numero_asiento ?? null,
        estado,
        registrado_por: contexto.idUsuario ?? null,
      },
      { transaction }
    );

    return obtenerAsignacion(registro.id_pasajero_vuelo, transaction);
  });
};

const actualizarAsignacion = async ({ idAsignacion, datos, contexto }) => {
  return sequelize.transaction(async (transaction) => {
    const registro = await PasajeroVuelo.findByPk(idAsignacion, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!registro) {
      throw new ErrorConEstado(404, 'Registro de pasajero y vuelo no encontrado');
    }

    if (datos.id_itinerario !== undefined && datos.id_itinerario !== null) {
      await validarItinerario({
        idItinerario: datos.id_itinerario,
        idPasajero: registro.id_pasajero,
        transaction,
      });
    }

    const estadoNuevo = datos.estado ?? registro.estado;
    const seReactiva =
      registro.estado === ESTADO_QUE_LIBERA_CUPO &&
      estadoNuevo !== ESTADO_QUE_LIBERA_CUPO;

    if (seReactiva) {
      const vuelo = await bloquearVuelo(registro.id_vuelo, transaction);

      if (!ESTADOS_VUELO_ABIERTOS.includes(vuelo.estado)) {
        throw new ErrorConEstado(
          400,
          `No se puede reactivar la reserva de un vuelo en estado ${vuelo.estado}`
        );
      }

      await validarCupo({ vuelo, transaction });
    }

    const datosActualizar = {};

    // `registrado_por` nunca se toma del cliente: se deriva del token.
    for (const campo of ['id_itinerario', 'numero_asiento', 'estado']) {
      if (datos[campo] !== undefined) {
        datosActualizar[campo] = datos[campo];
      }
    }

    if (datos.estado !== undefined && datos.estado !== registro.estado) {
      datosActualizar.registrado_por = contexto.idUsuario ?? null;
    }

    await registro.update(datosActualizar, { transaction });

    return obtenerAsignacion(idAsignacion, transaction);
  });
};

const eliminarAsignacion = async (idAsignacion) => {
  const registro = await PasajeroVuelo.findByPk(idAsignacion);

  if (!registro) {
    throw new ErrorConEstado(404, 'Registro de pasajero y vuelo no encontrado');
  }

  await registro.destroy();

  return registro;
};

module.exports = {
  asignarPasajero,
  actualizarAsignacion,
  eliminarAsignacion,
};
