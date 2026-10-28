const validar = (esquema) => (req, res, next) => {
  try {
    req.body = esquema.parse(req.body);
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { validar };
