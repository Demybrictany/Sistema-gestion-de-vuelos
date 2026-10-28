const express = require('express');
const router = express.Router();

const {
  obtenerPuertas,
  obtenerPuertaPorId,
  crearPuerta,
  actualizarPuerta,
  eliminarPuerta,
} = require('../controllers/puerta.controller');
const { validar } = require('../middlewares/validar.middleware');
const {
  crearPuerta: crearPuertaSchema,
  actualizarPuerta: actualizarPuertaSchema,
} = require('../validators/schemas');

router.get('/', obtenerPuertas);
router.get('/:id', obtenerPuertaPorId);
router.post('/', validar(crearPuertaSchema), crearPuerta);
router.put('/:id', validar(actualizarPuertaSchema), actualizarPuerta);
router.delete('/:id', eliminarPuerta);

module.exports = router;
