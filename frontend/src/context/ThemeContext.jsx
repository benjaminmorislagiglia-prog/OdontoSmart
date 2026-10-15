import { createContext, useContext, useLayoutEffect } from 'react';
import useStoredPreference from '../hooks/useStoredPreference';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useStoredPreference(
    'odontosmart.theme',
    'light',
    value => value === 'light' || value === 'dark',
  );

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.bsTheme = theme;
    // Normalizar también preferencias antiguas que ya no están disponibles.
    try { localStorage.setItem('odontosmart.theme', JSON.stringify(theme)); }
    catch { /* Mantener el tema durante esta sesión. */ }
  }, [theme]);

  return <ThemeContext.Provider value={{ theme, toggleTheme: () => setTheme(theme === 'dark' ? 'light' : 'dark') }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
