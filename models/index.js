const modelos = {
  Rol: require('./rol.model'),
  Usuario: require('./usuario.model'),
  Aeropuerto: require('./aeropuerto.model'),
  Pasajero: require('./pasajero.model'),
  Puerta: require('./puerta.model'),
  BandaEquipaje: require('./banda_equipaje.model'),
  Vuelo: require('./vuelo.model'),
  Itinerario: require('./itinerario.model'),
  PasajeroVuelo: require('./pasajero_vuelo.model'),
  Escala: require('./escala.model'),
  Equipaje: require('./equipaje.model'),
  EquipajeVuelo: require('./equipaje_vuelo.model'),
  Notificacion: require('./notificacion.model'),
  HistorialVuelo: require('./historial_vuelo.model'),
  HistorialEquipaje: require('./historial_equipaje.model'),
  Auditoria: require('./auditoria.model'),
};

const { activarAuditoria } = require('./auditoria.hooks');

activarAuditoria(modelos);

module.exports = modelos;
