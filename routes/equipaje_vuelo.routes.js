const express = require('express');
const router = express.Router();

const {
  obtenerEquipajesVuelos,
  obtenerEquipajeVueloPorId,
  crearEquipajeVuelo,
  actualizarEquipajeVuelo,
  eliminarEquipajeVuelo,
} = require('../controllers/equipaje_vuelo.controller');
const { validar } = require('../middlewares/validar.middleware');
const {
  crearEquipajeVuelo: crearEquipajeVueloSchema,
  actualizarEquipajeVuelo: actualizarEquipajeVueloSchema,
} = require('../validators/schemas');

router.get('/', obtenerEquipajesVuelos);
router.get('/:id', obtenerEquipajeVueloPorId);
router.post('/', validar(crearEquipajeVueloSchema), crearEquipajeVuelo);
router.put(
  '/:id',
  validar(actualizarEquipajeVueloSchema),
  actualizarEquipajeVuelo
);
router.delete('/:id', eliminarEquipajeVuelo);

module.exports = router;
