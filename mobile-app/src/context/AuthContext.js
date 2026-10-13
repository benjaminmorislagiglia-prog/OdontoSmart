import { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/authService';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [restoring, setRestoring] = useState(true);
  const [restoreError, setRestoreError] = useState('');
  async function restore() {
    setRestoring(true); setRestoreError('');
    try { setUser(await authService.restore()); }
    catch { setRestoreError('No pudimos recuperar la sesión. Intentá nuevamente.'); }
    finally { setRestoring(false); }
  }
  useEffect(() => {
    let active = true;
    authService.restore().then(value => { if (active) setUser(value); })
      .catch(() => { if (active) setRestoreError('No pudimos recuperar la sesión. Intentá nuevamente.'); })
      .finally(() => { if (active) setRestoring(false); });
    return () => { active = false; };
  }, []);
  async function login(username, password) { setUser(await authService.login(username, password)); }
  async function logout() { await authService.logout(); setUser(null); }
  return <AuthContext.Provider value={{ user, restoring, restoreError, restore, login, logout }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
