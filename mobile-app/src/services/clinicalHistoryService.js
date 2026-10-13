import { clinicalHistory } from '../mocks/clinicalHistory';
export const clinicalHistoryService = {
  async listByPatient(id) { return clinicalHistory.filter(item => item.patientId === id).sort((a, b) => b.date.localeCompare(a.date)).map(item => ({ ...item })); },
};
