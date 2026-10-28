const express = require('express');
const router = express.Router();

const {
  obtenerAeropuertos,
  obtenerAeropuertoPorId,
  crearAeropuerto,
  actualizarAeropuerto,
  eliminarAeropuerto,
} = require('../controllers/aeropuerto.controller');
const { validar } = require('../middlewares/validar.middleware');
const {
  crearAeropuerto: crearAeropuertoSchema,
  actualizarAeropuerto: actualizarAeropuertoSchema,
} = require('../validators/schemas');

router.get('/', obtenerAeropuertos);
router.get('/:id', obtenerAeropuertoPorId);
router.post('/', validar(crearAeropuertoSchema), crearAeropuerto);
router.put('/:id', validar(actualizarAeropuertoSchema), actualizarAeropuerto);
router.delete('/:id', eliminarAeropuerto);

module.exports = router;
