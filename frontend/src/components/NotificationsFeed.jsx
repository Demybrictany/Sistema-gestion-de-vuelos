import { formatearFechaHora } from '../api';
import { TIPOS_NOTIFICACION } from '../estados';

export default function NotificationsFeed({ notificaciones }) {
  if (!notificaciones?.length) {
    return <p className="vacio">Sin notificaciones recientes.</p>;
  }

  return (
    <ul className="avisos">
      {notificaciones.map((aviso) => (
        <li
          className={`aviso${aviso.leida ? '' : ' aviso--nueva'}`}
          key={aviso.id_notificacion}
        >
          <div className="aviso__cabecera">
            <span className="aviso__tipo">
              {TIPOS_NOTIFICACION[aviso.tipo] || aviso.tipo}
            </span>
            <span className="aviso__estado">
              {aviso.leida ? 'Leída' : 'Nueva'}
            </span>
          </div>
          <p className="aviso__mensaje">{aviso.mensaje}</p>
          <div className="aviso__pie">
            <span>{aviso.pasajero}</span>
            <time dateTime={aviso.fecha_envio}>
              {formatearFechaHora(aviso.fecha_envio)}
            </time>
          </div>
        </li>
      ))}
    </ul>
  );
}
