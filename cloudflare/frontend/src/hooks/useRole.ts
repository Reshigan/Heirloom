import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { billingApi } from '../services/api';

// Only the four values this function can actually return are in the type.
// TODO: 'author' | 'reader' | 'successor' | 'future_member' | 'legacy' | 'admin'
// require backend changes before they can be surfaced here.
export type UserRole =
  | 'visitor'
  | 'trial'
  | 'family'
  | 'founder';

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
  if (tier === 'FREE' || tier === 'STARTER') return 'visitor';
  return 'family';
}
