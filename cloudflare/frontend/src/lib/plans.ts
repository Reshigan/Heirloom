// Canonical mapping between API tier names and frontend display.
// API values (UPPERCASE) come from the Cloudflare worker.
// Never hardcode tier strings elsewhere — import from here.

export type ApiTier = 'STARTER' | 'FAMILY' | 'DEEP' | 'LEGACY' | 'FOREVER' | 'FREE' | 'ESSENTIAL';

export const PLAN_DISPLAY: Record<string, string> = {
  STARTER: 'free',
  FREE:    'free',
  ESSENTIAL: 'family',
  FAMILY:  'family',
  DEEP:    'deep',
  LEGACY:  'founder',
  FOREVER: 'founder',
};

export const PLAN_CTA: Record<string, string> = {
  STARTER:  'Begin free',
  FAMILY:   'Go Family',
  DEEP:     'Go Deep',
  LEGACY:   'Become a founder',
};

export const PLAN_FEATURES: Record<string, string[]> = {
  STARTER: [
    'One bloodline in the Deep',
    '500 MB storage',
    'Try every feature — voice, photo & written entries',
    'Invite your whole family',
    'Export anytime — no lock-in',
  ],
  FAMILY: [
    'Unlimited entries in the Deep',
    'Voice entries',
    'Sealed & time-locked notes',
    'Up to 5 family members',
    '50 GB storage',
  ],
  DEEP: [
    'Everything in Family',
    'Unlimited family members — the whole bloodline',
    '250 GB storage',
    'Unlimited voice & video entries',
    'Priority support + dedicated onboarding',
    'Annual physical memory book',
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
    ['entries', 'unlimited'],
    ['members', 'unlimited'],
    ['voice', 'included'],
    ['storage', '500 MB'],
  ],
  FAMILY: [
    ['entries', 'unlimited'],
    ['members', '5'],
    ['voice', 'unlimited'],
    ['storage', '50 GB'],
  ],
  DEEP: [
    ['entries', 'unlimited'],
    ['members', 'unlimited'],
    ['voice', 'unlimited'],
    ['storage', '250 GB'],
  ],
  LEGACY: [
    ['entries', 'unlimited'],
    ['members', 'unlimited'],
    ['voice', 'unlimited'],
    ['storage', '500 GB'],
  ],
};

/**
 * Canonical DISPLAY prices (USD). Amounts are LOCKED — see CLAUDE.md pricing.
 * Single source of truth for the static plan cards (Signup, Billing) so the
 * numbers can never drift apart. Live currency-localized amounts (e.g. ZAR)
 * come from the worker /billing/tiers endpoint and are deliberately NOT here.
 *
 * FOUNDER is kept for existing founders' Billing display only — the tier is
 * withdrawn from buy surfaces (no Founder card on Pricing/Signup).
 */
export const PLAN_PRICE = {
  FREE:    { amount: 'free',  cycle: 'forever' },
  FAMILY:  { monthly: '$2.99', annual: '$29', perMonth: '/ month', perYear: '/ year' },
  DEEP:    { monthly: '$7.99', annual: '$79', perMonth: '/ month', perYear: '/ year' },
  FOUNDER: { amount: '$249', cycle: 'once · lifetime' },
} as const;

/**
 * Numeric companions to PLAN_PRICE (USD), LOCKED — see CLAUDE.md pricing.
 * Use these for API-failure fallbacks and anywhere a raw number is needed, so
 * the locked amounts live in exactly ONE file and parallel fallback tables can
 * never drift from the canonical values. Live ZAR/localized amounts come from
 * the worker /billing/tiers endpoint and are deliberately NOT here.
 */
export const PLAN_PRICE_NUM = {
  FAMILY:  { monthly: 2.99, annual: 29 },
  DEEP:    { monthly: 7.99, annual: 79 },
  FOUNDER: { lifetime: 249 },
} as const;

/** Convert any API tier string to the display label shown in UI. */
export function planLabel(apiTier: string): string {
  return PLAN_DISPLAY[apiTier?.toUpperCase()] ?? apiTier?.toLowerCase() ?? 'free';
}

/** Returns true if the API tier has access to paid features. */
export function isPaidTier(apiTier: string): boolean {
  const t = apiTier?.toUpperCase();
  return t === 'FAMILY' || t === 'DEEP' || t === 'LEGACY' || t === 'FOREVER' || t === 'ESSENTIAL' || t === 'FOUNDER';
}

/** Returns true if this is the Deep (unlimited-bloodline) tier. */
export function isDeepTier(apiTier: string): boolean {
  const t = apiTier?.toUpperCase();
  return t === 'DEEP';
}

/** Returns true if this is the founder/lifetime tier. The worker stores this
 *  as FOREVER (LEGACY normalizes to FOREVER); 'FOUNDER' is accepted defensively
 *  for any legacy record so role detection never misses a lifetime member. */
export function isFounderTier(apiTier: string): boolean {
  const t = apiTier?.toUpperCase();
  return t === 'LEGACY' || t === 'FOREVER' || t === 'FOUNDER';
}

/** Returns true if this is the free/starter tier. */
export function isFreeTier(apiTier: string): boolean {
  const t = apiTier?.toUpperCase();
  return t === 'STARTER' || t === 'FREE' || !t;
}