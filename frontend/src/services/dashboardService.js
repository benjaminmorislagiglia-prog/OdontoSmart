import { createDashboardMock } from '../mocks/dashboard';

export const dashboardService = {
  async getSummary() {
    // Sustituir esta implementación cuando se acuerde el contrato HTTP.
    return createDashboardMock();
  },
};
