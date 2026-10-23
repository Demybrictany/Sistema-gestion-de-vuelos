const { DataTypes } = require('sequelize');
const sequelize = require('../db/database');

const Pasajero = require('./pasajero.model');
const Aeropuerto = require('./aeropuerto.model');
const BandaEquipaje = require('./banda_equipaje.model');

const Equipaje = sequelize.define(
  'Equipaje',
  {
    id_equipaje: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    codigo_equipaje: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },

    id_pasajero: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    peso: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },

    origen: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    destino_final: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    id_banda_actual: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    estado: {
      type: DataTypes.ENUM(
        'REGISTRADO',
        'EN_TRANSITO',
        'EN_BANDA',
        'CARGADO',
        'TRANSFERIDO',
        'ENTREGADO',
        'EXTRAVIADO',
        'DANADO'
      ),
      allowNull: false,
      defaultValue: 'REGISTRADO',
    },

    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'equipajes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

// Relaciones
Equipaje.belongsTo(Pasajero, {
  foreignKey: 'id_pasajero',
  as: 'pasajero',
});

Equipaje.belongsTo(Aeropuerto, {
  foreignKey: 'origen',
  as: 'aeropuertoOrigen',
});

Equipaje.belongsTo(Aeropuerto, {
  foreignKey: 'destino_final',
  as: 'aeropuertoDestino',
});

Equipaje.belongsTo(BandaEquipaje, {
  foreignKey: 'id_banda_actual',
  as: 'bandaActual',
});

module.exports = Equipaje;
