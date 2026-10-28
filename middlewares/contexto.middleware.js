const { ejecutarEnContexto } = require('../lib/contexto');

const contextoMiddleware = (req, res, next) => {
  ejecutarEnContexto(
    {
      idUsuario: req.usuario?.id_usuario || null,
      ip: req.ip,
      ruta: req.originalUrl,
    },
    next
  );
};

module.exports = contextoMiddleware;
