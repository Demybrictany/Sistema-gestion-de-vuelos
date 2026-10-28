const express = require('express');
const router = express.Router();

const { login, me } = require('../controllers/auth.controller');
const { verificarToken } = require('../middlewares/auth.middleware');
const { validar } = require('../middlewares/validar.middleware');
const { login: loginSchema } = require('../validators/schemas');

router.post('/login', validar(loginSchema), login);
router.get('/me', verificarToken, me);

module.exports = router;
