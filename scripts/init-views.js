const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

const {
  construirConfiguracion,
  validarConfiguracion,
} = require('./db-config');

const ejecutar = async () => {
  validarConfiguracion();

  const ruta = path.join(__dirname, '..', 'db', 'postgres', 'views_bi.sql');
  const sql = fs.readFileSync(ruta, 'utf8');

  const client = new Client(construirConfiguracion());
  await client.connect();

  try {
    console.log('Recreando vistas de Business Intelligence...');
    await client.query(sql);

    const { rows } = await client.query(`
      SELECT table_name
      FROM information_schema.views
      WHERE table_schema = 'public'
        AND table_name LIKE 'bi_%'
      ORDER BY table_name
    `);

    console.log(`Vistas disponibles (${rows.length}):`);
    rows.forEach((fila) => console.log(` - ${fila.table_name}`));
  } finally {
    await client.end();
  }
};

ejecutar().catch((error) => {
  console.error('Error al crear las vistas de BI:', error.message);
  process.exit(1);
});
