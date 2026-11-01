import { create } from 'zustand';
import { authService } from '../services/authService';

export const useSessionStore = create(set => ({
  user: null,
  restoring: true,
  restoreError: '',
  async restore() {
    set({ restoring: true, restoreError: '' });
    try { set({ user: await authService.restore() }); }
    catch { set({ restoreError: 'No pudimos recuperar la sesión. Intentá nuevamente.' }); }
    finally { set({ restoring: false }); }
  },
  async login(username, password) {
    set({ user: await authService.login(username, password) });
  },
  async logout() {
    await authService.logout();
    set({ user: null });
  },
}));
