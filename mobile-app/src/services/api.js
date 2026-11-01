import { Platform } from 'react-native';

export const apiConfig = { baseURL: (process.env.EXPO_PUBLIC_API_URL || '').trim().replace(/\/+$/, '') };

export class ApiError extends Error {
  constructor(message, status = 0, kind = 'http') {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.kind = kind;
  }
}

function configuredURL() {
  let url;
  try { url = new URL(apiConfig.baseURL); } catch {
    throw new ApiError('Configurá EXPO_PUBLIC_API_URL con la dirección de la API y reiniciá Expo.', 0, 'configuration');
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new ApiError('EXPO_PUBLIC_API_URL debe ser una dirección HTTP o HTTPS sin credenciales ni parámetros.', 0, 'configuration');
  }
  if (Platform.OS !== 'web' && /^(localhost|127(?:\.\d+){3}|\[?::1\]?|0\.0\.0\.0)$/i.test(url.hostname)) {
    throw new ApiError('Para acceder desde el teléfono, configurá EXPO_PUBLIC_API_URL con la IP de la computadora; localhost apunta al propio dispositivo.', 0, 'configuration');
  }
  return url;
}

export function resolvePhotoURL(path) {
  return path ? new URL(path, configuredURL()).toString() : null;
}

function serverMessage(body, status) {
  if (typeof body === 'string' && body.trim() && !body.includes('<')) return body;
  if (body?.errors) return Object.values(body.errors).flat().join('\n');
  return body?.mensaje || body?.message || body?.detail ||
    (status >= 500 ? 'El servidor no pudo completar la consulta. Intentá nuevamente.' :
      status === 404 ? 'El registro no está disponible.' : 'La API rechazó la operación. Revisá los datos.');
}

/** @param {string} path @param {RequestInit} [options] */
export async function request(path, options = {}) {
  configuredURL();
  const { signal, ...settings } = options;
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort);
  if (signal?.aborted) abort();
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, 15000);
  try {
    const response = await fetch(`${apiConfig.baseURL}/${path.replace(/^\//, '')}`, {
      ...settings,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(typeof settings.body === 'string' ? { 'Content-Type': 'application/json' } : {}),
        ...settings.headers,
      },
    });
    if (response.status === 204) return null;
    const text = await response.text();
    let body;
    try { body = JSON.parse(text); } catch { body = text; }
    if (!response.ok) throw new ApiError(serverMessage(body, response.status), response.status);
    if (!text || typeof body === 'string') {
      throw new ApiError('La API devolvió un formato inesperado. Verificá la dirección configurada.', response.status, 'response');
    }
    return body;
  } catch (error) {
    if (error instanceof ApiError || signal?.aborted) throw error;
    throw new ApiError(timedOut ? 'La API tardó demasiado en responder. Intentá nuevamente.' :
      'No se pudo conectar con la API. Comprobá que esté iniciada, la dirección, la red y el certificado HTTPS.', 0, timedOut ? 'timeout' : 'network');
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}

export async function requestList(path, options = {}) {
  const data = await request(path, options);
  if (!Array.isArray(data)) throw new ApiError('La API no devolvió el listado esperado.', 0, 'response');
  return data;
}
