const express = require('express');
const router = express.Router();

const {
  obtenerEscalas,
  obtenerEscalaPorId,
  crearEscala,
  actualizarEscala,
  eliminarEscala,
} = require('../controllers/escala.controller');
const { validar } = require('../middlewares/validar.middleware');
const {
  crearEscala: crearEscalaSchema,
  actualizarEscala: actualizarEscalaSchema,
} = require('../validators/schemas');

router.get('/', obtenerEscalas);
router.get('/:id', obtenerEscalaPorId);
router.post('/', validar(crearEscalaSchema), crearEscala);
router.put('/:id', validar(actualizarEscalaSchema), actualizarEscala);
router.delete('/:id', eliminarEscala);

module.exports = router;
