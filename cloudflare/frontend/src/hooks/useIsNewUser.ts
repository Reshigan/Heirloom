import { useQuery } from '@tanstack/react-query';
import { memoriesApi, lettersApi, voiceApi } from '../services/api';

export function useIsNewUser() {
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
  });
  const isLoading = ml || ll || vl;
  const totalEntries = (memCount ?? 0) + (letCount ?? 0) + (voiceCount ?? 0);
  return { isNewUser: !isLoading && totalEntries === 0, isLoading };
}
