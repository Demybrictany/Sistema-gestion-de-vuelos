const express = require('express');

const { obtener } = require('../controllers/panel.controller');

const router = express.Router();

router.get('/', obtener);

module.exports = router;
