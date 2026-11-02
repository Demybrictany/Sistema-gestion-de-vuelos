import { useState } from 'react';

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

function Encabezado({ usuario, vista, onVista, socketEstado, actualizadoEn, onSalir, onRefrescar, totalVuelos }) {
  const vivo = ESTADO_SOCKET[socketEstado] || ESTADO_SOCKET.desconectado;
  const nombre = [usuario.nombres, usuario.apellidos].filter(Boolean).join(' ');

  return (
    <header className="barra">
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
          Vuelos <span className="nav-contador">{totalVuelos}</span>
        </button>
        <button
          type="button"
          className={vista === 'reportes' ? 'activo' : ''}
          onClick={() => onVista('reportes')}
          aria-current={vista === 'reportes' ? 'page' : undefined}
        >
          Reportes
        </button>
      </nav>

      <div className="barra__acciones">
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
          Actualizar
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

      <div className="rejilla rejilla--principal">
        <section className="tarjeta tarjeta--mapa">
          <div className="tarjeta__cabecera">
            <div>
              <p className="eyebrow">Terminal</p>
              <h2>Mapa de puertas</h2>
              <p className="subtitulo">
                25 puertas agrupadas por zona. Selecciona una para ver su vuelo.
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

function Workspace({ token, usuario, onSalir }) {
  const [vista, setVista] = useState('panel');
  const { panel, cargando, error, actualizadoEn, refrescar, refrescarPronto } =
    usePanel(token);
  const socketEstado = useSocket({
    token,
    activo: true,
    onCambio: refrescarPronto,
  });

  return (
    <div className="aplicacion">
      <Encabezado
        usuario={usuario}
        vista={vista}
        onVista={setVista}
        socketEstado={socketEstado}
        actualizadoEn={actualizadoEn}
        onSalir={onSalir}
        onRefrescar={refrescar}
        totalVuelos={panel?.kpis?.vuelos_total || 0}
      />

      <main className="contenido">
        {error ? (
          <p className="alerta alerta--error" role="alert">
            <span aria-hidden="true">!</span> No se pudo actualizar el panel:{' '}
            {error.message}
          </p>
        ) : null}

        {vista === 'reportes' ? <Reports token={token} /> : null}

        {vista !== 'reportes' && !panel && cargando ? (
          <div className="esqueleto" role="status" aria-live="polite">
            <div className="esqueleto__linea esqueleto__linea--corta" />
            <div className="esqueleto__bloque" />
            <div className="esqueleto__bloque esqueleto__bloque--alto" />
          </div>
        ) : null}

        {vista === 'panel' && panel ? <VistaPanel panel={panel} /> : null}

        {vista === 'vuelos' && panel ? (
          <FlightsTable
            vuelos={panel.vuelos}
            titulo="Todos los vuelos"
            descripcion="Busca por código, ciudad o puerta y filtra por estado operativo."
          />
        ) : null}
      </main>

      <footer className="pie">
        <span>AICM · Sistema de gestión de vuelos</span>
        <span>
          Datos operativos en tiempo real · {panel?.kpis?.puertas_total || 25} puertas ·{' '}
          {panel?.kpis?.vuelos_total || 0} vuelos
        </span>
      </footer>
    </div>
  );
}

export default function App() {
  const { token, usuario, cargando, logout } = useAuth();

  if (cargando) return <PantallaCargando />;
  if (!token || !usuario) return <Login />;

  const rol = usuario.rol?.nombre;

  if (!ROLES_PERMITIDOS.includes(rol)) {
    return <SinPermiso usuario={usuario} onSalir={logout} />;
  }

  return (
    <Workspace key={usuario.id_usuario} token={token} usuario={usuario} onSalir={logout} />
  );
}
