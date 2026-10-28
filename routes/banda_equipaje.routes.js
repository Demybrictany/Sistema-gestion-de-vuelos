const express = require('express');
const router = express.Router();

const {
  obtenerBandas,
  obtenerBandaPorId,
  crearBanda,
  actualizarBanda,
  eliminarBanda,
} = require('../controllers/banda_equipaje.controller');
const { validar } = require('../middlewares/validar.middleware');
const {
  crearBandaEquipaje,
  actualizarBandaEquipaje,
} = require('../validators/schemas');

router.get('/', obtenerBandas);
router.get('/:id', obtenerBandaPorId);
router.post('/', validar(crearBandaEquipaje), crearBanda);
router.put('/:id', validar(actualizarBandaEquipaje), actualizarBanda);
router.delete('/:id', eliminarBanda);

module.exports = router;
