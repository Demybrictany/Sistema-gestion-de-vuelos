# Manual de usuario

## Sistema de Gestión de Vuelos — AICM

| Dato | Valor |
|---|---|
| Documento | Manual de usuario |
| Versión | 1.0 |
| Fecha | 2026-11-02 |
| Sistema | v1.6.2 |
| Frontend | https://sistema-gestion-de-vuelos.vercel.app |
| API | https://sistema-vuelos-api.onrender.com |
| Equipo | Juanjo, Demy |

> Este manual explica cómo usar el sistema. Para la parte técnica y de
> administración, ver [`02-MANUAL_ADMINISTRADOR_PROGRAMADOR.md`](02-MANUAL_ADMINISTRADOR_PROGRAMADOR.md).
> Para el historial y las decisiones de desarrollo, ver
> [`03-PROCEDIMIENTOS_DE_DESARROLLO.md`](03-PROCEDIMIENTOS_DE_DESARROLLO.md).

---

## Índice

1. [Qué es el sistema](#1-qué-es-el-sistema)
2. [Roles y accesos](#2-roles-y-accesos)
3. [Cómo entrar](#3-cómo-entrar)
4. [El panel operativo](#4-el-panel-operativo)
5. [Vista de vuelos](#5-vista-de-vuelos)
6. [Reportería](#6-reportería)
7. [Asistente de IA](#7-asistente-de-ia)
8. [Flujo del pasajero y notificaciones](#8-flujo-del-pasajero-y-notificaciones)
9. [Preguntas frecuentes y problemas](#9-preguntas-frecuentes-y-problemas)
10. [Guion de demostración](#10-guion-de-demostración)
11. [Glosario](#11-glosario)

---

## 1. Qué es el sistema

El Sistema de Gestión de Vuelos administra la operación del Aeropuerto
Internacional de la Ciudad de México (AICM):

- Vuelos y sus estados.
- Pasajeros y reservas.
- Puertas de embarque.
- Equipaje y bandas de entrega.
- Escalas y conexiones.
- Notificaciones automáticas.
- Reportería y Power BI.
- Un asistente de inteligencia artificial.

### 1.1 Qué puede hacer

- Ver el estado del aeropuerto en un panel en tiempo real.
- Consultar y filtrar vuelos.
- Consultar 16 reportes y descargarlos en Excel o PDF.
- Preguntar al asistente sobre vuelos, puertas, equipaje y políticas.
- Recibir notificaciones de cambios en el vuelo.

### 1.2 Qué no hace

- No vende boletos ni procesa pagos.
- No gestiona el equipaje físicamente.
- No permite consultar datos de otros pasajeros.
- El asistente no modifica datos: solo consulta.

---

## 2. Roles y accesos

| Rol | Acceso | Puede hacer |
|---|---|---|
| **ADMINISTRADOR** | Panel y API | Todo: usuarios, roles, auditoría, vuelos, pasajeros, equipaje, reportes y agente. |
| **SECRETARIO** | Panel y API | Operación diaria: vuelos, pasajeros, equipaje, escalas, reportes y agente. |
| **PASAJERO** | API y datos propios | Consultar sus vuelos, escalas, equipaje y notificaciones. El panel web lo bloquea por ahora. |

### 2.1 Cuentas locales de demostración

Para el entorno local (no uses estas cuentas en producción):

| Usuario | Contraseña | Rol |
|---|---|---|
| `admin` | `Admin123!` | ADMINISTRADOR |
| `secretario` | `Secretario123!` | SECRETARIO |
| `carlos` | `Pasajero123!` | PASAJERO |
| `sofia` | `Pasajero123!` | PASAJERO |
| `andrea` | `Pasajero123!` | PASAJERO |

En producción las contraseñas de `admin` y `secretario` están rotadas y las
administra el equipo. No están en este documento.

---

## 3. Cómo entrar

### 3.1 En producción

1. Abrir <https://sistema-gestion-de-vuelos.vercel.app>.
2. Escribir el usuario y la contraseña.
3. Pulsar **Entrar**.

La primera visita puede tardar 30–60 segundos si el servicio gratuito de Render
está dormido.

### 3.2 En local

1. Levantar el entorno (ver el manual de administración).
2. Abrir <http://localhost:5173>.
3. Entrar con `admin` / `Admin123!`.

### 3.3 Si la sesión vence

El token dura 8 horas. Al vencer, el sistema pide iniciar sesión de nuevo.

---

## 4. El panel operativo

### 4.1 Indicadores

El panel muestra los indicadores principales del día:

- Vuelos de hoy y vuelos en curso.
- Puertas totales y ocupadas.
- Pasajeros y equipajes.
- Notificaciones y entregas.

La API calcula 15 KPIs; la pantalla muestra los más importantes en tarjetas.

### 4.2 Mapa de puertas

- **25 puertas** A01–A25.
- A01–A05 son nacionales; A06–A25 internacionales.
- A15 está en mantenimiento y A25 inactiva.
- Cada puerta muestra su estado y el vuelo asignado.
- Al seleccionar una puerta se ve el detalle del vuelo.

### 4.3 Vuelos del tablero

Salidas ordenadas por fecha y hora. La tabla se actualiza sin recargar cuando
cambia algo en el sistema. Si la conexión en vivo falla, se refresca cada 30
segundos.

### 4.4 Bandas de equipaje

- **10 bandas** B01–B10.
- B04 está en mantenimiento y B10 inactiva.
- Se muestra el estado y los equipajes de cada banda.

### 4.5 Avisos recientes

Notificaciones generadas automáticamente: puerta, cambio de puerta, banda, cambio
de horario, retraso, cancelación, escala e información general.

### 4.6 Estado de la conexión

- **En vivo:** el panel está conectado en tiempo real.
- **Reconectando:** se perdió la conexión y se está recuperando.
- **Sin conexión:** no hay comunicación con el servidor.

El botón **Actualizar** consulta el panel de nuevo.

---

## 5. Vista de vuelos

- Buscar por código, ciudad o puerta.
- Filtrar por estado.
- Ver ocupación, puerta y horarios.

### 5.1 Estados del vuelo

| Estado | Significado |
|---|---|
| PROGRAMADO | Planificado, aún no inicia el abordaje. |
| ABORDANDO | Embarque activo. |
| ABORDADO | Embarque terminado. |
| EN_VUELO | En tránsito. |
| ATERRIZADO | Llegó a destino. |
| FINALIZADO | Operación cerrada. |
| RETRASADO | Salida pospuesta. |
| CANCELADO | No se realizará; tiene motivo. |

### 5.2 Reglas que debes conocer

- Todo vuelo nace **PROGRAMADO**.
- Una puerta no puede tener dos vuelos con horarios solapados.
- Un cambio de hora o puerta genera historial y notificación.
- Una cancelación exige motivo.
- No se puede reducir la capacidad por debajo de los pasajeros asignados.

---

## 6. Reportería

1. Abrir la pestaña **Reportes**.
2. Elegir uno de los **16 reportes**.
3. Aplicar filtros (fechas, estados, aeropuertos, puertas, bandas, usuarios).
4. Ver la tabla y los totales.
5. Descargar en **Excel** o **PDF**.

Los reportes son de solo lectura y respetan los roles.

---

## 7. Asistente de IA

### 7.1 Qué puedes preguntar

- “¿Qué pasa si mi vuelo se retrasa?”
- “¿Tengo que recoger mi equipaje en una conexión?”
- “¿En qué puerta sale el vuelo GT456?”
- “¿Dónde está mi equipaje?”
- “¿Cuántas puertas y bandas tiene el aeropuerto?”

### 7.2 Cómo interpretar la respuesta

- La respuesta aparece en un globo del chat.
- Debajo se muestran las **fuentes citadas** con `[1]`, `[2]`, etc.
- Si no hay información suficiente, el asistente lo dice.

### 7.3 Privacidad y límites

- Un pasajero solo ve sus propios datos.
- El asistente no revela información de otros pasajeros.
- No modifica datos.
- Hay un límite de 30 consultas por minuto por usuario.
- En producción puede funcionar en modo local (RAG + datos) o con Claude si el
  equipo configura una API key.

---

## 8. Flujo del pasajero y notificaciones

### 8.1 Reserva

Al asignar un pasajero a un vuelo, el sistema envía un aviso con:

- Código del vuelo.
- Fecha y hora de salida.
- Puerta, si ya está asignada.

### 8.2 Cambios

- Cambio de horario: aviso de nuevo horario.
- Cambio de puerta: aviso de nueva puerta.
- Retraso: aviso de retraso.
- Cancelación: aviso con el motivo.

### 8.3 Escalas

Cuando se asigna o cambia la puerta de una conexión, el pasajero recibe la nueva
puerta y la hora de salida de la escala.

### 8.4 Equipaje

- Al colocar el equipaje en una banda, llega el aviso de banda.
- En una conexión el equipaje se transfiere automáticamente: no se retira.
- Las incidencias quedan registradas.

### 8.5 Entrega del correo

En la demostración se usa **Ethereal**, una bandeja de pruebas:

- Los correos se leen en <https://ethereal.email/messages>.
- No llegan a un buzón real.
- Para entrega real se configura Gmail o Mailtrap.

Estados de una entrega: `PENDIENTE`, `ENVIADA`, `SIMULADA`, `FALLIDA`.

---

## 9. Preguntas frecuentes y problemas

### 9.1 La página tarda en cargar

Render duerme el servicio tras ~15 minutos sin tráfico. Espera 30–60 segundos.
Para una demostración, abre la página unos minutos antes.

### 9.2 “Credenciales incorrectas”

La contraseña cambió o hay un error de tecleo. Usa la contraseña vigente.

### 9.3 “No autorizado”

La sesión venció. Vuelve a iniciar sesión.

### 9.4 “No tienes permisos”

La cuenta no tiene el rol necesario. Usa una cuenta ADMINISTRADOR o SECRETARIO.

### 9.5 “No se pudo actualizar el panel”

Puede ser la red o el socket. Pulsa **Actualizar**; el respaldo es cada 30 s.

### 9.6 El asistente no responde

Puede ser el servicio dormido, el límite de consultas o una configuración del
proveedor. Espera un momento y vuelve a intentar.

### 9.7 El correo no llega

Ethereal es una bandeja de pruebas. Revisa <https://ethereal.email/messages>, no
tu correo real.

### 9.8 “Vuelos hoy” aparece en 0

El seed tiene fechas viejas. Reinicia los datos con `npm run db:init` (el seed es
relativo y siempre deja vuelos del día).

---

## 10. Guion de demostración

Duración: 10–15 minutos.

1. **Panel:** mostrar KPIs y el indicador “En vivo”.
2. **Puertas:** señalar una ocupada, su zona y el vuelo.
3. **Vuelos:** buscar un código y filtrar por estado.
4. **Reportes:** abrir uno, filtrar y descargar Excel y PDF.
5. **Asistente:** preguntar por una política y por un código de vuelo; mostrar
   las citas.
6. **Notificaciones:** crear una y mostrar la entrega registrada y la bandeja de
   Ethereal.
7. **Logs:** mostrar `interacciones_agente` y la auditoría.
8. **Power BI:** abrir el tablero con las vistas `bi_*` (cuando esté el `.pbix`).
9. **Cierre:** explicar arquitectura, despliegue y decisiones.

---

## 11. Glosario

| Término | Significado |
|---|---|
| **AICM** | Aeropuerto Internacional de la Ciudad de México. |
| **Puerta** | Punto de embarque. |
| **Banda** | Cinta de entrega de equipaje. |
| **Itinerario** | Viaje de un pasajero. |
| **Escala** | Conexión entre dos vuelos. |
| **Tramo** | Segmento de equipaje en un vuelo. |
| **KPI** | Indicador clave de operación. |
| **RAG** | Búsqueda de documentos para responder con citas. |
| **JWT** | Token de sesión. |
| **SMTP** | Protocolo de correo. |

---

**Siguiente lectura:** [`02-MANUAL_ADMINISTRADOR_PROGRAMADOR.md`](02-MANUAL_ADMINISTRADOR_PROGRAMADOR.md)
para la operación técnica y [`03-PROCEDIMIENTOS_DE_DESARROLLO.md`](03-PROCEDIMIENTOS_DE_DESARROLLO.md)
para el historial y las decisiones.
