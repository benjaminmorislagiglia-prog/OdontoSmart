import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSessionStore } from '../stores/sessionStore';

export function AuthProvider({ children }) {
  const restore = useSessionStore(state => state.restore);
  const user = useSessionStore(state => state.user);
  const client = useQueryClient();
  useEffect(() => {
    restore();
  }, [restore]);
  useEffect(() => {
    if (!user) {
      client.cancelQueries();
      client.clear();
    }
  }, [client, user]);
  return children;
}

export const useAuth = useSessionStore;
