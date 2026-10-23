const express = require('express');
const router = express.Router();

const {
  obtenerBandas,
  obtenerBandaPorId,
  crearBanda,
  actualizarBanda,
  eliminarBanda,
} = require('../controllers/banda_equipaje.controller');

// Obtener todas las bandas
router.get('/', obtenerBandas);

// Obtener banda por ID
router.get('/:id', obtenerBandaPorId);

// Crear banda
router.post('/', crearBanda);

// Actualizar banda
router.put('/:id', actualizarBanda);

// Eliminar banda
router.delete('/:id', eliminarBanda);

module.exports = router;
