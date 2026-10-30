const { Op, fn, col } = require('sequelize');

const Vuelo = require('../models/vuelo.model');
const Puerta = require('../models/puerta.model');
const BandaEquipaje = require('../models/banda_equipaje.model');
const Aeropuerto = require('../models/aeropuerto.model');
const Pasajero = require('../models/pasajero.model');
const PasajeroVuelo = require('../models/pasajero_vuelo.model');
const Equipaje = require('../models/equipaje.model');
const EquipajeVuelo = require('../models/equipaje_vuelo.model');
const Notificacion = require('../models/notificacion.model');

const ESTADOS_EN_OPERACION = ['ABORDANDO', 'ABORDADO', 'EN_VUELO', 'RETRASADO'];
const ESTADOS_CON_PUERTA = ESTADOS_EN_OPERACION;

const aFechaHora = (fecha, hora) => new Date(`${fecha}T${hora || '00:00:00'}`);

const hhmm = (hora) => String(hora || '').slice(0, 5);

const fechaLocal = () => {
  const ahora = new Date();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');

  return `${ahora.getFullYear()}-${mes}-${dia}`;
};

const contarAgrupado = async (Modelo, campo, atributoClave, extra = {}) => {
  const filas = await Modelo.findAll({
    attributes: [atributoClave, [fn('COUNT', col(campo)), 'total']],
    group: [atributoClave],
    raw: true,
    ...extra,
  });

  return new Map(
    filas.map((fila) => [Number(fila[atributoClave]), Number(fila.total)])
  );
};

const serializarVuelo = (vuelo, pasajeros, equipajes) => {
  const capacidad = Number(vuelo.capacidad_pasajeros) || 0;

  return {
    id_vuelo: vuelo.id_vuelo,
    codigo_vuelo: vuelo.codigo_vuelo,
    estado: vuelo.estado,
    fecha_salida: vuelo.fecha_salida,
    hora_salida: hhmm(vuelo.hora_salida),
    fecha_llegada: vuelo.fecha_llegada,
    hora_llegada: hhmm(vuelo.hora_llegada),
    origen: {
      codigo_iata: vuelo.aeropuerto_origen?.codigo_iata || '',
      ciudad: vuelo.aeropuerto_origen?.ciudad || '',
    },
    destino: {
      codigo_iata: vuelo.aeropuerto_destino?.codigo_iata || '',
      ciudad: vuelo.aeropuerto_destino?.ciudad || '',
    },
    id_puerta: vuelo.id_puerta,
    puerta: vuelo.puerta
      ? {
          id_puerta: vuelo.puerta.id_puerta,
          numero: vuelo.puerta.numero,
          zona: vuelo.puerta.zona,
        }
      : null,
    capacidad_pasajeros: capacidad,
    pasajeros,
    equipajes,
    ocupacion_pct:
      capacidad > 0 ? Math.round((pasajeros / capacidad) * 1000) / 10 : 0,
  };
};

const elegirVueloDePuerta = (vuelos, ahora) => {
  const enCurso = vuelos.find((vuelo) =>
    ESTADOS_EN_OPERACION.includes(vuelo.estado)
  );

  if (enCurso) {
    return { vuelo: enCurso, tipo: 'EN_CURSO' };
  }

  const proximos = vuelos
    .filter(
      (vuelo) =>
        ['PROGRAMADO', 'RETRASADO'].includes(vuelo.estado) &&
        aFechaHora(vuelo.fecha_salida, vuelo.hora_salida) >= ahora
    )
    .sort(
      (a, b) =>
        aFechaHora(a.fecha_salida, a.hora_salida) -
        aFechaHora(b.fecha_salida, b.hora_salida)
    );

  if (proximos.length) {
    return { vuelo: proximos[0], tipo: 'PROXIMO' };
  }

  const anteriores = vuelos
    .filter((vuelo) => vuelo.estado !== 'CANCELADO')
    .sort(
      (a, b) =>
        aFechaHora(b.fecha_salida, b.hora_salida) -
        aFechaHora(a.fecha_salida, a.hora_salida)
    );

  return anteriores.length
    ? { vuelo: anteriores[0], tipo: 'ULTIMO' }
    : { vuelo: null, tipo: null };
};

const obtenerPanel = async () => {
  const ahora = new Date();
  const hoy = fechaLocal();

  const [
    vuelos,
    puertas,
    bandas,
    pasajerosPorVuelo,
    equipajesPorVuelo,
    equipajesPorBanda,
    notificaciones,
    totalEquipajes,
    equipajesEnProceso,
    incidenciasEquipaje,
    notificacionesPendientes,
  ] = await Promise.all([
    Vuelo.findAll({
      include: [
        {
          model: Aeropuerto,
          as: 'aeropuerto_origen',
          attributes: ['codigo_iata', 'ciudad'],
        },
        {
          model: Aeropuerto,
          as: 'aeropuerto_destino',
          attributes: ['codigo_iata', 'ciudad'],
        },
        { model: Puerta, as: 'puerta', attributes: ['id_puerta', 'numero', 'zona'] },
      ],
      order: [
        ['fecha_salida', 'ASC'],
        ['hora_salida', 'ASC'],
      ],
      limit: 300,
    }),
    Puerta.findAll({ order: [['numero', 'ASC']] }),
    BandaEquipaje.findAll({ order: [['numero', 'ASC']] }),
    contarAgrupado(
      PasajeroVuelo,
      'id_pasajero_vuelo',
      'id_vuelo',
      { where: { estado: { [Op.ne]: 'CANCELADO' } } }
    ),
    contarAgrupado(EquipajeVuelo, 'id_equipaje_vuelo', 'id_vuelo'),
    contarAgrupado(
      Equipaje,
      'id_equipaje',
      'id_banda_actual',
      { where: { id_banda_actual: { [Op.ne]: null } } }
    ),
    Notificacion.findAll({
      include: [
        {
          model: Pasajero,
          as: 'pasajero',
          attributes: ['nombres', 'apellidos'],
        },
      ],
      order: [['fecha_envio', 'DESC']],
      limit: 12,
    }),
    Equipaje.count(),
    Equipaje.count({ where: { estado: { [Op.ne]: 'ENTREGADO' } } }),
    Equipaje.count({
      where: { estado: { [Op.in]: ['EXTRAVIADO', 'DANADO'] } },
    }),
    Notificacion.count({ where: { leida: false } }),
  ]);

  const vuelosJson = vuelos.map((vuelo) =>
    serializarVuelo(
      vuelo,
      pasajerosPorVuelo.get(vuelo.id_vuelo) || 0,
      equipajesPorVuelo.get(vuelo.id_vuelo) || 0
    )
  );

  const puertasJson = puertas.map((puerta) => {
    const vuelosDePuerta = vuelosJson.filter(
      (vuelo) =>
        vuelo.id_puerta === puerta.id_puerta && vuelo.estado !== 'CANCELADO'
    );
    const { vuelo, tipo } = elegirVueloDePuerta(vuelosDePuerta, ahora);

    let estadoOperativo = puerta.estado;

    if (puerta.estado === 'DISPONIBLE') {
      estadoOperativo =
        tipo === 'EN_CURSO' ? 'OCUPADA' : 'DISPONIBLE';
    }

    return {
      id_puerta: puerta.id_puerta,
      numero: puerta.numero,
      zona: puerta.zona,
      estado: puerta.estado,
      estado_operativo: estadoOperativo,
      ocupada: tipo === 'EN_CURSO',
      vuelo,
      tipo_vuelo: tipo,
    };
  });

  const bandasJson = bandas.map((banda) => {
    const cantidad = equipajesPorBanda.get(banda.id_banda) || 0;

    return {
      id_banda: banda.id_banda,
      numero: banda.numero,
      zona: banda.zona,
      estado: banda.estado,
      estado_operativo:
        banda.estado === 'DISPONIBLE'
          ? cantidad > 0
            ? 'EN_USO'
            : 'DISPONIBLE'
          : banda.estado,
      equipajes: cantidad,
    };
  });

  const vuelosActivos = vuelosJson.filter(
    (vuelo) => !['CANCELADO', 'FINALIZADO', 'ATERRIZADO'].includes(vuelo.estado)
  );

  const pasajerosActivos = vuelosActivos.reduce(
    (total, vuelo) => total + vuelo.pasajeros,
    0
  );

  return {
    generado_en: new Date().toISOString(),
    kpis: {
      vuelos_total: vuelosJson.length,
      vuelos_hoy: vuelosJson.filter((vuelo) => vuelo.fecha_salida === hoy)
        .length,
      vuelos_programados: vuelosJson.filter(
        (vuelo) => vuelo.estado === 'PROGRAMADO'
      ).length,
      vuelos_en_operacion: vuelosJson.filter((vuelo) =>
        ESTADOS_CON_PUERTA.includes(vuelo.estado)
      ).length,
      vuelos_cancelados: vuelosJson.filter(
        (vuelo) => vuelo.estado === 'CANCELADO'
      ).length,
      pasajeros_activos: pasajerosActivos,
      equipajes_total: totalEquipajes,
      equipajes_en_proceso: equipajesEnProceso,
      incidencias_equipaje: incidenciasEquipaje,
      notificaciones_pendientes: notificacionesPendientes,
      puertas_total: puertasJson.length,
      puertas_ocupadas: puertasJson.filter((puerta) => puerta.ocupada).length,
      puertas_disponibles: puertasJson.filter(
        (puerta) => puerta.estado_operativo === 'DISPONIBLE'
      ).length,
      puertas_mantenimiento: puertasJson.filter(
        (puerta) => puerta.estado === 'MANTENIMIENTO'
      ).length,
      bandas_en_uso: bandasJson.filter(
        (banda) => banda.estado_operativo === 'EN_USO'
      ).length,
    },
    vuelos: vuelosJson,
    puertas: puertasJson,
    bandas: bandasJson,
    notificaciones: notificaciones.map((notificacion) => ({
      id_notificacion: notificacion.id_notificacion,
      tipo: notificacion.tipo,
      titulo: notificacion.titulo,
      mensaje: notificacion.mensaje,
      leida: notificacion.leida,
      fecha_envio: notificacion.fecha_envio,
      pasajero: notificacion.pasajero
        ? `${notificacion.pasajero.nombres} ${notificacion.pasajero.apellidos}`
        : 'Pasajero',
    })),
  };
};

module.exports = { obtenerPanel };
