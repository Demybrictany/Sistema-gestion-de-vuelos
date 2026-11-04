# Distribución de responsabilidades y estado real

**Proyecto:** Sistema de Gestión de Vuelos, Pasajeros y Equipaje — AICM  
**Grupo:** 7  
**Versión del sistema:** `v1.6.2`  
**Fecha de actualización:** 2026-11-02  
**Integrantes:** Juanjo y Demy  
**Nota:** la asignación “Integrante 1 / Integrante 2” es la del plan original;
sustituir por los nombres si se prefiere.

> Este documento reemplaza el plan de fases 6–12. El plan original se escribió
> antes de varias decisiones técnicas y ya no coincide con el repositorio:
> el sistema usa **PostgreSQL**, tiene **16 reportes** y el flujo asíncrono
> publica `notificacion.creada`. El estado real es el de este documento.

---

## 1. Resumen ejecutivo

El sistema está desplegado y funcionando en producción:

- API: https://sistema-vuelos-api.onrender.com — `GET /` responde `1.6.2`.
- Frontend: https://sistema-gestion-de-vuelos.vercel.app
- `/health`: `base_datos: ok`; el worker de RabbitMQ está conectado.
- Base: Neon (PostgreSQL). Mensajería: CloudAMQP. Frontend: Vercel.

**Lo que falta para cerrar la rúbrica:**

1. El tablero **`.pbix` de Power BI** (la brecha más clara).
2. Commitear la carpeta `manual/` (manuales de usuario, administrador y procedimientos).
3. Ensayar la defensa con el guion de `docs/GUION_DEMO.md`.
4. Opcional: activar Claude en producción (`AGENTE_PROVEEDOR=claude` + API key).
5. Opcional: corregir el reclamo de entrega para el doble envío y añadir el índice único de asiento.

---

## 2. Correcciones al plan original

| Plan original | Implementación real |
|---|---|
| MySQL | **PostgreSQL** (Sequelize 6 + Neon), con restricciones, ENUMs, transacciones y `EXCLUDE` para puertas. |
| 15 reportes | **16 reportes** con filtros y exportación Excel/PDF. |
| Eventos `vuelo.actualizado`, `vuelo.cancelado`, `equipaje.actualizado` | Evento real `notificacion.creada`, publicado después del commit. La notificación se persiste antes de publicar. |
| El consumidor genera notificaciones persistidas | El worker **entrega** la notificación por correo y registra la traza en `entregas_notificacion`. |
| RAG con almacén vectorial obligatorio | RAG híbrido: pgvector si hay `VOYAGE_API_KEY`; si no, texto completo en español + `ILIKE`. |
| Fase 6–12 pendientes | Fases 6, 7, 8 y 9 (excepto Power BI) ya están implementadas y probadas. |

**Stack real:** Node.js 22 + Express 5 · PostgreSQL (Neon) · RabbitMQ (CloudAMQP) · React 18 + Vite · Socket.IO · agente con RAG y herramientas · ExcelJS/PDFKit.

---

## 3. Matriz de responsabilidades actualizada

| Tema | Responsable | Estado | Evidencia principal | Pendiente |
|---|---|---|---|---|
| Socket.IO y tiempo real | Integrante 1 | ✅ | `lib/socket.js`, `models/panel.hooks.js`, `frontend/src/hooks/usePanel.js`, `tests/panel.v1.3.0.js` | — |
| RabbitMQ y mensajería | Integrante 2 | ✅ | `lib/rabbitmq.js`, `workers/notificaciones.worker.js`, `services/entrega.service.js`, `tests/rabbitmq.v1.5.0.js` | Reclamo atómico (opcional) |
| LLM e integración de IA | Compartido | 🟡 | `services/agente.service.js`, `lib/agente.proveedor.js` | Confirmar `AGENTE_PROVEEDOR` en Render |
| Ingeniería de prompts | Compartido | ✅ | `services/agente.service.js`, `docs/AGENTE_IA.md` | — |
| RAG y embeddings | Integrante 2 | ✅ | `services/rag.service.js`, `scripts/ingestar-rag.js`, `docs/rag/*` (4 documentos, 13 fragmentos) | Embeddings con Voyage (opcional) |
| Chatbot en React | Integrante 1 | ✅ | `frontend/src/components/AgentChat.jsx` (pestaña Asistente) | — |
| Herramientas para consultar la base | Integrante 1 | ✅ | `services/agente.tools.js` (6 herramientas con alcance por rol) | — |
| Auditoría | Integrante 2 | ✅ | `models/auditoria.hooks.js`, `interacciones_agente`, `historial_vuelo`, `historial_equipaje`, `entregas_notificacion` | — |
| Reportes y Power BI | Integrante 2 | 🟡 | `services/reportes.service.js` (16), `lib/exportar/*`, `db/postgres/views_bi.sql` (11 vistas) | **`.pbix` de Power BI** |
| Pruebas e integración | Compartido | 🟡 | `tests/*.js` (6 scripts) | Unitarias/CI (opcional) |
| Despliegue | Compartido | ✅ | Render + Vercel + Neon + CloudAMQP | Cambiar rama de Render a `main` |
| Documentación y defensa | Compartido | 🟡 | README, `CLAUDE.md`, `AGENTS.md`, `docs/*`, `manual/` | Commitear `manual/`; ensayar defensa |

Leyenda: ✅ hecho y verificado · 🟡 hecho con algún pendiente · ❌ no hecho.

---

## 4. Estado por fase

### Fase 6 — Socket.IO y notificaciones en vivo ✅

- Socket.IO con autenticación JWT y roles `ADMINISTRADOR`/`SECRETARIO` (`lib/socket.js:17-40`).
- Los hooks del panel emiten `panel:actualizar` después del commit, no dentro de la transacción (`models/panel.hooks.js:14-23`).
- El frontend reconecta y refresca el panel sin recargar (`frontend/src/hooks/usePanel.js`).
- Pruebas: `npm run test:panel` (12 PASS en la bitácora).

### Fase 7 — Chatbot, LLM y herramientas 🟡

- Endpoint seguro `POST /api/agente/consultas` con JWT y límite de 30 consultas/minuto.
- Herramientas: `consultar_vuelos`, `consultar_puertas`, `consultar_equipaje`, `consultar_escalas`, `mis_vuelos`, `buscar_documentacion`.
- El filtro por pasajero se hace en SQL, no en el prompt (`services/agente.tools.js`).
- Proveedor local determinista y Claude con tool use (`lib/agente.proveedor.js`).
- **Pendiente de confirmar:** si producción tiene `AGENTE_PROVEEDOR=local`, el agente no es generativo; es RAG + reglas. Para la defensa hay que decirlo con claridad o configurar Claude.
- Pruebas: `npm run test:agente` (12 PASS en la bitácora).

### Fase 7 — RAG y embeddings ✅

- 4 documentos en `docs/rag/` y 13 fragmentos indexados.
- Ingesta idempotente por hash (`scripts/ingestar-rag.js`).
- Recuperación con `websearch_to_tsquery` en español, `ts_rank` y respaldo `ILIKE`; pgvector opcional.
- Cada respuesta devuelve fuentes citadas.
- Tablas: `documentos_rag`, `fragmentos_rag`, `interacciones_agente`.

### Fase 8 — RabbitMQ y auditoría ✅

- Exchange topic, cola principal, cola de reintentos con TTL y cola de fallidos (`lib/rabbitmq.js`).
- Worker con `prefetch`, ack/nack, reintentos y confirmaciones (`workers/notificaciones.worker.js`).
- Evento real: `notificacion.creada`. La notificación se guarda en PostgreSQL y el evento se publica después del commit; el worker entrega el correo.
- Traza en `entregas_notificacion` con estado, intento, destinatario y fecha.
- Auditoría automática por hooks + historiales de vuelo y equipaje + `interacciones_agente`.
- **Riesgo conocido:** el reclamo de entrega incrementa `intento` pero no reserva la fila; dos workers simultáneos podrían enviar dos veces (`services/entrega.service.js:65-79`). No afecta la demo normal.
- Pruebas: `npm run test:rabbitmq` (10 PASS en la bitácora).

### Fase 9 — Reportería y Power BI 🟡

- 16 reportes con filtros y agregaciones (`services/reportes.service.js`).
- Exportación a Excel y PDF (`lib/exportar/excel.js`, `lib/exportar/pdf.js`).
- 11 vistas `bi_*` (`db/postgres/views_bi.sql`).
- **Falta:** archivo `.pbix` y tablero publicado. `docs/POWER_BI.md` explica cómo conectar Power BI a las vistas.

### Fase 10 — Pruebas e integración 🟡

- 6 scripts de integración: `api`, `reportes`, `panel`, `rabbitmq`, `agente`, `escalas`.
- No hay pruebas unitarias ni CI. `test:api` no es idempotente: hay que reiniciar la base antes de correrlo.
- La verificación de la defensa debe incluir el flujo completo: cambio → evento → worker → entrega → aviso en el panel.

### Fase 11 — Despliegue ✅

- API + worker en Render (`npm run start:prod`), frontend en Vercel, base en Neon, mensajería en CloudAMQP.
- Producción verificada: `GET /` → `1.6.2`; `/health` → `base_datos: ok`; log `[worker] Escuchando la cola notificaciones.pasajeros`.
- **Pendiente de higiene:** Render está desplegando la rama `fix/v1.6.2-correcciones` (árbol idéntico a `main`). Cambiarla a `main` para que los próximos merges se desplieguen solos.
- CORS está en `*`; conviene fijarlo al dominio de Vercel.

### Fase 12 — Documentación y defensa 🟡

- README extenso, `CLAUDE.md`, `AGENTS.md`, manual técnico, guías de despliegue, RabbitMQ, agente y Power BI.
- `manual/` (usuario, administrador, procedimientos + PDF) sigue sin seguimiento en Git.
- Falta ensayar la demo con el guion y preparar las capturas.

---

## 5. Pendientes priorizados

| Prioridad | Tarea | Responsable | Criterio de cierre |
|---|---|---|---|
| **P0** | Crear el `.pbix` de Power BI | Integrante 2 | Archivo en `docs/powerbi/`, 3–4 páginas y capturas. |
| **P0** | Commitear `manual/` | Compartido | Carpeta visible en GitHub. |
| **P0** | Ensayar la demo completa | Compartido | Guion de `docs/GUION_DEMO.md` ejecutado sin errores. |
| **P1** | Cambiar la rama de Render a `main` | Compartido | Deploy desde `9b051c6`, `/` = 1.6.2. |
| **P1** | Confirmar el proveedor del agente | Compartido | `AGENTE_PROVEEDOR=claude` con API key, o decisión explícita de demostrar el modo local. |
| **P1** | Restringir `CORS_ORIGIN` | Compartido | Solo el dominio de Vercel. |
| **P2** | Corregir el reclamo de entrega | Integrante 2 | Sin doble envío entre workers. |
| **P2** | Índice único de asiento en la base | Integrante 1 | Restricción parcial en PostgreSQL. |
| **P2** | Pruebas unitarias / CI | Compartido | Workflow que instale y ejecute `node --check` y pruebas. |

---

## 6. Evidencias por criterio de rúbrica

| Criterio | Evidencia que se mostrará |
|---|---|
| Sistema base (5) | 16 entidades, capas routes → controllers → services → models, Zod, transacciones, restricción `EXCLUDE` de puertas, PRs y tags. |
| Agente (2) | `POST /api/agente/consultas`, herramientas por rol, citas de fuentes, `interacciones_agente`. |
| RabbitMQ (2) | Cambio de puerta → `notificacion.creada` → worker → `entregas_notificacion`; colas de reintentos y fallidos. |
| Logs y auditoría (2) | `auditoria`, `historial_vuelo`, `historial_equipaje`, `entregas_notificacion`, `interacciones_agente`. |
| Reportería + Power BI (2) | 16 reportes, exportación Excel/PDF, 11 vistas BI, `.pbix`. |
| Despliegue (1) | API 1.6.2, Vercel, Neon, CloudAMQP y `/health`. |
| Defensa (1) | Guion de demo y explicación honesta de límites. |

---

## 7. Decisiones y riesgos que deben mencionarse

- **PostgreSQL, no MySQL:** se migró para tener ENUMs, restricciones de exclusión y pgvector.
- **Agente:** el modo local no es un LLM generativo; compone respuestas con RAG y reglas. Claude es opcional y requiere API key.
- **RAG:** sin `VOYAGE_API_KEY` no hay búsqueda vectorial; se usa texto completo en español.
- **Entrega asíncrona:** el worker entrega correos; la notificación se crea antes de publicar. No es event sourcing.
- **Doble envío:** el reclamo actual no reserva la fila; es una limitación documentada.
- **Asientos:** la unicidad se garantiza en el servicio con bloqueo del vuelo; falta el índice único en la base.
- **Render:** el servicio se configuró manualmente; el `render.yaml` sirve como referencia, pero no se aplicó como Blueprint.

---

## 8. Checklist de cierre

- [ ] `.pbix` creado y capturas agregadas.
- [ ] `manual/` commiteado.
- [ ] Demo ensayada de principio a fin.
- [ ] Render en `main`.
- [ ] `/` = 1.6.2 y `/health` con base ok.
- [ ] Worker de RabbitMQ visible en el log.
- [ ] Agente probado con 3 consultas (vuelo, política con cita, datos ajenos).
- [ ] Reporte exportado en Excel y PDF.
- [ ] Auditoría e interacciones del agente mostradas.
- [ ] Documento de división actualizado (este archivo).
- [ ] Bitácora con la sesión de cierre.
