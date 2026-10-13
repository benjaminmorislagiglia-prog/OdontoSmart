import { useState } from 'react';

// Las preferencias visuales pueden funcionar incluso si el almacenamiento está bloqueado.
export default function useStoredPreference(key, fallback, isValid) {
  const [value, setValue] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(key));
      if (isValid(stored)) return stored;
    } catch { /* Usar el valor inicial. */ }
    return typeof fallback === 'function' ? fallback() : fallback;
  });

  function update(nextValue) {
    setValue(nextValue);
    try { localStorage.setItem(key, JSON.stringify(nextValue)); }
    catch { /* Mantener la preferencia durante esta sesión. */ }
  }
  return [value, update];
}
