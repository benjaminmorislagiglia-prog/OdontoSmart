import { dateKey, shiftDay } from '../utils/dates';
const today = dateKey();
// Jornada local de ejemplo, sustituible mediante appointmentService.
export const appointments = [
  { id: 'a1', patientId: 'p1', date: today, time: '09:00', dentist: 'Dra. Valentina López', treatment: 'Control odontológico', room: '01', status: 'Atendido', notes: 'Control semestral.' },
  { id: 'a2', patientId: 'p2', date: today, time: '10:30', dentist: 'Dr. Nicolás Pérez', treatment: 'Limpieza dental', room: '02', status: 'Confirmado', notes: '' },
  { id: 'a3', patientId: 'p3', date: today, time: '11:00', dentist: 'Dra. Valentina López', treatment: 'Restauración', room: '01', status: 'Pendiente', notes: 'Revisar sensibilidad referida en la consulta anterior.' },
  { id: 'a4', patientId: 'p1', date: today, time: '15:00', dentist: 'Dr. Nicolás Pérez', treatment: 'Consulta', room: '02', status: 'Cancelado', notes: 'El paciente solicitó reprogramar.' },
  { id: 'a5', patientId: 'p2', date: shiftDay(today, 1), time: '14:00', dentist: 'Dra. Valentina López', treatment: 'Control', room: '01', status: 'Pendiente', notes: '' },
  { id: 'a6', patientId: 'p3', date: shiftDay(today, -7), time: '09:30', dentist: 'Dra. Valentina López', treatment: 'Evaluación inicial', room: '01', status: 'Atendido', notes: '' },
];
