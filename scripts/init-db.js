const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

const {
  construirConfiguracion,
  validarConfiguracion,
} = require('./db-config');

const ARCHIVOS = ['schema.sql', 'seed.sql', 'views_bi.sql'];

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
