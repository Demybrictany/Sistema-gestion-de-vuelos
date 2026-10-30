import { useMemo, useState } from 'react';

import { formatearHora } from '../api';
import { ESTADOS_PUERTA, obtenerEstado } from '../estados';
import StatusBadge from './StatusBadge';

const porNumero = (a, b) =>
  String(a.numero).localeCompare(String(b.numero), 'es', { numeric: true });

function agruparPorZona(puertas) {
  const grupos = new Map();

  [...puertas].sort(porNumero).forEach((puerta) => {
    const zona = puerta.zona || 'Sin zona';

    if (!grupos.has(zona)) grupos.set(zona, []);
    grupos.get(zona).push(puerta);
  });

  return [...grupos.entries()].sort(([a], [b]) => a.localeCompare(b, 'es'));
}

function claseOperativa(puerta) {
  if (puerta.estado === 'MANTENIMIENTO') return 'mantenimiento';
  if (puerta.ocupada) return 'ocupada';
  if (puerta.estado_operativo === 'OCUPADA') return 'ocupada';
  return 'disponible';
}

export default function GateMap({ puertas }) {
  const [seleccionada, setSeleccionada] = useState(null);
  const grupos = useMemo(() => agruparPorZona(puertas || []), [puertas]);
  const puerta = (puertas || []).find(
    (item) => item.id_puerta === seleccionada
  );

  if (!puertas?.length) {
    return <p className="vacio">No hay puertas registradas.</p>;
  }

  return (
    <div className="mapa">
      <div className="mapa__leyenda" aria-label="Estados de las puertas">
        {Object.entries(ESTADOS_PUERTA).map(([clave, valor]) => (
          <span className="leyenda__item" key={clave}>
            <span
              className={`leyenda__punto leyenda__punto--${valor.tono}`}
              aria-hidden="true"
            />
            {valor.etiqueta}
          </span>
        ))}
      </div>

      <div className="mapa__zonas">
        {grupos.map(([zona, lista]) => (
          <div className="zona" key={zona}>
            <div className="zona__cabecera">
              <h3>Zona {zona}</h3>
              <span>{lista.length} puertas</span>
            </div>

            <div className="zona__puertas">
              {lista.map((item) => {
                const estado = item.estado_operativo || item.estado;
                const { etiqueta } = obtenerEstado(ESTADOS_PUERTA, estado);

                return (
                  <button
                    type="button"
                    key={item.id_puerta}
                    className={`puerta puerta--${claseOperativa(item)}${
                      seleccionada === item.id_puerta ? ' puerta--activa' : ''
                    }`}
                    onClick={() =>
                      setSeleccionada(
                        seleccionada === item.id_puerta ? null : item.id_puerta
                      )
                    }
                    aria-label={`Puerta ${item.numero}, ${etiqueta}${
                      item.vuelo ? `, vuelo ${item.vuelo.codigo_vuelo}` : ''
                    }. Ver detalle.`}
                    aria-pressed={seleccionada === item.id_puerta}
                  >
                    <span className="puerta__numero">{item.numero}</span>
                    <span className="puerta__estado">{etiqueta}</span>
                    {item.vuelo ? (
                      <span className="puerta__vuelo">
                        {item.vuelo.codigo_vuelo}
                      </span>
                    ) : (
                      <span className="puerta__vuelo puerta__vuelo--vacio">
                        Sin vuelo
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {puerta ? (
        <aside className="puerta-detalle" aria-live="polite">
          <div className="puerta-detalle__cabecera">
            <div>
              <p className="eyebrow">Puerta {puerta.numero}</p>
              <h3>
                {puerta.vuelo
                  ? `${puerta.vuelo.origen.codigo_iata} → ${puerta.vuelo.destino.codigo_iata}`
                  : 'Sin vuelo asignado'}
              </h3>
            </div>
            <StatusBadge
              estado={puerta.estado_operativo || puerta.estado}
              tipo="puerta"
            />
          </div>

          {puerta.vuelo ? (
            <dl className="detalle-grid">
              <div>
                <dt>Vuelo</dt>
                <dd>{puerta.vuelo.codigo_vuelo}</dd>
              </div>
              <div>
                <dt>Salida</dt>
                <dd>{formatearHora(puerta.vuelo.hora_salida)}</dd>
              </div>
              <div>
                <dt>Pasajeros</dt>
                <dd>
                  {puerta.vuelo.pasajeros} / {puerta.vuelo.capacidad_pasajeros}
                </dd>
              </div>
              <div>
                <dt>Ocupación</dt>
                <dd>{puerta.vuelo.ocupacion_pct}%</dd>
              </div>
              <div>
                <dt>Equipajes</dt>
                <dd>{puerta.vuelo.equipajes}</dd>
              </div>
              <div>
                <dt>Estado del vuelo</dt>
                <dd>
                  <StatusBadge estado={puerta.vuelo.estado} />
                </dd>
              </div>
            </dl>
          ) : (
            <p className="puerta-detalle__nota">
              La puerta está libre. Asigna un vuelo desde la vista de vuelos.
            </p>
          )}
        </aside>
      ) : null}
    </div>
  );
}
