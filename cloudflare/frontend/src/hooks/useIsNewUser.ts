import { useQuery } from '@tanstack/react-query';
import { memoriesApi, lettersApi, voiceApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';

export function useIsNewUser() {
  const { isAuthenticated } = useAuthStore();

  const { data: memCount, isLoading: ml } = useQuery({
    queryKey: ['new-user-check-memories'],
    queryFn: () =>
      memoriesApi
        .getAll({ limit: 1 })
        .then(r => {
          const data = r.data as any;
          return Array.isArray(data?.data) ? data.data.length : Array.isArray(data) ? data.length : 0;
        })
        .catch(() => 0),
    staleTime: 60_000,
    enabled: isAuthenticated,
  });
  const { data: letCount, isLoading: ll } = useQuery({
    queryKey: ['new-user-check-letters'],
    queryFn: () =>
      lettersApi
        .getAll({ limit: 1 })
        .then(r => {
          const data = r.data as any;
          return Array.isArray(data?.data) ? data.data.length : Array.isArray(data) ? data.length : 0;
        })
        .catch(() => 0),
    staleTime: 60_000,
    enabled: isAuthenticated,
  });
  const { data: voiceCount, isLoading: vl } = useQuery({
    queryKey: ['new-user-check-voice'],
    queryFn: () =>
      voiceApi
        .getAll({ limit: 1 })
        .then(r => {
          const data = r.data as any;
          return Array.isArray(data?.data) ? data.data.length : Array.isArray(data) ? data.length : 0;
        })
        .catch(() => 0),
    staleTime: 60_000,
    enabled: isAuthenticated,
  });
  const isLoading = ml || ll || vl;
  const totalEntries = (memCount ?? 0) + (letCount ?? 0) + (voiceCount ?? 0);
  return { isNewUser: isAuthenticated && !isLoading && totalEntries === 0, isLoading };
}
