const { DataTypes } = require('sequelize');
const sequelize = require('../db/database');

const Aeropuerto = sequelize.define(
  'Aeropuerto',
  {
    id_aeropuerto: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    codigo_iata: {
      type: DataTypes.CHAR(3),
      allowNull: false,
      unique: true,
    },

    nombre: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    ciudad: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    pais: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    estado: {
      type: DataTypes.ENUM('ACTIVO', 'INACTIVO'),
      allowNull: false,
      defaultValue: 'ACTIVO',
    },
  },
  {
    tableName: 'aeropuertos',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

module.exports = Aeropuerto;