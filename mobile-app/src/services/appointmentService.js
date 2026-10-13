import { appointments } from '../mocks/appointments';
import { patients } from '../mocks/patients';
import { dateKey } from '../utils/dates';
const localAppointments = appointments.map(item => ({ ...item }));
export const appointmentStates = ['Pendiente', 'Confirmado', 'Cancelado', 'Atendido'];
export function availableTransitions(status) {
  if (status === 'Pendiente') return ['Confirmado', 'Cancelado'];
  if (status === 'Confirmado') return ['Atendido', 'Cancelado'];
  return [];
}
function expand(item) {
  if (!item) return null;
  const patient = patients.find(patient => patient.id === item.patientId);
  return { ...item, patient: patient?.name || 'Paciente sin identificar', phone: patient?.phone || '' };
}
export const appointmentService = {
  async listToday() { return appointmentService.listByDate(dateKey()); },
  async listByDate(date) {
    return localAppointments.filter(item => item.date === date).sort((a, b) => a.time.localeCompare(b.time)).map(expand);
  },
  async getById(id) { return expand(localAppointments.find(item => item.id === id)); },
  async listByPatient(id) {
    return localAppointments.filter(item => item.patientId === id).sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)).map(expand);
  },
  async updateStatus(id, status) {
    const appointment = localAppointments.find(item => item.id === id);
    if (!appointment) throw new Error('El turno no está disponible.');
    if (!availableTransitions(appointment.status).includes(status)) throw new Error('El estado del turno cambió. Volvé a consultar el detalle.');
    appointment.status = status;
    return expand(appointment);
  },
};
