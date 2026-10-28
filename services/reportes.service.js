const { QueryTypes } = require('sequelize');

const sequelize = require('../db/database');
const { ErrorConEstado } = require('../lib/errores');

// ============================================================
// Utilidades
// ============================================================

const consultar = (sql, replacements) =>
  sequelize.query(sql, { replacements, type: QueryTypes.SELECT });

const where = (condiciones) =>
  condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

const andOn = (condiciones) =>
  condiciones.length ? ` AND ${condiciones.join(' AND ')}` : '';

const col = (clave, titulo, opciones = {}) => ({
  clave,
  titulo,
  tipo: 'texto',
  ...opciones,
});

const numero = (clave, titulo, sumar = true) =>
  col(clave, titulo, { tipo: 'numero', sumar });

// Filtros comunes sobre la tabla vuelos (alias configurable).
const filtrosVuelo = (filtros, alias = 'v') => {
  const condiciones = [];
  const reemplazos = {};

  if (filtros.fecha_desde) {
    condiciones.push(`${alias}.fecha_salida >= CAST(:fechaDesde AS date)`);
    reemplazos.fechaDesde = filtros.fecha_desde;
  }

  if (filtros.fecha_hasta) {
    condiciones.push(`${alias}.fecha_salida <= CAST(:fechaHasta AS date)`);
    reemplazos.fechaHasta = filtros.fecha_hasta;
  }

  if (filtros.estado) {
    condiciones.push(`${alias}.estado::text = :estado`);
    reemplazos.estado = filtros.estado;
  }

  if (filtros.id_aeropuerto) {
    condiciones.push(
      `(${alias}.id_aeropuerto_origen = :idAeropuerto OR ` +
        `${alias}.id_aeropuerto_destino = :idAeropuerto)`
    );
    reemplazos.idAeropuerto = filtros.id_aeropuerto;
  }

  if (filtros.id_puerta) {
    condiciones.push(`${alias}.id_puerta = :idPuerta`);
    reemplazos.idPuerta = filtros.id_puerta;
  }

  if (filtros.id_vuelo) {
    condiciones.push(`${alias}.id_vuelo = :idVuelo`);
    reemplazos.idVuelo = filtros.id_vuelo;
  }

  return { condiciones, reemplazos };
};

// Rango de fechas sobre una columna concreta.
const filtrosFecha = (filtros, columna, aliasColumnas = null) => {
  const condiciones = [];
  const reemplazos = {};
  const columnaFecha = aliasColumnas
    ? `${aliasColumnas}.${columna}`
    : columna;

  if (filtros.fecha_desde) {
    condiciones.push(
      `${columnaFecha}::date >= CAST(:fechaDesde AS date)`
    );
    reemplazos.fechaDesde = filtros.fecha_desde;
  }

  if (filtros.fecha_hasta) {
    condiciones.push(
      `${columnaFecha}::date <= CAST(:fechaHasta AS date)`
    );
    reemplazos.fechaHasta = filtros.fecha_hasta;
  }

  return { condiciones, reemplazos };
};

// Una fila por vuelo con su número de pasajeros activos. Evita duplicar
// capacidades al unirlo con otras tablas.
const SUBCONSULTA_PASAJEROS = `
  SELECT id_vuelo, COUNT(*)::int AS pasajeros
  FROM pasajero_vuelo
  WHERE estado <> 'CANCELADO'
  GROUP BY id_vuelo
`;

const SUBCONSULTA_EQUIPAJE = `
  SELECT id_vuelo, COUNT(*)::int AS equipajes
  FROM equipaje_vuelo
  GROUP BY id_vuelo
`;

// ============================================================
// Catálogo de reportes
// ============================================================

const REPORTES = {
  'vuelos-por-estado': {
    titulo: 'Vuelos por estado',
    descripcion:
      'Distribución de vuelos y capacidad ofrecida según el estado operativo.',
    filtros: ['fecha_desde', 'fecha_hasta', 'estado'],
    columnas: [
      col('estado', 'Estado'),
      numero('vuelos', 'Vuelos'),
      numero('capacidad_total', 'Capacidad total'),
    ],
    async consulta(filtros) {
      const { condiciones, reemplazos } = filtrosVuelo(filtros);
      return consultar(
        `SELECT v.estado::text AS estado,
                COUNT(*)::int AS vuelos,
                COALESCE(SUM(v.capacidad_pasajeros), 0)::int AS capacidad_total
         FROM vuelos v
         ${where(condiciones)}
         GROUP BY v.estado
         ORDER BY vuelos DESC, estado ASC`,
        reemplazos
      );
    },
  },

  'vuelos-por-destino': {
    titulo: 'Vuelos por aeropuerto de destino',
    descripcion:
      'Vuelos, capacidad y pasajeros agrupados por aeropuerto de destino.',
    filtros: ['fecha_desde', 'fecha_hasta', 'estado'],
    columnas: [
      col('codigo_iata', 'IATA'),
      col('nombre', 'Aeropuerto'),
      col('ciudad', 'Ciudad'),
      col('pais', 'País'),
      numero('vuelos', 'Vuelos'),
      numero('capacidad_total', 'Capacidad'),
      numero('pasajeros', 'Pasajeros'),
    ],
    async consulta(filtros) {
      const { condiciones, reemplazos } = filtrosVuelo(filtros);
      return consultar(
        `SELECT a.codigo_iata AS codigo_iata,
                a.nombre AS nombre,
                a.ciudad AS ciudad,
                a.pais AS pais,
                COUNT(*)::int AS vuelos,
                COALESCE(SUM(v.capacidad_pasajeros), 0)::int AS capacidad_total,
                COALESCE(SUM(pv.pasajeros), 0)::int AS pasajeros
         FROM vuelos v
         JOIN aeropuertos a ON a.id_aeropuerto = v.id_aeropuerto_destino
         LEFT JOIN (${SUBCONSULTA_PASAJEROS}) pv ON pv.id_vuelo = v.id_vuelo
         ${where(condiciones)}
         GROUP BY a.id_aeropuerto, a.codigo_iata, a.nombre, a.ciudad, a.pais
         ORDER BY vuelos DESC, codigo_iata ASC`,
        reemplazos
      );
    },
  },

  'vuelos-por-origen': {
    titulo: 'Vuelos por aeropuerto de origen',
    descripcion:
      'Vuelos, capacidad y pasajeros agrupados por aeropuerto de origen.',
    filtros: ['fecha_desde', 'fecha_hasta', 'estado'],
    columnas: [
      col('codigo_iata', 'IATA'),
      col('nombre', 'Aeropuerto'),
      col('ciudad', 'Ciudad'),
      col('pais', 'País'),
      numero('vuelos', 'Vuelos'),
      numero('capacidad_total', 'Capacidad'),
      numero('pasajeros', 'Pasajeros'),
    ],
    async consulta(filtros) {
      const { condiciones, reemplazos } = filtrosVuelo(filtros);
      return consultar(
        `SELECT a.codigo_iata AS codigo_iata,
                a.nombre AS nombre,
                a.ciudad AS ciudad,
                a.pais AS pais,
                COUNT(*)::int AS vuelos,
                COALESCE(SUM(v.capacidad_pasajeros), 0)::int AS capacidad_total,
                COALESCE(SUM(pv.pasajeros), 0)::int AS pasajeros
         FROM vuelos v
         JOIN aeropuertos a ON a.id_aeropuerto = v.id_aeropuerto_origen
         LEFT JOIN (${SUBCONSULTA_PASAJEROS}) pv ON pv.id_vuelo = v.id_vuelo
         ${where(condiciones)}
         GROUP BY a.id_aeropuerto, a.codigo_iata, a.nombre, a.ciudad, a.pais
         ORDER BY vuelos DESC, codigo_iata ASC`,
        reemplazos
      );
    },
  },

  'ocupacion-por-puerta': {
    titulo: 'Ocupación por puerta de embarque',
    descripcion:
      'Vuelos, pasajeros y porcentaje de ocupación por puerta en el rango de fechas.',
    filtros: ['fecha_desde', 'fecha_hasta', 'zona', 'id_puerta'],
    columnas: [
      col('puerta', 'Puerta'),
      col('zona', 'Zona'),
      col('estado_puerta', 'Estado puerta'),
      numero('vuelos', 'Vuelos'),
      numero('pasajeros', 'Pasajeros'),
      numero('capacidad_total', 'Capacidad'),
      col('ocupacion_pct', 'Ocupación %', { tipo: 'numero' }),
    ],
    async consulta(filtros) {
      const { condiciones, reemplazos } = filtrosVuelo(filtros, 'v');
      condiciones.push("v.estado <> 'CANCELADO'");
      const filtrosPuerta = [];

      if (filtros.zona) {
        filtrosPuerta.push('p.zona = :zona');
        reemplazos.zona = filtros.zona;
      }

      if (filtros.id_puerta) {
        filtrosPuerta.push('p.id_puerta = :idPuerta');
        reemplazos.idPuerta = filtros.id_puerta;
      }

      filtrosPuerta.push("p.estado <> 'INACTIVA'");

      return consultar(
        `SELECT p.numero AS puerta,
                COALESCE(p.zona, '') AS zona,
                p.estado::text AS estado_puerta,
                COUNT(v.id_vuelo)::int AS vuelos,
                COALESCE(SUM(v.pasajeros), 0)::int AS pasajeros,
                COALESCE(SUM(v.capacidad_pasajeros), 0)::int AS capacidad_total,
                CASE
                  WHEN COALESCE(SUM(v.capacidad_pasajeros), 0) > 0
                  THEN ROUND(
                    100.0 * COALESCE(SUM(v.pasajeros), 0) /
                    SUM(v.capacidad_pasajeros), 2
                  )
                  ELSE 0
                END::float8 AS ocupacion_pct
         FROM puertas p
         LEFT JOIN (
           SELECT v.*,
                  (SELECT COUNT(*) FROM pasajero_vuelo pv
                   WHERE pv.id_vuelo = v.id_vuelo
                     AND pv.estado <> 'CANCELADO')::int AS pasajeros
           FROM vuelos v
           ${where(condiciones)}
         ) v ON v.id_puerta = p.id_puerta
         WHERE ${filtrosPuerta.join(' AND ')}
         GROUP BY p.id_puerta, p.numero, p.zona, p.estado
         ORDER BY p.numero ASC`,
        reemplazos
      );
    },
  },

  'ocupacion-por-vuelo': {
    titulo: 'Ocupación por vuelo',
    descripcion:
      'Pasajeros asignados, asientos disponibles y ocupación de cada vuelo.',
    filtros: [
      'fecha_desde',
      'fecha_hasta',
      'estado',
      'id_aeropuerto',
      'id_puerta',
    ],
    columnas: [
      col('codigo_vuelo', 'Vuelo'),
      col('fecha_salida', 'Fecha salida'),
      col('hora_salida', 'Hora'),
      col('origen', 'Origen'),
      col('destino', 'Destino'),
      col('estado', 'Estado'),
      numero('capacidad', 'Capacidad'),
      numero('pasajeros', 'Pasajeros'),
      numero('disponibles', 'Disponibles'),
      col('ocupacion_pct', 'Ocupación %', { tipo: 'numero' }),
    ],
    async consulta(filtros) {
      const { condiciones, reemplazos } = filtrosVuelo(filtros);
      return consultar(
        `SELECT v.codigo_vuelo AS codigo_vuelo,
                to_char(v.fecha_salida, 'YYYY-MM-DD') AS fecha_salida,
                to_char(v.hora_salida, 'HH24:MI') AS hora_salida,
                ao.codigo_iata AS origen,
                ad.codigo_iata AS destino,
                v.estado::text AS estado,
                v.capacidad_pasajeros::int AS capacidad,
                COALESCE(pv.pasajeros, 0)::int AS pasajeros,
                GREATEST(v.capacidad_pasajeros - COALESCE(pv.pasajeros, 0), 0)::int
                  AS disponibles,
                CASE
                  WHEN v.capacidad_pasajeros > 0
                  THEN ROUND(
                    100.0 * COALESCE(pv.pasajeros, 0) /
                    v.capacidad_pasajeros, 2
                  )
                  ELSE 0
                END::float8 AS ocupacion_pct
         FROM vuelos v
         JOIN aeropuertos ao ON ao.id_aeropuerto = v.id_aeropuerto_origen
         JOIN aeropuertos ad ON ad.id_aeropuerto = v.id_aeropuerto_destino
         LEFT JOIN (${SUBCONSULTA_PASAJEROS}) pv ON pv.id_vuelo = v.id_vuelo
         ${where(condiciones)}
         ORDER BY v.fecha_salida ASC, v.hora_salida ASC, v.codigo_vuelo ASC`,
        reemplazos
      );
    },
  },

  'demanda-por-ruta': {
    titulo: 'Demanda por ruta',
    descripcion:
      'Pasajeros y equipajes movilizados por cada par origen–destino.',
    filtros: ['fecha_desde', 'fecha_hasta', 'estado'],
    columnas: [
      col('origen', 'Origen'),
      col('destino', 'Destino'),
      numero('vuelos', 'Vuelos'),
      numero('pasajeros', 'Pasajeros'),
      numero('equipajes', 'Equipajes'),
    ],
    async consulta(filtros) {
      const { condiciones, reemplazos } = filtrosVuelo(filtros);
      return consultar(
        `SELECT ao.codigo_iata AS origen,
                ad.codigo_iata AS destino,
                COUNT(*)::int AS vuelos,
                COALESCE(SUM(pv.pasajeros), 0)::int AS pasajeros,
                COALESCE(SUM(ev.equipajes), 0)::int AS equipajes
         FROM vuelos v
         JOIN aeropuertos ao ON ao.id_aeropuerto = v.id_aeropuerto_origen
         JOIN aeropuertos ad ON ad.id_aeropuerto = v.id_aeropuerto_destino
         LEFT JOIN (${SUBCONSULTA_PASAJEROS}) pv ON pv.id_vuelo = v.id_vuelo
         LEFT JOIN (${SUBCONSULTA_EQUIPAJE}) ev ON ev.id_vuelo = v.id_vuelo
         ${where(condiciones)}
         GROUP BY ao.codigo_iata, ad.codigo_iata
         ORDER BY pasajeros DESC, vuelos DESC, origen ASC, destino ASC`,
        reemplazos
      );
    },
  },

  'equipaje-por-estado': {
    titulo: 'Equipaje por estado',
    descripcion:
      'Cantidad de equipajes, peso total y peso promedio según su estado actual.',
    filtros: ['fecha_desde', 'fecha_hasta', 'estado'],
    columnas: [
      col('estado', 'Estado'),
      numero('equipajes', 'Equipajes'),
      numero('peso_total', 'Peso total (kg)'),
      col('peso_promedio', 'Peso promedio (kg)', { tipo: 'numero' }),
    ],
    async consulta(filtros) {
      const { condiciones, reemplazos } = filtrosFecha(
        filtros,
        'created_at',
        'e'
      );

      if (filtros.estado) {
        condiciones.push('e.estado::text = :estado');
        reemplazos.estado = filtros.estado;
      }

      return consultar(
        `SELECT e.estado::text AS estado,
                COUNT(*)::int AS equipajes,
                COALESCE(SUM(e.peso), 0)::float8 AS peso_total,
                COALESCE(ROUND(AVG(e.peso), 2), 0)::float8 AS peso_promedio
         FROM equipajes e
         ${where(condiciones)}
         GROUP BY e.estado
         ORDER BY equipajes DESC, estado ASC`,
        reemplazos
      );
    },
  },

  'equipaje-por-banda': {
    titulo: 'Equipaje por banda de entrega',
    descripcion:
      'Equipajes y peso recibidos por cada banda, filtrable por zona y banda.',
    filtros: ['fecha_desde', 'fecha_hasta', 'zona', 'id_banda'],
    columnas: [
      col('banda', 'Banda'),
      col('zona', 'Zona'),
      col('estado_banda', 'Estado banda'),
      numero('equipajes', 'Equipajes'),
      numero('peso_total', 'Peso total (kg)'),
    ],
    async consulta(filtros) {
      const { condiciones, reemplazos } = filtrosFecha(
        filtros,
        'created_at',
        'e'
      );
      const filtrosBanda = [];

      if (filtros.zona) {
        filtrosBanda.push('b.zona = :zona');
        reemplazos.zona = filtros.zona;
      }

      if (filtros.id_banda) {
        filtrosBanda.push('b.id_banda = :idBanda');
        reemplazos.idBanda = filtros.id_banda;
      }

      return consultar(
        `SELECT b.numero AS banda,
                COALESCE(b.zona, '') AS zona,
                b.estado::text AS estado_banda,
                COUNT(e.id_equipaje)::int AS equipajes,
                COALESCE(SUM(e.peso), 0)::float8 AS peso_total
         FROM bandas_equipaje b
         LEFT JOIN equipajes e
           ON e.id_banda_actual = b.id_banda${andOn(condiciones)}
         ${where(filtrosBanda)}
         GROUP BY b.id_banda, b.numero, b.zona, b.estado
         ORDER BY b.numero ASC`,
        reemplazos
      );
    },
  },

  'equipaje-conexiones': {
    titulo: 'Equipaje en conexión',
    descripcion:
      'Equipajes con más de un tramo, su ruta completa y número de conexiones.',
    filtros: ['fecha_desde', 'fecha_hasta', 'estado'],
    columnas: [
      col('codigo', 'Equipaje'),
      col('pasajero', 'Pasajero'),
      numero('tramos', 'Tramos'),
      col('ruta', 'Ruta'),
      col('estado', 'Estado'),
      col('peso', 'Peso (kg)', { tipo: 'numero' }),
    ],
    async consulta(filtros) {
      const { condiciones, reemplazos } = filtrosFecha(
        filtros,
        'created_at',
        'e'
      );

      if (filtros.estado) {
        condiciones.push('e.estado::text = :estado');
        reemplazos.estado = filtros.estado;
      }

      return consultar(
        `SELECT e.codigo_equipaje AS codigo,
                (p.nombres || ' ' || p.apellidos) AS pasajero,
                COUNT(ev.id_equipaje_vuelo)::int AS tramos,
                string_agg(v.codigo_vuelo, ' -> ' ORDER BY ev.orden_vuelo) AS ruta,
                e.estado::text AS estado,
                COALESCE(e.peso, 0)::float8 AS peso
         FROM equipajes e
         JOIN pasajeros p ON p.id_pasajero = e.id_pasajero
         JOIN equipaje_vuelo ev ON ev.id_equipaje = e.id_equipaje
         JOIN vuelos v ON v.id_vuelo = ev.id_vuelo
         ${where(condiciones)}
         GROUP BY e.id_equipaje, e.codigo_equipaje, p.nombres, p.apellidos,
                  e.estado, e.peso
         HAVING COUNT(ev.id_equipaje_vuelo) > 1
         ORDER BY tramos DESC, codigo ASC`,
        reemplazos
      );
    },
  },

  'incidencias-equipaje': {
    titulo: 'Incidencias de equipaje',
    descripcion:
      'Equipajes extraviados y dañados agrupados por mes y tipo de incidencia.',
    filtros: ['fecha_desde', 'fecha_hasta', 'tipo'],
    columnas: [
      col('mes', 'Mes'),
      col('tipo', 'Tipo'),
      numero('incidencias', 'Incidencias'),
    ],
    async consulta(filtros) {
      const { condiciones, reemplazos } = filtrosFecha(
        filtros,
        'fecha_registro',
        'h'
      );
      condiciones.push("h.estado_nuevo IN ('EXTRAVIADO', 'DANADO')");

      if (filtros.tipo) {
        condiciones.push('h.estado_nuevo = :tipo');
        reemplazos.tipo = filtros.tipo;
      }

      return consultar(
        `SELECT to_char(h.fecha_registro, 'YYYY-MM') AS mes,
                h.estado_nuevo AS tipo,
                COUNT(*)::int AS incidencias
         FROM historial_equipaje h
         ${where(condiciones)}
         GROUP BY mes, h.estado_nuevo
         ORDER BY mes DESC, incidencias DESC`,
        reemplazos
      );
    },
  },

  'notificaciones-por-tipo': {
    titulo: 'Notificaciones por tipo',
    descripcion:
      'Volumen de notificaciones, leídas y pendientes, con porcentaje de lectura.',
    filtros: ['fecha_desde', 'fecha_hasta', 'tipo'],
    columnas: [
      col('tipo', 'Tipo'),
      numero('total', 'Total'),
      numero('leidas', 'Leídas'),
      numero('pendientes', 'Pendientes'),
      col('lectura_pct', 'Lectura %', { tipo: 'numero' }),
    ],
    async consulta(filtros) {
      const { condiciones, reemplazos } = filtrosFecha(
        filtros,
        'fecha_envio',
        'n'
      );

      if (filtros.tipo) {
        condiciones.push('n.tipo::text = :tipo');
        reemplazos.tipo = filtros.tipo;
      }

      return consultar(
        `SELECT n.tipo::text AS tipo,
                COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE n.leida)::int AS leidas,
                COUNT(*) FILTER (WHERE NOT n.leida)::int AS pendientes,
                CASE
                  WHEN COUNT(*) > 0
                  THEN ROUND(
                    100.0 * COUNT(*) FILTER (WHERE n.leida) / COUNT(*), 2
                  )
                  ELSE 0
                END::float8 AS lectura_pct
         FROM notificaciones n
         ${where(condiciones)}
         GROUP BY n.tipo
         ORDER BY total DESC, tipo ASC`,
        reemplazos
      );
    },
  },

  'pasajeros-por-nacionalidad': {
    titulo: 'Pasajeros por nacionalidad',
    descripcion:
      'Pasajeros registrados y reservas activas agrupados por nacionalidad.',
    filtros: ['fecha_desde', 'fecha_hasta', 'estado_pasajero'],
    columnas: [
      col('nacionalidad', 'Nacionalidad'),
      numero('pasajeros', 'Pasajeros'),
      numero('reservas', 'Reservas'),
    ],
    async consulta(filtros) {
      const { condiciones, reemplazos } = filtrosFecha(
        filtros,
        'created_at',
        'p'
      );

      if (filtros.estado_pasajero) {
        condiciones.push('p.estado::text = :estadoPasajero');
        reemplazos.estadoPasajero = filtros.estado_pasajero;
      }

      return consultar(
        `SELECT COALESCE(NULLIF(p.nacionalidad, ''), 'Sin dato') AS nacionalidad,
                COUNT(*)::int AS pasajeros,
                COALESCE(SUM(x.reservas), 0)::int AS reservas
         FROM pasajeros p
         LEFT JOIN (
           SELECT id_pasajero, COUNT(*)::int AS reservas
           FROM pasajero_vuelo
           WHERE estado <> 'CANCELADO'
           GROUP BY id_pasajero
         ) x ON x.id_pasajero = p.id_pasajero
         ${where(condiciones)}
         GROUP BY 1
         ORDER BY pasajeros DESC, nacionalidad ASC`,
        reemplazos
      );
    },
  },

  'reservas-por-estado': {
    titulo: 'Reservas por estado',
    descripcion:
      'Reservas de pasajeros agrupadas por estado, con su participación porcentual.',
    filtros: ['fecha_desde', 'fecha_hasta', 'estado_reserva'],
    columnas: [
      col('estado', 'Estado reserva'),
      numero('reservas', 'Reservas'),
      numero('vuelos', 'Vuelos distintos'),
      numero('pasajeros', 'Pasajeros distintos'),
      col('porcentaje', 'Participación %', { tipo: 'numero' }),
    ],
    async consulta(filtros) {
      const { condiciones, reemplazos } = filtrosVuelo(filtros);

      if (filtros.estado_reserva) {
        condiciones.push('pv.estado::text = :estadoReserva');
        reemplazos.estadoReserva = filtros.estado_reserva;
      }

      return consultar(
        `SELECT pv.estado::text AS estado,
                COUNT(*)::int AS reservas,
                COUNT(DISTINCT pv.id_vuelo)::int AS vuelos,
                COUNT(DISTINCT pv.id_pasajero)::int AS pasajeros,
                ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2)::float8
                  AS porcentaje
         FROM pasajero_vuelo pv
         JOIN vuelos v ON v.id_vuelo = pv.id_vuelo
         ${where(condiciones)}
         GROUP BY pv.estado
         ORDER BY reservas DESC, estado ASC`,
        reemplazos
      );
    },
  },

  'escalas-por-aeropuerto': {
    titulo: 'Escalas por aeropuerto',
    descripcion:
      'Escalas por aeropuerto de llegada con desglose por estado operativo.',
    filtros: ['fecha_desde', 'fecha_hasta', 'estado'],
    columnas: [
      col('codigo_iata', 'IATA'),
      col('ciudad', 'Ciudad'),
      numero('escalas', 'Escalas'),
      numero('pendientes', 'Pendientes'),
      numero('en_transito', 'En tránsito'),
      numero('completadas', 'Completadas'),
      numero('canceladas', 'Canceladas'),
    ],
    async consulta(filtros) {
      const { condiciones, reemplazos } = filtrosFecha(
        filtros,
        'hora_llegada',
        'e'
      );

      if (filtros.estado) {
        condiciones.push('e.estado::text = :estado');
        reemplazos.estado = filtros.estado;
      }

      return consultar(
        `SELECT a.codigo_iata AS codigo_iata,
                a.ciudad AS ciudad,
                COUNT(*)::int AS escalas,
                COUNT(*) FILTER (WHERE e.estado = 'PENDIENTE')::int AS pendientes,
                COUNT(*) FILTER (WHERE e.estado = 'EN_TRANSITO')::int AS en_transito,
                COUNT(*) FILTER (WHERE e.estado = 'COMPLETADA')::int AS completadas,
                COUNT(*) FILTER (WHERE e.estado = 'CANCELADA')::int AS canceladas
         FROM escalas e
         JOIN aeropuertos a ON a.id_aeropuerto = e.aeropuerto_llegada
         ${where(condiciones)}
         GROUP BY a.id_aeropuerto, a.codigo_iata, a.ciudad
         ORDER BY escalas DESC, codigo_iata ASC`,
        reemplazos
      );
    },
  },

  'cambios-vuelos': {
    titulo: 'Cambios en vuelos',
    descripcion:
      'Historial de modificaciones agrupado por mes y campo modificado.',
    filtros: ['fecha_desde', 'fecha_hasta', 'campo'],
    columnas: [
      col('mes', 'Mes'),
      col('campo_modificado', 'Campo'),
      numero('cambios', 'Cambios'),
      numero('vuelos_afectados', 'Vuelos afectados'),
    ],
    async consulta(filtros) {
      const { condiciones, reemplazos } = filtrosFecha(
        filtros,
        'fecha_modificacion',
        'h'
      );

      if (filtros.campo) {
        condiciones.push('h.campo_modificado = :campo');
        reemplazos.campo = filtros.campo;
      }

      return consultar(
        `SELECT to_char(h.fecha_modificacion, 'YYYY-MM') AS mes,
                h.campo_modificado AS campo_modificado,
                COUNT(*)::int AS cambios,
                COUNT(DISTINCT h.id_vuelo)::int AS vuelos_afectados
         FROM historial_vuelo h
         ${where(condiciones)}
         GROUP BY mes, h.campo_modificado
         ORDER BY mes DESC, cambios DESC`,
        reemplazos
      );
    },
  },

  'actividad-usuarios': {
    titulo: 'Actividad por usuario',
    descripcion:
      'Operaciones auditadas por usuario y acción, con tablas afectadas.',
    filtros: ['fecha_desde', 'fecha_hasta', 'id_usuario', 'accion'],
    columnas: [
      col('usuario', 'Usuario'),
      col('nombre', 'Nombre'),
      col('accion', 'Acción'),
      numero('operaciones', 'Operaciones'),
      numero('tablas', 'Tablas afectadas'),
    ],
    async consulta(filtros) {
      const { condiciones, reemplazos } = filtrosFecha(
        filtros,
        'fecha_hora',
        'a'
      );

      if (filtros.id_usuario) {
        condiciones.push('a.id_usuario = :idUsuario');
        reemplazos.idUsuario = filtros.id_usuario;
      }

      if (filtros.accion) {
        condiciones.push('a.accion = :accion');
        reemplazos.accion = filtros.accion;
      }

      return consultar(
        `SELECT COALESCE(u.nombre_usuario, '(sistema)') AS usuario,
                COALESCE(u.nombres || ' ' || u.apellidos, 'Sistema') AS nombre,
                a.accion AS accion,
                COUNT(*)::int AS operaciones,
                COUNT(DISTINCT a.tabla_afectada)::int AS tablas
         FROM auditoria a
         LEFT JOIN usuarios u ON u.id_usuario = a.id_usuario
         ${where(condiciones)}
         GROUP BY u.id_usuario, u.nombre_usuario, u.nombres, u.apellidos, a.accion
         ORDER BY operaciones DESC, usuario ASC`,
        reemplazos
      );
    },
  },
};

// ============================================================
// API pública del servicio
// ============================================================

const listarReportes = () =>
  Object.entries(REPORTES).map(([clave, reporte]) => ({
    clave,
    titulo: reporte.titulo,
    descripcion: reporte.descripcion,
    filtros: reporte.filtros,
    columnas: reporte.columnas,
  }));

const calcularTotales = (columnas, filas) => {
  const totales = {};

  for (const columna of columnas.filter((item) => item.sumar)) {
    totales[columna.clave] = filas.reduce(
      (acumulado, fila) => acumulado + (Number(fila[columna.clave]) || 0),
      0
    );
  }

  return totales;
};

const filtrosAplicados = (filtros) =>
  Object.fromEntries(
    Object.entries(filtros).filter(
      ([, valor]) => valor !== undefined && valor !== null && valor !== ''
    )
  );

const obtenerReporte = async (clave, filtros = {}) => {
  const reporte = REPORTES[clave];

  if (!reporte) {
    throw new ErrorConEstado(404, 'Reporte no encontrado');
  }

  const filas = await reporte.consulta(filtros);

  return {
    clave,
    titulo: reporte.titulo,
    descripcion: reporte.descripcion,
    generado_en: new Date().toISOString(),
    filtros: filtrosAplicados(filtros),
    columnas: reporte.columnas,
    total_registros: filas.length,
    totales: calcularTotales(reporte.columnas, filas),
    filas,
  };
};

module.exports = {
  listarReportes,
  obtenerReporte,
};
