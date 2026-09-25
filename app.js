const express = require('express');
const cors = require('cors');
require('dotenv').config();

const sequelize = require('./db/database');

// ==============================
// RUTAS
// ==============================
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

const app = express();

const PORT = process.env.PORT || 3000;

// ==============================
// MIDDLEWARES
// ==============================
app.use(cors());
app.use(express.json());

// ==============================
// ENDPOINTS
// ==============================
app.use('/api/roles', rolRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/pasajeros', pasajeroRoutes);
app.use('/api/aeropuertos', aeropuertoRoutes);
app.use('/api/puertas', puertaRoutes);
app.use('/api/bandas-equipaje', bandaEquipajeRoutes);
app.use('/api/vuelos', vueloRoutes);
app.use('/api/itinerarios', itinerarioRoutes);
app.use('/api/pasajero-vuelo', pasajeroVueloRoutes);
app.use('/api/escalas', escalaRoutes);
app.use('/api/equipajes', equipajeRoutes);
app.use('/api/equipaje-vuelo', equipajeVueloRoutes);
app.use('/api/notificaciones', notificacionRoutes);
app.use('/api/historial-vuelo', historialVueloRoutes);
app.use('/api/historial-equipaje', historialEquipajeRoutes);
app.use('/api/auditoria', auditoriaRoutes);

// ==============================
// RUTA PRINCIPAL
// ==============================
app.get('/', (req, res) => {
  res.json({
    mensaje: 'API del Sistema de Vuelos funcionando correctamente',
  });
});

// ==============================
// INICIAR SERVIDOR
// ==============================
const iniciarServidor = async () => {
  try {
    await sequelize.authenticate();

    console.log('Conexión con MySQL establecida correctamente.');

    app.listen(PORT, () => {
      console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error(
      'Error al conectar con MySQL:',
      error.message
    );
  }
};

iniciarServidor();