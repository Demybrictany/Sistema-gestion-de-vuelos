const { DataTypes } = require('sequelize');
const sequelize = require('../db/database');

const Puerta = sequelize.define(
  'Puerta',
  {
    id_puerta: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    numero: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: true,
    },

    zona: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    estado: {
      type: DataTypes.ENUM(
        'DISPONIBLE',
        'MANTENIMIENTO',
        'INACTIVA'
      ),
      allowNull: false,
      defaultValue: 'DISPONIBLE',
    },
  },
  {
    tableName: 'puertas',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

module.exports = Puerta;