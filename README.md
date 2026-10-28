# Sistema de Gestión de Vuelos — AICM

Sistema para la gestión de **vuelos, pasajeros y equipaje** del Aeropuerto Internacional de la Ciudad de México (AICM). Administra puertas de embarque, bandas de equipaje, itinerarios, escalas, notificaciones, historial y auditoría.

**Versión:** `v1.1.0`
**Repositorio:** https://github.com/Demybrictany/Sistema-gestion-de-vuelos
**Equipo:** Juanjo, Demy

---

## Descripción

El sistema modela la operación del aeropuerto:

- Todo vuelo nace en estado `PROGRAMADO` y puede retrasarse, abordar, aterrizar, finalizar o cancelarse siguiendo una máquina de estados.
- Una puerta no puede tener dos vuelos activos con horarios solapados. La regla se valida en la aplicación **y en la base de datos** mediante una restricción de exclusión de PostgreSQL.
- El equipaje puede viajar en varios tramos (conexiones) sin que el pasajero tenga que retirarlo.
- Los pasajeros reciben notificaciones automáticas sobre puerta de embarque, banda de equipaje, cambios de horario, retrasos, cancelaciones y escalas.
- Cada operación relevante queda registrada en el historial y en la auditoría.
- El catálogo incluye **25 puertas de embarque**, 10 bandas, 6 aeropuertos y datos de ejemplo.

El panel gráfico en tiempo real, la mensajería asíncrona, los reportes y el agente de IA se desarrollarán en las siguientes versiones (ver [Hoja de ruta](#hoja-de-ruta)).

---

## Novedades de la v1.1.0

- **Seguridad:** todas las rutas `/api/*` requieren JWT (excepto el login). Permisos por rol: administrador, secretario y pasajero.
- **Validación:** esquemas Zod estrictos en todos los endpoints de escritura (rechazan campos desconocidos y datos inválidos).
- **Máquina de estados de vuelo** con transiciones permitidas y validación de reprogramación, cambio de puerta y cancelación.
- **Conflicto de puertas a nivel de base de datos** con `EXCLUDE USING gist` (protege también contra solicitudes concurrentes).
- **Transacciones** en las operaciones de vuelo y equipaje.
- **Notificaciones automáticas** al pasajero por cambios de puerta, horario, retraso, cancelación, escala y banda.
- **Historial automático** de cambios de vuelo y movimientos de equipaje.
- **Auditoría automática** de altas, modificaciones y bajas mediante hooks de Sequelize.
- **Flujo de equipaje en conexión:** registro de tramos, validación de continuidad de ruta, asignación de banda y entrega.
- **Vínculo usuario–pasajero:** cada usuario con rol `PASAJERO` puede consultar sus propios vuelos, equipajes y notificaciones.
- **Pruebas de integración:** 56 verificaciones automatizadas (`npm run test:api`).

---

## Stack

| Componente | Tecnología |
|---|---|
| Runtime | Node.js 18+ (CommonJS) |
| Framework | Express 5 |
| ORM | Sequelize 6 |
| Base de datos | PostgreSQL 14+ (local o [Neon](https://neon.tech)) |
| Validación | Zod 4 |
| Autenticación | JWT + bcryptjs |
| Tiempo real | Socket.io (reservado para la siguiente versión) |

---

## Estructura del proyecto

```
.
├── app.js                      # Entrada, middlewares globales y rutas
├── controllers/                # Controladores HTTP
├── db/
│   ├── database.js             # Conexión Sequelize (PostgreSQL)
│   ├── postgres/
│   │   ├── schema.sql          # Esquema PostgreSQL (16 tablas)
│   │   └── seed.sql            # Datos iniciales
│   └── legacy/
│       └── scrip-sistema-vuelos.sql  # Dump MySQL original
├── lib/
│   ├── async-handler.js        # Envoltura para errores async
│   ├── contexto.js             # AsyncLocalStorage (usuario/IP por request)
│   └── errores.js              # ErrorConEstado
├── middlewares/
│   ├── auth.middleware.js      # verificarToken y permitirRoles
│   ├── contexto.middleware.js  # Contexto de auditoría
│   ├── error.middleware.js     # Manejo central de errores
│   └── validar.middleware.js   # Validación con Zod
├── models/                     # Modelos y asociaciones
│   ├── auditoria.hooks.js      # Auditoría automática
│   └── index.js                # Carga de modelos y hooks
├── routes/                     # Endpoints REST
├── services/                   # Lógica de negocio y transacciones
├── tests/
│   └── api.v1.1.0.js           # Pruebas de integración
├── validators/
│   └── schemas.js              # Esquemas Zod
├── .env.example
└── package.json
```

---

## Requisitos

- Node.js **18 o superior**
- PostgreSQL **14 o superior** (local o Neon)
- npm

---

## Puesta en marcha

### 1. Instalar dependencias

```bash
git clone https://github.com/Demybrictany/Sistema-gestion-de-vuelos.git
cd Sistema-gestion-de-vuelos
git checkout juanjo
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

#### Opción A — Neon (recomendado)

1. Crea un proyecto en [neon.tech](https://neon.tech).
2. Copia la cadena de conexión desde **Project → Connect**.
3. Configura:

```env
DATABASE_URL=postgresql://usuario:password@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
DB_SSL=true
JWT_SECRET=<un_secreto_largo_y_aleatorio>
PORT=3000
```

> Las credenciales las genera cada equipo desde su cuenta. **No se suben al repositorio.**

#### Opción B — PostgreSQL local

```env
DB_NAME=aeropuerto_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
DB_SSL=false

JWT_SECRET=<un_secreto_largo_y_aleatorio>
PORT=3000
```

```bash
createdb -U postgres aeropuerto_db
```

### 3. Crear el esquema y cargar los datos

```bash
npm run db:init
```

Salida esperada:

```
Ejecutando schema.sql...
Ejecutando seed.sql...
Base de datos inicializada correctamente.
Puertas: 25 | Vuelos: 12 | Pasajeros: 6 | Equipajes: 8 | Notificaciones: 12
```

> El script es **idempotente**: elimina y vuelve a crear las tablas en cada ejecución.

### 4. Ejecutar el servidor

```bash
npm run dev     # con nodemon
npm start       # producción
```

La API queda en `http://localhost:3000`.

### 5. Ejecutar las pruebas de integración

Con el servidor levantado y una base recién inicializada:

```bash
npm run test:api
```

El script crea y modifica datos; usa una base de pruebas o vuelve a ejecutar `npm run db:init` al terminar.

---

## Variables de entorno

| Variable | Obligatoria | Descripción |
|---|---|---|
| `DATABASE_URL` | Sí (Neon) | Cadena de conexión completa; tiene prioridad sobre las variables individuales. |
| `DB_SSL` | Recomendada | `true` para Neon/nube, `false` para local. |
| `DB_NAME` | Sí (local) | Nombre de la base de datos. |
| `DB_USER` | Sí (local) | Usuario de PostgreSQL. |
| `DB_PASSWORD` | Sí (local) | Contraseña. |
| `DB_HOST` | No | Host (por defecto `localhost`). |
| `DB_PORT` | No | Puerto (por defecto `5432`). |
| `JWT_SECRET` | Sí | Secreto para firmar los tokens. |
| `JWT_EXPIRES_IN` | No | Duración del token (por defecto `8h`). |
| `PORT` | No | Puerto del servidor (por defecto `3000`). |

Genera un secreto seguro:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## Base de datos

### Contenido del seed

| Tabla | Registros |
|---|---:|
| `roles` | 3 |
| `usuarios` | 6 |
| `aeropuertos` | 6 |
| `pasajeros` | 6 |
| `puertas` | **25** |
| `bandas_equipaje` | 10 |
| `vuelos` | 12 |
| `itinerarios` | 6 |
| `pasajero_vuelo` | 8 |
| `escalas` | 2 |
| `equipajes` | 8 |
| `equipaje_vuelo` | 11 |
| `notificaciones` | 12 |
| `historial_vuelo` | 6 |
| `historial_equipaje` | 16 |
| `auditoria` | 7 |

### Reglas a nivel de base de datos

- **Una puerta, un vuelo a la vez:** restricción de exclusión `no_solape_puerta`:

  ```sql
  EXCLUDE USING gist (
    id_puerta WITH =,
    tsrange(fecha_salida + hora_salida,
            fecha_llegada + hora_llegada, '[)') WITH &&
  )
  WHERE (id_puerta IS NOT NULL AND estado <> 'CANCELADO');
  ```

  Requiere la extensión `btree_gist`. Protege incluso ante inserciones concurrentes.

- **Vínculo usuario–pasajero:** `usuarios.id_pasajero` es único y referencia a `pasajeros`.
- **Integridad referencial:** FKs con `ON DELETE RESTRICT/SET NULL` y `ON UPDATE CASCADE`.
- **Timestamps:** `updated_at` se actualiza con el trigger `set_updated_at()`.

### Migración de MySQL a PostgreSQL

| MySQL | PostgreSQL |
|---|---|
| `ENUM(...)` | Tipos ENUM nativos |
| `AUTO_INCREMENT` | `GENERATED BY DEFAULT AS IDENTITY` |
| `TINYINT(1)` | `BOOLEAN` |
| `DATETIME` / `TIMESTAMP` | `TIMESTAMPTZ` (UTC) |
| `ON UPDATE CURRENT_TIMESTAMP` | Trigger `set_updated_at()` |
| Índices implícitos de FK | Índices explícitos |
| `CHECK` de fechas, capacidad y peso | Restricciones `CHECK` equivalentes |
| Sin regla de solape | `EXCLUDE USING gist` (v1.1.0) |

Las secuencias se reajustan al final del seed (`setval`) para continuar después del último ID.

---

## Seguridad y roles

Todas las rutas bajo `/api` requieren `Authorization: Bearer <token>`, excepto `POST /api/auth/login`. El endpoint raíz `GET /` es público.

| Rol | Permisos |
|---|---|
| `ADMINISTRADOR` | Acceso completo, incluidos usuarios, roles y auditoría. Puede eliminar registros. |
| `SECRETARIO` | Operación diaria: vuelos, pasajeros, equipajes, itinerarios, escalas, puertas, bandas, notificaciones e historiales. No gestiona usuarios, roles ni auditoría. |
| `PASAJERO` | Consulta de vuelos, sus propios vuelos, equipajes y notificaciones. Puede marcar sus notificaciones como leídas. |

Además:

- **Validación estricta** con Zod: rechaza campos desconocidos y datos fuera de rango.
- **Contraseñas** con bcrypt y tokens JWT con expiración.
- **Errores centralizados:** no se filtran mensajes internos de la base de datos.
- **Auditoría inmutable:** no existen endpoints `DELETE` para auditoría ni historiales.
- **Contexto por request** con `AsyncLocalStorage` para registrar usuario e IP en la auditoría.

---

## Reglas de negocio

### Vuelos

- Todo vuelo se crea en `PROGRAMADO`.
- Transiciones permitidas:

  ```
  PROGRAMADO → ABORDANDO | RETRASADO | CANCELADO
  RETRASADO  → PROGRAMADO | ABORDANDO | CANCELADO
  ABORDANDO  → ABORDADO | RETRASADO | CANCELADO
  ABORDADO   → EN_VUELO | RETRASADO
  EN_VUELO   → ATERRIZADO
  ATERRIZADO → FINALIZADO
  FINALIZADO → (final)
  CANCELADO  → (final)
  ```

- Reprogramar exige fechas/horas coherentes y vuelve a validar la puerta.
- Cancelar exige motivo, registra historial, notifica a los pasajeros y marca sus asignaciones como `CANCELADO`.
- No se puede modificar un vuelo `CANCELADO` o `FINALIZADO` sin cambiar de estado.
- Un vuelo con historial o dependencias no se puede eliminar (HTTP 409).

### Equipaje

- Estados: `REGISTRADO`, `EN_TRANSITO`, `EN_BANDA`, `CARGADO`, `TRANSFERIDO`, `ENTREGADO`, `EXTRAVIADO`, `DANADO`.
- Transiciones validadas (por ejemplo, `ENTREGADO` es final).
- **Conexión sin retiro:** el segundo tramo debe iniciar en el aeropuerto donde termina el tramo anterior.
- Asignar banda exige que esté `DISPONIBLE`; genera notificación `BANDA_EQUIPAJE`.
- Las incidencias (`EXTRAVIADO`, `DANADO`, `ENTREGADO`) notifican al pasajero.

### Notificaciones

Se generan automáticamente en:

- Asignación o cambio de puerta (`PUERTA_ASIGNADA`, `CAMBIO_PUERTA`).
- Cambio de horario (`CAMBIO_HORARIO`).
- Retraso (`VUELO_RETRASADO`).
- Cancelación (`VUELO_CANCELADO`).
- Conexión de equipaje (`ESCALA`).
- Banda de equipaje (`BANDA_EQUIPAJE`).
- Incidencias y entrega (`INFORMACION_GENERAL`).

### Historial y auditoría

- **Historial de vuelo:** una fila por campo modificado (valor anterior y nuevo, motivo y usuario).
- **Historial de equipaje:** cada movimiento (tramo, banda, estado).
- **Auditoría:** hooks de Sequelize registran `CREAR`, `ACTUALIZAR` y `ELIMINAR` de las entidades de negocio, con usuario, IP y campos modificados. Se excluyen notificaciones, historiales y la propia auditoría para evitar ruido y recursión.
- El login exitoso también queda auditado.

---

## API REST

URL base: `http://localhost:3000/api`

### Autenticación

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"nombre_usuario":"admin","password":"Admin123!"}'
```

Respuesta:

```json
{
  "token": "<jwt>",
  "usuario": {
    "id_usuario": 1,
    "nombre_usuario": "admin",
    "id_pasajero": null,
    "rol": { "id_rol": 1, "nombre": "ADMINISTRADOR" }
  }
}
```

Usa el token en las demás rutas:

```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <jwt>"
```

### Recursos con CRUD

| Recurso | Ruta base |
|---|---|
| Roles | `/api/roles` |
| Usuarios | `/api/usuarios` |
| Pasajeros | `/api/pasajeros` |
| Aeropuertos | `/api/aeropuertos` |
| Puertas | `/api/puertas` |
| Bandas de equipaje | `/api/bandas-equipaje` |
| Vuelos | `/api/vuelos` |
| Itinerarios | `/api/itinerarios` |
| Pasajero–vuelo | `/api/pasajero-vuelo` |
| Escalas | `/api/escalas` |
| Equipajes | `/api/equipajes` |
| Equipaje–vuelo | `/api/equipaje-vuelo` |
| Notificaciones | `/api/notificaciones` |
| Historial de vuelo | `/api/historial-vuelo` (sin DELETE) |
| Historial de equipaje | `/api/historial-equipaje` (sin DELETE) |
| Auditoría | `/api/auditoria` (solo lectura) |

Cada recurso expone `GET /`, `GET /:id`, `POST /`, `PUT /:id` y, cuando aplica, `DELETE /:id`.

### Endpoints de negocio

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| `GET` | `/api/vuelos/mios` | PASAJERO | Vuelos del pasajero autenticado. |
| `PATCH` | `/api/vuelos/:id/estado` | ADMIN, SECRETARIO | Cambia el estado validando transiciones. |
| `PATCH` | `/api/vuelos/:id/reprogramar` | ADMIN, SECRETARIO | Cambia fecha/hora con validación de puerta. |
| `PATCH` | `/api/vuelos/:id/puerta` | ADMIN, SECRETARIO | Asigna o cambia puerta. |
| `POST` | `/api/vuelos/:id/cancelar` | ADMIN, SECRETARIO | Cancela con motivo obligatorio. |
| `GET` | `/api/equipajes/mios` | PASAJERO | Equipajes del pasajero autenticado. |
| `POST` | `/api/equipajes/:id/tramos` | ADMIN, SECRETARIO | Registra un tramo/conexión. |
| `PATCH` | `/api/equipajes/:id/banda` | ADMIN, SECRETARIO | Asigna banda de entrega. |
| `PATCH` | `/api/equipajes/:id/estado` | ADMIN, SECRETARIO | Cambia estado con validación. |
| `GET` | `/api/notificaciones/mias` | PASAJERO | Notificaciones propias. |
| `PATCH` | `/api/notificaciones/mias/leer-todas` | PASAJERO | Marca todas como leídas. |
| `PATCH` | `/api/notificaciones/:id/leer` | Todos | Marca una notificación como leída (el pasajero solo las suyas). |
| `GET` | `/api/auditoria/usuario/:idUsuario` | ADMIN | Auditoría de un usuario. |
| `GET` | `/api/historial-vuelo/vuelo/:idVuelo` | ADMIN, SECRETARIO | Historial de un vuelo. |
| `GET` | `/api/historial-equipaje/equipaje/:idEquipaje` | ADMIN, SECRETARIO | Historial de un equipaje. |

### Ejemplos

Reprogramar un vuelo:

```bash
curl -X PATCH http://localhost:3000/api/vuelos/3/reprogramar \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "fecha_salida": "2026-10-03",
    "hora_salida": "19:00",
    "fecha_llegada": "2026-10-04",
    "hora_llegada": "12:00",
    "motivo": "Ajuste operativo"
  }'
```

Registrar una conexión de equipaje:

```bash
curl -X POST http://localhost:3000/api/equipajes/2/tramos \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "id_vuelo": 11 }'
```

---

## Usuarios de prueba

Datos sembrados **solo para desarrollo**. Cámbialos antes de desplegar.

| Usuario | Contraseña | Rol | Pasajero vinculado |
|---|---|---|---|
| `admin` | `Admin123!` | ADMINISTRADOR | — |
| `secretario` | `Secretario123!` | SECRETARIO | — |
| `carlos` | `Pasajero123!` | PASAJERO | 1 (Carlos Martinez) |
| `sofia` | `Pasajero123!` | PASAJERO | 2 (Sofia Ramirez) |
| `andrea` | `Pasajero123!` | PASAJERO | 3 (Andrea Lopez) |
| `inactivo` | `Pasajero123!` | PASAJERO | — (login rechazado con 403) |

---

## Scripts npm

| Script | Descripción |
|---|---|
| `npm start` | Inicia el servidor. |
| `npm run dev` | Inicia con recarga automática (nodemon). |
| `npm run db:init` | Crea el esquema y carga los datos iniciales. |
| `npm run test:api` | Ejecuta las pruebas de integración v1.1.0 (56 verificaciones). |

---

## Flujo de trabajo con Git

- `main`: versión estable.
- `juanjo`, `Demy`: ramas de desarrollo.
- `feature/v1.1.0`: rama de esta versión.
- Cada módulo se integra mediante **Pull Request**.
- Versionado semántico (`MAJOR.MINOR.PATCH`).

| Versión | Contenido |
|---|---|
| `v1.0.0` | Backend base y migración a PostgreSQL. |
| `v1.1.0` | Seguridad, validaciones, lógica de negocio, notificaciones, historial y auditoría automáticos. |

### Convención de commits

```
feat: nueva funcionalidad
fix: corrección de error
docs: documentación
refactor: reorganización sin cambio funcional
test: pruebas
chore: tareas de mantenimiento
```

---

## Limitaciones conocidas de v1.1.0

- Sin frontend ni panel gráfico en tiempo real.
- Sin mensajería asíncrona (RabbitMQ/Kafka): las notificaciones se guardan en la base, todavía no se envían por correo/push.
- Sin reportes exportables a Excel/PDF ni integración con Power BI.
- Sin agente de IA ni RAG.
- Sin despliegue del backend en la nube (la base ya puede estar en Neon).
- Pruebas de integración únicamente; no hay pruebas unitarias.
- Sin refresh tokens, bloqueo por intentos fallidos ni rate limiting.

---

## Hoja de ruta

| Versión | Alcance |
|---|---|
| **v1.1.0** | Seguridad, validaciones, máquina de estados, conflicto de puertas, equipaje en conexión, notificaciones, historial y auditoría. |
| v1.2.0 | Panel gráfico en tiempo real (25 puertas), frontend y WebSocket/SSE. |
| v1.3.0 | RabbitMQ/Kafka, 15 reportes con Excel/PDF, Power BI, agente de IA + RAG y despliegue en producción. |

---

## Equipo

- Juanjo
- Demy

Proyecto final — Programación Comercial
Universidad Mesoamericana Quetzaltenango
