# Sistema de Gestión de Vuelos — AICM

Sistema para la gestión de **vuelos, pasajeros y equipaje** del Aeropuerto Internacional de la Ciudad de México (AICM). Permite administrar puertas de embarque, bandas de equipaje, itinerarios, escalas y notificaciones a los pasajeros.

**Versión:** `v1.0.0`
**Repositorio:** https://github.com/Demybrictany/Sistema-gestion-de-vuelos
**Equipo:** Juanjo, Demy

---

## Descripción

El sistema modela la operación del aeropuerto:

- Todo vuelo nace en estado `PROGRAMADO` y puede cambiar de horario, retrasarse, abordar o cancelarse.
- Una puerta no puede tener dos vuelos al mismo tiempo.
- El equipaje puede viajar en varios tramos (conexiones) sin que el pasajero tenga que retirarlo.
- Los pasajeros reciben notificaciones sobre puerta de embarque, banda de equipaje, horario y escalas.
- El catálogo incluye **25 puertas de embarque**, 10 bandas, 6 aeropuertos y datos de ejemplo.

Esta versión implementa la **base del backend y la migración a PostgreSQL**; el panel gráfico en tiempo real, la mensajería asíncrona, los reportes y el agente de IA se desarrollarán en las siguientes versiones (ver [Hoja de ruta](#hoja-de-ruta)).

---

## Stack

| Componente | Tecnología |
|---|---|
| Runtime | Node.js 18+ (CommonJS) |
| Framework | Express 5 |
| ORM | Sequelize 6 |
| Base de datos | PostgreSQL 14+ (local o [Neon](https://neon.tech)) |
| Autenticación | JWT + bcryptjs |
| Tiempo real | Socket.io (reservado para la siguiente versión) |

---

## Estructura del proyecto

```
.
├── app.js                      # Punto de entrada y registro de rutas
├── controllers/                # Lógica de cada recurso (CRUD)
├── db/
│   ├── database.js             # Conexión Sequelize (PostgreSQL)
│   ├── postgres/
│   │   ├── schema.sql          # Esquema PostgreSQL (16 tablas)
│   │   └── seed.sql            # Datos iniciales
│   └── legacy/
│       └── scrip-sistema-vuelos.sql  # Dump MySQL original (referencia)
├── middlewares/
│   └── auth.middleware.js      # verificarToken y permitirRoles
├── models/                     # Modelos Sequelize y asociaciones
├── routes/                     # Definición de endpoints REST
├── scripts/
│   └── init-db.js              # Ejecuta schema.sql + seed.sql
├── .env.example                # Plantilla de variables de entorno
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

Edita `.env` según tu proveedor.

#### Opción A — Neon (recomendado)

1. Crea un proyecto en [neon.tech](https://neon.tech).
2. En **Project → Connect**, copia la cadena de conexión.
3. Configura:

```env
DATABASE_URL=postgresql://usuario:password@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
DB_SSL=true
JWT_SECRET=<un_secreto_largo_y_aleatorio>
PORT=3000
```

> Las credenciales de Neon las genera cada equipo desde su propia cuenta. **No se suben al repositorio.**

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

Crea la base de datos antes de continuar:

```bash
createdb -U postgres aeropuerto_db
```

### 3. Crear el esquema y cargar los datos

```bash
npm run db:init
```

Este comando ejecuta `db/postgres/schema.sql` y `db/postgres/seed.sql`. Es **idempotente**: elimina y vuelve a crear las tablas cada vez que se ejecuta.

Salida esperada:

```
Ejecutando schema.sql...
Ejecutando seed.sql...
Base de datos inicializada correctamente.
Puertas: 25 | Vuelos: 12 | Pasajeros: 6 | Equipajes: 8 | Notificaciones: 12
```

> Alternativa con `psql`:
> ```bash
> psql "$DATABASE_URL" -f db/postgres/schema.sql
> psql "$DATABASE_URL" -f db/postgres/seed.sql
> ```

### 4. Ejecutar el servidor

```bash
npm run dev     # con nodemon
npm start       # producción
```

La API queda disponible en `http://localhost:3000`.

Comprueba el arranque:

```bash
curl http://localhost:3000/
# {"mensaje":"API del Sistema de Vuelos funcionando correctamente"}
```

---

## Variables de entorno

| Variable | Obligatoria | Descripción |
|---|---|---|
| `DATABASE_URL` | Sí (Neon) | Cadena de conexión completa de PostgreSQL. Tiene prioridad sobre las variables individuales. |
| `DB_SSL` | Recomendada | `true` para Neon/nube, `false` para local. |
| `DB_NAME` | Sí (local) | Nombre de la base de datos. |
| `DB_USER` | Sí (local) | Usuario de PostgreSQL. |
| `DB_PASSWORD` | Sí (local) | Contraseña de PostgreSQL. |
| `DB_HOST` | No | Host de la base de datos (por defecto `localhost`). |
| `DB_PORT` | No | Puerto de PostgreSQL (por defecto `5432`). |
| `JWT_SECRET` | Sí | Secreto para firmar los tokens JWT. |
| `JWT_EXPIRES_IN` | No | Duración del token (por defecto `8h`). |
| `PORT` | No | Puerto del servidor (por defecto `3000`). |

Genera un `JWT_SECRET` seguro con:

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

### Migración de MySQL a PostgreSQL (v1.0.0)

El dump original `db/legacy/scrip-sistema-vuelos.sql` fue convertido preservando esquema, relaciones, restricciones y datos:

| MySQL | PostgreSQL |
|---|---|
| `ENUM(...)` | Tipos ENUM nativos (`estado_vuelo`, `tipo_notificacion`, etc.) |
| `AUTO_INCREMENT` | `GENERATED BY DEFAULT AS IDENTITY` |
| `TINYINT(1)` | `BOOLEAN` |
| `DATETIME` / `TIMESTAMP` | `TIMESTAMPTZ` (valores interpretados en UTC) |
| `ON UPDATE CURRENT_TIMESTAMP` | Trigger `set_updated_at()` |
| Índices implícitos de FK | Índices explícitos (`*_idx`) |
| `CHECK` de fechas, capacidad y peso | Restricciones `CHECK` equivalentes |
| `ON DELETE SET NULL / RESTRICT` | Mismas acciones referenciales |

La secuencia de cada tabla se reajusta al final del seed (`setval`) para que los nuevos registros continúen después del último ID insertado.

### Modelo de entidades

- **Catálogos:** `roles`, `aeropuertos`, `puertas`, `bandas_equipaje`.
- **Operación:** `vuelos`, `itinerarios`, `escalas`, `pasajero_vuelo`, `equipaje_vuelo`.
- **Personas y equipaje:** `usuarios`, `pasajeros`, `equipajes`.
- **Notificaciones y trazabilidad:** `notificaciones`, `historial_vuelo`, `historial_equipaje`, `auditoria`.

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
    "rol": { "id_rol": 1, "nombre": "ADMINISTRADOR" }
  }
}
```

Para rutas protegidas:

```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <jwt>"
```

### Recursos

Todos los recursos exponen el CRUD estándar:

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/{recurso}` | Listar |
| `GET` | `/{recurso}/:id` | Obtener por ID |
| `POST` | `/{recurso}` | Crear |
| `PUT` | `/{recurso}/:id` | Actualizar |
| `DELETE` | `/{recurso}/:id` | Eliminar |

Recursos disponibles:

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
| Historial de vuelo | `/api/historial-vuelo` |
| Historial de equipaje | `/api/historial-equipaje` |
| Auditoría | `/api/auditoria` |

Endpoints adicionales:

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/auth/me` | Usuario autenticado (requiere JWT) |
| `GET` | `/api/auditoria/usuario/:idUsuario` | Auditoría de un usuario |
| `GET` | `/api/historial-vuelo/vuelo/:idVuelo` | Historial de un vuelo |
| `GET` | `/api/historial-equipaje/equipaje/:idEquipaje` | Historial de un equipaje |

### Usuarios de prueba

Datos sembrados **solo para desarrollo**. Cámbialos antes de desplegar en producción.

| Usuario | Contraseña | Rol | Estado |
|---|---|---|---|
| `admin` | `Admin123!` | ADMINISTRADOR | ACTIVO |
| `secretario` | `Secretario123!` | SECRETARIO | ACTIVO |
| `carlos` | `Pasajero123!` | PASAJERO | ACTIVO |
| `sofia` | `Pasajero123!` | PASAJERO | ACTIVO |
| `andrea` | `Pasajero123!` | PASAJERO | ACTIVO |
| `inactivo` | `Pasajero123!` | PASAJERO | INACTIVO |

> `inactivo` sirve para probar que el login rechaza usuarios deshabilitados (HTTP 403).

---

## Scripts npm

| Script | Descripción |
|---|---|
| `npm start` | Inicia el servidor. |
| `npm run dev` | Inicia con recarga automática (nodemon). |
| `npm run db:init` | Crea el esquema y carga los datos iniciales. |
| `npm test` | Reservado (aún no hay pruebas). |

---

## Flujo de trabajo con Git

- `main`: versión estable.
- `juanjo`, `Demy`: ramas de desarrollo.
- Cada módulo se desarrolla en una rama y se integra mediante **Pull Request**.
- Versionado semántico (`MAJOR.MINOR.PATCH`).

Este repositorio inicia su versionado con el PR **v1.0.0**, que incluye:

- Migración completa de MySQL a PostgreSQL.
- Scripts de esquema y datos iniciales.
- Configuración de conexión para Neon/local.
- Documentación del proyecto.
- Dependencias actualizadas (`pg`, `pg-hstore`; se retiró `mysql2`).

### Convención de commits

```
feat: nueva funcionalidad
fix: corrección de error
docs: documentación
refactor: reorganización sin cambio funcional
chore: tareas de mantenimiento
```

---

## Limitaciones conocidas de v1.0.0

Esta versión es la **base del backend**. Todavía no incluye:

- Protección de las rutas CRUD (solo `/api/auth/me` valida el token).
- Generación automática de notificaciones, historial y auditoría.
- Validación de conflictos de puerta al **actualizar** un vuelo.
- Panel gráfico, WebSocket/SSE y frontend.
- Mensajería asíncrona (RabbitMQ/Kafka).
- Reportes, exportación a Excel/PDF e integración con Power BI.
- Agente de IA y RAG.
- Pruebas automatizadas.
- Despliegue en producción.

---

## Hoja de ruta

| Versión | Alcance |
|---|---|
| **v1.0.0** | Backend base + migración a PostgreSQL + documentación. |
| v1.1.0 | Protección de rutas por rol, validaciones, transacciones y lógica de negocio (puertas, estados, equipaje en conexión). |
| v1.2.0 | Notificaciones automáticas, panel gráfico en tiempo real y frontend. |
| v1.3.0 | RabbitMQ/Kafka, 15 reportes con Excel/PDF, Power BI, agente de IA + RAG y despliegue. |

---

## Equipo

- Juanjo
- Demy

Proyecto final — Programación Comercial
Universidad Mesoamericana Quetzaltenango
