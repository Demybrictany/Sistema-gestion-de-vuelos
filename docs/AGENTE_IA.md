# Agente de IA + RAG (v1.6.0)

El agente responde preguntas sobre la operación del AICM usando **datos reales del
sistema** y **documentación del negocio**, y deja **trazabilidad completa** de cada
consulta.

## Arquitectura

```text
POST /api/agente/consultas
        │
        ▼
services/agente.service.js
        │
        ├── services/rag.service.js ──▶ documentos_rag / fragmentos_rag
        │        (texto completo en español + pgvector opcional)
        │
        ├── services/agente.tools.js ──▶ vuelos, puertas, equipaje, escalas
        │        (alcance según el rol)
        │
        └── lib/agente.proveedor.js
                 ├── Claude (tool use, si hay ANTHROPIC_API_KEY)
                 └── local (RAG + herramientas, sin API externa)
        │
        ▼
interacciones_agente + auditoria (CONSULTA_AGENTE)
```

## Endpoints

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| `POST` | `/api/agente/consultas` | Todos | Pregunta al agente. Cuerpo: `{ "pregunta": "..." }`. |
| `GET` | `/api/agente/interacciones` | ADMINISTRADOR | Últimos 50 registros (máximo 200 con `?limite=`). |
| `GET` | `/api/agente/documentos` | ADMINISTRADOR | Documentos indexados y número de fragmentos. |
| `POST` | `/api/agente/ingestar` | ADMINISTRADOR | Reindexa `docs/rag/`. Es idempotente. |

### Ejemplo

```bash
curl -X POST https://sistema-vuelos-api.onrender.com/api/agente/consultas \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"pregunta":"¿Qué pasa si mi vuelo se retrasa?"}'
```

Respuesta:

```json
{
  "id_interaccion": 12,
  "respuesta": "Un retraso genera la notificación VUELO_RETRASADO...",
  "fuentes": [
    { "cita": 1, "titulo": "Preguntas frecuentes", "fuente": "docs/rag/faq.md" }
  ],
  "modelo": "local-rag",
  "proveedor": "local",
  "latencia_ms": 34,
  "estado": "OK"
}
```

## RAG

### Corpus

Los documentos viven en [`docs/rag/`](rag/):

- `manual-operativo.md`: puertas, estados del vuelo, notificaciones, equipaje y escalas.
- `politicas-pasajero.md`: reservas, privacidad, cambios, cancelaciones y equipaje.
- `faq.md`: preguntas frecuentes.
- `catalogo-aeropuertos.md`: aeropuertos y rutas del seed.

### Ingesta

```bash
npm run rag:ingestar
```

- Trocea por párrafos (≈900 caracteres, con solape de 120).
- Calcula un SHA-256 del documento: si no cambió, no lo vuelve a indexar.
- Si cambió, reemplaza el documento y sus fragmentos.
- Si `VOYAGE_API_KEY` está definida, genera embeddings de 1024 dimensiones y los guarda
  en la columna `vector`; si no, los fragmentos quedan con `embedding = NULL`.

### Recuperación

1. **Vectorial** (si hay embeddings): similitud coseno con pgvector (`<=>`).
2. **Texto completo**: `websearch_to_tsquery('spanish', ...)` y `ts_rank` sobre la
   columna generada `busqueda` (`tsvector`).
3. **Coincidencia parcial**: `ILIKE` como último recurso.

Cada fragmento recuperado se numera `[1]`, `[2]`… y se entrega al modelo con su
título y fuente. La respuesta del agente cita esos números y la API devuelve el
arreglo `fuentes`.

## Herramientas

| Herramienta | Datos | Alcance |
|---|---|---|
| `consultar_vuelos` | Vuelos por código, fecha, estado, origen o destino | Un pasajero solo ve sus vuelos. |
| `consultar_puertas` | Puertas, zona, estado y vuelo asignado | Información pública. |
| `consultar_equipaje` | Equipaje por código, estado y banda | Un pasajero solo ve su equipaje. |
| `consultar_escalas` | Escalas con puertas y horarios | Un pasajero solo ve sus itinerarios. |
| `mis_vuelos` | Vuelos, asiento y estado de reserva del pasajero | Solo PASAJERO. |
| `buscar_documentacion` | Búsqueda en el corpus RAG | Todos. |

El alcance se aplica en SQL (`WHERE id_pasajero = :idPasajero`), no solo en el prompt.
El agente nunca recibe datos de otros pasajeros cuando el usuario es PASAJERO.

## Proveedores

### Local (por defecto)

No requiere API key. Responde con los fragmentos recuperados y con las herramientas
del sistema. Es determinista, citable y suficiente para la demo y las pruebas.
Modelo reportado: `local-rag`.

### Claude (opcional)

Requisitos:

```env
AGENTE_PROVEEDOR=claude
ANTHROPIC_API_KEY=sk-ant-...
AGENTE_MODELO=claude-opus-5-5
```

- Usa el SDK oficial `@anthropic-ai/sdk`.
- Tool use en un bucle manual (máximo 5 iteraciones).
- Pensamiento adaptativo (`thinking: { type: "adaptive" }`).
- Si la API falla, se responde en modo local y se añade `aviso` en la respuesta.

### Embeddings (opcional)

```env
VOYAGE_API_KEY=...
VOYAGE_MODEL=voyage-3
```

Voyage AI genera vectores de 1024 dimensiones para los fragmentos y para la consulta.
Sin esta clave, el RAG funciona con búsqueda de texto completo.

## Logs y auditoría

Cada consulta se guarda en `interacciones_agente`:

| Campo | Contenido |
|---|---|
| `id_usuario` | Usuario autenticado. |
| `pregunta`, `respuesta` | Texto completo. |
| `fuentes` | JSONB con las citas recuperadas. |
| `modelo`, `proveedor` | `local-rag` / `claude`. |
| `tokens_prompt`, `tokens_respuesta` | Consumo reportado por el proveedor. |
| `latencia_ms` | Tiempo total de la consulta. |
| `estado`, `error` | `OK`, `RECHAZADA` o `ERROR`. |
| `direccion_ip` | Origen de la petición. |

Además se registra en `auditoria` con la acción `CONSULTA_AGENTE` y se expone la
vista `bi_interacciones_agente` para Power BI.

## Puesta en marcha

Base nueva:

```bash
npm run db:init          # incluye las tablas del agente
npm run rag:ingestar     # indexa docs/rag/
```

Base existente:

```bash
npm run db:migrate:agente
npm run rag:ingestar
npm run db:views
```

Producción (Neon):

```powershell
$env:DATABASE_URL="postgresql://...neon..."
$env:DB_SSL="true"
npm run db:migrate:agente
npm run rag:ingestar
npm run db:views
```

Después hay que **redesplegar la API** para que cargue las rutas nuevas.

## Pruebas

```bash
npm run test:agente
```

Verifica ingesta, citas, consulta de datos operativos, alcance de pasajeros, logs,
permisos y que la ingesta sea idempotente. No necesita API key.

## Límites conocidos

- El modo local no es un modelo generativo: compone la respuesta con fragmentos y
  datos. Para respuestas conversacionales más ricas hace falta una API key.
- La calidad del RAG depende de los documentos de `docs/rag/`.
- Sin `VOYAGE_API_KEY` no hay búsqueda vectorial; se usa texto completo en español.
- El agente no modifica datos: es de consulta. Las operaciones siguen por la API.
- El endpoint limita a **30 consultas por minuto por usuario** con un contador en memoria. Si se despliega en varias instancias, hay que sustituirlo por Redis o por el limitador del proxy.
