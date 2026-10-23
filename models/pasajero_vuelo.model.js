const { DataTypes } = require('sequelize');
const sequelize = require('../db/database');

const Pasajero = require('./pasajero.model');
const Vuelo = require('./vuelo.model');
const Itinerario = require('./itinerario.model');
const Usuario = require('./usuario.model');

const PasajeroVuelo = sequelize.define(
  'PasajeroVuelo',
  {
    id_pasajero_vuelo: {
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
      allowNull: false,
    },

    id_itinerario: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    numero_asiento: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },

    estado: {
      type: DataTypes.ENUM(
        'RESERVADO',
        'CHECK_IN',
        'ABORDADO',
        'NO_ABORDADO',
        'CANCELADO'
      ),
      allowNull: false,
      defaultValue: 'RESERVADO',
    },

    fecha_registro: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    registrado_por: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: 'pasajero_vuelo',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',

    indexes: [
      {
        unique: true,
        fields: ['id_pasajero', 'id_vuelo'],
      },
    ],
  }
);

// Relaciones
PasajeroVuelo.belongsTo(Pasajero, {
  foreignKey: 'id_pasajero',
  as: 'pasajero',
});

PasajeroVuelo.belongsTo(Vuelo, {
  foreignKey: 'id_vuelo',
  as: 'vuelo',
});

PasajeroVuelo.belongsTo(Itinerario, {
  foreignKey: 'id_itinerario',
  as: 'itinerario',
});

PasajeroVuelo.belongsTo(Usuario, {
  foreignKey: 'registrado_por',
  as: 'usuario_registro',
});

module.exports = PasajeroVuelo;
