import { api, apiBaseURL } from './api';

export function profilePhotoUrl(path) {
 if (!apiBaseURL || typeof path !== 'string' || !/^\/api\/fotos-perfil\/[a-f0-9]{32}\.webp$/.test(path)) return null;
 return new URL(path,apiBaseURL+'/').href;
}
export async function uploadProfilePhoto(resource,id,file) {
 if (!['Pacientes','Empleados'].includes(resource) || !/^[1-9]\d*$/.test(String(id))) throw new Error('Registro de foto inválido.');
 const form = new FormData();
 form.append('archivo',file);
 return (await api.put(`/api/${resource}/${id}/foto`,form)).data;
}
