const express = require('express');
const router = express.Router();

const {
  obtenerAeropuertos,
  obtenerAeropuertoPorId,
  crearAeropuerto,
  actualizarAeropuerto,
  eliminarAeropuerto,
} = require('../controllers/aeropuerto.controller');

// Obtener todos los aeropuertos
router.get('/', obtenerAeropuertos);

// Obtener aeropuerto por ID
router.get('/:id', obtenerAeropuertoPorId);

// Crear aeropuerto
router.post('/', crearAeropuerto);

// Actualizar aeropuerto
router.put('/:id', actualizarAeropuerto);

// Eliminar aeropuerto
router.delete('/:id', eliminarAeropuerto);

module.exports = router;