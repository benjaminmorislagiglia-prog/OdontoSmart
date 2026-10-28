import { resourceService } from './clinicService';
import { todayKey } from '../utils/formValidation.js';

export const dashboardService = {
  async getSummary() {
    const [turnos, pacientes, odontologos, historial, estados] = await Promise.all(
      ['turnos', 'pacientes', 'odontologos', 'historialEstados', 'estados'].map((key) =>
        resourceService(key).list(),
      ),
    );
    const today = todayKey();
    return {
      states: estados.map((e) => e.nombre),
      appointments: turnos
        .filter((t) => t.fecha === today)
        .map((t) => ({
          id: t.idTurno,
          time: t.hora,
          patient: t.paciente,
          dentist: t.odontologo,
          room: t.consultorio,
          status: t.estado || 'Sin estado registrado',
        })),
      metrics: {
        patients: pacientes.length,
        dentists: odontologos.length,
        pending: turnos.filter((t) => t.estado === 'Pendiente').length,
        cancelled: turnos.filter((t) => t.estado === 'Cancelado').length,
      },
      supplies: [],
      activity: historial
        .slice()
        .sort(
          (a, b) =>
            b.fechaHora.localeCompare(a.fechaHora) ||
            b.idHistorialEstadoTurno - a.idHistorialEstadoTurno,
        )
        .slice(0, 5)
        .map((h) => {
          const turno = turnos.find((t) => t.idTurno === h.idTurno);
          const estado = estados.find((e) => e.idEstadoTurno === h.idEstadoTurno);
          return {
            id: h.idHistorialEstadoTurno,
            title: estado?.nombre || 'Cambio de estado',
            detail: turno?.paciente || 'Turno ' + h.idTurno,
            time: new Intl.DateTimeFormat('es-AR', {
              dateStyle: 'short',
              timeStyle: 'short',
            }).format(new Date(h.fechaHora)),
          };
        }),
    };
  },
};
