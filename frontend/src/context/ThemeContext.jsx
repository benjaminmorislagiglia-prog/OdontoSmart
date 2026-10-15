import { createContext, useContext, useLayoutEffect, useEffect, useState } from 'react';
import useStoredPreference from '../hooks/useStoredPreference';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [themePreference, setThemePreference] = useStoredPreference(
    'odontosmart.theme',
    'system',
    value => ['light', 'dark', 'system'].includes(value),
  );
  const [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => setSystemDark(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const theme = themePreference === 'system' ? (systemDark ? 'dark' : 'light') : themePreference;

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.bsTheme = theme;
  }, [theme]);

  return <ThemeContext.Provider value={{ theme, themePreference, setThemePreference, toggleTheme: () => setThemePreference(theme === 'dark' ? 'light' : 'dark') }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
