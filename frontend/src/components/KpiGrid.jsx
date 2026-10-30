import { formatearNumero } from '../api';

function Kpi({ etiqueta, valor, detalle, tono = 'neutral', icono }) {
  return (
    <article className={`kpi kpi--${tono}`}>
      <div className="kpi__cabecera">
        <span className="kpi__etiqueta">{etiqueta}</span>
        {icono ? (
          <span className="kpi__icono" aria-hidden="true">
            {icono}
          </span>
        ) : null}
      </div>
      <strong className="kpi__valor">{valor}</strong>
      {detalle ? <span className="kpi__detalle">{detalle}</span> : null}
    </article>
  );
}

export default function KpiGrid({ kpis }) {
  if (!kpis) return null;

  const ocupacion =
    kpis.puertas_total > 0
      ? Math.round((kpis.puertas_ocupadas / kpis.puertas_total) * 100)
      : 0;

  return (
    <section className="kpis" aria-label="Indicadores del aeropuerto">
      <Kpi
        etiqueta="Vuelos hoy"
        valor={formatearNumero(kpis.vuelos_hoy)}
        detalle={`${formatearNumero(kpis.vuelos_programados)} programados`}
        icono="◷"
      />
      <Kpi
        etiqueta="En operación"
        valor={formatearNumero(kpis.vuelos_en_operacion)}
        detalle={`${formatearNumero(kpis.vuelos_cancelados)} cancelados`}
        icono="✈"
      />
      <Kpi
        etiqueta="Pasajeros activos"
        valor={formatearNumero(kpis.pasajeros_activos)}
        detalle={`${formatearNumero(kpis.equipajes_en_proceso)} equipajes en proceso`}
        icono="●"
      />
      <Kpi
        etiqueta="Puertas ocupadas"
        valor={`${formatearNumero(kpis.puertas_ocupadas)} / ${formatearNumero(
          kpis.puertas_total
        )}`}
        detalle={`${ocupacion}% de ocupación · ${formatearNumero(
          kpis.puertas_mantenimiento
        )} en mantenimiento`}
        icono="▣"
      />
      <Kpi
        etiqueta="Equipajes"
        valor={formatearNumero(kpis.equipajes_total)}
        detalle={`${formatearNumero(kpis.bandas_en_uso)} bandas en uso`}
        icono="▤"
      />
      <Kpi
        etiqueta="Incidencias"
        valor={formatearNumero(kpis.incidencias_equipaje)}
        detalle="equipajes extraviados o dañados"
        tono={kpis.incidencias_equipaje > 0 ? 'critical' : 'good'}
        icono={kpis.incidencias_equipaje > 0 ? '!' : '✓'}
      />
      <Kpi
        etiqueta="Avisos pendientes"
        valor={formatearNumero(kpis.notificaciones_pendientes)}
        detalle="notificaciones sin leer"
        icono="◔"
      />
    </section>
  );
}
