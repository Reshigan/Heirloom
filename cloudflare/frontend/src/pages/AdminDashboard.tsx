import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, CreditCard, BarChart3, Tag, LogOut, Plus, Trash2, 
  DollarSign, Activity, Search, X, MessageSquare, Shield,
  FileText, Mail, Download, Clock, AlertTriangle, CheckCircle,
  UserPlus, Send, Eye, Gift, RefreshCw, Copy
} from '../components/Icons';
import { adminApi } from '../services/api';

// Admin auth check
const useAdminAuth = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('adminToken');
  const adminUser = localStorage.getItem('adminUser');

  useEffect(() => {
    if (!token || !adminUser) {
      navigate('/admin/login');
    }
  }, [token, adminUser, navigate]);

  return adminUser ? JSON.parse(adminUser) : null;
};


export function AdminDashboard() {
  const navigate = useNavigate();
  const admin = useAdminAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Queries
  const { data: overview } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: () => adminApi.getAnalyticsOverview().then(r => r.data),
  });

  const { data: revenue } = useQuery({
    queryKey: ['admin-revenue'],
    queryFn: () => adminApi.getAnalyticsRevenue().then(r => r.data),
  });

  const { data: userAnalytics } = useQuery({
    queryKey: ['admin-user-analytics'],
    queryFn: () => adminApi.getAnalyticsUsers().then(r => r.data),
  });

  const { data: coupons } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: () => adminApi.getCoupons().then(r => r.data),
  });

  const { data: users } = useQuery({
    queryKey: ['admin-users', userSearch],
    queryFn: () => adminApi.getUsers({ search: userSearch, limit: 20 }).then(r => r.data),
  });

  const { data: tickets } = useQuery({
    queryKey: ['admin-tickets'],
    queryFn: () => adminApi.getTickets({ limit: 50 }).then(r => r.data),
    enabled: activeTab === 'support',
  });

  const { data: systemHealth } = useQuery({
    queryKey: ['admin-system-health'],
    queryFn: () => adminApi.getSystemHealth().then(r => r.data),
    enabled: activeTab === 'system',
    refetchInterval: 30000,
  });

  const { data: systemStats } = useQuery({
    queryKey: ['admin-system-stats'],
    queryFn: () => adminApi.getSystemStats().then(r => r.data),
    enabled: activeTab === 'system',
  });

  const { data: auditLogs } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: () => adminApi.getAuditLogs({ limit: 50 }).then(r => r.data),
    enabled: activeTab === 'audit',
  });

  const { data: adminUsers } = useQuery({
    queryKey: ['admin-admin-users'],
    queryFn: () => adminApi.getAdminUsers().then(r => r.data),
    enabled: activeTab === 'admins',
  });

  const { data: emailLogs } = useQuery({
    queryKey: ['admin-email-logs'],
    queryFn: () => adminApi.getEmailLogs({ limit: 50 }).then(r => r.data),
    enabled: activeTab === 'emails',
  });

  const { data: billingErrors } = useQuery({
    queryKey: ['admin-billing-errors'],
    queryFn: () => adminApi.getBillingErrors({ limit: 50 }).then(r => r.data),
    enabled: activeTab === 'billing',
  });

  const { data: billingStats } = useQuery({
    queryKey: ['admin-billing-stats'],
    queryFn: () => adminApi.getBillingErrorStats().then(r => r.data),
    enabled: activeTab === 'billing',
  });

  const { data: revenueReport } = useQuery({
    queryKey: ['admin-revenue-report'],
    queryFn: () => adminApi.getRevenueReport().then(r => r.data),
    enabled: activeTab === 'reports',
  });

    const { data: userGrowth } = useQuery({
      queryKey: ['admin-user-growth'],
      queryFn: () => adminApi.getUserGrowthReport().then(r => r.data),
      enabled: activeTab === 'reports',
    });

    const { data: giftVouchers, refetch: refetchVouchers } = useQuery({
      queryKey: ['admin-gift-vouchers'],
      queryFn: async () => {
        const token = localStorage.getItem('adminToken');
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://api.heirloom.blue/api'}/gift-vouchers/admin/all`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        return res.json();
      },
      enabled: activeTab === 'vouchers',
    });

    const { data: voucherStats } = useQuery({
      queryKey: ['admin-voucher-stats'],
      queryFn: async () => {
        const token = localStorage.getItem('adminToken');
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://api.heirloom.blue/api'}/gift-vouchers/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        return res.json();
      },
      enabled: activeTab === 'vouchers',
    });

    const [showVoucherModal, setShowVoucherModal] = useState(false);

    const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  if (!admin) return null;

    const tabs = [
      { id: 'overview', label: 'Overview', icon: BarChart3 },
      { id: 'users', label: 'Users', icon: Users },
      { id: 'coupons', label: 'Coupons', icon: Tag },
      { id: 'vouchers', label: 'Gift Vouchers', icon: Gift },
      { id: 'billing', label: 'Billing', icon: CreditCard },
      { id: 'support', label: 'Support', icon: MessageSquare },
      { id: 'system', label: 'System', icon: Shield },
      { id: 'audit', label: 'Audit Logs', icon: FileText },
      { id: 'admins', label: 'Admins', icon: UserPlus },
      { id: 'emails', label: 'Emails', icon: Mail },
      { id: 'reports', label: 'Reports', icon: Download },
    ];

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

      <div className="relative z-10">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-light text-gold">Heirloom Admin</h1>
            <span className="px-2 py-1 bg-gold/20 text-gold text-xs">{admin.role}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-paper/50 text-sm">{admin.email}</span>
            <button onClick={handleLogout} className="text-paper/50 hover:text-blood transition-colors">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded transition-all ${
                activeTab === id 
                  ? 'bg-gold/20 text-gold' 
                  : 'text-paper/50 hover:text-paper hover:bg-white/5'
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={Users}
                label="Total Users"
                value={overview?.users?.total || 0}
                subtext={`+${overview?.users?.recentSignups || 0} this week`}
              />
              <StatCard
                icon={CreditCard}
                label="Active Subscriptions"
                value={overview?.users?.active || 0}
                subtext={`${overview?.users?.trialing || 0} trialing`}
              />
              <StatCard
                icon={DollarSign}
                label="Est. MRR"
                value={`$${revenue?.mrr?.toFixed(2) || '0.00'}`}
                subtext={`${revenue?.activeSubscriptions || 0} paying`}
              />
              <StatCard
                icon={Activity}
                label="Total Content"
                value={(overview?.content?.memories || 0) + (overview?.content?.letters || 0) + (overview?.content?.voiceRecordings || 0)}
                subtext={`${overview?.content?.memories || 0} memories`}
              />
            </div>

            {/* Subscription Breakdown */}
            <div className="card">
              <h3 className="text-lg mb-4">Subscription Breakdown</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { key: 'starter', label: 'Starter ($1/mo)' },
                  { key: 'family', label: 'Family ($2/mo)' },
                  { key: 'forever', label: 'Forever ($5/mo)' },
                ].map(({ key, label }) => (
                  <div key={key} className="p-4 bg-white/[0.02] border border-white/10 rounded">
                    <div className="text-2xl text-gold mb-1">
                      {overview?.subscriptions?.[key] || overview?.subscriptions?.[key.toUpperCase()] || 0}
                    </div>
                    <div className="text-paper/50 text-sm">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* User Activity */}
            <div className="card">
              <h3 className="text-lg mb-4">User Activity</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-white/[0.02] border border-white/10 rounded">
                  <div className="text-2xl text-paper mb-1">{userAnalytics?.signupsLast30Days || 0}</div>
                  <div className="text-paper/50 text-sm">Signups (30d)</div>
                </div>
                <div className="p-4 bg-white/[0.02] border border-white/10 rounded">
                  <div className="text-2xl text-paper mb-1">{userAnalytics?.signupsLast7Days || 0}</div>
                  <div className="text-paper/50 text-sm">Signups (7d)</div>
                </div>
                <div className="p-4 bg-white/[0.02] border border-white/10 rounded">
                  <div className="text-2xl text-paper mb-1">{userAnalytics?.activeUsersLast7Days || 0}</div>
                  <div className="text-paper/50 text-sm">Active (7d)</div>
                </div>
                <div className="p-4 bg-white/[0.02] border border-white/10 rounded">
                  <div className="text-2xl text-paper mb-1">{userAnalytics?.usersWithContent || 0}</div>
                  <div className="text-paper/50 text-sm">With Content</div>
                </div>
              </div>
            </div>

            {/* Revenue Stats */}
            <div className="card">
              <h3 className="text-lg mb-4">Revenue & Discounts</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/[0.02] border border-white/10 rounded">
                  <div className="text-2xl text-green-400 mb-1">
                    ${revenue?.mrr?.toFixed(2) || '0.00'}
                  </div>
                  <div className="text-paper/50 text-sm">Monthly Recurring Revenue</div>
                </div>
                <div className="p-4 bg-white/[0.02] border border-white/10 rounded">
                  <div className="text-2xl text-blood mb-1">
                    ${revenue?.totalDiscountsLast30Days?.toFixed(2) || '0.00'}
                  </div>
                  <div className="text-paper/50 text-sm">Discounts Given (30d)</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Coupons Tab */}
        {activeTab === 'coupons' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl">Coupon Management</h2>
              <button
                onClick={() => setShowCouponModal(true)}
                className="btn btn-primary flex items-center gap-2"
              >
                <Plus size={18} />
                Create Coupon
              </button>
            </div>

            <div className="card">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-paper/50 font-normal">Code</th>
                    <th className="text-left py-3 px-4 text-paper/50 font-normal">Discount</th>
                    <th className="text-left py-3 px-4 text-paper/50 font-normal">Uses</th>
                    <th className="text-left py-3 px-4 text-paper/50 font-normal">Valid Until</th>
                    <th className="text-left py-3 px-4 text-paper/50 font-normal">Status</th>
                    <th className="text-right py-3 px-4 text-paper/50 font-normal">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons?.map((coupon: any) => (
                    <CouponRow key={coupon.id} coupon={coupon} />
                  ))}
                  {(!coupons || coupons.length === 0) && (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-paper/50">
                        No coupons created yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Gift Vouchers Tab */}
        {activeTab === 'vouchers' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl">Gift Voucher Management</h2>
              <button
                onClick={() => setShowVoucherModal(true)}
                className="btn btn-primary flex items-center gap-2"
              >
                <Plus size={18} />
                Create Voucher
              </button>
            </div>

            {/* Voucher Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gold/20 rounded">
                    <Gift className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <div className="text-2xl text-gold">{voucherStats?.stats?.total || 0}</div>
                    <div className="text-paper/50 text-sm">Total Vouchers</div>
                  </div>
                </div>
              </div>
              <div className="card p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded">
                    <Send className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-2xl text-blue-400">{voucherStats?.stats?.sent || 0}</div>
                    <div className="text-paper/50 text-sm">Sent</div>
                  </div>
                </div>
              </div>
              <div className="card p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <div className="text-2xl text-green-400">{voucherStats?.stats?.redeemed || 0}</div>
                    <div className="text-paper/50 text-sm">Redeemed</div>
                  </div>
                </div>
              </div>
              <div className="card p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded">
                    <DollarSign className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <div className="text-2xl text-green-400">${((voucherStats?.stats?.total_revenue || 0) / 100).toFixed(2)}</div>
                    <div className="text-paper/50 text-sm">Total Revenue</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Vouchers Table */}
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg">All Vouchers</h3>
                <button onClick={() => refetchVouchers()} className="text-paper/50 hover:text-gold">
                  <RefreshCw size={18} />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-paper/50 font-normal">Code</th>
                      <th className="text-left py-3 px-4 text-paper/50 font-normal">Tier</th>
                      <th className="text-left py-3 px-4 text-paper/50 font-normal">Purchaser</th>
                      <th className="text-left py-3 px-4 text-paper/50 font-normal">Recipient</th>
                      <th className="text-left py-3 px-4 text-paper/50 font-normal">Status</th>
                      <th className="text-left py-3 px-4 text-paper/50 font-normal">Created</th>
                      <th className="text-right py-3 px-4 text-paper/50 font-normal">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {giftVouchers?.vouchers?.map((voucher: any) => (
                      <tr key={voucher.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-gold">{voucher.code}</span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(voucher.code);
                                alert('Code copied!');
                              }}
                              className="text-paper/30 hover:text-gold"
                            >
                              <Copy size={14} />
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 text-xs rounded ${
                            voucher.tier === 'FOREVER' ? 'bg-gold/20 text-gold' :
                            voucher.tier === 'FAMILY' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-white/10 text-paper/70'
                          }`}>
                            {voucher.tier}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-paper/70 text-sm">{voucher.purchaser_email}</td>
                        <td className="py-3 px-4 text-paper/70 text-sm">{voucher.recipient_email || '-'}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 text-xs rounded ${
                            voucher.status === 'REDEEMED' ? 'bg-green-500/20 text-green-400' :
                            voucher.status === 'SENT' ? 'bg-blue-500/20 text-blue-400' :
                            voucher.status === 'PAID' ? 'bg-gold/20 text-gold' :
                            voucher.status === 'EXPIRED' ? 'bg-red-500/20 text-red-400' :
                            'bg-white/10 text-paper/50'
                          }`}>
                            {voucher.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-paper/50 text-sm">
                          {new Date(voucher.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {voucher.status === 'PAID' && voucher.recipient_email && (
                              <button
                                onClick={async () => {
                                  const token = localStorage.getItem('adminToken');
                                  await fetch(`${import.meta.env.VITE_API_URL || 'https://api.heirloom.blue/api'}/gift-vouchers/admin/${voucher.id}/resend`, {
                                    method: 'POST',
                                    headers: { Authorization: `Bearer ${token}` },
                                  });
                                  alert('Email resent!');
                                }}
                                className="text-paper/30 hover:text-blue-400"
                                title="Resend email"
                              >
                                <Send size={16} />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                const url = `${window.location.origin}/gift/redeem?code=${voucher.code}`;
                                navigator.clipboard.writeText(url);
                                alert('Redemption link copied!');
                              }}
                              className="text-paper/30 hover:text-gold"
                              title="Copy redemption link"
                            >
                              <Eye size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {(!giftVouchers?.vouchers || giftVouchers.vouchers.length === 0) && (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-paper/50">
                          No gift vouchers created yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Billing Tab */}
        {activeTab === 'billing' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl">Billing Analysis & Error Management</h2>
              <button
                onClick={() => adminApi.notifyAllFailedBilling().then(() => alert('Notifications sent!'))}
                className="btn btn-primary flex items-center gap-2"
              >
                <Send size={18} />
                Notify All Failed
              </button>
            </div>

            {/* Billing Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/20 rounded">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <div className="text-2xl text-red-400">{billingStats?.failed || 0}</div>
                    <div className="text-paper/50 text-sm">Failed Payments</div>
                  </div>
                </div>
              </div>
              <div className="card p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-500/20 rounded">
                    <Clock className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <div className="text-2xl text-yellow-400">{billingStats?.pendingRetry || 0}</div>
                    <div className="text-paper/50 text-sm">Pending Retry</div>
                  </div>
                </div>
              </div>
              <div className="card p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <div className="text-2xl text-green-400">{billingStats?.resolved || 0}</div>
                    <div className="text-paper/50 text-sm">Resolved</div>
                  </div>
                </div>
              </div>
              <div className="card p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded">
                    <Activity className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-2xl text-blue-400">{billingStats?.last24Hours || 0}</div>
                    <div className="text-paper/50 text-sm">Last 24 Hours</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Billing Errors Table */}
            <div className="card">
              <h3 className="text-lg mb-4">Billing Errors</h3>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-paper/50 font-normal">User</th>
                    <th className="text-left py-3 px-4 text-paper/50 font-normal">Error Type</th>
                    <th className="text-left py-3 px-4 text-paper/50 font-normal">Amount</th>
                    <th className="text-left py-3 px-4 text-paper/50 font-normal">Status</th>
                    <th className="text-left py-3 px-4 text-paper/50 font-normal">Retries</th>
                    <th className="text-left py-3 px-4 text-paper/50 font-normal">Date</th>
                    <th className="text-right py-3 px-4 text-paper/50 font-normal">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {billingErrors?.data?.map((error: any) => (
                    <tr key={error.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="py-3 px-4">
                        <div className="text-paper">{error.userName}</div>
                        <div className="text-paper/50 text-sm">{error.userEmail}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded">
                          {error.errorType?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-paper/70">
                        ${((error.amount || 0) / 100).toFixed(2)} {error.currency}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs rounded ${
                          error.status === 'FAILED' ? 'bg-red-500/20 text-red-400' :
                          error.status === 'PENDING_RETRY' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                          {error.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-paper/50">{error.retryCount || 0}</td>
                      <td className="py-3 px-4 text-paper/50 text-sm">
                        {new Date(error.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => adminApi.notifyBillingError(error.id).then(() => alert('Notification sent!'))}
                            className="p-1 text-paper/50 hover:text-gold transition-colors"
                            title="Notify User"
                          >
                            <Mail size={16} />
                          </button>
                          <button
                            onClick={() => adminApi.reprocessBillingError(error.id).then(() => alert('Reprocessing initiated!'))}
                            className="p-1 text-paper/50 hover:text-blue-400 transition-colors"
                            title="Reprocess Payment"
                          >
                            <Activity size={16} />
                          </button>
                          <button
                            onClick={() => adminApi.resolveBillingError(error.id, { resolution: 'Manually resolved' }).then(() => alert('Marked as resolved!'))}
                            className="p-1 text-paper/50 hover:text-green-400 transition-colors"
                            title="Mark Resolved"
                          >
                            <CheckCircle size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(!billingErrors?.data || billingErrors.data.length === 0) && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-paper/50">
                        No billing errors found - all payments are processing successfully
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl">User Management</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-paper/30" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="input pl-10 w-64"
                />
              </div>
            </div>

            <div className="card">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-paper/50 font-normal">User</th>
                    <th className="text-left py-3 px-4 text-paper/50 font-normal">Subscription</th>
                    <th className="text-left py-3 px-4 text-paper/50 font-normal">Content</th>
                    <th className="text-left py-3 px-4 text-paper/50 font-normal">Joined</th>
                    <th className="text-left py-3 px-4 text-paper/50 font-normal">Last Active</th>
                  </tr>
                </thead>
                <tbody>
                  {users?.users?.map((user: any) => (
                    <tr key={user.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="py-3 px-4">
                        <div className="text-paper">{user.firstName} {user.lastName}</div>
                        <div className="text-paper/50 text-sm">{user.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs ${
                          user.subscription?.tier === 'FOREVER' ? 'bg-purple-500/20 text-purple-400' :
                          user.subscription?.tier === 'FAMILY' ? 'bg-gold/20 text-gold' :
                          user.subscription?.tier === 'STARTER' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-white/10 text-paper/50'
                        }`}>
                          {user.subscription?.tier || 'STARTER'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-paper/70">
                        {user.contentCount?.memories || 0} memories, {user.contentCount?.letters || 0} letters
                      </td>
                      <td className="py-3 px-4 text-paper/50 text-sm">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-paper/50 text-sm">
                        {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                      </td>
                    </tr>
                  ))}
                  {(!users?.users || users.users.length === 0) && (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-paper/50">
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              {users?.pagination && (
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/10">
                  <span className="text-paper/50 text-sm">
                    Showing {users.users?.length || 0} of {users.pagination.total} users
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Support Tab */}
        {activeTab === 'support' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl">Support Tickets</h2>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-sm rounded">
                  {tickets?.data?.filter((t: any) => t.status === 'OPEN').length || 0} Open
                </span>
                <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-sm rounded">
                  {tickets?.data?.filter((t: any) => t.status === 'IN_PROGRESS').length || 0} In Progress
                </span>
              </div>
            </div>

            <div className="card">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-paper/50 font-normal">Subject</th>
                    <th className="text-left py-3 px-4 text-paper/50 font-normal">User</th>
                    <th className="text-left py-3 px-4 text-paper/50 font-normal">Priority</th>
                    <th className="text-left py-3 px-4 text-paper/50 font-normal">Status</th>
                    <th className="text-left py-3 px-4 text-paper/50 font-normal">Created</th>
                    <th className="text-right py-3 px-4 text-paper/50 font-normal">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets?.data?.map((ticket: any) => (
                    <tr key={ticket.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="py-3 px-4">
                        <div className="text-paper">{ticket.subject}</div>
                        <div className="text-paper/50 text-sm">{ticket.category}</div>
                      </td>
                      <td className="py-3 px-4 text-paper/70">{ticket.email}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs ${
                          ticket.priority === 'HIGH' ? 'bg-blood/20 text-blood' :
                          ticket.priority === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-white/10 text-paper/50'
                        }`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs ${
                          ticket.status === 'OPEN' ? 'bg-yellow-500/20 text-yellow-400' :
                          ticket.status === 'IN_PROGRESS' ? 'bg-blue-500/20 text-blue-400' :
                          ticket.status === 'RESOLVED' ? 'bg-green-500/20 text-green-400' :
                          'bg-white/10 text-paper/50'
                        }`}>
                          {ticket.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-paper/50 text-sm">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedTicket(ticket.id)}
                          className="text-paper/50 hover:text-gold transition-colors"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(!tickets?.data || tickets.data.length === 0) && (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-paper/50">
                        No support tickets
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* System Health Tab */}
        {activeTab === 'system' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl">System Health</h2>
              <span className={`px-3 py-1 text-sm rounded ${
                systemHealth?.status === 'healthy' ? 'bg-green-500/20 text-green-400' :
                'bg-yellow-500/20 text-yellow-400'
              }`}>
                {systemHealth?.status || 'Unknown'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {systemHealth?.checks && Object.entries(systemHealth.checks).map(([key, value]) => (
                key !== 'timestamp' && (
                  <div key={key} className="card">
                    <div className="flex items-center justify-between">
                      <span className="text-paper capitalize">{key}</span>
                      <span className={`flex items-center gap-2 ${
                        value === 'healthy' ? 'text-green-400' : 'text-blood'
                      }`}>
                        {value === 'healthy' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                        {value as string}
                      </span>
                    </div>
                  </div>
                )
              ))}
            </div>

            <div className="card">
              <h3 className="text-lg mb-4">System Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-white/[0.02] border border-white/10 rounded">
                  <div className="text-2xl text-paper mb-1">{systemStats?.users || 0}</div>
                  <div className="text-paper/50 text-sm">Total Users</div>
                </div>
                <div className="p-4 bg-white/[0.02] border border-white/10 rounded">
                  <div className="text-2xl text-paper mb-1">{systemStats?.openTickets || 0}</div>
                  <div className="text-paper/50 text-sm">Open Tickets</div>
                </div>
                <div className="p-4 bg-white/[0.02] border border-white/10 rounded">
                  <div className="text-2xl text-paper mb-1">
                    {((systemStats?.storage?.total || 0) / (1024 * 1024 * 1024)).toFixed(2)} GB
                  </div>
                  <div className="text-paper/50 text-sm">Storage Used</div>
                </div>
                <div className="p-4 bg-white/[0.02] border border-white/10 rounded">
                  <div className="text-2xl text-paper mb-1">
                    {(systemStats?.content?.memories || 0) + (systemStats?.content?.letters || 0)}
                  </div>
                  <div className="text-paper/50 text-sm">Total Content</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Audit Logs Tab */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            <h2 className="text-xl">Audit Logs</h2>

            <div className="card">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-paper/50 font-normal">Action</th>
                    <th className="text-left py-3 px-4 text-paper/50 font-normal">Admin</th>
                    <th className="text-left py-3 px-4 text-paper/50 font-normal">Details</th>
                    <th className="text-left py-3 px-4 text-paper/50 font-normal">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs?.data?.map((log: any) => (
                    <tr key={log.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-white/10 text-paper text-xs">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-paper/70">{log.admin?.email || 'System'}</td>
                      <td className="py-3 px-4 text-paper/50 text-sm">
                        {log.details ? JSON.stringify(log.details).substring(0, 50) : '-'}
                      </td>
                      <td className="py-3 px-4 text-paper/50 text-sm">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {(!auditLogs?.data || auditLogs.data.length === 0) && (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-paper/50">
                        No audit logs
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Admin Users Tab */}
        {activeTab === 'admins' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl">Admin Users</h2>
              {admin.role === 'SUPER_ADMIN' && (
                <button
                  onClick={() => setShowAdminModal(true)}
                  className="btn btn-primary flex items-center gap-2"
                >
                  <UserPlus size={18} />
                  Add Admin
                </button>
              )}
            </div>

            <div className="card">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-paper/50 font-normal">Name</th>
                    <th className="text-left py-3 px-4 text-paper/50 font-normal">Email</th>
                    <th className="text-left py-3 px-4 text-paper/50 font-normal">Role</th>
                    <th className="text-left py-3 px-4 text-paper/50 font-normal">Status</th>
                    <th className="text-left py-3 px-4 text-paper/50 font-normal">Last Login</th>
                  </tr>
                </thead>
                <tbody>
                  {adminUsers?.map((adminUser: any) => (
                    <tr key={adminUser.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="py-3 px-4 text-paper">
                        {adminUser.firstName} {adminUser.lastName}
                      </td>
                      <td className="py-3 px-4 text-paper/70">{adminUser.email}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs ${
                          adminUser.role === 'SUPER_ADMIN' ? 'bg-purple-500/20 text-purple-400' :
                          'bg-gold/20 text-gold'
                        }`}>
                          {adminUser.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs ${
                          adminUser.isActive ? 'bg-green-500/20 text-green-400' : 'bg-blood/20 text-blood'
                        }`}>
                          {adminUser.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-paper/50 text-sm">
                        {adminUser.lastLoginAt ? new Date(adminUser.lastLoginAt).toLocaleString() : 'Never'}
                      </td>
                    </tr>
                  ))}
                  {(!adminUsers || adminUsers.length === 0) && (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-paper/50">
                        No admin users
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Emails Tab */}
        {activeTab === 'emails' && (
          <div className="space-y-6">
            <h2 className="text-xl">Email Management</h2>

            <div className="card">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-paper/50 font-normal">To</th>
                    <th className="text-left py-3 px-4 text-paper/50 font-normal">Subject</th>
                    <th className="text-left py-3 px-4 text-paper/50 font-normal">Status</th>
                    <th className="text-left py-3 px-4 text-paper/50 font-normal">Sent</th>
                  </tr>
                </thead>
                <tbody>
                  {emailLogs?.data?.map((email: any) => (
                    <tr key={email.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="py-3 px-4 text-paper/70">{email.to}</td>
                      <td className="py-3 px-4 text-paper">{email.subject}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs ${
                          email.status === 'SENT' ? 'bg-green-500/20 text-green-400' :
                          email.status === 'FAILED' ? 'bg-blood/20 text-blood' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {email.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-paper/50 text-sm">
                        {email.sentAt ? new Date(email.sentAt).toLocaleString() : '-'}
                      </td>
                    </tr>
                  ))}
                  {(!emailLogs?.data || emailLogs.data.length === 0) && (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-paper/50">
                        No email logs
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <h2 className="text-xl">Reports & Analytics</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Revenue Report */}
              <div className="card">
                <h3 className="text-lg mb-4">Revenue Report</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-white/[0.02] rounded">
                    <span className="text-paper/70">Monthly Recurring Revenue</span>
                    <span className="text-green-400 text-xl">${revenueReport?.mrr?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/[0.02] rounded">
                    <span className="text-paper/70">Annual Recurring Revenue</span>
                    <span className="text-green-400 text-xl">${revenueReport?.arr?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/[0.02] rounded">
                    <span className="text-paper/70">Active Subscriptions</span>
                    <span className="text-paper text-xl">{revenueReport?.activeSubscriptions || 0}</span>
                  </div>
                </div>
              </div>

              {/* User Growth */}
              <div className="card">
                <h3 className="text-lg mb-4">User Growth (Last 30 Days)</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-white/[0.02] rounded">
                    <span className="text-paper/70">Total New Signups</span>
                    <span className="text-gold text-xl">{userGrowth?.totalSignups || 0}</span>
                  </div>
                  <div className="mt-4">
                    <div className="text-paper/50 text-sm mb-2">Daily Signups</div>
                    <div className="flex gap-1 h-20 items-end">
                      {userGrowth?.data?.slice(-14).map((day: any, i: number) => (
                        <div
                          key={i}
                          className="flex-1 bg-gold/50 rounded-t"
                          style={{ height: `${Math.max(10, (day.signups / Math.max(...(userGrowth?.data?.map((d: any) => d.signups) || [1]))) * 100)}%` }}
                          title={`${day.date}: ${day.signups} signups`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Export Button */}
            <div className="card">
              <h3 className="text-lg mb-4">Export Data</h3>
              <div className="flex gap-4">
                <button
                  onClick={() => window.open(`${import.meta.env.VITE_API_URL || 'https://api.heirloom.blue/api'}/admin/reports/export/users?format=csv`, '_blank')}
                  className="btn btn-secondary flex items-center gap-2"
                >
                  <Download size={18} />
                  Export Users (CSV)
                </button>
                <button
                  onClick={() => window.open(`${import.meta.env.VITE_API_URL || 'https://api.heirloom.blue/api'}/admin/reports/export/users?format=json`, '_blank')}
                  className="btn btn-secondary flex items-center gap-2"
                >
                  <Download size={18} />
                  Export Users (JSON)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
            {showCouponModal && (
              <CreateCouponModal onClose={() => setShowCouponModal(false)} />
            )}
            {showVoucherModal && (
              <CreateVoucherModal onClose={() => { setShowVoucherModal(false); refetchVouchers(); }} />
            )}
            {showAdminModal && (
        <CreateAdminModal onClose={() => setShowAdminModal(false)} />
      )}
      {selectedUser && (
        <UserActionsModal user={selectedUser} onClose={() => setSelectedUser(null)} />
      )}
      {selectedTicket && (
        <TicketDetailModal ticketId={selectedTicket} onClose={() => setSelectedTicket(null)} />
      )}
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ icon: Icon, label, value, subtext }: { icon: any; label: string; value: string | number; subtext: string }) {
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-paper/50 text-sm mb-1">{label}</div>
          <div className="text-2xl text-paper">{value}</div>
          <div className="text-paper/40 text-sm mt-1">{subtext}</div>
        </div>
        <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-gold" />
        </div>
      </div>
    </div>
  );
}

// Coupon Row Component
function CouponRow({ coupon }: { coupon: any }) {
  const queryClient = useQueryClient();
  
  const deleteMutation = useMutation({
    mutationFn: () => adminApi.deleteCoupon(coupon.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: () => adminApi.updateCoupon(coupon.id, { isActive: !coupon.isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
    },
  });

  return (
    <tr className="border-b border-white/5 hover:bg-white/[0.02]">
      <td className="py-3 px-4">
        <span className="font-mono text-gold">{coupon.code}</span>
        {coupon.description && (
          <div className="text-paper/50 text-sm">{coupon.description}</div>
        )}
      </td>
      <td className="py-3 px-4">
        {coupon.discountType === 'PERCENTAGE' 
          ? `${coupon.discountValue}%` 
          : `$${(coupon.discountValue / 100).toFixed(2)}`}
      </td>
      <td className="py-3 px-4 text-paper/70">
        {coupon.currentUses} / {coupon.maxUses || '∞'}
      </td>
      <td className="py-3 px-4 text-paper/50 text-sm">
        {coupon.validUntil ? new Date(coupon.validUntil).toLocaleDateString() : 'No expiry'}
      </td>
      <td className="py-3 px-4">
        <button
          onClick={() => toggleMutation.mutate()}
          className={`px-2 py-1 text-xs ${
            coupon.isActive 
              ? 'bg-green-500/20 text-green-400' 
              : 'bg-white/10 text-paper/50'
          }`}
        >
          {coupon.isActive ? 'Active' : 'Inactive'}
        </button>
      </td>
      <td className="py-3 px-4 text-right">
        <button
          onClick={() => {
            if (confirm('Delete this coupon?')) {
              deleteMutation.mutate();
            }
          }}
          className="text-paper/30 hover:text-blood transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </td>
    </tr>
  );
}

// Create Coupon Modal
function CreateCouponModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    maxUses: '',
    validUntil: '',
  });

  const createMutation = useMutation({
    mutationFn: () => adminApi.createCoupon({
      code: formData.code,
      description: formData.description || undefined,
      discountType: formData.discountType,
      discountValue: formData.discountType === 'PERCENTAGE' 
        ? formData.discountValue 
        : formData.discountValue * 100,
      maxUses: formData.maxUses ? parseInt(formData.maxUses) : undefined,
      validUntil: formData.validUntil || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-void border border-white/10 rounded-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl">Create Coupon</h3>
          <button onClick={onClose} className="text-paper/50 hover:text-paper">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-paper/50 mb-2">Coupon Code</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              className="input"
              placeholder="SAVE20"
            />
          </div>

          <div>
            <label className="block text-sm text-paper/50 mb-2">Description (optional)</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input"
              placeholder="20% off for new users"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-paper/50 mb-2">Discount Type</label>
              <select
                value={formData.discountType}
                onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                className="input"
              >
                <option value="PERCENTAGE">Percentage</option>
                <option value="FIXED_AMOUNT">Fixed Amount</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-paper/50 mb-2">
                {formData.discountType === 'PERCENTAGE' ? 'Percentage (%)' : 'Amount ($)'}
              </label>
              <input
                type="number"
                value={formData.discountValue}
                onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) })}
                className="input"
                min={0}
                max={formData.discountType === 'PERCENTAGE' ? 100 : undefined}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-paper/50 mb-2">Max Uses (optional)</label>
              <input
                type="number"
                value={formData.maxUses}
                onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                className="input"
                placeholder="Unlimited"
                min={1}
              />
            </div>
            <div>
              <label className="block text-sm text-paper/50 mb-2">Valid Until (optional)</label>
              <input
                type="date"
                value={formData.validUntil}
                onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                className="input"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button onClick={onClose} className="btn btn-secondary flex-1">
              Cancel
            </button>
            <button
              onClick={() => createMutation.mutate()}
              disabled={!formData.code || createMutation.isPending}
              className="btn btn-primary flex-1"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Coupon'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Create Admin Modal
function CreateAdminModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'ADMIN',
  });

  const createMutation = useMutation({
    mutationFn: () => adminApi.createAdminUser(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-admin-users'] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-void border border-white/10 rounded-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl">Add Admin User</h3>
          <button onClick={onClose} className="text-paper/50 hover:text-paper">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-paper/50 mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input"
              placeholder="admin@heirloom.blue"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-paper/50 mb-2">First Name</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm text-paper/50 mb-2">Last Name</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-paper/50 mb-2">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="input"
            >
              <option value="ADMIN">Admin</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button onClick={onClose} className="btn btn-secondary flex-1">
              Cancel
            </button>
            <button
              onClick={() => createMutation.mutate()}
              disabled={!formData.email || !formData.firstName || !formData.lastName || createMutation.isPending}
              className="btn btn-primary flex-1"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Admin'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// User Actions Modal
function UserActionsModal({ user, onClose }: { user: any; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [trialDays, setTrialDays] = useState(7);
  const [couponCode, setCouponCode] = useState('');

  const extendTrialMutation = useMutation({
    mutationFn: () => adminApi.extendTrial(user.id, trialDays),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      alert('Trial extended successfully');
    },
  });

  const applyCouponMutation = useMutation({
    mutationFn: () => adminApi.applyCouponToUser(user.id, couponCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      alert('Coupon applied successfully');
      setCouponCode('');
    },
  });

  const cancelSubscriptionMutation = useMutation({
    mutationFn: () => adminApi.cancelSubscription(user.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      alert('Subscription cancelled');
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-void border border-white/10 rounded-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl">User Actions</h3>
          <button onClick={onClose} className="text-paper/50 hover:text-paper">
            <X size={20} />
          </button>
        </div>

        <div className="mb-4 p-4 bg-white/[0.02] rounded">
          <div className="text-paper">{user.firstName} {user.lastName}</div>
          <div className="text-paper/50 text-sm">{user.email}</div>
        </div>

        <div className="space-y-6">
          {/* Extend Trial */}
          <div>
            <label className="block text-sm text-paper/50 mb-2">Extend Trial</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={trialDays}
                onChange={(e) => setTrialDays(parseInt(e.target.value))}
                className="input flex-1"
                min={1}
                max={365}
              />
              <button
                onClick={() => extendTrialMutation.mutate()}
                disabled={extendTrialMutation.isPending}
                className="btn btn-secondary"
              >
                {extendTrialMutation.isPending ? '...' : `+${trialDays} days`}
              </button>
            </div>
          </div>

          {/* Apply Coupon */}
          <div>
            <label className="block text-sm text-paper/50 mb-2">Apply Coupon</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="input flex-1"
                placeholder="COUPON_CODE"
              />
              <button
                onClick={() => applyCouponMutation.mutate()}
                disabled={!couponCode || applyCouponMutation.isPending}
                className="btn btn-secondary"
              >
                Apply
              </button>
            </div>
          </div>

          {/* Cancel Subscription */}
          <div className="pt-4 border-t border-white/10">
            <button
              onClick={() => {
                if (confirm('Are you sure you want to cancel this subscription?')) {
                  cancelSubscriptionMutation.mutate();
                }
              }}
              disabled={cancelSubscriptionMutation.isPending}
              className="btn bg-blood/20 text-blood hover:bg-blood/30 w-full"
            >
              Cancel Subscription
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Ticket Detail Modal
function TicketDetailModal({ ticketId, onClose }: { ticketId: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [reply, setReply] = useState('');

  const { data: ticket } = useQuery({
    queryKey: ['admin-ticket', ticketId],
    queryFn: () => adminApi.getTicket(ticketId).then(r => r.data),
  });

  const replyMutation = useMutation({
    mutationFn: () => adminApi.replyToTicket(ticketId, reply),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
      setReply('');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => adminApi.updateTicket(ticketId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
    },
  });

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-void border border-white/10 rounded-lg w-full max-w-2xl p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl">{ticket?.subject}</h3>
          <button onClick={onClose} className="text-paper/50 hover:text-paper">
            <X size={20} />
          </button>
        </div>

        <div className="mb-4 flex gap-2">
          <span className={`px-2 py-1 text-xs ${
            ticket?.status === 'OPEN' ? 'bg-yellow-500/20 text-yellow-400' :
            ticket?.status === 'IN_PROGRESS' ? 'bg-blue-500/20 text-blue-400' :
            'bg-green-500/20 text-green-400'
          }`}>
            {ticket?.status}
          </span>
          <span className={`px-2 py-1 text-xs ${
            ticket?.priority === 'HIGH' ? 'bg-blood/20 text-blood' :
            'bg-white/10 text-paper/50'
          }`}>
            {ticket?.priority}
          </span>
        </div>

        <div className="mb-4 p-4 bg-white/[0.02] rounded">
          <div className="text-paper/50 text-sm">From: {ticket?.user?.name} ({ticket?.user?.email})</div>
        </div>

        {/* Messages */}
        <div className="space-y-4 mb-6">
          {ticket?.messages?.map((msg: any) => (
            <div
              key={msg.id}
              className={`p-4 rounded ${
                msg.senderType === 'ADMIN' ? 'bg-gold/10 ml-8' : 'bg-white/[0.02] mr-8'
              }`}
            >
              <div className="text-paper/50 text-xs mb-2">
                {msg.senderType === 'ADMIN' ? 'Admin' : 'User'} - {new Date(msg.createdAt).toLocaleString()}
              </div>
              <div className="text-paper">{msg.content}</div>
            </div>
          ))}
        </div>

        {/* Reply */}
        <div className="space-y-4">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            className="input w-full h-24"
            placeholder="Type your reply..."
          />
          <div className="flex gap-2">
            <button
              onClick={() => replyMutation.mutate()}
              disabled={!reply || replyMutation.isPending}
              className="btn btn-primary flex items-center gap-2"
            >
              <Send size={16} />
              Send Reply
            </button>
            {ticket?.status !== 'RESOLVED' && (
              <button
                onClick={() => updateStatusMutation.mutate('RESOLVED')}
                className="btn btn-secondary"
              >
                Mark Resolved
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Create Voucher Modal
function CreateVoucherModal({ onClose, onCreated }: { onClose: () => void; onCreated?: () => void }) {
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [formData, setFormData] = useState({
    tier: 'FAMILY',
    billingCycle: 'yearly',
    durationMonths: 12,
    recipientEmail: '',
    recipientName: '',
    notes: '',
    sendEmail: false,
    quantity: 1,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [createdCodes, setCreatedCodes] = useState<string[]>([]);

  const PROMO_PRESETS = [
    { name: '1 Month Trial', tier: 'STARTER', billingCycle: 'monthly', durationMonths: 1 },
    { name: '3 Month Starter', tier: 'STARTER', billingCycle: 'monthly', durationMonths: 3 },
    { name: '1 Year Family', tier: 'FAMILY', billingCycle: 'yearly', durationMonths: 12 },
    { name: '1 Year Forever', tier: 'FOREVER', billingCycle: 'yearly', durationMonths: 12 },
    { name: 'Lifetime Forever', tier: 'FOREVER', billingCycle: 'yearly', durationMonths: 120 },
  ];

  const applyPreset = (preset: typeof PROMO_PRESETS[0]) => {
    setFormData({
      ...formData,
      tier: preset.tier,
      billingCycle: preset.billingCycle,
      durationMonths: preset.durationMonths,
    });
  };

  const handleCreate = async () => {
    setIsLoading(true);
    const codes: string[] = [];
    try {
      const token = localStorage.getItem('adminToken');
      const quantity = mode === 'bulk' ? formData.quantity : 1;
      
      for (let i = 0; i < quantity; i++) {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://api.heirloom.blue/api'}/gift-vouchers/admin/create`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            sendEmail: formData.sendEmail && formData.recipientEmail,
          }),
        });
        const data = await res.json();
        if (data.voucher?.code) {
          codes.push(data.voucher.code);
        }
      }
      
      if (codes.length > 0) {
        setCreatedCodes(codes);
        onCreated?.();
      } else {
        alert('Failed to create voucher(s)');
      }
    } catch {
      alert('Error creating voucher(s)');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="card max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl">Create Gift Voucher</h3>
          <button onClick={onClose} className="text-paper/50 hover:text-paper">
            <X size={20} />
          </button>
        </div>

        {createdCodes.length > 0 ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h4 className="text-lg mb-2">{createdCodes.length} Voucher{createdCodes.length > 1 ? 's' : ''} Created!</h4>
            <div className="bg-white/5 p-4 rounded mb-4 max-h-48 overflow-y-auto">
              {createdCodes.map((code, i) => (
                <p key={i} className="font-mono text-lg text-gold tracking-wider mb-1">{code}</p>
              ))}
            </div>
            <div className="flex gap-2 justify-center flex-wrap">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(createdCodes.join('\n'));
                  alert('All codes copied!');
                }}
                className="btn btn-secondary"
              >
                Copy All Codes
              </button>
              <button
                onClick={() => {
                  const urls = createdCodes.map(code => `https://heirloom.blue/gift/redeem?code=${code}`);
                  navigator.clipboard.writeText(urls.join('\n'));
                  alert('All redemption links copied!');
                }}
                className="btn btn-secondary"
              >
                Copy All Links
              </button>
              <button onClick={onClose} className="btn btn-primary">
                Done
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setMode('single')}
                className={`flex-1 py-2 px-4 rounded text-sm ${mode === 'single' ? 'bg-gold/20 text-gold' : 'bg-white/5 text-paper/50'}`}
              >
                Single Voucher
              </button>
              <button
                onClick={() => setMode('bulk')}
                className={`flex-1 py-2 px-4 rounded text-sm ${mode === 'bulk' ? 'bg-gold/20 text-gold' : 'bg-white/5 text-paper/50'}`}
              >
                Bulk Create
              </button>
            </div>

            <div>
              <label className="block text-paper/50 text-sm mb-2">Quick Presets</label>
              <div className="flex flex-wrap gap-2">
                {PROMO_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => applyPreset(preset)}
                    className="px-3 py-1 text-xs bg-white/5 hover:bg-gold/20 hover:text-gold rounded transition-colors"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-paper/50 text-sm mb-1">Tier</label>
                <select
                  value={formData.tier}
                  onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-paper"
                >
                  <option value="STARTER">Starter</option>
                  <option value="FAMILY">Family</option>
                  <option value="FOREVER">Forever</option>
                </select>
              </div>

              <div>
                <label className="block text-paper/50 text-sm mb-1">Billing Cycle</label>
                <select
                  value={formData.billingCycle}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    billingCycle: e.target.value,
                    durationMonths: e.target.value === 'yearly' ? 12 : 1
                  })}
                  className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-paper"
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-paper/50 text-sm mb-1">Duration (months)</label>
                <input
                  type="number"
                  value={formData.durationMonths}
                  onChange={(e) => setFormData({ ...formData, durationMonths: parseInt(e.target.value) || 1 })}
                  className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-paper"
                  min="1"
                  max="120"
                />
              </div>

              {mode === 'bulk' && (
                <div>
                  <label className="block text-paper/50 text-sm mb-1">Quantity</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Math.min(50, Math.max(1, parseInt(e.target.value) || 1)) })}
                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-paper"
                    min="1"
                    max="50"
                  />
                  <p className="text-paper/30 text-xs mt-1">Max 50 at a time</p>
                </div>
              )}
            </div>

            {mode === 'single' && (
              <>
                <div>
                  <label className="block text-paper/50 text-sm mb-1">Recipient Email (optional)</label>
                  <input
                    type="email"
                    value={formData.recipientEmail}
                    onChange={(e) => setFormData({ ...formData, recipientEmail: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-paper"
                    placeholder="recipient@example.com"
                  />
                </div>

                <div>
                  <label className="block text-paper/50 text-sm mb-1">Recipient Name (optional)</label>
                  <input
                    type="text"
                    value={formData.recipientName}
                    onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-paper"
                    placeholder="John Doe"
                  />
                </div>

                {formData.recipientEmail && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.sendEmail}
                      onChange={(e) => setFormData({ ...formData, sendEmail: e.target.checked })}
                      className="w-4 h-4 rounded border-white/20 bg-white/5"
                    />
                    <span className="text-paper/70 text-sm">Send gift email to recipient immediately</span>
                  </label>
                )}
              </>
            )}

            <div>
              <label className="block text-paper/50 text-sm mb-1">Admin Notes (optional)</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-paper"
                rows={2}
                placeholder="e.g., Promotional campaign, influencer gift, etc."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button onClick={onClose} className="btn btn-secondary flex-1">
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={isLoading}
                className="btn btn-primary flex-1"
              >
                {isLoading ? 'Creating...' : mode === 'bulk' ? `Create ${formData.quantity} Vouchers` : 'Create Voucher'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
