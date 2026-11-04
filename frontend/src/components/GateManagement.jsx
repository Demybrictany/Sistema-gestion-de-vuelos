import { useCallback, useEffect, useMemo, useState } from 'react';

import { api, formatearFecha, formatearHora } from '../api';
import GateMap from './GateMap';
import StatusBadge from './StatusBadge';

const fechaHora = (vuelo, tipo) => new Date(`${vuelo[`fecha_${tipo}`]}T${vuelo[`hora_${tipo}`] || '00:00:00'}`);
const traslape = (a, b) => fechaHora(a, 'salida') < fechaHora(b, 'llegada') && fechaHora(a, 'llegada') > fechaHora(b, 'salida');
const textoRuta = (vuelo) => `${vuelo.aeropuerto_origen?.codigo_iata || '—'} → ${vuelo.aeropuerto_destino?.codigo_iata || '—'}`;

export default function GateManagement({ token }) {
  const [panel, setPanel] = useState(null);
  const [vuelos, setVuelos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState('TODOS');
  const [modal, setModal] = useState(null);
  const [vueloId, setVueloId] = useState('');
  const [puertaId, setPuertaId] = useState('');
  const [motivo, setMotivo] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const [datosPanel, datosVuelos] = await Promise.all([
        api('/api/panel', { token }),
        api('/api/vuelos', { token }),
      ]);
      setPanel(datosPanel);
      setVuelos(Array.isArray(datosVuelos) ? datosVuelos : []);
    } catch (fallo) {
      setError(fallo.message || 'No se pudo cargar la información de puertas.');
    } finally {
      setCargando(false);
    }
  }, [token]);

  useEffect(() => { cargar(); }, [cargar]);

  const vuelosActivos = useMemo(() => vuelos.filter((v) => v.estado !== 'CANCELADO'), [vuelos]);
  const puertasVisibles = useMemo(() => (panel?.puertas || []).filter((puerta) => {
    const texto = `${puerta.numero} ${puerta.zona || ''} ${puerta.vuelo?.codigo_vuelo || ''}`.toLowerCase();
    const coincideTexto = texto.includes(busqueda.trim().toLowerCase());
    const operativo = puerta.ocupada ? 'OCUPADA' : puerta.estado;
    return coincideTexto && (estado === 'TODOS' || operativo === estado);
  }), [panel, busqueda, estado]);

  const vueloSeleccionado = vuelos.find((v) => String(v.id_vuelo) === vueloId);
  const conflictos = vueloSeleccionado ? vuelosActivos.filter((v) =>
    v.id_vuelo !== vueloSeleccionado.id_vuelo &&
    String(v.id_puerta) === puertaId &&
    traslape(v, vueloSeleccionado)
  ) : [];

  const abrirAsignacion = (vuelo = null, puerta = null) => {
    setVueloId(vuelo ? String(vuelo.id_vuelo) : '');
    setPuertaId(puerta ? String(puerta.id_puerta) : '');
    setMotivo('');
    setError('');
    setModal({ tipo: 'asignar' });
  };

  const guardarAsignacion = async (evento) => {
    evento.preventDefault();
    if (!vueloId || !puertaId) { setError('Selecciona un vuelo y una puerta.'); return; }
    const vuelo = vuelos.find((v) => String(v.id_vuelo) === vueloId);
    const puerta = (panel?.puertas || []).find((p) => String(p.id_puerta) === puertaId);
    const confirma = window.confirm(`¿Asignar el vuelo ${vuelo?.codigo_vuelo} a la puerta ${puerta?.numero}? El backend validará el estado y los horarios.`);
    if (!confirma) return;
    setGuardando(true);
    setError('');
    setAviso('');
    try {
      await api(`/api/vuelos/${vueloId}/puerta`, {
        token,
        method: 'PATCH',
        body: { id_puerta: Number(puertaId), motivo: motivo.trim() || undefined },
      });
      setModal(null);
      setAviso(`Vuelo ${vuelo.codigo_vuelo} asignado a la puerta ${puerta?.numero}.`);
      await cargar();
    } catch (fallo) {
      const mensaje = fallo.message || 'El backend rechazó la asignación. La asignación anterior se conserva.';
      await cargar();
      setError(mensaje);
    } finally {
      setGuardando(false);
    }
  };

  const liberar = async (vuelo) => {
    if (!window.confirm(`¿Liberar la puerta del vuelo ${vuelo.codigo_vuelo}?`)) return;
    setGuardando(true);
    setError('');
    setAviso('');
    try {
      await api(`/api/vuelos/${vuelo.id_vuelo}/puerta`, {
        token,
        method: 'PATCH',
        body: { id_puerta: null, motivo: 'Puerta liberada desde gestión de puertas' },
      });
      setAviso(`Se liberó la puerta asignada al vuelo ${vuelo.codigo_vuelo}.`);
      await cargar();
    } catch (fallo) {
      const mensaje = fallo.message || 'No se pudo liberar la puerta.';
      await cargar();
      setError(mensaje);
    } finally {
      setGuardando(false);
    }
  };

  return <section className="gestion-seccion">
    <header className="gestion-vuelos__cabecera"><div><p className="eyebrow">Terminal</p><h1>Puertas de embarque</h1><p className="subtitulo">Consulta ocupación y horarios; la API valida disponibilidad y conflictos antes de guardar.</p></div><button type="button" className="boton boton--primario" onClick={() => abrirAsignacion()}>＋ Asignar vuelo</button></header>
    <div className="gestion-kpis"><article className="tarjeta"><span>Total de puertas</span><strong>{panel?.kpis?.puertas_total ?? '—'}</strong></article><article className="tarjeta"><span>Ocupadas ahora</span><strong>{panel?.kpis?.puertas_ocupadas ?? '—'}</strong></article><article className="tarjeta"><span>Disponibles</span><strong>{panel?.kpis?.puertas_disponibles ?? '—'}</strong></article><article className="tarjeta"><span>En mantenimiento</span><strong>{panel?.kpis?.puertas_mantenimiento ?? '—'}</strong></article></div>
    {aviso ? <p className="alerta alerta--exito" role="status">✓ {aviso}</p> : null}
    {error && !modal ? <p className="alerta alerta--error" role="alert">! {error}</p> : null}
    <section className="tarjeta gestion-mapa"><div className="tarjeta__cabecera"><div><h2>Mapa de terminal</h2><p className="subtitulo">{panel?.puertas?.length || 0} puertas recibidas del panel operativo.</p></div><button className="boton boton--secundario" type="button" onClick={cargar} disabled={cargando}>{cargando ? 'Actualizando…' : '↻ Actualizar'}</button></div>{panel?.puertas?.length ? <GateMap puertas={panel.puertas} /> : <p className="vacio" role={cargando ? 'status' : undefined}>{cargando ? 'Cargando puertas…' : 'No hay puertas disponibles.'}</p>}</section>
    <div className="gestion-filtros"><label className="campo"><span>Buscar puerta, vuelo o zona</span><input type="search" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Ej. A12, zona norte" /></label><label className="campo"><span>Estado operativo</span><select value={estado} onChange={(e) => setEstado(e.target.value)}><option value="TODOS">Todos</option><option value="DISPONIBLE">Disponible</option><option value="OCUPADA">Ocupada</option><option value="MANTENIMIENTO">Mantenimiento</option><option value="INACTIVA">Inactiva</option></select></label></div>
    <section className="tarjeta"><div className="tarjeta__cabecera"><div><h2>Detalle y horarios</h2><p className="subtitulo">Horarios tomados de los vuelos asociados; varias asignaciones pueden aparecer si son en horas distintas.</p></div><span className="contador">{puertasVisibles.length} de {panel?.puertas?.length || 0}</span></div>
      <div className="puertas-admin-grid">{puertasVisibles.map((puerta) => {
        const asignados = vuelosActivos.filter((v) => v.id_puerta === puerta.id_puerta).sort((a,b) => fechaHora(a,'salida') - fechaHora(b,'salida'));
        return <article className="tarjeta puerta-admin" key={puerta.id_puerta}><header><div><p className="eyebrow">Zona {puerta.zona || '—'}</p><h3>Puerta {puerta.numero}</h3></div><StatusBadge estado={puerta.ocupada ? 'OCUPADA' : puerta.estado} tipo="puerta" /></header>
          {asignados.length ? <ul className="puerta-admin__vuelos">{asignados.map((v) => <li key={v.id_vuelo}><div><strong>{v.codigo_vuelo}</strong><span>{textoRuta(v)}</span><small>{formatearFecha(v.fecha_salida)} · {formatearHora(v.hora_salida)}–{formatearHora(v.hora_llegada)}</small></div><div className="puerta-admin__acciones"><button className="boton boton--fantasma" type="button" onClick={() => setModal({ tipo:'detalle', vuelo:v, puerta })}>Detalles</button><button className="boton boton--fantasma" type="button" onClick={() => abrirAsignacion(v, puerta)}>Reasignar</button><button className="boton boton--fantasma boton--peligro" type="button" onClick={() => liberar(v)} disabled={guardando}>Liberar</button></div></li>)}</ul> : <p className="vacio">Sin vuelos asignados.</p>}
          <button className="boton boton--secundario" type="button" onClick={() => abrirAsignacion(null, puerta)} disabled={['MANTENIMIENTO','INACTIVA'].includes(puerta.estado)}>Asignar vuelo a esta puerta</button>
        </article>;
      })}</div>
    </section>
    {modal ? <div className="modal-fondo"><section className="modal-vuelo" role="dialog" aria-modal="true" aria-labelledby="titulo-puertas"><header className="modal-vuelo__cabecera"><div><p className="eyebrow">Operación de puerta</p><h2 id="titulo-puertas">{modal.tipo === 'detalle' ? `Vuelo ${modal.vuelo.codigo_vuelo}` : 'Asignar o reasignar vuelo'}</h2></div><button className="boton boton--fantasma" type="button" onClick={() => setModal(null)} disabled={guardando} aria-label="Cerrar">×</button></header>
      {error && <p className="alerta alerta--error" role="alert">! {error}</p>}
      {modal.tipo === 'detalle' ? <div className="detalle-vuelo"><p><strong>Puerta:</strong> {modal.puerta.numero} · {modal.puerta.zona || 'Sin zona'}</p><p><strong>Ruta:</strong> {textoRuta(modal.vuelo)}</p><p><strong>Salida:</strong> {formatearFecha(modal.vuelo.fecha_salida)} · {formatearHora(modal.vuelo.hora_salida)}</p><p><strong>Llegada:</strong> {formatearFecha(modal.vuelo.fecha_llegada)} · {formatearHora(modal.vuelo.hora_llegada)}</p><p><strong>Estado:</strong> {modal.vuelo.estado}</p><button className="boton boton--primario" type="button" onClick={() => setModal(null)}>Cerrar detalle</button></div> : <form className="formulario-vuelo" onSubmit={guardarAsignacion}>
        <label className="campo formulario-vuelo__ancho"><span>Vuelo *</span><select required value={vueloId} onChange={(e) => setVueloId(e.target.value)}><option value="">Selecciona un vuelo</option>{vuelosActivos.filter((v) => !['FINALIZADO','ATERRIZADO'].includes(v.estado)).map((v) => <option key={v.id_vuelo} value={v.id_vuelo}>{v.codigo_vuelo} · {textoRuta(v)} · {formatearFecha(v.fecha_salida)} {formatearHora(v.hora_salida)}</option>)}</select></label>
        <label className="campo formulario-vuelo__ancho"><span>Puerta *</span><select required value={puertaId} onChange={(e) => setPuertaId(e.target.value)}><option value="">Selecciona una puerta</option>{(panel?.puertas || []).filter((p) => !['MANTENIMIENTO','INACTIVA'].includes(p.estado)).map((p) => { const conflicto = vueloSeleccionado && vuelosActivos.some((v) => v.id_vuelo !== vueloSeleccionado.id_vuelo && v.id_puerta === p.id_puerta && traslape(v, vueloSeleccionado)); const etiqueta = conflicto ? 'conflicto de horario (validará el servidor)' : vueloSeleccionado ? 'sin conflicto detectado para este horario' : p.ocupada ? 'ocupada ahora; selecciona vuelo para validar' : 'selecciona vuelo para validar horario'; return <option key={p.id_puerta} value={p.id_puerta}>Puerta {p.numero} · {p.zona || 'sin zona'} · {etiqueta}</option>; })}</select></label>
        {conflictos.length ? <p className="alerta alerta--advertencia formulario-vuelo__ancho" role="status">Hay vuelo(s) con horario superpuesto en esa puerta. Puedes enviar el intento de prueba; el backend debe rechazarlo y la asignación vigente se conservará.</p> : null}
        <label className="campo formulario-vuelo__ancho"><span>Motivo (opcional)</span><input value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength="255" /></label>
        <p className="subtitulo formulario-vuelo__ancho">La API decide si la puerta está disponible en todo el intervalo del vuelo. Una selección visual no reserva ni modifica datos hasta confirmar.</p>
        <div className="modal-vuelo__acciones formulario-vuelo__ancho"><button className="boton boton--secundario" type="button" onClick={() => setModal(null)} disabled={guardando}>Cancelar</button><button className="boton boton--primario" type="submit" disabled={guardando || !vueloId || !puertaId}>{guardando ? 'Guardando…' : 'Confirmar asignación'}</button></div>
      </form>}
    </section></div> : null}
  </section>;
}
