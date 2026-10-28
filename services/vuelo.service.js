const { Op } = require('sequelize');

const sequelize = require('../db/database');
const Vuelo = require('../models/vuelo.model');
const Puerta = require('../models/puerta.model');
const Aeropuerto = require('../models/aeropuerto.model');
const PasajeroVuelo = require('../models/pasajero_vuelo.model');

const { ErrorConEstado } = require('../lib/errores');
const { registrarCambiosVuelo } = require('./historial.service');
const { notificarPasajerosDeVuelo } = require('./notificacion.service');

const INCLUDE_VUELO = [
  { model: Aeropuerto, as: 'aeropuerto_origen' },
  { model: Aeropuerto, as: 'aeropuerto_destino' },
  { model: Puerta, as: 'puerta' },
];

const TRANSICIONES = {
  PROGRAMADO: ['ABORDANDO', 'RETRASADO', 'CANCELADO'],
  RETRASADO: ['PROGRAMADO', 'ABORDANDO', 'CANCELADO'],
  ABORDANDO: ['ABORDADO', 'RETRASADO', 'CANCELADO'],
  ABORDADO: ['EN_VUELO', 'RETRASADO'],
  EN_VUELO: ['ATERRIZADO'],
  ATERRIZADO: ['FINALIZADO'],
  FINALIZADO: [],
  CANCELADO: [],
};

const CAMPOS_ACTUALIZABLES = [
  'codigo_vuelo',
  'id_aeropuerto_origen',
  'id_aeropuerto_destino',
  'fecha_salida',
  'hora_salida',
  'fecha_llegada',
  'hora_llegada',
  'id_puerta',
  'estado',
  'motivo_cancelacion',
  'capacidad_pasajeros',
  'observaciones',
];

const aFechaHora = (fecha, hora) => new Date(`${fecha}T${hora}`);

const hhmm = (hora) => String(hora || '').slice(0, 5);

const validarRangoHorario = (fechaSalida, horaSalida, fechaLlegada, horaLlegada) => {
  if (aFechaHora(fechaLlegada, horaLlegada) <= aFechaHora(fechaSalida, horaSalida)) {
    throw new ErrorConEstado(
      400,
      'La fecha y hora de llegada deben ser posteriores a la salida'
    );
  }
};

const validarTransicionEstado = (estadoActual, estadoNuevo) => {
  if (estadoActual === estadoNuevo) {
    return;
  }

  if (!TRANSICIONES[estadoActual]?.includes(estadoNuevo)) {
    throw new ErrorConEstado(
      400,
      `No se puede cambiar el estado de ${estadoActual} a ${estadoNuevo}`
    );
  }
};

const verificarPuertaDisponible = async ({
  idPuerta,
  fechaSalida,
  horaSalida,
  fechaLlegada,
  horaLlegada,
  idVueloExcluir = null,
  transaction,
}) => {
  if (!idPuerta) {
    return null;
  }

  const puerta = await Puerta.findByPk(idPuerta, {
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined,
  });

  if (!puerta) {
    throw new ErrorConEstado(400, 'La puerta seleccionada no existe');
  }

  if (puerta.estado !== 'DISPONIBLE') {
    throw new ErrorConEstado(
      400,
      `La puerta ${puerta.numero} está en estado ${puerta.estado}`
    );
  }

  const where = {
    id_puerta: idPuerta,
    estado: { [Op.ne]: 'CANCELADO' },
    [Op.and]: [
      {
        [Op.or]: [
          { fecha_salida: { [Op.lt]: fechaLlegada } },
          {
            fecha_salida: fechaLlegada,
            hora_salida: { [Op.lt]: horaLlegada },
          },
        ],
      },
      {
        [Op.or]: [
          { fecha_llegada: { [Op.gt]: fechaSalida } },
          {
            fecha_llegada: fechaSalida,
            hora_llegada: { [Op.gt]: horaSalida },
          },
        ],
      },
    ],
  };

  if (idVueloExcluir) {
    where.id_vuelo = { [Op.ne]: idVueloExcluir };
  }

  const conflicto = await Vuelo.findOne({
    where,
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined,
  });

  if (conflicto) {
    throw new ErrorConEstado(
      409,
      `La puerta ${puerta.numero} ya está ocupada por el vuelo ${conflicto.codigo_vuelo} en ese horario`
    );
  }

  return puerta;
};

const obtenerVuelo = (idVuelo, transaction) =>
  Vuelo.findByPk(idVuelo, {
    include: INCLUDE_VUELO,
    transaction,
  });

const crearVuelo = async (datos, contexto) => {
  return sequelize.transaction(async (transaction) => {
    if (datos.id_aeropuerto_origen === datos.id_aeropuerto_destino) {
      throw new ErrorConEstado(
        400,
        'El aeropuerto de origen y destino no pueden ser el mismo'
      );
    }

    const origen = await Aeropuerto.findByPk(datos.id_aeropuerto_origen, {
      transaction,
    });
    const destino = await Aeropuerto.findByPk(datos.id_aeropuerto_destino, {
      transaction,
    });

    if (!origen || !destino) {
      throw new ErrorConEstado(
        400,
        'El aeropuerto de origen o destino no existe'
      );
    }

    validarRangoHorario(
      datos.fecha_salida,
      datos.hora_salida,
      datos.fecha_llegada,
      datos.hora_llegada
    );

    await verificarPuertaDisponible({
      idPuerta: datos.id_puerta,
      fechaSalida: datos.fecha_salida,
      horaSalida: datos.hora_salida,
      fechaLlegada: datos.fecha_llegada,
      horaLlegada: datos.hora_llegada,
      transaction,
    });

    const vuelo = await Vuelo.create(
      { ...datos, estado: 'PROGRAMADO' },
      { transaction }
    );

    return obtenerVuelo(vuelo.id_vuelo, transaction);
  });
};

const actualizarVuelo = async ({ idVuelo, datos, motivo, contexto }) => {
  return sequelize.transaction(async (transaction) => {
    const vuelo = await Vuelo.findByPk(idVuelo, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!vuelo) {
      throw new ErrorConEstado(404, 'Vuelo no encontrado');
    }

    const antes = vuelo.get({ plain: true });
    const cambios = {};

    for (const campo of CAMPOS_ACTUALIZABLES) {
      if (datos[campo] === undefined) {
        continue;
      }

      const valorAnterior = antes[campo] ?? '';
      const valorNuevo = datos[campo] ?? '';

      if (String(valorAnterior) !== String(valorNuevo)) {
        cambios[campo] = {
          anterior: antes[campo],
          nuevo: datos[campo],
        };
      }
    }

    const estadoNuevo = datos.estado ?? antes.estado;

    if (datos.estado !== undefined) {
      validarTransicionEstado(antes.estado, datos.estado);
    }

    if (
      ['CANCELADO', 'FINALIZADO'].includes(antes.estado) &&
      datos.estado === undefined
    ) {
      throw new ErrorConEstado(
        400,
        `No se puede modificar un vuelo en estado ${antes.estado}`
      );
    }

    if (datos.estado === 'CANCELADO') {
      const motivoCancelacion =
        datos.motivo_cancelacion ?? motivo ?? antes.motivo_cancelacion ?? null;

      if (!motivoCancelacion) {
        throw new ErrorConEstado(
          400,
          'Debes indicar el motivo de la cancelación'
        );
      }

      if (motivoCancelacion !== antes.motivo_cancelacion) {
        datos.motivo_cancelacion = motivoCancelacion;
        cambios.motivo_cancelacion = {
          anterior: antes.motivo_cancelacion,
          nuevo: motivoCancelacion,
        };
      }
    }

    if (!Object.keys(cambios).length) {
      return {
        vuelo: await obtenerVuelo(idVuelo, transaction),
        cambios,
      };
    }

    const idOrigen = datos.id_aeropuerto_origen ?? antes.id_aeropuerto_origen;
    const idDestino = datos.id_aeropuerto_destino ?? antes.id_aeropuerto_destino;

    if (idOrigen === idDestino) {
      throw new ErrorConEstado(
        400,
        'El aeropuerto de origen y destino no pueden ser el mismo'
      );
    }

    if (datos.id_aeropuerto_origen !== undefined) {
      const existe = await Aeropuerto.findByPk(idOrigen, { transaction });
      if (!existe) {
        throw new ErrorConEstado(400, 'El aeropuerto de origen no existe');
      }
    }

    if (datos.id_aeropuerto_destino !== undefined) {
      const existe = await Aeropuerto.findByPk(idDestino, { transaction });
      if (!existe) {
        throw new ErrorConEstado(400, 'El aeropuerto de destino no existe');
      }
    }

    const fechaSalida = datos.fecha_salida ?? antes.fecha_salida;
    const horaSalida = datos.hora_salida ?? antes.hora_salida;
    const fechaLlegada = datos.fecha_llegada ?? antes.fecha_llegada;
    const horaLlegada = datos.hora_llegada ?? antes.hora_llegada;

    validarRangoHorario(fechaSalida, horaSalida, fechaLlegada, horaLlegada);

    const idPuerta = datos.id_puerta !== undefined ? datos.id_puerta : antes.id_puerta;

    let puerta = null;

    if (idPuerta && estadoNuevo !== 'CANCELADO') {
      puerta = await verificarPuertaDisponible({
        idPuerta,
        fechaSalida,
        horaSalida,
        fechaLlegada,
        horaLlegada,
        idVueloExcluir: idVuelo,
        transaction,
      });
    }

    // No se puede reducir la capacidad por debajo de los pasajeros ya
    // asignados (las reservas canceladas liberan su lugar).
    if (estadoNuevo !== 'CANCELADO' && datos.capacidad_pasajeros !== undefined) {
      const pasajerosActivos = await PasajeroVuelo.count({
        where: {
          id_vuelo: idVuelo,
          estado: { [Op.ne]: 'CANCELADO' },
        },
        transaction,
      });

      if (
        datos.capacidad_pasajeros > 0 &&
        pasajerosActivos > datos.capacidad_pasajeros
      ) {
        throw new ErrorConEstado(
          400,
          `La capacidad (${datos.capacidad_pasajeros}) es menor que los ` +
            `${pasajerosActivos} pasajeros asignados al vuelo`
        );
      }
    }

    const datosActualizar = {};

    for (const campo of CAMPOS_ACTUALIZABLES) {
      if (datos[campo] !== undefined) {
        datosActualizar[campo] = datos[campo];
      }
    }

    await vuelo.update(datosActualizar, { transaction });

    await registrarCambiosVuelo({
      idVuelo,
      cambios,
      motivo,
      idUsuario: contexto.idUsuario,
      transaction,
    });

    const codigo = datos.codigo_vuelo ?? antes.codigo_vuelo;

    if (cambios.estado?.nuevo === 'CANCELADO') {
      await notificarPasajerosDeVuelo({
        idVuelo,
        tipo: 'VUELO_CANCELADO',
        titulo: 'Vuelo cancelado',
        mensaje: `El vuelo ${codigo} fue cancelado. ${
          datos.motivo_cancelacion || motivo || ''
        }`.trim(),
        transaction,
      });

      await PasajeroVuelo.update(
        { estado: 'CANCELADO' },
        { where: { id_vuelo: idVuelo }, transaction }
      );
    } else if (cambios.estado?.nuevo === 'RETRASADO') {
      await notificarPasajerosDeVuelo({
        idVuelo,
        tipo: 'VUELO_RETRASADO',
        titulo: 'Vuelo retrasado',
        mensaje: `El vuelo ${codigo} presenta un retraso. Nueva salida: ${fechaSalida} ${hhmm(
          horaSalida
        )}.`,
        transaction,
      });
    }

    if (estadoNuevo !== 'CANCELADO' && cambios.id_puerta) {
      const tipo = antes.id_puerta ? 'CAMBIO_PUERTA' : 'PUERTA_ASIGNADA';
      const mensaje = puerta
        ? `Tu vuelo ${codigo} sale por la puerta ${puerta.numero}.`
        : `La puerta del vuelo ${codigo} fue retirada. Consulta el panel para la nueva asignación.`;

      await notificarPasajerosDeVuelo({
        idVuelo,
        tipo,
        titulo:
          tipo === 'CAMBIO_PUERTA' ? 'Cambio de puerta' : 'Puerta asignada',
        mensaje,
        transaction,
      });
    }

    if (
      estadoNuevo !== 'CANCELADO' &&
      (cambios.fecha_salida || cambios.hora_salida)
    ) {
      await notificarPasajerosDeVuelo({
        idVuelo,
        tipo: 'CAMBIO_HORARIO',
        titulo: 'Nuevo horario de salida',
        mensaje: `La salida del vuelo ${codigo} fue actualizada al ${fechaSalida} a las ${hhmm(
          horaSalida
        )}.`,
        transaction,
      });
    } else if (
      estadoNuevo !== 'CANCELADO' &&
      (cambios.fecha_llegada || cambios.hora_llegada)
    ) {
      await notificarPasajerosDeVuelo({
        idVuelo,
        tipo: 'CAMBIO_HORARIO',
        titulo: 'Nuevo horario de llegada',
        mensaje: `La llegada del vuelo ${codigo} fue actualizada al ${fechaLlegada} a las ${hhmm(
          horaLlegada
        )}.`,
        transaction,
      });
    }

    return {
      vuelo: await obtenerVuelo(idVuelo, transaction),
      cambios,
    };
  });
};

const cambiarEstadoVuelo = async (idVuelo, { estado, motivo }, contexto) => {
  return actualizarVuelo({
    idVuelo,
    datos: { estado },
    motivo,
    contexto,
  });
};

const reprogramarVuelo = async (idVuelo, datos, contexto) => {
  return actualizarVuelo({
    idVuelo,
    datos,
    motivo: datos.motivo,
    contexto,
  });
};

const cambiarPuertaVuelo = async (idVuelo, datos, contexto) => {
  return actualizarVuelo({
    idVuelo,
    datos: { id_puerta: datos.id_puerta },
    motivo: datos.motivo,
    contexto,
  });
};

const cancelarVuelo = async (idVuelo, { motivo }, contexto) => {
  return actualizarVuelo({
    idVuelo,
    datos: { estado: 'CANCELADO', motivo_cancelacion: motivo },
    motivo,
    contexto,
  });
};

const obtenerVuelosDePasajero = async (idPasajero) => {
  const registros = await PasajeroVuelo.findAll({
    where: { id_pasajero: idPasajero },
    include: [
      {
        model: Vuelo,
        as: 'vuelo',
        include: INCLUDE_VUELO,
      },
    ],
    order: [[{ model: Vuelo, as: 'vuelo' }, 'fecha_salida', 'ASC']],
  });

  return registros.map((registro) => ({
    ...registro.vuelo.toJSON(),
    estado_pasajero_vuelo: registro.estado,
    numero_asiento: registro.numero_asiento,
  }));
};

module.exports = {
  TRANSICIONES,
  crearVuelo,
  actualizarVuelo,
  cambiarEstadoVuelo,
  reprogramarVuelo,
  cambiarPuertaVuelo,
  cancelarVuelo,
  obtenerVuelosDePasajero,
};
