const sequelize = require('../db/database');
const Equipaje = require('../models/equipaje.model');
const EquipajeVuelo = require('../models/equipaje_vuelo.model');
const Vuelo = require('../models/vuelo.model');
const BandaEquipaje = require('../models/banda_equipaje.model');
const Aeropuerto = require('../models/aeropuerto.model');
const Pasajero = require('../models/pasajero.model');

const { ErrorConEstado } = require('../lib/errores');
const { registrarMovimientoEquipaje } = require('./historial.service');
const { crearNotificacionPasajero } = require('./notificacion.service');

const ESTADOS_QUE_PERMITEN_REGISTRO = [
  'PROGRAMADO',
  'RETRASADO',
  'ABORDANDO',
  'ABORDADO',
];

const TRANSICIONES_EQUIPAJE = {
  REGISTRADO: ['EN_TRANSITO', 'EN_BANDA', 'CARGADO', 'EXTRAVIADO', 'DANADO'],
  EN_TRANSITO: ['CARGADO', 'TRANSFERIDO', 'EN_BANDA', 'EXTRAVIADO', 'DANADO'],
  CARGADO: ['TRANSFERIDO', 'EN_BANDA', 'EXTRAVIADO', 'DANADO'],
  TRANSFERIDO: ['CARGADO', 'EN_TRANSITO', 'EN_BANDA', 'EXTRAVIADO', 'DANADO'],
  EN_BANDA: ['ENTREGADO', 'EXTRAVIADO', 'DANADO'],
  EXTRAVIADO: ['EN_TRANSITO', 'EN_BANDA', 'ENTREGADO', 'DANADO'],
  DANADO: ['ENTREGADO', 'EXTRAVIADO'],
  ENTREGADO: [],
};

const INCLUDE_EQUIPAJE = [
  { model: Pasajero, as: 'pasajero' },
  { model: Aeropuerto, as: 'aeropuertoOrigen' },
  { model: Aeropuerto, as: 'aeropuertoDestino' },
  { model: BandaEquipaje, as: 'bandaActual' },
];

const obtenerEquipaje = (idEquipaje, transaction) =>
  Equipaje.findByPk(idEquipaje, {
    include: INCLUDE_EQUIPAJE,
    transaction,
  });

const validarTransicionEquipaje = (estadoActual, estadoNuevo) => {
  if (estadoActual === estadoNuevo) {
    throw new ErrorConEstado(
      400,
      `El equipaje ya se encuentra en estado ${estadoNuevo}`
    );
  }

  if (!TRANSICIONES_EQUIPAJE[estadoActual]?.includes(estadoNuevo)) {
    throw new ErrorConEstado(
      400,
      `No se puede cambiar el equipaje de ${estadoActual} a ${estadoNuevo}`
    );
  }
};

const validarBanda = async (idBanda, transaction) => {
  if (!idBanda) {
    return null;
  }

  const banda = await BandaEquipaje.findByPk(idBanda, {
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined,
  });

  if (!banda) {
    throw new ErrorConEstado(400, 'La banda de equipaje no existe');
  }

  if (banda.estado !== 'DISPONIBLE') {
    throw new ErrorConEstado(
      400,
      `La banda ${banda.numero} está en estado ${banda.estado}`
    );
  }

  return banda;
};

const registrarTramo = async ({ idEquipaje, datos, contexto }) => {
  return sequelize.transaction(async (transaction) => {
    const equipaje = await Equipaje.findByPk(idEquipaje, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!equipaje) {
      throw new ErrorConEstado(404, 'Equipaje no encontrado');
    }

    if (equipaje.estado === 'ENTREGADO') {
      throw new ErrorConEstado(
        400,
        'No se pueden registrar tramos de un equipaje ya entregado'
      );
    }

    // PostgreSQL no permite FOR UPDATE sobre el lado nullable de un JOIN,
    // por eso se bloquea el vuelo sin includes y luego se recarga con ellos.
    const vueloBloqueado = await Vuelo.findByPk(datos.id_vuelo, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!vueloBloqueado) {
      throw new ErrorConEstado(400, 'El vuelo seleccionado no existe');
    }

    const vuelo = await Vuelo.findByPk(datos.id_vuelo, {
      transaction,
      include: [
        { model: Aeropuerto, as: 'aeropuerto_origen' },
        { model: Aeropuerto, as: 'aeropuerto_destino' },
      ],
    });

    if (!ESTADOS_QUE_PERMITEN_REGISTRO.includes(vuelo.estado)) {
      throw new ErrorConEstado(
        400,
        `No se puede asignar equipaje a un vuelo en estado ${vuelo.estado}`
      );
    }

    const existente = await EquipajeVuelo.findOne({
      where: { id_equipaje: idEquipaje, id_vuelo: vuelo.id_vuelo },
      transaction,
    });

    if (existente) {
      throw new ErrorConEstado(
        409,
        'El equipaje ya está registrado en este vuelo'
      );
    }

    const ultimoTramo = await EquipajeVuelo.findOne({
      where: { id_equipaje: idEquipaje },
      include: [{ model: Vuelo, as: 'vuelo' }],
      order: [['orden_vuelo', 'DESC']],
      transaction,
    });

    let ordenVuelo = 1;

    if (ultimoTramo) {
      const vueloAnterior = ultimoTramo.vuelo;

      if (!vueloAnterior) {
        throw new ErrorConEstado(
          400,
          'No se pudo determinar el tramo anterior del equipaje'
        );
      }

      if (
        vueloAnterior.id_aeropuerto_destino !== vuelo.id_aeropuerto_origen
      ) {
        throw new ErrorConEstado(
          400,
          `El vuelo ${vuelo.codigo_vuelo} no continúa desde el destino del tramo anterior`
        );
      }

      ordenVuelo = ultimoTramo.orden_vuelo + 1;
    } else if (equipaje.origen !== vuelo.id_aeropuerto_origen) {
      throw new ErrorConEstado(
        400,
        'El primer tramo debe iniciar en el aeropuerto de origen del equipaje'
      );
    }

    const bandaOrigen = await validarBanda(
      datos.id_banda_origen,
      transaction
    );
    const bandaDestino = await validarBanda(
      datos.id_banda_destino,
      transaction
    );

    const tramo = await EquipajeVuelo.create(
      {
        id_equipaje: idEquipaje,
        id_vuelo: vuelo.id_vuelo,
        id_banda_origen: bandaOrigen?.id_banda ?? null,
        id_banda_destino: bandaDestino?.id_banda ?? null,
        orden_vuelo: ordenVuelo,
        estado: 'REGISTRADO',
        registrado_por: contexto.idUsuario,
      },
      { transaction }
    );

    const estadoAnterior = equipaje.estado;

    await equipaje.update(
      {
        estado: 'EN_TRANSITO',
        id_banda_actual: null,
      },
      { transaction }
    );

    const origen = vuelo.aeropuerto_origen?.codigo_iata || 'origen';
    const destino = vuelo.aeropuerto_destino?.codigo_iata || 'destino';
    const ubicacion = `Vuelo ${vuelo.codigo_vuelo} (${origen} → ${destino})`;
    const esConexion = ordenVuelo > 1;
    const observaciones =
      datos.observaciones ||
      (esConexion
        ? 'Equipaje transferido automáticamente sin retiro del pasajero'
        : 'Equipaje registrado para el vuelo');

    await registrarMovimientoEquipaje({
      idEquipaje,
      ubicacion,
      idBanda: bandaOrigen?.id_banda ?? null,
      idVuelo: vuelo.id_vuelo,
      estadoAnterior,
      estadoNuevo: 'EN_TRANSITO',
      observaciones,
      idUsuario: contexto.idUsuario,
      transaction,
    });

    await crearNotificacionPasajero({
      idPasajero: equipaje.id_pasajero,
      idVuelo: vuelo.id_vuelo,
      idEquipaje,
      tipo: esConexion ? 'ESCALA' : 'INFORMACION_GENERAL',
      titulo: esConexion ? 'Equipaje en conexión' : 'Equipaje registrado',
      mensaje: esConexion
        ? `Tu equipaje ${equipaje.codigo_equipaje} continuará en el vuelo ${vuelo.codigo_vuelo} de ${origen} a ${destino}. No necesitas retirarlo.`
        : `Tu equipaje ${equipaje.codigo_equipaje} fue asignado al vuelo ${vuelo.codigo_vuelo} de ${origen} a ${destino}.`,
      transaction,
    });

    return {
      equipaje_vuelo: tramo,
      equipaje: await obtenerEquipaje(idEquipaje, transaction),
    };
  });
};

const cambiarBanda = async ({ idEquipaje, datos, contexto }) => {
  return sequelize.transaction(async (transaction) => {
    const equipaje = await Equipaje.findByPk(idEquipaje, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!equipaje) {
      throw new ErrorConEstado(404, 'Equipaje no encontrado');
    }

    if (equipaje.estado === 'ENTREGADO') {
      throw new ErrorConEstado(
        400,
        'No se puede cambiar la banda de un equipaje entregado'
      );
    }

    const banda = await validarBanda(datos.id_banda, transaction);
    const estadoAnterior = equipaje.estado;

    await equipaje.update(
      {
        id_banda_actual: banda.id_banda,
        estado: 'EN_BANDA',
      },
      { transaction }
    );

    await registrarMovimientoEquipaje({
      idEquipaje,
      ubicacion:
        datos.ubicacion ||
        `Banda ${banda.numero}${banda.zona ? ` (${banda.zona})` : ''}`,
      idBanda: banda.id_banda,
      estadoAnterior,
      estadoNuevo: 'EN_BANDA',
      observaciones: 'Equipaje colocado en banda de entrega',
      idUsuario: contexto.idUsuario,
      transaction,
    });

    await crearNotificacionPasajero({
      idPasajero: equipaje.id_pasajero,
      idEquipaje,
      tipo: 'BANDA_EQUIPAJE',
      titulo: 'Equipaje en banda',
      mensaje: `Tu equipaje ${equipaje.codigo_equipaje} está disponible en la banda ${banda.numero}${
        banda.zona ? ` (${banda.zona})` : ''
      }.`,
      transaction,
    });

    return obtenerEquipaje(idEquipaje, transaction);
  });
};

const cambiarEstado = async ({ idEquipaje, datos, contexto }) => {
  return sequelize.transaction(async (transaction) => {
    const equipaje = await Equipaje.findByPk(idEquipaje, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!equipaje) {
      throw new ErrorConEstado(404, 'Equipaje no encontrado');
    }

    validarTransicionEquipaje(equipaje.estado, datos.estado);

    const estadoAnterior = equipaje.estado;

    await equipaje.update({ estado: datos.estado }, { transaction });

    await registrarMovimientoEquipaje({
      idEquipaje,
      ubicacion: datos.ubicacion || null,
      idBanda: equipaje.id_banda_actual,
      idVuelo: datos.id_vuelo || null,
      estadoAnterior,
      estadoNuevo: datos.estado,
      observaciones: `Cambio de estado a ${datos.estado}`,
      idUsuario: contexto.idUsuario,
      transaction,
    });

    const mensajes = {
      EXTRAVIADO: {
        titulo: 'Equipaje extraviado',
        mensaje: `Tu equipaje ${equipaje.codigo_equipaje} fue reportado como extraviado. El aeropuerto está gestionando su localización.`,
      },
      DANADO: {
        titulo: 'Incidencia con tu equipaje',
        mensaje: `Tu equipaje ${equipaje.codigo_equipaje} presenta una incidencia de daño.`,
      },
      ENTREGADO: {
        titulo: 'Equipaje entregado',
        mensaje: `Tu equipaje ${equipaje.codigo_equipaje} fue entregado correctamente.`,
      },
    };

    if (mensajes[datos.estado]) {
      await crearNotificacionPasajero({
        idPasajero: equipaje.id_pasajero,
        idEquipaje,
        tipo: 'INFORMACION_GENERAL',
        ...mensajes[datos.estado],
        transaction,
      });
    }

    return obtenerEquipaje(idEquipaje, transaction);
  });
};

const obtenerEquipajesDePasajero = async (idPasajero) => {
  return Equipaje.findAll({
    where: { id_pasajero: idPasajero },
    include: INCLUDE_EQUIPAJE,
    order: [['created_at', 'DESC']],
  });
};

module.exports = {
  TRANSICIONES_EQUIPAJE,
  registrarTramo,
  cambiarBanda,
  cambiarEstado,
  obtenerEquipajesDePasajero,
};
