import { useEffect, useState } from 'react';
import { apiErrorMessage } from '../services/api';
export default function usePacienteQuery(loader) {
 const [state, setState] = useState({ data: null, loading: true, error: '' });
 const [revision, setRevision] = useState(0);
 useEffect(() => {
  const controller = new AbortController();
  setState({ data: null, loading: true, error: '' });
  loader({ signal: controller.signal }).then(data => {
   if (!controller.signal.aborted) setState({ data, loading: false, error: '' });
  }).catch(error => {
   if (!controller.signal.aborted) setState({ data: null, loading: false, error: apiErrorMessage(error) });
  });
  return () => controller.abort();
 }, [loader, revision]);
 return { ...state, reload: () => setRevision(value => value + 1) };
}
