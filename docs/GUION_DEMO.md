# Guion de demo y pruebas — Sistema de Gestión de Vuelos AICM

**Versión:** `v1.6.2`  
**Fecha:** 2026-11-02  
**Duración objetivo:** 12–15 minutos de demo + 10 minutos de pruebas  
**Integrantes:** Integrante 1 · Integrante 2

---

## 0. Antes de empezar

### URLs

- Frontend: https://sistema-gestion-de-vuelos.vercel.app
- API: https://sistema-vuelos-api.onrender.com
- Salud: https://sistema-vuelos-api.onrender.com/health

### Ventanas que conviene tener abiertas

1. Frontend con la sesión del administrador.
2. Frontend en una ventana de incógnito con otro usuario (para demostrar tiempo real).
3. Render → servicio → **Logs** (para ver `[worker]`).
4. CloudAMQP → **RabbitMQ Manager** (conexiones y consumidores).
5. Carpeta local para capturas: `docs/evidencias/` (créala si no existe).

### Credenciales

Usa las contraseñas vigentes de administrador, secretario y pasajero. No las escribas en el chat ni en el repositorio. Si hace falta reiniciarlas:

```bash
npm run db:password -- admin "NuevaClave"
```

### Token para las pruebas por API

En PowerShell, define la contraseña solo en tu sesión local:

```powershell
$API = "https://sistema-vuelos-api.onrender.com"
$body = @{ nombre_usuario = "admin"; password = $env:ADMIN_PASSWORD } | ConvertTo-Json
$login = Invoke-RestMethod -Method Post -Uri "$API/api/auth/login" `
  -ContentType "application/json" -Body $body
$headers = @{ Authorization = "Bearer $($login.token)" }
```

> El campo del login es `nombre_usuario`, no `usuario`.

Para obtener IDs de prueba:

```powershell
$vuelos = Invoke-RestMethod "$API/api/vuelos" -Headers $headers
$puertas = Invoke-RestMethod "$API/api/puertas" -Headers $headers
$pasajeros = Invoke-RestMethod "$API/api/pasajeros" -Headers $headers

$vuelos | Select-Object -First 5 id_vuelo, codigo_vuelo, estado, id_puerta
$puertas | Select-Object -First 5 id_puerta, numero, zona
$pasajeros | Select-Object -First 5 id_pasajero, nombre, apellido
```

Guarda los IDs que uses:

```powershell
$idVuelo = 1
$idPuerta = 2
$idPasajero = 1
```

> Las pruebas que escriben datos pueden alterar la demo. Usa un vuelo/pasajero de prueba y revierte el cambio, o hazlas en local con Docker.

---

## 1. Guion de demo (12 minutos)

### 1.1 Despliegue y salud — 30 s

```powershell
Invoke-RestMethod "$API/"
Invoke-RestMethod "$API/health"
```

**Decir:** “La API está en Render, la base en Neon y el frontend en Vercel. La versión desplegada es 1.6.2 y `/health` confirma la conexión con PostgreSQL.”

**Evidencia:** captura de `version: 1.6.2` y `base_datos: ok`.

### 1.2 Login y roles — 1 min

1. Entra como **administrador** → panel.
2. Entra como **secretario** → panel.
3. Entra como **pasajero** → mensaje de que la cuenta no opera el panel.

**Decir:** “El panel es solo para ADMINISTRADOR y SECRETARIO; el pasajero tiene su propia vista y el agente filtra sus datos en SQL.”

### 1.3 Panel y Socket.IO — 2 min

1. Abre el panel en dos ventanas con el administrador.
2. Muestra KPIs, las 25 puertas y el indicador de conexión.
3. Cambia la puerta de un vuelo por API:

```powershell
Invoke-RestMethod -Method Patch "$API/api/vuelos/$idVuelo/puerta" `
  -Headers $headers -ContentType "application/json" `
  -Body (@{ id_puerta = $idPuerta; motivo = "Demostración en vivo" } | ConvertTo-Json)
```

4. **Esperado:** ambas ventanas se actualizan sin recargar; se crea una notificación de cambio de puerta.

**Decir:** “Los hooks emiten `panel:actualizar` después del commit, así que el panel nunca muestra datos de una transacción que aún no terminó.”

**Evidencia:** video o captura de las dos ventanas + log.

### 1.4 RabbitMQ y entrega — 1 min

1. En Render → Logs, busca:

```text
[worker] Escuchando la cola notificaciones.pasajeros.
[worker] Notificación ... SIMULADA
```

2. Consulta la traza:

```powershell
Invoke-RestMethod "$API/api/notificaciones/entregas" -Headers $headers
Invoke-RestMethod "$API/api/notificaciones/entregas/resumen" -Headers $headers
```

**Decir:** “La notificación se guarda en PostgreSQL y el evento `notificacion.creada` se publica después del commit. El worker consume, entrega por correo y registra el intento en `entregas_notificacion`. Si `CORREO_MODO=simulado`, la entrega queda como `SIMULADA`; con SMTP queda `ENVIADA`.”

**Evidencia:** log del worker + JSON de entregas.

### 1.5 Agente y RAG — 3 min

```powershell
Invoke-RestMethod -Method Post "$API/api/agente/consultas" -Headers $headers `
  -ContentType "application/json" `
  -Body (@{ pregunta = "¿Qué vuelos salen hoy?" } | ConvertTo-Json)
```

Repite con:

1. `"¿Cuál es la política de equipaje de mano?"` → respuesta con cita `[1]`.
2. `"¿Qué equipaje tiene otro pasajero?"` con un token de pasajero → debe negarse o filtrar.

Luego muestra el log:

```powershell
Invoke-RestMethod "$API/api/agente/interacciones" -Headers $headers
```

**Decir:** “El agente usa herramientas con alcance por rol; el filtro por pasajero está en la consulta SQL, no en el prompt. Cada consulta queda en `interacciones_agente` con pregunta, respuesta, fuentes, modelo, tokens y latencia.”

**Si el modelo es `local`:** “En producción está el modo local determinista: RAG + reglas. Claude se activa con `AGENTE_PROVEEDOR=claude` y una API key.” No lo presentes como un LLM generativo si no lo está.

### 1.6 Reportes — 2 min

1. `GET /api/reportes` → 16 reportes.
2. Abre uno en la UI, aplica filtros y descarga Excel y PDF.
3. Por API:

```powershell
Invoke-RestMethod "$API/api/reportes" -Headers $headers

Invoke-WebRequest "$API/api/reportes/vuelos-por-estado/exportar?formato=excel" `
  -Headers $headers -OutFile reporte.xlsx

Invoke-WebRequest "$API/api/reportes/vuelos-por-estado/exportar?formato=pdf" `
  -Headers $headers -OutFile reporte.pdf
```

**Decir:** “Son 16 reportes con filtros y agregaciones; las 11 vistas `bi_*` son la puerta para Power BI.”

**Evidencia:** archivos descargados.

### 1.7 Auditoría — 1 min

```powershell
Invoke-RestMethod "$API/api/auditoria" -Headers $headers
```

**Decir:** “Cada operación relevante queda en `auditoria`, y los cambios de vuelo y equipaje también en sus historiales.”

**Evidencia:** filas de las acciones que acabas de hacer.

### 1.8 Power BI — 1 min

- Muestra las 11 vistas (`bi_vuelos`, `bi_kpis_diarios`, etc.).
- Sé honesto: “El `.pbix` es el entregable que falta; las vistas y la guía de conexión ya están.”

---

## 2. Pruebas por criterio

### 2.1 Sistema base y reglas de negocio

| Prueba | Cómo | Esperado |
|---|---|---|
| Puerta solapada | Crear dos vuelos con la misma puerta y horarios solapados | 409/400; la restricción `EXCLUDE` también lo impide en la base |
| Asiento duplicado | `POST /api/pasajero-vuelo` dos veces con el mismo `numero_asiento` en el mismo vuelo | 409 |
| Escala mismo aeropuerto | `POST /api/escalas` con `aeropuerto_llegada = aeropuerto_salida` | 201 |
| Equipaje `EN_BANDA` → `EN_TRANSITO` | `PATCH /api/equipajes/{id}/estado` con `{ "estado": "EN_TRANSITO" }` | 400 |
| Itinerario inválido | `PUT /api/itinerarios/{id}` con origen = destino o fechas invertidas | 400 |

Ejemplo de asiento duplicado:

```powershell
$asignacion = @{
  id_pasajero = $idPasajero
  id_vuelo = $idVuelo
  numero_asiento = "12A"
} | ConvertTo-Json

Invoke-RestMethod -Method Post "$API/api/pasajero-vuelo" -Headers $headers `
  -ContentType "application/json" -Body $asignacion
```

Repite con otro pasajero y el mismo asiento → debe fallar con 409.

### 2.2 Agente y permisos

- Pregunta de vuelos: responde con datos reales.
- Pregunta de políticas: responde con cita.
- Pasajero preguntando por otro pasajero: se niega o filtra.
- `GET /api/agente/interacciones` como admin: aparece el registro.
- `GET /api/auditoria` con token de pasajero: 403.

### 2.3 RabbitMQ

- Cambio de puerta o asignación de pasajero → log `[worker]`.
- `GET /api/notificaciones/entregas` → fila con `estado`, `intento`, `destinatario`.
- `GET /api/notificaciones/entregas/resumen` → conteos por estado.
- Opcional: si hay un fallo de SMTP, revisa `notificaciones.fallidos` en CloudAMQP.

### 2.4 Reportes y Power BI

- `GET /api/reportes` → 16.
- Exportar Excel y PDF de al menos dos reportes.
- Mostrar las 11 vistas BI.
- Si ya existe el `.pbix`, abrirlo y actualizar los datos.

### 2.5 Seguridad

- Token inválido → 401.
- Pasajero en endpoint de staff → 403.
- CORS desde el dominio de Vercel → permitido.
- Contraseñas del seed rotadas en producción.

---

## 3. Evidencias que conviene capturar

- [ ] `GET /` con `version: "1.6.2"`.
- [ ] `GET /health` con `base_datos: "ok"`.
- [ ] Panel con KPIs y 25 puertas.
- [ ] Dos ventanas actualizándose tras el cambio de puerta.
- [ ] Log de Render con `[worker] Escuchando...` y `[worker] Notificación...`.
- [ ] JSON de `entregas_notificacion`.
- [ ] Respuesta del agente con cita.
- [ ] JSON de `interacciones_agente`.
- [ ] Reporte Excel y PDF descargados.
- [ ] JSON de `auditoria`.
- [ ] Captura del tag `v1.6.2` y del PR #17 fusionado.
- [ ] Captura de las 11 vistas BI y del `.pbix` (cuando exista).

---

## 4. Preguntas probables del jurado

**¿Por qué PostgreSQL y no MySQL?**
> Porque necesitábamos ENUMs, restricciones de exclusión para evitar puertas solapadas, transacciones con bloqueo y pgvector opcional para el RAG. La migración quedó documentada en el PR #3.

**¿Cómo evitan que un pasajero vea datos de otro?**
> El filtro está en la consulta SQL de las herramientas del agente (`services/agente.tools.js`), no en el prompt. El rol del token determina qué filas puede leer.

**¿El agente es un LLM?**
> El código soporta Claude con tool use. En producción, si `AGENTE_PROVEEDOR=local`, responde con RAG y reglas deterministas; no es un modelo generativo. Para la demo podemos activar Claude o explicar el modo local con claridad.

**¿Qué pasa si RabbitMQ está caído?**
> La notificación queda en PostgreSQL; el evento no se encola en ese instante. El worker tiene reintentos y cola de fallidos. No usamos patrón outbox, y lo reconocemos como limitación.

**¿Qué falta?**
> El `.pbix` de Power BI, el commit de los manuales y el ensayo de la defensa. También hay dos mejoras opcionales: el reclamo de entrega para evitar doble envío y el índice único de asiento en la base.

**¿Cómo usaron Claude Code?**
> Con `CLAUDE.md` y `AGENTS.md`, ramas por versión, PRs revisados y una bitácora append-only. Los commits los hicimos nosotros.

---

## 5. Problemas comunes

| Síntoma | Causa | Solución |
|---|---|---|
| 401 | Token ausente, vencido o `JWT_SECRET` distinto | Vuelve a iniciar sesión; revisa `JWT_SECRET` en Render. |
| 403 | Rol sin permiso | Usa administrador/secretario para staff. |
| 409 | Regla de negocio: puerta, asiento o cupo | Es el comportamiento esperado; muestra el mensaje. |
| 502 / timeout | Render free se durmió | Espera el arranque y reintenta. |
| No aparece el worker | Start Command distinto de `npm run start:prod` | Cámbialo en Render y redespliega. |
| `mensajeria: "configurada"` | El publicador de la API aún no abrió canal | No es error; revisa el log del worker. |
| El chat falla | API vieja o `VITE_API_URL` incorrecta | Verifica `GET /` = 1.6.2 y la URL del bundle. |
| No aparece `main` en Render | Caché del selector de ramas | Escribe `main` manualmente o refresca. |

---

## 6. Checklist final

- [ ] Render en `main` (o rama con árbol idéntico) y deploy live.
- [ ] `GET /` = `1.6.2`.
- [ ] `/health` con `base_datos: "ok"`.
- [ ] Log con worker de RabbitMQ.
- [ ] Login con los tres roles.
- [ ] Panel en dos ventanas.
- [ ] Cambio de puerta + notificación + entrega.
- [ ] Agente: vuelo, política con cita y datos ajenos.
- [ ] Reporte Excel y PDF.
- [ ] Auditoría e interacciones del agente.
- [ ] Capturas guardadas.
- [ ] `.pbix` y `manual/` pendientes identificados.
- [ ] Documento de división actualizado (`docs/DIVISION_RESPONSABILIDADES.md`).
