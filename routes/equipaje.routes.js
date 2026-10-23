const express = require('express');
const router = express.Router();

const {
  obtenerEquipajes,
  obtenerEquipajePorId,
  crearEquipaje,
  actualizarEquipaje,
  eliminarEquipaje,
} = require('../controllers/equipaje.controller');

router.get('/', obtenerEquipajes);

router.get('/:id', obtenerEquipajePorId);

router.post('/', crearEquipaje);

router.put('/:id', actualizarEquipaje);

router.delete('/:id', eliminarEquipaje);

module.exports = router;

