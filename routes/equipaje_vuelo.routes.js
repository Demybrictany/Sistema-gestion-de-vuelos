const express = require('express');
const router = express.Router();

const {
  obtenerEquipajesVuelos,
  obtenerEquipajeVueloPorId,
  crearEquipajeVuelo,
} = require('../controllers/equipaje_vuelo.controller');
const { validar } = require('../middlewares/validar.middleware');
const {
  crearEquipajeVuelo: crearEquipajeVueloSchema,
} = require('../validators/schemas');

router.get('/', obtenerEquipajesVuelos);
router.get('/:id', obtenerEquipajeVueloPorId);

// El alta pasa por el mismo flujo de negocio que /equipajes/:id/tramos:
// valida continuidad de ruta, banda y estado del vuelo.
router.post('/', validar(crearEquipajeVueloSchema), crearEquipajeVuelo);

// Sin PUT ni DELETE: un tramo no se edita ni se borra directamente porque
// rompería la cadena de custodia del equipaje.

module.exports = router;
