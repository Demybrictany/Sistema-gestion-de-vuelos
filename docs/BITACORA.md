# Bitácora de sesiones — Sistema de Gestión de Vuelos (AICM)

> Registro append-only. La entrada más reciente va arriba.
> Primera entrada registrada: esta bitácora se creó el 2026-10-29. El trabajo de
> `v1.0.0` a `v1.2.0` queda documentado en el README y en los tags del repositorio.

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
