const Auditoria = require('../models/auditoria.model');

const registrarAuditoria = async ({
  idUsuario,
  accion,
  tabla,
  idRegistro,
  descripcion,
  ip,
  transaction,
}) => {
  return Auditoria.create(
    {
      id_usuario: idUsuario ?? null,
      accion,
      tabla_afectada: tabla,
      id_registro:
        idRegistro !== null && idRegistro !== undefined
          ? String(idRegistro)
          : null,
      descripcion,
      direccion_ip: ip || null,
    },
    { transaction }
  );
};

module.exports = { registrarAuditoria };
