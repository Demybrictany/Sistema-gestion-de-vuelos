# CLAUDE.md — Sistema de Gestión de Vuelos AICM

Instrucciones para Claude Code y para el desarrollo guiado por especificaciones.
Este archivo es la fuente de verdad del flujo de trabajo del repositorio.

## Qué es este proyecto

Sistema de gestión de vuelos, pasajeros y equipaje del Aeropuerto Internacional de
la Ciudad de México. Backend Node.js/Express 5 con PostgreSQL, frontend React/Vite,
RabbitMQ, reportería con Excel/PDF, vistas para Power BI, panel en tiempo real y
agente de IA con RAG.

- **Versión:** 1.6.1
- **Repositorio:** https://github.com/Demybrictany/Sistema-gestion-de-vuelos
- **Producción:** https://sistema-gestion-de-vuelos.vercel.app
- **API:** https://sistema-vuelos-api.onrender.com

## Comandos

```bash
# Dependencias
npm install
cd frontend && npm install && cd ..

# Entorno local con Docker (PostgreSQL 5433 + RabbitMQ 5672/15672)
docker compose up -d

# Base de datos
npm run db:init            # esquema + seed relativo + vistas (DESTRUCTIVO)
npm run db:migrate         # migración v1.5.0
npm run db:migrate:agente  # migración v1.6.0 (RAG y agente)
npm run rag:ingestar       # indexa docs/rag
npm run db:views           # recrea vistas BI
npm run db:password -- admin "NuevaClave"

# Desarrollo
npm run dev                # API con nodemon
npm run worker             # worker de notificaciones
npm run start:prod         # API + worker en un solo proceso (Render)

cd frontend && npm run dev # frontend en 5173

# Pruebas
npm test                   # API + reportes + panel + agente
npm run test:api
npm run test:reportes
npm run test:panel
npm run test:rabbitmq      # requiere broker y worker
npm run test:agente
```

Las pruebas de integración necesitan la API levantada y una base inicializada.
`test:api` **no es idempotente**: vuelve a ejecutar `db:init` después de correrla.

## Arquitectura

```text
routes → controllers → services → models → PostgreSQL
                    ↘ lib/ (RabbitMQ, correo, Socket.IO, agente, embeddings)
```

- `routes/`: endpoints y permisos.
- `controllers/`: HTTP; sin lógica de negocio.
- `services/`: reglas, transacciones y consultas.
- `models/`: Sequelize y asociaciones.
- `validators/schemas.js`: Zod.
- `middlewares/`: JWT, roles, contexto, errores, rate limit.
- `db/postgres/`: `schema.sql`, `seed.sql`, `views_bi.sql`.
- `docs/`: bitácora, guías, manual y corpus RAG.

## Convenciones

- CommonJS (`require`), Node 18+.
- Código, mensajes y documentación en **español**.
- Una capa por responsabilidad; no poner SQL de negocio en controladores.
- Usar Zod para validar entradas y `asyncHandler` para errores.
- Transacciones en operaciones que tocan varias tablas.
- Nombres de tablas y columnas en `snake_case`.
- Respuestas de error: `{ "mensaje": "..." }`; validación: `{ "mensaje", "errores" }`.
- Fechas de negocio relativas en el seed; no hardcodear días en pruebas.
- No romper contratos existentes sin subir MAJOR.

## Seguridad

- Nunca subir `.env`, secretos ni `node_modules`.
- `.env` es local; producción se configura en Render/Vercel.
- No registrar contraseñas ni tokens en logs.
- Rotar contraseñas del seed antes de publicar (`npm run db:password`).
- Restringir `CORS_ORIGIN` al dominio del frontend.
- El agente no debe revelar datos de otros pasajeros: el filtro va en SQL.
- El endpoint del agente tiene rate limit; si se escala horizontalmente, moverlo a Redis.

## Agente de IA + RAG

- Corpus: `docs/rag/*.md`; ingesta: `npm run rag:ingestar`.
- Recuperación: pgvector si hay `VOYAGE_API_KEY`; si no, texto completo en español.
- Proveedor local por defecto (sin API key); Claude si `ANTHROPIC_API_KEY` está definida.
- Herramientas en `services/agente.tools.js`; proveedor en `lib/agente.proveedor.js`.
- Toda consulta se registra en `interacciones_agente` y en `auditoria`.
- No modificar datos desde el agente: es de solo consulta.

## Versionado, ramas y commits

- SemVer `MAJOR.MINOR.PATCH`; una rama `feature/vX.Y.Z-tema` por módulo.
- Un PR por módulo; la fusión a `main` es la release.
- Los commits los ejecuta el estudiante (regla del curso).
- Formato del commit:

```text
<tipo>(<alcance>): <resumen ≤72 caracteres>

Qué se hizo:
- ...

Por qué:
- ...

Verificación:
- comando → resultado
```

- No subir versión sin cambios nuevos desde el último tag.
- Actualizar `docs/BITACORA.md` al cerrar la sesión (append-only, la entrada más
  reciente arriba).
- Tags anotados: `git tag -a vX.Y.Z -m "..."`.

## Verificación antes de cerrar

1. `git status` revisado; sin `.env` ni secretos.
2. Pruebas ejecutadas con resultado real (no "debería funcionar").
3. Bitácora actualizada.
4. README y `.env.example` actualizados si hay variables o endpoints nuevos.
5. Frontend compila (`npm run build`) si se tocó `frontend/`.

## Archivos clave

| Archivo | Uso |
|---|---|
| `app.js` | Rutas, middlewares y arranque. |
| `db/postgres/schema.sql` | Esquema completo. |
| `db/postgres/seed.sql` | Datos de demostración con fechas relativas. |
| `scripts/iniciar-produccion.js` | Supervisor API + worker. |
| `services/rag.service.js` | Ingesta y recuperación. |
| `services/agente.service.js` | Orquestación del agente y logs. |
| `docs/MANUAL_TECNICO.md` | Manual técnico. |
| `docs/DESPLIEGUE.md` | Guía de despliegue. |
| `docs/AGENTE_IA.md` | Guía del agente y RAG. |

## Despliegue

- Backend y worker: Render (plan free), rama `main`.
- Frontend: Vercel, `VITE_API_URL` hacia Render.
- Base: Neon; mensajería: CloudAMQP; correo: Ethereal.
- Pasos: `docs/DESPLIEGUE.md`.

## Definición de terminado

- Funcionalidad implementada y probada.
- Permisos por rol verificados.
- Migración y seed actualizados si cambia el esquema.
- Documentación y bitácora al día.
- PR abierto con verificación real.
