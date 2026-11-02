const { Op } = require('sequelize');

const sequelize = require('../db/database');
const PasajeroVuelo = require('../models/pasajero_vuelo.model');
const Pasajero = require('../models/pasajero.model');
const Vuelo = require('../models/vuelo.model');
const Itinerario = require('../models/itinerario.model');
const Usuario = require('../models/usuario.model');
const Puerta = require('../models/puerta.model');

const { ErrorConEstado } = require('../lib/errores');
const { crearNotificacionPasajero } = require('./notificacion.service');

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

const normalizarAsiento = (valor) => {
  if (valor === undefined) {
    return undefined;
  }

  if (valor === null) {
    return null;
  }

  const texto = String(valor).trim().toUpperCase();

  return texto || null;
};

// Un asiento solo puede pertenecer a una reserva activa del mismo vuelo.
// El llamador debe haber bloqueado el vuelo para serializar la comprobación.
const validarAsientoDisponible = async ({
  idVuelo,
  numeroAsiento,
  idPasajeroVueloExcluir = null,
  transaction,
}) => {
  if (!numeroAsiento) {
    return;
  }

  const where = {
    id_vuelo: idVuelo,
    numero_asiento: numeroAsiento,
    estado: { [Op.ne]: ESTADO_QUE_LIBERA_CUPO },
  };

  if (idPasajeroVueloExcluir) {
    where.id_pasajero_vuelo = { [Op.ne]: idPasajeroVueloExcluir };
  }

  const ocupado = await PasajeroVuelo.findOne({ where, transaction });

  if (ocupado) {
    throw new ErrorConEstado(
      409,
      `El asiento ${numeroAsiento} ya está ocupado en este vuelo`
    );
  }
};

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

// Aviso inicial de la reserva: código, fecha, hora y puerta si ya existe.
const notificarAsignacion = async ({ idPasajero, vuelo, transaction }) => {
  const puerta = vuelo.id_puerta
    ? await Puerta.findByPk(vuelo.id_puerta, { transaction })
    : null;

  const fecha = String(vuelo.fecha_salida).slice(0, 10);
  const hora = String(vuelo.hora_salida).slice(0, 5);
  const detallePuerta = puerta ? ` por la puerta ${puerta.numero}` : '';

  await crearNotificacionPasajero({
    idPasajero,
    idVuelo: vuelo.id_vuelo,
    tipo: puerta ? 'PUERTA_ASIGNADA' : 'INFORMACION_GENERAL',
    titulo: puerta ? 'Puerta y hora de tu vuelo' : 'Hora de tu vuelo',
    mensaje:
      `Tu vuelo ${vuelo.codigo_vuelo} sale el ${fecha} a las ${hora}` +
      `${detallePuerta}.`,
    transaction,
  });
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
    const numeroAsiento = normalizarAsiento(datos.numero_asiento);

    if (estado !== ESTADO_QUE_LIBERA_CUPO) {
      await validarCupo({ vuelo, transaction });

      await validarAsientoDisponible({
        idVuelo: vuelo.id_vuelo,
        numeroAsiento,
        transaction,
      });
    }

    const registro = await PasajeroVuelo.create(
      {
        id_pasajero: pasajero.id_pasajero,
        id_vuelo: vuelo.id_vuelo,
        id_itinerario: datos.id_itinerario ?? null,
        numero_asiento: numeroAsiento ?? null,
        estado,
        registrado_por: contexto.idUsuario ?? null,
      },
      { transaction }
    );

    if (estado !== ESTADO_QUE_LIBERA_CUPO) {
      await notificarAsignacion({
        idPasajero: pasajero.id_pasajero,
        vuelo,
        transaction,
      });
    }

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

    let vueloReactivado = null;

    if (seReactiva) {
      vueloReactivado = await bloquearVuelo(registro.id_vuelo, transaction);

      if (!ESTADOS_VUELO_ABIERTOS.includes(vueloReactivado.estado)) {
        throw new ErrorConEstado(
          400,
          `No se puede reactivar la reserva de un vuelo en estado ${vueloReactivado.estado}`
        );
      }

      await validarCupo({ vuelo: vueloReactivado, transaction });
    }

    const numeroAsiento =
      datos.numero_asiento !== undefined
        ? normalizarAsiento(datos.numero_asiento)
        : registro.numero_asiento;
    const cambiaAsiento =
      datos.numero_asiento !== undefined &&
      numeroAsiento !== registro.numero_asiento;

    if (
      !seReactiva &&
      cambiaAsiento &&
      estadoNuevo !== ESTADO_QUE_LIBERA_CUPO
    ) {
      // Bloquear el vuelo serializa los cambios de asiento concurrentes.
      await bloquearVuelo(registro.id_vuelo, transaction);
    }

    if (
      estadoNuevo !== ESTADO_QUE_LIBERA_CUPO &&
      (seReactiva || cambiaAsiento)
    ) {
      await validarAsientoDisponible({
        idVuelo: registro.id_vuelo,
        numeroAsiento,
        idPasajeroVueloExcluir: registro.id_pasajero_vuelo,
        transaction,
      });
    }

    const datosActualizar = {};

    // `registrado_por` nunca se toma del cliente: se deriva del token.
    for (const campo of ['id_itinerario', 'numero_asiento', 'estado']) {
      if (datos[campo] !== undefined) {
        datosActualizar[campo] = datos[campo];
      }
    }

    if (datos.numero_asiento !== undefined) {
      datosActualizar.numero_asiento = numeroAsiento;
    }

    if (datos.estado !== undefined && datos.estado !== registro.estado) {
      datosActualizar.registrado_por = contexto.idUsuario ?? null;
    }

    await registro.update(datosActualizar, { transaction });

    if (seReactiva && vueloReactivado) {
      await notificarAsignacion({
        idPasajero: registro.id_pasajero,
        vuelo: vueloReactivado,
        transaction,
      });
    }

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
