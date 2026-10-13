// Datos ficticios de demostración. No representan registros de la base real.
export function createDashboardMock() {
  return {
    metrics: { patients: 1248, dentists: 8, pending: 5, cancelled: 2 },
    appointments: [
      { id: 1, time: '09:00', patient: 'Lucía Fernández', dentist: 'Dra. Valentina López', treatment: 'Control odontológico', room: '01', status: 'Atendido' },
      { id: 2, time: '09:30', patient: 'Martín Rodríguez', dentist: 'Dr. Nicolás Pérez', treatment: 'Limpieza dental', room: '02', status: 'Atendido' },
      { id: 3, time: '10:00', patient: 'Camila Torres', dentist: 'Dra. Valentina López', treatment: 'Restauración', room: '01', status: 'Confirmado' },
      { id: 4, time: '10:30', patient: 'Santiago Gómez', dentist: 'Dra. Sofía Martínez', treatment: 'Consulta de ortodoncia', room: '03', status: 'Pendiente' },
      { id: 5, time: '11:00', patient: 'Florencia Díaz', dentist: 'Dr. Nicolás Pérez', treatment: 'Control odontológico', room: '02', status: 'Confirmado' },
      { id: 6, time: '11:30', patient: 'Tomás Romero', dentist: 'Dra. Sofía Martínez', treatment: 'Consulta de ortodoncia', room: '03', status: 'Cancelado' },
    ],
    supplies: [
      { id: 1, name: 'Guantes de nitrilo · talle M', detail: '3 cajas disponibles · mínimo 5', kind: 'Stock bajo' },
      { id: 2, name: 'Anestesia local', detail: 'Vencimiento en 15 días', kind: 'Por vencer' },
      { id: 3, name: 'Gasas estériles', detail: '8 paquetes disponibles · mínimo 10', kind: 'Stock bajo' },
    ],
    activity: [
      { id: 1, title: 'Turno confirmado', detail: 'Camila Torres · hoy, 10:00', time: 'Hace 10 min' },
      { id: 2, title: 'Paciente registrado', detail: 'Lucía Fernández', time: 'Hace 25 min' },
      { id: 3, title: 'Turno cancelado', detail: 'Tomás Romero · hoy, 11:30', time: 'Hace 40 min' },
    ],
  };
}
