const { ZodError } = require('zod');

const manejarErrores = (error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof ZodError) {
    return res.status(400).json({
      mensaje: 'Datos inválidos',
      errores: error.issues.map((issue) => ({
        campo: issue.path.join('.') || '(cuerpo)',
        mensaje: issue.message,
      })),
    });
  }

  const codigo = error.parent?.code || error.original?.code;

  // Violación de la restricción de exclusión de puertas.
  if (codigo === '23P01') {
    return res.status(409).json({
      mensaje: 'La puerta ya está ocupada por otro vuelo en ese horario',
    });
  }

  if (error.name === 'SequelizeUniqueConstraintError' || codigo === '23505') {
    return res.status(409).json({
      mensaje: 'Ya existe un registro con esos datos',
      campos: error.errors?.map((item) => item.path),
    });
  }

  if (
    error.name === 'SequelizeForeignKeyConstraintError' ||
    codigo === '23503' ||
    codigo === '23001'
  ) {
    return res.status(409).json({
      mensaje: 'El registro está siendo utilizado por otros datos',
    });
  }

  if (error.name === 'SequelizeValidationError') {
    return res.status(400).json({
      mensaje: 'Datos inválidos',
      errores: error.errors.map((item) => ({
        campo: item.path,
        mensaje: item.message,
      })),
    });
  }

  if (error.status) {
    return res.status(error.status).json({ mensaje: error.message });
  }

  console.error('Error no controlado:', error);

  return res.status(500).json({
    mensaje: 'Error interno del servidor',
  });
};

module.exports = manejarErrores;
