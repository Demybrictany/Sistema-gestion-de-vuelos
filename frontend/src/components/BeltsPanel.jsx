import StatusBadge from './StatusBadge';

export default function BeltsPanel({ bandas }) {
  if (!bandas?.length) {
    return <p className="vacio">No hay bandas registradas.</p>;
  }

  return (
    <section className="bandas">
      <ul className="bandas__lista">
        {bandas.map((banda) => (
          <li className="banda" key={banda.id_banda}>
            <div>
              <strong>Banda {banda.numero}</strong>
              <span className="banda__zona">
                Zona {banda.zona || '—'} · {banda.equipajes} equipajes
              </span>
            </div>
            <StatusBadge
              estado={banda.estado_operativo || banda.estado}
              tipo="banda"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
