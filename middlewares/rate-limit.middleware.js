// ============================================================
// Limitador simple en memoria para endpoints costosos (agente).
//
// En una sola instancia es suficiente para la demo. Si se escala a
// varias instancias, debe reemplazarse por Redis o el limitador del
// proxy. La clave es el usuario autenticado o la IP.
// ============================================================

const crearLimitador = ({ ventanaMs = 60000, maximo = 30 } = {}) => {
  const registros = new Map();

  return (req, res, next) => {
    const clave = req.usuario?.id_usuario || req.ip || 'anonimo';
    const ahora = Date.now();
    const registro = registros.get(clave);

    if (!registro || ahora - registro.inicio >= ventanaMs) {
      registros.set(clave, { inicio: ahora, cuenta: 1 });
      return next();
    }

    registro.cuenta += 1;

    if (registro.cuenta > maximo) {
      return res.status(429).json({
        mensaje:
          'Hiciste demasiadas consultas seguidas. Espera un momento y vuelve a intentar.',
      });
    }

    return next();
  };
};

module.exports = { crearLimitador };
