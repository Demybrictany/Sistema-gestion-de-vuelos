const express = require('express');
const router = express.Router();

const {
  obtenerHistorialVuelos,
  obtenerHistorialVueloPorId,
  obtenerHistorialPorVuelo,
  crearHistorialVuelo,
} = require('../controllers/historial_vuelo.controller');
const { validar } = require('../middlewares/validar.middleware');
const {
  crearHistorialVuelo: crearHistorialVueloSchema,
} = require('../validators/schemas');

router.get('/', obtenerHistorialVuelos);
router.get('/vuelo/:idVuelo', obtenerHistorialPorVuelo);
router.get('/:id', obtenerHistorialVueloPorId);
router.post('/', validar(crearHistorialVueloSchema), crearHistorialVuelo);

// El historial es de solo lectura: no se expone DELETE.

module.exports = router;
