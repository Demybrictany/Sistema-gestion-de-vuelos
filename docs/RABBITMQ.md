# Mensajería asíncrona con RabbitMQ

La v1.5.0 conecta las notificaciones del sistema con **RabbitMQ**. La API solo
encola el aviso; un **worker** independiente consume la cola, entrega el correo
(o lo simula) y deja la traza en la tabla `entregas_notificacion`.

---

## 1. Arquitectura

```text
POST/PUT /api/vuelos, /api/notificaciones, ...
        │
        ▼
services/*  ── crean la notificación dentro de la transacción
        │
        ▼
Notificacion.create() / bulkCreate()
        │
        ▼  hook afterCreate / afterBulkCreate (después del commit)
publicarEvento('notificacion.creada')
        │
        ▼
exchange sistema.vuelos (topic)
        │
        ▼
cola notificaciones.pasajeros
        │
        ▼
worker/notificaciones.worker.js
        │
        ├── correo real (SMTP) o simulado
        ├── entregas_notificacion (ENVIADA / SIMULADA / FALLIDA)
        └── auditoria (id_usuario = NULL, origen worker)
```

La API y el worker son **procesos separados**. Si la API se reinicia, la cola
conserva los mensajes; si el worker se cae, los mensajes esperan en la cola.
Si RabbitMQ no está configurado, la API sigue funcionando y el worker no
arranca: la mensajería se degrada sin romper el resto del sistema.

---

## 2. Topología

| Elemento | Nombre | Tipo | Detalle |
|---|---|---|---|
| Exchange principal | `sistema.vuelos` | `topic`, durable | Enruta `notificacion.*` |
| Cola principal | `notificaciones.pasajeros` | durable | Consumida por el worker |
| Exchange de fallidos | `sistema.vuelos.fallidas` | `direct`, durable | Recibe los mensajes que no se pudieron procesar |
| Cola de fallidos | `notificaciones.fallidas` | durable | Inspección manual (DLQ) |
| Cola de reintentos | `notificaciones.reintentos` | durable | Sin consumidor; TTL de 5 s y vuelve a la cola principal |

La cola principal declara un **dead-letter exchange**. Por eso un mensaje
inválido o que agota los reintentos termina en `notificaciones.fallidas`.

### Evento publicado

```json
{
  "evento": "notificacion.creada",
  "id_notificacion": 42,
  "ocurrido_en": "2026-10-30T16:00:00.000Z"
}
```

El mensaje solo lleva el identificador. El worker consulta la notificación y el
pasajero desde PostgreSQL, de modo que no se copian datos personales a la cola.

---

## 3. Flujo de negocio

Las notificaciones se generan desde v1.1.0 en los flujos de negocio:

- cancelación de vuelo (`VUELO_CANCELADO`);
- retraso (`VUELO_RETRASADO`);
- cambio o asignación de puerta (`CAMBIO_PUERTA`, `PUERTA_ASIGNADA`);
- cambio de horario (`CAMBIO_HORARIO`);
- avisos de banda de equipaje y escalas;
- avisos manuales por `POST /api/notificaciones`.

Todas pasan por `notificacion.service.js` y, por tanto, por el mismo hook. El
hook respeta la transacción: si la notificación se crea dentro de una
transacción, el evento se publica en `afterCommit`, nunca antes.

### Entregas

Cada notificación tiene como máximo una entrega por canal (restricción única
`id_notificacion, canal`). Estados:

| Estado | Significado |
|---|---|
| `PENDIENTE` | El worker tomó el mensaje y aún no terminó |
| `ENVIADA` | El correo salió por SMTP |
| `SIMULADA` | El correo no se envió porque `CORREO_MODO=simulado` o el pasajero no tiene correo |
| `FALLIDA` | El envío falló; puede reintentarse |

El worker es **idempotente**: si el broker reentrega un mensaje cuya entrega ya
está `ENVIADA` o `SIMULADA`, no vuelve a enviar el correo.

### Reintentos y fallidos

1. Si el procesamiento falla por un problema temporal (base de datos, SMTP),
   el mensaje se envía a `notificaciones.reintentos` con un TTL de 5 s.
2. Al expirar el TTL, RabbitMQ lo devuelve a la cola principal con la cabecera
   `x-reintento` incrementada.
3. Después de `RABBITMQ_MAX_REINTENTOS` (3 por defecto), se envía a la cola de
   fallidos.
4. Un mensaje inválido (JSON o esquema incorrecto) va directo a fallidos.

---

## 4. Configuración en CloudAMQP

1. Crear una cuenta en <https://customer.cloudamqp.com/>.
2. Crear una instancia con el plan gratuito (por ejemplo, *Little Lemur*) en la
   región más cercana.
3. Abrir la instancia y copiar la **AMQP URL** (`amqps://usuario:password@host/vhost`).
4. Agregar la URL al archivo `.env` del proyecto:

```env
RABBITMQ_URL=amqps://usuario:password@host/vhost
```

No subas `.env` al repositorio. El plan gratuito de CloudAMQP tiene límites de
conexiones y mensajes; consulta el panel de la instancia.

---

## 5. Variables de entorno

| Variable | Por defecto | Descripción |
|---|---|---|
| `RABBITMQ_URL` | — | URL AMQP. Sin ella, la mensajería queda desactivada. |
| `RABBITMQ_EXCHANGE` | `sistema.vuelos` | Exchange principal. |
| `RABBITMQ_EXCHANGE_FALLIDAS` | `sistema.vuelos.fallidas` | Exchange directo para mensajes fallidos. |
| `RABBITMQ_QUEUE` | `notificaciones.pasajeros` | Cola que consume el worker. |
| `RABBITMQ_QUEUE_FALLIDAS` | `notificaciones.fallidas` | Cola de mensajes fallidos. |
| `RABBITMQ_QUEUE_REINTENTOS` | `notificaciones.reintentos` | Cola temporal de reintentos. |
| `RABBITMQ_MAX_REINTENTOS` | `3` | Reintentos antes de enviar a fallidos. |
| `RABBITMQ_TTL_REINTENTO_MS` | `5000` | Espera entre reintentos (ms). |
| `RABBITMQ_PREFETCH` | `10` | Mensajes en vuelo por worker. |
| `CORREO_MODO` | `simulado` | `simulado` o `smtp`. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE` | — | Servidor SMTP. |
| `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | — | Credenciales y remitente. |

---

## 6. Puesta en marcha

```bash
# 1. Crear la tabla de entregas en una base ya existente
npm run db:migrate

# 2. Recrear las vistas BI (incluye bi_entregas_notificacion)
npm run db:views

# 3. API
npm run dev

# 4. Worker (en otra terminal)
npm run worker
```

Para desarrollo con recarga automática del worker:

```bash
npm run dev:worker
```

### Correo real con Ethereal

`CORREO_MODO=simulado` no envía correos, pero registra la entrega. Para probar
un envío real sin configurar un proveedor:

1. Crea una cuenta gratuita en <https://ethereal.email/>.
2. Copia el host, usuario y contraseña en `.env`:

```env
CORREO_MODO=smtp
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu-usuario@ethereal.email
SMTP_PASS=tu-password
SMTP_FROM=Sistema de Vuelos AICM <no-reply@example.com>
```

3. Reinicia el worker. El correo se podrá ver en la bandeja de Ethereal.

---

## 7. Endpoints de consulta

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/notificaciones/entregas` | Lista las últimas 200 entregas. Filtros: `estado`, `canal`, `id_notificacion`. |
| `GET` | `/api/notificaciones/entregas/resumen` | Totales por estado. |
| `GET` | `/api/notificaciones/:id/entregas` | Entregas de una notificación. |
| `GET` | `/health` | Incluye `mensajeria` y el nombre de la cola. |

Ejemplo:

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/notificaciones/entregas?estado=FALLIDA"
```

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/notificaciones/entregas/resumen"
```

---

## 8. Pruebas

```bash
npm run test:rabbitmq
```

La prueba requiere:

1. `RABBITMQ_URL` definida en `.env`.
2. API levantada.
3. Worker levantado.
4. Base migrada (`npm run db:migrate`).

Sin `RABBITMQ_URL` la prueba imprime `SKIP` y termina con éxito. Con broker,
crea una notificación por la API, espera la entrega, valida el resumen y
`/health`, y elimina la notificación de prueba (la entrega se borra en cascada).

---

## 9. Observabilidad y operación

- **Logs del worker:** cada mensaje registra la notificación, el estado y los
  reintentos en la salida estándar.
- **Auditoría en BD:** cada entrega genera una fila en `auditoria` con
  `id_usuario = NULL` y acciones `ENTREGA_ENVIADA`, `ENTREGA_SIMULADA` o
  `ENTREGA_FALLIDA`.
- **Panel de CloudAMQP:** muestra la profundidad de las colas, mensajes
  publicados/consumidos y la cola de fallidos.
- **Cola de fallidos:** revisa los mensajes antes de purgarla; un mensaje
  inválido o con error permanente se queda allí.

### Problemas frecuentes

| Síntoma | Causa probable | Solución |
|---|---|---|
| `mensajeria: "no configurada"` en `/health` | Falta `RABBITMQ_URL` | Agrega la URL y reinicia la API. |
| `mensajeria: "configurada"` | La API aún no publicó ningún evento | Es normal; se conecta al publicar la primera notificación. |
| La notificación se crea pero no hay entrega | El worker no está corriendo | Ejecuta `npm run worker`. |
| Entrega `FALLIDA` y mensaje en fallidos | SMTP mal configurado o error permanente | Revisa las credenciales y el detalle en `entregas_notificacion`. |
| El worker no arranca | `RABBITMQ_URL` inválida o broker apagado | Verifica la URL en el panel de CloudAMQP. |

---

## 10. Limitaciones conocidas

- Solo se implementa el canal `CORREO`. `PUSH` y `SMS` están modelados, pero no
  tienen proveedor.
- El publicador no usa el patrón *outbox*: si RabbitMQ está caído en el momento
  exacto de la creación, la notificación queda en la base pero el evento no se
  encola. El panel y la consulta de notificaciones siguen funcionando.
- La cola de reintentos usa un TTL fijo; no hay retroceso exponencial.
- Las pruebas de mensajería son de integración y requieren broker, API y worker.
