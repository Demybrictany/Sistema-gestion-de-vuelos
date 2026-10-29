// ============================================================
// Pruebas del panel operativo v1.3.0
//
// Requisitos:
//   1. Base inicializada (npm run db:init).
//   2. Servidor levantado (npm run dev).
//   3. Ejecutar: npm run test:panel
//
// Estas pruebas son de solo lectura: no modifican datos.
// ============================================================

const API = process.env.API_URL || 'http://localhost:3000';

let pasaron = 0;
let fallaron = 0;
const fallos = [];

const check = (nombre, condicion, detalle = '') => {
  if (condicion) {
    pasaron += 1;
    console.log(`PASS  ${nombre}`);
  } else {
    fallaron += 1;
    fallos.push(`${nombre} ${detalle}`);
    console.log(`FAIL  ${nombre} ${detalle}`);
  }
};

const req = async (method, path, { token } = {}) => {
  const headers = {};

  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, { method, headers });

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  return { status: res.status, data };
};

const login = async (usuario, password) => {
  const res = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre_usuario: usuario, password }),
  });

  const json = await res.json();

  if (res.status !== 200) {
    throw new Error(`Login ${usuario} falló: ${JSON.stringify(json)}`);
  }

  return json.token;
};

const esperarServidor = async () => {
  for (let i = 0; i < 30; i += 1) {
    try {
      const res = await fetch(`${API}/`);
      if (res.ok) return;
    } catch {
      // reintentar
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error('El servidor no respondió');
};

const KPIS_ESPERADOS = [
  'vuelos_total',
  'vuelos_hoy',
  'vuelos_programados',
  'vuelos_en_operacion',
  'vuelos_cancelados',
  'pasajeros_activos',
  'equipajes_total',
  'equipajes_en_proceso',
  'incidencias_equipaje',
  'notificaciones_pendientes',
  'puertas_total',
  'puertas_ocupadas',
  'puertas_disponibles',
  'puertas_mantenimiento',
  'bandas_en_uso',
];

(async () => {
  await esperarServidor();

  const admin = await login('admin', 'Admin123!');
  const carlos = await login('carlos', 'Pasajero123!');

  let r = await req('GET', '/api/panel');
  check('El panel exige autenticación', r.status === 401, `(${r.status})`);

  r = await req('GET', '/api/panel', { token: carlos });
  check('Un pasajero no puede ver el panel', r.status === 403, `(${r.status})`);

  r = await req('GET', '/api/panel', { token: admin });
  const panel = r.data || {};

  check('El panel responde 200', r.status === 200, `(${r.status})`);

  check(
    'El panel expone los 15 KPIs',
    KPIS_ESPERADOS.every((clave) => Number.isFinite(panel.kpis?.[clave])),
    `(faltantes: ${KPIS_ESPERADOS.filter(
      (clave) => !Number.isFinite(panel.kpis?.[clave])
    ).join(', ') || 'ninguno'})`
  );

  check(
    'El panel expone las 25 puertas',
    panel.puertas?.length === 25,
    `(${panel.puertas?.length})`
  );

  check(
    'El panel expone las 10 bandas',
    panel.bandas?.length === 10,
    `(${panel.bandas?.length})`
  );

  check(
    'Cada puerta trae estado operativo y vuelo asignable',
    Array.isArray(panel.puertas) &&
      panel.puertas.every(
        (puerta) =>
          typeof puerta.numero === 'string' &&
          typeof puerta.estado === 'string' &&
          typeof puerta.estado_operativo === 'string' &&
          typeof puerta.ocupada === 'boolean'
      )
  );

  check(
    'KPI puertas_total coincide con el listado',
    panel.kpis?.puertas_total === panel.puertas?.length,
    `(${panel.kpis?.puertas_total} vs ${panel.puertas?.length})`
  );

  check(
    'KPI puertas_ocupadas no excede el total',
    panel.kpis?.puertas_ocupadas <= panel.kpis?.puertas_total
  );

  check(
    'KPI bandas_en_uso no excede las bandas sembradas',
    panel.kpis?.bandas_en_uso <= panel.bandas?.length
  );

  check(
    'El panel expone vuelos serializados',
    Array.isArray(panel.vuelos) &&
      panel.vuelos.every(
        (vuelo) =>
          Number.isInteger(vuelo.id_vuelo) &&
          typeof vuelo.codigo_vuelo === 'string' &&
          typeof vuelo.estado === 'string' &&
          vuelo.ocupacion_pct >= 0 &&
          vuelo.ocupacion_pct <= 100
      )
  );

  check(
    'El panel expone las notificaciones recientes',
    Array.isArray(panel.notificaciones) &&
      panel.notificaciones.every(
        (notificacion) =>
          typeof notificacion.tipo === 'string' &&
          typeof notificacion.pasajero === 'string'
      )
  );

  check(
    'El panel incluye una marca de tiempo válida',
    !Number.isNaN(Date.parse(panel.generado_en))
  );

  const socket = await fetch(`${API}/socket.io/?EIO=4&transport=polling`);
  const cuerpoSocket = await socket.text();

  check(
    'Socket.IO responde el handshake',
    socket.status === 200 && cuerpoSocket.includes('"sid"'),
    `(${socket.status})`
  );

  console.log(`\n${pasaron} PASS, ${fallaron} FAIL`);

  if (fallaron > 0) {
    console.log('\nFallos:');
    fallos.forEach((fallo) => console.log(` - ${fallo}`));
    process.exit(1);
  }
})();
