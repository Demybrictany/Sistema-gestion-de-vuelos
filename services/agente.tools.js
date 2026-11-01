// ============================================================
// Herramientas del agente de IA.
//
// Cada herramienta consulta datos reales del sistema y aplica el
// alcance del rol: el personal ve la operación; un pasajero solo ve
// sus propios vuelos, escalas y equipaje.
// ============================================================

const { QueryTypes } = require('sequelize');

const sequelize = require('../db/database');
const { buscar } = require('./rag.service');

const ROLES_STAFF = ['ADMINISTRADOR', 'SECRETARIO'];

const esStaff = (usuario) => ROLES_STAFF.includes(usuario?.rol);

const exigirPasajero = (usuario) => {
  if (!usuario?.id_pasajero) {
    throw new Error('El usuario no tiene un pasajero vinculado.');
  }

  return usuario.id_pasajero;
};

const consultarVuelos = async (usuario, filtros = {}) => {
  const condiciones = [];
  const replacements = {};
  const joins = [];

  if (filtros.codigo) {
    condiciones.push('UPPER(v.codigo_vuelo) = :codigo');
    replacements.codigo = String(filtros.codigo).toUpperCase();
  }

  if (filtros.fecha) {
    condiciones.push('v.fecha_salida = CAST(:fecha AS date)');
    replacements.fecha = filtros.fecha;
  }

  if (filtros.estado) {
    condiciones.push('v.estado::text = :estado');
    replacements.estado = String(filtros.estado).toUpperCase();
  }

  if (filtros.origen) {
    condiciones.push('o.codigo_iata = :origen');
    replacements.origen = String(filtros.origen).toUpperCase();
  }

  if (filtros.destino) {
    condiciones.push('d.codigo_iata = :destino');
    replacements.destino = String(filtros.destino).toUpperCase();
  }

  if (!esStaff(usuario)) {
    replacements.idPasajero = exigirPasajero(usuario);
    joins.push(
      `JOIN pasajero_vuelo pv ON pv.id_vuelo = v.id_vuelo
         AND pv.id_pasajero = :idPasajero
         AND pv.estado <> 'CANCELADO'`
    );
  }

  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

  const filas = await sequelize.query(
    `SELECT v.codigo_vuelo,
            o.codigo_iata AS origen,
            d.codigo_iata AS destino,
            to_char(v.fecha_salida, 'YYYY-MM-DD') AS fecha_salida,
            to_char(v.hora_salida, 'HH24:MI') AS hora_salida,
            to_char(v.fecha_llegada, 'YYYY-MM-DD') AS fecha_llegada,
            to_char(v.hora_llegada, 'HH24:MI') AS hora_llegada,
            v.estado::text AS estado,
            p.numero AS puerta,
            p.zona AS zona_puerta
       FROM vuelos v
       JOIN aeropuertos o ON o.id_aeropuerto = v.id_aeropuerto_origen
       JOIN aeropuertos d ON d.id_aeropuerto = v.id_aeropuerto_destino
       LEFT JOIN puertas p ON p.id_puerta = v.id_puerta
       ${joins.join('\n')}
       ${where}
      ORDER BY v.fecha_salida, v.hora_salida
      LIMIT 10`,
    { replacements, type: QueryTypes.SELECT }
  );

  return {
    total: filas.length,
    vuelos: filas,
    nota: filas.length === 0 ? 'No se encontraron vuelos con esos filtros.' : undefined,
  };
};

const consultarPuertas = async (usuario, filtros = {}) => {
  const condiciones = [];
  const replacements = {};

  if (filtros.zona) {
    condiciones.push('p.zona = :zona');
    replacements.zona = String(filtros.zona).toUpperCase();
  }

  if (filtros.estado) {
    condiciones.push('p.estado::text = :estado');
    replacements.estado = String(filtros.estado).toUpperCase();
  }

  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

  const filas = await sequelize.query(
    `SELECT p.numero, p.zona, p.estado::text AS estado,
            v.codigo_vuelo,
            to_char(v.fecha_salida, 'YYYY-MM-DD') AS fecha_vuelo,
            to_char(v.hora_salida, 'HH24:MI') AS hora_salida,
            v.estado::text AS estado_vuelo
       FROM puertas p
       LEFT JOIN vuelos v ON v.id_puerta = p.id_puerta
        AND v.estado::text IN ('PROGRAMADO', 'ABORDANDO', 'ABORDADO', 'RETRASADO', 'EN_VUELO')
       ${where}
      ORDER BY p.numero
      LIMIT 25`,
    { replacements, type: QueryTypes.SELECT }
  );

  return { total: filas.length, puertas: filas };
};

const consultarEquipaje = async (usuario, filtros = {}) => {
  const condiciones = [];
  const replacements = {};

  if (filtros.codigo) {
    condiciones.push('UPPER(e.codigo_equipaje) = :codigo');
    replacements.codigo = String(filtros.codigo).toUpperCase();
  }

  if (!esStaff(usuario)) {
    replacements.idPasajero = exigirPasajero(usuario);
    condiciones.push('e.id_pasajero = :idPasajero');
  }

  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

  const filas = await sequelize.query(
    `SELECT e.codigo_equipaje,
            e.estado::text AS estado,
            e.peso,
            b.numero AS banda,
            e.origen AS id_origen,
            e.destino_final AS id_destino
       FROM equipajes e
       LEFT JOIN bandas_equipaje b ON b.id_banda = e.id_banda_actual
       ${where}
      ORDER BY e.created_at DESC
      LIMIT 10`,
    { replacements, type: QueryTypes.SELECT }
  );

  return {
    total: filas.length,
    equipajes: filas,
    nota:
      filas.length === 0
        ? 'No se encontró equipaje con esos datos para este usuario.'
        : undefined,
  };
};

const consultarEscalas = async (usuario, filtros = {}) => {
  const condiciones = [];
  const replacements = {};

  if (filtros.codigo) {
    condiciones.push('UPPER(v.codigo_vuelo) = :codigo');
    replacements.codigo = String(filtros.codigo).toUpperCase();
  }

  if (!esStaff(usuario)) {
    replacements.idPasajero = exigirPasajero(usuario);
    condiciones.push('i.id_pasajero = :idPasajero');
  }

  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

  const filas = await sequelize.query(
    `SELECT v.codigo_vuelo,
            e.numero_escala,
            e.estado::text AS estado,
            to_char(e.hora_llegada, 'YYYY-MM-DD HH24:MI') AS hora_llegada,
            to_char(e.hora_salida, 'YYYY-MM-DD HH24:MI') AS hora_salida,
            pl.numero AS puerta_llegada,
            ps.numero AS puerta_salida
       FROM escalas e
       JOIN itinerarios i ON i.id_itinerario = e.id_itinerario
       JOIN vuelos v ON v.id_vuelo = e.id_vuelo
       LEFT JOIN puertas pl ON pl.id_puerta = e.id_puerta_llegada
       LEFT JOIN puertas ps ON ps.id_puerta = e.id_puerta_salida
       ${where}
      ORDER BY e.hora_salida
      LIMIT 10`,
    { replacements, type: QueryTypes.SELECT }
  );

  return { total: filas.length, escalas: filas };
};

const misVuelos = async (usuario) => {
  const idPasajero = exigirPasajero(usuario);

  const filas = await sequelize.query(
    `SELECT v.codigo_vuelo,
            o.codigo_iata AS origen,
            d.codigo_iata AS destino,
            to_char(v.fecha_salida, 'YYYY-MM-DD') AS fecha_salida,
            to_char(v.hora_salida, 'HH24:MI') AS hora_salida,
            v.estado::text AS estado,
            p.numero AS puerta,
            pv.numero_asiento,
            pv.estado::text AS estado_reserva
       FROM pasajero_vuelo pv
       JOIN vuelos v ON v.id_vuelo = pv.id_vuelo
       JOIN aeropuertos o ON o.id_aeropuerto = v.id_aeropuerto_origen
       JOIN aeropuertos d ON d.id_aeropuerto = v.id_aeropuerto_destino
       LEFT JOIN puertas p ON p.id_puerta = v.id_puerta
      WHERE pv.id_pasajero = :idPasajero
        AND pv.estado <> 'CANCELADO'
      ORDER BY v.fecha_salida, v.hora_salida`,
    { replacements: { idPasajero }, type: QueryTypes.SELECT }
  );

  return { total: filas.length, vuelos: filas };
};

const buscarDocumentacion = async (usuario, filtros = {}) => {
  const fragmentos = await buscar(filtros.consulta || '', 5);

  return {
    total: fragmentos.length,
    fragmentos: fragmentos.map((fragmento, indice) => ({
      cita: indice + 1,
      titulo: fragmento.titulo,
      fuente: fragmento.fuente,
      contenido: fragmento.contenido,
    })),
  };
};

const HERRAMIENTAS = {
  consultar_vuelos: consultarVuelos,
  consultar_puertas: consultarPuertas,
  consultar_equipaje: consultarEquipaje,
  consultar_escalas: consultarEscalas,
  mis_vuelos: misVuelos,
  buscar_documentacion: buscarDocumentacion,
};

const TOOLS = [
  {
    name: 'consultar_vuelos',
    description:
      'Consulta vuelos por código, fecha (YYYY-MM-DD), estado, origen o destino. Un pasajero solo ve sus propios vuelos.',
    input_schema: {
      type: 'object',
      properties: {
        codigo: { type: 'string', description: 'Código del vuelo, por ejemplo GT456' },
        fecha: { type: 'string', description: 'Fecha de salida en formato YYYY-MM-DD' },
        estado: {
          type: 'string',
          description: 'PROGRAMADO, ABORDANDO, ABORDADO, EN_VUELO, ATERRIZADO, FINALIZADO, RETRASADO o CANCELADO',
        },
        origen: { type: 'string', description: 'Código IATA del aeropuerto de origen' },
        destino: { type: 'string', description: 'Código IATA del aeropuerto de destino' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'consultar_puertas',
    description:
      'Consulta el estado de las puertas del AICM y el vuelo asignado a cada una. Filtra por zona (NACIONAL/INTERNACIONAL) o estado.',
    input_schema: {
      type: 'object',
      properties: {
        zona: { type: 'string', description: 'NACIONAL o INTERNACIONAL' },
        estado: { type: 'string', description: 'DISPONIBLE, OCUPADA, MANTENIMIENTO o INACTIVA' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'consultar_equipaje',
    description:
      'Consulta equipaje por código (por ejemplo EQ000001). Un pasajero solo ve su propio equipaje.',
    input_schema: {
      type: 'object',
      properties: {
        codigo: { type: 'string', description: 'Código del equipaje' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'consultar_escalas',
    description:
      'Consulta las escalas de un vuelo o del itinerario del pasajero, con puertas y horarios.',
    input_schema: {
      type: 'object',
      properties: {
        codigo: { type: 'string', description: 'Código del vuelo de la escala' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'mis_vuelos',
    description:
      'Devuelve los vuelos del pasajero autenticado con su puerta, asiento y estado de reserva.',
    input_schema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: 'buscar_documentacion',
    description:
      'Busca en los manuales, políticas y preguntas frecuentes del negocio. Devuelve fragmentos citables.',
    input_schema: {
      type: 'object',
      properties: {
        consulta: { type: 'string', description: 'Tema o pregunta a buscar' },
      },
      required: ['consulta'],
      additionalProperties: false,
    },
  },
];

const ejecutarHerramienta = async (nombre, entrada, usuario) => {
  const herramienta = HERRAMIENTAS[nombre];

  if (!herramienta) {
    throw new Error(`Herramienta desconocida: ${nombre}`);
  }

  return herramienta(usuario, entrada || {});
};

module.exports = {
  TOOLS,
  ejecutarHerramienta,
  esStaff,
};
