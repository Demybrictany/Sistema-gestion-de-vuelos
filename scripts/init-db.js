const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

const ARCHIVOS = ['schema.sql', 'seed.sql'];

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

const ejecutar = async () => {
  validarConfiguracion();

  const client = new Client(construirConfiguracion());
  await client.connect();

  try {
    for (const archivo of ARCHIVOS) {
      const ruta = path.join(__dirname, '..', 'db', 'postgres', archivo);
      const sql = fs.readFileSync(ruta, 'utf8');

      console.log(`Ejecutando ${archivo}...`);
      await client.query(sql);
    }

    const { rows } = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM puertas) AS puertas,
        (SELECT COUNT(*) FROM vuelos) AS vuelos,
        (SELECT COUNT(*) FROM pasajeros) AS pasajeros,
        (SELECT COUNT(*) FROM equipajes) AS equipajes,
        (SELECT COUNT(*) FROM notificaciones) AS notificaciones
    `);

    const resumen = rows[0];
    console.log('Base de datos inicializada correctamente.');
    console.log(
      `Puertas: ${resumen.puertas} | Vuelos: ${resumen.vuelos} | ` +
        `Pasajeros: ${resumen.pasajeros} | Equipajes: ${resumen.equipajes} | ` +
        `Notificaciones: ${resumen.notificaciones}`
    );
  } finally {
    await client.end();
  }
};

ejecutar().catch((error) => {
  console.error('Error al inicializar la base de datos:', error.message);
  process.exit(1);
});
