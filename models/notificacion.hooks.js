const { publicarEvento, ROUTING_KEY } = require('../lib/rabbitmq');

// Evento mínimo: el worker consulta la notificación y el pasajero con
// estos datos. Así el mensaje no transporta información sensible.
const eventoDe = (notificacion) => ({
  evento: 'notificacion.creada',
  id_notificacion: notificacion.id_notificacion,
  ocurrido_en: new Date().toISOString(),
});

const publicar = (notificaciones) => {
  for (const notificacion of notificaciones) {
    if (!notificacion?.id_notificacion) {
      continue;
    }

    publicarEvento(ROUTING_KEY, eventoDe(notificacion)).catch((error) => {
      console.error(
        '[notificaciones] No se pudo encolar la notificación:',
        error.message
      );
    });
  }
};

const programar = (notificaciones, opciones) => {
  const lista = (
    Array.isArray(notificaciones) ? notificaciones : [notificaciones]
  ).filter(Boolean);

  if (!lista.length) {
    return;
  }

  // Igual que los eventos del panel: si hay transacción, se publica
  // cuando el commit ya es efectivo.
  if (opciones?.transaction?.afterCommit) {
    opciones.transaction.afterCommit(() => publicar(lista));
    return;
  }

  publicar(lista);
};

const activarEventosNotificacion = (modelos) => {
  const Notificacion = modelos.Notificacion;

  if (!Notificacion || Notificacion.__eventosNotificacionActivos) {
    return;
  }

  Notificacion.addHook('afterCreate', (notificacion, opciones) =>
    programar(notificacion, opciones)
  );
  Notificacion.addHook('afterBulkCreate', (notificaciones, opciones) =>
    programar(notificaciones, opciones)
  );

  Notificacion.__eventosNotificacionActivos = true;
};

module.exports = { activarEventosNotificacion };
