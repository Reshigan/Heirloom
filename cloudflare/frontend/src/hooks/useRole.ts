import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { billingApi, threadsApi } from '../services/api';

export type UserRole =
  | 'visitor'
  | 'trial'
  | 'family'
  | 'founder'
  | 'reader'
  | 'successor';

export function useRole(): UserRole {
  const { user, isAuthenticated } = useAuthStore();
  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => billingApi.getSubscription().then((r) => r.data),
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
  const { data: threadsData } = useQuery({
    queryKey: ['threads'],
    queryFn: () => threadsApi.list().then((r) => r.data),
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  if (!isAuthenticated || !user) return 'visitor';

  const tier = (subscription as any)?.tier ?? 'STARTER';
  const status = (subscription as any)?.status ?? null;
  const isTrialing = status === 'TRIALING';

  // If the user has no write-capable thread but has a read-only thread membership,
  // their operative role is reader/successor regardless of billing tier.
  const threads: Array<{ role: string }> = (threadsData as any)?.threads ?? [];
  const hasWriteThread = threads.some(
    (t) => t.role === 'FOUNDER' || t.role === 'AUTHOR'
  );
  const readOnlyThread = !hasWriteThread
    ? threads.find((t) => t.role === 'READER' || t.role === 'SUCCESSOR')
    : null;
  if (readOnlyThread) {
    return readOnlyThread.role === 'SUCCESSOR' ? 'successor' : 'reader';
  }

  if (tier === 'FOUNDER') return 'founder';
  if (tier === 'FAMILY' && !isTrialing) return 'family';
  if (isTrialing) return 'trial';
  if (tier === 'FREE' || tier === 'STARTER') return 'visitor';
  return 'family';
}
