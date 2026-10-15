const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({
      mensaje: 'Token no proporcionado',
    });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({
      mensaje: 'Configuracion de autenticacion incompleta',
    });
  }

  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch (error) {
    return res.status(401).json({
      mensaje: 'Token invalido o expirado',
    });
  }
};

const permitirRoles = (...rolesPermitidos) => (req, res, next) => {
  if (!rolesPermitidos.includes(req.usuario?.rol)) {
    return res.status(403).json({
      mensaje: 'No tienes permisos para realizar esta accion',
    });
  }

  return next();
};

module.exports = {
  verificarToken,
  permitirRoles,
};
