const { DataTypes } = require('sequelize');
const sequelize = require('../db/database');

const Pasajero = sequelize.define(
  'Pasajero',
  {
    id_pasajero: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    nombres: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    apellidos: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    fecha_nacimiento: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    nacionalidad: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    pasaporte: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
    },

    correo: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },

    telefono: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },

    estado: {
      type: DataTypes.ENUM('ACTIVO', 'INACTIVO'),
      allowNull: false,
      defaultValue: 'ACTIVO',
    },
  },
  {
    tableName: 'pasajeros',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

module.exports = Pasajero;
