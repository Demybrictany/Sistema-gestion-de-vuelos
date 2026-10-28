const express = require('express');
const router = express.Router();

const {
  obtenerUsuarios,
  obtenerUsuarioPorId,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
} = require('../controllers/usuario.controller');
const { validar } = require('../middlewares/validar.middleware');
const {
  crearUsuario: crearUsuarioSchema,
  actualizarUsuario: actualizarUsuarioSchema,
} = require('../validators/schemas');

router.get('/', obtenerUsuarios);
router.get('/:id', obtenerUsuarioPorId);
router.post('/', validar(crearUsuarioSchema), crearUsuario);
router.put('/:id', validar(actualizarUsuarioSchema), actualizarUsuario);
router.delete('/:id', eliminarUsuario);

module.exports = router;
