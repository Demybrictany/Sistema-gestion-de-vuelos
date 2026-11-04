# Tablero de Power BI — guía paso a paso

**Proyecto:** Sistema de Gestión de Vuelos AICM  
**Versión:** v1.6.2  
**Objetivo:** construir el archivo `.pbix` que falta para la rúbrica, conectado a las vistas `bi_*` de Neon.

---

## 0. Antes de empezar

Necesitas:

- **Power BI Desktop** instalado en Windows (es gratis).
- La cadena de conexión **directa** de Neon (sin `-pooler`).
- El usuario de solo lectura `bi_lectura` (lo creamos en el paso 2).
- La carpeta `docs/powerbi/` en el repositorio.

Comprueba que las 11 vistas existen en Neon. En el **SQL Editor**:

```sql
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public' AND table_name LIKE 'bi_%'
ORDER BY table_name;
```

Debe devolver 11 filas: `bi_auditoria`, `bi_entregas_notificacion`, `bi_equipaje_tramos`, `bi_equipajes`, `bi_historial_equipaje`, `bi_historial_vuelo`, `bi_interacciones_agente`, `bi_kpis_diarios`, `bi_notificaciones`, `bi_pasajeros_vuelo`, `bi_vuelos`.

Si falta alguna, ejecuta en el proyecto:

```bash
npm run db:views
```

---

## 1. Crear el usuario de solo lectura

No conectes Power BI con el usuario dueño de la base. En el **SQL Editor de Neon**, ejecuta:

```sql
CREATE ROLE bi_lectura WITH LOGIN PASSWORD 'UnaClaveSegura2026!';

GRANT CONNECT ON DATABASE neondb TO bi_lectura;
GRANT USAGE ON SCHEMA public TO bi_lectura;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO bi_lectura;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO bi_lectura;
```

Si el rol ya existe, cambia solo la contraseña:

```sql
ALTER ROLE bi_lectura WITH PASSWORD 'UnaClaveSegura2026!';
```

> Usa una contraseña distinta a la del administrador y no la escribas en el repositorio.

---

## 2. Conectar Power BI Desktop

1. Abre **Power BI Desktop**.
2. **Inicio → Obtener datos → Más… → Base de datos → PostgreSQL**.
3. Completa:
   - **Servidor:** el host **directo** de Neon, sin `-pooler`.
     Ejemplo de forma: `ep-xxxx.c-6.us-east-2.aws.neon.tech`.
   - **Base de datos:** `neondb`.
   - **Modo de conectividad:** **Importar** (recomendado para el curso).
4. Abre **Opciones avanzadas** y añade:

   ```text
   sslmode=require
   ```

5. Pulsa **Aceptar**.
6. En credenciales elige **Base de datos**:
   - Usuario: `bi_lectura`
   - Contraseña: la que definiste.
7. Si aparece un aviso de cifrado o certificado, revisa que estés usando el host directo y `sslmode=require`.

### Si aparece “Npgsql provider is not registered”

Power BI necesita el proveedor Npgsql:

1. Descarga **Npgsql 4.1.x** (instalador MSI, GAC) desde el sitio oficial de Npgsql.
2. Instálalo y reinicia Power BI Desktop.
3. Vuelve a intentar la conexión.

### Si la conexión se queda pensando

- Usa el host **directo**, no el `-pooler`.
- Neon puede estar despertando: reintenta una vez.
- Verifica que `bi_lectura` tenga `CONNECT`, `USAGE` y `SELECT`.

---

## 3. Cargar las vistas

En el navegador de Power BI, marca estas vistas:

- `bi_vuelos`
- `bi_pasajeros_vuelo`
- `bi_equipajes`
- `bi_equipaje_tramos`
- `bi_notificaciones`
- `bi_entregas_notificacion`
- `bi_kpis_diarios`
- `bi_historial_vuelo`
- `bi_historial_equipaje`
- `bi_auditoria`
- `bi_interacciones_agente`

Pulsa **Transformar datos** (no “Cargar” todavía) y revisa los tipos:

| Columna | Tipo |
|---|---|
| `fecha_salida`, `fecha_llegada`, `fecha`, `fecha_envio`, `fecha_registro`, `fecha_hora`, `created_at`, `updated_at` | Fecha / Fecha y hora |
| `hora_salida`, `hora_llegada` | Hora |
| `id_*`, `intento`, `tokens_*`, `latencia_ms` | Número entero |
| `peso` | Número decimal |
| `capacidad_pasajeros`, `pasajeros_asignados` | Número entero |

Renombra las tablas a nombres amigables si quieres:

- `bi_vuelos` → `Vuelos`
- `bi_pasajeros_vuelo` → `PasajerosVuelo`
- `bi_equipajes` → `Equipajes`
- `bi_equipaje_tramos` → `EquipajeTramos`
- `bi_notificaciones` → `Notificaciones`
- `bi_entregas_notificacion` → `Entregas`
- `bi_kpis_diarios` → `KPIsDiarios`
- `bi_interacciones_agente` → `InteraccionesAgente`

Pulsa **Cerrar y aplicar**.

---

## 4. Modelo y relaciones

En la vista **Modelo**, crea estas relaciones (arrastra el campo de la izquierda al de la derecha):

| Desde | Hacia | Cardinalidad | Dirección |
|---|---|---|---|
| `Vuelos[id_vuelo]` | `PasajerosVuelo[id_vuelo]` | 1 → * | Única |
| `Vuelos[id_vuelo]` | `Notificaciones[id_vuelo]` | 1 → * | Única |
| `Notificaciones[id_notificacion]` | `Entregas[id_notificacion]` | 1 → * | Única |
| `Vuelos[id_vuelo]` | `EquipajeTramos[id_vuelo]` | 1 → * | Única |
| `Equipajes[id_equipaje]` | `EquipajeTramos[id_equipaje]` | 1 → * | Única |
| `Equipajes[id_equipaje]` | `Notificaciones[id_equipaje]` | 1 → * | Única |
| `KPIsDiarios[fecha]` | `Vuelos[fecha_salida]` | 1 → * | Única |
| `Vuelos[id_vuelo]` | `HistorialVuelo[id_vuelo]` | 1 → * | Única |
| `Equipajes[id_equipaje]` | `HistorialEquipaje[id_equipaje]` | 1 → * | Única |

Pasos:

1. Selecciona `KPIsDiarios` → ficha **Herramientas de tabla** → **Marcar como tabla de fechas** → columna `fecha`.
2. Oculta las claves técnicas (`id_*`) de la vista de informe: clic derecho → **Ocultar en la vista de informe**.
3. Deja `InteraccionesAgente` y `Auditoria` sin relaciones; son tablas de detalle.

---

## 5. Medidas DAX

Crea una tabla de medidas (opcional):

1. **Inicio → Escribir datos** → nombre `_Medidas`, una columna `Valor`, aceptar.
2. Clic derecho en `_Medidas` → **Nueva medida** y pega cada una.

### Operación

```dax
Total vuelos = COUNTROWS('Vuelos')

Pasajeros asignados = SUM('Vuelos'[pasajeros_asignados])

Capacidad total = SUM('Vuelos'[capacidad_pasajeros])

Ocupación % = DIVIDE([Pasajeros asignados], [Capacidad total])

Vuelos cancelados =
CALCULATE([Total vuelos], 'Vuelos'[estado] = "CANCELADO")

Vuelos retrasados =
CALCULATE([Total vuelos], 'Vuelos'[estado] = "RETRASADO")

Vuelos hoy =
CALCULATE([Total vuelos], 'Vuelos'[fecha_salida] = TODAY())

Puertas con vuelos = DISTINCTCOUNT('Vuelos'[puerta])
```

### Equipaje

```dax
Total equipajes = COUNTROWS('Equipajes')

Peso total = SUM('Equipajes'[peso])

Equipajes en tránsito =
CALCULATE([Total equipajes], 'Equipajes'[estado] = "EN_TRANSITO")

Equipajes dañados =
CALCULATE([Total equipajes], 'Equipajes'[estado] = "DANADO")
```

### Notificaciones y agente

```dax
Total notificaciones = COUNTROWS('Notificaciones')

Entregas = COUNTROWS('Entregas')

Entregas simuladas =
CALCULATE([Entregas], 'Entregas'[estado] = "SIMULADA")

Entregas enviadas =
CALCULATE([Entregas], 'Entregas'[estado] = "ENVIADA")

Entregas fallidas =
CALCULATE([Entregas], 'Entregas'[estado] = "FALLIDA")

Tasa de entrega =
DIVIDE([Entregas simuladas] + [Entregas enviadas], [Entregas])

Interacciones agente = COUNTROWS('InteraccionesAgente')

Latencia promedio (ms) = AVERAGE('InteraccionesAgente'[latencia_ms])

Tokens totales =
SUM('InteraccionesAgente'[tokens_prompt]) +
SUM('InteraccionesAgente'[tokens_respuesta])
```

Formatea `Ocupación %` y `Tasa de entrega` como porcentaje.

---

## 6. Páginas del tablero

### Página 1 — Operación diaria

**Tarjetas KPI (arriba):**

- Total vuelos
- Pasajeros asignados
- Ocupación %
- Vuelos retrasados
- Vuelos cancelados

**Visuales:**

| Visual | Campos |
|---|---|
| Gráfico de barras | Eje: `Vuelos[estado]` · Valor: `[Total vuelos]` |
| Gráfico de líneas | Eje: `KPIsDiarios[fecha]` · Valores: `SUM(KPIsDiarios[vuelos])`, `SUM(KPIsDiarios[pasajeros])` |
| Tabla | `Vuelos[codigo_vuelo]`, `origen_iata`, `destino_iata`, `fecha_salida`, `hora_salida`, `puerta`, `estado`, `pasajeros_asignados`, `capacidad_pasajeros` |
| Segmentación | `KPIsDiarios[fecha]` (entre), `Vuelos[estado]`, `Vuelos[origen_iata]`, `Vuelos[destino_iata]` |

### Página 2 — Puertas y rutas

| Visual | Campos |
|---|---|
| Barras | Eje: `Vuelos[puerta]` · Valor: `[Total vuelos]` |
| Matriz | Filas: `Vuelos[puerta]` · Columnas: `Vuelos[estado]` · Valores: `[Total vuelos]` |
| Barras | Eje: ruta calculada · Valor: `[Total vuelos]` |
| Tarjeta | `[Puertas con vuelos]` |
| Segmentación | `Vuelos[zona_puerta]`, `Vuelos[estado]` |

Crea una columna calculada para la ruta:

```dax
Ruta = 'Vuelos'[origen_iata] & " → " & 'Vuelos'[destino_iata]
```

### Página 3 — Equipaje

| Visual | Campos |
|---|---|
| Tarjetas | `[Total equipajes]`, `[Peso total]`, `[Equipajes en tránsito]`, `[Equipajes dañados]` |
| Dona | Leyenda: `Equipajes[estado]` · Valor: `[Total equipajes]` |
| Barras | Eje: `Equipajes[banda_actual]` · Valor: `[Total equipajes]` |
| Tabla | `codigo_equipaje`, `pasajero`, `origen_iata`, `destino_final_iata`, `peso`, `estado`, `banda_actual` |
| Segmentación | `Equipajes[estado]`, `Equipajes[banda_zona]` |

### Página 4 — Notificaciones, entregas y agente

| Visual | Campos |
|---|---|
| Tarjetas | `[Total notificaciones]`, `[Entregas]`, `[Entregas simuladas]`, `[Entregas fallidas]`, `[Interacciones agente]` |
| Barras | Eje: `Notificaciones[tipo]` · Valor: `[Total notificaciones]` |
| Dona | Leyenda: `Entregas[estado]` · Valor: `[Entregas]` |
| Barras | Eje: `Entregas[canal]` · Valor: `[Entregas]` |
| Tabla | `InteraccionesAgente[created_at]`, `nombre_usuario`, `proveedor`, `modelo`, `pregunta`, `latencia_ms`, `tokens_prompt`, `tokens_respuesta` |
| Tarjetas | `[Latencia promedio (ms)]`, `[Tokens totales]` |
| Segmentación | `Entregas[estado]`, `InteraccionesAgente[proveedor]` |

### Página 5 (opcional) — Auditoría

| Visual | Campos |
|---|---|
| Barras | Eje: `Auditoria[accion]` · Valor: recuento |
| Barras | Eje: `Auditoria[usuario]` · Valor: recuento |
| Tabla | `accion`, `tabla_afectada`, `descripcion`, `fecha_hora`, `usuario` |
| Segmentación | fecha, usuario |

---

## 7. Presentación

- Usa un título por página y un subtítulo con “Neon PostgreSQL · vistas bi_*”.
- Mantén los mismos colores en todas las páginas.
- Alinea las tarjetas KPI con la cuadrícula (**Ver → Cuadrícula**).
- Añade un pie: “Sistema de Gestión de Vuelos AICM · v1.6.2”.
- Ordena las páginas: Operación, Puertas y rutas, Equipaje, Notificaciones y agente.

---

## 8. Guardar y entregar

1. **Archivo → Guardar como**:
   `docs/powerbi/Sistema-Vuelos-AICM.pbix`
2. **Archivo → Exportar → Exportar a PDF**:
   `docs/powerbi/Sistema-Vuelos-AICM.pdf`
3. Capturas de cada página en `docs/powerbi/capturas/`:
   - `01-operacion.png`
   - `02-puertas-rutas.png`
   - `03-equipaje.png`
   - `04-notificaciones-agente.png`
4. Actualiza `docs/POWER_BI.md` con una sección “Tablero implementado” que liste las páginas y la ruta del `.pbix`.
5. Commit:

```text
docs(powerbi): agregar tablero .pbix, PDF y capturas

Qué se hizo:
- Conecta Power BI a las vistas bi_* de Neon con el usuario bi_lectura.
- Agrega cuatro páginas: operación diaria, puertas/rutas, equipaje y notificaciones/agente.
- Guarda el .pbix, el PDF y las capturas en docs/powerbi/.

Por qué:
- Completa el entregable de Power BI de la rúbrica.

Verificación:
- Actualización de datos en Power BI sin errores.
- Capturas y PDF exportados.
```

> El `.pbix` no debería guardar la contraseña. Si Power BI pregunta por credenciales al abrirlo, usa `bi_lectura`; no incrustes la cadena del dueño.

---

## 9. Problemas comunes

| Síntoma | Causa | Solución |
|---|---|---|
| `Npgsql provider is not registered` | Falta el proveedor | Instala Npgsql 4.1.x (GAC) y reinicia Power BI. |
| Error SSL | Falta `sslmode=require` | Añade la opción en **Opciones avanzadas**. |
| Timeout | Usaste el pooler o Neon está despertando | Usa el host directo y reintenta. |
| `permission denied` | `bi_lectura` sin permisos | Ejecuta los `GRANT` del paso 1. |
| No aparecen las vistas | Faltan en la base | Ejecuta `npm run db:views`. |
| Fechas como texto | Tipo incorrecto | Cámbialo a Fecha en Power Query. |
| El `.pbix` pide credenciales | Es normal | Usa `bi_lectura`; no guardes la del dueño. |

---

## 10. Checklist de cierre

- [ ] Usuario `bi_lectura` creado y con permisos.
- [ ] Las 11 vistas cargadas.
- [ ] Relaciones creadas y `KPIsDiarios` marcada como tabla de fechas.
- [ ] Medidas DAX creadas.
- [ ] Cuatro páginas con visuales.
- [ ] `.pbix` guardado en `docs/powerbi/`.
- [ ] PDF y capturas exportados.
- [ ] `docs/POWER_BI.md` actualizado.
- [ ] Commit realizado.
