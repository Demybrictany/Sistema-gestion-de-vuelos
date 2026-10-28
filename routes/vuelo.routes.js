const express = require('express');
const router = express.Router();

const {
  obtenerVuelos,
  obtenerVueloPorId,
  crearVuelo,
  actualizarVuelo,
  cambiarEstado,
  reprogramar,
  cambiarPuerta,
  cancelar,
  eliminarVuelo,
  obtenerMisVuelos,
} = require('../controllers/vuelo.controller');
const { permitirRoles } = require('../middlewares/auth.middleware');
const { validar } = require('../middlewares/validar.middleware');
const {
  crearVuelo: crearVueloSchema,
  actualizarVuelo: actualizarVueloSchema,
  cambiarEstadoVuelo,
  reprogramarVuelo,
  cambiarPuertaVuelo,
  cancelarVuelo,
} = require('../validators/schemas');

const staff = permitirRoles('ADMINISTRADOR', 'SECRETARIO');
const todos = permitirRoles('ADMINISTRADOR', 'SECRETARIO', 'PASAJERO');

// Rutas específicas antes de /:id
router.get('/mios', permitirRoles('PASAJERO'), obtenerMisVuelos);

router.get('/', todos, obtenerVuelos);
router.get('/:id', todos, obtenerVueloPorId);

router.post('/', staff, validar(crearVueloSchema), crearVuelo);
router.put('/:id', staff, validar(actualizarVueloSchema), actualizarVuelo);
router.patch(
  '/:id/estado',
  staff,
  validar(cambiarEstadoVuelo),
  cambiarEstado
);
router.patch(
  '/:id/reprogramar',
  staff,
  validar(reprogramarVuelo),
  reprogramar
);
router.patch(
  '/:id/puerta',
  staff,
  validar(cambiarPuertaVuelo),
  cambiarPuerta
);
router.post('/:id/cancelar', staff, validar(cancelarVuelo), cancelar);

router.delete('/:id', permitirRoles('ADMINISTRADOR'), eliminarVuelo);

module.exports = router;
