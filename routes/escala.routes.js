const express = require('express');
const router = express.Router();

const {
  obtenerEscalas,
  obtenerEscalaPorId,
  crearEscala,
  actualizarEscala,
  eliminarEscala,
} = require('../controllers/escala.controller');

router.get('/', obtenerEscalas);

router.get('/:id', obtenerEscalaPorId);

router.post('/', crearEscala);

router.put('/:id', actualizarEscala);

router.delete('/:id', eliminarEscala);

module.exports = router;
