const express = require('express');
const router = express.Router();

const {
  obtenerEquipajes,
  obtenerMisEquipajes,
  obtenerEquipajePorId,
  crearEquipaje,
  actualizarEquipaje,
  registrarTramo,
  cambiarBanda,
  cambiarEstado,
  eliminarEquipaje,
} = require('../controllers/equipaje.controller');
const { permitirRoles } = require('../middlewares/auth.middleware');
const { validar } = require('../middlewares/validar.middleware');
const {
  crearEquipaje: crearEquipajeSchema,
  actualizarEquipaje: actualizarEquipajeSchema,
  registrarTramo: registrarTramoSchema,
  cambiarBandaEquipaje,
  cambiarEstadoEquipaje,
} = require('../validators/schemas');

const staff = permitirRoles('ADMINISTRADOR', 'SECRETARIO');
const todos = permitirRoles('ADMINISTRADOR', 'SECRETARIO', 'PASAJERO');

// Rutas específicas antes de /:id
router.get('/mios', permitirRoles('PASAJERO'), obtenerMisEquipajes);

router.get('/', staff, obtenerEquipajes);
router.get('/:id', todos, obtenerEquipajePorId);

router.post('/', staff, validar(crearEquipajeSchema), crearEquipaje);
router.put(
  '/:id',
  staff,
  validar(actualizarEquipajeSchema),
  actualizarEquipaje
);

router.post(
  '/:id/tramos',
  staff,
  validar(registrarTramoSchema),
  registrarTramo
);
router.patch(
  '/:id/banda',
  staff,
  validar(cambiarBandaEquipaje),
  cambiarBanda
);
router.patch(
  '/:id/estado',
  staff,
  validar(cambiarEstadoEquipaje),
  cambiarEstado
);

router.delete('/:id', permitirRoles('ADMINISTRADOR'), eliminarEquipaje);

module.exports = router;
