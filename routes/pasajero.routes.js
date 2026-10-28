const express = require('express');
const router = express.Router();

const {
  obtenerPasajeros,
  obtenerPasajeroPorId,
  crearPasajero,
  actualizarPasajero,
  eliminarPasajero,
} = require('../controllers/pasajero.controller');
const { validar } = require('../middlewares/validar.middleware');
const {
  crearPasajero: crearPasajeroSchema,
  actualizarPasajero: actualizarPasajeroSchema,
} = require('../validators/schemas');

router.get('/', obtenerPasajeros);
router.get('/:id', obtenerPasajeroPorId);
router.post('/', validar(crearPasajeroSchema), crearPasajero);
router.put('/:id', validar(actualizarPasajeroSchema), actualizarPasajero);
router.delete('/:id', eliminarPasajero);

module.exports = router;
