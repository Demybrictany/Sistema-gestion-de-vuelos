const Notificacion = require('../models/notificacion.model');
const PasajeroVuelo = require('../models/pasajero_vuelo.model');

const crearNotificacionPasajero = async ({
  idPasajero,
  idVuelo = null,
  idEquipaje = null,
  tipo,
  titulo,
  mensaje,
  transaction,
}) => {
  return Notificacion.create(
    {
      id_pasajero: idPasajero,
      id_vuelo: idVuelo,
      id_equipaje: idEquipaje,
      tipo,
      titulo,
      mensaje,
      leida: false,
    },
    { transaction }
  );
};

const notificarPasajerosDeVuelo = async ({
  idVuelo,
  tipo,
  titulo,
  mensaje,
  idEquipaje = null,
  transaction,
}) => {
  const registros = await PasajeroVuelo.findAll({
    where: { id_vuelo: idVuelo },
    attributes: ['id_pasajero'],
    transaction,
  });

  const idsPasajeros = [...new Set(registros.map((item) => item.id_pasajero))];

  if (!idsPasajeros.length) {
    return [];
  }

  return Notificacion.bulkCreate(
    idsPasajeros.map((idPasajero) => ({
      id_pasajero: idPasajero,
      id_vuelo: idVuelo,
      id_equipaje: idEquipaje,
      tipo,
      titulo,
      mensaje,
      leida: false,
    })),
    { transaction }
  );
};

module.exports = {
  crearNotificacionPasajero,
  notificarPasajerosDeVuelo,
};
