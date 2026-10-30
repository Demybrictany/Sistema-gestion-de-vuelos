// ============================================================
// Pruebas de reportería v1.2.0
//
// Requisitos:
//   1. Base inicializada (npm run db:init).
//   2. Servidor levantado (npm run dev).
//   3. Ejecutar: npm run test:reportes
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

const reqBinario = async (path, { token } = {}) => {
  const headers = {};

  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, { method: 'GET', headers });
  const buffer = Buffer.from(await res.arrayBuffer());

  return {
    status: res.status,
    headers: res.headers,
    buffer,
  };
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

  const secretario = await login('secretario', 'Secretario123!');
  const carlos = await login('carlos', 'Pasajero123!');

  let r = await req('GET', '/api/reportes');
  check('Reportes exige autenticación', r.status === 401, `(${r.status})`);

  r = await req('GET', '/api/reportes', { token: carlos });
  check('Pasajero no puede acceder a reportes', r.status === 403, `(${r.status})`);

  r = await req('GET', '/api/reportes', { token: secretario });
  check(
    'El catálogo expone 16 reportes',
    r.status === 200 && r.data.total === 16 && r.data.reportes.length === 16,
    `(${r.status}, total: ${r.data?.total})`
  );

  const catalogo = r.data?.reportes || [];

  for (const reporte of catalogo) {
    const respuesta = await req('GET', `/api/reportes/${reporte.clave}`, {
      token: secretario,
    });

    check(
      `Reporte ${reporte.clave} genera datos`,
      respuesta.status === 200 &&
        Array.isArray(respuesta.data.columnas) &&
        Array.isArray(respuesta.data.filas) &&
        typeof respuesta.data.totales === 'object',
      `(${respuesta.status})`
    );
  }

  r = await req(
    'GET',
    '/api/reportes/vuelos-por-estado?fecha_desde=2026-10-01&fecha_hasta=2026-10-31',
    { token: secretario }
  );
  check(
    'Filtra por rango de fechas y calcula totales',
    r.status === 200 &&
      r.data.filas.length > 0 &&
      r.data.totales.vuelos ===
        r.data.filas.reduce((total, fila) => total + Number(fila.vuelos), 0),
    `(${r.status})`
  );

  r = await req(
    'GET',
    '/api/reportes/equipaje-por-estado?estado=DANADO',
    { token: secretario }
  );
  check(
    'Filtra equipaje por estado',
    r.status === 200 && r.data.filas.every((fila) => fila.estado === 'DANADO'),
    `(${r.status})`
  );

  r = await req('GET', '/api/reportes/ocupacion-por-puerta?id_puerta=1', {
    token: secretario,
  });
  check(
    'Filtra ocupación por puerta',
    r.status === 200 &&
      r.data.filas.length === 1 &&
      r.data.filas[0].puerta === 'A01',
    `(${r.status})`
  );

  r = await req(
    'GET',
    '/api/reportes/vuelos-por-estado?fecha_desde=2026-13-01',
    { token: secretario }
  );
  check('Rechaza fecha inválida', r.status === 400, `(${r.status})`);

  r = await req(
    'GET',
    '/api/reportes/vuelos-por-estado?fecha_desde=2026-12-31&fecha_hasta=2026-01-01',
    { token: secretario }
  );
  check('Rechaza rango de fechas invertido', r.status === 400, `(${r.status})`);

  r = await req('GET', '/api/reportes/no-existe', { token: secretario });
  check('Reporte inexistente devuelve 404', r.status === 404, `(${r.status})`);

  let binario = await reqBinario(
    '/api/reportes/vuelos-por-estado/exportar?formato=excel',
    { token: secretario }
  );
  check(
    'Exporta a Excel',
    binario.status === 200 &&
      binario.headers.get('content-type')?.includes('spreadsheetml') &&
      binario.buffer.length > 1000 &&
      binario.buffer.subarray(0, 2).toString() === 'PK',
    `(${binario.status}, ${binario.buffer.length} bytes)`
  );
  check(
    'Excel incluye nombre de archivo',
    (binario.headers.get('content-disposition') || '').includes('.xlsx'),
    `(${binario.headers.get('content-disposition')})`
  );

  binario = await reqBinario(
    '/api/reportes/vuelos-por-estado/exportar?formato=pdf',
    { token: secretario }
  );
  check(
    'Exporta a PDF',
    binario.status === 200 &&
      binario.headers.get('content-type')?.includes('application/pdf') &&
      binario.buffer.length > 1000 &&
      binario.buffer.subarray(0, 4).toString() === '%PDF',
    `(${binario.status}, ${binario.buffer.length} bytes)`
  );

  binario = await reqBinario(
    '/api/reportes/vuelos-por-estado/exportar?formato=csv',
    { token: secretario }
  );
  check('Rechaza formato de exportación inválido', binario.status === 400, `(${binario.status})`);

  console.log(`\nResultado: ${pasaron} PASS, ${fallaron} FAIL`);
  if (fallaron) {
    console.log('Fallos:');
    fallos.forEach((f) => console.log(' -', f));
    process.exit(1);
  }
})().catch((error) => {
  console.error('ERROR FATAL:', error);
  process.exit(1);
});
