import axios from 'axios';
export const apiBaseURL = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');
export const api = axios.create({ baseURL: apiBaseURL || undefined, timeout: 15000, headers: { Accept: 'application/json' } });
api.interceptors.request.use(config => {
 if (!apiBaseURL) throw new Error('Falta configurar VITE_API_URL con la URL real de la API y reiniciar Vite.');
 return config;
});
export function apiErrorMessage(error) {
 if (error.response) {
  const { status, data } = error.response;
    if (typeof data?.mensaje === 'string') return data.mensaje;
  const validation = data?.errors && typeof data.errors === 'object' ? Object.values(data.errors).flat().filter(v => typeof v === 'string').join(' ') : '';
  if (validation) return validation;
  if (typeof data === 'string' && data.length < 500 && !data.includes('<')) return data;
  if (status === 404) return 'El paciente no está disponible o no fue encontrado.';
  if (status === 409) return 'La operación entra en conflicto con los datos actuales. Revisá los datos.';
  if (status === 401 || status === 403) return 'La API no autorizó la operación. Consultá al equipo de backend.';
  if (status >= 500) return 'La API no pudo completar la operación. Intentá nuevamente.';
  return typeof data?.title === 'string' ? data.title : 'La API rechazó la operación. Revisá los datos ingresados.';
 }
 if (error.code === 'ECONNABORTED') return 'La API tardó demasiado en responder. Intentá nuevamente.';
 if (error.request) return 'No se pudo conectar con la API. Revisá su disponibilidad, la URL configurada y los permisos CORS.';
 return error.message || 'No se pudo completar la operación.';
}
