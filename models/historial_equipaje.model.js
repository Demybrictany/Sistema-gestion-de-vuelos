const { DataTypes } = require('sequelize');
const sequelize = require('../db/database');

const Equipaje = require('./equipaje.model');
const BandaEquipaje = require('./banda_equipaje.model');
const Vuelo = require('./vuelo.model');
const Usuario = require('./usuario.model');

const HistorialEquipaje = sequelize.define(
  'HistorialEquipaje',
  {
    id_historial_equipaje: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    id_equipaje: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    ubicacion: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },

    id_banda: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    id_vuelo: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    estado_anterior: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    estado_nuevo: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    registrado_por: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    fecha_registro: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'historial_equipaje',
    timestamps: false,
  }
);

// Relaciones
HistorialEquipaje.belongsTo(Equipaje, {
  foreignKey: 'id_equipaje',
  as: 'equipaje',
});

HistorialEquipaje.belongsTo(BandaEquipaje, {
  foreignKey: 'id_banda',
  as: 'banda',
});

HistorialEquipaje.belongsTo(Vuelo, {
  foreignKey: 'id_vuelo',
  as: 'vuelo',
});

HistorialEquipaje.belongsTo(Usuario, {
  foreignKey: 'registrado_por',
  as: 'usuarioRegistro',
});

module.exports = HistorialEquipaje;
