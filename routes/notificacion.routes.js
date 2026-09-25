const express = require('express');
const router = express.Router();

const {
  obtenerNotificaciones,
  obtenerNotificacionPorId,
  crearNotificacion,
  actualizarNotificacion,
  eliminarNotificacion,
} = require('../controllers/notificacion.controller');

router.get('/', obtenerNotificaciones);

router.get('/:id', obtenerNotificacionPorId);

router.post('/', crearNotificacion);

router.put('/:id', actualizarNotificacion);

router.delete('/:id', eliminarNotificacion);

module.exports = router;
