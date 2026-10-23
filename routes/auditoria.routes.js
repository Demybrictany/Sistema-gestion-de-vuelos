const express = require('express');
const router = express.Router();

const {
  obtenerAuditorias,
  obtenerAuditoriaPorId,
  obtenerAuditoriasPorUsuario,
  crearAuditoria,
  eliminarAuditoria,
} = require('../controllers/auditoria.controller');

router.get('/', obtenerAuditorias);

// Auditoría de un usuario específico
router.get('/usuario/:idUsuario', obtenerAuditoriasPorUsuario);

// Registro específico
router.get('/:id', obtenerAuditoriaPorId);

router.post('/', crearAuditoria);

router.delete('/:id', eliminarAuditoria);

module.exports = router;
