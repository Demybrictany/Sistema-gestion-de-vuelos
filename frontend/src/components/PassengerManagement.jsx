import { useCallback, useEffect, useMemo, useState } from 'react';

import { api, formatearFecha } from '../api';

const FORM_VACIO = {
  nombres: '', apellidos: '', pasaporte: '', fecha_nacimiento: '',
  nacionalidad: '', correo: '', telefono: '', estado: 'ACTIVO',
};

const valor = (dato) => dato ?? '';

export default function PassengerManagement({ token }) {
  const [pasajeros, setPasajeros] = useState([]);
  const [vuelos, setVuelos] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [modal, setModal] = useState(null);
  const [formulario, setFormulario] = useState(FORM_VACIO);
  const [vueloSeleccionado, setVueloSeleccionado] = useState('');
  const [asiento, setAsiento] = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const [listaPasajeros, listaVuelos, listaAsignaciones] = await Promise.all([
        api('/api/pasajeros', { token }),
        api('/api/vuelos', { token }),
        api('/api/pasajero-vuelo', { token }),
      ]);
      setPasajeros(Array.isArray(listaPasajeros) ? listaPasajeros : []);
      setVuelos(Array.isArray(listaVuelos) ? listaVuelos : []);
      setAsignaciones(Array.isArray(listaAsignaciones) ? listaAsignaciones : []);
    } catch (fallo) {
      setError(fallo.message || 'No se pudieron cargar los pasajeros.');
    } finally {
      setCargando(false);
    }
  }, [token]);

  useEffect(() => { cargar(); }, [cargar]);

  const visibles = useMemo(() => {
    const filtro = busqueda.trim().toLocaleLowerCase();
    return pasajeros.filter((p) => !filtro ||
      `${p.nombres || ''} ${p.apellidos || ''} ${p.pasaporte || ''} ${p.correo || ''}`
        .toLocaleLowerCase().includes(filtro));
  }, [pasajeros, busqueda]);

  const abrirFormulario = (pasajero = null) => {
    setError('');
    setAviso('');
    setFormulario(pasajero
      ? Object.fromEntries(Object.keys(FORM_VACIO).map((key) => [key, valor(pasajero[key])]))
      : { ...FORM_VACIO });
    setModal({ tipo: 'formulario', pasajero });
  };

  const guardarPasajero = async (evento) => {
    evento.preventDefault();
    setError('');
    setAviso('');
    setGuardando(true);
    const body = Object.fromEntries(Object.entries(formulario).map(([key, dato]) => [
      key, typeof dato === 'string' ? (dato.trim() || null) : dato,
    ]));
    try {
      const existente = modal.pasajero;
      await api(existente ? `/api/pasajeros/${existente.id_pasajero}` : '/api/pasajeros', {
        token, method: existente ? 'PUT' : 'POST', body,
      });
      setModal(null);
      setAviso(existente ? 'Pasajero actualizado.' : 'Pasajero registrado.');
      await cargar();
    } catch (fallo) {
      setError(fallo.message || 'No se pudo guardar el pasajero.');
    } finally {
      setGuardando(false);
    }
  };

  const asignarVuelo = async (evento) => {
    evento.preventDefault();
    setError('');
    setAviso('');
    if (!vueloSeleccionado) { setError('Selecciona un vuelo.'); return; }
    setGuardando(true);
    try {
      await api('/api/pasajero-vuelo', {
        token, method: 'POST', body: {
          id_pasajero: modal.pasajero.id_pasajero,
          id_vuelo: Number(vueloSeleccionado),
          numero_asiento: asiento.trim() || null,
        },
      });
      setModal(null);
      setAviso('Pasajero asociado al vuelo.');
      await cargar();
    } catch (fallo) {
      setError(fallo.message || 'No se pudo asociar el pasajero.');
    } finally {
      setGuardando(false);
    }
  };

  const registrosDe = (p) => asignaciones.filter((a) =>
    Number(a.id_pasajero) === Number(p.id_pasajero) && a.estado !== 'CANCELADO');
  const campo = (etiqueta, key, props = {}) => (
    <label className="campo" key={key}>
      <span>{etiqueta}</span>
      <input name={key} value={formulario[key]} onChange={(e) => setFormulario((f) => ({ ...f, [key]: e.target.value }))} {...props} />
    </label>
  );

  return (
    <section className="modulo-personas">
      <div className="modulo-personas__encabezado">
        <div><p className="eyebrow">Punto 4 · Gestión de pasajeros</p><h1>Pasajeros</h1><p className="subtitulo">Registro, consulta y asignación de pasajeros a vuelos.</p></div>
        <button className="boton boton--primario" type="button" onClick={() => abrirFormulario()}>Nuevo pasajero</button>
      </div>
      {aviso && <p className="alerta alerta--exito" role="status">{aviso}</p>}
      {error && !modal && <p className="alerta alerta--error" role="alert">{error}</p>}
      <div className="modulo-personas__resumen"><article className="tarjeta"><span>Pasajeros registrados</span><strong>{pasajeros.length}</strong></article><article className="tarjeta"><span>Asignaciones activas</span><strong>{asignaciones.filter((a) => a.estado !== 'CANCELADO').length}</strong></article></div>
      <section className="tarjeta">
        <div className="modulo-personas__filtros"><label className="campo"><span>Buscar por nombre, pasaporte o correo</span><input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Escribe para buscar" /></label><button type="button" className="boton boton--secundario" onClick={cargar} disabled={cargando}>Actualizar</button></div>
        {cargando ? <p role="status">Cargando pasajeros…</p> : visibles.length === 0 ? <p className="estado-vacio">{pasajeros.length ? 'No hay resultados para la búsqueda.' : 'Aún no hay pasajeros registrados.'}</p> : (
          <div className="tabla-contenedor"><table className="tabla"><thead><tr><th>Pasajero</th><th>Pasaporte</th><th>Contacto</th><th>Estado</th><th>Vuelos asociados</th><th>Acciones</th></tr></thead><tbody>
            {visibles.map((p) => { const vuelosPersona = registrosDe(p); return <tr key={p.id_pasajero}><td><strong>{p.nombres} {p.apellidos}</strong><small>{p.nacionalidad || 'Nacionalidad no indicada'}</small></td><td>{p.pasaporte}</td><td>{p.correo || p.telefono || '—'}</td><td>{p.estado || '—'}</td><td>{vuelosPersona.length}</td><td className="modulo-personas__acciones"><button className="boton boton--fantasma" type="button" onClick={() => setModal({ tipo: 'detalle', pasajero: p })}>Ver detalles</button><button className="boton boton--fantasma" type="button" onClick={() => abrirFormulario(p)}>Editar</button><button className="boton boton--fantasma" type="button" disabled={p.estado !== 'ACTIVO'} title={p.estado !== 'ACTIVO' ? 'Solo pasajeros activos pueden asociarse a un vuelo' : undefined} onClick={() => { setError(''); setVueloSeleccionado(''); setAsiento(''); setModal({ tipo: 'asignar', pasajero: p }); }}>Asociar vuelo</button></td></tr>; })}
          </tbody></table></div>
        )}
      </section>
      {modal && <div className="modal-fondo" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget && !guardando) setModal(null); }}><section className="modal-personas tarjeta" role="dialog" aria-modal="true" aria-labelledby="modal-personas-titulo">
        <div className="tarjeta__cabecera"><div><p className="eyebrow">Pasajeros</p><h2 id="modal-personas-titulo">{modal.tipo === 'formulario' ? (modal.pasajero ? 'Editar pasajero' : 'Nuevo pasajero') : modal.tipo === 'detalle' ? 'Detalle del pasajero' : 'Asociar a un vuelo'}</h2></div><button className="boton boton--fantasma" type="button" onClick={() => setModal(null)} disabled={guardando} aria-label="Cerrar">×</button></div>
        {error && <p className="alerta alerta--error" role="alert">{error}</p>}
        {modal.tipo === 'formulario' && <form className="formulario-personas" onSubmit={guardarPasajero}>
          {campo('Nombres *', 'nombres', { required: true, maxLength: 100 })}{campo('Apellidos *', 'apellidos', { required: true, maxLength: 100 })}{campo('Pasaporte *', 'pasaporte', { required: true, maxLength: 50 })}{campo('Fecha de nacimiento', 'fecha_nacimiento', { type: 'date' })}{campo('Nacionalidad', 'nacionalidad', { maxLength: 80 })}{campo('Correo', 'correo', { type: 'email' })}{campo('Teléfono', 'telefono', { maxLength: 30 })}
          <label className="campo"><span>Estado</span><select name="estado" value={formulario.estado} onChange={(e) => setFormulario((f) => ({ ...f, estado: e.target.value }))}><option>ACTIVO</option><option>INACTIVO</option></select></label>
          <div className="formulario-personas__acciones"><button className="boton boton--secundario" type="button" onClick={() => setModal(null)} disabled={guardando}>Cancelar</button><button className="boton boton--primario" type="submit" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar pasajero'}</button></div>
        </form>}
        {modal.tipo === 'detalle' && <><dl className="detalle-persona"><dt>Nombre</dt><dd>{modal.pasajero.nombres} {modal.pasajero.apellidos}</dd><dt>Pasaporte</dt><dd>{modal.pasajero.pasaporte}</dd><dt>Fecha de nacimiento</dt><dd>{formatearFecha(modal.pasajero.fecha_nacimiento)}</dd><dt>Nacionalidad</dt><dd>{modal.pasajero.nacionalidad || '—'}</dd><dt>Correo / teléfono</dt><dd>{modal.pasajero.correo || '—'} · {modal.pasajero.telefono || '—'}</dd><dt>Estado</dt><dd>{modal.pasajero.estado || '—'}</dd><dt>Vuelos asociados</dt><dd>{registrosDe(modal.pasajero).length ? <ul>{registrosDe(modal.pasajero).map((a) => <li key={a.id_pasajero_vuelo}>{a.vuelo?.codigo_vuelo || `Vuelo ${a.id_vuelo}`} · {a.estado || 'RESERVADO'}{a.numero_asiento ? ` · Asiento ${a.numero_asiento}` : ''}</li>)}</ul> : 'Sin vuelos asociados'}</dd></dl></>}
        {modal.tipo === 'asignar' && <form className="formulario-personas formulario-personas--una-columna" onSubmit={asignarVuelo}><p>Pasajero: <strong>{modal.pasajero.nombres} {modal.pasajero.apellidos}</strong></p><label className="campo"><span>Vuelo *</span><select value={vueloSeleccionado} onChange={(e) => setVueloSeleccionado(e.target.value)} required><option value="">Selecciona un vuelo</option>{vuelos.filter((v) => ['PROGRAMADO', 'RETRASADO', 'ABORDANDO', 'ABORDADO'].includes(v.estado)).map((v) => <option key={v.id_vuelo} value={v.id_vuelo}>{v.codigo_vuelo} · {v.estado} · {v.fecha_salida} {v.hora_salida}</option>)}</select></label><label className="campo"><span>Asiento (opcional)</span><input value={asiento} onChange={(e) => setAsiento(e.target.value)} maxLength={10} /></label><p className="subtitulo">El servidor valida cupo, duplicados y disponibilidad de asiento.</p><div className="formulario-personas__acciones"><button className="boton boton--secundario" type="button" onClick={() => setModal(null)} disabled={guardando}>Cancelar</button><button className="boton boton--primario" type="submit" disabled={guardando}>{guardando ? 'Asociando…' : 'Asociar pasajero'}</button></div></form>}
      </section></div>}
    </section>
  );
}
