const { DataTypes } = require('sequelize');
const sequelize = require('../db/database');

const Usuario = require('./usuario.model');

const Auditoria = sequelize.define(
  'Auditoria',
  {
    id_auditoria: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },

    id_usuario: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    accion: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    tabla_afectada: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    id_registro: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    fecha_hora: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    direccion_ip: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
  },
  {
    tableName: 'auditoria',
    timestamps: false,
  }
);

// Relación con usuario
Auditoria.belongsTo(Usuario, {
  foreignKey: 'id_usuario',
  as: 'usuario',
});

module.exports = Auditoria;
