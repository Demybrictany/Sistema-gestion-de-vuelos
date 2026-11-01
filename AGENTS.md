# AGENTS.md — Guía para agentes de IA

Este repositorio usa desarrollo guiado por especificaciones. **`CLAUDE.md` es la
fuente de verdad**; este archivo resume lo esencial para otros agentes (Codex,
OpenCode, etc.). Antes de trabajar, lee `CLAUDE.md` y `docs/BITACORA.md`.

## Contexto

Sistema de gestión de vuelos del AICM. Node.js/Express 5 + PostgreSQL + React/Vite,
RabbitMQ, reportería Excel/PDF, Power BI, panel en tiempo real y agente de IA + RAG.
Versión actual: **1.6.0**.

## Reglas que no se negocian

1. **No subir secretos.** `.env` es local; producción se configura en Render/Vercel.
2. **No romper contratos** de la API sin subir MAJOR.
3. **Alcance por rol:** un PASAJERO solo ve sus propios datos. En el agente, el
   filtro va en SQL, no solo en el prompt.
4. **El agente no modifica datos:** es de consulta.
5. **Los commits los ejecuta el estudiante.** El agente prepara el cambio y el
   mensaje; no hace commits por su cuenta sin autorización.
6. **Verificación real:** no declarar terminado lo que no se ejecutó.
7. **Bitácora append-only:** la entrada nueva va arriba; no reescribir el pasado.
8. **No usar un solo archivo:** respetar capas (routes → controllers → services →
   models).

## Comandos esenciales

```bash
docker compose up -d          # PostgreSQL 5433 + RabbitMQ
npm run db:init               # esquema + seed + vistas (destructivo)
npm run db:migrate:agente     # migración RAG/agente
npm run rag:ingestar          # indexa docs/rag
npm test                      # API + reportes + panel + agente
npm run test:rabbitmq         # requiere broker y worker
cd frontend && npm run build  # verifica el frontend
```

## Dónde está cada cosa

- Rutas: `routes/`; controladores: `controllers/`; reglas: `services/`.
- Esquema y seed: `db/postgres/`.
- Agente: `services/agente.*`, `lib/agente.proveedor.js`, `docs/rag/`, `docs/AGENTE_IA.md`.
- Despliegue: `render.yaml`, `frontend/vercel.json`, `docs/DESPLIEGUE.md`.
- Manual: `docs/MANUAL_TECNICO.md`.
- Flujo de ramas, commits y SemVer: `CLAUDE.md` y `.claude/skills/versionado-bitacora`.

## Flujo de trabajo

1. Leer la bitácora y el estado de `git status`.
2. Crear rama `feature/vX.Y.Z-tema`.
3. Implementar por capas con validación Zod y transacciones donde corresponda.
4. Ejecutar pruebas y anotar el resultado real.
5. Actualizar README, `.env.example`, manual y bitácora si aplica.
6. Preparar el commit (qué, por qué, verificación) y pedir al estudiante que lo ejecute.
7. Abrir PR con la verificación incluida.
