const { Sequelize } = require('sequelize');
require('dotenv').config();

// Neon y la mayoría de proveedores en la nube exigen SSL.
// En local se deja desactivado con DB_SSL=false.
const dialectOptions =
  process.env.DB_SSL === 'true'
    ? { ssl: { require: true, rejectUnauthorized: false } }
    : undefined;

// DATABASE_URL tiene prioridad (formato de Neon).
// Si no existe, se usan las variables individuales.
const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging: false,
      dialectOptions,
    })
  : new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: false,
        dialectOptions,
      }
    );

module.exports = sequelize;
