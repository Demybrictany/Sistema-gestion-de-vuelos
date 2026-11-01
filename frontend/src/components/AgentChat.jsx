import { useEffect, useRef, useState } from 'react';

import { api } from '../api';

const SUGERENCIAS = [
  '¿Qué pasa si mi vuelo se retrasa?',
  '¿Tengo que recoger mi equipaje en una conexión?',
  '¿Cuántas puertas y bandas tiene el aeropuerto?',
  '¿En qué puerta sale el vuelo GT456?',
];

const MENSAJE_INICIAL = {
  rol: 'agente',
  texto:
    'Hola. Soy el asistente del AICM. Puedo consultar vuelos, puertas, equipaje y la documentación del sistema. ¿Qué necesitas saber?',
};

export default function AgentChat({ token }) {
  const [mensajes, setMensajes] = useState([MENSAJE_INICIAL]);
  const [pregunta, setPregunta] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const finRef = useRef(null);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [mensajes, enviando]);

  const preguntar = async (texto) => {
    const limpio = String(texto || '').trim();

    if (!limpio || enviando) {
      return;
    }

    setMensajes((previos) => [...previos, { rol: 'usuario', texto: limpio }]);
    setPregunta('');
    setEnviando(true);
    setError(null);

    try {
      const datos = await api('/api/agente/consultas', {
        token,
        method: 'POST',
        body: { pregunta: limpio },
      });

      setMensajes((previos) => [
        ...previos,
        {
          rol: 'agente',
          texto: datos.respuesta,
          fuentes: datos.fuentes,
          proveedor: datos.proveedor,
          aviso: datos.aviso,
        },
      ]);
    } catch (fallo) {
      setError(fallo.message);
      setMensajes((previos) => [
        ...previos,
        {
          rol: 'agente',
          texto:
            'No pude responder en este momento. Revisa la conexión e inténtalo de nuevo.',
          error: true,
        },
      ]);
    } finally {
      setEnviando(false);
    }
  };

  const enviar = (evento) => {
    evento.preventDefault();
    preguntar(pregunta);
  };

  return (
    <section className="tarjeta chat" aria-labelledby="titulo-asistente">
      <div className="tarjeta__cabecera">
        <div>
          <p className="eyebrow">Inteligencia artificial</p>
          <h2 id="titulo-asistente">Asistente del AICM</h2>
          <p className="subtitulo">
            Responde con datos operativos y con la documentación del sistema,
            citando las fuentes. No muestra datos de otros pasajeros.
          </p>
        </div>
        <span className="chat__estado">
          {enviando ? 'Consultando…' : 'En línea'}
        </span>
      </div>

      <div
        className="chat__mensajes"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
      >
        {mensajes.map((mensaje, indice) => (
          <article
            key={`${mensaje.rol}-${indice}`}
            className={[
              'chat__burbuja',
              mensaje.rol === 'usuario' ? 'chat__burbuja--usuario' : '',
              mensaje.error ? 'chat__burbuja--error' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <p>{mensaje.texto}</p>

            {mensaje.aviso ? (
              <p className="chat__aviso">{mensaje.aviso}</p>
            ) : null}

            {Array.isArray(mensaje.fuentes) && mensaje.fuentes.length > 0 ? (
              <div className="chat__fuentes">
                <strong>Fuentes citadas</strong>
                <ul>
                  {mensaje.fuentes.map((fuente) => (
                    <li key={`${fuente.cita}-${fuente.fuente}`}>
                      [{fuente.cita}] {fuente.titulo} — {fuente.fuente}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </article>
        ))}

        {enviando ? (
          <p className="chat__pensando" role="status">
            <span className="cargando__punto" aria-hidden="true" /> Buscando en
            la documentación y en los datos…
          </p>
        ) : null}

        <div ref={finRef} />
      </div>

      {error ? (
        <p className="alerta alerta--error" role="alert">
          <span aria-hidden="true">!</span> {error}
        </p>
      ) : null}

      <div className="chat__sugerencias" aria-label="Preguntas sugeridas">
        {SUGERENCIAS.map((sugerencia) => (
          <button
            key={sugerencia}
            type="button"
            className="boton boton--fantasma"
            onClick={() => preguntar(sugerencia)}
            disabled={enviando}
          >
            {sugerencia}
          </button>
        ))}
      </div>

      <form className="chat__form" onSubmit={enviar}>
        <label className="campo chat__campo">
          <span>Tu pregunta</span>
          <input
            value={pregunta}
            onChange={(evento) => setPregunta(evento.target.value)}
            placeholder="Ejemplo: ¿en qué puerta sale el vuelo GT456?"
            maxLength={1000}
            disabled={enviando}
            autoComplete="off"
          />
        </label>

        <button
          type="submit"
          className="boton boton--primario"
          disabled={enviando || !pregunta.trim()}
        >
          {enviando ? 'Enviando…' : 'Preguntar'}
        </button>
      </form>
    </section>
  );
}
