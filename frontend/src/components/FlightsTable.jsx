import { useMemo, useState } from 'react';

import { formatearFecha, formatearHora } from '../api';
import { ESTADOS_VUELO } from '../estados';
import StatusBadge from './StatusBadge';

const ORDEN_ESTADOS = Object.keys(ESTADOS_VUELO);

const compararVuelos = (a, b) => {
  const salidaA = `${a.fecha_salida}T${a.hora_salida}`;
  const salidaB = `${b.fecha_salida}T${b.hora_salida}`;

  return salidaA.localeCompare(salidaB);
};

function MedidorOcupacion({ valor }) {
  const seguro = Math.max(0, Math.min(100, Number(valor) || 0));

  return (
    <div className="medidor" aria-label={`Ocupación ${seguro}%`}>
      <div className="medidor__pista">
        <span className="medidor__relleno" style={{ width: `${seguro}%` }} />
      </div>
      <span className="medidor__valor">{seguro}%</span>
    </div>
  );
}

export default function FlightsTable({
  vuelos,
  titulo = 'Vuelos',
  descripcion,
  conFiltros = true,
}) {
  const [estado, setEstado] = useState('TODOS');
  const [busqueda, setBusqueda] = useState('');

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return [...(vuelos || [])]
      .filter((vuelo) => estado === 'TODOS' || vuelo.estado === estado)
      .filter((vuelo) => {
        if (!texto) return true;

        return [
          vuelo.codigo_vuelo,
          vuelo.origen?.codigo_iata,
          vuelo.origen?.ciudad,
          vuelo.destino?.codigo_iata,
          vuelo.destino?.ciudad,
          vuelo.puerta?.numero,
        ]
          .filter(Boolean)
          .some((valor) => String(valor).toLowerCase().includes(texto));
      })
      .sort(compararVuelos);
  }, [vuelos, estado, busqueda]);

  return (
    <section className="tabla-panel">
      <div className="tabla-panel__cabecera">
        <div>
          <h2>{titulo}</h2>
          {descripcion ? <p className="subtitulo">{descripcion}</p> : null}
        </div>
        <span className="contador">
          {visibles.length} de {vuelos?.length || 0}
        </span>
      </div>

      {conFiltros ? (
        <div className="filtros">
          <label className="campo campo--busqueda">
            <span>Buscar</span>
            <input
              type="search"
              placeholder="Código, ciudad o puerta"
              value={busqueda}
              onChange={(evento) => setBusqueda(evento.target.value)}
            />
          </label>
          <label className="campo">
            <span>Estado</span>
            <select
              value={estado}
              onChange={(evento) => setEstado(evento.target.value)}
            >
              <option value="TODOS">Todos</option>
              {ORDEN_ESTADOS.map((clave) => (
                <option key={clave} value={clave}>
                  {ESTADOS_VUELO[clave].etiqueta}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}

      {visibles.length === 0 ? (
        <p className="vacio">No hay vuelos que coincidan con el filtro.</p>
      ) : (
        <div className="tabla-scroll">
          <table className="tabla">
            <caption className="solo-lectores">
              {titulo}: vuelos, ruta, salida, puerta, estado y ocupación.
            </caption>
            <thead>
              <tr>
                <th scope="col">Vuelo</th>
                <th scope="col">Ruta</th>
                <th scope="col">Salida</th>
                <th scope="col">Puerta</th>
                <th scope="col">Estado</th>
                <th scope="col" className="num">
                  Pasajeros
                </th>
                <th scope="col">Ocupación</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((vuelo) => (
                <tr key={vuelo.id_vuelo}>
                  <td className="celda-fuerte">{vuelo.codigo_vuelo}</td>
                  <td>
                    <span className="ruta">
                      {vuelo.origen?.codigo_iata}
                      <span aria-hidden="true"> → </span>
                      {vuelo.destino?.codigo_iata}
                    </span>
                    <span className="ruta__ciudades">
                      {vuelo.origen?.ciudad} · {vuelo.destino?.ciudad}
                    </span>
                  </td>
                  <td>
                    <span className="celda-fuerte">
                      {formatearHora(vuelo.hora_salida)}
                    </span>
                    <span className="ruta__ciudades">
                      {formatearFecha(vuelo.fecha_salida)}
                    </span>
                  </td>
                  <td>{vuelo.puerta?.numero || '—'}</td>
                  <td>
                    <StatusBadge estado={vuelo.estado} />
                  </td>
                  <td className="num">
                    {vuelo.pasajeros} / {vuelo.capacidad_pasajeros}
                  </td>
                  <td>
                    <MedidorOcupacion valor={vuelo.ocupacion_pct} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
