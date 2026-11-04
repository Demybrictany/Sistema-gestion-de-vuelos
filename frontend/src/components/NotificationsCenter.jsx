import { useCallback, useEffect, useMemo, useState } from 'react';

import { api, formatearFechaHora } from '../api';
import { useSocket } from '../hooks/useSocket';

const TIPOS = [
  'CAMBIO_PUERTA', 'CAMBIO_HORARIO', 'VUELO_CANCELADO', 'VUELO_RETRASADO',
  'PUERTA_ASIGNADA', 'BANDA_EQUIPAJE', 'ESCALA', 'INFORMACION_GENERAL',
];
const etiquetaTipo = (tipo) => (tipo || 'INFORMACION_GENERAL').replaceAll('_', ' ');

export default function NotificationsCenter({ token }) {
  const [notificaciones, setNotificaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('TODAS');
  const [filtroLectura, setFiltroLectura] = useState('TODAS');
  const [seleccionada, setSeleccionada] = useState(null);
  const [entregas, setEntregas] = useState([]);
  const [cargandoEntregas, setCargandoEntregas] = useState(false);

  const cargar = useCallback(async (silencioso = false) => {
    if (!silencioso) setCargando(true);
    setError('');
    try {
      const lista = await api('/api/notificaciones', { token });
      setNotificaciones(Array.isArray(lista) ? lista : []);
    } catch (fallo) {
      setError(fallo.message || 'No se pudieron cargar las notificaciones.');
    } finally {
      if (!silencioso) setCargando(false);
    }
  }, [token]);

  useEffect(() => { cargar(); }, [cargar]);
  const refrescarPorSocket = useCallback(() => { cargar(true); }, [cargar]);
  useSocket({ token, activo: true, onCambio: refrescarPorSocket });
  useEffect(() => {
    const timer = window.setInterval(() => cargar(true), 30000);
    return () => window.clearInterval(timer);
  }, [cargar]);

  const visibles = useMemo(() => notificaciones.filter((n) =>
    (filtroTipo === 'TODAS' || n.tipo === filtroTipo) &&
    (filtroLectura === 'TODAS' || String(Boolean(n.leida)) === filtroLectura)),
  [notificaciones, filtroTipo, filtroLectura]);
  const nuevas = notificaciones.filter((n) => !n.leida).length;

  const verDetalle = async (n) => {
    setSeleccionada(n);
    setEntregas([]);
    setError('');
    setCargandoEntregas(true);
    try {
      const [detalle, historial] = await Promise.all([
        api(`/api/notificaciones/${n.id_notificacion}`, { token }),
        api(`/api/notificaciones/${n.id_notificacion}/entregas`, { token }),
      ]);
      setSeleccionada(detalle || n);
      setEntregas(Array.isArray(historial) ? historial : []);
    } catch (fallo) {
      // El registro de entrega es complementario: conservar el detalle disponible.
      setError(fallo.message || 'No se pudo consultar el detalle completo.');
    } finally {
      setCargandoEntregas(false);
    }
  };

  const marcarLeida = async (n) => {
    if (n.leida) return;
    setError('');
    setAviso('');
    try {
      await api(`/api/notificaciones/${n.id_notificacion}/leer`, { token, method: 'PATCH' });
      setAviso('Notificación marcada como leída.');
      await cargar(true);
      setSeleccionada((actual) => actual?.id_notificacion === n.id_notificacion ? { ...actual, leida: true, fecha_lectura: new Date().toISOString() } : actual);
    } catch (fallo) {
      setError(fallo.message || 'No se pudo actualizar el estado de lectura.');
    }
  };

  return (
    <section className="centro-notificaciones">
      <div className="modulo-personas__encabezado"><div><p className="eyebrow">Punto 6 · Avisos a pasajeros</p><h1>Notificaciones</h1><p className="subtitulo">Consulta avisos emitidos, su estado de lectura y el historial de entrega disponible.</p></div><button className="boton boton--secundario" type="button" onClick={() => cargar()} disabled={cargando}>Actualizar</button></div>
      <div className="modulo-personas__resumen"><article className="tarjeta"><span>Total de notificaciones</span><strong>{notificaciones.length}</strong></article><article className="tarjeta"><span>Nuevas / no leídas</span><strong>{nuevas}</strong></article></div>
      {aviso && <p className="alerta alerta--exito" role="status">{aviso}</p>}
      {error && <p className="alerta alerta--error" role="alert">{error}</p>}
      <section className="tarjeta">
        <div className="notificaciones-filtros"><label className="campo"><span>Tipo</span><select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}><option value="TODAS">Todos los tipos</option>{TIPOS.map((tipo) => <option key={tipo} value={tipo}>{etiquetaTipo(tipo)}</option>)}</select></label><label className="campo"><span>Lectura</span><select value={filtroLectura} onChange={(e) => setFiltroLectura(e.target.value)}><option value="TODAS">Todas</option><option value="false">No leídas</option><option value="true">Leídas</option></select></label></div>
        {cargando ? <p role="status">Cargando notificaciones…</p> : visibles.length === 0 ? <p className="estado-vacio">{notificaciones.length ? 'No hay notificaciones para estos filtros.' : 'Aún no se han generado notificaciones.'}</p> : <div className="lista-notificaciones">{visibles.map((n) => <article className={`notificacion-card ${n.leida ? 'notificacion-card--leida' : 'notificacion-card--nueva'}`} key={n.id_notificacion}>
          <div className="notificacion-card__cuerpo"><div className="notificacion-card__metadatos"><span className="etiqueta-tipo">{etiquetaTipo(n.tipo)}</span><span>{formatearFechaHora(n.fecha_envio)}</span><span className={`estado-lectura ${n.leida ? '' : 'estado-lectura--nueva'}`}>{n.leida ? 'Leída' : 'Nueva'}</span></div><h2>{n.titulo || etiquetaTipo(n.tipo)}</h2><p>{n.mensaje || 'Sin mensaje disponible.'}</p><small>Pasajero: {[n.pasajero?.nombres, n.pasajero?.apellidos].filter(Boolean).join(' ') || `#${n.id_pasajero}`}</small></div><div className="notificacion-card__acciones"><button className="boton boton--fantasma" type="button" onClick={() => verDetalle(n)}>Ver detalle</button>{!n.leida && <button className="boton boton--secundario" type="button" onClick={() => marcarLeida(n)}>Marcar leída</button>}</div>
        </article>)}</div>}
      </section>
      {seleccionada && <div className="modal-fondo" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setSeleccionada(null); }}><section className="modal-personas tarjeta" role="dialog" aria-modal="true" aria-labelledby="detalle-notificacion-titulo"><div className="tarjeta__cabecera"><div><p className="eyebrow">{etiquetaTipo(seleccionada.tipo)}</p><h2 id="detalle-notificacion-titulo">{seleccionada.titulo || 'Detalle de notificación'}</h2></div><button className="boton boton--fantasma" type="button" onClick={() => setSeleccionada(null)} aria-label="Cerrar">×</button></div><p>{seleccionada.mensaje || 'Sin mensaje disponible.'}</p><dl className="detalle-persona"><dt>Enviada</dt><dd>{formatearFechaHora(seleccionada.fecha_envio)}</dd><dt>Lectura</dt><dd>{seleccionada.leida ? `Leída ${formatearFechaHora(seleccionada.fecha_lectura)}` : 'Aún no leída'}</dd><dt>Pasajero</dt><dd>{[seleccionada.pasajero?.nombres, seleccionada.pasajero?.apellidos].filter(Boolean).join(' ') || '—'}</dd><dt>Vuelo</dt><dd>{seleccionada.vuelo?.codigo_vuelo || 'Sin vuelo asociado'}{seleccionada.vuelo?.hora_salida ? ` · ${seleccionada.vuelo.hora_salida}` : ''}{seleccionada.vuelo?.puerta?.numero ? ` · Puerta ${seleccionada.vuelo.puerta.numero}` : ''}</dd><dt>Equipaje</dt><dd>{seleccionada.equipaje?.codigo_etiqueta || seleccionada.equipaje?.numero_etiqueta || (seleccionada.equipaje ? `Equipaje #${seleccionada.equipaje.id_equipaje}` : 'Sin equipaje asociado')}</dd></dl><div className="historial-entregas"><h3>Historial de entrega</h3>{cargandoEntregas ? <p role="status">Consultando historial…</p> : entregas.length ? <ul>{entregas.map((item, index) => <li key={item.id_entrega || `${item.canal}-${index}`}><strong>{item.estado || 'Estado no informado'}</strong><span>{item.canal || 'Canal no informado'} · {formatearFechaHora(item.created_at || item.fecha_envio)}</span>{item.error && <small>{item.error}</small>}</li>)}</ul> : <p className="subtitulo">No hay entregas registradas para esta notificación.</p>}</div>{!seleccionada.leida && <div className="formulario-personas__acciones"><button type="button" className="boton boton--primario" onClick={() => marcarLeida(seleccionada)}>Marcar como leída</button></div>}</section></div>}
    </section>
  );
}
