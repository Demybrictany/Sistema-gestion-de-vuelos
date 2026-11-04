import { useCallback, useEffect, useState } from 'react';

import { api, formatearFecha, formatearFechaHora, formatearHora } from '../api';
import StatusBadge from './StatusBadge';

function nombreAeropuerto(aeropuerto) {
  if (!aeropuerto) return '—';
  return [aeropuerto.codigo_iata, aeropuerto.ciudad].filter(Boolean).join(' · ') || aeropuerto.nombre || '—';
}

export default function PassengerPortal({ token, usuario, onSalir, tema, onCambiarTema }) {
  const [vuelos, setVuelos] = useState([]);
  const [equipajes, setEquipajes] = useState([]);
  const [notificaciones, setNotificaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const [misVuelos, misEquipajes, misNotificaciones] = await Promise.all([
        api('/api/vuelos/mios', { token }),
        api('/api/equipajes/mios', { token }),
        api('/api/notificaciones/mias', { token }),
      ]);
      setVuelos(Array.isArray(misVuelos) ? misVuelos : []);
      setEquipajes(Array.isArray(misEquipajes) ? misEquipajes : []);
      setNotificaciones(Array.isArray(misNotificaciones) ? misNotificaciones : []);
    } catch (fallo) {
      setError(fallo.message || 'No se pudo cargar la información de tu viaje.');
    } finally {
      setCargando(false);
    }
  }, [token]);

  useEffect(() => { cargar(); }, [cargar]);

  const marcarTodasLeidas = async () => {
    try {
      await api('/api/notificaciones/mias/leer-todas', { token, method: 'PATCH' });
      setNotificaciones((actuales) => actuales.map((item) => ({ ...item, leida: true })));
    } catch (fallo) {
      setError(fallo.message || 'No se pudieron actualizar las notificaciones.');
    }
  };

  const nombre = [usuario.nombres, usuario.apellidos].filter(Boolean).join(' ') || usuario.nombre_usuario;

  return (
    <main className="portal-pasajero">
      <header className="portal-pasajero__barra">
        <a className="portal-pasajero__marca" href="#inicio" aria-label="Inicio del portal AICM"><span aria-hidden="true">✈</span><span><strong>AICM</strong><small>Portal de pasajeros</small></span></a>
        <div className="portal-pasajero__acciones"><span>Hola, <strong>{nombre}</strong></span><button className="boton boton--secundario" type="button" onClick={onCambiarTema}>{tema === 'oscuro' ? '☀ Tema claro' : '☾ Tema oscuro'}</button><button className="boton boton--fantasma" type="button" onClick={onSalir}>Salir</button></div>
      </header>
      <div className="portal-pasajero__contenido" id="inicio">
        <section className="portal-pasajero__bienvenida"><p className="eyebrow">Tu viaje, en un solo lugar</p><h1>Información de viaje</h1><p>Consulta tus vuelos, equipaje y avisos. La información mostrada pertenece a tu cuenta.</p><button className="boton boton--secundario" type="button" onClick={cargar} disabled={cargando}>{cargando ? 'Actualizando…' : '↻ Actualizar información'}</button></section>
        {error ? <p className="alerta alerta--error" role="alert">! {error}</p> : null}
        {cargando ? <p className="tarjeta portal-pasajero__estado" role="status">Cargando la información vinculada a tu cuenta…</p> : null}
        {!cargando && !error && !vuelos.length && !equipajes.length && !notificaciones.length ? <p className="alerta portal-pasajero__estado">No hay viajes o notificaciones vinculados a esta cuenta. Si esperabas ver una reserva, contacta al personal del aeropuerto.</p> : null}

        <section className="portal-pasajero__seccion" aria-labelledby="mis-vuelos"><div className="portal-pasajero__titulo"><div><p className="eyebrow">Itinerario</p><h2 id="mis-vuelos">Mis vuelos</h2></div><span className="contador">{vuelos.length}</span></div>
          {vuelos.length ? <div className="portal-pasajero__tarjetas">{vuelos.map((vuelo) => <article className="tarjeta viaje-card" key={`${vuelo.id_vuelo}-${vuelo.estado_pasajero_vuelo || ''}`}><div className="viaje-card__encabezado"><strong>{vuelo.codigo_vuelo}</strong><StatusBadge estado={vuelo.estado} /></div><p className="viaje-card__ruta">{nombreAeropuerto(vuelo.aeropuerto_origen)} <span aria-hidden="true">→</span> {nombreAeropuerto(vuelo.aeropuerto_destino)}</p><div className="viaje-card__datos"><p><span>Salida</span><strong>{formatearFecha(vuelo.fecha_salida)} · {formatearHora(vuelo.hora_salida)}</strong></p><p><span>Puerta</span><strong>{vuelo.puerta?.numero || 'Por asignar'}</strong></p>{vuelo.numero_asiento ? <p><span>Asiento</span><strong>{vuelo.numero_asiento}</strong></p> : null}</div>{vuelo.estado_pasajero_vuelo ? <small>Reserva: {vuelo.estado_pasajero_vuelo}</small> : null}</article>)}</div> : !cargando ? <p className="vacio vacio--tarjeta">No tienes vuelos asociados a esta cuenta.</p> : null}
        </section>

        <section className="portal-pasajero__seccion" aria-labelledby="mi-equipaje"><div className="portal-pasajero__titulo"><div><p className="eyebrow">Seguimiento</p><h2 id="mi-equipaje">Mi equipaje</h2></div><span className="contador">{equipajes.length}</span></div>
          {equipajes.length ? <div className="portal-pasajero__tarjetas">{equipajes.map((item) => <article className="tarjeta equipaje-card" key={item.id_equipaje}><div className="viaje-card__encabezado"><strong>▣ {item.codigo_equipaje}</strong><StatusBadge estado={item.estado} /></div><p><span>Destino</span><strong>{nombreAeropuerto(item.aeropuertoDestino)}</strong></p><p><span>Banda</span><strong>{item.bandaActual?.numero || (item.estado === 'EN_TRANSITO' ? 'En tránsito' : 'Por asignar')}</strong></p>{item.peso !== null && item.peso !== undefined ? <p><span>Peso</span><strong>{item.peso} kg</strong></p> : null}</article>)}</div> : !cargando ? <p className="vacio vacio--tarjeta">No hay equipaje registrado para tu cuenta.</p> : null}
        </section>

        <section className="portal-pasajero__seccion" aria-labelledby="mis-avisos"><div className="portal-pasajero__titulo"><div><p className="eyebrow">Actualizaciones</p><h2 id="mis-avisos">Mis notificaciones</h2></div>{notificaciones.some((item) => !item.leida) ? <button className="boton boton--fantasma" type="button" onClick={marcarTodasLeidas}>Marcar todas como leídas</button> : null}</div>
          {notificaciones.length ? <ul className="portal-avisos">{notificaciones.map((item) => <li className={`portal-aviso${item.leida ? '' : ' portal-aviso--nuevo'}`} key={item.id_notificacion}><span className="portal-aviso__icono" aria-hidden="true">{item.leida ? '✓' : '●'}</span><div><strong>{item.titulo || item.tipo}</strong><p>{item.mensaje}</p><small>{formatearFechaHora(item.fecha_envio)}</small></div></li>)}</ul> : !cargando ? <p className="vacio vacio--tarjeta">No tienes notificaciones.</p> : null}
        </section>
        <p className="portal-pasajero__privacidad">Solo se consultan vuelos, equipaje y notificaciones asociados a tu cuenta.</p>
      </div>
    </main>
  );
}
