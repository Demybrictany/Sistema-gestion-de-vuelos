import { useEffect, useMemo, useState } from 'react';

import {
  api,
  descargarReporte,
  formatearFecha,
  formatearFechaHora,
  formatearNumero,
} from '../api';

const ETIQUETAS_FILTRO = {
  fecha_desde: 'Desde',
  fecha_hasta: 'Hasta',
  estado: 'Estado',
  zona: 'Zona',
  id_aeropuerto: 'Aeropuerto (ID)',
  id_puerta: 'Puerta (ID)',
  id_banda: 'Banda (ID)',
  id_usuario: 'Usuario (ID)',
  id_vuelo: 'Vuelo (ID)',
  id_pasajero: 'Pasajero (ID)',
  tipo: 'Tipo',
  campo: 'Campo modificado',
  accion: 'Acción',
  estado_pasajero: 'Estado del pasajero',
  estado_reserva: 'Estado de la reserva',
};

const FILTROS_FECHA = new Set(['fecha_desde', 'fecha_hasta']);
const FILTROS_NUMERO = new Set([
  'id_aeropuerto',
  'id_puerta',
  'id_banda',
  'id_usuario',
  'id_vuelo',
  'id_pasajero',
]);

const SUGERENCIAS = {
  estado: [
    'PROGRAMADO',
    'ABORDANDO',
    'ABORDADO',
    'EN_VUELO',
    'ATERRIZADO',
    'FINALIZADO',
    'RETRASADO',
    'CANCELADO',
    'REGISTRADO',
    'EN_TRANSITO',
    'EN_BANDA',
    'CARGADO',
    'TRANSFERIDO',
    'ENTREGADO',
    'EXTRAVIADO',
    'DANADO',
  ],
  tipo: [
    'CAMBIO_PUERTA',
    'CAMBIO_HORARIO',
    'VUELO_CANCELADO',
    'VUELO_RETRASADO',
    'PUERTA_ASIGNADA',
    'BANDA_EQUIPAJE',
    'ESCALA',
    'INFORMACION_GENERAL',
  ],
  accion: ['CREAR', 'ACTUALIZAR', 'ELIMINAR', 'LOGIN'],
  estado_reserva: ['ACTIVA', 'CANCELADA'],
  estado_pasajero: ['ACTIVO', 'INACTIVO'],
};

const etiquetaFiltro = (clave) =>
  ETIQUETAS_FILTRO[clave] ||
  clave.replaceAll('_', ' ').replace(/^\w/, (letra) => letra.toUpperCase());

function formatearCelda(columna, valor) {
  if (valor === null || valor === undefined || valor === '') return '—';
  if (typeof valor === 'boolean') return valor ? 'Sí' : 'No';

  if (columna.tipo === 'numero') return formatearNumero(valor);

  const texto = String(valor);

  if (/^\d{4}-\d{2}-\d{2}T/.test(texto)) return formatearFechaHora(texto);
  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) return formatearFecha(texto);

  return texto;
}

export default function Reports({ token }) {
  const [catalogo, setCatalogo] = useState([]);
  const [clave, setClave] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtros, setFiltros] = useState({});
  const [reporte, setReporte] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [exportando, setExportando] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;

    api('/api/reportes', { token })
      .then((datos) => {
        if (!activo) return;
        const lista = datos.reportes || [];
        setCatalogo(lista);
        setClave((actual) => actual || lista[0]?.clave || '');
      })
      .catch((fallo) => {
        if (activo) setError(fallo.message);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [token]);

  const actual = catalogo.find((item) => item.clave === clave);

  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    if (!texto) return catalogo;

    return catalogo.filter((item) =>
      `${item.titulo} ${item.descripcion}`.toLowerCase().includes(texto)
    );
  }, [catalogo, busqueda]);

  const selector = (nuevaClave) => {
    setClave(nuevaClave);
    setFiltros({});
    setReporte(null);
    setError('');
  };

  const construirQuery = () => {
    const parametros = new URLSearchParams();

    Object.entries(filtros).forEach(([nombre, valor]) => {
      if (valor !== '' && valor !== null && valor !== undefined) {
        parametros.set(nombre, valor);
      }
    });

    const query = parametros.toString();

    return query ? `?${query}` : '';
  };

  const ejecutar = async (evento) => {
    evento.preventDefault();
    if (!clave) return;

    setCargando(true);
    setError('');

    try {
      const datos = await api(`/api/reportes/${clave}${construirQuery()}`, {
        token,
      });
      setReporte(datos);
    } catch (fallo) {
      setError(fallo.message);
      setReporte(null);
    } finally {
      setCargando(false);
    }
  };

  const exportar = async (formato) => {
    if (!clave) return;

    setExportando(formato);
    setError('');

    try {
      const extension = formato === 'excel' ? 'xlsx' : 'pdf';

      await descargarReporte(
        `/api/reportes/${clave}/exportar?formato=${formato}${construirQuery()
          ? `&${construirQuery().slice(1)}`
          : ''}`,
        token,
        `reporte-${clave}.${extension}`
      );
    } catch (fallo) {
      setError(fallo.message);
    } finally {
      setExportando('');
    }
  };

  const columnas = reporte?.columnas || [];

  return (
    <section className="reportes">
      <aside className="reportes__catalogo">
        <div className="reportes__catalogo-cabecera">
          <p className="eyebrow">Catálogo</p>
          <h2>16 reportes</h2>
          <input
            type="search"
            placeholder="Buscar reporte"
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            aria-label="Buscar reporte"
          />
        </div>

        <ul className="reportes__lista">
          {filtrados.map((item) => (
            <li key={item.clave}>
              <button
                type="button"
                className={`reporte-item${
                  item.clave === clave ? ' reporte-item--activo' : ''
                }`}
                onClick={() => selector(item.clave)}
                aria-pressed={item.clave === clave}
              >
                <strong>{item.titulo}</strong>
                <span>{item.descripcion}</span>
              </button>
            </li>
          ))}
          {filtrados.length === 0 ? (
            <li className="vacio">No hay reportes que coincidan.</li>
          ) : null}
        </ul>
      </aside>

      <div className="reportes__detalle">
        <header className="reportes__cabecera">
          <div>
            <p className="eyebrow">Reportería</p>
            <h2>{actual?.titulo || 'Selecciona un reporte'}</h2>
            <p className="subtitulo">{actual?.descripcion}</p>
          </div>

          <div className="reportes__acciones">
            <button
              type="button"
              className="boton boton--secundario"
              onClick={() => exportar('excel')}
              disabled={!clave || Boolean(exportando)}
            >
              {exportando === 'excel' ? 'Generando…' : 'Excel'}
            </button>
            <button
              type="button"
              className="boton boton--secundario"
              onClick={() => exportar('pdf')}
              disabled={!clave || Boolean(exportando)}
            >
              {exportando === 'pdf' ? 'Generando…' : 'PDF'}
            </button>
          </div>
        </header>

        <form className="reportes__filtros" onSubmit={ejecutar}>
          {(actual?.filtros || []).map((filtro) => (
            <label className="campo" key={filtro}>
              <span>{etiquetaFiltro(filtro)}</span>
              <input
                type={FILTROS_FECHA.has(filtro) ? 'date' : 'text'}
                inputMode={FILTROS_NUMERO.has(filtro) ? 'numeric' : undefined}
                list={
                  SUGERENCIAS[filtro]
                    ? `sugerencias-${filtro}-${actual.clave}`
                    : undefined
                }
                placeholder={
                  FILTROS_NUMERO.has(filtro)
                    ? 'ID'
                    : SUGERENCIAS[filtro]
                      ? 'Selecciona o escribe'
                      : 'Opcional'
                }
                value={filtros[filtro] || ''}
                onChange={(evento) =>
                  setFiltros((previos) => ({
                    ...previos,
                    [filtro]: evento.target.value,
                  }))
                }
              />
              {SUGERENCIAS[filtro] ? (
                <datalist id={`sugerencias-${filtro}-${actual.clave}`}>
                  {SUGERENCIAS[filtro].map((valor) => (
                    <option key={valor} value={valor} />
                  ))}
                </datalist>
              ) : null}
            </label>
          ))}

          <button className="boton boton--primario" type="submit" disabled={!clave || cargando}>
            {cargando ? 'Consultando…' : 'Ejecutar reporte'}
          </button>
        </form>

        {error ? (
          <p className="alerta alerta--error" role="alert">
            <span aria-hidden="true">!</span> {error}
          </p>
        ) : null}

        {reporte ? (
          <>
            <div className="reportes__resumen">
              <span>
                <strong>{formatearNumero(reporte.total_registros)}</strong>{' '}
                registros
              </span>
              <span>
                Generado {formatearFechaHora(reporte.generado_en)}
              </span>
            </div>

            <div className="tabla-scroll">
              <table className="tabla tabla--reporte">
                <caption className="solo-lectores">{reporte.titulo}</caption>
                <thead>
                  <tr>
                    {columnas.map((columna) => (
                      <th
                        key={columna.clave}
                        scope="col"
                        className={columna.tipo === 'numero' ? 'num' : undefined}
                      >
                        {columna.titulo}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reporte.filas.length === 0 ? (
                    <tr>
                      <td colSpan={columnas.length} className="vacio">
                        El reporte no devolvió filas con estos filtros.
                      </td>
                    </tr>
                  ) : (
                    reporte.filas.map((fila, indice) => (
                      <tr key={indice}>
                        {columnas.map((columna) => (
                          <td
                            key={columna.clave}
                            className={columna.tipo === 'numero' ? 'num' : undefined}
                          >
                            {formatearCelda(columna, fila[columna.clave])}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
                {Object.keys(reporte.totales || {}).length > 0 ? (
                  <tfoot>
                    <tr>
                      {columnas.map((columna) => (
                        <td
                          key={columna.clave}
                          className={columna.tipo === 'numero' ? 'num' : undefined}
                        >
                          {columna.clave === columnas[0].clave
                            ? 'Totales'
                            : reporte.totales[columna.clave] !== undefined
                              ? formatearNumero(reporte.totales[columna.clave])
                              : ''}
                        </td>
                      ))}
                    </tr>
                  </tfoot>
                ) : null}
              </table>
            </div>
          </>
        ) : (
          <p className="vacio vacio--tarjeta">
            Selecciona un reporte, ajusta los filtros y pulsa “Ejecutar reporte”.
          </p>
        )}
      </div>
    </section>
  );
}
