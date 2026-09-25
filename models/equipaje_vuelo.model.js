const { DataTypes } = require('sequelize');
const sequelize = require('../db/database');

const Equipaje = require('./equipaje.model');
const Vuelo = require('./vuelo.model');
const BandaEquipaje = require('./banda_equipaje.model');
const Usuario = require('./usuario.model');

const EquipajeVuelo = sequelize.define(
  'EquipajeVuelo',
  {
    id_equipaje_vuelo: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    id_equipaje: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    id_vuelo: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    id_banda_origen: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    id_banda_destino: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    orden_vuelo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },

    estado: {
      type: DataTypes.ENUM(
        'REGISTRADO',
        'CARGADO',
        'EN_VUELO',
        'RECIBIDO',
        'TRANSFERIDO',
        'ENTREGADO'
      ),
      allowNull: false,
      defaultValue: 'REGISTRADO',
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
    tableName: 'equipaje_vuelo',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',

    indexes: [
      {
        unique: true,
        fields: ['id_equipaje', 'id_vuelo'],
      },
    ],
  }
);

// Relaciones
EquipajeVuelo.belongsTo(Equipaje, {
  foreignKey: 'id_equipaje',
  as: 'equipaje',
});

EquipajeVuelo.belongsTo(Vuelo, {
  foreignKey: 'id_vuelo',
  as: 'vuelo',
});

EquipajeVuelo.belongsTo(BandaEquipaje, {
  foreignKey: 'id_banda_origen',
  as: 'bandaOrigen',
});

EquipajeVuelo.belongsTo(BandaEquipaje, {
  foreignKey: 'id_banda_destino',
  as: 'bandaDestino',
});

EquipajeVuelo.belongsTo(Usuario, {
  foreignKey: 'registrado_por',
  as: 'usuarioRegistro',
});

module.exports = EquipajeVuelo;
