const { DataTypes } = require('sequelize');
const sequelize = require('../db/database');

const Notificacion = require('./notificacion.model');

const EntregaNotificacion = sequelize.define(
  'EntregaNotificacion',
  {
    id_entrega: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },

    id_notificacion: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    canal: {
      type: DataTypes.ENUM('CORREO', 'PUSH', 'SMS'),
      allowNull: false,
      defaultValue: 'CORREO',
    },

    destinatario: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },

    estado: {
      type: DataTypes.ENUM('PENDIENTE', 'ENVIADA', 'SIMULADA', 'FALLIDA'),
      allowNull: false,
      defaultValue: 'PENDIENTE',
    },

    intento: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },

    detalle: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    fecha_entrega: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'entregas_notificacion',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      {
        unique: true,
        fields: ['id_notificacion', 'canal'],
      },
    ],
  }
);

EntregaNotificacion.belongsTo(Notificacion, {
  foreignKey: 'id_notificacion',
  as: 'notificacion',
});

module.exports = EntregaNotificacion;
