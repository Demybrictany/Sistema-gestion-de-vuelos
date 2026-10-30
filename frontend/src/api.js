const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(mensaje, estado) {
    super(mensaje);
    this.name = 'ApiError';
    this.estado = estado;
  }
}

export async function api(path, { token, method = 'GET', body, signal } = {}) {
  const headers = {};

  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const respuesta = await fetch(`${BASE}${path}`, {
    method,
    headers,
    signal,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const tipo = respuesta.headers.get('content-type') || '';
  const datos = tipo.includes('application/json')
    ? await respuesta.json().catch(() => null)
    : null;

  if (!respuesta.ok) {
    throw new ApiError(
      datos?.mensaje || `No se pudo completar la solicitud (${respuesta.status})`,
      respuesta.status
    );
  }

  return datos;
}

export async function descargarReporte(path, token, nombre) {
  const respuesta = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!respuesta.ok) {
    const datos = await respuesta.json().catch(() => null);
    throw new ApiError(
      datos?.mensaje || `No se pudo descargar el reporte (${respuesta.status})`,
      respuesta.status
    );
  }

  const blob = await respuesta.blob();
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');

  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}

export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || BASE || window.location.origin;

export const formatoNumero = new Intl.NumberFormat('es-GT');

export const formatearNumero = (valor) =>
  Number.isFinite(Number(valor)) ? formatoNumero.format(Number(valor)) : '—';

export const formatearFecha = (valor) => {
  if (!valor) return '—';

  const fecha = new Date(`${valor}T00:00:00`);

  if (Number.isNaN(fecha.getTime())) return String(valor);

  return fecha.toLocaleDateString('es-GT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatearHora = (valor) => (valor ? String(valor).slice(0, 5) : '—');

export const formatearFechaHora = (valor) => {
  if (!valor) return '—';

  const fecha = new Date(valor);

  if (Number.isNaN(fecha.getTime())) return String(valor);

  return fecha.toLocaleString('es-GT', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};
