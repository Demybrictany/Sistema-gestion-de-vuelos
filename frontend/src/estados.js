export const ESTADOS_VUELO = {
  PROGRAMADO: { tono: 'info', icono: '◷', etiqueta: 'Programado' },
  ABORDANDO: { tono: 'warning', icono: '➜', etiqueta: 'Abordando' },
  ABORDADO: { tono: 'warning', icono: '✓', etiqueta: 'Abordado' },
  EN_VUELO: { tono: 'info', icono: '✈', etiqueta: 'En vuelo' },
  ATERRIZADO: { tono: 'neutral', icono: '⌄', etiqueta: 'Aterrizado' },
  FINALIZADO: { tono: 'neutral', icono: '✓', etiqueta: 'Finalizado' },
  RETRASADO: { tono: 'serious', icono: '!', etiqueta: 'Retrasado' },
  CANCELADO: { tono: 'critical', icono: '×', etiqueta: 'Cancelado' },
};

export const ESTADOS_PUERTA = {
  DISPONIBLE: { tono: 'good', icono: '✓', etiqueta: 'Disponible' },
  OCUPADA: { tono: 'info', icono: '✈', etiqueta: 'En operación' },
  MANTENIMIENTO: { tono: 'serious', icono: '!', etiqueta: 'Mantenimiento' },
};

export const ESTADOS_BANDA = {
  DISPONIBLE: { tono: 'good', icono: '✓', etiqueta: 'Disponible' },
  EN_USO: { tono: 'info', icono: '●', etiqueta: 'En uso' },
  MANTENIMIENTO: { tono: 'serious', icono: '!', etiqueta: 'Mantenimiento' },
  INACTIVA: { tono: 'neutral', icono: '–', etiqueta: 'Inactiva' },
  FUERA_SERVICIO: { tono: 'critical', icono: '×', etiqueta: 'Fuera de servicio' },
};

export const TIPOS_NOTIFICACION = {
  CAMBIO_PUERTA: 'Cambio de puerta',
  CAMBIO_HORARIO: 'Cambio de horario',
  VUELO_CANCELADO: 'Vuelo cancelado',
  VUELO_RETRASADO: 'Vuelo retrasado',
  PUERTA_ASIGNADA: 'Puerta asignada',
  BANDA_EQUIPAJE: 'Banda de equipaje',
  ESCALA: 'Escala',
  INFORMACION_GENERAL: 'Información general',
};

export function obtenerEstado(mapa, clave) {
  return (
    mapa[clave] || {
      tono: 'neutral',
      icono: '•',
      etiqueta: clave || 'Sin estado',
    }
  );
}
