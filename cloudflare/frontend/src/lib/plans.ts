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
  FAMILY:   'Start free 30-day trial',
  LEGACY:   'Become a founder',
};

export const PLAN_FEATURES: Record<string, string[]> = {
  STARTER: [
    'One family thread',
    '500 MB storage',
    'Try every feature — voice, photo & written',
    'Invite your whole family',
    'Export anytime — no lock-in',
  ],
  FAMILY: [
    'Unlimited threads & entries',
    'Voice entries',
    'Time-locked & sealed entries',
    'Up to 5 family members',
    '50 GB storage',
  ],
  LEGACY: [
    'Everything in Family, forever',
    'One-time payment — never billed again',
    'Founder badge + pledge number',
    'Locked price for life',
    'Vote on the product roadmap',
  ],
};

export const PLAN_LIMITS: Record<string, Array<[string, string]>> = {
  STARTER: [
    ['threads', '1'],
    ['members', 'unlimited'],
    ['voice', 'included'],
    ['storage', '500 MB'],
  ],
  FAMILY: [
    ['threads', 'unlimited'],
    ['members', '5'],
    ['voice', 'unlimited'],
    ['storage', '50 GB'],
  ],
  LEGACY: [
    ['threads', 'unlimited'],
    ['members', 'unlimited'],
    ['voice', 'unlimited'],
    ['storage', '500 GB'],
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
