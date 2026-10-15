import { createContext, useContext, useLayoutEffect, useEffect } from 'react';
import useStoredPreference from '../hooks/useStoredPreference';

const PreferencesContext = createContext(null);
const isBoolean = value => typeof value === 'boolean';
export const FILTER_PREFIX = 'odontosmart.filters.';

export function PreferencesProvider({ children }) {
  const [textSize, setTextSize] = useStoredPreference('odontosmart.text-size', 'normal', value => ['normal', 'large'].includes(value));
  const [highContrast, setHighContrast] = useStoredPreference('odontosmart.high-contrast', false, isBoolean);
  const [reducedMotion, setReducedMotion] = useStoredPreference('odontosmart.reduced-motion', false, isBoolean);
  const [rowsPerPage, setRowsPerPage] = useStoredPreference('odontosmart.rows-per-page', 10, value => [10, 25, 50].includes(value));
  const [rememberFilters, setRememberFilters] = useStoredPreference('odontosmart.remember-filters', false, isBoolean);

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.dataset.textSize = textSize;
    root.dataset.highContrast = String(highContrast);
    root.dataset.reducedMotion = String(reducedMotion);
  }, [textSize, highContrast, reducedMotion]);

  useEffect(() => {
    if (rememberFilters) return;
    try {
      Object.keys(localStorage).filter(key => key.startsWith(FILTER_PREFIX)).forEach(key => localStorage.removeItem(key));
    } catch { /* Las preferencias siguen funcionando sin almacenamiento. */ }
  }, [rememberFilters]);

  return <PreferencesContext.Provider value={{ textSize, setTextSize, highContrast, setHighContrast, reducedMotion, setReducedMotion, rowsPerPage, setRowsPerPage, rememberFilters, setRememberFilters }}>{children}</PreferencesContext.Provider>;
}

export const usePreferences = () => useContext(PreferencesContext);
