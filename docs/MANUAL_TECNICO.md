# Manual técnico — Sistema de Gestión de Vuelos AICM

**Versión:** 1.6.1
**Repositorio:** https://github.com/Demybrictany/Sistema-gestion-de-vuelos
**Producción:** [frontend](https://sistema-gestion-de-vuelos.vercel.app) · [API](https://sistema-vuelos-api.onrender.com/health)
**Equipo:** Juanjo, Demy · Universidad Mesoamericana Quetzaltenango

---

## 1. Objetivo y alcance

El sistema administra la operación de vuelos, pasajeros y equipaje del Aeropuerto
Internacional de la Ciudad de México (AICM). Cubre:

- CRUD de 16 entidades del dominio.
- Reglas de negocio en la aplicación y en la base de datos.
- Notificaciones automáticas a pasajeros.
- Historial y auditoría de operaciones.
- Reportería avanzada exportable y vistas para Power BI.
- Panel operativo en tiempo real.
- Mensajería asíncrona con RabbitMQ.
- Agente de IA con RAG sobre la documentación del negocio.
- Despliegue en producción.

---

## 2. Arquitectura

### 2.1 Vista general

```text
┌──────────────────────┐        ┌───────────────────────────┐
│ Frontend React/Vite  │──HTTPS─▶│ API Express 5             │
│ Vercel               │◀─Socket─│ Render (plan gratuito)    │
└──────────────────────┘        └───────────┬───────────────┘
                                            │
                    ┌───────────────────────┼───────────────────────┐
                    ▼                       ▼                       ▼
           ┌────────────────┐     ┌──────────────────┐     ┌────────────────┐
           │ Neon PostgreSQL│     │ CloudAMQP        │     │ Ethereal SMTP  │
           │ + pgvector     │     │ RabbitMQ + worker│     │ (correo demo)  │
           └────────────────┘     └──────────────────┘     └────────────────┘
```

En Render, la API y el worker de notificaciones se ejecutan **en el mismo servicio
web** mediante `scripts/iniciar-produccion.js`, porque el plan gratuito no incluye
*Background Workers*.

### 2.2 Capas del backend

```text
routes/        → define endpoints y permisos
controllers/   → traduce HTTP a llamadas de servicio
services/      → reglas de negocio y transacciones
models/        → entidades Sequelize y asociaciones
validators/    → esquemas Zod de entrada
middlewares/   → JWT, roles, contexto, errores, rate limit
lib/           → infraestructura (RabbitMQ, correo, Socket.IO, agente, embeddings)
db/            → conexión Sequelize y scripts SQL
workers/       → consumidor de la cola de notificaciones
```

### 2.3 Frontend

React 18 + Vite 5. Vistas: **Panel**, **Vuelos**, **Reportes** y **Asistente**.
La sesión usa JWT y Socket.IO con el mismo token. En producción consume la API de
Render mediante `VITE_API_URL`.

---

## 3. Stack

| Componente | Tecnología |
|---|---|
| Runtime | Node.js 18+ (probado en 22/24) |
| Framework | Express 5 |
| ORM | Sequelize 6 |
| Base de datos | PostgreSQL 14+ con `btree_gist` y `vector` |
| Validación | Zod 4 |
| Autenticación | JWT + bcryptjs |
| Tiempo real | Socket.IO 4 |
| Mensajería | RabbitMQ (`amqplib`) |
| Correo | Nodemailer (SMTP) o simulado |
| Reportería | ExcelJS + PDFKit |
| Agente de IA | `@anthropic-ai/sdk` (Claude) + RAG |
| Frontend | React 18 + Vite 5 |
| Despliegue | Render + Vercel + Neon + CloudAMQP |

---

## 4. Modelo de datos

### 4.1 Entidades

| Entidad | Propósito |
|---|---|
| `roles`, `usuarios` | Autenticación y permisos. |
| `pasajeros` | Datos del pasajero; puede vincularse a un usuario. |
| `aeropuertos` | Catálogo de aeropuertos (MEX, GUA, LAX, MAD, PTY, BOG). |
| `puertas` | 25 puertas A01–A25 con zona y estado. |
| `bandas_equipaje` | 10 bandas B01–B10. |
| `vuelos` | Vuelo con fechas, horas, puerta y estado. |
| `itinerarios` | Viaje de un pasajero (puede incluir conexiones). |
| `pasajero_vuelo` | Reserva de un pasajero en un vuelo. |
| `escalas` | Conexión entre dos vuelos de un itinerario. |
| `equipajes` | Equipaje con estado, banda y destino final. |
| `equipaje_vuelo` | Tramos del equipaje en cada vuelo. |
| `notificaciones` | Avisos al pasajero. |
| `entregas_notificacion` | Traza de la entrega asíncrona por canal. |
| `historial_vuelo` | Cambios de un vuelo. |
| `historial_equipaje` | Movimientos e incidencias del equipaje. |
| `auditoria` | Operaciones del sistema y del agente. |
| `documentos_rag`, `fragmentos_rag` | Corpus del agente y fragmentos recuperables. |
| `interacciones_agente` | Preguntas, respuestas, fuentes, tokens y latencia. |

### 4.2 Restricciones clave

- `EXCLUDE USING gist` impide dos vuelos solapados en la misma puerta.
- Claves foráneas con `ON DELETE` explícito (cascada, restricción o `SET NULL`).
- Enums de PostgreSQL para estados (`estado_vuelo`, `estado_equipaje`, etc.).
- Índices únicos en códigos de vuelo, equipaje, usuario y documento RAG.
- `fragmentos_rag.busqueda` es un `tsvector` generado con configuración `spanish`.
- `fragmentos_rag.embedding` es `vector(1024)` con índice HNSW.

### 4.3 Diagrama lógico

```text
aeropuertos ─┐
             ├─▶ vuelos ──▶ puertas
pasajeros ───┼─▶ itinerarios ─▶ escalas ─▶ vuelos
             ├─▶ pasajero_vuelo ─▶ vuelos
             └─▶ equipajes ─▶ equipaje_vuelo ─▶ vuelos
vuelos / equipajes / pasajeros ─▶ notificaciones ─▶ entregas_notificacion
usuarios ─▶ auditoria / interacciones_agente
```

---

## 5. Reglas de negocio

### 5.1 Vuelos

- Todo vuelo se crea en estado **PROGRAMADO**.
- Transiciones controladas: PROGRAMADO → ABORDANDO → ABORDADO → EN_VUELO →
  ATERRIZADO → FINALIZADO; RETRASADO y CANCELADO según corresponda.
- Una puerta no puede tener dos vuelos con horarios solapados (validación en
  servicio + restricción de exclusión).
- Reprogramar, cambiar puerta y cancelar exigen motivo, registran historial y
  notifican a los pasajeros con reserva activa.
- La capacidad no puede reducirse por debajo de los pasajeros asignados.

### 5.2 Pasajeros y reservas

- El cupo se valida dentro de una transacción con bloqueo (`FOR UPDATE`).
- Una reserva cancelada libera su lugar y no recibe avisos operativos.
- El usuario PASAJERO solo puede consultar su propio pasajero, vuelos, equipaje y
  notificaciones.

### 5.3 Equipaje

- El equipaje puede tener varios tramos; se valida la continuidad de la ruta.
- En una conexión no se retira: se transfiere al vuelo siguiente.
- La máquina de estados impide, por ejemplo, asignar banda a un equipaje dañado.
- Las incidencias (extraviado, dañado) quedan en el historial.

### 5.4 Notificaciones

- Se generan por puerta, cambio de puerta, banda, cambio de horario, retraso,
  cancelación, escala e información general.
- Al asignar un pasajero a un vuelo se envía un aviso inicial con código, fecha,
  hora y puerta (si existe).
- Al crear o cambiar la puerta de salida de una escala se notifica al pasajero
  del itinerario con la nueva puerta y la hora de la conexión.
- Se publican en RabbitMQ después del commit de la transacción.
- El worker envía por SMTP o simula, y registra la entrega.

---

## 6. API REST

Base: `/api`. Todas las rutas salvo `/api/auth/login` requieren JWT.

### 6.1 Autenticación

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/auth/login` | Inicia sesión y devuelve JWT. |
| `GET` | `/api/auth/me` | Devuelve el usuario autenticado. |

### 6.2 Recursos y operaciones

| Recurso | Rutas principales | Roles |
|---|---|---|
| Roles | `/api/roles` | ADMIN |
| Usuarios | `/api/usuarios` | ADMIN |
| Pasajeros | `/api/pasajeros` | ADMIN, SECRETARIO |
| Aeropuertos | `/api/aeropuertos` | ADMIN, SECRETARIO |
| Puertas | `/api/puertas` | ADMIN, SECRETARIO |
| Bandas | `/api/bandas-equipaje` | ADMIN, SECRETARIO |
| Vuelos | `/api/vuelos` + reprogramar, puerta, estado, cancelar | Por método |
| Itinerarios | `/api/itinerarios` | ADMIN, SECRETARIO |
| Reservas | `/api/pasajero-vuelo` | ADMIN, SECRETARIO |
| Escalas | `/api/escalas` | ADMIN, SECRETARIO |
| Equipajes | `/api/equipajes` + tramos, banda, estado | Por método |
| Equipaje-vuelo | `/api/equipaje-vuelo` | ADMIN, SECRETARIO |
| Notificaciones | `/api/notificaciones` + entregas | Por método |
| Historiales | `/api/historial-vuelo`, `/api/historial-equipaje` | ADMIN, SECRETARIO |
| Auditoría | `/api/auditoria` | ADMIN |
| Reportes | `/api/reportes` | ADMIN, SECRETARIO |
| Panel | `/api/panel` | ADMIN, SECRETARIO |
| Agente | `/api/agente/*` | Por ruta |

La tabla completa con filtros, ejemplos y códigos de error está en el README.

### 6.3 Errores

Formato uniforme:

```json
{ "mensaje": "Descripción del error", "errores": [] }
```

Códigos usados: 200, 201, 400 (validación), 401 (sin token), 403 (rol), 404,
409 (conflicto/duplicado), 429 (rate limit) y 500.

---

## 7. Seguridad

- **JWT** firmado con `JWT_SECRET`; expiración configurable (8 h por defecto).
- **bcryptjs** con 10 rondas para las contraseñas.
- **Roles**: ADMINISTRADOR, SECRETARIO y PASAJERO; `permitirRoles` en rutas.
- **Contexto por request** con `AsyncLocalStorage` para auditoría (usuario e IP).
- **CORS** configurable con `CORS_ORIGIN`; se restringe al dominio del frontend.
- **Rate limit** en el agente: 30 consultas/minuto por usuario (en memoria).
- `.env` fuera del repositorio; secretos solo en los paneles de Render/Vercel.
- Contraseñas del seed rotadas en producción con `npm run db:password`.
- HTTPS automático en Render y Vercel.

---

## 8. Mensajería asíncrona

```text
API ──publish──▶ exchange sistema.vuelos (topic)
                        │
                        ▼
               cola notificaciones.pasajeros
                        │
                        ▼
                     worker ──▶ SMTP / simulado
                        │
              fallo temporal → cola de reintentos (TTL)
              fallo definitivo → cola de fallidos
```

- Publicación **después del commit** de la transacción.
- Reintentos configurables (`RABBITMQ_MAX_REINTENTOS`, TTL).
- Cada entrega en `entregas_notificacion` con estado PENDIENTE/ENVIADA/SIMULADA/FALLIDA.
- Sin `RABBITMQ_URL` la API sigue funcionando; el worker no arranca.
- En producción, el supervisor reinicia el worker si se cae.

---

## 9. Reportería y Power BI

- **16 reportes** con filtros y agregaciones.
- Exportación a **Excel** y **PDF** por endpoint.
- **11 vistas `bi_*`** de solo lectura para Power BI, incluida
  `bi_interacciones_agente`.
- La guía de conexión está en [`docs/POWER_BI.md`](POWER_BI.md).

---

## 10. Agente de IA + RAG

- Endpoint `POST /api/agente/consultas`.
- Recuperación sobre `docs/rag/` con citas.
- Herramientas sobre vuelos, puertas, equipaje, escalas y datos del pasajero.
- Alcance por rol aplicado en SQL.
- Proveedor local (sin API key) o Claude con tool use.
- Logs en `interacciones_agente` y auditoría `CONSULTA_AGENTE`.
- Detalle completo en [`docs/AGENTE_IA.md`](AGENTE_IA.md).

---

## 11. Despliegue y operación

### 11.1 Componentes

| Componente | Servicio | Notas |
|---|---|---|
| Frontend | Vercel | `VITE_API_URL` en el build. |
| API + worker | Render free | `npm run start:prod`; se duerme tras ~15 min. |
| Base de datos | Neon | Cadena pooled con `sslmode=require`. |
| Mensajería | CloudAMQP | AMQP URL `amqps://`. |
| Correo | Ethereal | Bandeja de pruebas; Gmail/Mailtrap para entrega real. |

### 11.2 Comandos de operación

```bash
npm run db:init            # esquema + seed relativo + vistas (destructivo)
npm run db:migrate         # migración v1.5.0
npm run db:migrate:agente  # migración v1.6.0
npm run rag:ingestar       # indexa docs/rag
npm run db:views           # recrea vistas BI
npm run db:password -- admin "NuevaClave"
npm run start:prod         # API + worker (producción)
```

### 11.3 Salud y diagnóstico

- `GET /health` → base de datos y mensajería.
- Logs de Render: API y worker comparten el flujo; las líneas del worker llevan `[worker]`.
- CloudAMQP: panel de la instancia para colas y conexiones.
- Neon: panel de consultas y conexiones.

### 11.4 Respaldo

Neon ofrece respaldo automático y *point-in-time* según el plan. Para la demo, el
seed se puede reconstruir con `npm run db:init` (destructivo).

---

## 12. Pruebas

| Suite | Comando | Qué verifica |
|---|---|---|
| API | `npm run test:api` | CRUD, permisos, máquina de estados, cupo, conflictos, auditoría. |
| Reportería | `npm run test:reportes` | 16 reportes, filtros y exportaciones. |
| Panel | `npm run test:panel` | KPIs, puertas, bandas, serialización y Socket.IO. |
| RabbitMQ | `npm run test:rabbitmq` | API → cola → worker → entrega. |
| Agente | `npm run test:agente` | RAG, citas, datos operativos, alcance por rol y logs. |
| Todas | `npm test` | API + reportes + panel + agente. |

Resultados de referencia: **66 + 29 + 14 + 12 PASS** y **10 PASS** en RabbitMQ.

---

## 13. Solución de problemas

| Síntoma | Causa | Solución |
|---|---|---|
| `/health` 503 | `DATABASE_URL` inválida o SSL | Revisar la cadena de Neon y `DB_SSL=true`. |
| `mensajeria: configurada` | No hay conexión al broker | Revisar `RABBITMQ_URL` y el plan de CloudAMQP. |
| Error de CORS | `CORS_ORIGIN` sin el dominio de Vercel | Actualizar la variable en Render. |
| Frontend sin datos | `VITE_API_URL` vacía | Definirla y redesplegar Vercel. |
| Login 401 | Contraseña rotada | Usar la nueva o `ADMIN_PASSWORD` en pruebas. |
| Worker sin entregas | Servicio dormido o SMTP mal configurado | Despertar Render y revisar logs `[worker]`. |
| Agente sin documentos | Falta la ingesta | `npm run rag:ingestar` o `POST /api/agente/ingestar`. |
| Ingesta falla por `vector` | Extensión pgvector ausente | Usar la imagen Docker o habilitarla en Neon. |

---

## 14. Versionado y flujo de trabajo

- SemVer `MAJOR.MINOR.PATCH`; una rama `feature/vX.Y.Z-tema` por módulo.
- PR por módulo; la fusión a `main` es la release.
- Bitácora append-only en [`docs/BITACORA.md`](BITACORA.md).
- Commits descriptivos con qué, por qué y verificación.

| Versión | Contenido |
|---|---|
| v1.0.0 | Backend base y PostgreSQL. |
| v1.1.0 / v1.1.1 | Seguridad, reglas de negocio y endurecimiento. |
| v1.2.0 | Reportes, Excel/PDF y vistas BI. |
| v1.3.0 | Panel y Socket.IO. |
| v1.4.0 | Frontend React. |
| v1.5.0 | RabbitMQ, worker y entregas. |
| v1.5.1 | Despliegue, Docker y seed relativo. |
| v1.6.0 | Agente de IA + RAG, logs y chat. |
| v1.6.1 | Avisos de reserva y de puerta de escala; servicio de escalas y corrección del RAG. |

---

## 15. Limitaciones y trabajo futuro

- El agente local no es generativo; para conversación avanzada se configura Claude.
- Sin `VOYAGE_API_KEY` el RAG usa texto completo, no vectores.
- El plan gratuito de Render duerme el servicio; usar un monitor para la defensa.
- El rate limit del agente es en memoria (una sola instancia).
- Las escalas validan que la puerta exista y esté operativa, pero no participan en la restricción de exclusión temporal de los vuelos.
- Pendientes: tablero `.pbix` de Power BI y ampliación de pruebas unitarias.
- El frontend es operativo para consulta; las altas y ediciones siguen por la API.

---

## 16. Anexos

- Variables de entorno: `.env.example`.
- Guía de despliegue: [`docs/DESPLIEGUE.md`](DESPLIEGUE.md).
- Guía de RabbitMQ: [`docs/RABBITMQ.md`](RABBITMQ.md).
- Guía de Power BI: [`docs/POWER_BI.md`](POWER_BI.md).
- Guía del agente: [`docs/AGENTE_IA.md`](AGENTE_IA.md).
- Bitácora: [`docs/BITACORA.md`](BITACORA.md).
