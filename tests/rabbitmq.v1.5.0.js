// ============================================================
// Pruebas de mensajería asíncrona v1.5.0
//
// Requisitos:
//   1. Base migrada (npm run db:migrate).
//   2. RABBITMQ_URL configurada en .env.
//   3. API levantada (npm run dev) y worker levantado (npm run worker).
//   4. Ejecutar: npm run test:rabbitmq
//
// Sin RABBITMQ_URL la prueba se omite y termina con éxito.
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

const esperarEntrega = async (token, idNotificacion) => {
  const intentos = 40;

  for (let i = 0; i < intentos; i += 1) {
    const r = await req('GET', `/api/notificaciones/${idNotificacion}/entregas`, {
      token,
    });

    const entregas = Array.isArray(r.data) ? r.data : [];

    if (entregas.some((entrega) => ['ENVIADA', 'SIMULADA'].includes(entrega.estado))) {
      return entregas;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return [];
};

(async () => {
  if (!process.env.RABBITMQ_URL) {
    console.log(
      'SKIP  RABBITMQ_URL no configurada. La prueba de mensajería no se ejecuta.'
    );
    return;
  }

  await esperarServidor();

  const admin = await login(
    process.env.ADMIN_USUARIO || 'admin',
    process.env.ADMIN_PASSWORD || 'Admin123!'
  );

  // Un pasajero con correo permite comprobar la entrega por CORREO.
  const pasajeros = await req('GET', '/api/pasajeros', { token: admin });
  const pasajero = (Array.isArray(pasajeros.data) ? pasajeros.data : []).find(
    (item) => item.correo
  );

  check('Existe un pasajero con correo', Boolean(pasajero), '(sin correos)');

  if (!pasajero) {
    process.exit(1);
  }

  const creacion = await req('POST', '/api/notificaciones', {
    token: admin,
    body: {
      id_pasajero: pasajero.id_pasajero,
      tipo: 'INFORMACION_GENERAL',
      titulo: 'Prueba de mensajería v1.5.0',
      mensaje:
        'Este aviso se entregó por la cola de RabbitMQ y quedó registrado en entregas_notificacion.',
    },
  });

  check('La notificación se crea por la API', creacion.status === 201, `(${creacion.status})`);

  const idNotificacion =
    creacion.data?.notificacion?.id_notificacion ?? null;

  check(
    'La respuesta incluye el id de la notificación',
    Number.isInteger(idNotificacion),
    `(${idNotificacion})`
  );

  if (!idNotificacion) {
    process.exit(1);
  }

  const entregas = await esperarEntrega(admin, idNotificacion);

  check(
    'El worker registra la entrega de la notificación',
    entregas.length > 0,
    entregas.length
      ? ''
      : '(revisa que `npm run worker` esté ejecutándose)'
  );

  const entregaCorreo = entregas.find((entrega) => entrega.canal === 'CORREO');

  check(
    'La entrega por CORREO queda ENVIADA o SIMULADA',
    Boolean(
      entregaCorreo &&
        ['ENVIADA', 'SIMULADA'].includes(entregaCorreo.estado)
    ),
    `(${entregaCorreo?.estado || 'sin entrega'})`
  );

  check(
    'La entrega guarda el destinatario',
    entregaCorreo?.destinatario === pasajero.correo,
    `(${entregaCorreo?.destinatario || 'vacío'})`
  );

  const resumen = await req('GET', '/api/notificaciones/entregas/resumen', {
    token: admin,
  });

  check(
    'El resumen de entregas responde 200',
    resumen.status === 200,
    `(${resumen.status})`
  );

  check(
    'El resumen contabiliza la entrega',
    Number(resumen.data?.total) >= 1,
    `(${resumen.data?.total})`
  );

  const salud = await req('GET', '/health');

  check(
    'La salud reporta la mensajería configurada',
    ['ok', 'configurada'].includes(salud.data?.mensajeria),
    `(${salud.data?.mensajeria || 'sin campo'})`
  );

  // Limpieza: la entrega se elimina en cascada con la notificación.
  const borrado = await req('DELETE', `/api/notificaciones/${idNotificacion}`, {
    token: admin,
  });

  check('La notificación de prueba se elimina', borrado.status === 200, `(${borrado.status})`);

  console.log(`\n${pasaron} PASS, ${fallaron} FAIL`);

  if (fallaron > 0) {
    console.log('\nFallos:');
    fallos.forEach((fallo) => console.log(` - ${fallo}`));
    process.exit(1);
  }
})().catch((error) => {
  console.error('Error en la prueba de mensajería:', error.message);
  process.exit(1);
});
