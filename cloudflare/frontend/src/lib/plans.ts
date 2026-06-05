// Canonical mapping between API tier names and frontend display.
// API values (UPPERCASE) come from the Cloudflare worker.
// Never hardcode tier strings elsewhere — import from here.

export type ApiTier = 'STARTER' | 'FAMILY' | 'LEGACY' | 'FOREVER' | 'FREE' | 'ESSENTIAL';

export const PLAN_DISPLAY: Record<string, string> = {
  STARTER: 'free',
  FREE:    'free',
  ESSENTIAL: 'family',
  FAMILY:  'family',
  LEGACY:  'founder',
  FOREVER: 'founder',
};

export const PLAN_CTA: Record<string, string> = {
  STARTER:  'Begin free',
  FAMILY:   'Start 30-day trial',
  LEGACY:   'Become a founder',
};

export const PLAN_FEATURES: Record<string, string[]> = {
  STARTER: [
    '1 thread',
    '30 entries / yr',
    'Read-only inheritance link',
    'Export anytime',
  ],
  FAMILY: [
    'Unlimited threads',
    'Unlimited entries',
    'Time-locked entries',
    'Voice entries',
    'Up to 5 family members',
    '30-day trial',
  ],
  LEGACY: [
    'Everything in Family',
    'Founder badge + pledge number',
    'Locked price forever',
    'Vote on the product roadmap',
  ],
};

export const PLAN_LIMITS: Record<string, Array<[string, string]>> = {
  STARTER: [
    ['memories', '50'],
    ['letters', '10'],
    ['voice', '15 min'],
    ['storage', '1 GB'],
  ],
  FAMILY: [
    ['memories', 'unlimited'],
    ['letters', 'unlimited'],
    ['voice', '180 min'],
    ['storage', '25 GB'],
  ],
  LEGACY: [
    ['memories', 'unlimited'],
    ['letters', 'unlimited'],
    ['voice', 'unlimited'],
    ['storage', '100 GB'],
  ],
};

/** Convert any API tier string to the display label shown in UI. */
export function planLabel(apiTier: string): string {
  return PLAN_DISPLAY[apiTier?.toUpperCase()] ?? apiTier?.toLowerCase() ?? 'free';
}

/** Returns true if the API tier has access to paid features. */
export function isPaidTier(apiTier: string): boolean {
  const t = apiTier?.toUpperCase();
  return t === 'FAMILY' || t === 'LEGACY' || t === 'FOREVER' || t === 'ESSENTIAL';
}

/** Returns true if this is the founder/lifetime tier. */
export function isFounderTier(apiTier: string): boolean {
  const t = apiTier?.toUpperCase();
  return t === 'LEGACY' || t === 'FOREVER';
}

/** Returns true if this is the free/starter tier. */
export function isFreeTier(apiTier: string): boolean {
  const t = apiTier?.toUpperCase();
  return t === 'STARTER' || t === 'FREE' || !t;
}
