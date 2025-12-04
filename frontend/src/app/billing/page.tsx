'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
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
import { GoldCard, GoldCardHeader, GoldCardTitle, GoldCardSubtitle, GoldCardContent, GoldButton } from '../../components/gold-card'
import { apiClient } from '../../lib/api-client'
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
      if (data.subscription) {
        setSubscription({
          plan: data.subscription.tier || 'free',
          status: data.subscription.status || 'active',
          current_period_end: data.subscription.currentPeriodEnd
        })
      } else {
        setSubscription(null)
      }
    } catch (error) {
      console.error('Failed to load subscription:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async (plan: string) => {
    try {
      setCheckoutLoading(plan)
      console.log('Upgrade to plan:', plan)
      alert('Stripe integration coming soon! Please contact support to upgrade.')
      setCheckoutLoading(null)
    } catch (error) {
      console.error('Failed to create checkout session:', error)
      setCheckoutLoading(null)
    }
  }

  const handleManageBilling = async () => {
    try {
      setCheckoutLoading('portal')
      console.log('Manage billing')
      alert('Stripe integration coming soon! Please contact support to manage billing.')
      setCheckoutLoading(null)
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
    <div className="container mx-auto px-4 py-32 max-w-7xl">
      {/* Background handled by AppShell */}
      <div>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-6xl font-serif font-light text-gold-primary mb-4 tracking-wide">
            Choose Your Plan
          </h1>
          <p className="text-xl text-pearl/70 max-w-2xl mx-auto">
            Preserve your family&apos;s legacy with the perfect plan for your needs
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
            <GoldCard>
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-2xl bg-gold-primary/20">
                    <Crown className="text-gold-primary" size={32} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-serif font-light text-gold-primary mb-1">
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
                  onClick={handleManageBilling}
                  disabled={checkoutLoading === 'portal'}
                >
                  Manage Billing
                </GoldButton>
              </div>
            </GoldCard>
          </motion.div>
        )}

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
            >
              <GoldCard
                className={`relative h-full ${plan.popular ? 'ring-2 ring-gold-primary/50' : ''}`}
                hover={true}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-gradient-to-r from-gold-dark to-gold-primary rounded-full">
                    <span className="text-sm font-bold text-obsidian flex items-center gap-2">
                      <Sparkles size={16} />
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Plan Icon */}
                <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${plan.color} mb-6`}>
                  <plan.icon className="text-pearl" size={32} />
                </div>

                <GoldCardHeader>
                  <GoldCardTitle>{plan.name}</GoldCardTitle>
                  <div className="flex items-baseline gap-2 mt-4">
                    <span className="text-5xl font-bold text-gold-primary">{plan.price}</span>
                    <span className="text-pearl/60">/ {plan.period}</span>
                  </div>
                  <GoldCardSubtitle>{plan.description}</GoldCardSubtitle>
                </GoldCardHeader>

                <GoldCardContent>
                  {/* Features */}
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="mt-1 p-1 rounded-full bg-gold-primary/20">
                          <Check className="text-gold-primary" size={16} />
                        </div>
                        <span className="text-pearl/80">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  {currentPlan === plan.id ? (
                    <GoldButton
                      variant="secondary"
                      className="w-full"
                      disabled
                    >
                      Current Plan
                    </GoldButton>
                  ) : (
                    <GoldButton
                      variant={plan.popular ? 'primary' : 'secondary'}
                      className="w-full"
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={checkoutLoading === plan.id}
                    >
                      {plan.id === 'free' ? 'Downgrade' : 'Upgrade Now'}
                    </GoldButton>
                  )}
                </GoldCardContent>
              </GoldCard>
            </motion.div>
          ))}
        </div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <GoldCard>
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div className="flex flex-col items-center gap-3">
                <Shield className="text-gold-primary" size={32} />
                <h4 className="font-semibold text-pearl">Bank-Level Security</h4>
                <p className="text-sm text-pearl/60">
                  AES-256 encryption for all your memories
                </p>
              </div>
              <div className="flex flex-col items-center gap-3">
                <Zap className="text-gold-primary" size={32} />
                <h4 className="font-semibold text-pearl">Lightning Fast</h4>
                <p className="text-sm text-pearl/60">
                  Optimized compression and delivery
                </p>
              </div>
              <div className="flex flex-col items-center gap-3">
                <Users className="text-gold-primary" size={32} />
                <h4 className="font-semibold text-pearl">Family Collaboration</h4>
                <p className="text-sm text-pearl/60">
                  Share and preserve together
                </p>
              </div>
            </div>
          </GoldCard>
        </motion.div>
      </div>
    </div>
  )
}

export default BillingPage
