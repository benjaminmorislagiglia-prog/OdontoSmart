// Configuración para la misma API de la web. Todavía no se realizan solicitudes.
export const apiConfig = { baseURL: process.env.EXPO_PUBLIC_API_URL || '' };
export async function request(path, options = {}) {
  if (!apiConfig.baseURL) throw new Error('Falta configurar la URL de la API.');
  const response = await fetch(`${apiConfig.baseURL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`, {
    ...options, headers: { Accept: 'application/json', ...options.headers },
  });
  if (!response.ok) throw new Error('No se pudo obtener la información.');
  return response.status === 204 ? null : response.json();
}
