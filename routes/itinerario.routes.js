const express = require('express');
const router = express.Router();

const {
  obtenerItinerarios,
  obtenerItinerarioPorId,
  crearItinerario,
  actualizarItinerario,
  eliminarItinerario,
} = require('../controllers/itinerario.controller');

router.get('/', obtenerItinerarios);

router.get('/:id', obtenerItinerarioPorId);

router.post('/', crearItinerario);

router.put('/:id', actualizarItinerario);

router.delete('/:id', eliminarItinerario);

module.exports = router;
