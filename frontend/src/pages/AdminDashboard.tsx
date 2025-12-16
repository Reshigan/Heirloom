import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, CreditCard, BarChart3, Tag, LogOut, Plus, Trash2, 
  DollarSign, Activity, Search, X
} from 'lucide-react';
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
  const [userSearch, setUserSearch] = useState('');

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

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  if (!admin) return null;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'coupons', label: 'Coupons', icon: Tag },
    { id: 'users', label: 'Users', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-void">
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
        <div className="flex gap-2 mb-8">
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
              <div className="grid grid-cols-3 gap-4">
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
      </div>

      {/* Create Coupon Modal */}
      {showCouponModal && (
        <CreateCouponModal onClose={() => setShowCouponModal(false)} />
      )}
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
