import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { billingApi } from '../services/api';

export type UserRole =
  | 'visitor'
  | 'trial'
  | 'family'
  | 'founder'
  | 'author'
  | 'reader'
  | 'successor'
  | 'future_member'
  | 'legacy'
  | 'admin';

export function useRole(): UserRole {
  const { user, isAuthenticated } = useAuthStore();
  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => billingApi.getSubscription().then((r) => r.data),
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  if (!isAuthenticated || !user) return 'visitor';

  const tier = (subscription as any)?.tier ?? 'STARTER';
  const status = (subscription as any)?.status ?? null;
  const isTrialing = status === 'TRIALING';

  if (tier === 'FOUNDER') return 'founder';
  if (tier === 'FAMILY' && !isTrialing) return 'family';
  if (isTrialing) return 'trial';
  return 'family'; // STARTER with active sub fallback
}
