import { createContext, useContext, useState } from 'react';
import { authService } from '../services/authService';
import { useNotification } from './NotificationContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { notify } = useNotification();
  const [user, setUser] = useState(() => authService.getSession());

  async function login(username, password) {
    const sessionUser = await authService.login(username, password);
    setUser(sessionUser);
    notify('Iniciaste sesión correctamente.', 'success');
  }

  function logout() {
    authService.logout();
    setUser(null);
    notify('Cerraste la sesión.', 'info');
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: Boolean(user), login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe utilizarse dentro de AuthProvider.');
  return context;
}
