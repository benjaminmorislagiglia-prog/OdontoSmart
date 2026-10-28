import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors as lightColors, darkColors, createThemeStyles } from '../styles/theme';
const ThemeContext = createContext(null);
const THEME_STORAGE_KEY = 'odontosmart-theme';
export function ThemeProvider({ children }) {
  const [mode, setMode] = useState('light');
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((value) => {
        if (value === 'dark') setMode('dark');
      })
      .catch(() => setError('No se pudo recuperar la preferencia visual.'))
      .finally(() => setReady(true));
  }, []);
  async function changeMode(value) {
    setError('');
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, value);
      setMode(value);
    } catch {
      setError('No se pudo guardar el tema. Intentá nuevamente.');
    }
  }
  const colors = mode === 'dark' ? darkColors : lightColors;
  const styles = useMemo(() => createThemeStyles(colors), [colors]);
  return (
    <ThemeContext.Provider value={{ colors, styles, mode, ready, error, changeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}
export const useTheme = () => useContext(ThemeContext);
