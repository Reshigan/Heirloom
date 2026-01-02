import { Sparkles, Crown, Shield } from '../components/Icons';

// Mass-Adoption Pricing: $1 / $2 / $5
// Single source of truth for all pricing across the app

export const PRICING = {
  STARTER: {
    id: 'STARTER',
    name: 'Starter',
    monthlyPrice: 1,
    yearlyPrice: 10,
    description: 'Perfect for individuals starting their legacy',
    features: [
      '500MB storage',
      '3 voice recordings/month',
      '5 letters/month',
      '50 photos',
      '2 family members',
    ],
    icon: Sparkles,
    popular: false,
  },
  FAMILY: {
    id: 'FAMILY',
    name: 'Family',
    monthlyPrice: 2,
    yearlyPrice: 20,
    description: 'Share memories across generations',
    features: [
      '5GB storage',
      '20 voice recordings/month',
      'Unlimited letters',
      'Unlimited photos',
      '10 family members',
      '2 min video messages',
      'Family tree',
    ],
    icon: Crown,
    popular: true,
  },
  FOREVER: {
    id: 'FOREVER',
    name: 'Forever',
    monthlyPrice: 5,
    yearlyPrice: 50,
    description: 'The ultimate preservation package',
    features: [
      '25GB storage',
      'Unlimited voice recordings',
      'Unlimited letters',
      'Unlimited photos',
      'Unlimited family members',
      '10 min video messages',
      'AI transcription',
      'Priority support',
    ],
    icon: Shield,
    popular: false,
  },
} as const;

export const PLANS = Object.values(PRICING);

export type PlanId = keyof typeof PRICING;
export type Plan = typeof PRICING[PlanId];
