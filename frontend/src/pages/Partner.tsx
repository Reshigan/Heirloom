import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Building2, Package, QrCode, TrendingUp, 
  DollarSign, Users, Loader2, ShoppingCart, Tag,
  Check, Copy, ExternalLink, Plus
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { partnerApi } from '../services/api';
import { Navigation } from '../components/Navigation';

const BUSINESS_TYPES = [
  { value: 'funeral_home', label: 'Funeral Home' },
  { value: 'estate_planner', label: 'Estate Planner / Attorney' },
  { value: 'senior_living', label: 'Senior Living Facility' },
  { value: 'wedding_photographer', label: 'Wedding Photographer' },
  { value: 'genealogy_society', label: 'Genealogy Society' },
  { value: 'family_therapist', label: 'Family Therapist' },
  { value: 'financial_advisor', label: 'Financial Advisor' },
  { value: 'other', label: 'Other' },
];

const WHOLESALE_TIERS = [
  { tier: 'STARTER', name: 'Starter', retailPrice: 49.99, wholesalePrice: 34.99 },
  { tier: 'FAMILY', name: 'Family', retailPrice: 99.99, wholesalePrice: 69.99 },
  { tier: 'LEGACY', name: 'Legacy', retailPrice: 199.99, wholesalePrice: 139.99 },
];

export function Partner() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'vouchers' | 'orders' | 'referrals'>('overview');
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [applicationForm, setApplicationForm] = useState({
    businessName: '',
    businessType: 'funeral_home',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    website: '',
    address: '',
    description: '',
    estimatedMonthlyReferrals: '',
  });
  const [orderForm, setOrderForm] = useState({
    tier: 'FAMILY',
    quantity: 10,
    billingCycle: 'yearly',
  });
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['partner-dashboard'],
    queryFn: () => partnerApi.getDashboard().then(r => r.data),
    retry: false,
  });

  const { data: vouchersData } = useQuery({
    queryKey: ['partner-vouchers'],
    queryFn: () => partnerApi.getVouchers().then(r => r.data),
    enabled: !!dashboardData?.partner,
  });

  const { data: ordersData } = useQuery({
    queryKey: ['partner-orders'],
    queryFn: () => partnerApi.getOrders().then(r => r.data),
    enabled: !!dashboardData?.partner,
  });

  const { data: referralsData } = useQuery({
    queryKey: ['partner-referrals'],
    queryFn: () => partnerApi.getReferrals().then(r => r.data),
    enabled: !!dashboardData?.partner,
  });

  const applyMutation = useMutation({
    mutationFn: () => partnerApi.apply({
      ...applicationForm,
      estimatedMonthlyReferrals: parseInt(applicationForm.estimatedMonthlyReferrals) || undefined,
    }),
    onSuccess: () => {
      setShowApplyModal(false);
      setStatusMessage({ type: 'success', text: 'Application submitted! We\'ll review it within 48-72 hours.' });
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

  const orderMutation = useMutation({
    mutationFn: () => partnerApi.createWholesaleOrder(orderForm),
    onSuccess: (data) => {
      setShowOrderModal(false);
      queryClient.invalidateQueries({ queryKey: ['partner-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['partner-vouchers'] });
      queryClient.invalidateQueries({ queryKey: ['partner-orders'] });
      if (data.data.checkoutUrl) {
        window.location.href = data.data.checkoutUrl;
      } else {
        setStatusMessage({ type: 'success', text: 'Order created successfully!' });
        setTimeout(() => setStatusMessage(null), 3000);
      }
    },
    onError: (error: any) => {
      setStatusMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to create order' 
      });
      setTimeout(() => setStatusMessage(null), 5000);
    },
  });

  const partner = dashboardData?.partner;
  const stats = dashboardData?.stats || {
    totalVouchers: 0,
    usedVouchers: 0,
    availableVouchers: 0,
    totalReferrals: 0,
    convertedReferrals: 0,
    totalCommission: 0,
    pendingCommission: 0,
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedTier = WHOLESALE_TIERS.find(t => t.tier === orderForm.tier);
  const orderTotal = selectedTier ? selectedTier.wholesalePrice * orderForm.quantity : 0;

  const isNotPartner = error || !partner;

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

          {isNotPartner ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="w-20 h-20 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-6">
                <Building2 className="text-gold" size={40} />
              </div>
              <h1 className="text-4xl font-light mb-4">Become a Partner</h1>
              <p className="text-paper/60 text-lg mb-8 max-w-2xl mx-auto">
                Partner with Heirloom to offer your clients a meaningful way to preserve their family legacy. 
                Get wholesale pricing on gift vouchers and earn commissions on referrals.
              </p>

              <div className="grid md:grid-cols-3 gap-6 mb-12">
                <div className="card text-center">
                  <Package className="text-gold mx-auto mb-3" size={32} />
                  <h3 className="font-medium mb-2">Wholesale Vouchers</h3>
                  <p className="text-paper/50 text-sm">
                    Purchase gift vouchers at 30% off retail to resell or gift to clients
                  </p>
                </div>
                <div className="card text-center">
                  <QrCode className="text-gold mx-auto mb-3" size={32} />
                  <h3 className="font-medium mb-2">QR Code Tracking</h3>
                  <p className="text-paper/50 text-sm">
                    Get unique QR codes to track referrals from your location
                  </p>
                </div>
                <div className="card text-center">
                  <DollarSign className="text-gold mx-auto mb-3" size={32} />
                  <h3 className="font-medium mb-2">15% Commission</h3>
                  <p className="text-paper/50 text-sm">
                    Earn commission on referrals that convert to paid subscriptions
                  </p>
                </div>
              </div>

              <div className="card mb-8 text-left">
                <h3 className="text-xl mb-4">Ideal Partners</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {BUSINESS_TYPES.slice(0, -1).map((type) => (
                    <div key={type.value} className="flex items-center gap-3">
                      <Check className="text-gold" size={18} />
                      <span>{type.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setShowApplyModal(true)}
                className="btn btn-primary text-lg px-8 py-4"
              >
                Apply to Partner Program
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
                  <h1 className="text-3xl font-light mb-2">Partner Dashboard</h1>
                  <p className="text-paper/50">
                    {partner.businessName} - {BUSINESS_TYPES.find(t => t.value === partner.businessType)?.label}
                  </p>
                </div>
                <button
                  onClick={() => setShowOrderModal(true)}
                  className="mt-4 md:mt-0 btn btn-primary flex items-center gap-2"
                >
                  <Plus size={18} />
                  Order Vouchers
                </button>
              </motion.div>

              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {(['overview', 'vouchers', 'orders', 'referrals'] as const).map((tab) => (
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
                    <h2 className="text-lg mb-4">Your Partner Code</h2>
                    <div className="bg-void/50 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-mono tracking-wider">{partner.partnerCode}</p>
                        <p className="text-paper/50 text-sm mt-1">
                          Share this code or use the QR code at your location
                        </p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(partner.partnerCode)}
                        className="p-3 hover:bg-gold/10 rounded-lg transition-colors"
                      >
                        {copied ? (
                          <Check className="text-green-400" size={24} />
                        ) : (
                          <Copy className="text-gold" size={24} />
                        )}
                      </button>
                    </div>
                    <div className="mt-4 pt-4 border-t border-paper/10">
                      <p className="text-paper/50 text-sm mb-2">Referral Link</p>
                      <a
                        href={`https://heirloom.app/partner/${partner.partnerCode}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gold hover:underline flex items-center gap-2"
                      >
                        heirloom.app/partner/{partner.partnerCode}
                        <ExternalLink size={16} />
                      </a>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="card text-center">
                      <Package className="text-gold mx-auto mb-2" size={24} />
                      <p className="text-3xl font-light">{stats.availableVouchers}</p>
                      <p className="text-paper/50 text-sm">Available Vouchers</p>
                    </div>
                    <div className="card text-center">
                      <Tag className="text-gold mx-auto mb-2" size={24} />
                      <p className="text-3xl font-light">{stats.usedVouchers}</p>
                      <p className="text-paper/50 text-sm">Vouchers Used</p>
                    </div>
                    <div className="card text-center">
                      <Users className="text-gold mx-auto mb-2" size={24} />
                      <p className="text-3xl font-light">{stats.totalReferrals}</p>
                      <p className="text-paper/50 text-sm">Total Referrals</p>
                    </div>
                    <div className="card text-center">
                      <DollarSign className="text-gold mx-auto mb-2" size={24} />
                      <p className="text-3xl font-light">${stats.totalCommission.toFixed(2)}</p>
                      <p className="text-paper/50 text-sm">Total Commission</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="card">
                      <h3 className="text-lg mb-4">Wholesale Pricing</h3>
                      <div className="space-y-3">
                        {WHOLESALE_TIERS.map((tier) => (
                          <div key={tier.tier} className="flex justify-between items-center">
                            <div>
                              <span className="font-medium">{tier.name}</span>
                              <span className="text-paper/50 text-sm ml-2">
                                (Retail ${tier.retailPrice})
                              </span>
                            </div>
                            <span className="text-gold font-medium">${tier.wholesalePrice}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-paper/50 text-sm mt-4">
                        30% off retail pricing on all voucher purchases
                      </p>
                    </div>

                    <div className="card">
                      <h3 className="text-lg mb-4">Commission Summary</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-paper/50">Pending</span>
                          <span className="font-medium">${stats.pendingCommission.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-paper/50">Converted Referrals</span>
                          <span className="font-medium">{stats.convertedReferrals}</span>
                        </div>
                        <div className="pt-3 border-t border-paper/10 flex justify-between items-center">
                          <span className="font-medium">Total Earned</span>
                          <span className="text-xl font-medium text-gold">${stats.totalCommission.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'vouchers' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="card"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl">Your Vouchers</h2>
                    <button
                      onClick={() => setShowOrderModal(true)}
                      className="btn btn-secondary btn-sm flex items-center gap-2"
                    >
                      <Plus size={16} />
                      Order More
                    </button>
                  </div>
                  {!vouchersData?.vouchers?.length ? (
                    <div className="text-center py-8 text-paper/50">
                      <Package className="mx-auto mb-3 opacity-50" size={40} />
                      <p>No vouchers yet. Order wholesale vouchers to get started!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {vouchersData.vouchers.map((voucher: any) => (
                        <div 
                          key={voucher.id}
                          className="flex items-center justify-between p-4 bg-void/30 rounded-xl"
                        >
                          <div>
                            <p className="font-mono">{voucher.code}</p>
                            <p className="text-paper/50 text-sm">
                              {voucher.tier} - {voucher.billingCycle}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`badge ${
                              voucher.status === 'AVAILABLE' 
                                ? 'badge-success' 
                                : voucher.status === 'REDEEMED'
                                ? 'badge-default'
                                : 'badge-gold'
                            }`}>
                              {voucher.status}
                            </span>
                            {voucher.status === 'AVAILABLE' && (
                              <button
                                onClick={() => copyToClipboard(voucher.code)}
                                className="p-2 hover:bg-gold/10 rounded-lg transition-colors"
                              >
                                <Copy className="text-gold" size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'orders' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="card"
                >
                  <h2 className="text-xl mb-4">Order History</h2>
                  {!ordersData?.orders?.length ? (
                    <div className="text-center py-8 text-paper/50">
                      <ShoppingCart className="mx-auto mb-3 opacity-50" size={40} />
                      <p>No orders yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {ordersData.orders.map((order: any) => (
                        <div 
                          key={order.id}
                          className="flex items-center justify-between p-4 bg-void/30 rounded-xl"
                        >
                          <div>
                            <p className="font-medium">
                              {order.quantity}x {order.tier} Vouchers
                            </p>
                            <p className="text-paper/50 text-sm">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">${order.totalAmount.toFixed(2)}</p>
                            <span className={`badge text-xs ${
                              order.paymentStatus === 'PAID' 
                                ? 'badge-success' 
                                : 'badge-gold'
                            }`}>
                              {order.paymentStatus}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'referrals' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="card"
                >
                  <h2 className="text-xl mb-4">Referral Tracking</h2>
                  {!referralsData?.referrals?.length ? (
                    <div className="text-center py-8 text-paper/50">
                      <TrendingUp className="mx-auto mb-3 opacity-50" size={40} />
                      <p>No referrals yet. Share your partner code to start tracking!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {referralsData.referrals.map((referral: any) => (
                        <div 
                          key={referral.id}
                          className="flex items-center justify-between p-4 bg-void/30 rounded-xl"
                        >
                          <div>
                            <p className="font-medium">
                              {referral.source === 'qr_code' ? 'QR Code Scan' : 'Link Click'}
                            </p>
                            <p className="text-paper/50 text-sm">
                              {new Date(referral.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            {referral.commissionAmount > 0 && (
                              <p className="font-medium text-gold">${referral.commissionAmount.toFixed(2)}</p>
                            )}
                            <span className={`badge text-xs ${
                              referral.status === 'CONVERTED' 
                                ? 'badge-success' 
                                : referral.status === 'SIGNED_UP'
                                ? 'badge-gold'
                                : 'badge-default'
                            }`}>
                              {referral.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
              <h2 className="text-2xl mb-6">Apply to Partner Program</h2>
              
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                <div>
                  <label className="block text-sm text-paper/50 mb-2">Business Name *</label>
                  <input
                    type="text"
                    value={applicationForm.businessName}
                    onChange={(e) => setApplicationForm({ ...applicationForm, businessName: e.target.value })}
                    className="input"
                    placeholder="Your Business Name"
                  />
                </div>

                <div>
                  <label className="block text-sm text-paper/50 mb-2">Business Type *</label>
                  <select
                    value={applicationForm.businessType}
                    onChange={(e) => setApplicationForm({ ...applicationForm, businessType: e.target.value })}
                    className="input"
                  >
                    {BUSINESS_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-paper/50 mb-2">Contact Name *</label>
                    <input
                      type="text"
                      value={applicationForm.contactName}
                      onChange={(e) => setApplicationForm({ ...applicationForm, contactName: e.target.value })}
                      className="input"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-paper/50 mb-2">Contact Email *</label>
                    <input
                      type="email"
                      value={applicationForm.contactEmail}
                      onChange={(e) => setApplicationForm({ ...applicationForm, contactEmail: e.target.value })}
                      className="input"
                      placeholder="email@business.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-paper/50 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={applicationForm.contactPhone}
                    onChange={(e) => setApplicationForm({ ...applicationForm, contactPhone: e.target.value })}
                    className="input"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm text-paper/50 mb-2">Website</label>
                  <input
                    type="url"
                    value={applicationForm.website}
                    onChange={(e) => setApplicationForm({ ...applicationForm, website: e.target.value })}
                    className="input"
                    placeholder="https://yourbusiness.com"
                  />
                </div>

                <div>
                  <label className="block text-sm text-paper/50 mb-2">Business Address</label>
                  <input
                    type="text"
                    value={applicationForm.address}
                    onChange={(e) => setApplicationForm({ ...applicationForm, address: e.target.value })}
                    className="input"
                    placeholder="123 Main St, City, State"
                  />
                </div>

                <div>
                  <label className="block text-sm text-paper/50 mb-2">Estimated Monthly Referrals</label>
                  <input
                    type="number"
                    value={applicationForm.estimatedMonthlyReferrals}
                    onChange={(e) => setApplicationForm({ ...applicationForm, estimatedMonthlyReferrals: e.target.value })}
                    className="input"
                    placeholder="50"
                  />
                </div>

                <div>
                  <label className="block text-sm text-paper/50 mb-2">Tell us about your business</label>
                  <textarea
                    value={applicationForm.description}
                    onChange={(e) => setApplicationForm({ ...applicationForm, description: e.target.value })}
                    className="input min-h-[100px]"
                    placeholder="How would you use Heirloom with your clients?"
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
                    !applicationForm.businessName || 
                    !applicationForm.contactName || 
                    !applicationForm.contactEmail ||
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

      <AnimatePresence>
        {showOrderModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-backdrop"
            onClick={() => setShowOrderModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="modal max-w-md"
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-2xl mb-6">Order Wholesale Vouchers</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-paper/50 mb-2">Plan Tier</label>
                  <select
                    value={orderForm.tier}
                    onChange={(e) => setOrderForm({ ...orderForm, tier: e.target.value })}
                    className="input"
                  >
                    {WHOLESALE_TIERS.map((tier) => (
                      <option key={tier.tier} value={tier.tier}>
                        {tier.name} - ${tier.wholesalePrice} each (Retail ${tier.retailPrice})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-paper/50 mb-2">Quantity (min 5)</label>
                  <input
                    type="number"
                    min={5}
                    value={orderForm.quantity}
                    onChange={(e) => setOrderForm({ ...orderForm, quantity: Math.max(5, parseInt(e.target.value) || 5) })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm text-paper/50 mb-2">Billing Cycle</label>
                  <select
                    value={orderForm.billingCycle}
                    onChange={(e) => setOrderForm({ ...orderForm, billingCycle: e.target.value })}
                    className="input"
                  >
                    <option value="yearly">Yearly (1 year subscription)</option>
                    <option value="monthly">Monthly (1 month subscription)</option>
                  </select>
                </div>

                <div className="bg-void/50 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-paper/50">Unit Price</span>
                    <span>${selectedTier?.wholesalePrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-paper/50">Quantity</span>
                    <span>{orderForm.quantity}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-paper/10">
                    <span className="font-medium">Total</span>
                    <span className="text-xl font-medium text-gold">${orderTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={() => orderMutation.mutate()}
                  disabled={orderMutation.isPending}
                  className="btn btn-primary flex-1"
                >
                  {orderMutation.isPending ? (
                    <Loader2 className="animate-spin mx-auto" size={20} />
                  ) : (
                    'Place Order'
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
