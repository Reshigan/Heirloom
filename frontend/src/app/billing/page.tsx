'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  CreditCard, 
  Check, 
  Sparkles, 
  Users, 
  Cloud, 
  Shield,
  Zap,
  Crown,
  ArrowRight,
  ExternalLink
} from 'lucide-react'
import { GlassPanel } from '../../components/ui/GlassPanel'
import { GlassCard } from '../../components/ui/GlassCard'
import { GoldButton } from '../../components/ui/GoldButton'
import { ShimmerDivider } from '../../components/ui/ShimmerDivider'
import { apiClient } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'

interface SubscriptionInfo {
  plan: string
  status: string
  cancel_at?: string
  current_period_end?: string
}

const BillingPage: React.FC = () => {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)

  useEffect(() => {
    loadSubscription()
  }, [])

  const loadSubscription = async () => {
    try {
      setLoading(true)
      const data = await apiClient.getMe()
      setSubscription(data.subscription || null)
    } catch (error) {
      console.error('Failed to load subscription:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async (plan: string) => {
    try {
      setCheckoutLoading(plan)
      const response = await apiClient.createCheckoutSession(plan)
      window.location.href = response.session_url
    } catch (error) {
      console.error('Failed to create checkout session:', error)
      setCheckoutLoading(null)
    }
  }

  const handleManageBilling = async () => {
    try {
      setCheckoutLoading('portal')
      const response = await apiClient.createPortalSession()
      window.location.href = response.portal_url
    } catch (error) {
      console.error('Failed to create portal session:', error)
      setCheckoutLoading(null)
    }
  }

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for getting started with your family memories',
      features: [
        'Up to 100 memories',
        'Basic photo & video storage',
        'Simple timeline view',
        'Mobile app access',
        'Email support'
      ],
      icon: Cloud,
      color: 'from-pearl/20 to-pearl/10'
    },
    {
      id: 'premium',
      name: 'Premium Family',
      price: '$19',
      period: 'per month',
      description: 'Everything you need for a complete family archive',
      features: [
        'Unlimited memories',
        'Advanced AI curation',
        'Time capsules & highlights',
        'Bulk import wizard',
        'Weekly digest emails',
        'Priority support',
        'Encrypted storage',
        'Family collaboration'
      ],
      icon: Crown,
      color: 'from-gold/30 to-gold/20',
      popular: true
    }
  ]

  const currentPlan = subscription?.plan || 'free'

  return (
    <div className="min-h-screen bg-gradient-to-br from-obsidian via-charcoal to-obsidian">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl md:text-6xl font-serif font-bold text-pearl mb-4 tracking-wide">
            Choose Your Plan
          </h1>
          <p className="text-xl text-pearl/70 max-w-2xl mx-auto">
            Preserve your family's legacy with the perfect plan for your needs
          </p>
        </motion.div>

        {/* Current Subscription Status */}
        {subscription && subscription.plan !== 'free' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-12"
          >
            <GlassPanel padding="lg">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-2xl bg-gold/20">
                    <Crown className="text-gold" size={32} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-serif font-bold text-pearl mb-1">
                      {subscription.plan === 'premium' ? 'Premium Family' : subscription.plan}
                    </h3>
                    <p className="text-pearl/60">
                      {subscription.status === 'active' ? 'Active subscription' : `Status: ${subscription.status}`}
                    </p>
                    {subscription.current_period_end && (
                      <p className="text-sm text-pearl/50 mt-1">
                        Renews on {new Date(subscription.current_period_end).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <GoldButton
                  variant="secondary"
                  size="lg"
                  onClick={handleManageBilling}
                  loading={checkoutLoading === 'portal'}
                  icon={<ExternalLink size={20} />}
                >
                  Manage Billing
                </GoldButton>
              </div>
            </GlassPanel>
          </motion.div>
        )}

        <ShimmerDivider className="mb-12" />

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
            >
              <GlassCard
                className={`relative h-full ${plan.popular ? 'ring-2 ring-gold/50' : ''}`}
                hover={false}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-gradient-to-r from-gold to-gold/80 rounded-full">
                    <span className="text-sm font-bold text-obsidian flex items-center gap-2">
                      <Sparkles size={16} />
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="p-8">
                  {/* Plan Icon */}
                  <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${plan.color} mb-6`}>
                    <plan.icon className="text-pearl" size={32} />
                  </div>

                  {/* Plan Name & Price */}
                  <h3 className="text-3xl font-serif font-bold text-pearl mb-2">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-5xl font-bold text-gold">{plan.price}</span>
                    <span className="text-pearl/60">/ {plan.period}</span>
                  </div>
                  <p className="text-pearl/70 mb-8">
                    {plan.description}
                  </p>

                  <ShimmerDivider className="mb-8" />

                  {/* Features */}
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="mt-1 p-1 rounded-full bg-gold/20">
                          <Check className="text-gold" size={16} />
                        </div>
                        <span className="text-pearl/80">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  {currentPlan === plan.id ? (
                    <GoldButton
                      variant="secondary"
                      size="lg"
                      className="w-full"
                      disabled
                    >
                      Current Plan
                    </GoldButton>
                  ) : (
                    <GoldButton
                      variant={plan.popular ? 'primary' : 'secondary'}
                      size="lg"
                      className="w-full"
                      onClick={() => handleUpgrade(plan.id)}
                      loading={checkoutLoading === plan.id}
                      icon={<ArrowRight size={20} />}
                    >
                      {plan.id === 'free' ? 'Downgrade' : 'Upgrade Now'}
                    </GoldButton>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <GlassPanel padding="lg">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div className="flex flex-col items-center gap-3">
                <Shield className="text-gold" size={32} />
                <h4 className="font-semibold text-pearl">Bank-Level Security</h4>
                <p className="text-sm text-pearl/60">
                  AES-256 encryption for all your memories
                </p>
              </div>
              <div className="flex flex-col items-center gap-3">
                <Zap className="text-gold" size={32} />
                <h4 className="font-semibold text-pearl">Lightning Fast</h4>
                <p className="text-sm text-pearl/60">
                  Optimized compression and delivery
                </p>
              </div>
              <div className="flex flex-col items-center gap-3">
                <Users className="text-gold" size={32} />
                <h4 className="font-semibold text-pearl">Family Collaboration</h4>
                <p className="text-sm text-pearl/60">
                  Share and preserve together
                </p>
              </div>
            </div>
          </GlassPanel>
        </motion.div>
      </div>
    </div>
  )
}

export default BillingPage
