const express = require('express');

const {
  preguntar,
  interacciones,
  documentos,
  indexar,
} = require('../controllers/agente.controller');
const { permitirRoles } = require('../middlewares/auth.middleware');
const { validar } = require('../middlewares/validar.middleware');
const { crearLimitador } = require('../middlewares/rate-limit.middleware');
const { consultaAgente } = require('../validators/schemas');

const router = express.Router();
const soloAdmin = permitirRoles('ADMINISTRADOR');
const limitarConsultas = crearLimitador({ ventanaMs: 60000, maximo: 30 });

// Cualquier usuario autenticado puede preguntar; el servicio aplica
// el alcance de sus datos según el rol.
router.post('/consultas', limitarConsultas, validar(consultaAgente), preguntar);

// Los registros y la ingesta son solo para administradores.
router.get('/interacciones', soloAdmin, interacciones);
router.get('/documentos', soloAdmin, documentos);
router.post('/ingestar', soloAdmin, indexar);

module.exports = router;
