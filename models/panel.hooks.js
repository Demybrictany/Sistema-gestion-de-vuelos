const { emitirCambioPanel } = require('../lib/eventos-panel');

// Entidades cuya modificación cambia lo que se ve en el panel operativo.
const MODELOS_DEL_PANEL = [
  'Vuelo',
  'Puerta',
  'BandaEquipaje',
  'Equipaje',
  'EquipajeVuelo',
  'PasajeroVuelo',
  'Notificacion',
];

const programar = (opciones) => {
  // Si el cambio está dentro de una transacción, se avisa hasta que el
  // commit sea efectivo; así el panel nunca recarga datos sin confirmar.
  if (opciones?.transaction?.afterCommit) {
    opciones.transaction.afterCommit(() => emitirCambioPanel());
    return;
  }

  emitirCambioPanel();
};

const activarEventosPanel = (modelos) => {
  for (const nombre of MODELOS_DEL_PANEL) {
    const modelo = modelos[nombre];

    if (!modelo || modelo.__eventosPanelActivos) {
      continue;
    }

    modelo.addHook('afterCreate', (instancia, opciones) => programar(opciones));
    modelo.addHook('afterUpdate', (instancia, opciones) => programar(opciones));
    modelo.addHook('afterDestroy', (instancia, opciones) => programar(opciones));
    modelo.addHook('afterBulkCreate', (instancias, opciones) =>
      programar(opciones)
    );
    modelo.addHook('afterBulkUpdate', (opciones) => programar(opciones));
    modelo.addHook('afterBulkDestroy', (opciones) => programar(opciones));

    modelo.__eventosPanelActivos = true;
  }
};

module.exports = { activarEventosPanel };
