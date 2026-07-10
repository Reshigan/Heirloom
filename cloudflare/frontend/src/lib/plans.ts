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

/** Per-tier storage labels — the single frontend source. Must match the
 *  worker TIER_LIMITS.maxStorageLabel. Referenced everywhere a plan's storage
 *  is shown so the strings can't drift file-to-file. */
export const PLAN_STORAGE = {
  STARTER: '50 MB',
  FAMILY:  '50 GB',
  DEEP:    '250 GB',
  FOUNDER: '500 GB',
} as const;

export const PLAN_FEATURES: Record<string, string[]> = {
  STARTER: [
    'One bloodline in the Deep',
    `${PLAN_STORAGE.STARTER} storage`,
    'Try every feature — voice, photo & written entries',
    'Invite your whole family',
    'Export anytime — no lock-in',
  ],
  // Membership is never a pricing gate (worker: quota.ts MEMBER_HARD_CAP,
  // billing.ts TIER_LIMITS.maxFamilyMembers === -1). Paid tiers differ on
  // bloodlines (threads) and storage — never on who is allowed to join.
  FAMILY: [
    'Unlimited bloodlines in the Deep',
    `${PLAN_STORAGE.FAMILY} storage`,
    'Voice entries',
    'Sealed & time-locked notes',
    'Export anytime — no lock-in',
  ],
  DEEP: [
    'Everything in Family',
    `${PLAN_STORAGE.DEEP} storage`,
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
    ['bloodlines', '1'],
    ['storage', PLAN_STORAGE.STARTER],
  ],
  FAMILY: [
    ['entries', 'unlimited'],
    ['members', 'unlimited'],
    ['bloodlines', 'unlimited'],
    ['storage', PLAN_STORAGE.FAMILY],
  ],
  DEEP: [
    ['entries', 'unlimited'],
    ['members', 'unlimited'],
    ['bloodlines', 'unlimited'],
    ['storage', PLAN_STORAGE.DEEP],
  ],
  LEGACY: [
    ['entries', 'unlimited'],
    ['members', 'unlimited'],
    ['bloodlines', 'unlimited'],
    ['storage', PLAN_STORAGE.FOUNDER],
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