import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

import { SOCKET_URL } from '../api';

/**
 * Conexión Socket.IO con el mismo JWT del panel.
 * El servidor solo emite `panel:actualizar`; el cliente vuelve a consultar
 * GET /api/panel para obtener el estado completo.
 */
export function useSocket({ token, activo = true, onCambio }) {
  const [estado, setEstado] = useState('desconectado');

  useEffect(() => {
    if (!token || !activo) {
      setEstado('desconectado');
      return undefined;
    }

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => setEstado('conectado'));
    socket.on('disconnect', () => setEstado('desconectado'));
    socket.on('connect_error', () => setEstado('error'));
    socket.on('panel:actualizar', onCambio);

    return () => {
      socket.off('panel:actualizar', onCambio);
      socket.close();
    };
  }, [token, activo, onCambio]);

  return estado;
}
