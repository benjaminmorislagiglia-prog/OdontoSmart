import { requestList } from './api';
export const clinicalHistoryService = {
  async listByPatient(id, options = {}) {
    return (await requestList(`/api/HistorialClinico/paciente/${encodeURIComponent(id)}`, options)).map(dto => ({
      id: String(dto.idHistorialClinico), appointmentId: String(dto.idTurno),
      diagnosis: dto.diagnostico || '', treatment: dto.tratamientosRealizados || '', notes: dto.observaciones || '',
      annulled: dto.anulado, annulmentReason: dto.motivoAnulacion || '',
    }));
  },
};
