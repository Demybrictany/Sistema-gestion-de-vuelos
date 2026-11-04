# Manual de administrador y programador

## Sistema de Gestión de Vuelos — AICM

| Dato | Valor |
|---|---|
| Documento | Manual de administración y programación |
| Versión | 1.0 |
| Fecha | 2026-11-02 |
| Sistema | v1.6.2 |
| Repositorio | https://github.com/Demybrictany/Sistema-gestion-de-vuelos |
| Frontend | https://sistema-gestion-de-vuelos.vercel.app |
| API | https://sistema-vuelos-api.onrender.com |
| Equipo | Juanjo, Demy |

> Para el uso diario del panel, ver [`01-MANUAL_DE_USUARIO.md`](01-MANUAL_DE_USUARIO.md).
> Para el historial y las decisiones, ver [`03-PROCEDIMIENTOS_DE_DESARROLLO.md`](03-PROCEDIMIENTOS_DE_DESARROLLO.md).

---

## Índice

1. [Arquitectura](#1-arquitectura)
2. [Tecnologías](#2-tecnologías)
3. [Modelo de datos](#3-modelo-de-datos)
4. [API y roles](#4-api-y-roles)
5. [Seguridad](#5-seguridad)
6. [Mensajería asíncrona](#6-mensajería-asíncrona)
7. [Reportería y Power BI](#7-reportería-y-power-bi)
8. [Agente de IA + RAG](#8-agente-de-ia--rag)
9. [Entornos y variables](#9-entornos-y-variables)
10. [Despliegue](#10-despliegue)
11. [Operación y runbook](#11-operación-y-runbook)
12. [Diagnóstico técnico](#12-diagnóstico-técnico)
13. [Límites y pendientes](#13-límites-y-pendientes)

---

## 1. Arquitectura

```text
Frontend React/Vite (Vercel)
        │ HTTPS + Socket.IO
        ▼
API Express 5 + worker (Render, un servicio)
        │
        ├──▶ Neon PostgreSQL + pgvector
        ├──▶ CloudAMQP (RabbitMQ)
        └──▶ Ethereal SMTP
```

### 1.1 Capas del backend

```text
routes → controllers → services → models → PostgreSQL
                    ↘ lib/ (RabbitMQ, correo, Socket.IO, agente, embeddings)
```

| Capa | Responsabilidad |
|---|---|
| `routes/` | Endpoints y permisos. |
| `controllers/` | Traducir HTTP a llamadas de servicio. |
| `services/` | Reglas de negocio, transacciones y consultas. |
| `models/` | Entidades Sequelize y asociaciones. |
| `validators/` | Esquemas Zod. |
| `middlewares/` | JWT, roles, contexto, errores y rate limit. |
| `lib/` | Infraestructura. |
| `workers/` | Consumidor de la cola. |

### 1.2 Servicio único en Render

El plan gratuito no incluye *Background Workers*. `scripts/iniciar-produccion.js`
lanza la API y el worker, reinicia el worker si se cae y detiene todo si la API
termina. Cuando Render duerme, el worker se pausa y los mensajes esperan en
CloudAMQP.

### 1.3 Estado actual

- Frontend y API **v1.6.2** publicados.
- Render usa Node 22, `npm ci` y `npm run start:prod`; el worker de RabbitMQ está conectado.
- Neon ya tiene el esquema v1.6.2, 13 fragmentos RAG y 11 vistas BI.

---

## 2. Tecnologías

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
| Agente | `@anthropic-ai/sdk` + RAG |
| Frontend | React 18 + Vite 5 |
| Despliegue | Render + Vercel + Neon + CloudAMQP |

---

## 3. Modelo de datos

### 3.1 Entidades

| Entidad | Propósito |
|---|---|
| `roles`, `usuarios` | Autenticación y permisos. |
| `pasajeros` | Datos del pasajero. |
| `aeropuertos` | 6 aeropuertos (MEX, GUA, LAX, MAD, PTY, BOG). |
| `puertas` | 25 puertas A01–A25. |
| `bandas_equipaje` | 10 bandas B01–B10. |
| `vuelos` | Vuelo con fechas, horas, puerta y estado. |
| `itinerarios` | Viaje de un pasajero. |
| `pasajero_vuelo` | Reserva. |
| `escalas` | Conexión entre vuelos. |
| `equipajes` | Equipaje y estado. |
| `equipaje_vuelo` | Tramos del equipaje. |
| `notificaciones` | Avisos al pasajero. |
| `entregas_notificacion` | Traza de entrega por canal. |
| `historial_vuelo` | Cambios del vuelo. |
| `historial_equipaje` | Movimientos del equipaje. |
| `auditoria` | Operaciones del sistema y del agente. |
| `documentos_rag`, `fragmentos_rag` | Corpus del agente. |
| `interacciones_agente` | Logs del agente. |

### 3.2 Restricciones

- `EXCLUDE USING gist` impide dos vuelos solapados en la misma puerta.
- Enums de PostgreSQL para estados.
- Claves foráneas con `ON DELETE` explícito.
- `fragmentos_rag.busqueda` es un `tsvector` generado (`spanish`).
- `fragmentos_rag.embedding` es `vector(1024)` con índice HNSW.

---

## 4. API y roles

Base: `/api`. Todas las rutas salvo `/api/auth/login` requieren JWT.

### 4.1 Autenticación

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/auth/login` | Devuelve el JWT. |
| `GET` | `/api/auth/me` | Usuario autenticado. |

### 4.2 Recursos

| Recurso | Roles |
|---|---|
| Roles y usuarios | ADMIN |
| Pasajeros, aeropuertos, puertas, bandas | ADMIN, SECRETARIO |
| Vuelos, equipajes y notificaciones | Por método |
| Escalas, itinerarios, reservas | ADMIN, SECRETARIO |
| Historiales | ADMIN, SECRETARIO |
| Auditoría | ADMIN |
| Reportes y panel | ADMIN, SECRETARIO |
| Agente | Por ruta; consultas para todos |

### 4.3 Errores

```json
{ "mensaje": "Descripción del error", "errores": [] }
```

Códigos: 200, 201, 400, 401, 403, 404, 409, 429 y 500.

---

## 5. Seguridad

- JWT firmado con `JWT_SECRET` (8 h por defecto).
- bcryptjs con 10 rondas.
- Roles: ADMINISTRADOR, SECRETARIO, PASAJERO.
- Contexto por request (`AsyncLocalStorage`) para auditoría.
- CORS configurable con `CORS_ORIGIN`.
- Rate limit del agente: 30 consultas/minuto por usuario.
- `.env` fuera del repositorio; secretos solo en Render/Vercel.
- Contraseñas del seed rotadas en producción.
- HTTPS automático en Render y Vercel.

---

## 6. Mensajería asíncrona

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

- Publicación después del commit de la transacción.
- Reintentos configurables (`RABBITMQ_MAX_REINTENTOS`, TTL).
- Traza en `entregas_notificacion`.
- Sin `RABBITMQ_URL` la API funciona; el worker no arranca.
- El supervisor reinicia el worker si se cae.

---

## 7. Reportería y Power BI

- **16 reportes** con filtros y agregaciones.
- Exportación a Excel y PDF.
- **11 vistas `bi_*`** de solo lectura, incluida `bi_interacciones_agente`.
- Guía de conexión: `docs/POWER_BI.md`.
- El tablero `.pbix` queda pendiente.

---

## 8. Agente de IA + RAG

- Endpoint `POST /api/agente/consultas`.
- Corpus en `docs/rag/` (4 documentos, 13 fragmentos).
- Recuperación híbrida: pgvector si hay `VOYAGE_API_KEY`; texto completo en
  español en caso contrario.
- Herramientas: vuelos, puertas, equipaje, escalas, mis vuelos y documentación.
- Alcance por rol aplicado en SQL.
- Proveedor local por defecto; Claude si `ANTHROPIC_API_KEY` está definida.
- Logs en `interacciones_agente` y auditoría `CONSULTA_AGENTE`.
- Detalle: `docs/AGENTE_IA.md`.

---

## 9. Entornos y variables

### 9.1 Local

| Servicio | URL / puerto | Credenciales locales |
|---|---|---|
| API | http://localhost:3000 | — |
| Frontend | http://localhost:5173 | `admin` / `Admin123!` |
| PostgreSQL | localhost:5433 | `postgres` / `postgres` |
| RabbitMQ | localhost:5672 | `admin` / `admin123` |
| Panel RabbitMQ | http://localhost:15672 | `admin` / `admin123` |

### 9.2 Variables principales

| Variable | Uso |
|---|---|
| `DATABASE_URL` | Neon (prioridad sobre las variables individuales). |
| `DB_SSL` | `true` en Neon, `false` en local. |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | Autenticación. |
| `PORT` | Puerto de la API. |
| `CORS_ORIGIN` | Dominio del frontend. |
| `RABBITMQ_URL` y `RABBITMQ_*` | Mensajería. |
| `CORREO_MODO`, `SMTP_*` | Correo. |
| `AGENTE_PROVEEDOR`, `ANTHROPIC_API_KEY`, `AGENTE_MODELO` | Agente. |
| `VOYAGE_API_KEY`, `VOYAGE_MODEL` | Embeddings opcionales. |
| `WORKER_REINTENTO_MS` | Reinicio del worker. |

Referencia completa: `.env.example` y `docs/DESPLIEGUE.md`.

---

## 10. Despliegue

### 10.1 Componentes

| Componente | Servicio |
|---|---|
| Frontend | Vercel (root `frontend`, `VITE_API_URL`). |
| API + worker | Render (`npm ci`, `npm run start:prod`, `/health`). |
| Base | Neon (pooled, `sslmode=require`). |
| Mensajería | CloudAMQP. |
| Correo | Ethereal (demo) o Gmail/Mailtrap. |

### 10.2 Pasos

1. Fusionar los PR de la release.
2. Render → rama `main` → **Manual Deploy**.
3. Vercel → redeploy con `VITE_API_URL` de Render.
4. Render → `CORS_ORIGIN` con el dominio de Vercel.
5. Verificar `/health`, panel, reportes y RabbitMQ.

Guía completa: `docs/DESPLIEGUE.md`.

---

## 11. Operación y runbook

### 11.1 Salud

```bash
curl https://sistema-vuelos-api.onrender.com/health
```

```json
{"estado":"ok","base_datos":"ok","mensajeria":"ok","cola":"notificaciones.pasajeros"}
```

### 11.2 Base de datos

```bash
npm run db:init            # esquema + seed + vistas (DESTRUCTIVO)
npm run db:migrate         # v1.5.0
npm run db:migrate:agente  # v1.6.0
npm run db:views           # vistas BI
```

En producción se usa `DATABASE_URL` y `DB_SSL=true` como variables de la sesión.

### 11.3 RAG

```bash
npm run rag:ingestar
```

Idempotente; reindexa si cambia el contenido o el número de fragmentos.

### 11.4 Contraseñas

```bash
npm run db:password -- admin "NuevaClaveSegura"
```

### 11.5 Pruebas

```bash
npm test
npm run test:api
npm run test:reportes
npm run test:panel
npm run test:agente
npm run test:escalas
npm run test:rabbitmq
```

Referencia: 66 + 29 + 14 + 12 + 11 PASS y 10 PASS en RabbitMQ.

### 11.6 Respaldo y rollback

- Neon: respaldo y *point-in-time* según el plan.
- Código: rollback del deploy en Render/Vercel o revertir el commit.
- Base: reconstruir con `db:init` (destructivo) y reingestar el RAG.

### 11.7 Logs

- Render: API y worker en el mismo flujo; el worker usa `[worker]`.
- CloudAMQP: colas y conexiones.
- Neon: consultas y conexiones.
- Agente: `interacciones_agente` y auditoría.

---

## 12. Diagnóstico técnico

| Síntoma | Causa | Solución |
|---|---|---|
| `/health` 503 | `DATABASE_URL` o SSL | Revisar Neon y `DB_SSL=true`. |
| `mensajeria: configurada` | Broker sin conectar | Revisar `RABBITMQ_URL` y CloudAMQP. |
| Error CORS | `CORS_ORIGIN` sin el dominio | Actualizar en Render. |
| Frontend sin datos | `VITE_API_URL` vacía | Definir y redesplegar Vercel. |
| Login 401 | Contraseña rotada | Usar la nueva o `ADMIN_PASSWORD`. |
| Worker sin entregas | Render dormido o SMTP | Despertar y revisar `[worker]`. |
| Agente 404 | API v1.5.1 desplegada | Redesplegar la rama v1.6.x. |
| Agente sin documentos | Falta ingesta | `npm run rag:ingestar`. |
| Error `vector` | pgvector ausente | Usar la imagen Docker o habilitarlo en Neon. |
| Build de Render falla | Lockfile o dependencia | Revisar `npm ci` y el log. |

---

## 13. Límites y pendientes

- Render free duerme tras ~15 min; el worker se pausa.
- El agente local no es generativo; Claude es opcional.
- Sin `VOYAGE_API_KEY` no hay búsqueda vectorial.
- El rate limit del agente es en memoria.
- Las escalas validan puerta operativa pero no participan en `EXCLUDE`.
- El frontend es de consulta; las altas y ediciones van por la API.
- Sin pruebas unitarias ni CI.
- Sin patrón *outbox*.
- Sin *refresh tokens* ni bloqueo por intentos fallidos.
- Pendientes: redesplegar v1.6.x, restringir CORS, `.pbix` de Power BI, tags en `main`.

---

**Siguiente lectura:** [`03-PROCEDIMIENTOS_DE_DESARROLLO.md`](03-PROCEDIMIENTOS_DE_DESARROLLO.md).
