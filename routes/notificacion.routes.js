const express = require('express');
const router = express.Router();

const {
  obtenerNotificaciones,
  obtenerMisNotificaciones,
  obtenerNotificacionPorId,
  crearNotificacion,
  actualizarNotificacion,
  marcarLeida,
  marcarTodasLeidas,
  eliminarNotificacion,
} = require('../controllers/notificacion.controller');
const {
  listarEntregas,
  resumenEntregas,
  listarEntregasDeNotificacion,
} = require('../controllers/entrega.controller');
const { permitirRoles } = require('../middlewares/auth.middleware');
const { validar } = require('../middlewares/validar.middleware');
const {
  crearNotificacion: crearNotificacionSchema,
  actualizarNotificacion: actualizarNotificacionSchema,
} = require('../validators/schemas');

const staff = permitirRoles('ADMINISTRADOR', 'SECRETARIO');

// Rutas del pasajero (antes de /:id)
router.get('/mias', permitirRoles('PASAJERO'), obtenerMisNotificaciones);
router.patch(
  '/mias/leer-todas',
  permitirRoles('PASAJERO'),
  marcarTodasLeidas
);

// Entregas de la mensajería asíncrona (antes de /:id)
router.get('/entregas/resumen', staff, resumenEntregas);
router.get('/entregas', staff, listarEntregas);
router.get('/:id/entregas', staff, listarEntregasDeNotificacion);

router.get('/', staff, obtenerNotificaciones);
router.post('/', staff, validar(crearNotificacionSchema), crearNotificacion);

router.patch(
  '/:id/leer',
  permitirRoles('ADMINISTRADOR', 'SECRETARIO', 'PASAJERO'),
  marcarLeida
);

router.get('/:id', staff, obtenerNotificacionPorId);
router.put(
  '/:id',
  staff,
  validar(actualizarNotificacionSchema),
  actualizarNotificacion
);
router.delete('/:id', permitirRoles('ADMINISTRADOR'), eliminarNotificacion);

module.exports = router;
