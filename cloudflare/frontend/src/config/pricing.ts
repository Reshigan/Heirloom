import { Sparkles, Crown, Shield } from '../components/Icons';

/**
 * Heirloom Pricing Configuration
 * 
 * 3-tier pricing with regional PPP adjustments:
 * - Starter: $4.99/mo - 5GB storage, 1 user
 * - Family: $9.99/mo - 50GB storage, 5 family members
 * - Legacy: $19.99/mo - 500GB storage, unlimited family
 * 
 * 14-day free trial with credit card required.
 * Trial users get full Family tier features.
 */

// Trial configuration
export const TRIAL_CONFIG = {
  days: 14,
  tier: 'FAMILY',
  creditCardRequired: true,
  description: 'Full access to Family tier features for 14 days',
};

// Base pricing (USD - Tier 1)
export const PRICING = {
  STARTER: {
    id: 'STARTER',
    name: 'Starter',
    monthlyPrice: 4.99,
    yearlyPrice: 49.99,
    description: 'Perfect for individuals starting their legacy',
    features: [
      '1 user account',
      '50 memory entries/month',
      '5GB storage',
      'Basic AI memory prompts',
      'Email support',
      'Standard export (PDF)',
    ],
    icon: Sparkles,
    popular: false,
  },
  FAMILY: {
    id: 'FAMILY',
    name: 'Family',
    monthlyPrice: 9.99,
    yearlyPrice: 99.99,
    description: 'Share memories across generations',
    features: [
      'Up to 5 family members',
      'Unlimited memory entries',
      '50GB storage',
      'Advanced AI prompts & suggestions',
      'AI-powered memory insights',
      'Priority email support',
      'Premium export (PDF, video montage)',
      'Family tree integration',
    ],
    icon: Crown,
    popular: true,
  },
  LEGACY: {
    id: 'LEGACY',
    name: 'Legacy',
    monthlyPrice: 19.99,
    yearlyPrice: 199.99,
    description: 'The ultimate preservation package',
    features: [
      'Unlimited family members',
      'Unlimited memory entries',
      '500GB storage',
      'Living Legacy AI Avatar (coming soon)',
      'Voice-to-memory transcription',
      'Collaborative memory editing',
      'Dedicated support',
      'API access',
      'White-glove onboarding',
      'Physical memory book printing (1/year)',
    ],
    icon: Shield,
    popular: false,
  },
  // Alias for backward compatibility
  FOREVER: {
    id: 'LEGACY',
    name: 'Legacy',
    monthlyPrice: 19.99,
    yearlyPrice: 199.99,
    description: 'The ultimate preservation package',
    features: [
      'Unlimited family members',
      'Unlimited memory entries',
      '500GB storage',
      'Living Legacy AI Avatar (coming soon)',
      'Voice-to-memory transcription',
      'Collaborative memory editing',
      'Dedicated support',
      'API access',
      'White-glove onboarding',
      'Physical memory book printing (1/year)',
    ],
    icon: Shield,
    popular: false,
  },
} as const;

// Regional pricing tiers
export type PricingTier = 'tier1' | 'tier2' | 'tier3' | 'tier4';

export const REGIONAL_PRICING: Record<PricingTier, {
  name: string;
  currency: string;
  symbol: string;
  annualOnly?: boolean;
  STARTER: { monthly: number; yearly: number };
  FAMILY: { monthly: number; yearly: number };
  LEGACY: { monthly: number; yearly: number };
}> = {
  tier1: {
    name: 'Tier 1 (US, UK, CA, AU, NZ)',
    currency: 'USD',
    symbol: '$',
    STARTER: { monthly: 4.99, yearly: 49.99 },
    FAMILY: { monthly: 9.99, yearly: 99.99 },
    LEGACY: { monthly: 19.99, yearly: 199.99 },
  },
  tier2: {
    name: 'Tier 2 (EU, Western Europe)',
    currency: 'EUR',
    symbol: '€',
    STARTER: { monthly: 3.99, yearly: 39.99 },
    FAMILY: { monthly: 7.99, yearly: 79.99 },
    LEGACY: { monthly: 14.99, yearly: 149.99 },
  },
  tier3: {
    name: 'Tier 3 (ZA, BR, MX, Southeast Asia)',
    currency: 'ZAR',
    symbol: 'R',
    STARTER: { monthly: 49, yearly: 499 },
    FAMILY: { monthly: 99, yearly: 999 },
    LEGACY: { monthly: 169, yearly: 1699 },
  },
  tier4: {
    name: 'Tier 4 (IN, NG, KE, PK)',
    currency: 'INR',
    symbol: '₹',
    annualOnly: true,
    STARTER: { monthly: 0, yearly: 1499 },
    FAMILY: { monthly: 0, yearly: 2999 },
    LEGACY: { monthly: 0, yearly: 5999 },
  },
};

// Gift subscription pricing (USD)
export const GIFT_PRICING = {
  STARTER: {
    '3': 14.99,
    '6': 27.99,
    '12': 49.99,
    '24': 84.99,
  },
  FAMILY: {
    '3': 29.99,
    '6': 54.99,
    '12': 99.99,
    '24': 169.99,
  },
  LEGACY: {
    '3': 59.99,
    '6': 109.99,
    '12': 199.99,
    '24': 339.99,
  },
};

export const PLANS = Object.values(PRICING).filter(p => p.id !== 'LEGACY' || p.name === 'Legacy');

export type PlanId = 'STARTER' | 'FAMILY' | 'LEGACY';
export type Plan = typeof PRICING[PlanId];
