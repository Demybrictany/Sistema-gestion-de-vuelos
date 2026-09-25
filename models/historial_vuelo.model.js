const { DataTypes } = require('sequelize');
const sequelize = require('../db/database');

const Vuelo = require('./vuelo.model');
const Usuario = require('./usuario.model');

const HistorialVuelo = sequelize.define(
  'HistorialVuelo',
  {
    id_historial_vuelo: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    id_vuelo: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    campo_modificado: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    valor_anterior: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    valor_nuevo: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    motivo: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    modificado_por: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    fecha_modificacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'historial_vuelo',
    timestamps: false,
  }
);

// Relaciones
HistorialVuelo.belongsTo(Vuelo, {
  foreignKey: 'id_vuelo',
  as: 'vuelo',
});

HistorialVuelo.belongsTo(Usuario, {
  foreignKey: 'modificado_por',
  as: 'usuarioModificacion',
});

module.exports = HistorialVuelo;
