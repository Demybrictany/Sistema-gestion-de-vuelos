
const express = require('express');

const {
  preguntar,
  preguntarStreaming,
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

const limitarConsultas = crearLimitador({
  ventanaMs: 60000,
  maximo: 30,
});

// Cualquier usuario autenticado puede realizar consultas.
// El servicio controla el acceso a los datos según el rol.

// Consulta normal del agente
router.post(
  '/consultas',
  limitarConsultas,
  validar(consultaAgente),
  preguntar
);

// Consulta con streaming en tiempo real
router.post(
  '/consultas/stream',
  limitarConsultas,
  validar(consultaAgente),
  preguntarStreaming
);

// Historial de interacciones: solo administradores
router.get(
  '/interacciones',
  soloAdmin,
  interacciones
);

// Documentos RAG: solo administradores
router.get(
  '/documentos',
  soloAdmin,
  documentos
);

// Ingesta de documentación: solo administradores
router.post(
  '/ingestar',
  soloAdmin,
  indexar
);

module.exports = router;
