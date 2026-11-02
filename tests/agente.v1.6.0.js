// ============================================================
// Pruebas del agente de IA + RAG (v1.6.0)
//
// Requisitos:
//   1. Base migrada (npm run db:migrate:agente o db:init).
//   2. API levantada.
//   3. Documentación en docs/rag/ (la ingesta se hace en la prueba).
//
// Ejecutar: npm run test:agente
// ============================================================

require('dotenv').config();

const sequelize = require('../db/database');
const { ejecutarHerramienta } = require('../services/agente.tools');

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

const req = async (method, path, { token, body } = {}) => {
  const headers = {};

  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

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

(async () => {
  await esperarServidor();

  const admin = await login(
    process.env.ADMIN_USUARIO || 'admin',
    process.env.ADMIN_PASSWORD || 'Admin123!'
  );
  const carlos = await login(
    process.env.PASAJERO_USUARIO || 'carlos',
    process.env.PASAJERO_PASSWORD || 'Pasajero123!'
  );

  let r = await req('POST', '/api/agente/ingestar', { token: admin });
  check('La ingesta de documentos responde 200', r.status === 200, `(${r.status})`);

  r = await req('GET', '/api/agente/documentos', { token: admin });
  check(
    'Los documentos quedan indexados',
    r.status === 200 && r.data?.total > 0,
    `(${r.status}, total: ${r.data?.total})`
  );

  r = await req('POST', '/api/agente/consultas', {
    token: admin,
    body: { pregunta: '¿Qué pasa si mi vuelo se retrasa?' },
  });
  check(
    'El agente responde una consulta de políticas',
    r.status === 200 &&
      typeof r.data?.respuesta === 'string' &&
      r.data.respuesta.length > 0,
    `(${r.status})`
  );
  check(
    'La respuesta incluye citas de fuentes',
    Array.isArray(r.data?.fuentes) && r.data.fuentes.length > 0,
    `(${r.data?.fuentes?.length})`
  );
  check(
    'La interacción queda registrada',
    Boolean(r.data?.id_interaccion),
    `(${r.data?.id_interaccion})`
  );

  const vuelos = await req('GET', '/api/vuelos', { token: admin });
  const codigo = Array.isArray(vuelos.data) ? vuelos.data[0]?.codigo_vuelo : null;
  check('Hay un vuelo para consultar', Boolean(codigo));

  if (codigo) {
    r = await req('POST', '/api/agente/consultas', {
      token: admin,
      body: { pregunta: `¿En qué puerta sale el vuelo ${codigo}?` },
    });
    check(
      'El agente consulta datos operativos reales',
      r.status === 200 && String(r.data?.respuesta).includes(codigo),
      `(${r.status})`
    );
  }

  const usuarioCarlos = { rol: 'PASAJERO', id_pasajero: 1 };
  const ajeno = await ejecutarHerramienta(
    'consultar_equipaje',
    { codigo: 'EQ000002' },
    usuarioCarlos
  );
  check(
    'La herramienta no expone equipaje de otro pasajero',
    ajeno.total === 0,
    `(${ajeno.total})`
  );

  const propio = await ejecutarHerramienta(
    'consultar_equipaje',
    { codigo: 'EQ000001' },
    usuarioCarlos
  );
  check(
    'La herramienta devuelve el equipaje propio',
    propio.total === 1,
    `(${propio.total})`
  );

  r = await req('GET', '/api/agente/interacciones', { token: admin });
  check(
    'El administrador ve los logs del agente',
    r.status === 200 && Array.isArray(r.data) && r.data.length > 0,
    `(${r.status})`
  );

  r = await req('GET', '/api/agente/interacciones', { token: carlos });
  check('Un pasajero no ve los logs del agente', r.status === 403, `(${r.status})`);

  r = await req('POST', '/api/agente/ingestar', { token: admin });
  const todosSinCambios =
    Array.isArray(r.data?.resultados) &&
    r.data.resultados.every((item) => item.estado === 'sin cambios');
  check(
    'La ingesta es idempotente',
    r.status === 200 && todosSinCambios,
    `(${r.status})`
  );

  console.log(`\n${pasaron} PASS, ${fallaron} FAIL`);

  if (fallaron > 0) {
    console.log('\nFallos:');
    fallos.forEach((fallo) => console.log(` - ${fallo}`));
  }

  await sequelize.close();

  if (fallaron > 0) {
    process.exit(1);
  }
})().catch(async (error) => {
  console.error('ERROR FATAL:', error);
  try {
    await sequelize.close();
  } catch {
    // sin conexión abierta
  }
  process.exit(1);
});
