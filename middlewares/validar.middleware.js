const validar = (esquema) => (req, res, next) => {
  try {
    req.body = esquema.parse(req.body);
    next();
  } catch (error) {
    next(error);
  }
};

// Express 5 expone req.query como getter, así que el resultado se guarda
// en req.filtros en lugar de reasignar req.query.
const validarQuery = (esquema) => (req, res, next) => {
  try {
    req.filtros = esquema.parse(req.query);
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { validar, validarQuery };
