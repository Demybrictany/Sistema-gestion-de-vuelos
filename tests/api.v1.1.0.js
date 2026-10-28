// ============================================================
// Pruebas de integración v1.1.0
//
// Requisitos:
//   1. Base de datos recién inicializada (npm run db:init).
//   2. Servidor levantado (npm run dev).
//   3. Ejecutar: npm run test:api
//
// El script crea y modifica datos, por lo que debe ejecutarse
// contra una base de pruebas o volver a inicializar al terminar.
// ============================================================

const assert = require('assert');

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
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
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
  const { status, data } = await req('POST', '/api/auth/login', {
    body: { nombre_usuario: usuario, password },
  });
  assert.strictEqual(status, 200, `Login ${usuario} falló: ${JSON.stringify(data)}`);
  return data.token;
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

  const admin = await login('admin', 'Admin123!');
  const secretario = await login('secretario', 'Secretario123!');
  const carlos = await login('carlos', 'Pasajero123!');
  const sofia = await login('sofia', 'Pasajero123!');

  // --- Autenticación y roles ---
  let r = await req('GET', '/api/vuelos');
  check('Sin token devuelve 401', r.status === 401, `(${r.status})`);

  r = await req('GET', '/api/usuarios', { token: admin });
  check('Admin puede listar usuarios', r.status === 200, `(${r.status})`);

  r = await req('GET', '/api/usuarios', { token: secretario });
  check('Secretario no puede listar usuarios', r.status === 403, `(${r.status})`);

  r = await req('GET', '/api/usuarios', { token: carlos });
  check('Pasajero no puede listar usuarios', r.status === 403, `(${r.status})`);

  r = await req('GET', '/api/auditoria', { token: secretario });
  check('Secretario no puede ver auditoría', r.status === 403, `(${r.status})`);

  r = await req('GET', '/api/auditoria', { token: admin });
  check('Admin puede ver auditoría', r.status === 200, `(${r.status})`);
  check(
    'Auditoría registra LOGIN',
    Array.isArray(r.data) && r.data.some((item) => item.accion === 'LOGIN'),
    `(registros: ${r.data?.length})`
  );

  r = await req('POST', '/api/auditoria', {
    token: admin,
    body: { accion: 'X', tabla_afectada: 'Y' },
  });
  check('Auditoría es de solo lectura (POST 404)', r.status === 404, `(${r.status})`);

  r = await req('DELETE', '/api/historial-vuelo/1', { token: admin });
  check('Historial no se puede borrar (DELETE 404)', r.status === 404, `(${r.status})`);

  // --- Acceso del pasajero a sus datos ---
  r = await req('GET', '/api/notificaciones/mias', { token: carlos });
  check('Pasajero ve sus notificaciones', r.status === 200 && r.data.length >= 4, `(${r.status}, ${r.data?.length})`);

  r = await req('GET', '/api/equipajes/mios', { token: carlos });
  check('Pasajero ve sus equipajes', r.status === 200 && r.data.length === 2, `(${r.status}, ${r.data?.length})`);

  r = await req('GET', '/api/vuelos/mios', { token: carlos });
  check('Pasajero ve sus vuelos', r.status === 200 && r.data.length === 2, `(${r.status}, ${r.data?.length})`);

  r = await req('GET', '/api/equipajes/2', { token: carlos });
  check('Pasajero no ve equipaje ajeno', r.status === 403, `(${r.status})`);

  r = await req('PATCH', '/api/notificaciones/5/leer', { token: carlos });
  check('Pasajero no modifica notificación ajena', r.status === 403, `(${r.status})`);

  r = await req('PATCH', '/api/notificaciones/3/leer', { token: carlos });
  check('Pasajero marca su notificación como leída', r.status === 200 && r.data.notificacion.leida === true, `(${r.status})`);

  r = await req('PATCH', '/api/notificaciones/mias/leer-todas', { token: carlos });
  check('Pasajero marca todas como leídas', r.status === 200, `(${r.status})`);

  // --- Validaciones ---
  r = await req('POST', '/api/vuelos', {
    token: secretario,
    body: { codigo_vuelo: 'INCOMPLETO' },
  });
  check('Validación rechaza vuelo incompleto', r.status === 400 && Array.isArray(r.data.errores), `(${r.status})`);

  r = await req('POST', '/api/vuelos', {
    token: secretario,
    body: {
      codigo_vuelo: 'EXTRA',
      id_aeropuerto_origen: 1,
      id_aeropuerto_destino: 2,
      fecha_salida: '2026-12-01',
      hora_salida: '09:00',
      fecha_llegada: '2026-12-01',
      hora_llegada: '10:00',
      capacidad_pasajeros: 100,
      estado: 'CANCELADO',
    },
  });
  check('Validación rechaza campos no permitidos', r.status === 400, `(${r.status})`);

  // --- Creación de vuelo y conflictos de puerta ---
  const vueloBase = {
    codigo_vuelo: 'TST110',
    id_aeropuerto_origen: 1,
    id_aeropuerto_destino: 2,
    fecha_salida: '2026-12-01',
    hora_salida: '10:00',
    fecha_llegada: '2026-12-01',
    hora_llegada: '12:00',
    id_puerta: 2,
    capacidad_pasajeros: 180,
    observaciones: 'Vuelo de pruebas v1.1.0',
  };

  r = await req('POST', '/api/vuelos', { token: secretario, body: vueloBase });
  check('Secretario crea vuelo', r.status === 201 && r.data.vuelo.estado === 'PROGRAMADO', `(${r.status})`);
  const vueloId = r.data.vuelo.id_vuelo;

  r = await req('POST', '/api/vuelos', {
    token: secretario,
    body: { ...vueloBase, codigo_vuelo: 'TST111' },
  });
  check('No permite dos vuelos en la misma puerta y horario', r.status === 409, `(${r.status})`);

  r = await req('PUT', `/api/vuelos/${vueloId}`, {
    token: secretario,
    body: {
      fecha_salida: '2026-10-02',
      hora_salida: '09:00',
      fecha_llegada: '2026-10-02',
      hora_llegada: '11:00',
      id_puerta: 1,
    },
  });
  check('Conflicto de puerta también al actualizar', r.status === 409, `(${r.status})`);

  // --- Máquina de estados ---
  r = await req('PATCH', `/api/vuelos/${vueloId}/estado`, {
    token: secretario,
    body: { estado: 'FINALIZADO' },
  });
  check('Rechaza transición PROGRAMADO -> FINALIZADO', r.status === 400, `(${r.status})`);

  for (const estado of ['ABORDANDO', 'ABORDADO', 'EN_VUELO', 'ATERRIZADO', 'FINALIZADO']) {
    r = await req('PATCH', `/api/vuelos/${vueloId}/estado`, {
      token: secretario,
      body: { estado },
    });
    check(`Transición válida a ${estado}`, r.status === 200, `(${r.status}, ${JSON.stringify(r.data)})`);
  }

  // --- Reprogramación y cambio de puerta con notificaciones ---
  r = await req('PATCH', '/api/vuelos/3/reprogramar', {
    token: secretario,
    body: {
      fecha_salida: '2026-10-03',
      hora_salida: '19:00',
      fecha_llegada: '2026-10-04',
      hora_llegada: '12:00',
      motivo: 'Ajuste operativo de pruebas',
    },
  });
  check('Reprograma vuelo y registra cambios', r.status === 200 && r.data.cambios.length > 0, `(${r.status})`);

  r = await req('PATCH', '/api/vuelos/3/puerta', {
    token: secretario,
    body: { id_puerta: 21, motivo: 'Reasignación de pruebas' },
  });
  check('Cambia puerta del vuelo', r.status === 200, `(${r.status})`);

  r = await req('GET', '/api/historial-vuelo/vuelo/3', { token: secretario });
  check(
    'Historial del vuelo registra hora y puerta',
    r.status === 200 &&
      r.data.some((h) => h.campo_modificado === 'hora_salida') &&
      r.data.some((h) => h.campo_modificado === 'id_puerta'),
    `(${r.status}, ${r.data?.length})`
  );

  r = await req('GET', '/api/notificaciones', { token: secretario });
  check(
    'Notificaciones automáticas de horario y puerta',
    r.status === 200 &&
      r.data.some((n) => n.id_pasajero === 2 && n.tipo === 'CAMBIO_HORARIO') &&
      r.data.some((n) => n.id_pasajero === 2 && n.tipo === 'CAMBIO_PUERTA'),
    `(${r.status})`
  );

  // --- Cancelación con pasajero ---
  r = await req('POST', '/api/vuelos', {
    token: secretario,
    body: {
      codigo_vuelo: 'TSTC11',
      id_aeropuerto_origen: 1,
      id_aeropuerto_destino: 6,
      fecha_salida: '2026-12-05',
      hora_salida: '14:00',
      fecha_llegada: '2026-12-05',
      hora_llegada: '18:00',
      id_puerta: 20,
      capacidad_pasajeros: 150,
    },
  });
  const vueloCancelarId = r.data.vuelo.id_vuelo;
  check('Crea vuelo para cancelación', r.status === 201, `(${r.status})`);

  r = await req('POST', '/api/pasajero-vuelo', {
    token: secretario,
    body: { id_pasajero: 1, id_vuelo: vueloCancelarId, numero_asiento: '01A' },
  });
  check('Asigna pasajero al vuelo', r.status === 201, `(${r.status})`);

  r = await req('POST', `/api/vuelos/${vueloCancelarId}/cancelar`, {
    token: secretario,
    body: { motivo: 'Cancelación de prueba' },
  });
  check('Cancela vuelo con motivo', r.status === 200 && r.data.vuelo.estado === 'CANCELADO', `(${r.status})`);

  r = await req('GET', '/api/pasajero-vuelo', { token: secretario });
  const asignacionCancelada = r.data.find(
    (pv) => pv.id_vuelo === vueloCancelarId && pv.id_pasajero === 1
  );
  check('Pasajero marcado como CANCELADO', asignacionCancelada?.estado === 'CANCELADO', `(${asignacionCancelada?.estado})`);

  r = await req('GET', '/api/notificaciones/mias', { token: carlos });
  check(
    'Pasajero recibe notificación de cancelación',
    r.status === 200 && r.data.some((n) => n.tipo === 'VUELO_CANCELADO' && n.id_vuelo === vueloCancelarId),
    `(${r.status})`
  );

  // --- Equipaje en conexión ---
  r = await req('POST', '/api/equipajes', {
    token: secretario,
    body: {
      codigo_equipaje: 'EQTST11',
      id_pasajero: 2,
      peso: 20,
      origen: 4,
      destino_final: 3,
      observaciones: 'Equipaje de pruebas de conexión',
    },
  });
  check('Crea equipaje para conexión', r.status === 201, `(${r.status})`);
  const equipajeId = r.data.equipaje?.id_equipaje;

  r = await req('POST', `/api/equipajes/${equipajeId}/tramos`, {
    token: secretario,
    body: { id_vuelo: 10 },
  });
  check('Registra primer tramo de equipaje', r.status === 201 && r.data.equipaje.estado === 'EN_TRANSITO', `(${r.status}, ${JSON.stringify(r.data)})`);

  r = await req('POST', `/api/equipajes/${equipajeId}/tramos`, {
    token: secretario,
    body: { id_vuelo: 11 },
  });
  check('Registra conexión sin retirar el equipaje', r.status === 201 && r.data.equipaje.estado === 'EN_TRANSITO', `(${r.status})`);

  r = await req('POST', `/api/equipajes/${equipajeId}/tramos`, {
    token: secretario,
    body: { id_vuelo: 11 },
  });
  check('Rechaza tramo duplicado', r.status === 409, `(${r.status})`);

  r = await req('POST', '/api/equipajes/1/tramos', {
    token: secretario,
    body: { id_vuelo: 3 },
  });
  check('Rechaza conexión sin continuidad de ruta', r.status === 400, `(${r.status})`);

  r = await req('PATCH', `/api/equipajes/${equipajeId}/banda`, {
    token: secretario,
    body: { id_banda: 8, ubicacion: 'Banda internacional B08' },
  });
  check('Asigna banda y notifica', r.status === 200 && r.data.equipaje.estado === 'EN_BANDA', `(${r.status})`);

  r = await req('PATCH', `/api/equipajes/${equipajeId}/estado`, {
    token: secretario,
    body: { estado: 'ENTREGADO', ubicacion: 'Sala de llegadas' },
  });
  check('Entrega equipaje', r.status === 200 && r.data.equipaje.estado === 'ENTREGADO', `(${r.status})`);

  r = await req('PATCH', `/api/equipajes/${equipajeId}/estado`, {
    token: secretario,
    body: { estado: 'EN_TRANSITO' },
  });
  check('Rechaza transición inválida de equipaje', r.status === 400, `(${r.status})`);

  r = await req('GET', `/api/historial-equipaje/equipaje/${equipajeId}`, { token: secretario });
  check(
    'Historial de equipaje registra tramos, banda y entrega',
    r.status === 200 &&
      r.data.filter((h) => h.estado_nuevo === 'EN_TRANSITO').length >= 2 &&
      r.data.some((h) => h.estado_nuevo === 'EN_BANDA') &&
      r.data.some((h) => h.estado_nuevo === 'ENTREGADO'),
    `(${r.status}, ${r.data?.length})`
  );

  r = await req('GET', '/api/notificaciones', { token: secretario });
  check(
    'Notificaciones automáticas de equipaje',
    r.status === 200 &&
      r.data.some((n) => n.id_pasajero === 2 && n.tipo === 'ESCALA') &&
      r.data.some((n) => n.id_pasajero === 2 && n.tipo === 'BANDA_EQUIPAJE'),
    `(${r.status})`
  );

  // --- Vínculo usuario-pasajero ---
  r = await req('POST', '/api/usuarios', {
    token: admin,
    body: {
      id_rol: 3,
      nombre_usuario: 'pasajero_test',
      password: 'Pasajero123!',
      nombres: 'Pasajero',
      apellidos: 'Prueba',
      correo: 'pasajero.test@aeropuerto.test',
      id_pasajero: 4,
    },
  });
  check('Admin crea usuario vinculado a pasajero', r.status === 201, `(${r.status})`);

  r = await req('POST', '/api/usuarios', {
    token: admin,
    body: {
      id_rol: 3,
      nombre_usuario: 'pasajero_test2',
      password: 'Pasajero123!',
      nombres: 'Pasajero',
      apellidos: 'Prueba 2',
      correo: 'pasajero.test2@aeropuerto.test',
      id_pasajero: 4,
    },
  });
  check('No permite vincular dos usuarios al mismo pasajero', r.status === 409, `(${r.status})`);

  // --- Auditoría automática de operaciones ---
  r = await req('GET', '/api/auditoria', { token: admin });
  const acciones = new Set((r.data || []).map((item) => item.accion));
  check('Auditoría automática de creación de vuelo', acciones.has('CREAR_VUELOS'), `(${[...acciones].join(', ')})`);
  check('Auditoría automática de actualización de vuelo', acciones.has('ACTUALIZAR_VUELOS'));
  check('Auditoría automática de equipaje', acciones.has('ACTUALIZAR_EQUIPAJES'));
  check('Auditoría automática de tramo de equipaje', acciones.has('CREAR_EQUIPAJE_VUELO'));
  check('Auditoría automática de usuario', acciones.has('CREAR_USUARIOS'));

  // --- Eliminación ---
  r = await req('POST', '/api/vuelos', {
    token: secretario,
    body: {
      ...vueloBase,
      codigo_vuelo: 'TSTDEL',
      id_puerta: 19,
      fecha_salida: '2026-12-10',
      hora_salida: '08:00',
      fecha_llegada: '2026-12-10',
      hora_llegada: '10:00',
    },
  });
  check('Crea vuelo para eliminar', r.status === 201, `(${r.status})`);
  const vueloBorrarId = r.data.vuelo?.id_vuelo;

  r = await req('DELETE', `/api/vuelos/${vueloBorrarId}`, { token: admin });
  check('Admin elimina vuelo sin dependencias', r.status === 200, `(${r.status})`);

  r = await req('DELETE', `/api/vuelos/${vueloId}`, { token: admin });
  check('No elimina vuelo con historial', r.status === 409, `(${r.status})`);

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
