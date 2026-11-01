# Despliegue en producción — Render + Vercel (plan gratuito)

Guía para publicar el Sistema de Gestión de Vuelos del AICM sin costo mensual.
El enunciado del curso dice que **los sistemas no desplegados no serán revisados**,
así que este paso es obligatorio, no opcional.

## 1. Arquitectura del despliegue

```text
Navegador
   │
   ├──▶ Frontend React/Vite (Vercel, gratis)
   │         │  VITE_API_URL
   │         ▼
   └──▶ API Node + Socket.IO + worker (Render, un solo servicio web gratis)
             │                    │
             │                    └──▶ CloudAMQP (RabbitMQ, gratis)
             │                              │
             └──▶ Neon PostgreSQL (gratis)  └──▶ SMTP (Ethereal/Mailtrap/Gmail)
```

| Componente | Servicio | Plan | Notas |
|---|---|---|---|
| Base de datos | **Neon** | Free | Ya está creada; se reutiliza. |
| Mensajería | **CloudAMQP** | Little Lemur (free) | Broker administrado con AMQP. |
| API + worker | **Render** | Web Service free | Un solo servicio ejecuta ambos procesos. |
| Frontend | **Vercel** | Hobby (free) | Build estático de Vite. |
| Correo | **Ethereal** (pruebas) o Gmail/Mailtrap | Free | Ethereal no entrega a buzones reales, pero demuestra el envío SMTP. |

> **Por qué la API y el worker van juntos:** el plan gratuito de Render no incluye
> *Background Workers*. `scripts/iniciar-produccion.js` arranca la API y el worker
> dentro del mismo servicio y reinicia el worker si se cae. Es la única forma de
> mantener el flujo asíncrono sin pagar (~$7/mes por el worker separado).

## 2. Archivos que hacen posible el despliegue

| Archivo | Función |
|---|---|
| `render.yaml` | Blueprint de Render: servicio, comandos, salud y variables. |
| `scripts/iniciar-produccion.js` | Supervisor API + worker para el plan gratuito. |
| `scripts/cambiar-password.js` | Cambia contraseñas del seed antes de publicar. |
| `frontend/vercel.json` | Build de Vite y reescritura SPA en Vercel. |
| `.env.example` | Referencia de todas las variables; nunca se sube `.env`. |

## 3. Orden del despliegue

### Paso 1 — Neon (base de datos)

1. Entra a <https://console.neon.tech> y abre el proyecto existente.
2. En **Connect** copia dos cadenas:
   - **Pooled connection** (con `-pooler` en el host): es la que usará Render.
   - **Direct connection** (sin `-pooler`): úsala solo para crear el esquema.
3. La cadena debe terminar en `?sslmode=require`.

### Paso 2 — CloudAMQP (RabbitMQ)

1. Crea una cuenta en <https://www.cloudamqp.com>.
2. Crea una instancia con el plan gratuito **Little Lemur**.
3. Abre la instancia → pestaña **Details** → copia la **AMQP URL**.
   Empieza con `amqps://` y debe incluir usuario, contraseña, host y *vhost*.

> El plan gratuito limita mensajes y conexiones. Para la demo es suficiente,
> pero no publiques cargas masivas ni dejes consumidores duplicados.

### Paso 3 — SMTP para los correos

**Opción recomendada para la defensa (Ethereal):**

1. Entra a <https://ethereal.email> y pulsa **Create Ethereal account**.
2. Copia `host`, `port` (587), `user` y `pass` que muestra la página.
3. Los correos enviados se leen en <https://ethereal.email/messages>.
   No llegan a un buzón real, pero prueban el envío SMTP de punta a punta.

**Opción con entrega real (Gmail):**

- Activa la verificación en dos pasos y crea una **contraseña de aplicación**.
- `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, `SMTP_SECURE=false`,
  `SMTP_USER=tu-correo@gmail.com`, `SMTP_PASS=<contraseña de aplicación>`,
  `SMTP_FROM=tu-correo@gmail.com`.

### Paso 4 — Render (API + worker)

1. Sube la rama del despliegue al repositorio.
2. En <https://render.com> crea una cuenta y conecta GitHub.
3. **New + → Blueprint** → selecciona el repositorio
   `Demybrictany/Sistema-gestion-de-vuelos`.
4. Elige la rama:
   - para la primera prueba, `feature/v1.5.1-despliegue`;
   - después del merge, `main`.
5. Render lee `render.yaml` y pide las variables marcadas con `sync: false`:

   | Variable | Valor |
   |---|---|
   | `DATABASE_URL` | Cadena **pooled** de Neon |
   | `CORS_ORIGIN` | `*` en la primera prueba; luego la URL de Vercel |
   | `RABBITMQ_URL` | AMQP URL de CloudAMQP |
   | `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | Credenciales de Ethereal (pueden quedar vacías al inicio) |

   `JWT_SECRET` lo genera Render automáticamente.
6. Aplica el blueprint y espera el primer build (`npm ci` + arranque).
7. Copia la URL pública, por ejemplo
   `https://sistema-vuelos-api.onrender.com`.
8. Abre `https://<api>/health`. Debe responder:

   ```json
   {"estado":"ok","base_datos":"ok","mensajeria":"ok","cola":"notificaciones.pasajeros"}
   ```

   Si `mensajeria` dice `configurada` pero no `ok`, la URL de CloudAMQP no conectó.

### Paso 5 — Vercel (frontend)

1. En <https://vercel.com> → **Add New → Project** → importa el repositorio.
2. Configura:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. En **Environment Variables** agrega:

   | Variable | Valor |
   |---|---|
   | `VITE_API_URL` | URL de Render, sin barra final |

   `VITE_API_URL` se incrusta en el build: si la cambias, vuelve a desplegar.
4. Despliega y copia el dominio, por ejemplo `https://aicm-panel.vercel.app`.

### Paso 6 — Restringir CORS

1. Vuelve a Render → servicio → **Environment**.
2. Cambia `CORS_ORIGIN` de `*` al dominio de Vercel
   (`https://aicm-panel.vercel.app`). Puedes poner varios separados por coma.
3. Guarda; Render redepliega solo.
4. Recarga el frontend y confirma que el panel y Socket.IO siguen conectando.

### Paso 7 — Cargar datos y cambiar contraseñas

> **Advertencia:** `npm run db:init` **borra y recrea** todas las tablas.
> Úsalo solo contra la base de demostración, nunca contra datos que debas conservar.

Desde la raíz del proyecto, en PowerShell:

```powershell
$env:DATABASE_URL="postgresql://...cadena-directa-de-neon..."
$env:DB_SSL="true"

npm run db:init        # esquema + seed + vistas BI
npm run db:password -- admin "UnaClaveAdmin2026!"
npm run db:password -- secretario "UnaClaveSecretario2026!"

Remove-Item Env:DATABASE_URL
Remove-Item Env:DB_SSL
```

Las variables de entorno de la sesión tienen prioridad sobre `.env`, así que no
hace falta editar el archivo. Si la cadena *pooled* falla al crear el esquema,
usa la **directa** solo para este paso.

### Paso 8 — Verificación de punta a punta

1. **Salud:** `GET https://<api>/health` → `estado`, `base_datos` y `mensajeria` en `ok`.
2. **Login:** abre el frontend con el usuario `admin` y la contraseña nueva.
3. **Panel:** deben aparecer 25 puertas, 10 bandas y los KPIs.
4. **Reportes:** abre un reporte y descarga Excel y PDF.
5. **Mensajería real:** con la API de producción como destino:

   ```powershell
   $env:API_URL="https://sistema-vuelos-api.onrender.com"
   $env:ADMIN_USUARIO="admin"
   $env:ADMIN_PASSWORD="UnaClaveAdmin2026!"
   npm run test:rabbitmq
   ```

   Debe terminar en **10 PASS, 0 FAIL**. El script crea una notificación, espera
   la entrega del worker y la elimina al final.
6. **Correo:** si `CORREO_MODO=smtp`, abre el buzón de Ethereal y confirma el
   mensaje; en la base debe existir una fila en `entregas_notificacion` con
   estado `ENVIADA`.
7. **Reportes y panel contra producción (solo lectura):**

   ```powershell
   npm run test:panel
   npm run test:reportes
   ```

   No ejecutes `npm run test:api` contra producción: crea y modifica datos.

### Paso 9 — Activar correo real

`render.yaml` arranca con `CORREO_MODO=simulado` para que el primer despliegue
no dependa del SMTP. Cuando las credenciales funcionen:

1. Render → Environment → `CORREO_MODO` = `smtp`.
2. Guarda y espera el redepliegue.
3. Repite la verificación del paso 8.

## 4. Operación del plan gratuito

- **Render duerme el servicio** tras ~15 minutos sin tráfico. La primera visita
  puede tardar 30–60 s y, mientras duerme, el worker tampoco consume la cola.
- Para la defensa, abre el panel unos minutos antes. Opcional: un monitor gratuito
  (por ejemplo UptimeRobot) que consulte `/health` cada 5–10 minutos mantiene el
  servicio despierto; un solo servicio 24/7 cabe en las horas gratuitas de Render.
- **Neon** suspende la base tras unos minutos de inactividad; la primera consulta
  la despierta (puede tardar un par de segundos).
- **Vercel** sirve el frontend estático sin suspensión.
- Los mensajes que lleguen mientras el servicio duerme quedan en CloudAMQP y se
  procesan al despertar. No se pierden.
- Los registros de la API y del worker aparecen en el mismo **Logs** de Render;
  las líneas del worker empiezan con `[worker]`.

## 5. Seguridad mínima antes de publicar

- [ ] `JWT_SECRET` generado por Render (no reutilizar el de desarrollo).
- [ ] Contraseñas del seed cambiadas (`admin`, `secretario`).
- [ ] `CORS_ORIGIN` limitado al dominio de Vercel, no `*`.
- [ ] `.env` fuera del repositorio (ya está en `.gitignore`).
- [ ] Credenciales solo en los paneles de Render/Vercel/Neon/CloudAMQP.
- [ ] HTTPS: lo dan Render y Vercel automáticamente.

## 6. Problemas comunes

| Síntoma | Causa probable | Solución |
|---|---|---|
| `/health` responde 503 | `DATABASE_URL` incorrecta o `DB_SSL` distinto de `true` | Revisa la cadena pooled de Neon y `DB_SSL=true`. |
| `mensajeria: "configurada"` y no `"ok"` | CloudAMQP rechazó la conexión | Verifica la AMQP URL, el *vhost* y el límite de conexiones. |
| El frontend muestra error de red o CORS | `VITE_API_URL` vacía o `CORS_ORIGIN` sin el dominio de Vercel | Corrige la variable y redespliega el frontend. |
| El login falla después del seed | Contraseña cambiada | Usa la nueva o define `ADMIN_PASSWORD` en las pruebas. |
| El worker no registra entregas | Servicio dormido, `RABBITMQ_URL` vacía o `CORREO_MODO=smtp` sin credenciales | Revisa los logs `[worker]` y la configuración de correo. |
| El correo queda `SIMULADA` | `CORREO_MODO=simulado` | Cambia a `smtp` cuando el servidor esté configurado. |
| Build de Render falla en `npm ci` | `package-lock.json` desincronizado | Ejecuta `npm install` en local y sube el lockfile. |
| El panel carga lento la primera vez | Servicio dormido | Espera el arranque o usa un monitor de disponibilidad. |

## 7. Checklist de aceptación

- [ ] `/health` público en `ok` con base y mensajería conectadas.
- [ ] Frontend en Vercel con login funcional y panel en tiempo real.
- [ ] 25 puertas, KPIs y reportes con datos del seed.
- [ ] Descarga de un reporte en Excel y en PDF.
- [ ] `npm run test:rabbitmq` contra producción → 10 PASS, 0 FAIL.
- [ ] Entrega registrada en `entregas_notificacion`.
- [ ] Correo visible en Ethereal (o entregado por Gmail).
- [ ] Contraseñas del seed cambiadas y CORS restringido.
- [ ] URLs pública anotadas en el README y en la bitácora.
