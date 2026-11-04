import { useCallback, useEffect, useMemo, useState } from 'react';

import { api, formatearFecha, formatearHora } from '../api';
import StatusBadge from './StatusBadge';

const fechaHoy = () => new Date().toISOString().slice(0, 10);

const formularioVacio = () => ({
  codigo_vuelo: '',
  id_aeropuerto_origen: '',
  id_aeropuerto_destino: '',
  fecha_salida: fechaHoy(),
  hora_salida: '',
  fecha_llegada: fechaHoy(),
  hora_llegada: '',
  id_puerta: '',
  capacidad_pasajeros: '',
  observaciones: '',
});

const idNumero = (valor) => (valor === null || valor === undefined ? '' : String(valor));

function datosVuelo(vuelo) {
  return {
    codigo_vuelo: vuelo.codigo_vuelo || '',
    id_aeropuerto_origen: idNumero(vuelo.id_aeropuerto_origen),
    id_aeropuerto_destino: idNumero(vuelo.id_aeropuerto_destino),
    fecha_salida: String(vuelo.fecha_salida || '').slice(0, 10),
    hora_salida: String(vuelo.hora_salida || '').slice(0, 5),
    fecha_llegada: String(vuelo.fecha_llegada || '').slice(0, 10),
    hora_llegada: String(vuelo.hora_llegada || '').slice(0, 5),
    id_puerta: idNumero(vuelo.id_puerta),
    capacidad_pasajeros: idNumero(vuelo.capacidad_pasajeros),
    observaciones: vuelo.observaciones || '',
  };
}

function nombreAeropuerto(aeropuerto) {
  if (!aeropuerto) return '—';
  return [aeropuerto.codigo_iata, aeropuerto.ciudad || aeropuerto.nombre]
    .filter(Boolean)
    .join(' · ');
}

export default function FlightManagement({ token, rol }) {
  const [vuelos, setVuelos] = useState([]);
  const [aeropuertos, setAeropuertos] = useState([]);
  const [puertas, setPuertas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState('TODOS');
  const [fecha, setFecha] = useState('');
  const [modal, setModal] = useState(null);
  const [formulario, setFormulario] = useState(formularioVacio);
  const [motivo, setMotivo] = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const [listaVuelos, listaAeropuertos, listaPuertas] = await Promise.all([
        api('/api/vuelos', { token }),
        api('/api/aeropuertos', { token }),
        api('/api/puertas', { token }),
      ]);
      setVuelos(Array.isArray(listaVuelos) ? listaVuelos : []);
      setAeropuertos(Array.isArray(listaAeropuertos) ? listaAeropuertos : []);
      setPuertas(Array.isArray(listaPuertas) ? listaPuertas : []);
    } catch (fallo) {
      setError(fallo.message || 'No se pudieron cargar los vuelos.');
    } finally {
      setCargando(false);
    }
  }, [token]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLocaleLowerCase();
    return vuelos.filter((vuelo) => {
      const ruta = `${nombreAeropuerto(vuelo.aeropuerto_origen)} ${nombreAeropuerto(vuelo.aeropuerto_destino)}`;
      const coincideTexto = !texto ||
        `${vuelo.codigo_vuelo} ${ruta} ${vuelo.puerta?.numero || ''}`.toLocaleLowerCase().includes(texto);
      const coincideEstado = estado === 'TODOS' || vuelo.estado === estado;
      const coincideFecha = !fecha || String(vuelo.fecha_salida).slice(0, 10) === fecha;
      return coincideTexto && coincideEstado && coincideFecha;
    });
  }, [vuelos, busqueda, estado, fecha]);

  const abrirNuevo = () => {
    setFormulario(formularioVacio());
    setError('');
    setModal({ tipo: 'formulario', vuelo: null });
  };

  const abrirEdicion = (vuelo) => {
    setFormulario(datosVuelo(vuelo));
    setError('');
    setModal({ tipo: 'formulario', vuelo });
  };

  const cambiarCampo = (evento) => {
    const { name, value } = evento.target;
    setFormulario((actual) => ({ ...actual, [name]: value }));
  };

  const guardar = async (evento) => {
    evento.preventDefault();
    setError('');
    setAviso('');
    if (formulario.id_aeropuerto_origen === formulario.id_aeropuerto_destino) {
      setError('El origen y el destino deben ser distintos.');
      return;
    }
    const sale = new Date(`${formulario.fecha_salida}T${formulario.hora_salida}`);
    const llega = new Date(`${formulario.fecha_llegada}T${formulario.hora_llegada}`);
    if (!Number.isFinite(sale.getTime()) || !Number.isFinite(llega.getTime()) || llega <= sale) {
      setError('La llegada debe ocurrir después de la salida.');
      return;
    }

    const body = {
      codigo_vuelo: formulario.codigo_vuelo.trim(),
      id_aeropuerto_origen: Number(formulario.id_aeropuerto_origen),
      id_aeropuerto_destino: Number(formulario.id_aeropuerto_destino),
      fecha_salida: formulario.fecha_salida,
      hora_salida: formulario.hora_salida,
      fecha_llegada: formulario.fecha_llegada,
      hora_llegada: formulario.hora_llegada,
      id_puerta: formulario.id_puerta ? Number(formulario.id_puerta) : null,
      capacidad_pasajeros: Number(formulario.capacidad_pasajeros),
      observaciones: formulario.observaciones.trim() || null,
    };

    if (!body.codigo_vuelo || !body.id_aeropuerto_origen || !body.id_aeropuerto_destino || !body.capacidad_pasajeros) {
      setError('Completa los campos obligatorios. La capacidad debe ser mayor que cero.');
      return;
    }

    setGuardando(true);
    try {
      if (modal.vuelo) {
        await api(`/api/vuelos/${modal.vuelo.id_vuelo}`, { token, method: 'PUT', body });
        setAviso(`Se actualizaron los datos del vuelo ${body.codigo_vuelo}.`);
      } else {
        await api('/api/vuelos', { token, method: 'POST', body });
        setAviso(`El vuelo ${body.codigo_vuelo} se registró como PROGRAMADO.`);
      }
      setModal(null);
      await cargar();
    } catch (fallo) {
      setError(fallo.message || 'No se pudo guardar el vuelo.');
    } finally {
      setGuardando(false);
    }
  };

  const confirmarCancelacion = async (evento) => {
    evento.preventDefault();
    if (!modal?.vuelo || motivo.trim().length < 3) {
      setError('Escribe el motivo de la cancelación (mínimo 3 caracteres).');
      return;
    }
    setGuardando(true);
    setError('');
    try {
      await api(`/api/vuelos/${modal.vuelo.id_vuelo}/cancelar`, {
        token,
        method: 'POST',
        body: { motivo: motivo.trim() },
      });
      setModal(null);
      setMotivo('');
      setAviso(`El vuelo ${modal.vuelo.codigo_vuelo} quedó CANCELADO.`);
      await cargar();
    } catch (fallo) {
      setError(fallo.message || 'No se pudo cancelar el vuelo.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <section className="gestion-vuelos">
      <header className="gestion-vuelos__cabecera">
        <div>
          <p className="eyebrow">Operación</p>
          <h1>Gestión de vuelos</h1>
          <p className="subtitulo">Consulta y actualiza vuelos. El backend valida horarios y disponibilidad de puertas.</p>
        </div>
        <button className="boton boton--primario" type="button" onClick={abrirNuevo}>＋ Nuevo vuelo</button>
      </header>

      {aviso && <p className="alerta alerta--exito" role="status">✓ {aviso}</p>}
      {error && !modal && <p className="alerta alerta--error" role="alert">! {error}</p>}

      <div className="gestion-vuelos__filtros">
        <label className="campo"><span>Buscar vuelo</span><input type="search" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Código, ciudad o puerta" /></label>
        <label className="campo"><span>Estado</span><select value={estado} onChange={(e) => setEstado(e.target.value)}><option value="TODOS">Todos</option>{['PROGRAMADO','RETRASADO','ABORDANDO','ABORDADO','EN_VUELO','ATERRIZADO','FINALIZADO','CANCELADO'].map((x) => <option key={x}>{x}</option>)}</select></label>
        <label className="campo"><span>Fecha de salida</span><input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} /></label>
        <button className="boton boton--secundario" type="button" onClick={() => { setBusqueda(''); setEstado('TODOS'); setFecha(''); }}>Limpiar filtros</button>
      </div>

      <section className="tarjeta gestion-vuelos__tabla">
        <div className="tarjeta__cabecera"><div><h2>Vuelos registrados</h2><p className="subtitulo">{visibles.length} de {vuelos.length} vuelos</p></div><button className="boton boton--fantasma" onClick={cargar} type="button" disabled={cargando}>{cargando ? 'Actualizando…' : '↻ Actualizar'}</button></div>
        {cargando && !vuelos.length ? <p className="vacio" role="status">Cargando vuelos…</p> : null}
        {!cargando && !visibles.length ? <p className="vacio">No hay vuelos que coincidan con los filtros.</p> : null}
        {visibles.length > 0 ? <div className="tabla-scroll"><table className="tabla tabla--gestion">
          <thead><tr><th>Vuelo</th><th>Aerolínea</th><th>Origen → destino</th><th>Salida</th><th>Puerta</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>{visibles.map((vuelo) => <tr key={vuelo.id_vuelo}>
            <td className="celda-fuerte">{vuelo.codigo_vuelo}</td><td>{vuelo.aerolinea?.nombre || vuelo.aerolinea || '—'}</td>
            <td>{nombreAeropuerto(vuelo.aeropuerto_origen)}<br /><span className="ruta__ciudades">→ {nombreAeropuerto(vuelo.aeropuerto_destino)}</span></td>
            <td>{formatearFecha(vuelo.fecha_salida)}<br /><span className="ruta__ciudades">{formatearHora(vuelo.hora_salida)}</span></td>
            <td>{vuelo.puerta?.numero || 'Sin asignar'}</td><td><StatusBadge estado={vuelo.estado} /></td>
            <td><div className="acciones-vuelo"><button className="boton boton--secundario" type="button" onClick={() => setModal({ tipo: 'detalle', vuelo })}>Ver detalles</button>{vuelo.estado !== 'CANCELADO' && vuelo.estado !== 'FINALIZADO' ? <><button className="boton boton--fantasma" type="button" onClick={() => abrirEdicion(vuelo)}>Editar</button><button className="boton boton--fantasma boton--peligro" type="button" onClick={() => { setMotivo(''); setError(''); setModal({ tipo: 'cancelar', vuelo }); }}>Cancelar</button></> : null}</div></td>
          </tr>)}</tbody>
        </table></div> : null}
      </section>

      {modal ? <div className="modal-fondo" onMouseDown={(e) => { if (e.target === e.currentTarget && !guardando) setModal(null); }}>
        <section className="modal-vuelo" role="dialog" aria-modal="true" aria-labelledby="titulo-modal">
          <header className="modal-vuelo__cabecera"><div><p className="eyebrow">{modal.tipo === 'detalle' ? 'Información' : modal.tipo === 'cancelar' ? 'Confirmación requerida' : modal.vuelo ? 'Editar registro' : 'Nuevo registro'}</p><h2 id="titulo-modal">{modal.tipo === 'detalle' ? `Vuelo ${modal.vuelo.codigo_vuelo}` : modal.tipo === 'cancelar' ? 'Cancelar vuelo' : modal.vuelo ? 'Editar vuelo' : 'Registrar vuelo'}</h2></div><button className="boton boton--fantasma" type="button" onClick={() => setModal(null)} aria-label="Cerrar" disabled={guardando}>×</button></header>
          {error && <p className="alerta alerta--error" role="alert">! {error}</p>}
          {modal.tipo === 'detalle' ? <div className="detalle-vuelo"><p><strong>Ruta:</strong> {nombreAeropuerto(modal.vuelo.aeropuerto_origen)} → {nombreAeropuerto(modal.vuelo.aeropuerto_destino)}</p><p><strong>Salida:</strong> {formatearFecha(modal.vuelo.fecha_salida)} · {formatearHora(modal.vuelo.hora_salida)}</p><p><strong>Llegada:</strong> {formatearFecha(modal.vuelo.fecha_llegada)} · {formatearHora(modal.vuelo.hora_llegada)}</p><p><strong>Puerta:</strong> {modal.vuelo.puerta?.numero || 'Sin asignar'}</p><p><strong>Estado:</strong> {modal.vuelo.estado}</p><p><strong>Capacidad:</strong> {modal.vuelo.capacidad_pasajeros}</p>{modal.vuelo.observaciones && <p><strong>Observaciones:</strong> {modal.vuelo.observaciones}</p>}<button className="boton boton--primario" type="button" onClick={() => setModal(null)}>Volver al listado</button></div> : null}
          {modal.tipo === 'formulario' ? <form className="formulario-vuelo" onSubmit={guardar}>
            <label className="campo"><span>Código del vuelo *</span><input name="codigo_vuelo" value={formulario.codigo_vuelo} onChange={cambiarCampo} maxLength="20" required /></label>
            <label className="campo"><span>Origen *</span><select name="id_aeropuerto_origen" value={formulario.id_aeropuerto_origen} onChange={cambiarCampo} required><option value="">Selecciona aeropuerto</option>{aeropuertos.map((a) => <option key={a.id_aeropuerto} value={a.id_aeropuerto}>{nombreAeropuerto(a)}</option>)}</select></label>
            <label className="campo"><span>Destino *</span><select name="id_aeropuerto_destino" value={formulario.id_aeropuerto_destino} onChange={cambiarCampo} required><option value="">Selecciona aeropuerto</option>{aeropuertos.map((a) => <option key={a.id_aeropuerto} value={a.id_aeropuerto}>{nombreAeropuerto(a)}</option>)}</select></label>
            <label className="campo"><span>Fecha de salida *</span><input type="date" name="fecha_salida" value={formulario.fecha_salida} onChange={cambiarCampo} required /></label>
            <label className="campo"><span>Hora de salida *</span><input type="time" name="hora_salida" value={formulario.hora_salida} onChange={cambiarCampo} required /></label>
            <label className="campo"><span>Fecha de llegada *</span><input type="date" name="fecha_llegada" value={formulario.fecha_llegada} onChange={cambiarCampo} required /></label>
            <label className="campo"><span>Hora de llegada *</span><input type="time" name="hora_llegada" value={formulario.hora_llegada} onChange={cambiarCampo} required /></label>
            <label className="campo"><span>Puerta asignada</span><select name="id_puerta" value={formulario.id_puerta} onChange={cambiarCampo}><option value="">Sin asignar</option>{puertas.filter((p) => !p.estado || p.estado === 'DISPONIBLE' || String(p.id_puerta) === formulario.id_puerta).map((p) => <option key={p.id_puerta} value={p.id_puerta}>{p.numero}{p.zona ? ` · ${p.zona}` : ''}</option>)}</select></label>
            <label className="campo"><span>Capacidad de pasajeros *</span><input type="number" name="capacidad_pasajeros" min="1" max="10000" step="1" value={formulario.capacidad_pasajeros} onChange={cambiarCampo} required /></label>
            <label className="campo formulario-vuelo__ancho"><span>Observaciones</span><textarea name="observaciones" value={formulario.observaciones} onChange={cambiarCampo} maxLength="2000" rows="3" /></label>
            <p className="subtitulo formulario-vuelo__ancho">Los vuelos nuevos se registran con estado PROGRAMADO. La disponibilidad de puerta se valida al guardar.</p>
            <div className="modal-vuelo__acciones formulario-vuelo__ancho"><button className="boton boton--secundario" type="button" onClick={() => setModal(null)} disabled={guardando}>Volver</button><button className="boton boton--primario" type="submit" disabled={guardando}>{guardando ? 'Guardando…' : modal.vuelo ? 'Guardar cambios' : 'Registrar vuelo'}</button></div>
          </form> : null}
          {modal.tipo === 'cancelar' ? <form onSubmit={confirmarCancelacion} className="formulario-cancelar"><p>¿Confirmas cancelar <strong>{modal.vuelo.codigo_vuelo}</strong>? El registro se conservará y el backend notificará a sus pasajeros.</p><label className="campo"><span>Motivo de cancelación *</span><textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} minLength="3" maxLength="255" rows="3" required /></label><div className="modal-vuelo__acciones"><button className="boton boton--secundario" type="button" onClick={() => setModal(null)} disabled={guardando}>Regresar</button><button className="boton boton--peligro-fondo" type="submit" disabled={guardando}>{guardando ? 'Cancelando…' : 'Confirmar cancelación'}</button></div></form> : null}
        </section>
      </div> : null}
    </section>
  );
}
