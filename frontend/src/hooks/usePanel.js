import { useCallback, useEffect, useRef, useState } from 'react';

import { api } from '../api';

/**
 * Carga el panel operativo y lo mantiene al día.
 * - Consulta inicial y refresco manual.
 * - Refresco silencioso cada 30 s como respaldo del Socket.IO.
 * - `refrescarPronto` agrupa las ráfagas de eventos del socket.
 */
export function usePanel(token, activo = true) {
  const [panel, setPanel] = useState(null);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [actualizadoEn, setActualizadoEn] = useState(null);
  const temporizador = useRef(null);
  const montado = useRef(true);

  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
      clearTimeout(temporizador.current);
    };
  }, []);

  const cargar = useCallback(
    async ({ silencioso = false } = {}) => {
      if (!token || !activo) return;

      if (!silencioso) setCargando(true);

      try {
        const datos = await api('/api/panel', { token });

        if (!montado.current) return;

        setPanel(datos);
        setActualizadoEn(new Date());
        setError(null);
      } catch (fallo) {
        if (montado.current) setError(fallo);
      } finally {
        if (montado.current) setCargando(false);
      }
    },
    [token, activo]
  );

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    if (!activo) return undefined;

    const intervalo = setInterval(() => cargar({ silencioso: true }), 30000);

    return () => clearInterval(intervalo);
  }, [cargar, activo]);

  const refrescarPronto = useCallback(() => {
    clearTimeout(temporizador.current);
    temporizador.current = setTimeout(
      () => cargar({ silencioso: true }),
      300
    );
  }, [cargar]);

  return {
    panel,
    cargando,
    error,
    actualizadoEn,
    refrescar: cargar,
    refrescarPronto,
  };
}
