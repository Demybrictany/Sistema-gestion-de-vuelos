const express = require('express');
const router = express.Router();

const {
  obtenerRoles,
  obtenerRolPorId,
  crearRol,
  actualizarRol,
  eliminarRol,
} = require('../controllers/rol.controller');
const { validar } = require('../middlewares/validar.middleware');
const { crearRol: crearRolSchema, actualizarRol: actualizarRolSchema } =
  require('../validators/schemas');

router.get('/', obtenerRoles);
router.get('/:id', obtenerRolPorId);
router.post('/', validar(crearRolSchema), crearRol);
router.put('/:id', validar(actualizarRolSchema), actualizarRol);
router.delete('/:id', eliminarRol);

module.exports = router;
