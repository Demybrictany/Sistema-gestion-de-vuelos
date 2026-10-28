const express = require('express');
const router = express.Router();

const {
  obtenerPasajerosVuelos,
  obtenerPasajeroVueloPorId,
  crearPasajeroVuelo,
  actualizarPasajeroVuelo,
  eliminarPasajeroVuelo,
} = require('../controllers/pasajero_vuelo.controller');
const { validar } = require('../middlewares/validar.middleware');
const {
  crearPasajeroVuelo: crearPasajeroVueloSchema,
  actualizarPasajeroVuelo: actualizarPasajeroVueloSchema,
} = require('../validators/schemas');

router.get('/', obtenerPasajerosVuelos);
router.get('/:id', obtenerPasajeroVueloPorId);
router.post('/', validar(crearPasajeroVueloSchema), crearPasajeroVuelo);
router.put(
  '/:id',
  validar(actualizarPasajeroVueloSchema),
  actualizarPasajeroVuelo
);
router.delete('/:id', eliminarPasajeroVuelo);

module.exports = router;
