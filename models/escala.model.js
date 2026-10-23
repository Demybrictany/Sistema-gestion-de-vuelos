const { DataTypes } = require('sequelize');
const sequelize = require('../db/database');

const Itinerario = require('./itinerario.model');
const Vuelo = require('./vuelo.model');
const Aeropuerto = require('./aeropuerto.model');
const Puerta = require('./puerta.model');

const Escala = sequelize.define(
  'Escala',
  {
    id_escala: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    id_itinerario: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    id_vuelo: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    numero_escala: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    aeropuerto_llegada: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    aeropuerto_salida: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    hora_llegada: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    hora_salida: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    id_puerta_llegada: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    id_puerta_salida: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    estado: {
      type: DataTypes.ENUM(
        'PENDIENTE',
        'EN_TRANSITO',
        'COMPLETADA',
        'CANCELADA'
      ),
      allowNull: false,
      defaultValue: 'PENDIENTE',
    },
  },
  {
    tableName: 'escalas',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',

    indexes: [
      {
        unique: true,
        fields: ['id_itinerario', 'numero_escala'],
      },
    ],
  }
);

// Relaciones
Escala.belongsTo(Itinerario, {
  foreignKey: 'id_itinerario',
  as: 'itinerario',
});

Escala.belongsTo(Vuelo, {
  foreignKey: 'id_vuelo',
  as: 'vuelo',
});

Escala.belongsTo(Aeropuerto, {
  foreignKey: 'aeropuerto_llegada',
  as: 'aeropuertoLlegada',
});

Escala.belongsTo(Aeropuerto, {
  foreignKey: 'aeropuerto_salida',
  as: 'aeropuertoSalida',
});

Escala.belongsTo(Puerta, {
  foreignKey: 'id_puerta_llegada',
  as: 'puertaLlegada',
});

Escala.belongsTo(Puerta, {
  foreignKey: 'id_puerta_salida',
  as: 'puertaSalida',
});

module.exports = Escala;
