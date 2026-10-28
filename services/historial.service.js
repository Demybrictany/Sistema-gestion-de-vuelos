const HistorialVuelo = require('../models/historial_vuelo.model');
const HistorialEquipaje = require('../models/historial_equipaje.model');

const formatear = (valor) => {
  if (valor === null || valor === undefined) {
    return null;
  }

  if (valor instanceof Date) {
    return valor.toISOString();
  }

  return String(valor);
};

const registrarCambiosVuelo = async ({
  idVuelo,
  cambios,
  motivo,
  idUsuario,
  transaction,
}) => {
  const filas = Object.entries(cambios).map(([campo, { anterior, nuevo }]) => ({
    id_vuelo: idVuelo,
    campo_modificado: campo,
    valor_anterior: formatear(anterior),
    valor_nuevo: formatear(nuevo),
    motivo: motivo || null,
    modificado_por: idUsuario || null,
  }));

  if (!filas.length) {
    return [];
  }

  return HistorialVuelo.bulkCreate(filas, { transaction });
};

const registrarMovimientoEquipaje = async ({
  idEquipaje,
  ubicacion,
  idBanda,
  idVuelo,
  estadoAnterior,
  estadoNuevo,
  observaciones,
  idUsuario,
  transaction,
}) => {
  return HistorialEquipaje.create(
    {
      id_equipaje: idEquipaje,
      ubicacion: ubicacion || null,
      id_banda: idBanda ?? null,
      id_vuelo: idVuelo ?? null,
      estado_anterior: estadoAnterior ?? null,
      estado_nuevo: estadoNuevo ?? null,
      observaciones: observaciones || null,
      registrado_por: idUsuario || null,
    },
    { transaction }
  );
};

module.exports = {
  registrarCambiosVuelo,
  registrarMovimientoEquipaje,
};
