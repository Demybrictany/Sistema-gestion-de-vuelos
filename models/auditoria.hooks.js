const Auditoria = require('./auditoria.model');
const { obtenerContexto } = require('../lib/contexto');

const MODELOS_EXCLUIDOS = new Set([
  'Auditoria',
  'Notificacion',
  'HistorialVuelo',
  'HistorialEquipaje',
]);

const ACCIONES = {
  afterCreate: 'CREAR',
  afterUpdate: 'ACTUALIZAR',
  afterDestroy: 'ELIMINAR',
};

const registrar = async (modelo, instancia, accion, opciones) => {
  const contexto = obtenerContexto();

  // Sin usuario autenticado no se genera auditoría (por ejemplo, tareas internas).
  if (!contexto.idUsuario) {
    return;
  }

  const idRegistro = instancia[modelo.primaryKeyAttribute];
  const cambios =
    accion === 'ACTUALIZAR'
      ? (instancia.changed() || []).filter((campo) => campo !== 'updated_at')
      : [];

  const descripcion = cambios.length
    ? `Campos modificados: ${cambios.join(', ')}`
    : `${accion} en ${modelo.tableName}`;

  await Auditoria.create(
    {
      id_usuario: contexto.idUsuario,
      accion: `${accion}_${modelo.tableName.toUpperCase()}`.slice(0, 100),
      tabla_afectada: modelo.tableName,
      id_registro: idRegistro != null ? String(idRegistro) : null,
      descripcion,
      direccion_ip: contexto.ip || null,
    },
    { transaction: opciones?.transaction }
  );
};

const activarAuditoria = (modelos) => {
  for (const modelo of Object.values(modelos)) {
    if (MODELOS_EXCLUIDOS.has(modelo.name) || modelo.__auditoriaActiva) {
      continue;
    }

    for (const [hook, accion] of Object.entries(ACCIONES)) {
      modelo.addHook(hook, (instancia, opciones) =>
        registrar(modelo, instancia, accion, opciones)
      );
    }

    modelo.__auditoriaActiva = true;
  }
};

module.exports = { activarAuditoria };
