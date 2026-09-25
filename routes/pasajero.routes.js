const express = require('express');
const router = express.Router();

const {
  obtenerPasajeros,
  obtenerPasajeroPorId,
  crearPasajero,
  actualizarPasajero,
  eliminarPasajero,
} = require('../controllers/pasajero.controller');

// Obtener todos los pasajeros
router.get('/', obtenerPasajeros);

// Obtener pasajero por ID
router.get('/:id', obtenerPasajeroPorId);

// Crear pasajero
router.post('/', crearPasajero);

// Actualizar pasajero
router.put('/:id', actualizarPasajero);

// Eliminar pasajero
router.delete('/:id', eliminarPasajero);

module.exports = router;
