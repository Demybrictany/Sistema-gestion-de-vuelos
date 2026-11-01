// ============================================================
// Pruebas de dominio v1.6.1
//
// Cubre los dos avisos que exige el negocio:
//   1. Hora y puerta iniciales al asignar un pasajero a un vuelo.
//   2. Puerta (y cambio de puerta) de una escala.
//
// Requisitos: API levantada y base inicializada.
// Ejecutar: npm run test:escalas
// ============================================================

require('dotenv').config();

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

const buscarNotificacion = (notificaciones, filtro) =>
  (Array.isArray(notificaciones) ? notificaciones : []).find(filtro);

(async () => {
  await esperarServidor();

  const admin = await login(
    process.env.ADMIN_USUARIO || 'admin',
    process.env.ADMIN_PASSWORD || 'Admin123!'
  );

  const codigo = `ESC${String(Date.now()).slice(-5)}`;

  let r = await req('POST', '/api/vuelos', {
    token: admin,
    body: {
      codigo_vuelo: codigo,
      id_aeropuerto_origen: 1,
      id_aeropuerto_destino: 2,
      fecha_salida: '2027-02-01',
      hora_salida: '10:00',
      fecha_llegada: '2027-02-01',
      hora_llegada: '12:00',
      id_puerta: 24,
      capacidad_pasajeros: 100,
      observaciones: 'Vuelo de pruebas de dominio v1.6.1',
    },
  });

  check('Crea un vuelo para las pruebas', r.status === 201, `(${r.status})`);
  const idVuelo = r.data?.vuelo?.id_vuelo;

  if (!idVuelo) {
    console.log(`\n${pasaron} PASS, ${fallaron} FAIL`);
    process.exit(1);
  }

  r = await req('POST', '/api/pasajero-vuelo', {
    token: admin,
    body: { id_pasajero: 6, id_vuelo: idVuelo, numero_asiento: '31A' },
  });
  check('Asigna un pasajero al vuelo', r.status === 201, `(${r.status})`);
  const idAsignacion = r.data?.pasajero_vuelo?.id_pasajero_vuelo;

  let notificaciones = await req('GET', '/api/notificaciones', { token: admin });
  const avisoReserva = buscarNotificacion(
    notificaciones.data,
    (item) =>
      item.id_pasajero === 6 &&
      item.id_vuelo === idVuelo &&
      String(item.mensaje).includes(codigo)
  );
  check(
    'La reserva genera el aviso inicial de hora y puerta',
    Boolean(avisoReserva) &&
      avisoReserva.tipo === 'PUERTA_ASIGNADA' &&
      String(avisoReserva.mensaje).includes('A24'),
    `(${notificaciones.status})`
  );

  r = await req('POST', '/api/escalas', {
    token: admin,
    body: {
      id_itinerario: 1,
      id_vuelo: idVuelo,
      numero_escala: 9,
      aeropuerto_llegada: 1,
      aeropuerto_salida: 2,
      hora_llegada: '2027-02-01T13:00:00Z',
      hora_salida: '2027-02-01T15:00:00Z',
      id_puerta_llegada: 1,
      id_puerta_salida: 2,
    },
  });
  check('Crea la escala con puerta de salida', r.status === 201, `(${r.status})`);
  const idEscala = r.data?.escala?.id_escala;

  notificaciones = await req('GET', '/api/notificaciones', { token: admin });
  const avisoEscala = buscarNotificacion(
    notificaciones.data,
    (item) =>
      item.id_pasajero === 1 &&
      item.id_vuelo === idVuelo &&
      /conexión/i.test(item.titulo) &&
      String(item.mensaje).includes('A02')
  );
  check(
    'La escala notifica la puerta al pasajero del itinerario',
    Boolean(avisoEscala) && avisoEscala.tipo === 'PUERTA_ASIGNADA',
    `(${notificaciones.status})`
  );

  r = await req('PUT', `/api/escalas/${idEscala}`, {
    token: admin,
    body: { id_puerta_salida: 3 },
  });
  check('Actualiza la puerta de la escala', r.status === 200, `(${r.status})`);

  notificaciones = await req('GET', '/api/notificaciones', { token: admin });
  const avisoCambio = buscarNotificacion(
    notificaciones.data,
    (item) =>
      item.id_pasajero === 1 &&
      item.id_vuelo === idVuelo &&
      item.tipo === 'CAMBIO_PUERTA' &&
      String(item.mensaje).includes('A03')
  );
  check('El cambio de puerta genera CAMBIO_PUERTA', Boolean(avisoCambio));

  r = await req('POST', '/api/escalas', {
    token: admin,
    body: {
      id_itinerario: 1,
      id_vuelo: idVuelo,
      numero_escala: 10,
      aeropuerto_llegada: 1,
      aeropuerto_salida: 2,
      hora_llegada: '2027-02-01T16:00:00Z',
      hora_salida: '2027-02-01T18:00:00Z',
      id_puerta_salida: 15,
    },
  });
  check(
    'Rechaza una puerta en mantenimiento',
    r.status === 400,
    `(${r.status})`
  );

  if (idEscala) {
    r = await req('DELETE', `/api/escalas/${idEscala}`, { token: admin });
    check('Elimina la escala de prueba', r.status === 200, `(${r.status})`);
  }

  if (idAsignacion) {
    r = await req('DELETE', `/api/pasajero-vuelo/${idAsignacion}`, {
      token: admin,
    });
    check('Elimina la asignación de prueba', r.status === 200, `(${r.status})`);
  }

  r = await req('DELETE', `/api/vuelos/${idVuelo}`, { token: admin });
  check('Elimina el vuelo de prueba', r.status === 200, `(${r.status})`);

  console.log(`\n${pasaron} PASS, ${fallaron} FAIL`);

  if (fallaron > 0) {
    console.log('\nFallos:');
    fallos.forEach((fallo) => console.log(` - ${fallo}`));
    process.exit(1);
  }
})().catch((error) => {
  console.error('ERROR FATAL:', error);
  process.exit(1);
});
