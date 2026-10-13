import { patients } from '../mocks/patients';
export const patientService = {
  async list() { return patients.map(patient => ({ ...patient })); },
  async getById(id) { const patient = patients.find(item => item.id === id); return patient ? { ...patient } : null; },
};
