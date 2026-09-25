const express = require('express');
const cors = require('cors');
require('dotenv').config();

const sequelize = require('./db/database');
const rolRoutes = require('./routes/rol.routes');
const usuarioRoutes = require('./routes/usuario.routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/roles', rolRoutes);
app.use('/api/usuarios', usuarioRoutes);

app.get('/', (req, res) => {
  return res.json({
    mensaje: 'API del Sistema de Vuelos funcionando correctamente',
  });
});

const iniciarServidor = async () => {
  try {
    await sequelize.authenticate();
    console.log('Conexion con MySQL establecida correctamente.');

    app.listen(PORT, () => {
      console.log(`Servidor ejecutandose en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Error al conectar con MySQL:', error.message);
  }
};

iniciarServidor();
