// ============================================================
// Arranque de producción en un solo servicio web.
//
// El plan gratuito de Render no incluye Background Workers, así que el
// worker de notificaciones se ejecuta junto a la API dentro del mismo
// servicio. Este supervisor:
//
//   - inicia la API y, si hay RABBITMQ_URL, el worker;
//   - reinicia el worker si se cae (con espera creciente);
//   - si la API termina, detiene todo para que Render reinicie el servicio;
//   - reenvía SIGTERM/SIGINT a los hijos para un apagado ordenado.
//
// Uso: npm run start:prod
// ============================================================

const path = require('node:path');
const { spawn } = require('node:child_process');

// En Render las variables ya están en el entorno. Esto permite probar
// `npm run start:prod` en local leyendo el .env de la raíz.
require('dotenv').config({
  path: path.join(__dirname, '..', '.env'),
  quiet: true,
});

const RAIZ = path.join(__dirname, '..');
const REINTENTO_BASE_MS = Number(process.env.WORKER_REINTENTO_MS || 5000);
const REINTENTO_MAXIMO_MS = 30000;
const ESPERA_APAGADO_MS = 10000;

let apagando = false;
let api = null;
let worker = null;
let temporizadorReinicio = null;
let intentos = 0;

const registrar = (proceso, mensaje) => {
  console.log(`[${new Date().toISOString()}] [${proceso}] ${mensaje}`);
};

const lanzar = (nombre, script) => {
  const hijo = spawn(process.execPath, [script], {
    cwd: RAIZ,
    env: process.env,
    stdio: 'inherit',
  });

  hijo.on('error', (error) => {
    registrar(nombre, `no se pudo iniciar: ${error.message}`);
  });

  return hijo;
};

const detenerTodo = (codigo = 0) => {
  if (apagando) {
    return;
  }

  apagando = true;

  if (temporizadorReinicio) {
    clearTimeout(temporizadorReinicio);
    temporizadorReinicio = null;
  }

  // Solo se espera a los procesos que siguen vivos. Si la API ya terminó
  // (el caso que dispara este apagado), no hay a quién esperar.
  const hijos = [api, worker].filter(
    (hijo) =>
      hijo && hijo.exitCode === null && hijo.signalCode === null
  );

  if (hijos.length === 0) {
    process.exit(codigo);
  }

  hijos.forEach((hijo) => {
    try {
      hijo.kill('SIGTERM');
    } catch {
      // El proceso ya terminó.
    }
  });

  // Si algún hijo no termina a tiempo, se fuerza la salida.
  const limite = setTimeout(() => {
    hijos.forEach((hijo) => {
      try {
        hijo.kill('SIGKILL');
      } catch {
        // El proceso ya terminó.
      }
    });
    process.exit(codigo);
  }, ESPERA_APAGADO_MS);

  let pendientes = hijos.length;

  hijos.forEach((hijo) => {
    hijo.once('exit', () => {
      pendientes -= 1;

      if (pendientes === 0) {
        clearTimeout(limite);
        process.exit(codigo);
      }
    });
  });
};

const iniciarWorker = () => {
  if (apagando) {
    return;
  }

  if (!process.env.RABBITMQ_URL) {
    registrar(
      'worker',
      'RABBITMQ_URL no configurada; el worker no se inicia.'
    );
    return;
  }

  registrar('worker', 'iniciando el consumidor de notificaciones.');
  worker = lanzar('worker', path.join('workers', 'notificaciones.worker.js'));

  worker.on('exit', (codigo, senal) => {
    worker = null;

    if (apagando) {
      return;
    }

    intentos += 1;
    const espera = Math.min(
      REINTENTO_BASE_MS * intentos,
      REINTENTO_MAXIMO_MS
    );

    registrar(
      'worker',
      `terminó (código ${codigo}, señal ${senal}). ` +
        `Se reinicia en ${espera} ms.`
    );

    temporizadorReinicio = setTimeout(iniciarWorker, espera);
  });
};

registrar('supervisor', 'arrancando API y worker en el mismo servicio.');
registrar('api', 'iniciando el servidor HTTP.');
api = lanzar('api', 'app.js');
iniciarWorker();

api.on('exit', (codigo, senal) => {
  if (apagando) {
    return;
  }

  registrar(
    'api',
    `terminó (código ${codigo}, señal ${senal}). ` +
      'Se detiene el servicio para que la plataforma lo reinicie.'
  );

  // Códigos fuera de 0–255 (por ejemplo, al matar el proceso en Windows)
  // se normalizan; un cierre inesperado siempre reinicia el servicio.
  const codigoSalida =
    Number.isInteger(codigo) && codigo > 0 && codigo <= 255 ? codigo : 1;

  detenerTodo(codigoSalida);
});

process.on('SIGTERM', () => {
  registrar('supervisor', 'SIGTERM recibido; apagando el servicio.');
  detenerTodo(0);
});

process.on('SIGINT', () => {
  registrar('supervisor', 'SIGINT recibido; apagando el servicio.');
  detenerTodo(0);
});
