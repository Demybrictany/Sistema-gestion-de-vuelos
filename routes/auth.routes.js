const express = require('express');
const router = express.Router();

const {
  login,
  me,
} = require('../controllers/auth.controller');
const { verificarToken } = require('../middlewares/auth.middleware');

router.post('/login', login);
router.get('/me', verificarToken, me);

module.exports = router;
