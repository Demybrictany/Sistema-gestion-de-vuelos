const express = require('express');
const cors = require('cors');
require('dotenv').config();

const sequelize = require('./db/database');

// Registra las asociaciones y los hooks de auditoría automática.
require('./models');

const { verificarToken, permitirRoles } = require('./middlewares/auth.middleware');
const contextoMiddleware = require('./middlewares/contexto.middleware');
const manejarErrores = require('./middlewares/error.middleware');

// ==============================
// RUTAS
// ==============================
const authRoutes = require('./routes/auth.routes');
const rolRoutes = require('./routes/rol.routes');
const usuarioRoutes = require('./routes/usuario.routes');
const pasajeroRoutes = require('./routes/pasajero.routes');
const aeropuertoRoutes = require('./routes/aeropuerto.routes');
const puertaRoutes = require('./routes/puerta.routes');
const bandaEquipajeRoutes = require('./routes/banda_equipaje.routes');
const vueloRoutes = require('./routes/vuelo.routes');
const itinerarioRoutes = require('./routes/itinerario.routes');
const pasajeroVueloRoutes = require('./routes/pasajero_vuelo.routes');
const escalaRoutes = require('./routes/escala.routes');
const equipajeRoutes = require('./routes/equipaje.routes');
const equipajeVueloRoutes = require('./routes/equipaje_vuelo.routes');
const notificacionRoutes = require('./routes/notificacion.routes');
const historialVueloRoutes = require('./routes/historial_vuelo.routes');
const historialEquipajeRoutes = require('./routes/historial_equipaje.routes');
const auditoriaRoutes = require('./routes/auditoria.routes');
const reportesRoutes = require('./routes/reportes.routes');

const app = express();

const PORT = process.env.PORT || 3000;

app.disable('x-powered-by');

// ==============================
// MIDDLEWARES
// ==============================
app.set('trust proxy', 1);
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// ==============================
// ENDPOINTS PÚBLICOS
// ==============================
app.get('/', (req, res) => {
  res.json({
    mensaje: 'API del Sistema de Vuelos funcionando correctamente',
    version: '1.2.0',
  });
});

// Verificación de salud para el despliegue (comprueba también la base).
app.get('/health', async (req, res) => {
  try {
    await sequelize.query('SELECT 1');
    res.status(200).json({ estado: 'ok', base_datos: 'ok' });
  } catch (error) {
    res.status(503).json({ estado: 'error', base_datos: 'no disponible' });
  }
});

app.use('/api/auth', authRoutes);

// A partir de aquí todas las rutas requieren JWT.
app.use('/api', verificarToken, contextoMiddleware);

const soloAdmin = permitirRoles('ADMINISTRADOR');
const staff = permitirRoles('ADMINISTRADOR', 'SECRETARIO');

app.use('/api/roles', soloAdmin, rolRoutes);
app.use('/api/usuarios', soloAdmin, usuarioRoutes);
app.use('/api/pasajeros', staff, pasajeroRoutes);
app.use('/api/aeropuertos', staff, aeropuertoRoutes);
app.use('/api/puertas', staff, puertaRoutes);
app.use('/api/bandas-equipaje', staff, bandaEquipajeRoutes);

// Vuelos, equipajes y notificaciones aplican permisos por método
// dentro de sus propios routers.
app.use('/api/vuelos', vueloRoutes);
app.use('/api/itinerarios', staff, itinerarioRoutes);
app.use('/api/pasajero-vuelo', staff, pasajeroVueloRoutes);
app.use('/api/escalas', staff, escalaRoutes);
app.use('/api/equipajes', equipajeRoutes);
app.use('/api/equipaje-vuelo', staff, equipajeVueloRoutes);
app.use('/api/notificaciones', notificacionRoutes);
app.use('/api/historial-vuelo', staff, historialVueloRoutes);
app.use('/api/historial-equipaje', staff, historialEquipajeRoutes);
app.use('/api/auditoria', soloAdmin, auditoriaRoutes);
app.use('/api/reportes', staff, reportesRoutes);

// ==============================
// 404 Y MANEJO CENTRAL DE ERRORES
// ==============================
app.use((req, res) => {
  res.status(404).json({
    mensaje: 'Ruta no encontrada',
  });
});

app.use(manejarErrores);

// ==============================
// INICIAR SERVIDOR
// ==============================
const iniciarServidor = async () => {
  try {
    await sequelize.authenticate();

    console.log('Conexión con PostgreSQL establecida correctamente.');

    app.listen(PORT, () => {
      console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error(
      'Error al conectar con PostgreSQL:',
      error.message
    );
    // Sin base de datos el proceso no debe quedarse vivo sin escuchar.
    process.exit(1);
  }
};

iniciarServidor();
