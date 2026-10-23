const { DataTypes } = require('sequelize');
const sequelize = require('../db/database');

const Pasajero = require('./pasajero.model');
const Aeropuerto = require('./aeropuerto.model');

const Itinerario = sequelize.define(
  'Itinerario',
  {
    id_itinerario: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    id_pasajero: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    codigo_reserva: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },

    origen_principal: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    destino_final: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    fecha_inicio: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    fecha_fin: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    estado: {
      type: DataTypes.ENUM(
        'PROGRAMADO',
        'EN_CURSO',
        'COMPLETADO',
        'CANCELADO'
      ),
      allowNull: false,
      defaultValue: 'PROGRAMADO',
    },
  },
  {
    tableName: 'itinerarios',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

// Pasajero propietario del itinerario
Itinerario.belongsTo(Pasajero, {
  foreignKey: 'id_pasajero',
  as: 'pasajero',
});

// Aeropuerto de origen principal
Itinerario.belongsTo(Aeropuerto, {
  foreignKey: 'origen_principal',
  as: 'aeropuerto_origen',
});

// Aeropuerto de destino final
Itinerario.belongsTo(Aeropuerto, {
  foreignKey: 'destino_final',
  as: 'aeropuerto_destino',
});

module.exports = Itinerario;
