import { api } from './api';
const path = '/api/Pacientes'; // Contrato publicado por Swagger.
function patientPath(id) {
 if (!/^[1-9]\d*$/.test(String(id)) || Number(id) > 2147483647) throw new Error('El identificador del paciente no es válido.');
 return path + '/' + id;
}
export async function getPacientes({ signal, activo } = {}) {
 const { data } = await api.get(path, { signal, params: activo === undefined ? undefined : { activo } });
 if (!Array.isArray(data)) throw new Error('La API devolvió un listado de pacientes con un formato inesperado.');
 return data;
}
export async function getPacienteById(id, { signal } = {}) {
 const { data } = await api.get(patientPath(id), { signal, params: { incluirInactivos: true } });
 if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('La API devolvió un paciente con un formato inesperado.');
 return data;
}
export async function createPaciente(data) { return (await api.post(path, data)).data; }
export async function updatePaciente(id, data, { reactivar = false } = {}) {
 return (await api.put(patientPath(id), data, { params: reactivar ? { reactivar:true } : undefined })).data;
}
export async function deletePaciente(id) { return (await api.delete(patientPath(id))).data; }
export async function reactivatePaciente(id) { return (await api.post(patientPath(id) + '/reactivar')).data; }
