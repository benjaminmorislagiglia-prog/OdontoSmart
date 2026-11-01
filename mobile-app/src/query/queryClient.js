import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '../services/api';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      gcTime: 5 * 60 * 1000,
      retry: (failures, error) => failures < 1 && error instanceof ApiError &&
        (['network', 'timeout'].includes(error.kind) || error.status >= 500),
    },
    mutations: { retry: false },
  },
});
