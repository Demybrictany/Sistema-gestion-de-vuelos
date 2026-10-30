const construirConfiguracion = () => {
  const configuracion = process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 5432),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
      };

  if (process.env.DB_SSL === 'true') {
    configuracion.ssl = { rejectUnauthorized: false };
  }

  return configuracion;
};

const validarConfiguracion = () => {
  if (process.env.DATABASE_URL) {
    return;
  }

  if (
    !process.env.DB_NAME ||
    !process.env.DB_USER ||
    process.env.DB_PASSWORD === undefined
  ) {
    throw new Error(
      'Configura DATABASE_URL (Neon) o las variables DB_NAME, DB_USER y DB_PASSWORD.'
    );
  }
};

module.exports = {
  construirConfiguracion,
  validarConfiguracion,
};
