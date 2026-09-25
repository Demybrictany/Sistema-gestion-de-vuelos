const { DataTypes } = require('sequelize');
const sequelize = require('../db/database');

const Pasajero = require('./pasajero.model');
const Vuelo = require('./vuelo.model');
const Equipaje = require('./equipaje.model');

const Notificacion = sequelize.define(
  'Notificacion',
  {
    id_notificacion: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    id_pasajero: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    id_vuelo: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    id_equipaje: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    tipo: {
      type: DataTypes.ENUM(
        'CAMBIO_PUERTA',
        'CAMBIO_HORARIO',
        'VUELO_CANCELADO',
        'VUELO_RETRASADO',
        'PUERTA_ASIGNADA',
        'BANDA_EQUIPAJE',
        'ESCALA',
        'INFORMACION_GENERAL'
      ),
      allowNull: false,
    },

    titulo: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    mensaje: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    leida: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    fecha_envio: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    fecha_lectura: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'notificaciones',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  }
);

// Relaciones
Notificacion.belongsTo(Pasajero, {
  foreignKey: 'id_pasajero',
  as: 'pasajero',
});

Notificacion.belongsTo(Vuelo, {
  foreignKey: 'id_vuelo',
  as: 'vuelo',
});

Notificacion.belongsTo(Equipaje, {
  foreignKey: 'id_equipaje',
  as: 'equipaje',
});

module.exports = Notificacion;
