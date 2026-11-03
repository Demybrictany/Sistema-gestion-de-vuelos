# Tablero de Power BI

Este directorio contiene el entregable de Power BI del proyecto.

## Archivos esperados

| Archivo | Estado |
|---|---|
| `Sistema-Vuelos-AICM.pbix` | Pendiente de generar con Power BI Desktop. |
| `Sistema-Vuelos-AICM.pdf` | Exportación del tablero para la entrega. |
| `capturas/01-operacion.png` | Captura de la página de operación diaria. |
| `capturas/02-puertas-rutas.png` | Captura de la página de puertas y rutas. |
| `capturas/03-equipaje.png` | Captura de la página de equipaje. |
| `capturas/04-notificaciones-agente.png` | Captura de la página de notificaciones y agente. |

## Fuente de datos

Las 11 vistas `bi_*` de PostgreSQL (Neon), definidas en
[`db/postgres/views_bi.sql`](../../db/postgres/views_bi.sql). La conexión debe
usar un usuario de solo lectura (`bi_lectura`), nunca el usuario dueño.

## Guía

El paso a paso completo está en
[`docs/POWER_BI_PASO_A_PASO.md`](../POWER_BI_PASO_A_PASO.md):

1. Crear `bi_lectura` y dar permisos de `SELECT`.
2. Conectar Power BI Desktop al host directo de Neon con `sslmode=require`.
3. Cargar las vistas y crear las relaciones.
4. Crear las medidas DAX.
5. Construir cuatro páginas: operación diaria, puertas/rutas, equipaje y
   notificaciones/agente.
6. Guardar el `.pbix`, exportar el PDF y las capturas.

## Páginas del tablero

1. **Operación diaria:** vuelos, pasajeros, ocupación, retrasos y cancelaciones.
2. **Puertas y rutas:** ocupación por puerta y demanda por ruta.
3. **Equipaje:** estados, bandas, peso e incidencias.
4. **Notificaciones y agente:** notificaciones por tipo, entregas por estado,
   interacciones del agente y latencia.
