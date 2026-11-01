import { request, requestList } from './api';
import { dateKey } from '../utils/dates';

function appointmentFromDTO(dto) {
  return {
    id: String(dto.idTurno), patientId: String(dto.idPaciente),
    date: dto.fecha, time: dto.hora.slice(0, 5),
    patient: dto.paciente, dentist: dto.odontologo, room: dto.consultorio,
    status: dto.estado || 'Sin estado', statusId: dto.idEstadoTurno,
    allowedStateIds: dto.estadosPermitidos || [],
  };
}

export function availableTransitions(appointment, states) {
  return states.filter(state => appointment.allowedStateIds.includes(state.id));
}

export const appointmentService = {
  async list(options = {}) {
    return (await requestList('/api/Turnos', options)).map(appointmentFromDTO);
  },
  async listToday(options = {}) { return appointmentService.listByDate(dateKey(), options); },
  async listByDate(date, options = {}) {
    return (await appointmentService.list(options)).filter(item => item.date === date);
  },
  async listByPatient(id, options = {}) {
    return (await appointmentService.list(options)).filter(item => item.patientId === String(id));
  },
  async getById(id, options = {}) {
    return appointmentFromDTO(await request(`/api/Turnos/${encodeURIComponent(id)}`, options));
  },
  async states(options = {}) {
    return (await requestList('/api/estadosturno', options)).map(dto => ({ id: dto.idEstadoTurno, name: dto.nombre }));
  },
  async updateStatus(id, stateId) {
    return request('/api/historialestadoturno', {
      method: 'POST', body: JSON.stringify({ idTurno: Number(id), idEstadoTurno: Number(stateId) }),
    });
  },
};
