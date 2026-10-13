import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
export default function useResource(loader) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  useFocusEffect(useCallback(() => {
    let active = true;
    loader().then(value => { if (active) { setData(value); setError(''); } })
      .catch(() => { if (active) setError('No pudimos cargar la información. Intentá nuevamente.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  // Revision deliberately reruns the focused resource when the user retries.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loader, revision]));
  return { data, loading, error, retry: () => { setLoading(true); setError(''); setRevision(value => value + 1); } };
}
