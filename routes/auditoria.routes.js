const express = require('express');
const router = express.Router();

const {
  obtenerAuditorias,
  obtenerAuditoriaPorId,
  obtenerAuditoriasPorUsuario,
} = require('../controllers/auditoria.controller');

router.get('/', obtenerAuditorias);
router.get('/usuario/:idUsuario', obtenerAuditoriasPorUsuario);
router.get('/:id', obtenerAuditoriaPorId);

// La auditoría es inmutable: solo se expone lectura.

module.exports = router;
