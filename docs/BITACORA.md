# Bitácora de sesiones — Sistema de Gestión de Vuelos (AICM)

> Registro append-only. La entrada más reciente va arriba.
> Primera entrada registrada: esta bitácora se creó el 2026-10-29. El trabajo de
> `v1.0.0` a `v1.2.0` queda documentado en el README y en los tags del repositorio.

---

## 2026-11-01 · Sesión 4 · Entorno local con Docker y preparación del despliegue

- **Objetivo:** poder levantar el sistema completo en local y dejar listo el despliegue gratuito en Render + Vercel.
- **Rama:** `feature/v1.5.1-despliegue`, creada desde `feature/v1.5.0-rabbitmq` (PR #10 abierto).
- **Hecho en esta sesión:**
  - `docker-compose.yml` con PostgreSQL 16 + pgvector en el puerto **5433** (para no chocar con el PostgreSQL nativo del equipo) y RabbitMQ 3.13 con panel de administración en el 15672.
  - `.env` local apuntando a los contenedores; la cadena de Neon quedó comentada como respaldo. El archivo no se versiona.
  - Verificación local real: base inicializada, `/health` con base y mensajería en `ok`, y todas las suites ejecutadas (ver abajo).
  - `scripts/iniciar-produccion.js`: supervisor que ejecuta API y worker en un solo servicio web, porque el plan gratuito de Render no incluye Background Workers. Reinicia el worker si se cae y detiene todo si la API termina.
  - `render.yaml` con el blueprint del servicio (plan free, health check, variables y secretos), `frontend/vercel.json` y `docs/DESPLIEGUE.md` con el paso a paso.
  - `scripts/cambiar-password.js` (`npm run db:password`) para reemplazar las contraseñas del seed antes de publicar.
  - Las pruebas aceptan `ADMIN_USUARIO` y `ADMIN_PASSWORD` por entorno, de modo que siguen funcionando después del cambio de contraseña.
  - `.env.example` documenta las variables de pruebas y de producción.
- **Archivos tocados:** `docker-compose.yml`, `render.yaml`, `frontend/vercel.json`, `scripts/iniciar-produccion.js`, `scripts/cambiar-password.js`, `docs/DESPLIEGUE.md`, `docs/BITACORA.md`, `package.json`, `.env.example`, `tests/api.v1.1.0.js`, `tests/panel.v1.3.0.js`, `tests/rabbitmq.v1.5.0.js`.
- **Verificación:**
  - `docker compose up -d` → PostgreSQL y RabbitMQ en estado `healthy`.
  - `npm run db:init` → 25 puertas, 12 vuelos, 6 pasajeros, 8 equipajes, 12 notificaciones.
  - `npm run start:prod` → API y worker arrancan juntos; `/health` responde `base_datos: ok`.
  - `npm test` → **65 PASS / 0 FAIL** (API), **29 PASS / 0 FAIL** (reportes), **14 PASS / 0 FAIL** (panel).
  - `npm run test:rabbitmq` → **10 PASS / 0 FAIL** con el worker del supervisor.
  - Prueba de caída: al matar la API, el supervisor termina con código 1, apaga el worker y no deja procesos colgados.
  - `npm run db:password` → valida argumentos y usuario inexistente (no se cambió ninguna contraseña real).
- **Versión:** sin cambio todavía. Se propone **PATCH 1.5.1** cuando el despliegue público esté verificado; aún no hay URL ni tag.
- **Commits/PR:** `6d57588` (entorno Docker) y `6199dbc` (despliegue); esta entrada va en el commit siguiente. PR #11 abierto desde el fork; la rama se rebasó sobre `main` (que ya incluye la v1.5.0) para eliminar el conflicto.
- **Pendiente / siguiente paso:** crear CloudAMQP y SMTP; aplicar el blueprint en Render; desplegar el frontend en Vercel; cargar el esquema en Neon; cambiar contraseñas; verificar las URLs públicas; recién entonces cerrar v1.5.1, actualizar README y tag.
- **Decisiones o riesgos:**
  - El plan gratuito de Render duerme el servicio tras ~15 minutos sin tráfico: el worker también se pausa y los mensajes esperan en CloudAMQP. Para la defensa conviene mantenerlo despierto.
  - El plan gratuito no permite un worker separado; va supervisado dentro del mismo servicio. Es una concesión del plan, documentada.
  - `npm run test:api` no es idempotente y modifica datos: no debe ejecutarse contra producción.

---

## 2026-10-31 · Sesión 3 · Cierre de v1.5.0 (RabbitMQ)

- **Objetivo:** revisar, verificar y cerrar la release v1.5.0 de mensajería asíncrona.
- **Rama:** `feature/v1.5.0-rabbitmq`, creada a partir de `main` (v1.4.0).
- **Hecho en esta sesión:**
  - Revisión completa del trabajo pendiente de v1.5.0: cola, worker, entregas, migración, pruebas y documentación.
  - Versión `1.4.0` → `1.5.0` en backend y frontend (`package.json` y lockfiles).
  - Documentación de todas las variables de RabbitMQ (`RABBITMQ_EXCHANGE_FALLIDAS`, colas de fallidos/reintentos, TTL y prefetch).
  - Endurecimiento del worker: si la conexión o el canal se cierran, termina con código 1 para que el supervisor lo reinicie.
- **Archivos tocados:** `package.json`, `package-lock.json`, `frontend/package.json`, `frontend/package-lock.json`, `.env.example`, `README.md`, `docs/RABBITMQ.md`, `docs/BITACORA.md`, `workers/notificaciones.worker.js`; más los archivos de v1.5.0 que estaban sin commitear.
- **Verificación:**
  - `node --check` sobre todos los archivos JS del backend → OK.
  - `npm run build` en `frontend/` → 73 módulos; `index.js` 214.59 kB (67.62 kB gzip) y `index.css` 19.67 kB (4.64 kB gzip).
  - No se ejecutaron `test:api`, `test:reportes`, `test:panel` ni `test:rabbitmq` en esta sesión: requieren API, base y broker/worker levantados.
- **Versión:** MINOR — `1.4.0` → `1.5.0`: mensajería asíncrona, worker, traza de entregas y vista BI; compatible con la API existente.
- **Commits/PR:** se registran al ejecutar el push y abrir el PR de la rama.
- **Pendiente / siguiente paso:** aprobar y fusionar el PR; agente de IA + RAG; `.pbix` de Power BI; despliegue y manual técnico.
- **Decisiones o riesgos:**
  - El worker ahora depende de que el supervisor lo reinicie si el broker cae; en Render/Railway hay que configurarlo como worker con reinicio automático.
  - Sin `RABBITMQ_URL` la mensajería queda desactivada; la API sigue funcionando.

---

## 2026-10-29 · Sesión 2 · Frontend del panel (v1.4.0)

- **Objetivo:** construir la interfaz web del panel operativo y cerrar la release v1.4.0.
- **Rama:** `feature/v1.4.0-frontend`, creada a partir de `feature/v1.3.0-panel` (PR #7 aún pendiente de aprobación para llegar a `main`).
- **Hecho en esta sesión:**
  - Proyecto **React 18 + Vite 5** en `frontend/`, con proxy de `/api` y `/socket.io` hacia el backend.
  - Inicio de sesión con JWT, persistencia del token y control de acceso: solo ADMINISTRADOR y SECRETARIO.
  - Panel con 7 KPIs, mapa de las 25 puertas agrupadas por zona con detalle del vuelo, tabla de vuelos con búsqueda/filtro, bandas de equipaje y avisos recientes.
  - Tiempo real: `useSocket` escucha `panel:actualizar` y refresca el tablero; respaldo por sondeo cada 30 s.
  - Reportería en pantalla: catálogo de 16 reportes, filtros dinámicos, totales y descarga autenticada en Excel y PDF.
  - Diseño accesible: paleta validada, estados con icono y etiqueta (nunca solo color), modo claro/oscuro, responsive y foco visible.
  - Documentación del frontend en `frontend/README.md` y actualización del README principal.
- **Archivos tocados:** `frontend/` (configuración, `src/**`, `README.md`, `.env.example`), `README.md`, `package.json`, `.gitignore`, `docs/BITACORA.md`
- **Verificación:**
  - `npm run build` → 73 módulos; `index.js` 214.59 kB (67.62 kB gzip) y `index.css` 19.67 kB (4.64 kB gzip).
  - E2E con Playwright + Edge: login correcto, 7 KPIs, 25 puertas, 12 vuelos, 6 filas en el reporte; **sin errores de consola ni respuestas HTTP ≥ 400**.
  - Tiempo real: `POST /api/notificaciones` → el aviso apareció sin recargar la página (5 consultas a `/api/panel` por el socket); `DELETE` → 200.
  - Móvil 390 px: `scrollWidth = innerWidth = 390`, sin desbordamiento horizontal.
  - Modo oscuro verificado por captura.
- **Versión:** MINOR — `1.3.0` → `1.4.0`: frontend nuevo y compatible con la API existente.
- **Commits/PR:** `5f737f2` (frontend), `453bcff` (release) y tag `v1.4.0`; PR #8 hacia `main`, apilado sobre el PR #7.
  - Corrección: la entrada se redactó antes del push; los hashes y el PR quedan registrados aquí.
- **Pendiente / siguiente paso:** aprobar y fusionar el PR #7 (v1.3.0) y el de esta rama; RabbitMQ/Kafka; agente de IA + RAG; `.pbix` de Power BI; despliegue y manual técnico.
- **Decisiones o riesgos:**
  - El frontend es de consulta y reportería; las altas y ediciones siguen por la API.
  - El seed usa fechas fijas (1–6 de octubre de 2026), por lo que “Vuelos hoy” aparece en 0. Conviene hacer el seed relativo antes de la defensa.
  - En producción hay que definir `CORS_ORIGIN` con el dominio del frontend y `VITE_API_URL` con la URL del backend.

---

## 2026-10-29 · Sesión 1 · Cierre de v1.3.0 (panel operativo en tiempo real)

- **Objetivo:** cerrar el relanzamiento del panel operativo, fusionar v1.2.0 en `main` y dejar v1.3.0 lista para Pull Request.
- **Rama:** `feature/v1.3.0-panel`
- **Hecho en esta sesión:**
  - Revisión del panel pendiente y verificación en vivo contra PostgreSQL (Neon): `/health`, login, `GET /api/panel` y exportaciones Excel/PDF.
  - Nueva prueba de integración `tests/panel.v1.3.0.js` (permisos, 15 KPIs, 25 puertas, 10 bandas, estructura de vuelos/notificaciones y handshake de Socket.IO).
  - Script `npm run test:panel`; `npm test` ahora incluye API, reportería y panel.
  - README actualizado a v1.3.0: novedades, estructura, variable `CORS_ORIGIN`, endpoint del panel, ejemplo de cliente Socket.IO, limitaciones y hoja de ruta.
  - `package.json` actualizado a `1.3.0`.
- **Contexto (no es trabajo nuevo de esta sesión):** el código del panel (`panel.service`, `panel.controller`, `panel.routes`, `socket.js`, `eventos-panel.js`, `panel.hooks.js`, `lib/cors.js` y los cambios en `app.js`/`models/index.js`) ya estaba en el árbol de trabajo sin commitear al iniciar la sesión. Esta sesión lo revisó, probó y documentó.
- **Archivos tocados:** `tests/panel.v1.3.0.js`, `package.json`, `README.md`, `docs/BITACORA.md`
- **Verificación:**
  - `GET /health` → `{"estado":"ok","base_datos":"ok"}`
  - `npm run test:panel` → **14 PASS, 0 FAIL**
  - `npm run test:reportes` → **29 PASS, 0 FAIL**
  - `GET /api/reportes` → 16 reportes; exportación Excel (7 360 bytes) y PDF (2 538 bytes) con HTTP 200.
- **Versión:** MINOR — `1.2.0` → `1.3.0`: funcionalidad nueva compatible (panel, Socket.IO, `CORS_ORIGIN`, script de pruebas). No rompe contratos existentes.
- **Commits/PR:** `473e85c` (panel), `5014130` (release) y tag `v1.3.0`; PR #6 apilado sobre #5.
  - Corrección: esta entrada se redactó antes de ejecutar los commits; aquí quedan registrados tras el push. La fusión de #5 y #6 sigue pendiente de la revisión requerida en `main`.
- **Pendiente / siguiente paso:** frontend del panel; RabbitMQ/Kafka; agente de IA + RAG; `.pbix` de Power BI; despliegue y manual técnico.
- **Decisiones o riesgos:**
  - Socket.IO emite solo la señal `panel:actualizar`; el cliente vuelve a consultar `GET /api/panel`. Menos acoplamiento y un único contrato de datos.
  - La emisión se pospone a `afterCommit` cuando el cambio está dentro de una transacción, para no publicar estados no confirmados.
  - Riesgo: `panel.service.js` compara fechas con `new Date(`${fecha}T${hora}`)` en hora local del servidor; en producción (UTC) puede clasificar mal un vuelo "en curso". Revisar antes del despliegue.
  - Riesgo: el panel limita a 300 vuelos sin filtro de fecha en el servidor; se documentó como limitación conocida.
