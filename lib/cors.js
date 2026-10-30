// Orígenes permitidos para el frontend y el panel en tiempo real.
// En desarrollo, Vite usa proxy y no necesita CORS; en producción se
// configura CORS_ORIGIN con una lista separada por comas.
const obtenerOrigenes = () => {
  const valor = process.env.CORS_ORIGIN;

  if (!valor || valor.trim() === '*') {
    return '*';
  }

  return valor
    .split(',')
    .map((origen) => origen.trim())
    .filter(Boolean);
};

module.exports = { obtenerOrigenes };
