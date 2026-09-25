const express = require('express');
const router = express.Router();

const {
  obtenerPasajerosVuelos,
  obtenerPasajeroVueloPorId,
  crearPasajeroVuelo,
  actualizarPasajeroVuelo,
  eliminarPasajeroVuelo,
} = require('../controllers/pasajero_vuelo.controller');

router.get('/', obtenerPasajerosVuelos);

router.get('/:id', obtenerPasajeroVueloPorId);

router.post('/', crearPasajeroVuelo);

router.put('/:id', actualizarPasajeroVuelo);

router.delete('/:id', eliminarPasajeroVuelo);

module.exports = router;
