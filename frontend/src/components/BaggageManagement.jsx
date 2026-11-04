import { useCallback, useEffect, useMemo, useState } from 'react';

import { api, formatearFecha, formatearHora, formatearNumero } from '../api';
import StatusBadge from './StatusBadge';

const ESTADOS = ['REGISTRADO', 'EN_TRANSITO', 'EN_BANDA', 'CARGADO', 'TRANSFERIDO', 'ENTREGADO', 'EXTRAVIADO', 'DANADO'];
const idTexto = (x) => x === null || x === undefined ? '' : String(x);
const aeropuerto = (a) => a ? [a.codigo_iata, a.ciudad || a.nombre].filter(Boolean).join(' · ') : '—';
const pasajeroNombre = (p) => p ? [p.nombres, p.apellidos].filter(Boolean).join(' ') || `Pasajero ${p.id_pasajero}` : '—';
const ordenTramo = (a, b) => Number(a.orden_vuelo || 0) - Number(b.orden_vuelo || 0);

export default function BaggageManagement({ token }) {
  const [equipajes, setEquipajes] = useState([]);
  const [pasajeros, setPasajeros] = useState([]);
  const [aeropuertos, setAeropuertos] = useState([]);
  const [bandas, setBandas] = useState([]);
  const [vuelos, setVuelos] = useState([]);
  const [tramos, setTramos] = useState([]);
  const [escalas, setEscalas] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState('TODOS');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ codigo_equipaje: '', id_pasajero: '', peso: '', origen: '', destino_final: '', observaciones: '' });
  const [idBanda, setIdBanda] = useState('');
  const [idVuelo, setIdVuelo] = useState('');
  const [bandaOrigen, setBandaOrigen] = useState('');
  const [bandaDestino, setBandaDestino] = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const [bags, pax, airports, belts, flights, legs, scales] = await Promise.all([
        api('/api/equipajes', { token }),
        api('/api/pasajeros', { token }),
        api('/api/aeropuertos', { token }),
        api('/api/bandas-equipaje', { token }),
        api('/api/vuelos', { token }),
        api('/api/equipaje-vuelo', { token }),
        api('/api/escalas', { token }),
      ]);
      setEquipajes(Array.isArray(bags) ? bags : []);
      setPasajeros(Array.isArray(pax) ? pax : []);
      setAeropuertos(Array.isArray(airports) ? airports : []);
      setBandas(Array.isArray(belts) ? belts : []);
      setVuelos(Array.isArray(flights) ? flights : []);
      setTramos(Array.isArray(legs) ? legs : []);
      setEscalas(Array.isArray(scales) ? scales : []);
    } catch (fallo) {
      setError(fallo.message || 'No se pudo cargar la información de equipaje.');
    } finally {
      setCargando(false);
    }
  }, [token]);

  useEffect(() => { cargar(); }, [cargar]);

  const tramosDe = (bag) => tramos.filter((t) => Number(t.id_equipaje) === Number(bag.id_equipaje)).sort(ordenTramo);
  const equipajesVisibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return equipajes.filter((bag) => {
      const relacionados = tramos.filter((t) => Number(t.id_equipaje) === Number(bag.id_equipaje));
      const texto = `${bag.codigo_equipaje} ${pasajeroNombre(bag.pasajero)} ${aeropuerto(bag.aeropuertoOrigen)} ${aeropuerto(bag.aeropuertoDestino)} ${relacionados.map((t) => t.vuelo?.codigo_vuelo).join(' ')}`.toLowerCase();
      return (!q || texto.includes(q)) && (estado === 'TODOS' || bag.estado === estado);
    });
  }, [equipajes, tramos, busqueda, estado]);

  const enTransito = equipajes.filter((e) => e.estado === 'EN_TRANSITO').length;
  const conBanda = equipajes.filter((e) => e.id_banda_actual !== null && e.id_banda_actual !== undefined).length;
  const activos = bandas.filter((b) => b.estado === 'DISPONIBLE');
  const estadosConteo = ESTADOS.map((clave) => ({ clave, cantidad: equipajes.filter((e) => e.estado === clave).length })).filter((e) => e.cantidad > 0);
  const conteoPorVuelo = useMemo(() => {
    const acumulado = new Map();
    tramos.forEach((tramo) => {
      const key = Number(tramo.id_vuelo);
      const anterior = acumulado.get(key) || { vuelo: tramo.vuelo, total: 0 };
      anterior.total += 1;
      acumulado.set(key, anterior);
    });
    return [...acumulado.values()].sort((a, b) => String(a.vuelo?.codigo_vuelo || '').localeCompare(String(b.vuelo?.codigo_vuelo || '')));
  }, [tramos]);

  const openCreate = () => {
    setForm({ codigo_equipaje: '', id_pasajero: '', peso: '', origen: '', destino_final: '', observaciones: '' });
    setError(''); setModal({ tipo: 'nuevo' });
  };

  const guardarNuevo = async (event) => {
    event.preventDefault(); setError(''); setAviso('');
    if (equipajes.some((e) => e.codigo_equipaje.toLowerCase() === form.codigo_equipaje.trim().toLowerCase())) { setError('Ya existe un equipaje con ese código.'); return; }
    if (form.origen === form.destino_final) { setError('El origen y el destino final deben ser distintos.'); return; }
    setGuardando(true);
    const body = { codigo_equipaje: form.codigo_equipaje.trim(), id_pasajero: Number(form.id_pasajero), origen: Number(form.origen), destino_final: Number(form.destino_final), ...(form.peso === '' ? {} : { peso: Number(form.peso) }), observaciones: form.observaciones.trim() || null };
    try {
      await api('/api/equipajes', { token, method: 'POST', body });
      setModal(null); setAviso(`Equipaje ${body.codigo_equipaje} registrado.`); await cargar();
    } catch (fallo) { setError(fallo.message || 'No se pudo registrar el equipaje.'); }
    finally { setGuardando(false); }
  };

  const guardarEdicion = async (event) => {
    event.preventDefault(); setGuardando(true); setError(''); setAviso('');
    const bag = modal.equipaje;
    const body = { peso: form.peso === '' ? null : Number(form.peso), observaciones: form.observaciones.trim() || null };
    try {
      await api(`/api/equipajes/${bag.id_equipaje}`, { token, method: 'PUT', body });
      setModal(null); setAviso(`Se actualizaron los datos editables de ${bag.codigo_equipaje}.`); await cargar();
    } catch (fallo) { setError(fallo.message || 'No se pudo actualizar el equipaje.'); }
    finally { setGuardando(false); }
  };

  const asignarBanda = async (event) => {
    event.preventDefault(); if (!idBanda) { setError('Selecciona una banda disponible.'); return; }
    setGuardando(true); setError(''); setAviso('');
    try {
      const banda = bandas.find((b) => String(b.id_banda) === idBanda);
      await api(`/api/equipajes/${modal.equipaje.id_equipaje}/banda`, { token, method: 'PATCH', body: { id_banda: Number(idBanda) } });
      setModal(null); setAviso(`${modal.equipaje.codigo_equipaje} se asignó a la banda ${banda?.numero}.`); await cargar();
    } catch (fallo) { setError(fallo.message || 'No se pudo asignar la banda.'); }
    finally { setGuardando(false); }
  };

  const registrarTramo = async (event) => {
    event.preventDefault(); if (!idVuelo) { setError('Selecciona el vuelo del tramo.'); return; }
    setGuardando(true); setError(''); setAviso('');
    const bag = modal.equipaje;
    const flight = vuelos.find((v) => String(v.id_vuelo) === idVuelo);
    try {
      await api(`/api/equipajes/${bag.id_equipaje}/tramos`, { token, method: 'POST', body: { id_vuelo: Number(idVuelo), id_banda_origen: bandaOrigen ? Number(bandaOrigen) : null, id_banda_destino: bandaDestino ? Number(bandaDestino) : null } });
      setModal(null); setAviso(`Se agregó el tramo ${flight?.codigo_vuelo} al equipaje ${bag.codigo_equipaje}.`); await cargar();
    } catch (fallo) { setError(fallo.message || 'No se pudo registrar el tramo. Revisa continuidad de ruta y estado del vuelo.'); }
    finally { setGuardando(false); }
  };

  const abrirTramo = (bag) => {
    const legs = tramosDe(bag);
    const ultimoVuelo = legs.at(-1)?.vuelo;
    const origenSiguiente = ultimoVuelo ? ultimoVuelo.id_aeropuerto_destino : bag.origen;
    setIdVuelo(''); setBandaOrigen(''); setBandaDestino(''); setError('');
    setModal({ tipo: 'tramo', equipaje: bag, origenSiguiente });
  };

  const vuelosContinuos = modal?.tipo === 'tramo' ? vuelos.filter((v) => Number(v.id_aeropuerto_origen) === Number(modal.origenSiguiente) && ['PROGRAMADO','RETRASADO','ABORDANDO','ABORDADO'].includes(v.estado) && !tramos.some((t) => Number(t.id_equipaje) === Number(modal.equipaje.id_equipaje) && Number(t.id_vuelo) === Number(v.id_vuelo))) : [];

  const escalasRelacionadas = (bag) => {
    const idsVuelo = new Set(tramosDe(bag).map((t) => Number(t.id_vuelo)));
    return escalas.filter((e) => idsVuelo.has(Number(e.id_vuelo)) && Number(e.itinerario?.id_pasajero) === Number(bag.id_pasajero));
  };

  return <section className="gestion-seccion">
    <header className="gestion-vuelos__cabecera"><div><p className="eyebrow">Equipaje</p><h1>Gestión de equipaje</h1><p className="subtitulo">Consulta registros y trazabilidad; cada tramo conserva la cadena de custodia del equipaje.</p></div><button className="boton boton--primario" type="button" onClick={openCreate}>＋ Registrar equipaje</button></header>
    <div className="gestion-kpis"><article className="tarjeta"><span>Equipajes registrados</span><strong>{formatearNumero(equipajes.length)}</strong></article><article className="tarjeta"><span>En tránsito</span><strong>{formatearNumero(enTransito)}</strong></article><article className="tarjeta"><span>En banda</span><strong>{formatearNumero(conBanda)}</strong></article><article className="tarjeta"><span>Tramos registrados</span><strong>{formatearNumero(tramos.length)}</strong></article></div>
    <section className="tarjeta conteo-vuelos"><div className="tarjeta__cabecera"><div><h2>Equipajes asociados por vuelo</h2><p className="subtitulo">Conteo calculado a partir de los tramos registrados en el backend.</p></div></div>{conteoPorVuelo.length ? <div className="tabla-scroll"><table className="tabla"><thead><tr><th>Vuelo</th><th>Ruta</th><th>Salida</th><th>Equipajes en este tramo</th></tr></thead><tbody>{conteoPorVuelo.map((item) => <tr key={item.vuelo?.id_vuelo}><td className="celda-fuerte">{item.vuelo?.codigo_vuelo || '—'}</td><td>{aeropuerto(item.vuelo?.aeropuerto_origen)} → {aeropuerto(item.vuelo?.aeropuerto_destino)}</td><td>{formatearFecha(item.vuelo?.fecha_salida)} · {formatearHora(item.vuelo?.hora_salida)}</td><td>{formatearNumero(item.total)}</td></tr>)}</tbody></table></div> : <p className="vacio">Aún no hay tramos de equipaje vinculados a vuelos.</p>}</section>
    {aviso ? <p className="alerta alerta--exito" role="status">✓ {aviso}</p> : null}{error && !modal ? <p className="alerta alerta--error" role="alert">! {error}</p> : null}
    <div className="equipaje-estados" aria-label="Conteo por estado">{estadosConteo.map((item) => <span key={item.clave}><StatusBadge estado={item.clave} /> <strong>{item.cantidad}</strong></span>)}</div>
    <div className="gestion-filtros"><label className="campo"><span>Buscar</span><input type="search" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Código, pasajero, destino o vuelo" /></label><label className="campo"><span>Estado</span><select value={estado} onChange={(e) => setEstado(e.target.value)}><option value="TODOS">Todos</option>{ESTADOS.map((x) => <option key={x}>{x}</option>)}</select></label><button className="boton boton--secundario" type="button" onClick={cargar} disabled={cargando}>{cargando ? 'Actualizando…' : '↻ Actualizar'}</button></div>
    {error && !equipajes.length && !cargando ? <p className="alerta alerta--error" role="alert">! {error}</p> : null}
    {cargando && !equipajes.length ? <p className="tarjeta vacio" role="status">Cargando equipajes…</p> : null}
    {!cargando && !equipajesVisibles.length ? <p className="tarjeta vacio">No hay equipajes que coincidan con los filtros.</p> : null}
    <div className="equipaje-lista">{equipajesVisibles.map((bag) => {
      const legs = tramosDe(bag);
      const escalasBag = escalasRelacionadas(bag);
      const nombreVuelo = legs.map((t) => t.vuelo?.codigo_vuelo).filter(Boolean).join(' → ');
      return <article className="tarjeta equipaje-item" key={bag.id_equipaje}><header className="equipaje-item__cabecera"><div><p className="eyebrow">Etiqueta de equipaje</p><h2>{bag.codigo_equipaje}</h2><p>{pasajeroNombre(bag.pasajero)}</p></div><StatusBadge estado={bag.estado} /></header>
        <div className="equipaje-item__datos"><p><span>Origen</span><strong>{aeropuerto(bag.aeropuertoOrigen)}</strong></p><p><span>Destino final</span><strong>{aeropuerto(bag.aeropuertoDestino)}</strong></p><p><span>Banda actual</span><strong>{bag.bandaActual?.numero || 'Sin asignar'}</strong></p><p><span>Vuelos asociados</span><strong>{nombreVuelo || 'Sin tramo registrado'}</strong></p><p><span>Peso</span><strong>{bag.peso === null || bag.peso === undefined ? '—' : `${bag.peso} kg`}</strong></p><p><span>Equipajes en vuelo(s)</span><strong>{legs.length ? legs.length : '—'} tramo(s)</strong></p></div>
        {legs.length ? <div className="trazabilidad"><strong>Ruta registrada</strong><ol>{legs.map((t) => <li key={t.id_equipaje_vuelo}><span>{t.vuelo?.codigo_vuelo || `Vuelo ${t.id_vuelo}`}</span><small>{aeropuerto(t.vuelo?.aeropuerto_origen)} → {aeropuerto(t.vuelo?.aeropuerto_destino)} · {formatearFecha(t.vuelo?.fecha_salida)} {formatearHora(t.vuelo?.hora_salida)}</small>{t.bandaOrigen?.numero || t.bandaDestino?.numero ? <small>Banda origen {t.bandaOrigen?.numero || '—'} · destino {t.bandaDestino?.numero || '—'}</small> : null}</li>)}</ol></div> : null}
        {escalasBag.length ? <div className="equipaje-escalas"><strong>Escalas del itinerario relacionado</strong>{escalasBag.map((e) => <span key={e.id_escala}>{e.numero_escala}. {aeropuerto(e.aeropuertoLlegada)} → {aeropuerto(e.aeropuertoSalida)} · puerta {e.puertaSalida?.numero || 'por asignar'}</span>)}</div> : null}
        {bag.observaciones ? <p className="equipaje-item__nota">{bag.observaciones}</p> : null}
        <div className="equipaje-item__acciones"><button type="button" className="boton boton--secundario" onClick={() => setModal({ tipo: 'detalle', equipaje: bag })}>Ver detalle</button><button type="button" className="boton boton--fantasma" onClick={() => { setForm({ peso: idTexto(bag.peso), observaciones: bag.observaciones || '' }); setError(''); setModal({ tipo: 'editar', equipaje: bag }); }}>Editar peso/observaciones</button><button type="button" className="boton boton--fantasma" onClick={() => { setIdBanda(''); setError(''); setModal({ tipo: 'banda', equipaje: bag }); }} disabled={bag.estado === 'ENTREGADO'}>Asignar banda</button><button type="button" className="boton boton--fantasma" onClick={() => abrirTramo(bag)} disabled={bag.estado === 'ENTREGADO'}>＋ Añadir vuelo de conexión</button></div>
      </article>;
    })}</div>
    <p className="limitacion-api">El backend permite añadir tramos nuevos, pero no ofrece editar/eliminar un tramo ni cambiar el destino final del equipaje. Los controles de destino no se muestran para evitar aparentar una operación inexistente.</p>

    {modal ? <div className="modal-fondo"><section className="modal-vuelo" role="dialog" aria-modal="true" aria-labelledby="titulo-equipaje"><header className="modal-vuelo__cabecera"><div><p className="eyebrow">Operación de equipaje</p><h2 id="titulo-equipaje">{modal.tipo === 'nuevo' ? 'Registrar equipaje' : modal.tipo === 'editar' ? `Editar ${modal.equipaje.codigo_equipaje}` : modal.tipo === 'banda' ? `Asignar banda · ${modal.equipaje.codigo_equipaje}` : modal.tipo === 'tramo' ? `Añadir tramo · ${modal.equipaje.codigo_equipaje}` : `Detalle · ${modal.equipaje.codigo_equipaje}`}</h2></div><button className="boton boton--fantasma" type="button" onClick={() => setModal(null)} disabled={guardando} aria-label="Cerrar">×</button></header>
      {error ? <p className="alerta alerta--error" role="alert">! {error}</p> : null}
      {modal.tipo === 'detalle' ? <div className="detalle-vuelo"><p><strong>Pasajero:</strong> {pasajeroNombre(modal.equipaje.pasajero)}</p><p><strong>Origen:</strong> {aeropuerto(modal.equipaje.aeropuertoOrigen)}</p><p><strong>Destino final:</strong> {aeropuerto(modal.equipaje.aeropuertoDestino)}</p><p><strong>Estado:</strong> {modal.equipaje.estado}</p><p><strong>Banda:</strong> {modal.equipaje.bandaActual?.numero || 'Sin asignar'}</p><p><strong>Observaciones:</strong> {modal.equipaje.observaciones || '—'}</p><button className="boton boton--primario" type="button" onClick={() => setModal(null)}>Cerrar</button></div> : null}
      {modal.tipo === 'nuevo' ? <form className="formulario-vuelo" onSubmit={guardarNuevo}><label className="campo"><span>Código de equipaje *</span><input value={form.codigo_equipaje} onChange={(e) => setForm({ ...form, codigo_equipaje: e.target.value })} maxLength="50" required /></label><label className="campo"><span>Pasajero *</span><select value={form.id_pasajero} onChange={(e) => setForm({ ...form, id_pasajero: e.target.value })} required><option value="">Selecciona pasajero</option>{pasajeros.map((p) => <option key={p.id_pasajero} value={p.id_pasajero}>{pasajeroNombre(p)}</option>)}</select></label><label className="campo"><span>Origen *</span><select value={form.origen} onChange={(e) => setForm({ ...form, origen: e.target.value })} required><option value="">Selecciona aeropuerto</option>{aeropuertos.map((a) => <option key={a.id_aeropuerto} value={a.id_aeropuerto}>{aeropuerto(a)}</option>)}</select></label><label className="campo"><span>Destino final *</span><select value={form.destino_final} onChange={(e) => setForm({ ...form, destino_final: e.target.value })} required><option value="">Selecciona aeropuerto</option>{aeropuertos.map((a) => <option key={a.id_aeropuerto} value={a.id_aeropuerto}>{aeropuerto(a)}</option>)}</select></label><label className="campo"><span>Peso (kg)</span><input type="number" min="0" max="9999" step="0.01" value={form.peso} onChange={(e) => setForm({ ...form, peso: e.target.value })} /></label><label className="campo formulario-vuelo__ancho"><span>Observaciones</span><textarea maxLength="2000" rows="3" value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} /></label><div className="modal-vuelo__acciones formulario-vuelo__ancho"><button className="boton boton--secundario" type="button" onClick={() => setModal(null)} disabled={guardando}>Cancelar</button><button className="boton boton--primario" type="submit" disabled={guardando}>{guardando ? 'Registrando…' : 'Registrar equipaje'}</button></div></form> : null}
      {modal.tipo === 'editar' ? <form className="formulario-vuelo" onSubmit={guardarEdicion}><label className="campo"><span>Peso (kg)</span><input type="number" min="0" max="9999" step="0.01" value={form.peso} onChange={(e) => setForm({ ...form, peso: e.target.value })} /></label><label className="campo formulario-vuelo__ancho"><span>Observaciones</span><textarea maxLength="2000" rows="4" value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} /></label><p className="subtitulo formulario-vuelo__ancho">El backend solo admite editar peso y observaciones; pasajero, origen, destino y código permanecen sin controles de edición.</p><div className="modal-vuelo__acciones formulario-vuelo__ancho"><button className="boton boton--secundario" type="button" onClick={() => setModal(null)} disabled={guardando}>Cancelar</button><button className="boton boton--primario" type="submit" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar cambios'}</button></div></form> : null}
      {modal.tipo === 'banda' ? <form className="formulario-vuelo" onSubmit={asignarBanda}><p className="subtitulo formulario-vuelo__ancho">Al asignar una banda, el backend cambia el equipaje al estado EN_BANDA y notifica al pasajero.</p><label className="campo formulario-vuelo__ancho"><span>Banda disponible *</span><select value={idBanda} onChange={(e) => setIdBanda(e.target.value)} required><option value="">Selecciona banda</option>{activos.map((b) => <option key={b.id_banda} value={b.id_banda}>Banda {b.numero}{b.zona ? ` · ${b.zona}` : ''}</option>)}</select></label><div className="modal-vuelo__acciones formulario-vuelo__ancho"><button className="boton boton--secundario" type="button" onClick={() => setModal(null)} disabled={guardando}>Cancelar</button><button className="boton boton--primario" type="submit" disabled={guardando || !idBanda}>{guardando ? 'Asignando…' : 'Confirmar banda'}</button></div></form> : null}
      {modal.tipo === 'tramo' ? <form className="formulario-vuelo" onSubmit={registrarTramo}><p className="subtitulo formulario-vuelo__ancho">Siguiente tramo: el vuelo debe salir de {aeropuertos.find((a) => Number(a.id_aeropuerto) === Number(modal.origenSiguiente))?.codigo_iata || 'el destino del tramo anterior'}. La API valida continuidad y estado.</p><label className="campo formulario-vuelo__ancho"><span>Vuelo de conexión *</span><select value={idVuelo} onChange={(e) => setIdVuelo(e.target.value)} required><option value="">Selecciona vuelo</option>{vuelosContinuos.map((v) => <option key={v.id_vuelo} value={v.id_vuelo}>{v.codigo_vuelo} · {aeropuerto(v.aeropuerto_origen)} → {aeropuerto(v.aeropuerto_destino)} · {formatearFecha(v.fecha_salida)} {formatearHora(v.hora_salida)}</option>)}</select>{!vuelosContinuos.length ? <small>No se encontraron vuelos disponibles que continúen esta ruta.</small> : null}</label><label className="campo"><span>Banda de origen (opcional)</span><select value={bandaOrigen} onChange={(e) => setBandaOrigen(e.target.value)}><option value="">Sin banda</option>{activos.map((b) => <option key={b.id_banda} value={b.id_banda}>{b.numero}</option>)}</select></label><label className="campo"><span>Banda de destino (opcional)</span><select value={bandaDestino} onChange={(e) => setBandaDestino(e.target.value)}><option value="">Sin banda</option>{activos.map((b) => <option key={b.id_banda} value={b.id_banda}>{b.numero}</option>)}</select></label><div className="modal-vuelo__acciones formulario-vuelo__ancho"><button className="boton boton--secundario" type="button" onClick={() => setModal(null)} disabled={guardando}>Cancelar</button><button className="boton boton--primario" type="submit" disabled={guardando || !idVuelo}>{guardando ? 'Registrando…' : 'Registrar tramo'}</button></div></form> : null}
    </section></div> : null}
  </section>;
}
