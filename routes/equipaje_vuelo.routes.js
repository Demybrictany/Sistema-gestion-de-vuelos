const express = require('express');
const router = express.Router();

const {
  obtenerEquipajesVuelos,
  obtenerEquipajeVueloPorId,
  crearEquipajeVuelo,
  actualizarEquipajeVuelo,
  eliminarEquipajeVuelo,
} = require('../controllers/equipaje_vuelo.controller');

router.get('/', obtenerEquipajesVuelos);

router.get('/:id', obtenerEquipajeVueloPorId);

router.post('/', crearEquipajeVuelo);

router.put('/:id', actualizarEquipajeVuelo);

router.delete('/:id', eliminarEquipajeVuelo);

module.exports = router;
