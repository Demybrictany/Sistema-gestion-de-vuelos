import {
  ESTADOS_BANDA,
  ESTADOS_PUERTA,
  ESTADOS_VUELO,
  obtenerEstado,
} from '../estados';

const MAPAS = {
  vuelo: ESTADOS_VUELO,
  puerta: ESTADOS_PUERTA,
  banda: ESTADOS_BANDA,
};

export default function StatusBadge({ estado, tipo = 'vuelo' }) {
  const { tono, icono, etiqueta } = obtenerEstado(MAPAS[tipo], estado);

  return (
    <span className={`badge badge--${tono}`}>
      <span className="badge__icono" aria-hidden="true">
        {icono}
      </span>
      {etiqueta}
    </span>
  );
}
