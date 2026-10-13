import { dateKey, shiftDay } from '../utils/dates';
export const clinicalHistory = [
  { id: 'h1', patientId: 'p1', date: shiftDay(dateKey(), -3), dentist: 'Dra. Valentina López', diagnosis: 'Control preventivo', treatment: 'Evaluación y recomendaciones de higiene.', notes: 'Próximo control en seis meses.' },
  { id: 'h2', patientId: 'p3', date: shiftDay(dateKey(), -7), dentist: 'Dra. Valentina López', diagnosis: 'Sensibilidad dental', treatment: 'Evaluación inicial y planificación de restauración.', notes: 'Se acordó una nueva consulta.' },
  { id: 'h3', patientId: 'p1', date: shiftDay(dateKey(), -100), dentist: 'Dr. Nicolás Pérez', diagnosis: 'Acumulación de placa', treatment: 'Limpieza dental.', notes: 'Sin observaciones adicionales.' },
];
