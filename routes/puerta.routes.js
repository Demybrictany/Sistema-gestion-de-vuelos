const express = require('express');
const router = express.Router();

const {
  obtenerPuertas,
  obtenerPuertaPorId,
  crearPuerta,
  actualizarPuerta,
  eliminarPuerta,
} = require('../controllers/puerta.controller');

// Obtener todas las puertas
router.get('/', obtenerPuertas);

// Obtener puerta por ID
router.get('/:id', obtenerPuertaPorId);

// Crear puerta
router.post('/', crearPuerta);

// Actualizar puerta
router.put('/:id', actualizarPuerta);

// Eliminar puerta
router.delete('/:id', eliminarPuerta);

module.exports = router;