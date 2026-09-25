const express = require('express');
const router = express.Router();

const {
  obtenerHistorialVuelos,
  obtenerHistorialVueloPorId,
  obtenerHistorialPorVuelo,
  crearHistorialVuelo,
  eliminarHistorialVuelo,
} = require('../controllers/historial_vuelo.controller');

router.get('/', obtenerHistorialVuelos);

// Historial completo de un vuelo
router.get('/vuelo/:idVuelo', obtenerHistorialPorVuelo);

// Registro específico
router.get('/:id', obtenerHistorialVueloPorId);

router.post('/', crearHistorialVuelo);

router.delete('/:id', eliminarHistorialVuelo);

module.exports = router;
