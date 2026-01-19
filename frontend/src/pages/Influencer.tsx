import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, TrendingUp, DollarSign, Users, Link2, 
  Copy, Check, Loader2, CreditCard, Calendar, 
  ExternalLink, Star, Award, ChevronRight, Wallet,
  AlertCircle, CheckCircle, Settings
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { influencerApi } from '../services/api';
import { Navigation } from '../components/Navigation';

const TIER_INFO: Record<string, { name: string; discount: string; color: string }> = {
  NANO: { name: 'Nano', discount: '10%', color: 'text-paper/70' },
  MICRO: { name: 'Micro', discount: '15%', color: 'text-blue-400' },
  MID: { name: 'Mid-Tier', discount: '20%', color: 'text-purple-400' },
  MACRO: { name: 'Macro', discount: '25%', color: 'text-gold' },
  MEGA: { name: 'Mega', discount: '30%', color: 'text-green-400' },
};

export function Influencer() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'conversions' | 'payouts' | 'settings'>('overview');
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applicationForm, setApplicationForm] = useState({
    fullName: '',
    email: '',
    platform: 'instagram',
    handle: '',
    followerCount: '',
    niche: '',
    website: '',
    bio: '',
  });
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['influencer-dashboard'],
    queryFn: () => influencerApi.getDashboard().then(r => r.data),
    retry: false,
  });

  const { data: conversionsData } = useQuery({
    queryKey: ['influencer-conversions'],
    queryFn: () => influencerApi.getConversions().then(r => r.data),
    enabled: !!dashboardData?.influencer,
  });

  const { data: payoutsData } = useQuery({
    queryKey: ['influencer-payouts'],
    queryFn: () => influencerApi.getPayouts().then(r => r.data),
    enabled: !!dashboardData?.influencer,
  });

  const { data: earningsData, refetch: refetchEarnings } = useQuery({
    queryKey: ['influencer-earnings'],
    queryFn: () => influencerApi.getEarnings().then(r => r.data),
    enabled: !!dashboardData?.influencer,
  });

  const [searchParams] = useSearchParams();

  // Handle Stripe Connect return
  useEffect(() => {
    if (searchParams.get('stripe_connected') === 'true') {
      // Verify Stripe status after returning from onboarding
      influencerApi.verifyStripeStatus().then(() => {
        refetchEarnings();
        setStatusMessage({ type: 'success', text: 'Stripe account connected successfully!' });
        setTimeout(() => setStatusMessage(null), 5000);
      });
    } else if (searchParams.get('stripe_refresh') === 'true') {
      setStatusMessage({ type: 'error', text: 'Stripe onboarding was not completed. Please try again.' });
      setTimeout(() => setStatusMessage(null), 5000);
    }
  }, [searchParams, refetchEarnings]);

  const connectStripeMutation = useMutation({
    mutationFn: () => influencerApi.connectStripe(),
    onSuccess: (response) => {
      if (response.data.onboardingUrl) {
        window.location.href = response.data.onboardingUrl;
      }
    },
    onError: (error: any) => {
      setStatusMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to connect Stripe account' 
      });
      setTimeout(() => setStatusMessage(null), 5000);
    },
  });

  const applyMutation = useMutation({
    mutationFn: () => influencerApi.apply({
      ...applicationForm,
      followerCount: parseInt(applicationForm.followerCount) || 0,
    }),
    onSuccess: () => {
      setShowApplyModal(false);
      setStatusMessage({ type: 'success', text: 'Application submitted! We\'ll review it within 48 hours.' });
      setTimeout(() => setStatusMessage(null), 5000);
    },
    onError: (error: any) => {
      setStatusMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to submit application' 
      });
      setTimeout(() => setStatusMessage(null), 5000);
    },
  });

  const updatePaymentMutation = useMutation({
    mutationFn: (data: { paymentMethod: string; paymentDetails: string }) => 
      influencerApi.updatePaymentInfo(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['influencer-dashboard'] });
      setStatusMessage({ type: 'success', text: 'Payment info updated!' });
      setTimeout(() => setStatusMessage(null), 3000);
    },
  });

  const influencer = dashboardData?.influencer;
  const stats = dashboardData?.stats || {
    totalConversions: 0,
    totalEarnings: 0,
    pendingEarnings: 0,
    paidEarnings: 0,
    conversionRate: 0,
    thisMonthConversions: 0,
    thisMonthEarnings: 0,
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isNotInfluencer = error || !influencer;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-gold" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="sanctuary-bg">
        <div className="sanctuary-orb sanctuary-orb-1" />
        <div className="sanctuary-orb sanctuary-orb-2" />
        <div className="sanctuary-orb sanctuary-orb-3" />
        <div className="sanctuary-stars" />
        <div className="sanctuary-mist" />
      </div>

      <Navigation />

      <div className="relative z-10 px-6 md:px-12 py-12">
        <button 
          onClick={() => navigate('/dashboard')} 
          className="flex items-center gap-2 text-paper/40 hover:text-gold transition-colors mb-8"
        >
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>

        <div className="max-w-5xl mx-auto">
          {statusMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 p-4 rounded-xl text-center ${
                statusMessage.type === 'success' 
                  ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                  : 'bg-blood/10 border border-blood/30 text-blood'
              }`}
            >
              {statusMessage.text}
            </motion.div>
          )}

          {isNotInfluencer ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="w-20 h-20 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-6">
                <Star className="text-gold" size={40} />
              </div>
              <h1 className="text-4xl font-light mb-4">Become an Influencer Partner</h1>
              <p className="text-paper/60 text-lg mb-8 max-w-2xl mx-auto">
                Join our influencer program and earn commissions by sharing Heirloom with your audience. 
                Get personalized discount codes, custom landing pages, and monthly payouts.
              </p>

              <div className="grid md:grid-cols-3 gap-6 mb-12">
                <div className="card text-center">
                  <DollarSign className="text-gold mx-auto mb-3" size={32} />
                  <h3 className="font-medium mb-2">Earn Commissions</h3>
                  <p className="text-paper/50 text-sm">
                    Up to 20% commission on every subscription from your audience
                  </p>
                </div>
                <div className="card text-center">
                  <Link2 className="text-gold mx-auto mb-3" size={32} />
                  <h3 className="font-medium mb-2">Custom Discount Codes</h3>
                  <p className="text-paper/50 text-sm">
                    Get personalized codes with up to 30% off for your followers
                  </p>
                </div>
                <div className="card text-center">
                  <TrendingUp className="text-gold mx-auto mb-3" size={32} />
                  <h3 className="font-medium mb-2">Real-Time Analytics</h3>
                  <p className="text-paper/50 text-sm">
                    Track clicks, conversions, and earnings in your dashboard
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowApplyModal(true)}
                className="btn btn-primary text-lg px-8 py-4"
              >
                Apply Now
              </button>
            </motion.div>
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-center justify-between mb-8"
              >
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-light">Influencer Dashboard</h1>
                    <span className={`badge ${TIER_INFO[influencer.tier]?.color || ''}`}>
                      {TIER_INFO[influencer.tier]?.name || influencer.tier}
                    </span>
                  </div>
                  <p className="text-paper/50">
                    Welcome back, {influencer.fullName}
                  </p>
                </div>
                <div className="mt-4 md:mt-0 flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-paper/50 text-sm">Your Discount</p>
                    <p className="text-xl font-medium text-gold">
                      {TIER_INFO[influencer.tier]?.discount || '10%'} off
                    </p>
                  </div>
                </div>
              </motion.div>

              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {(['overview', 'conversions', 'payouts', 'settings'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                      activeTab === tab
                        ? 'bg-gold text-void-deep'
                        : 'text-paper/50 hover:text-paper hover:bg-paper/5'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {activeTab === 'overview' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  <div className="card">
                    <h2 className="text-lg mb-4">Your Discount Code</h2>
                    <div className="bg-void/50 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-mono tracking-wider">{influencer.discountCode}</p>
                        <p className="text-paper/50 text-sm mt-1">
                          {TIER_INFO[influencer.tier]?.discount} off for your audience
                        </p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(influencer.discountCode)}
                        className="p-3 hover:bg-gold/10 rounded-lg transition-colors"
                      >
                        {copied ? (
                          <Check className="text-green-400" size={24} />
                        ) : (
                          <Copy className="text-gold" size={24} />
                        )}
                      </button>
                    </div>
                    {influencer.landingPageSlug && (
                      <div className="mt-4 pt-4 border-t border-paper/10">
                        <p className="text-paper/50 text-sm mb-2">Your Landing Page</p>
                        <a
                          href={`https://heirloom.app/p/${influencer.landingPageSlug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gold hover:underline flex items-center gap-2"
                        >
                          heirloom.app/p/{influencer.landingPageSlug}
                          <ExternalLink size={16} />
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="card text-center">
                      <Users className="text-gold mx-auto mb-2" size={24} />
                      <p className="text-3xl font-light">{stats.totalConversions}</p>
                      <p className="text-paper/50 text-sm">Total Conversions</p>
                    </div>
                    <div className="card text-center">
                      <DollarSign className="text-gold mx-auto mb-2" size={24} />
                      <p className="text-3xl font-light">${stats.totalEarnings.toFixed(2)}</p>
                      <p className="text-paper/50 text-sm">Total Earnings</p>
                    </div>
                    <div className="card text-center">
                      <Calendar className="text-gold mx-auto mb-2" size={24} />
                      <p className="text-3xl font-light">{stats.thisMonthConversions}</p>
                      <p className="text-paper/50 text-sm">This Month</p>
                    </div>
                    <div className="card text-center">
                      <TrendingUp className="text-gold mx-auto mb-2" size={24} />
                      <p className="text-3xl font-light">{stats.conversionRate.toFixed(1)}%</p>
                      <p className="text-paper/50 text-sm">Conversion Rate</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="card">
                      <h3 className="text-lg mb-4 flex items-center gap-2">
                        <Award className="text-gold" size={20} />
                        Earnings Summary
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-paper/50">Pending</span>
                          <span className="font-medium">${stats.pendingEarnings.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-paper/50">Paid Out</span>
                          <span className="font-medium text-green-400">${stats.paidEarnings.toFixed(2)}</span>
                        </div>
                        <div className="pt-3 border-t border-paper/10 flex justify-between items-center">
                          <span className="font-medium">Total</span>
                          <span className="text-xl font-medium text-gold">${stats.totalEarnings.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="card">
                      <h3 className="text-lg mb-4">Commission Rates</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-paper/50">Starter Yearly ($49.99)</span>
                          <span>$10 (20%)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-paper/50">Family Yearly ($99.99)</span>
                          <span>$20 (20%)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-paper/50">Legacy Yearly ($199.99)</span>
                          <span>$40 (20%)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'conversions' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="card"
                >
                  <h2 className="text-xl mb-4">Recent Conversions</h2>
                  {!conversionsData?.conversions?.length ? (
                    <div className="text-center py-8 text-paper/50">
                      <TrendingUp className="mx-auto mb-3 opacity-50" size={40} />
                      <p>No conversions yet. Share your discount code to start earning!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {conversionsData.conversions.map((conversion: any) => (
                        <div 
                          key={conversion.id}
                          className="flex items-center justify-between p-4 bg-void/30 rounded-xl"
                        >
                          <div>
                            <p className="font-medium">{conversion.tier} Plan</p>
                            <p className="text-paper/50 text-sm">
                              {new Date(conversion.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gold">${conversion.commissionAmount.toFixed(2)}</p>
                            <span className={`badge text-xs ${
                              conversion.commissionStatus === 'PAID' 
                                ? 'badge-success' 
                                : 'badge-gold'
                            }`}>
                              {conversion.commissionStatus}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'payouts' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="card"
                >
                  <h2 className="text-xl mb-4">Payout History</h2>
                  {!payoutsData?.payouts?.length ? (
                    <div className="text-center py-8 text-paper/50">
                      <CreditCard className="mx-auto mb-3 opacity-50" size={40} />
                      <p>No payouts yet. Payouts are processed monthly for balances over $50.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {payoutsData.payouts.map((payout: any) => (
                        <div 
                          key={payout.id}
                          className="flex items-center justify-between p-4 bg-void/30 rounded-xl"
                        >
                          <div>
                            <p className="font-medium">${payout.amount.toFixed(2)}</p>
                            <p className="text-paper/50 text-sm">
                              {new Date(payout.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <span className={`badge ${
                            payout.status === 'COMPLETED' 
                              ? 'badge-success' 
                              : payout.status === 'PROCESSING'
                              ? 'badge-gold'
                              : 'badge-default'
                          }`}>
                            {payout.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'settings' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  {/* Stripe Connect Section */}
                  <div className="card">
                    <h2 className="text-xl mb-4 flex items-center gap-2">
                      <Wallet className="text-gold" size={24} />
                      Automated Payouts with Stripe
                    </h2>
                    
                    {earningsData?.stripeStatus === 'ACTIVE' ? (
                      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="text-green-400" size={24} />
                          <div>
                            <p className="font-medium text-green-400">Stripe Connected</p>
                            <p className="text-paper/50 text-sm">
                              Payouts are processed automatically when your balance reaches ${((earningsData?.payoutThreshold || 5000) / 100).toFixed(0)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-green-500/20 grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-paper/50 text-sm">Pending Balance</p>
                            <p className="text-2xl font-light text-gold">
                              ${((earningsData?.pendingBalance || 0) / 100).toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-paper/50 text-sm">Payout Threshold</p>
                            <p className="text-2xl font-light">
                              ${((earningsData?.payoutThreshold || 5000) / 100).toFixed(0)}
                            </p>
                          </div>
                        </div>
                        
                        {earningsData?.eligibleForPayout && (
                          <div className="mt-4 p-3 bg-gold/10 rounded-lg">
                            <p className="text-gold text-sm">
                              Your balance is above the threshold. A payout will be processed automatically.
                            </p>
                          </div>
                        )}
                      </div>
                    ) : earningsData?.stripeStatus === 'PENDING' ? (
                      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                          <AlertCircle className="text-yellow-400" size={24} />
                          <div>
                            <p className="font-medium text-yellow-400">Stripe Onboarding Incomplete</p>
                            <p className="text-paper/50 text-sm">
                              Please complete your Stripe account setup to receive payouts.
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => influencerApi.getStripeOnboardingLink().then(r => {
                            if (r.data.onboardingUrl) window.location.href = r.data.onboardingUrl;
                          })}
                          className="btn btn-primary mt-4"
                        >
                          Complete Stripe Setup
                        </button>
                      </div>
                    ) : (
                      <div className="bg-void/50 rounded-xl p-6 text-center">
                        <Wallet className="text-gold mx-auto mb-4" size={48} />
                        <h3 className="text-lg font-medium mb-2">Connect Stripe for Automatic Payouts</h3>
                        <p className="text-paper/50 mb-6 max-w-md mx-auto">
                          Connect your Stripe account to receive automatic payouts when your commission balance reaches $50. 
                          No more waiting for manual payments!
                        </p>
                        <button
                          onClick={() => connectStripeMutation.mutate()}
                          disabled={connectStripeMutation.isPending}
                          className="btn btn-primary"
                        >
                          {connectStripeMutation.isPending ? (
                            <Loader2 className="animate-spin mx-auto" size={20} />
                          ) : (
                            'Connect Stripe Account'
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Earnings Summary */}
                  {earningsData && (
                    <div className="card">
                      <h2 className="text-xl mb-4 flex items-center gap-2">
                        <DollarSign className="text-gold" size={24} />
                        Earnings Summary
                      </h2>
                      
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-void/30 rounded-xl p-4 text-center">
                          <p className="text-paper/50 text-sm">Total Earned</p>
                          <p className="text-2xl font-light text-gold">
                            ${((earningsData.totalEarned || 0) / 100).toFixed(2)}
                          </p>
                        </div>
                        <div className="bg-void/30 rounded-xl p-4 text-center">
                          <p className="text-paper/50 text-sm">Pending</p>
                          <p className="text-2xl font-light text-yellow-400">
                            ${((earningsData.pendingBalance || 0) / 100).toFixed(2)}
                          </p>
                        </div>
                        <div className="bg-void/30 rounded-xl p-4 text-center">
                          <p className="text-paper/50 text-sm">Paid Out</p>
                          <p className="text-2xl font-light text-green-400">
                            ${((earningsData.totalPaid || 0) / 100).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {earningsData.monthlyEarnings?.length > 0 && (
                        <div>
                          <h3 className="text-sm text-paper/50 mb-3">Monthly Earnings (Last 6 Months)</h3>
                          <div className="space-y-2">
                            {earningsData.monthlyEarnings.map((month: any) => (
                              <div key={month.month} className="flex justify-between items-center p-3 bg-void/20 rounded-lg">
                                <span className="text-paper/70">{month.month}</span>
                                <div className="text-right">
                                  <span className="font-medium">${((month.earnings || 0) / 100).toFixed(2)}</span>
                                  <span className="text-paper/50 text-sm ml-2">({month.conversions} sales)</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Legacy Payment Settings */}
                  <div className="card">
                    <h2 className="text-xl mb-4 flex items-center gap-2">
                      <Settings className="text-paper/50" size={24} />
                      Alternative Payment Methods
                    </h2>
                    <p className="text-paper/50 text-sm mb-4">
                      If you prefer not to use Stripe, you can set up alternative payment methods below.
                    </p>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-paper/50 mb-2">Payment Method</label>
                        <select
                          defaultValue={influencer.paymentMethod || 'paypal'}
                          className="input"
                          onChange={(e) => updatePaymentMutation.mutate({
                            paymentMethod: e.target.value,
                            paymentDetails: influencer.paymentDetails || '',
                          })}
                        >
                          <option value="paypal">PayPal</option>
                          <option value="bank_transfer">Bank Transfer</option>
                          <option value="wise">Wise</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-paper/50 mb-2">
                          Payment Details (Email or Account Info)
                        </label>
                        <input
                          type="text"
                          defaultValue={influencer.paymentDetails || ''}
                          placeholder="your@email.com"
                          className="input"
                          onBlur={(e) => updatePaymentMutation.mutate({
                            paymentMethod: influencer.paymentMethod || 'paypal',
                            paymentDetails: e.target.value,
                          })}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showApplyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-backdrop"
            onClick={() => setShowApplyModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="modal max-w-lg"
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-2xl mb-6">Apply to Influencer Program</h2>
              
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                <div>
                  <label className="block text-sm text-paper/50 mb-2">Full Name *</label>
                  <input
                    type="text"
                    value={applicationForm.fullName}
                    onChange={(e) => setApplicationForm({ ...applicationForm, fullName: e.target.value })}
                    className="input"
                    placeholder="Your full name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-paper/50 mb-2">Email *</label>
                  <input
                    type="email"
                    value={applicationForm.email}
                    onChange={(e) => setApplicationForm({ ...applicationForm, email: e.target.value })}
                    className="input"
                    placeholder="your@email.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-paper/50 mb-2">Platform *</label>
                    <select
                      value={applicationForm.platform}
                      onChange={(e) => setApplicationForm({ ...applicationForm, platform: e.target.value })}
                      className="input"
                    >
                      <option value="instagram">Instagram</option>
                      <option value="youtube">YouTube</option>
                      <option value="tiktok">TikTok</option>
                      <option value="twitter">Twitter/X</option>
                      <option value="facebook">Facebook</option>
                      <option value="blog">Blog</option>
                      <option value="podcast">Podcast</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-paper/50 mb-2">Handle *</label>
                    <input
                      type="text"
                      value={applicationForm.handle}
                      onChange={(e) => setApplicationForm({ ...applicationForm, handle: e.target.value })}
                      className="input"
                      placeholder="@yourhandle"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-paper/50 mb-2">Follower Count *</label>
                  <input
                    type="number"
                    value={applicationForm.followerCount}
                    onChange={(e) => setApplicationForm({ ...applicationForm, followerCount: e.target.value })}
                    className="input"
                    placeholder="10000"
                  />
                </div>

                <div>
                  <label className="block text-sm text-paper/50 mb-2">Niche/Category</label>
                  <input
                    type="text"
                    value={applicationForm.niche}
                    onChange={(e) => setApplicationForm({ ...applicationForm, niche: e.target.value })}
                    className="input"
                    placeholder="Family, Lifestyle, Parenting, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm text-paper/50 mb-2">Website (optional)</label>
                  <input
                    type="url"
                    value={applicationForm.website}
                    onChange={(e) => setApplicationForm({ ...applicationForm, website: e.target.value })}
                    className="input"
                    placeholder="https://yourwebsite.com"
                  />
                </div>

                <div>
                  <label className="block text-sm text-paper/50 mb-2">Tell us about yourself</label>
                  <textarea
                    value={applicationForm.bio}
                    onChange={(e) => setApplicationForm({ ...applicationForm, bio: e.target.value })}
                    className="input min-h-[100px]"
                    placeholder="Why do you want to partner with Heirloom?"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowApplyModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={() => applyMutation.mutate()}
                  disabled={
                    !applicationForm.fullName || 
                    !applicationForm.email || 
                    !applicationForm.handle || 
                    !applicationForm.followerCount ||
                    applyMutation.isPending
                  }
                  className="btn btn-primary flex-1"
                >
                  {applyMutation.isPending ? (
                    <Loader2 className="animate-spin mx-auto" size={20} />
                  ) : (
                    'Submit Application'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
