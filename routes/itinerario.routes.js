const express = require('express');
const router = express.Router();

const {
  obtenerItinerarios,
  obtenerItinerarioPorId,
  crearItinerario,
  actualizarItinerario,
  eliminarItinerario,
} = require('../controllers/itinerario.controller');
const { validar } = require('../middlewares/validar.middleware');
const {
  crearItinerario: crearItinerarioSchema,
  actualizarItinerario: actualizarItinerarioSchema,
} = require('../validators/schemas');

router.get('/', obtenerItinerarios);
router.get('/:id', obtenerItinerarioPorId);
router.post('/', validar(crearItinerarioSchema), crearItinerario);
router.put(
  '/:id',
  validar(actualizarItinerarioSchema),
  actualizarItinerario
);
router.delete('/:id', eliminarItinerario);

module.exports = router;
