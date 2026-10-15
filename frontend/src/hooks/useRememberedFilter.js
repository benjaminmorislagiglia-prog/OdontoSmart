import { useEffect, useState } from 'react';
import { FILTER_PREFIX, usePreferences } from '../context/PreferencesContext';

// Sólo conserva el valor del control; nunca almacena respuestas de la API.
export default function useRememberedFilter(name, fallback, isValid = value => typeof value === 'string') {
  const { rememberFilters } = usePreferences();
  const key = FILTER_PREFIX + name;
  const [value, setValue] = useState(() => {
    if (rememberFilters) {
      try {
        const saved = JSON.parse(localStorage.getItem(key));
        if (isValid(saved)) return saved;
      } catch { /* Usar el filtro inicial. */ }
    }
    return typeof fallback === 'function' ? fallback() : fallback;
  });
  useEffect(() => {
    try {
      if (rememberFilters) localStorage.setItem(key, JSON.stringify(value));
      else localStorage.removeItem(key);
    } catch { /* Mantener el filtro durante esta visita. */ }
  }, [key, value, rememberFilters]);
  return [value, setValue];
}
