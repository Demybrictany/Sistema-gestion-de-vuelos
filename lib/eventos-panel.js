const { EventEmitter } = require('events');

const bus = new EventEmitter();
bus.setMaxListeners(20);

let temporizador = null;

// Agrupa ráfagas de cambios (por ejemplo, una cancelación que genera
// notificaciones y actualiza reservas) en una sola señal para el panel.
const emitirCambioPanel = () => {
  if (temporizador) {
    clearTimeout(temporizador);
  }

  temporizador = setTimeout(() => {
    temporizador = null;
    bus.emit('cambio');
  }, 400);

  if (typeof temporizador.unref === 'function') {
    temporizador.unref();
  }
};

module.exports = {
  bus,
  emitirCambioPanel,
};
