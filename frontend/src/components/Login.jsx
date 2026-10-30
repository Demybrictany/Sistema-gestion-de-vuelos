import { useState } from 'react';

import { useAuth } from '../auth';

export default function Login() {
  const { login } = useAuth();
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const enviar = async (evento) => {
    evento.preventDefault();
    setError('');
    setEnviando(true);

    try {
      await login(usuario.trim(), password);
    } catch (fallo) {
      setError(fallo.message || 'No se pudo iniciar sesión.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main className="login">
      <section className="login__marca" aria-label="Aeropuerto Internacional de la Ciudad de México">
        <div className="login__logo">
          <span className="login__logo-icono" aria-hidden="true">
            ✈
          </span>
          <div>
            <strong>AICM</strong>
            <span>Centro de operaciones</span>
          </div>
        </div>

        <div className="login__mensaje">
          <p className="eyebrow">Aeropuerto Internacional de la Ciudad de México</p>
          <h1>Operaciones en tierra, en tiempo real.</h1>
          <p>
            Un solo tablero para seguir vuelos, puertas, equipaje y avisos al
            pasajero. La información se actualiza sola cuando algo cambia en el
            aeropuerto.
          </p>
        </div>

        <ul className="login__lista">
          <li>
            <span aria-hidden="true">▣</span> 25 puertas y 10 bandas de equipaje
          </li>
          <li>
            <span aria-hidden="true">✈</span> Vuelos con estado, ocupación y ruta
          </li>
          <li>
            <span aria-hidden="true">◔</span> Notificaciones automáticas al pasajero
          </li>
          <li>
            <span aria-hidden="true">▤</span> 16 reportes exportables a Excel y PDF
          </li>
        </ul>
      </section>

      <section className="login__panel">
        <form className="tarjeta-login" onSubmit={enviar}>
          <header>
            <p className="eyebrow">Acceso al panel</p>
            <h2>Inicia sesión</h2>
            <p className="subtitulo">
              Usa tu cuenta de administrador o secretario de operaciones.
            </p>
          </header>

          <label className="campo">
            <span>Usuario o correo</span>
            <input
              type="text"
              name="usuario"
              autoComplete="username"
              placeholder="admin"
              value={usuario}
              onChange={(evento) => setUsuario(evento.target.value)}
              required
              autoFocus
            />
          </label>

          <label className="campo">
            <span>Contraseña</span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(evento) => setPassword(evento.target.value)}
              required
            />
          </label>

          {error ? (
            <p className="alerta alerta--error" role="alert">
              <span aria-hidden="true">!</span> {error}
            </p>
          ) : null}

          <button className="boton boton--primario" type="submit" disabled={enviando}>
            {enviando ? 'Verificando…' : 'Entrar al panel'}
          </button>

          <div className="demo">
            <strong>Cuentas de demostración</strong>
            <span>
              <code>admin</code> / <code>Admin123!</code> ·{' '}
              <code>secretario</code> / <code>Secretario123!</code>
            </span>
          </div>
        </form>
      </section>
    </main>
  );
}
