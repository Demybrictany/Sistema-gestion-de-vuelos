const express = require('express');
const router = express.Router();

const {
  obtenerHistorialEquipajes,
  obtenerHistorialEquipajePorId,
  obtenerHistorialPorEquipaje,
  crearHistorialEquipaje,
} = require('../controllers/historial_equipaje.controller');
const { validar } = require('../middlewares/validar.middleware');
const {
  crearHistorialEquipaje: crearHistorialEquipajeSchema,
} = require('../validators/schemas');

router.get('/', obtenerHistorialEquipajes);
router.get('/equipaje/:idEquipaje', obtenerHistorialPorEquipaje);
router.get('/:id', obtenerHistorialEquipajePorId);
router.post(
  '/',
  validar(crearHistorialEquipajeSchema),
  crearHistorialEquipaje
);

// El historial es de solo lectura: no se expone DELETE.

module.exports = router;
