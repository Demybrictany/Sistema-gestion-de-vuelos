const express = require('express');
const router = express.Router();

const {
  obtenerHistorialEquipajes,
  obtenerHistorialEquipajePorId,
  obtenerHistorialPorEquipaje,
  crearHistorialEquipaje,
  eliminarHistorialEquipaje,
} = require('../controllers/historial_equipaje.controller');

router.get('/', obtenerHistorialEquipajes);

// Historial completo de un equipaje
router.get('/equipaje/:idEquipaje', obtenerHistorialPorEquipaje);

// Registro específico
router.get('/:id', obtenerHistorialEquipajePorId);

router.post('/', crearHistorialEquipaje);

router.delete('/:id', eliminarHistorialEquipaje);

module.exports = router;
