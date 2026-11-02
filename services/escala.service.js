// ============================================================
// Servicio de escalas.
//
// - Valida itinerario, vuelo, aeropuertos, puertas y horarios.
// - Notifica al pasajero del itinerario cuando se asigna o cambia
//   la puerta de salida de la conexión.
// - Mantiene la respuesta del controlador sin cambios.
// ============================================================

const sequelize = require('../db/database');
const Escala = require('../models/escala.model');
const Itinerario = require('../models/itinerario.model');
const Vuelo = require('../models/vuelo.model');
const Aeropuerto = require('../models/aeropuerto.model');
const Puerta = require('../models/puerta.model');

const { ErrorConEstado } = require('../lib/errores');
const { crearNotificacionPasajero } = require('./notificacion.service');

const INCLUDE_ESCALA = [
  { model: Itinerario, as: 'itinerario' },
  { model: Vuelo, as: 'vuelo' },
  { model: Aeropuerto, as: 'aeropuertoLlegada' },
  { model: Aeropuerto, as: 'aeropuertoSalida' },
  { model: Puerta, as: 'puertaLlegada' },
  { model: Puerta, as: 'puertaSalida' },
];

const CAMPOS_ACTUALIZABLES = [
  'numero_escala',
  'aeropuerto_llegada',
  'aeropuerto_salida',
  'hora_llegada',
  'hora_salida',
  'id_puerta_llegada',
  'id_puerta_salida',
  'estado',
];

const obtenerEscalas = () =>
  Escala.findAll({
    include: INCLUDE_ESCALA,
    order: [['id_escala', 'ASC']],
  });

const obtenerEscalaPorId = async (id, transaction) => {
  const escala = await Escala.findByPk(id, {
    include: INCLUDE_ESCALA,
    transaction,
  });

  if (!escala) {
    throw new ErrorConEstado(404, 'Escala no encontrada');
  }

  return escala;
};

const validarPuertaOperativa = async (idPuerta, transaction) => {
  if (idPuerta === undefined || idPuerta === null || idPuerta === '') {
    return null;
  }

  const puerta = await Puerta.findByPk(idPuerta, { transaction });

  if (!puerta) {
    throw new ErrorConEstado(400, 'La puerta seleccionada no existe');
  }

  if (['MANTENIMIENTO', 'INACTIVA'].includes(puerta.estado)) {
    throw new ErrorConEstado(
      400,
      `La puerta ${puerta.numero} no está operativa (${puerta.estado})`
    );
  }

  return puerta;
};

const validarHoras = (horaLlegada, horaSalida) => {
  if (horaSalida && new Date(horaSalida) <= new Date(horaLlegada)) {
    throw new ErrorConEstado(
      400,
      'La hora de salida de la escala debe ser posterior a la llegada'
    );
  }
};

const notificarPuerta = async ({
  escala,
  itinerario,
  puerta,
  tipo,
  transaction,
}) => {
  if (!puerta || !itinerario) {
    return;
  }

  const vuelo = await Vuelo.findByPk(escala.id_vuelo, { transaction });
  const hora = escala.hora_salida
    ? new Date(escala.hora_salida)
        .toISOString()
        .slice(0, 16)
        .replace('T', ' ')
    : 'por confirmar';

  await crearNotificacionPasajero({
    idPasajero: itinerario.id_pasajero,
    idVuelo: escala.id_vuelo,
    tipo,
    titulo:
      tipo === 'CAMBIO_PUERTA'
        ? 'Cambio de puerta en tu conexión'
        : 'Puerta de tu conexión',
    mensaje:
      `Tu conexión${vuelo ? ` (${vuelo.codigo_vuelo})` : ''} sale el ${hora}` +
      ` desde la puerta ${puerta.numero}.`,
    transaction,
  });
};

const crearEscala = async ({ datos }) =>
  sequelize.transaction(async (transaction) => {
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
    } = datos;

    if (
      !id_itinerario ||
      !id_vuelo ||
      !numero_escala ||
      !aeropuerto_llegada ||
      !aeropuerto_salida ||
      !hora_llegada
    ) {
      throw new ErrorConEstado(400, 'Faltan datos obligatorios de la escala');
    }

    const itinerario = await Itinerario.findByPk(id_itinerario, {
      transaction,
    });

    if (!itinerario) {
      throw new ErrorConEstado(400, 'El itinerario no existe');
    }

    const vuelo = await Vuelo.findByPk(id_vuelo, { transaction });

    if (!vuelo) {
      throw new ErrorConEstado(400, 'El vuelo no existe');
    }

    // Una escala puede llegar y salir del mismo aeropuerto (conexión en la
    // misma terminal). Se valida cada ID por separado en lugar de exigir dos
    // filas distintas.
    const idsAeropuertos = [
      ...new Set([aeropuerto_llegada, aeropuerto_salida]),
    ];
    const aeropuertos = await Aeropuerto.findAll({
      where: { id_aeropuerto: idsAeropuertos },
      transaction,
    });

    if (aeropuertos.length < idsAeropuertos.length) {
      throw new ErrorConEstado(
        400,
        'El aeropuerto de llegada o salida no existe'
      );
    }

    await validarPuertaOperativa(id_puerta_llegada, transaction);
    const puertaSalida = await validarPuertaOperativa(
      id_puerta_salida,
      transaction
    );

    validarHoras(hora_llegada, hora_salida);

    const existente = await Escala.findOne({
      where: { id_itinerario, numero_escala },
      transaction,
    });

    if (existente) {
      throw new ErrorConEstado(
        409,
        'Ya existe este número de escala dentro del itinerario'
      );
    }

    const escala = await Escala.create(
      {
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
      },
      { transaction }
    );

    await notificarPuerta({
      escala,
      itinerario,
      puerta: puertaSalida,
      tipo: 'PUERTA_ASIGNADA',
      transaction,
    });

    return obtenerEscalaPorId(escala.id_escala, transaction);
  });

const actualizarEscala = async ({ id, datos }) =>
  sequelize.transaction(async (transaction) => {
    const escala = await Escala.findByPk(id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!escala) {
      throw new ErrorConEstado(404, 'Escala no encontrada');
    }

    const cambios = {};

    for (const campo of CAMPOS_ACTUALIZABLES) {
      if (datos[campo] !== undefined) {
        cambios[campo] = datos[campo];
      }
    }

    const horaLlegada = cambios.hora_llegada ?? escala.hora_llegada;
    const horaSalida =
      cambios.hora_salida !== undefined
        ? cambios.hora_salida
        : escala.hora_salida;

    validarHoras(horaLlegada, horaSalida);

    if (cambios.aeropuerto_llegada || cambios.aeropuerto_salida) {
      // Igual que en el alta: llegada y salida pueden ser el mismo
      // aeropuerto, así que se cuentan los IDs únicos.
      const ids = [
        ...new Set([
          cambios.aeropuerto_llegada ?? escala.aeropuerto_llegada,
          cambios.aeropuerto_salida ?? escala.aeropuerto_salida,
        ]),
      ];
      const aeropuertos = await Aeropuerto.findAll({
        where: { id_aeropuerto: ids },
        transaction,
      });

      if (aeropuertos.length < ids.length) {
        throw new ErrorConEstado(
          400,
          'El aeropuerto de llegada o salida no existe'
        );
      }
    }

    if (cambios.id_puerta_llegada !== undefined) {
      await validarPuertaOperativa(cambios.id_puerta_llegada, transaction);
    }

    const puertaAnterior = escala.id_puerta_salida;
    let puertaSalida = null;

    if (cambios.id_puerta_salida !== undefined) {
      puertaSalida = await validarPuertaOperativa(
        cambios.id_puerta_salida,
        transaction
      );
    }

    if (cambios.numero_escala !== undefined) {
      const duplicada = await Escala.findOne({
        where: {
          id_itinerario: escala.id_itinerario,
          numero_escala: cambios.numero_escala,
        },
        transaction,
      });

      if (duplicada && duplicada.id_escala !== escala.id_escala) {
        throw new ErrorConEstado(
          409,
          'Ya existe este número de escala dentro del itinerario'
        );
      }
    }

    await escala.update(cambios, { transaction });

    const cambioPuerta =
      cambios.id_puerta_salida !== undefined &&
      String(puertaAnterior ?? '') !== String(cambios.id_puerta_salida ?? '');

    if (cambioPuerta && puertaSalida) {
      const itinerario = await Itinerario.findByPk(escala.id_itinerario, {
        transaction,
      });

      await notificarPuerta({
        escala,
        itinerario,
        puerta: puertaSalida,
        tipo: puertaAnterior ? 'CAMBIO_PUERTA' : 'PUERTA_ASIGNADA',
        transaction,
      });
    }

    return obtenerEscalaPorId(escala.id_escala, transaction);
  });

const eliminarEscala = async (id) =>
  sequelize.transaction(async (transaction) => {
    const escala = await Escala.findByPk(id, { transaction });

    if (!escala) {
      throw new ErrorConEstado(404, 'Escala no encontrada');
    }

    await escala.destroy({ transaction });

    return escala;
  });

module.exports = {
  obtenerEscalas,
  obtenerEscalaPorId,
  crearEscala,
  actualizarEscala,
  eliminarEscala,
};
