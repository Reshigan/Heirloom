import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, Check, Clock, 
  CreditCard, Loader2, AlertTriangle, X, Zap
} from '../components/Icons';
import { billingApi } from '../services/api';
import { Navigation } from '../components/Navigation';
import { PLANS } from '../config/pricing';

export function Billing() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => billingApi.getSubscription().then(r => r.data),
  });

  const subscribeMutation = useMutation({
    mutationFn: (planId: string) => billingApi.subscribe(planId, billingCycle),
    onSuccess: (data) => {
      // Redirect to Stripe checkout
      if (data.data.checkoutUrl) {
        window.location.href = data.data.checkoutUrl;
      }
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => billingApi.cancel(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      setShowConfirmModal(false);
    },
  });

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
    subscribeMutation.mutate(planId);
  };

  const isCurrentPlan = (planId: string) => subscription?.tier === planId;
  const isTrialing = subscription?.status === 'TRIALING';
  const trialDaysLeft = subscription?.trialDaysRemaining || 0;

  // Memoize floating particles to prevent re-randomization on every render (BUG-007 fix)
  const floatingParticles = useMemo(() => 
    [...Array(30)].map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      duration: 12 + Math.random() * 8,
      delay: Math.random() * 8,
    })), 
  []);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Sanctuary Background */}
      <div className="sanctuary-bg">
        <div className="sanctuary-orb sanctuary-orb-1" />
        <div className="sanctuary-orb sanctuary-orb-2" />
        <div className="sanctuary-orb sanctuary-orb-3" />
        <div className="sanctuary-stars" />
        <div className="sanctuary-mist" />
      </div>

      <Navigation />

      {/* Floating particles */}
      <div className="fixed inset-0 pointer-events-none">
        {floatingParticles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-1 h-1 rounded-full bg-gold/30"
            style={{
              left: particle.left,
              top: particle.top,
            }}
            animate={{
              y: [0, -80, 0],
              opacity: [0, 0.6, 0],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              delay: particle.delay,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="relative z-20 px-6 md:px-12 py-6">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <motion.button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-paper/70 hover:text-gold transition-colors"
            whileHover={{ x: -4 }}
          >
            <ArrowLeft size={20} />
            <span>Back to Dashboard</span>
          </motion.button>

          <motion.div 
            className="flex items-center gap-3"
            whileHover={{ scale: 1.02 }}
          >
            <motion.span 
              className="text-3xl text-gold"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            >
              ∞
            </motion.span>
            <span className="text-xl tracking-[0.15em] text-paper/80">Heirloom</span>
          </motion.div>
        </div>
      </header>

      <main className="relative z-10 px-6 md:px-12 py-8 max-w-7xl mx-auto">
        {/* Trial Warning */}
        <AnimatePresence>
          {isTrialing && trialDaysLeft <= 7 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8 p-4 bg-gold/10 border border-gold/30 rounded-xl flex items-center gap-4"
            >
              <AlertTriangle className="text-gold flex-shrink-0" size={24} />
              <div className="flex-1">
                <p className="font-medium">Your trial ends in {trialDaysLeft} days</p>
                <p className="text-sm text-paper/60">Choose a plan to continue preserving your legacy</p>
              </div>
              <Clock className="text-gold/50" size={20} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-light mb-4">Choose Your Legacy</h1>
          <p className="text-paper/60 text-lg max-w-2xl mx-auto">
            Preserve what matters most. Every plan includes our iron-clad security 
            and the promise to protect your memories for generations.
          </p>
        </motion.div>

        {/* Billing Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex justify-center mb-12"
        >
          <div className="glass rounded-full p-1 flex items-center gap-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-3 rounded-full text-sm font-medium transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-gold text-void-deep'
                  : 'text-paper/70 hover:text-paper'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-3 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                billingCycle === 'yearly'
                  ? 'bg-gold text-void-deep'
                  : 'text-paper/70 hover:text-paper'
              }`}
            >
              Yearly
              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                Save 17%
              </span>
            </button>
          </div>
        </motion.div>

        {/* Plans Grid */}
        <div className="grid sm:grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          {PLANS.map((plan, index) => {
            const Icon = plan.icon;
            const isCurrent = isCurrentPlan(plan.id);
            const price = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
            
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.1 }}
                className={`relative card ${
                  plan.popular ? 'border-gold/50 shadow-gold' : ''
                } ${isCurrent ? 'ring-2 ring-gold/50' : ''}`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="badge badge-gold flex items-center gap-1">
                      <Zap size={12} />
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Current Plan Badge */}
                {isCurrent && (
                  <div className="absolute -top-3 right-4">
                    <span className="badge badge-success">Current Plan</span>
                  </div>
                )}

                <div className="mb-6">
                  <div className="w-14 h-14 rounded-xl bg-gold/10 flex items-center justify-center mb-4">
                    <Icon className="text-gold" size={28} />
                  </div>
                  <h3 className="text-2xl font-light mb-1">{plan.name}</h3>
                  <p className="text-paper/50 text-sm">{plan.description}</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-light">${price}</span>
                    <span className="text-paper/50">
                      /{billingCycle === 'yearly' ? 'year' : 'month'}
                    </span>
                  </div>
                  {billingCycle === 'yearly' && (
                    <p className="text-sm text-green-400 mt-1">
                      ${(plan.yearlyPrice / 12).toFixed(2)}/month billed annually
                    </p>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <Check className="text-gold flex-shrink-0 mt-0.5" size={16} />
                      <span className="text-paper/80">{feature}</span>
                    </li>
                  ))}
                </ul>

                <motion.button
                  onClick={() => !isCurrent && handleSelectPlan(plan.id)}
                  disabled={isCurrent || subscribeMutation.isPending}
                  className={`w-full py-4 rounded-xl font-medium transition-all ${
                    isCurrent
                      ? 'bg-paper/10 text-paper/50 cursor-not-allowed'
                      : plan.popular
                      ? 'btn btn-primary'
                      : 'btn btn-secondary'
                  }`}
                  whileHover={!isCurrent ? { scale: 1.02 } : {}}
                  whileTap={!isCurrent ? { scale: 0.98 } : {}}
                >
                  {subscribeMutation.isPending && selectedPlan === plan.id ? (
                    <Loader2 className="animate-spin mx-auto" size={20} />
                  ) : isCurrent ? (
                    'Current Plan'
                  ) : (
                    `Choose ${plan.name}`
                  )}
                </motion.button>
              </motion.div>
            );
          })}
        </div>

        {/* Current Subscription Info */}
        {subscription && subscription.status !== 'TRIALING' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card max-w-2xl mx-auto"
          >
            <h3 className="text-xl mb-4 flex items-center gap-2">
              <CreditCard size={20} className="text-gold" />
              Current Subscription
            </h3>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-paper/50">Plan</p>
                <p className="font-medium">{subscription.tier}</p>
              </div>
              <div>
                <p className="text-sm text-paper/50">Status</p>
                <p className={`font-medium ${
                  subscription.status === 'ACTIVE' ? 'text-green-400' : 'text-yellow-400'
                }`}>
                  {subscription.status}
                </p>
              </div>
              <div>
                <p className="text-sm text-paper/50">Current Period Ends</p>
                <p className="font-medium">
                  {subscription.currentPeriodEnd 
                    ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
                    : 'N/A'
                  }
                </p>
              </div>
              <div>
                <p className="text-sm text-paper/50">Auto-Renew</p>
                <p className="font-medium">
                  {subscription.cancelAtPeriodEnd ? 'No' : 'Yes'}
                </p>
              </div>
            </div>

            {!subscription.cancelAtPeriodEnd && (
              <button
                onClick={() => setShowConfirmModal(true)}
                className="text-sm text-blood hover:text-blood-light transition-colors"
              >
                Cancel Subscription
              </button>
            )}
          </motion.div>
        )}

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-center"
        >
          <h2 className="text-2xl mb-4">Questions?</h2>
          <p className="text-paper/60 mb-6">
            Our team is here to help you choose the right plan for your legacy.
          </p>
          <button className="btn btn-ghost">
            Contact Support
          </button>
        </motion.div>
      </main>

      {/* Cancel Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-backdrop"
            onClick={() => setShowConfirmModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="modal"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setShowConfirmModal(false)}
                className="absolute top-4 right-4 text-paper/50 hover:text-paper transition-colors"
              >
                <X size={20} />
              </button>

              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-blood/20 flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="text-blood" size={32} />
                </div>
                <h3 className="text-2xl mb-2">Cancel Subscription?</h3>
                <p className="text-paper/60 mb-6">
                  Your memories will remain safe, but you'll lose access to premium features 
                  at the end of your current billing period.
                </p>

                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="btn btn-secondary"
                  >
                    Keep My Plan
                  </button>
                  <button
                    onClick={() => cancelMutation.mutate()}
                    disabled={cancelMutation.isPending}
                    className="btn btn-danger"
                  >
                    {cancelMutation.isPending ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      'Yes, Cancel'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
