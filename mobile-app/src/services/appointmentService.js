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
  async bookingCatalogs(options = {}) {
    const [dentists, employees, rooms] = await Promise.all([
      requestList('/api/Odontologos?activo=true', options),
      requestList('/api/Empleados?activo=true', options),
      requestList('/api/consultorios', options),
    ]);
    return {
      dentists: dentists.filter(dentist => dentist.activo && employees.some(employee => employee.idEmpleado === dentist.idEmpleado && employee.activo === true))
        .map(dentist => {
          const employee = employees.find(item => item.idEmpleado === dentist.idEmpleado);
          return { id: String(dentist.idOdontologo), label: `${employee.nombre} ${employee.apellido}`.trim(),
            description: [dentist.diaAtencion, dentist.horarioAtencion, dentist.nroMatricula && `Matrícula: ${dentist.nroMatricula}`].filter(Boolean).join(' · ') };
        }),
      rooms: rooms.map(room => ({ id: String(room.idConsultorio), label: room.nombre })),
    };
  },
  async create({ patientId, dentistId, roomId, date, time }) {
    if (!Number.isInteger(Number(patientId)) || Number(patientId) <= 0) throw new Error('Seleccioná un paciente válido.');
    if (!Number.isInteger(Number(dentistId)) || Number(dentistId) <= 0) throw new Error('Seleccioná un odontólogo.');
    if (!Number.isInteger(Number(roomId)) || Number(roomId) <= 0) throw new Error('Seleccioná un consultorio.');
    if (!date) throw new Error('Seleccioná la fecha del turno.');
    if (!time) throw new Error('Seleccioná la hora del turno.');
    return appointmentFromDTO(await request('/api/Turnos', {
      method: 'POST',
      body: JSON.stringify({ idPaciente: Number(patientId), idOdontologo: Number(dentistId), idConsultorio: Number(roomId), fecha: date, hora: time }),
    }));
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
