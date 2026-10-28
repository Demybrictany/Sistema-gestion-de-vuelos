# Integración con Power BI

El backend expone un conjunto de **vistas PostgreSQL de solo lectura** (`bi_*`) pensadas para consumo desde Power BI. Las vistas no modifican datos y concentran las relaciones y agregaciones que un tablero necesita.

---

## 1. Crear las vistas

Con la base ya inicializada:

```bash
npm run db:views
```

El script ejecuta [`db/postgres/views_bi.sql`](../db/postgres/views_bi.sql) y lista las vistas creadas. También se ejecutan automáticamente al correr `npm run db:init`.

Para ejecutarlo manualmente:

```bash
psql "$DATABASE_URL" -f db/postgres/views_bi.sql
```

---

## 2. Usuario de solo lectura

No conectes Power BI con el usuario administrador de la base. Crea un usuario con permisos únicamente de lectura (ejecútalo con un usuario con privilegios suficientes):

```sql
CREATE ROLE bi_lectura WITH LOGIN PASSWORD 'cambia-esta-clave';

GRANT CONNECT ON DATABASE neondb TO bi_lectura;
GRANT USAGE ON SCHEMA public TO bi_lectura;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO bi_lectura;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO bi_lectura;
```

> Sustituye `neondb` por el nombre real de tu base. En Neon, crea este rol desde el SQL Editor con un usuario propietario.

---

## 3. Conectar Power BI Desktop

1. Abre **Power BI Desktop** → **Obtener datos** → **Base de datos PostgreSQL**.
2. En **Servidor** pega el host de la base (por ejemplo, `ep-xxxx.us-east-2.aws.neon.tech`).
3. En **Base de datos** escribe el nombre (`neondb`).
4. Elige **Importar** (recomendado para fuerza de datos) o **DirectQuery** (datos en vivo).
5. Selecciona las vistas `bi_*` y pulsa **Cargar**.

Si la conexión usa SSL, en **Opciones avanzadas** añade:

```
sslmode=require
```

Con un servidor PostgreSQL local:

- Servidor: `localhost`
- Base de datos: el valor de `DB_NAME`
- Usuario: `bi_lectura`
- Contraseña: la definida en el paso anterior

---

## 4. Vistas disponibles

| Vista | Contenido | Uso sugerido |
|---|---|---|
| `bi_vuelos` | Vuelos con aeropuertos de origen/destino, puerta, estado, capacidad, pasajeros y equipajes. | Tablero operativo, mapa de puertas, ocupación. |
| `bi_pasajeros_vuelo` | Pasajeros por vuelo, asiento, estado de reserva e itinerario. | Ocupación por vuelo, listas de abordaje. |
| `bi_equipajes` | Equipajes con pasajero, ruta, banda y estado. | Inventario de equipaje, bandas. |
| `bi_equipaje_tramos` | Tramos de equipaje y conexiones. | Seguimiento de equipaje en conexión. |
| `bi_notificaciones` | Notificaciones con pasajero, vuelo, equipaje y lectura. | Tasa de lectura, comunicación. |
| `bi_historial_vuelo` | Cambios de vuelos con valores anterior/nuevo y usuario. | Auditoría operativa. |
| `bi_historial_equipaje` | Movimientos de equipaje y bandas. | Trazabilidad de equipaje. |
| `bi_auditoria` | Operaciones auditadas con usuario y tabla afectada. | Seguridad y actividad de usuarios. |
| `bi_kpis_diarios` | Vuelos, pasajeros, equipajes, notificaciones y operaciones por día. | Series temporales y KPIs ejecutivos. |

---

## 5. Relaciones recomendadas en el modelo

| Desde | Hacia | Cardinalidad |
|---|---|---|
| `bi_vuelos[id_vuelo]` | `bi_pasajeros_vuelo[id_vuelo]` | 1 → * |
| `bi_vuelos[id_vuelo]` | `bi_notificaciones[id_vuelo]` | 1 → * |
| `bi_vuelos[id_vuelo]` | `bi_equipaje_tramos[id_vuelo]` | 1 → * |
| `bi_equipajes[id_equipaje]` | `bi_equipaje_tramos[id_equipaje]` | 1 → * |
| `bi_equipajes[id_equipaje]` | `bi_notificaciones[id_equipaje]` | 1 → * |
| `bi_kpis_diarios[fecha]` | `bi_vuelos[fecha_salida]` | 1 → * |

Desactiva la dirección de filtro cruzada automática donde no corresponda y marca `bi_kpis_diarios[fecha]` como **tabla de fechas** para usar jerarquías de tiempo.

---

## 6. Tableros sugeridos

- **Operación diaria:** vuelos por estado, ocupación por puerta, pasajeros por hora.
- **Equipaje:** equipajes por banda, incidencias por mes, conexiones activas.
- **Pasajeros:** reservas por estado, nacionalidades, ocupación por vuelo.
- **Auditoría:** actividad por usuario, cambios de vuelo, notificaciones pendientes.

---

## 7. Actualización

- **Importar:** actualiza manualmente con **Actualizar** o programa la actualización en Power BI Service con una puerta de enlace si la base no es accesible desde internet.
- **DirectQuery:** los datos se consultan en vivo; conviene crear índices en las columnas de fecha si el volumen crece.
- Las vistas se recrean con `npm run db:views` cuando cambie el esquema. El script es idempotente.

---

## 8. Recomendaciones de seguridad

- Usa siempre un usuario de solo lectura (`bi_lectura`).
- No publiques la cadena de conexión ni el archivo `.pbix` con credenciales embebidas.
- En Neon, habilita SSL y restringe el acceso por IP si es posible.
- Las vistas no exponen `password_hash` ni datos sensibles de autenticación.
