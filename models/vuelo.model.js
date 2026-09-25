const { DataTypes } = require('sequelize');
const sequelize = require('../db/database');

const Aeropuerto = require('./aeropuerto.model');
const Puerta = require('./puerta.model');

const Vuelo = sequelize.define(
  'Vuelo',
  {
    id_vuelo: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    codigo_vuelo: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },

    id_aeropuerto_origen: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    id_aeropuerto_destino: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    fecha_salida: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    hora_salida: {
      type: DataTypes.TIME,
      allowNull: false,
    },

    fecha_llegada: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    hora_llegada: {
      type: DataTypes.TIME,
      allowNull: false,
    },

    id_puerta: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    estado: {
      type: DataTypes.ENUM(
        'PROGRAMADO',
        'ABORDANDO',
        'ABORDADO',
        'EN_VUELO',
        'ATERRIZADO',
        'FINALIZADO',
        'RETRASADO',
        'CANCELADO'
      ),
      allowNull: false,
      defaultValue: 'PROGRAMADO',
    },

    motivo_cancelacion: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    capacidad_pasajeros: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'vuelos',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

// Aeropuerto de origen
Vuelo.belongsTo(Aeropuerto, {
  foreignKey: 'id_aeropuerto_origen',
  as: 'aeropuerto_origen',
});

// Aeropuerto de destino
Vuelo.belongsTo(Aeropuerto, {
  foreignKey: 'id_aeropuerto_destino',
  as: 'aeropuerto_destino',
});

// Puerta asignada
Vuelo.belongsTo(Puerta, {
  foreignKey: 'id_puerta',
  as: 'puerta',
});

module.exports = Vuelo;
