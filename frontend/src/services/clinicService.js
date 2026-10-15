import { api } from './api';
const paths = {
 turnos: '/api/Turnos', odontologos: '/api/Odontologos', especialidades: '/api/especialidades',
 consultorios: '/api/consultorios', historias: '/api/HistorialClinico', estados: '/api/estadosturno',
 historialEstados: '/api/historialestadoturno', asociaciones: '/api/odontologoespecialidades',
 direcciones: '/api/direcciones', localidades: '/api/localidades', empleados: '/api/Empleados', puestos: '/api/puestos',
 obrasSociales: '/api/obrasociales', pacientes: '/api/Pacientes'
};
export function resourceService(resource) {
 const path = paths[resource];
 if (!path) throw new Error('Recurso desconocido.');
 const itemPath = id => {
  if (!/^[1-9]\d*$/.test(String(id))) throw new Error('Identificador inválido.');
  return path + '/' + id;
 };
 return {
  async list({signal} = {}) { const {data} = await api.get(path,{signal}); if(!Array.isArray(data)) throw new Error('La API devolvió un listado inesperado.'); return data; },
  async get(id, {signal} = {}) { return (await api.get(itemPath(id),{signal})).data; },
  async create(data) { return (await api.post(path,data)).data; },
  async update(id,data) { return (await api.put(itemPath(id),data)).data; },
  async remove(id) { return (await api.delete(itemPath(id))).data; }
 };
}
export const turnoService = resourceService('turnos');
export const estadoService = resourceService('estados');
export const historialEstadoService = resourceService('historialEstados');
export async function getHistorialTurno(id) { return (await api.get('/api/historialestadoturno/turno/' + Number(id))).data; }
export async function getEspecialidadesOdontologo(id) { return (await api.get('/api/odontologoespecialidades/odontologo/' + Number(id))).data; }
export async function loadPacienteCatalogs(options) {
 const [direcciones, obrasSociales] = await Promise.all([resourceService('direcciones').list(options), resourceService('obrasSociales').list(options)]);
 return {direcciones, obrasSociales};
}
export const labelDireccion = d => d.calle + ' ' + d.numero + (d.barrio ? ', ' + d.barrio : '') + ' · CP ' + d.cp;
export const labelPersona = p => p.nombre + ' ' + p.apellido;
