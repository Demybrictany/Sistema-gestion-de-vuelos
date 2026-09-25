const express = require('express');
const router = express.Router();

const {
  obtenerVuelos,
  obtenerVueloPorId,
  crearVuelo,
  actualizarVuelo,
  eliminarVuelo,
} = require('../controllers/vuelo.controller');

// Obtener todos los vuelos
router.get('/', obtenerVuelos);

// Obtener vuelo por ID
router.get('/:id', obtenerVueloPorId);

// Crear vuelo
router.post('/', crearVuelo);

// Actualizar vuelo
router.put('/:id', actualizarVuelo);

// Eliminar vuelo
router.delete('/:id', eliminarVuelo);

module.exports = router;
