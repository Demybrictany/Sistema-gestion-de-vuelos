import { useEffect, useState } from 'react';

import { useAuth } from './auth';
import { usePanel } from './hooks/usePanel';
import { useSocket } from './hooks/useSocket';
import BeltsPanel from './components/BeltsPanel';
import FlightsTable from './components/FlightsTable';
import GateMap from './components/GateMap';
import KpiGrid from './components/KpiGrid';
import Login from './components/Login';
import NotificationsFeed from './components/NotificationsFeed';
import Reports from './components/Reports';
import AgentChat from './components/AgentChat';
import FlightManagement from './components/FlightManagement';
import PassengerPortal from './components/PassengerPortal';
import GateManagement from './components/GateManagement';
import BaggageManagement from './components/BaggageManagement';
import PassengerManagement from './components/PassengerManagement';
import NotificationsCenter from './components/NotificationsCenter';

const ROLES_PERMITIDOS = ['ADMINISTRADOR', 'SECRETARIO'];

const NOMBRES_ROL = {
  ADMINISTRADOR: 'Administrador',
  SECRETARIO: 'Secretario',
};

const ESTADO_SOCKET = {
  conectado: { tono: 'good', texto: 'En vivo' },
  desconectado: { tono: 'warning', texto: 'Reconectando' },
  error: { tono: 'critical', texto: 'Sin conexión' },
};

const obtenerTemaInicial = () => {
  const guardado = window.localStorage.getItem('aicm.tema');

  if (guardado === 'claro' || guardado === 'oscuro') return guardado;

  return 'oscuro';
};

function PantallaCargando() {
  return (
    <main className="pantalla-centrada">
      <div className="cargando" role="status" aria-live="polite">
        <span className="cargando__punto" aria-hidden="true" />
        Cargando el panel…
      </div>
    </main>
  );
}

function SinPermiso({ usuario, onSalir }) {
  return (
    <main className="pantalla-centrada">
      <section className="tarjeta tarjeta--estrecha">
        <p className="eyebrow">Acceso restringido</p>
        <h1>Esta cuenta no opera el panel</h1>
        <p className="subtitulo">
          El panel está disponible para administradores y secretarios. La cuenta{' '}
          <strong>{usuario.nombre_usuario}</strong> tiene el rol{' '}
          {NOMBRES_ROL[usuario.rol?.nombre] || usuario.rol?.nombre || 'desconocido'}.
        </p>
        <button className="boton boton--primario" type="button" onClick={onSalir}>
          Cerrar sesión
        </button>
      </section>
    </main>
  );
}

function SeleccionAcceso({ onSeleccionar }) {
  return (
    <main className="seleccion-acceso">
      <div className="seleccion-acceso__marca"><span aria-hidden="true">✈</span><div><strong>AICM</strong><small>Aeropuerto Internacional de la Ciudad de México</small></div></div>
      <section className="seleccion-acceso__intro"><p className="eyebrow">Sistema de gestión de vuelos</p><h1>¿Cómo quieres ingresar?</h1><p>Elige el acceso que corresponde a tu cuenta.</p></section>
      <div className="seleccion-acceso__opciones">
        <article className="tarjeta acceso-card"><span className="acceso-card__icono" aria-hidden="true">▣</span><p className="eyebrow">Personal autorizado</p><h2>Acceso del personal</h2><p>Herramientas de operación para administradores y secretarios.</p><button className="boton boton--primario" type="button" onClick={() => onSeleccionar('personal')}>Administrador o secretario <span aria-hidden="true">→</span></button></article>
        <article className="tarjeta acceso-card acceso-card--pasajero"><span className="acceso-card__icono" aria-hidden="true">✈</span><p className="eyebrow">Información personal</p><h2>Portal de pasajeros</h2><p>Consulta tus vuelos, equipaje y notificaciones vinculadas a tu cuenta.</p><button className="boton boton--secundario" type="button" onClick={() => onSeleccionar('pasajero')}>Consultar mi viaje <span aria-hidden="true">→</span></button></article>
      </div>
      <p className="seleccion-acceso__pie">La información se muestra según el rol y los permisos de tu cuenta.</p>
    </main>
  );
}

const RUTAS_PANEL = [
  { id: 'panel', nombre: 'Panel', icono: '▦' },
  { id: 'vuelos', nombre: 'Vuelos', icono: '✈' },
  { id: 'puertas', nombre: 'Puertas', icono: '▣' },
  { id: 'equipaje', nombre: 'Equipaje', icono: '▢' },
  { id: 'pasajeros', nombre: 'Pasajeros', icono: '♙' },
  { id: 'notificaciones', nombre: 'Notificaciones', icono: '♧', contador: 'notificaciones' },
  { id: 'reportes', nombre: 'Reportes', icono: '▥' },
  { id: 'asistente', nombre: 'Asistente', icono: '✳' },
];

function BarraLateral({ vista, onVista, totalVuelos, notificacionesPendientes, rol, menuAbierto, onCerrar }) {
  return (
    <>
      <aside className={`barra-lateral${menuAbierto ? ' barra-lateral--abierta' : ''}`}>
        <div className="barra-lateral__marca">
          <span className="barra-lateral__logo" aria-hidden="true">✈</span>
          <div><strong>AICM</strong><span>Aeropuerto Internacional<br />de la Ciudad de México</span></div>
        </div>
        <div className="barra-lateral__separador" />
        <p className="barra-lateral__etiqueta">Operaciones</p>
        <nav className="barra-lateral__nav" aria-label="Secciones del sistema">
          {RUTAS_PANEL.map((ruta) => {
            const contador = ruta.id === 'vuelos' ? totalVuelos : ruta.id === 'notificaciones' ? notificacionesPendientes : null;
            return (
              <button key={ruta.id} type="button" className={`barra-lateral__enlace${vista === ruta.id ? ' activo' : ''}`} onClick={() => { onVista(ruta.id); onCerrar(); }} aria-current={vista === ruta.id ? 'page' : undefined}>
                <span className="barra-lateral__icono" aria-hidden="true">{ruta.icono}</span>
                <span>{ruta.nombre}</span>
                {contador !== null && contador !== undefined && <span className={`nav-contador${ruta.id === 'notificaciones' && contador > 0 ? ' nav-contador--alerta' : ''}`}>{contador}</span>}
              </button>
            );
          })}
        </nav>
        <div className="barra-lateral__pie">
          <span className="barra-lateral__rol">Rol: {NOMBRES_ROL[rol] || rol}</span>
          <small>Sistema de Gestión de Vuelos</small>
          <small>Versión 1.6.2</small>
        </div>
      </aside>
      {menuAbierto && <button className="barra-lateral__fondo" type="button" onClick={onCerrar} aria-label="Cerrar navegación" />}
    </>
  );
}

function Encabezado({ usuario, vista, onVista, socketEstado, actualizadoEn, onSalir, onRefrescar, totalVuelos, tema, onCambiarTema, menuAbierto, onAlternarMenu }) {
  const vivo = ESTADO_SOCKET[socketEstado] || ESTADO_SOCKET.desconectado;
  const nombre = [usuario.nombres, usuario.apellidos].filter(Boolean).join(' ');
  const [ahora, setAhora] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setAhora(new Date()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <header className="barra">
      <button className="shell-menu" type="button" onClick={onAlternarMenu} aria-label={menuAbierto ? 'Cerrar navegación' : 'Abrir navegación'} aria-expanded={menuAbierto}>
        <span aria-hidden="true">{menuAbierto ? '×' : '☰'}</span>
      </button>
      <div className="barra__marca">
        <span className="barra__logo" aria-hidden="true">
          ✈
        </span>
        <div>
          <strong>AICM</strong>
          <span>Centro de operaciones</span>
        </div>
      </div>

      <nav className="barra__nav" aria-label="Secciones del panel">
        <button
          type="button"
          className={vista === 'panel' ? 'activo' : ''}
          onClick={() => onVista('panel')}
          aria-current={vista === 'panel' ? 'page' : undefined}
        >
          Panel
        </button>
        <button
          type="button"
          className={vista === 'vuelos' ? 'activo' : ''}
          onClick={() => onVista('vuelos')}
          aria-current={vista === 'vuelos' ? 'page' : undefined}
        >
          Vuelos {totalVuelos !== null && totalVuelos !== undefined ? <span className="nav-contador">{totalVuelos}</span> : null}
        </button>
        <button
          type="button"
          className={vista === 'puertas' ? 'activo' : ''}
          onClick={() => onVista('puertas')}
          aria-current={vista === 'puertas' ? 'page' : undefined}
        >
          Puertas
        </button>
        <button
          type="button"
          className={vista === 'equipaje' ? 'activo' : ''}
          onClick={() => onVista('equipaje')}
          aria-current={vista === 'equipaje' ? 'page' : undefined}
        >
          Equipaje
        </button>
        <button
          type="button"
          className={vista === 'pasajeros' ? 'activo' : ''}
          onClick={() => onVista('pasajeros')}
          aria-current={vista === 'pasajeros' ? 'page' : undefined}
        >
          Pasajeros
        </button>
        <button
          type="button"
          className={vista === 'notificaciones' ? 'activo' : ''}
          onClick={() => onVista('notificaciones')}
          aria-current={vista === 'notificaciones' ? 'page' : undefined}
        >
          Notificaciones
        </button>
        <button
          type="button"
          className={vista === 'reportes' ? 'activo' : ''}
          onClick={() => onVista('reportes')}
          aria-current={vista === 'reportes' ? 'page' : undefined}
        >
          Reportes
        </button>
        <button
          type="button"
          className={vista === 'asistente' ? 'activo' : ''}
          onClick={() => onVista('asistente')}
          aria-current={vista === 'asistente' ? 'page' : undefined}
        >
          Asistente
        </button>
      </nav>

      <div className="barra__acciones">
        <span className="shell-header__fecha"><span aria-hidden="true">◷</span>{ahora.toLocaleDateString('es-MX', { weekday: 'short', day: '2-digit', month: 'short' })} · {ahora.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span>
        <span className={`estado-vivo estado-vivo--${vivo.tono}`}>
          <span className="estado-vivo__punto" aria-hidden="true" />
          {vivo.texto}
        </span>

        <span className="actualizado">
          {actualizadoEn
            ? `Actualizado ${actualizadoEn.toLocaleTimeString('es-GT', {
                hour: '2-digit',
                minute: '2-digit',
              })}`
            : 'Esperando datos'}
        </span>

        <button
          type="button"
          className="boton boton--fantasma boton--actualizar"
          onClick={() => onRefrescar()}
        >
          <span aria-hidden="true">↻</span>Actualizar
        </button>

        <button
          type="button"
          className="boton boton--fantasma"
          onClick={onCambiarTema}
          aria-label={`Cambiar a tema ${tema === 'oscuro' ? 'claro' : 'oscuro'}`}
          aria-pressed={tema === 'oscuro'}
        >
          <span aria-hidden="true">{tema === 'oscuro' ? '☀' : '☾'}</span>
          {tema === 'oscuro' ? 'Tema claro' : 'Tema oscuro'}
        </button>

        <span className="usuario" title={`${nombre || usuario.nombre_usuario} · ${usuario.rol?.nombre}`}>
          <strong>{nombre || usuario.nombre_usuario}</strong>
          <span>{NOMBRES_ROL[usuario.rol?.nombre] || usuario.rol?.nombre}</span>
        </span>

        <button type="button" className="boton boton--fantasma" onClick={onSalir}>
          Salir
        </button>
      </div>
    </header>
  );
}

function VistaPanel({ panel }) {
  return (
    <>
      <KpiGrid kpis={panel.kpis} />

      {Number(panel.kpis?.puertas_total) < 25 ? (
        <p className="alerta alerta--advertencia" role="status">
          El backend registra {panel.kpis?.puertas_total ?? 0} puertas; el requisito del proyecto solicita al menos 25.
        </p>
      ) : null}

      <div className="rejilla rejilla--principal">
        <section className="tarjeta tarjeta--mapa">
          <div className="tarjeta__cabecera">
            <div>
              <p className="eyebrow">Terminal</p>
              <h2>Mapa de puertas</h2>
              <p className="subtitulo">
                {panel.kpis.puertas_total} puertas registradas agrupadas por zona. Selecciona una para ver su vuelo.
              </p>
            </div>
          </div>
          <GateMap puertas={panel.puertas} />
        </section>

        <aside className="tarjeta">
          <div className="tarjeta__cabecera">
            <div>
              <p className="eyebrow">Pasajeros</p>
              <h2>Avisos recientes</h2>
              <p className="subtitulo">
                Notificaciones generadas automáticamente por el sistema.
              </p>
            </div>
          </div>
          <NotificationsFeed notificaciones={panel.notificaciones} />
        </aside>
      </div>

      <div className="rejilla rejilla--secundaria">
        <FlightsTable
          vuelos={panel.vuelos}
          titulo="Vuelos del tablero"
          descripcion="Salidas ordenadas por fecha y hora. Los cambios llegan por Socket.IO."
        />

        <aside className="tarjeta">
          <div className="tarjeta__cabecera">
            <div>
              <p className="eyebrow">Equipaje</p>
              <h2>Bandas de entrega</h2>
              <p className="subtitulo">Estado y equipajes asignados a cada banda.</p>
            </div>
          </div>
          <BeltsPanel bandas={panel.bandas} />
        </aside>
      </div>
    </>
  );
}

function Workspace({ token, usuario, onSalir, tema, onCambiarTema }) {
  const [vista, setVista] = useState('panel');
  const [menuAbierto, setMenuAbierto] = useState(false);
  const { panel, cargando, error, actualizadoEn, refrescar, refrescarPronto } =
    usePanel(token);
  const socketEstado = useSocket({
    token,
    activo: true,
    onCambio: refrescarPronto,
  });

  return (
    <div className="aplicacion">
      <BarraLateral
        vista={vista}
        onVista={setVista}
        totalVuelos={panel?.kpis?.vuelos_total}
        notificacionesPendientes={panel?.kpis?.notificaciones_pendientes}
        rol={usuario.rol?.nombre}
        menuAbierto={menuAbierto}
        onCerrar={() => setMenuAbierto(false)}
      />
      <div className="workspace-main">
        <Encabezado
          usuario={usuario}
          vista={vista}
          onVista={setVista}
          socketEstado={socketEstado}
          actualizadoEn={actualizadoEn}
          onSalir={onSalir}
          onRefrescar={refrescar}
          totalVuelos={panel?.kpis?.vuelos_total}
          tema={tema}
          onCambiarTema={onCambiarTema}
          menuAbierto={menuAbierto}
          onAlternarMenu={() => setMenuAbierto((abierto) => !abierto)}
        />

      <main className="contenido shell-contenido">
        {error ? (
          <p className="alerta alerta--error" role="alert">
            <span aria-hidden="true">!</span> No se pudo actualizar el panel:{' '}
            {error.message}
          </p>
        ) : null}

        {vista === 'reportes' ? <Reports token={token} /> : null}

        {vista === 'asistente' ? <AgentChat token={token} /> : null}

        {vista !== 'reportes' && vista !== 'asistente' && vista !== 'puertas' && vista !== 'equipaje' && vista !== 'pasajeros' && vista !== 'notificaciones' && !panel && cargando ? (
          <div className="esqueleto" role="status" aria-live="polite">
            <div className="esqueleto__linea esqueleto__linea--corta" />
            <div className="esqueleto__bloque" />
            <div className="esqueleto__bloque esqueleto__bloque--alto" />
          </div>
        ) : null}

        {vista === 'panel' && panel ? <VistaPanel panel={panel} /> : null}

        {vista === 'vuelos' ? <FlightManagement token={token} rol={usuario.rol?.nombre} /> : null}

        {vista === 'puertas' ? <GateManagement token={token} /> : null}

        {vista === 'equipaje' ? <BaggageManagement token={token} /> : null}

        {vista === 'pasajeros' ? <PassengerManagement token={token} /> : null}

        {vista === 'notificaciones' ? <NotificationsCenter token={token} /> : null}
      </main>

      <footer className="pie shell-footer">
        <span>AICM · Sistema de gestión de vuelos</span>
        <span>
          {panel
            ? `Datos operativos en tiempo real · ${panel.kpis?.puertas_total ?? '—'} puertas · ${panel.kpis?.vuelos_total ?? '—'} vuelos`
            : 'Cargando datos operativos…'}
        </span>
      </footer>
      </div>
    </div>
  );
}

export default function App() {
  const { token, usuario, cargando, logout } = useAuth();
  const [tema, setTema] = useState(obtenerTemaInicial);
  const [tipoAcceso, setTipoAcceso] = useState(null);

  useEffect(() => {
    document.documentElement.dataset.tema = tema;
    window.localStorage.setItem('aicm.tema', tema);
  }, [tema]);

  const cambiarTema = () =>
    setTema((actual) => (actual === 'oscuro' ? 'claro' : 'oscuro'));

  if (cargando) return <PantallaCargando />;
  if (!token || !usuario) {
    if (!tipoAcceso) return <SeleccionAcceso onSeleccionar={setTipoAcceso} />;
    return <Login tipoAcceso={tipoAcceso} onVolver={() => setTipoAcceso(null)} />;
  }

  const rol = usuario.rol?.nombre;

  if (rol === 'PASAJERO') {
    return <PassengerPortal token={token} usuario={usuario} onSalir={logout} tema={tema} onCambiarTema={cambiarTema} />;
  }

  if (!ROLES_PERMITIDOS.includes(rol)) {
    return <SinPermiso usuario={usuario} onSalir={logout} />;
  }

  return (
    <Workspace
      key={usuario.id_usuario}
      token={token}
      usuario={usuario}
      onSalir={logout}
      tema={tema}
      onCambiarTema={cambiarTema}
    />
  );
}
