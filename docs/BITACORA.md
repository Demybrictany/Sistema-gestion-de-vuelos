# Bitácora de sesiones — Sistema de Gestión de Vuelos (AICM)

> Registro append-only. La entrada más reciente va arriba.
> Primera entrada registrada: esta bitácora se creó el 2026-10-29. El trabajo de
> `v1.0.0` a `v1.2.0` queda documentado en el README y en los tags del repositorio.

---

## 2026-11-01 · Sesión 6 · Avisos de dominio y corrección del RAG (v1.6.1)

- **Objetivo:** cumplir los dos avisos de dominio que faltaban (hora de salida inicial y puerta de escala) y corregir el troceado del corpus RAG.
- **Rama:** `feature/v1.6.1-dominio`, creada desde `feature/v1.6.0-agente-ia`.
- **Hecho en esta sesión:**
  - Al asignar un pasajero a un vuelo se crea un aviso con código, fecha, hora y puerta (si ya existe); también al reactivar una reserva cancelada.
  - Nuevo `services/escala.service.js`: valida itinerario, vuelo, aeropuertos, horarios y puertas operativas en una transacción; el controlador quedó delgado.
  - Al crear o cambiar la puerta de salida de una escala se notifica al pasajero del itinerario con `PUERTA_ASIGNADA` o `CAMBIO_PUERTA`, hora y número de puerta.
  - `test:escalas`: 11 verificaciones de ambos avisos, rechazo de puerta en mantenimiento y limpieza de los datos creados.
  - Corrección del troceado RAG: reconocía solo `\n\n` y con CRLF dejaba cada documento en un solo fragmento; ahora acepta `\r?\n\s*\r?\n`, parte bloques largos y reindexa si cambió el número de fragmentos.
  - Ingesta local y de Neon rehecha: 4 documentos y 13 fragmentos.
- **Archivos tocados:** `services/pasajero_vuelo.service.js`, `services/escala.service.js`, `controllers/escala.controller.js`, `services/rag.service.js`, `tests/escalas.v1.6.1.js`, `package.json`, `package-lock.json`, `frontend/package.json`, `frontend/package-lock.json`, `frontend/README.md`, `README.md`, `docs/MANUAL_TECNICO.md`, `CLAUDE.md`, `docs/BITACORA.md`.
- **Verificación:**
  - `npm run test:escalas` → **11 PASS / 0 FAIL**.
  - `npm test` → **66 + 29 + 14 + 12 + 11 PASS**, 0 FAIL; `npm run test:rabbitmq` → **10 PASS / 0 FAIL**.
  - `npm run rag:ingestar` → 2 + 3 + 5 + 3 = **13 fragmentos**; la misma ingesta se aplicó a Neon.
  - Prueba manual: el aviso de reserva incluye código, fecha, hora y puerta; el de escala cambia de A02 a A03 y genera `CAMBIO_PUERTA`.
- **Versión:** **PATCH** — `1.6.0` → `1.6.1`: avisos de dominio, servicio de escalas y corrección del RAG; compatible con la API existente.
- **Commits/PR:** pendientes al cierre de esta entrada; PR #13 apilado sobre el #12.
- **Pendiente / siguiente paso:** redesplegar Render con la rama de la release; aprobar y fusionar los PR; tablero `.pbix` de Power BI.
- **Decisiones o riesgos:**
  - Las escalas validan que la puerta exista y esté operativa, pero no participan en la restricción `EXCLUDE` temporal de los vuelos.
  - Si se quita la puerta de salida de una escala no se envía aviso, porque no hay una puerta nueva que comunicar.
  - La reindexación depende de que cambie el número de fragmentos o el contenido; si se cambia solo el criterio sin alterar el conteo, hay que borrar los documentos o cambiar el hash.

---

## 2026-11-01 · Sesión 5 · Agente de IA + RAG (v1.6.0)

- **Objetivo:** implementar el agente de IA con RAG, herramientas sobre datos reales, citas de fuentes y logs, sin depender de una API key para la demo.
- **Rama:** `feature/v1.6.0-agente-ia`, creada desde `feature/v1.5.1-despliegue`.
- **Hecho en esta sesión:**
  - Esquema y migración v1.6.0: `documentos_rag`, `fragmentos_rag` (con `tsvector` generado y `vector(1024)` opcional) e `interacciones_agente`; vista `bi_interacciones_agente`.
  - Corpus RAG en `docs/rag/`: manual operativo, políticas de pasajero, FAQ y catálogo de aeropuertos.
  - Ingesta idempotente por hash (`npm run rag:ingestar`), troceado con solape y embeddings opcionales con Voyage AI.
  - Recuperación híbrida: pgvector si hay embeddings; texto completo en español con `websearch_to_tsquery`/`ts_rank`; `ILIKE` como respaldo.
  - Herramientas con alcance por rol: vuelos, puertas, equipaje, escalas, mis vuelos y búsqueda documental. El filtro por pasajero se hace en SQL.
  - Proveedor de IA intercambiable: modo local determinista (RAG + herramientas) y Claude con tool use mediante el SDK oficial (`claude-opus-5-5`), con caída al modo local si la API falla.
  - `POST /api/agente/consultas`, logs para admin, listado de documentos e ingesta; límite de 30 consultas/minuto por usuario.
  - Chat **Asistente** en el frontend con sugerencias y fuentes citadas.
  - Pruebas `test:agente` y migración/ingesta aplicadas a Neon.
- **Archivos tocados:** `db/postgres/schema.sql`, `db/postgres/views_bi.sql`, `scripts/migrate-v1.6.0.js`, `scripts/ingestar-rag.js`, `docs/rag/*.md`, `docs/AGENTE_IA.md`, `services/rag.service.js`, `services/agente.tools.js`, `services/agente.service.js`, `lib/agente.proveedor.js`, `lib/embeddings.js`, `controllers/agente.controller.js`, `routes/agente.routes.js`, `middlewares/rate-limit.middleware.js`, `validators/schemas.js`, `app.js`, `tests/agente.v1.6.0.js`, `frontend/src/App.jsx`, `frontend/src/components/AgentChat.jsx`, `frontend/src/styles.css`, `frontend/README.md`, `README.md`, `.env.example`, `render.yaml`, `package.json`, `frontend/package.json` y lockfiles.
- **Verificación:**
  - `npm run rag:ingestar` → 4 documentos, 13 fragmentos.
  - `npm run test:agente` → **12 PASS / 0 FAIL** (ingesta, citas, datos operativos, alcance de pasajeros, logs, permisos e idempotencia).
  - `npm test` → **66 + 29 + 14 + 12 PASS**, 0 FAIL; `npm run test:rabbitmq` → **10 PASS / 0 FAIL**.
  - `npm run build` en `frontend/` → 74 módulos; `index.js` 218.12 kB (68.66 kB gzip).
  - Neon: migración aplicada (0 documentos al inicio), ingesta de 13 fragmentos y 11 vistas BI.
- **Versión:** **MINOR** — `1.5.1` → `1.6.0`: agente de IA, RAG, herramientas, logs y chat; compatible con la API existente.
- **Commits/PR:** `702b9db` (base de datos), `d14d1fd` (agente), `8ceec21` (UI), `3163270` (pruebas) y el commit de esta documentación; PR #12 desde el fork.
- **Pendiente / siguiente paso:** cambiar la rama del servicio de Render a `feature/v1.6.0-agente-ia` y redesplegar; opcionalmente definir `ANTHROPIC_API_KEY`; aprobar y fusionar los PR #11 y #12; después, Power BI y manual técnico.
- **Decisiones o riesgos:**
  - El modo local no es un modelo generativo: compone respuestas con fragmentos y datos. Para respuestas conversacionales hace falta una API key.
  - El RAG exige la extensión `vector`; está en la imagen Docker y en Neon.
  - Sin `VOYAGE_API_KEY` no hay búsqueda vectorial; se usa texto completo en español.
  - El límite de consultas es en memoria; en varias instancias debe moverse a Redis o al proxy.
  - El agente no modifica datos y nunca devuelve información de otros pasajeros.

---

## 2026-11-01 · Sesión 4 · Entorno local, despliegue en producción y v1.5.1

- **Objetivo:** levantar el sistema completo en local y desplegarlo en producción con el plan gratuito de Render + Vercel.
- **Rama:** `feature/v1.5.1-despliegue`, rebasada sobre `main` después de la fusión del PR #10. PR #11 abierto desde el fork `jjemd101191/Sistema-gestion-de-vuelos`.
- **Hecho en esta sesión:**
  - `docker-compose.yml` con PostgreSQL 16 + pgvector en el puerto **5433** (para no chocar con el PostgreSQL nativo) y RabbitMQ 3.13 con panel de administración en el 15672.
  - `scripts/iniciar-produccion.js`: supervisor que ejecuta API y worker en un solo servicio web, porque el plan gratuito de Render no incluye Background Workers. Reinicia el worker si se cae y detiene todo si la API termina.
  - `render.yaml`, `frontend/vercel.json`, `docs/DESPLIEGUE.md` y `scripts/cambiar-password.js` (`npm run db:password`).
  - Despliegue real: API + worker en Render, frontend en Vercel, Neon, CloudAMQP y Ethereal.
  - Seed relativo: al ejecutar `db:init` las fechas se desplazan para que el “hoy” original (2 de octubre de 2026) sea la fecha real; hoy quedan 5 vuelos.
  - Contraseñas de `admin` y `secretario` rotadas en producción (no se registran aquí).
  - Pruebas con credenciales configurables por entorno (`ADMIN_*`, `SECRETARIO_*`, `PASAJERO_*`).
  - README actualizado a v1.5.1 con las URLs públicas y la guía de despliegue.
- **Archivos tocados:** `docker-compose.yml`, `render.yaml`, `frontend/vercel.json`, `scripts/iniciar-produccion.js`, `scripts/cambiar-password.js`, `docs/DESPLIEGUE.md`, `docs/BITACORA.md`, `README.md`, `package.json`, `package-lock.json`, `frontend/package.json`, `frontend/package-lock.json`, `.env.example`, `db/postgres/seed.sql`, `tests/api.v1.1.0.js`, `tests/panel.v1.3.0.js`, `tests/reportes.v1.2.0.js`, `tests/rabbitmq.v1.5.0.js`.
- **Verificación:**
  - `docker compose up -d` → PostgreSQL y RabbitMQ en estado `healthy`.
  - `npm run db:init` → 25 puertas, 12 vuelos (5 de hoy), 6 pasajeros, 8 equipajes, 12 notificaciones.
  - `npm test` → **66 PASS / 0 FAIL** (API), **29 PASS / 0 FAIL** (reportes), **14 PASS / 0 FAIL** (panel).
  - `npm run test:rabbitmq` → **10 PASS / 0 FAIL** con el worker del supervisor.
  - Prueba de caída: al matar la API, el supervisor termina con código 1, apaga el worker y no deja procesos colgados.
  - Producción: `/health` 200 con base y mensajería; panel **14/14**, reportes **29/29**, RabbitMQ **10/10**; login con la contraseña nueva 200 y con la anterior 401.
  - Frontend: el bundle de Vercel contiene la URL de Render; login cruzado y `GET /api/panel` con el `Origin` de Vercel responden 200 (12 vuelos, 25 puertas, 10 bandas, 15 KPIs).
  - Neon: 12 vuelos, 5 de hoy, rango del 31/10 al 05/11.
- **Versión:** **PATCH** — `1.5.0` → `1.5.1`: despliegue, entorno local, seed relativo y pruebas; sin cambios de contrato.
- **Commits/PR:** el entorno Docker y el despliegue entraron a `main` con el PR #11; tras rebasar, los commits propios son `4059a4c` (seed relativo y pruebas), `0f56c76` (release v1.5.1) y `5f70d1d` (esta bitácora). Tag `v1.5.1` en la rama del fork.
- **Pendiente / siguiente paso:** Demy debe aprobar y fusionar el PR #11; cambiar `CORS_ORIGIN` en Render al dominio de Vercel; iniciar la v1.6.0 (agente de IA + RAG).
- **Decisiones o riesgos:**
  - Render free duerme el servicio tras ~15 minutos sin tráfico: el worker también se pausa y los mensajes esperan en CloudAMQP. Para la defensa conviene despertarlo antes.
  - El plan gratuito no permite un worker separado; va supervisado dentro del mismo servicio.
  - Ethereal es una bandeja de pruebas; para correo real hay que configurar Gmail o Mailtrap.
  - `CORREO_MODO` sigue en `simulado` en producción; las credenciales SMTP ya están cargadas y se puede cambiar a `smtp`.
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
