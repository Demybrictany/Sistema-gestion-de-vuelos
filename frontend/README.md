# AICM · Panel operativo (frontend)

Interfaz web del Sistema de Gestión de Vuelos del Aeropuerto Internacional de la
Ciudad de México. Consume la API REST y el canal Socket.IO del backend.

**Versión:** `1.4.0`

## Vistas

| Vista | Contenido |
|---|---|
| Acceso | Inicio de sesión con JWT. Solo ADMINISTRADOR y SECRETARIO entran al panel. |
| Panel | KPIs del aeropuerto, mapa de 25 puertas por zona, avisos recientes, vuelos y bandas de equipaje. |
| Vuelos | Tabla completa con búsqueda por código, ciudad o puerta y filtro por estado. |
| Reportes | Catálogo de 16 reportes, filtros dinámicos, totales y descarga en Excel/PDF. |

El tablero se actualiza sin recargar: el backend emite `panel:actualizar` por
Socket.IO y el cliente vuelve a consultar `GET /api/panel`. Si el socket se cae,
hay un refresco de respaldo cada 30 segundos.

## Requisitos

- Node.js 18 o superior.
- Backend del proyecto en ejecución (por defecto `http://localhost:3000`).

## Desarrollo

```bash
# 1. Backend, en la raíz del repositorio
npm install
npm start

# 2. Frontend, en otra terminal
cd frontend
npm install
npm run dev
```

Abre `http://localhost:5173`. Vite hace proxy de `/api` y `/socket.io` hacia el
backend, así que no hace falta configurar CORS en desarrollo.

### Cuentas de demostración

| Usuario | Contraseña | Rol |
|---|---|---|
| `admin` | `Admin123!` | ADMINISTRADOR |
| `secretario` | `Secretario123!` | SECRETARIO |
| `carlos` | `Pasajero123!` | PASAJERO (sin acceso al panel) |

## Configuración

Copia `.env.example` como `.env` solo si el backend está en otra URL:

```env
# Vacío en desarrollo: usa el proxy de Vite.
VITE_API_URL=https://api.mi-dominio.com
```

Para producción, el backend debe permitir el origen del frontend:

```env
CORS_ORIGIN=https://panel.mi-dominio.com
```

## Compilar

```bash
npm run build
npm run preview
```

El resultado queda en `frontend/dist/`. Se puede servir con Nginx, Vercel,
Netlify o cualquier hosting estático.

## Estructura

```
frontend/
├── index.html
├── vite.config.js           # Proxy /api y /socket.io
├── src/
│   ├── main.jsx
│   ├── App.jsx              # Sesión, navegación y vistas
│   ├── api.js               # Cliente HTTP, descargas y formato
│   ├── auth.jsx             # Contexto de autenticación con JWT
│   ├── estados.js           # Catálogos de estados y etiquetas
│   ├── styles.css           # Paleta, componentes, modo oscuro y responsive
│   ├── hooks/
│   │   ├── usePanel.js      # Carga y refresco del panel
│   │   └── useSocket.js     # Conexión Socket.IO autenticada
│   └── components/
│       ├── Login.jsx
│       ├── KpiGrid.jsx
│       ├── GateMap.jsx
│       ├── FlightsTable.jsx
│       ├── BeltsPanel.jsx
│       ├── NotificationsFeed.jsx
│       ├── Reports.jsx
│       └── StatusBadge.jsx
└── .env.example
```

## Accesibilidad

- Los estados nunca se comunican solo por color: cada insignia lleva icono y
  etiqueta.
- Tablas con encabezados, `caption` para lectores de pantalla y cifras
  tabulares alineadas.
- Modo claro y oscuro según la preferencia del sistema.
- Navegación por teclado con anillo de foco visible y `aria-pressed` en las
  puertas seleccionables.
