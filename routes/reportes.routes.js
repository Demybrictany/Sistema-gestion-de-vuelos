const express = require('express');
const router = express.Router();

const { listar, obtener, exportar } = require('../controllers/reportes.controller');
const { validarQuery } = require('../middlewares/validar.middleware');
const { filtrosReporte } = require('../validators/schemas');

router.get('/', listar);

// La exportación se declara antes para que no la capture /:clave.
router.get('/:clave/exportar', validarQuery(filtrosReporte), exportar);
router.get('/:clave', validarQuery(filtrosReporte), obtener);

module.exports = router;
