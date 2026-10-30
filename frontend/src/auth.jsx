import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { api } from './api';

const CLAVE_TOKEN = 'aicm.token';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(CLAVE_TOKEN));
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(Boolean(token));

  useEffect(() => {
    let activo = true;

    if (!token) {
      setUsuario(null);
      setCargando(false);
      return () => {
        activo = false;
      };
    }

    setCargando(true);

    api('/api/auth/me', { token })
      .then((datos) => {
        if (activo) setUsuario(datos.usuario);
      })
      .catch(() => {
        if (activo) {
          localStorage.removeItem(CLAVE_TOKEN);
          setToken(null);
          setUsuario(null);
        }
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [token]);

  const login = useCallback(async (nombreUsuario, password) => {
    const datos = await api('/api/auth/login', {
      method: 'POST',
      body: { nombre_usuario: nombreUsuario, password },
    });

    localStorage.setItem(CLAVE_TOKEN, datos.token);
    setToken(datos.token);
    setUsuario(datos.usuario);

    return datos.usuario;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(CLAVE_TOKEN);
    setToken(null);
    setUsuario(null);
  }, []);

  const valor = useMemo(
    () => ({ token, usuario, cargando, login, logout }),
    [token, usuario, cargando, login, logout]
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const contexto = useContext(AuthContext);

  if (!contexto) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }

  return contexto;
}
