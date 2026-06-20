import { useState, useEffect, useRef, useId } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../services/api';
import { MarketingTab } from './MarketingTab';
import { SocialCalendarTab } from './SocialCalendarTab';
import { AppFrame } from '../loom/components/AppFrame';
import { CosmicHeader, SectionLabel, WaxSeal } from '../loom/cosmic/CosmicUI';
import { PLAN_PRICE } from '../lib/plans';
import { copyToClipboard } from '../utils/clipboard';
import { useFocusTrap } from '../lib/useFocusTrap';
import { useInlineStatus, InlineStatus } from '../loom/components/InlineStatus';

// Admin auth check
const useAdminAuth = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('adminToken');
  const adminUser = localStorage.getItem('adminUser');

  let parsed: any = null;
  let parseError = false;
  if (adminUser) {
    try {
      parsed = JSON.parse(adminUser);
    } catch {
      parseError = true;
    }
  }

  useEffect(() => {
    if (!token || !adminUser || parseError) {
      navigate('/admin/login');
    }
  }, [token, adminUser, parseError, navigate]);

  if (!adminUser || parseError) return null;
  return parsed;
};


export function AdminDashboard() {
  const navigate = useNavigate();
  const admin = useAdminAuth();
  const [activeTab, setActiveTab] = useState('overview');
  // Legacy sub-navigation — quarantines the speculative/auxiliary features
  type LegacySub = 'marketing' | 'social' | 'coupons' | 'vouchers' | 'gold-legacy' | 'reports' | 'usage' | 'emails' | 'admins' | 'audit';
  const [legacySub, setLegacySub] = useState<LegacySub>('marketing');
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const status = useInlineStatus();
  const resendInProgress = useRef<Record<string, boolean>>({});

  // Queries
  const { data: overview } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: () => adminApi.getAnalyticsOverview().then(r => r.data),
    enabled: !!localStorage.getItem('adminToken'),
  });

  const { data: revenue } = useQuery({
    queryKey: ['admin-revenue'],
    queryFn: () => adminApi.getAnalyticsRevenue().then(r => r.data),
    enabled: !!localStorage.getItem('adminToken'),
  });

  const { data: userAnalytics } = useQuery({
    queryKey: ['admin-user-analytics'],
    queryFn: () => adminApi.getAnalyticsUsers().then(r => r.data),
    enabled: !!localStorage.getItem('adminToken'),
  });

  const { data: coupons } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: () => adminApi.getCoupons().then(r => r.data),
    enabled: activeTab === 'legacy' && legacySub === 'coupons',
  });

  const { data: users } = useQuery({
    queryKey: ['admin-users', userSearch],
    queryFn: () => adminApi.getUsers({ search: userSearch, limit: 20 }).then(r => r.data),
    enabled: activeTab === 'users',
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
    enabled: activeTab === 'legacy' && legacySub === 'audit',
  });

  const { data: adminUsers } = useQuery({
    queryKey: ['admin-admin-users'],
    queryFn: () => adminApi.getAdminUsers().then(r => r.data),
    enabled: activeTab === 'legacy' && legacySub === 'admins',
  });

  const { data: emailLogs } = useQuery({
    queryKey: ['admin-email-logs'],
    queryFn: () => adminApi.getEmailLogs({ limit: 50 }).then(r => r.data),
    enabled: activeTab === 'legacy' && legacySub === 'emails',
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
    enabled: activeTab === 'legacy' && legacySub === 'reports',
  });

    const { data: userGrowth } = useQuery({
      queryKey: ['admin-user-growth'],
      queryFn: () => adminApi.getUserGrowthReport().then(r => r.data),
      enabled: activeTab === 'legacy' && legacySub === 'reports',
    });

    const { data: giftVouchers, refetch: refetchVouchers } = useQuery({
      queryKey: ['admin-gift-vouchers'],
      queryFn: async () => {
        const token = localStorage.getItem('adminToken');
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://api.heirloom.blue/api'}/gift-vouchers/admin/all`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      },
      enabled: activeTab === 'legacy' && legacySub === 'vouchers',
    });

    const { data: voucherStats } = useQuery({
      queryKey: ['admin-voucher-stats'],
      queryFn: async () => {
        const token = localStorage.getItem('adminToken');
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://api.heirloom.blue/api'}/gift-vouchers/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      },
      enabled: activeTab === 'legacy' && legacySub === 'vouchers',
    });

    const { data: goldLegacyVouchers, refetch: refetchGoldLegacy } = useQuery({
      queryKey: ['admin-gold-legacy-vouchers'],
      queryFn: async () => {
        const token = localStorage.getItem('adminToken');
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://api.heirloom.blue/api'}/gift-vouchers/admin/gold-legacy/all`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      },
      enabled: activeTab === 'legacy' && legacySub === 'gold-legacy',
    });

    const { data: usageAnalytics } = useQuery({
      queryKey: ['admin-usage-analytics'],
      queryFn: () => adminApi.getUsageAnalytics().then(r => r.data),
      enabled: activeTab === 'legacy' && legacySub === 'usage',
      refetchInterval: 60000,
    });

    const { data: encryptionStats } = useQuery({
      queryKey: ['admin-encryption-stats'],
      queryFn: () => adminApi.getEncryptionStats().then(r => r.data),
      enabled: activeTab === 'encryption',
      refetchInterval: 60000,
    });

    const [showVoucherModal, setShowVoucherModal] = useState(false);
    const [showGoldLegacyModal, setShowGoldLegacyModal] = useState(false);

    const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  if (!admin) return null;

    // Primary tabs — what the system is today
    const tabs = [
      { id: 'overview', label: 'Overview' },
      { id: 'users', label: 'Users' },
      { id: 'support', label: 'Support' },
      { id: 'billing', label: 'Billing' },
      { id: 'encryption', label: 'Encryption' },
      { id: 'system', label: 'System' },
      { id: 'legacy', label: 'Legacy' },
    ];

    // Legacy sub-nav — relocated speculative/auxiliary features
    const legacyTabs: { id: LegacySub; label: string }[] = [
      { id: 'marketing', label: 'Marketing' },
      { id: 'social', label: 'Social' },
      { id: 'coupons', label: 'Coupons' },
      { id: 'vouchers', label: 'Gift Vouchers' },
      { id: 'gold-legacy', label: 'Gold Legacy' },
      { id: 'reports', label: 'Reports' },
      { id: 'usage', label: 'Usage' },
      { id: 'emails', label: 'Emails' },
      { id: 'admins', label: 'Admins' },
      { id: 'audit', label: 'Audit Logs' },
    ];

  const activeSection =
    activeTab === 'legacy'
      ? `legacy · ${legacyTabs.find(t => t.id === legacySub)?.label.toLowerCase() ?? legacySub}`
      : tabs.find(t => t.id === activeTab)?.label.toLowerCase() ?? activeTab;

  return (
    <AppFrame width="wide">
      {/* Admin topbar — "admin · {section}" + encryption-at-rest assurance */}
      <AdminBar section={activeSection} email={admin.email} role={admin.role} onLogout={handleLogout} />

      {/* Giant serif console title — the LABEL-VALUE page head; eyebrow carries live counts */}
      <CosmicHeader
        eyebrow={
          overview?.users?.total != null
            ? `${overview.users.total.toLocaleString()} ACCOUNTS · ${(revenue?.mrr != null ? `MRR $${revenue.mrr.toFixed(2)}` : 'THE LOOM-KEEPER’S CONSOLE')}`
            : 'THE LOOM-KEEPER’S CONSOLE'
        }
        title="Admin"
        sub="Operations, members, and the ledger’s reverse. Entry content is encrypted at rest; we never read prose as a matter of policy."
      />

      {/* Tab strip — lowercase mono section nav */}
      <nav style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--rule)', marginBottom: 36, overflowX: 'auto', paddingBottom: 0 }}>
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            aria-current={activeTab === id ? 'page' : undefined}
            style={{
              background: 'transparent', border: 0, borderBottom: '1px solid',
              borderColor: activeTab === id ? 'var(--warm)' : 'transparent',
              padding: '0 16px 12px', marginBottom: -1, cursor: 'pointer',
              fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 400,
              letterSpacing: '0.18em', textTransform: 'lowercase',
              color: activeTab === id ? 'var(--warm)' : 'var(--bone-faint)',
              whiteSpace: 'nowrap',
              transition: 'color 180ms var(--loom-ease)',
            }}
          >
            {label.toLowerCase()}
          </button>
        ))}
      </nav>

      <InlineStatus status={status} />

      <div>

        {/* ── Legacy sub-nav — quarantined speculative/auxiliary features ── */}
        {activeTab === 'legacy' && (
          <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--rule)', marginBottom: 40, overflowX: 'auto' }}>
            {legacyTabs.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setLegacySub(id)}
                aria-current={legacySub === id ? 'page' : undefined}
                style={{
                  background: 'transparent', border: 0, cursor: 'pointer', padding: '12px 18px',
                  fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'lowercase',
                  color: legacySub === id ? 'var(--bone)' : 'var(--bone-faint)',
                  borderBottom: legacySub === id ? '1px solid var(--warm)' : '1px solid transparent',
                  marginBottom: -1, whiteSpace: 'nowrap',
                  transition: 'color 180ms var(--loom-ease)',
                }}
              >
                {label.toLowerCase()}
              </button>
            ))}
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 1, border: '1px solid var(--rule)' }}>
              <StatCard label="Total Users" value={overview?.users?.total || 0} subtext={`+${overview?.users?.recentSignups || 0} this week`} />
              <StatCard label="Active Subscriptions" value={overview?.users?.active || 0} subtext={`${overview?.users?.trialing || 0} trialing`} />
              <StatCard label="Est. MRR" value={`$${revenue?.mrr?.toFixed(2) || '0.00'}`} subtext={`${revenue?.activeSubscriptions || 0} paying`} />
              <StatCard label="Total Content" value={(overview?.content?.memories || 0) + (overview?.content?.letters || 0) + (overview?.content?.voiceRecordings || 0)} subtext={`${overview?.content?.memories || 0} memories`} />
            </div>

            {/* Subscription Breakdown */}
            <Panel title="Subscription Breakdown">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 1, border: '1px solid var(--rule)' }}>
                {[
                  // Tier names mirror PLAN_DISPLAY (free/family/founder) in lib/plans.ts.
                  // No prices here — live amounts are localized (ZAR) and owned by the
                  // pricing source, never duplicated as static literals in admin chrome.
                  { key: 'starter', label: 'Free', altKeys: ['free'] },
                  { key: 'family', label: 'Family' },
                  { key: 'forever', label: 'Founder' },
                ].map(({ key, label, altKeys }) => (
                  <div key={key} style={{ padding: '20px 24px', background: 'var(--ink-card)' }}>
                    <div className="loom-h2" style={{ fontSize: 28, fontWeight: 300, color: 'var(--bone)', marginBottom: 4 }}>
                      {overview?.subscriptions?.[key]
                        ?? overview?.subscriptions?.[key.toUpperCase()]
                        ?? (altKeys ?? []).reduce<number | undefined>((acc, ak) => acc ?? overview?.subscriptions?.[ak] ?? overview?.subscriptions?.[ak.toUpperCase()], undefined)
                        ?? 0}
                    </div>
                    <div className="loom-eyebrow">{label}</div>
                  </div>
                ))}
              </div>
            </Panel>

            {/* User Activity */}
            <Panel title="User Activity">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 1, border: '1px solid var(--rule)' }}>
                {[
                  { v: userAnalytics?.signupsLast30Days || 0, l: 'Signups · 30d' },
                  { v: userAnalytics?.signupsLast7Days || 0, l: 'Signups · 7d' },
                  { v: userAnalytics?.activeUsersLast7Days || 0, l: 'Active · 7d' },
                  { v: userAnalytics?.usersWithContent || 0, l: 'With Content' },
                ].map(({ v, l }) => (
                  <div key={l} style={{ padding: '20px 24px', background: 'var(--ink-card)' }}>
                    <div className="loom-h2" style={{ fontSize: 28, fontWeight: 300, color: 'var(--bone)', marginBottom: 4 }}>{v}</div>
                    <div className="loom-eyebrow">{l}</div>
                  </div>
                ))}
              </div>
            </Panel>

            {/* Revenue Stats */}
            <Panel title="Revenue & Discounts">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 1, border: '1px solid var(--rule)' }}>
                <div style={{ padding: '20px 24px', background: 'var(--ink-card)' }}>
                  <div className="loom-h2" style={{ fontSize: 28, fontWeight: 300, color: 'var(--bone)', marginBottom: 4 }}>${revenue?.mrr?.toFixed(2) || '0.00'}</div>
                  <div className="loom-eyebrow">Monthly Recurring Revenue</div>
                </div>
                <div style={{ padding: '20px 24px', background: 'var(--ink-card)' }}>
                  <div className="loom-h2" style={{ fontSize: 28, fontWeight: 300, color: 'var(--bone)', marginBottom: 4 }}>${revenue?.totalDiscountsLast30Days?.toFixed(2) || '0.00'}</div>
                  <div className="loom-eyebrow">Discounts Given · 30d</div>
                </div>
              </div>
            </Panel>
          </div>
        )}

        {/* Usage Analytics Tab */}
        {activeTab === 'legacy' && legacySub === 'usage' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <SectionLabel>Usage Analytics</SectionLabel>

            {/* Engagement Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 1, border: '1px solid var(--rule)' }}>
              {[
                { v: usageAnalytics?.engagement?.totalUsers || 0, l: 'Total Users', accent: true },
                { v: usageAnalytics?.engagement?.activeToday || 0, l: 'Active Today', accent: true },
                { v: usageAnalytics?.engagement?.active7d || 0, l: 'Active · 7d', accent: false },
                { v: usageAnalytics?.engagement?.active30d || 0, l: 'Active · 30d', accent: false },
                { v: usageAnalytics?.engagement?.dormant || 0, l: 'Dormant', danger: true },
              ].map(({ v, l, accent, danger }: any) => (
                <div key={l} style={{ padding: '20px 24px', background: 'var(--ink-card)' }}>
                  <div className="loom-h2" style={{ fontSize: 28, fontWeight: 300, color: (danger || accent) ? 'var(--warm)' : 'var(--bone)', marginBottom: 4 }}>{v}</div>
                  <div className="loom-eyebrow">{l}</div>
                </div>
              ))}
            </div>

            {/* User Funnel */}
            <Panel title="User Funnel">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: 'Registered', value: usageAnalytics?.funnel?.registered || 0 },
                  { label: 'Email Verified', value: usageAnalytics?.funnel?.verified || 0 },
                  { label: 'Subscribed', value: usageAnalytics?.funnel?.subscribed || 0 },
                  { label: 'Created Memory', value: usageAnalytics?.funnel?.createdMemory || 0 },
                  { label: 'Added Family', value: usageAnalytics?.funnel?.addedFamily || 0 },
                  { label: 'Added Legacy Contact', value: usageAnalytics?.funnel?.addedLegacyContact || 0 },
                ].map((step, i) => {
                  const maxValue = usageAnalytics?.funnel?.registered || 1;
                  const percentage = Math.round((step.value / maxValue) * 100);
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div className="loom-mono" style={{ width: 160, fontSize: 11, color: 'var(--bone-dim)' }}>{step.label}</div>
                      <div style={{ flex: 1, height: 4, background: 'var(--rule)', position: 'relative' }}>
                        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${percentage}%`, background: 'var(--bone-dim)', transition: 'width 360ms var(--loom-ease)' }} />
                      </div>
                      <div className="loom-mono" style={{ width: 80, textAlign: 'right', fontSize: 11 }}>
                        <span style={{ color: 'var(--bone)' }}>{step.value}</span>
                        <span style={{ color: 'var(--bone-faint)', marginLeft: 4 }}>({percentage}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Panel>

            {/* Content Engagement */}
            <Panel title="Content Engagement">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 1, border: '1px solid var(--rule)' }}>
                {[
                  { v: usageAnalytics?.contentEngagement?.usersWithContent || 0, l: 'With Content', sub: `${Math.round(((usageAnalytics?.contentEngagement?.usersWithContent || 0) / (usageAnalytics?.contentEngagement?.totalUsers || 1)) * 100)}% of users` },
                  { v: usageAnalytics?.contentEngagement?.usersWithMemories || 0, l: 'With Memories', sub: '' },
                  { v: usageAnalytics?.contentEngagement?.usersWithLetters || 0, l: 'With Letters', sub: '' },
                  { v: usageAnalytics?.contentEngagement?.usersWithVoice || 0, l: 'With Voice', sub: '' },
                ].map(({ v, l, sub }) => (
                  <div key={l} style={{ padding: '20px 24px', background: 'var(--ink-card)' }}>
                    <div className="loom-h2" style={{ fontSize: 28, fontWeight: 300, color: 'var(--bone)', marginBottom: 4 }}>{v}</div>
                    <div className="loom-eyebrow">{l}</div>
                    {sub && <div className="loom-mono" style={{ fontSize: 10, color: 'var(--bone-faint)', marginTop: 4 }}>{sub}</div>}
                  </div>
                ))}
              </div>
            </Panel>

            {/* Activity by Hour */}
            <Panel title="Activity by Hour of Day · Last 30 Days">
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 96 }}>
                {Array.from({ length: 24 }, (_, hour) => {
                  const data = usageAnalytics?.activityByHour?.find((h: any) => h.hour === hour);
                  const count = data?.logins || 0;
                  const maxLogins = Math.max(...(usageAnalytics?.activityByHour?.map((h: any) => h.logins) || [1]));
                  const height = maxLogins > 0 ? (count / maxLogins) * 100 : 0;
                  return (
                    <div key={hour} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: '100%', height: `${Math.max(height, 2)}%`, background: 'var(--bone-dim)' }} title={`${hour}:00 — ${count} logins`} />
                      {hour % 4 === 0 && <div className="loom-mono" style={{ fontSize: 9, color: 'var(--bone-faint)', marginTop: 4 }}>{hour}h</div>}
                    </div>
                  );
                })}
              </div>
              <div className="loom-mono" style={{ fontSize: 10, color: 'var(--bone-faint)', marginTop: 8, textAlign: 'center' }}>Hour of day (UTC)</div>
            </Panel>

            {/* Activity by Day */}
            <Panel title="Activity by Day of Week · Last 30 Days">
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 96 }}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => {
                  const data = usageAnalytics?.activityByDay?.find((d: any) => d.dayNum === i);
                  const count = data?.logins || 0;
                  const maxLogins = Math.max(...(usageAnalytics?.activityByDay?.map((d: any) => d.logins) || [1]));
                  const height = maxLogins > 0 ? (count / maxLogins) * 100 : 0;
                  return (
                    <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: '100%', height: `${Math.max(height, 5)}%`, background: 'var(--bone-dim)' }} title={`${day} — ${count} logins`} />
                      <div className="loom-mono" style={{ fontSize: 10, color: 'var(--bone-faint)', marginTop: 6 }}>{day}</div>
                    </div>
                  );
                })}
              </div>
            </Panel>

            {/* Dead Man Switch */}
            <Panel title="Succession Switch Status">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 1, border: '1px solid var(--rule)', marginBottom: 16 }}>
                <div style={{ padding: '20px 24px', background: 'var(--ink-card)' }}>
                  <div className="loom-h2" style={{ fontSize: 28, fontWeight: 300, color: 'var(--bone)', marginBottom: 4 }}>{usageAnalytics?.reminderStatus?.activeSwitches || 0}</div>
                  <div className="loom-eyebrow">Active</div>
                </div>
                <div style={{ padding: '20px 24px', background: 'var(--ink-card)' }}>
                  <div className="loom-h2" style={{ fontSize: 28, fontWeight: 300, color: 'var(--bone)', marginBottom: 4 }}>{usageAnalytics?.reminderStatus?.warningSwitches || 0}</div>
                  <div className="loom-eyebrow">Warning</div>
                </div>
                <div style={{ padding: '20px 24px', background: 'var(--ink-card)' }}>
                  <div className="loom-h2" style={{ fontSize: 28, fontWeight: 300, color: 'var(--bone)', marginBottom: 4 }}>{usageAnalytics?.reminderStatus?.triggeredSwitches || 0}</div>
                  <div className="loom-eyebrow">Triggered</div>
                </div>
              </div>
              <p className="loom-body" style={{ fontSize: 13, color: 'var(--bone-faint)' }}>
                Reminder emails are sent via scheduled cron jobs. Ensure CRON_ENABLED=true in the worker environment.
              </p>
            </Panel>

            {/* Recent Sessions */}
            <Panel title="Recent User Sessions">
              <div style={{ overflowX: 'auto' }}>
                <LedgerTable
                  cols={['User', 'Email', 'Tier', 'Memories', 'Letters', 'Last Login']}
                  empty="No recent sessions"
                >
                  {usageAnalytics?.recentSessions?.map((session: any) => (
                    <tr key={session.id} style={{ borderBottom: '1px solid var(--rule)' }}>
                      <td style={tdStyle}>{session.name}</td>
                      <td style={{ ...tdStyle, color: 'var(--bone-dim)' }}>{session.email}</td>
                      <td style={tdStyle}><StatusWord value={session.tier} /></td>
                      <td className="loom-mono" style={{ ...tdStyle, color: 'var(--bone-dim)' }}>{session.memoryCount}</td>
                      <td className="loom-mono" style={{ ...tdStyle, color: 'var(--bone-dim)' }}>{session.letterCount}</td>
                      <td className="loom-mono" style={{ ...tdStyle, fontSize: 11, color: 'var(--bone-faint)' }}>{session.lastLogin ? new Date(session.lastLogin).toLocaleString() : 'Never'}</td>
                    </tr>
                  ))}
                </LedgerTable>
              </div>
            </Panel>
          </div>
        )}

        {/* Encryption Tab */}
        {activeTab === 'encryption' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <SectionLabel>Encryption Adoption</SectionLabel>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 1, border: '1px solid var(--rule)' }}>
              <div style={{ padding: '20px 24px', background: 'var(--ink-card)' }}>
                <div className="loom-h2" style={{ fontSize: 28, fontWeight: 300, color: 'var(--bone)', marginBottom: 4 }}>{encryptionStats?.encryptedUsers || 0}</div>
                <div className="loom-eyebrow">Users with Encryption</div>
                <div className="loom-mono" style={{ fontSize: 10, color: 'var(--bone-faint)', marginTop: 4 }}>{encryptionStats?.adoptionRate || 0}% adoption</div>
              </div>
              <div style={{ padding: '20px 24px', background: 'var(--ink-card)' }}>
                <div className="loom-h2" style={{ fontSize: 28, fontWeight: 300, color: 'var(--bone)', marginBottom: 4 }}>{encryptionStats?.escrowConfigured || 0}</div>
                <div className="loom-eyebrow">Key Escrow Configured</div>
              </div>
              <div style={{ padding: '20px 24px', background: 'var(--ink-card)' }}>
                <div className="loom-h2" style={{ fontSize: 28, fontWeight: 300, color: 'var(--bone-dim)', marginBottom: 4 }}>{encryptionStats?.shamirConfigured || 0}</div>
                <div className="loom-eyebrow">Shamir Shares Active</div>
              </div>
              <div style={{ padding: '20px 24px', background: 'var(--ink-card)' }}>
                <div className="loom-h2" style={{ fontSize: 28, fontWeight: 300, color: 'var(--bone-dim)', marginBottom: 4 }}>{encryptionStats?.recentSetups || 0}</div>
                <div className="loom-eyebrow">New Setups · 30d</div>
              </div>
            </div>

            <Panel title="Adoption Progress">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { label: 'Total Users', value: encryptionStats?.totalUsers || 0, pct: 100 },
                  { label: 'Encryption Enabled', value: encryptionStats?.encryptedUsers || 0, pct: encryptionStats?.adoptionRate || 0 },
                  { label: 'Key Escrow Setup', value: encryptionStats?.escrowConfigured || 0, pct: encryptionStats?.totalUsers ? Math.round((encryptionStats.escrowConfigured / encryptionStats.totalUsers) * 100) : 0 },
                ].map(({ label, value, pct }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div className="loom-mono" style={{ width: 160, fontSize: 11, color: 'var(--bone-dim)' }}>{label}</div>
                    <div style={{ flex: 1, height: 4, background: 'var(--rule)', position: 'relative' }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${pct}%`, background: 'var(--bone-dim)', transition: 'width 360ms var(--loom-ease)' }} />
                    </div>
                    <div className="loom-mono" style={{ width: 80, textAlign: 'right', fontSize: 11 }}>
                      <span style={{ color: 'var(--bone)' }}>{value}</span>
                      <span style={{ color: 'var(--bone-faint)', marginLeft: 4 }}>({pct}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Encrypted Content">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 1, border: '1px solid var(--rule)' }}>
                <div style={{ padding: '20px 24px', background: 'var(--ink-card)' }}>
                  <div className="loom-h2" style={{ fontSize: 28, fontWeight: 300, color: 'var(--bone)', marginBottom: 4 }}>{encryptionStats?.encryptedContent?.letters || 0}</div>
                  <div className="loom-eyebrow">Encrypted Letters</div>
                </div>
                <div style={{ padding: '20px 24px', background: 'var(--ink-card)' }}>
                  <div className="loom-h2" style={{ fontSize: 28, fontWeight: 300, color: 'var(--bone)', marginBottom: 4 }}>{encryptionStats?.encryptedContent?.memories || 0}</div>
                  <div className="loom-eyebrow">Encrypted Memories</div>
                </div>
              </div>
            </Panel>

            <Panel title="Key Escrow Types">
              {encryptionStats?.escrowTypes && encryptionStats.escrowTypes.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 1, border: '1px solid var(--rule)' }}>
                  {encryptionStats.escrowTypes.map((type: { escrow_type: string; count: number }) => (
                    <div key={type.escrow_type} style={{ padding: '20px 24px', background: 'var(--ink-card)' }}>
                      <div className="loom-h2" style={{ fontSize: 28, fontWeight: 300, color: 'var(--bone)', marginBottom: 4 }}>{type.count}</div>
                      <div className="loom-eyebrow">{type.escrow_type.replace(/_/g, ' ').toLowerCase()}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="loom-body" style={{ fontSize: 13, color: 'var(--bone-faint)' }}>No escrow configurations yet</p>
              )}
            </Panel>

            <Panel>
              <p className="loom-eyebrow" style={{ color: 'var(--bone-dim)', marginBottom: 12 }}>Encryption Architecture</p>
              <p className="loom-body" style={{ fontSize: 14, color: 'var(--bone-dim)', marginBottom: 12 }}>
                Heirloom encrypts entry content at rest with server-side AES-256-GCM. This is not zero-knowledge or end-to-end: the platform holds the keys, so a family never loses its archive to a forgotten password.
              </p>
              <ul style={{ margin: 0, padding: '0 0 0 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[
                  'Entry content is encrypted at rest with AES-256-GCM',
                  'Keys are held server-side under operational controls — we never read prose as a matter of policy',
                  'Access is gated by account and thread membership, not by a client-held key',
                  'Account access is recovered the ordinary way, by password',
                ].map((item) => (
                  <li key={item} className="loom-mono" style={{ fontSize: 11, color: 'var(--bone-faint)' }}>{item}</li>
                ))}
              </ul>
            </Panel>
          </div>
        )}

        {/* Marketing Tab */}
        {activeTab === 'legacy' && legacySub === 'marketing' && <MarketingTab />}

        {/* Coupons Tab */}
        {activeTab === 'legacy' && legacySub === 'coupons' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p className="loom-eyebrow" style={{ color: 'var(--copper-label)' }}>Coupon Management</p>
              <button className="loom-btn" onClick={() => setShowCouponModal(true)}>Create Coupon</button>
            </div>
            <Panel>
              <LedgerTable cols={['Code', 'Discount', 'Uses', 'Valid Until', 'Status', 'Actions']} empty="No coupons created yet">
                {coupons?.map((coupon: any) => <CouponRow key={coupon.id} coupon={coupon} />)}
              </LedgerTable>
            </Panel>
          </div>
        )}

        {/* Gift Vouchers Tab */}
        {activeTab === 'legacy' && legacySub === 'vouchers' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p className="loom-eyebrow" style={{ color: 'var(--copper-label)' }}>Gift Voucher Management</p>
              <button className="loom-btn" onClick={() => setShowVoucherModal(true)}>Create Voucher</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 1, border: '1px solid var(--rule)' }}>
              {[
                { v: voucherStats?.stats?.total || 0, l: 'Total', accent: true },
                { v: voucherStats?.stats?.sent || 0, l: 'Sent', accent: false },
                { v: voucherStats?.stats?.redeemed || 0, l: 'Redeemed', accent: true },
                { v: `$${((voucherStats?.stats?.total_revenue || 0) / 100).toFixed(2)}`, l: 'Revenue', accent: true },
              ].map(({ v, l, accent }) => (
                <div key={l} style={{ padding: '20px 24px', background: 'var(--ink-card)' }}>
                  <div className="loom-h2" style={{ fontSize: 28, fontWeight: 300, color: accent ? 'var(--warm)' : 'var(--bone)', marginBottom: 4 }}>{v}</div>
                  <div className="loom-eyebrow">{l}</div>
                </div>
              ))}
            </div>

            <Panel>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <p className="loom-eyebrow">All Vouchers</p>
                <button className="loom-btn-ghost" onClick={() => refetchVouchers()}>Refresh</button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <LedgerTable cols={['Code', 'Tier', 'Purchaser', 'Recipient', 'Status', 'Created', 'Actions']} empty="No gift vouchers created yet">
                  {giftVouchers?.vouchers?.map((voucher: any) => (
                    <tr key={voucher.id} style={{ borderBottom: '1px solid var(--rule)' }}>
                      <td style={tdStyle}>
                        <span className="loom-mono" style={{ color: 'var(--warm)', fontSize: 12 }}>{voucher.code}</span>
                        {' '}
                        <button className="loom-btn-ghost" style={{ fontSize: 10, padding: '1px 6px' }} onClick={() => copyToClipboard(voucher.code).then(() => status.ok('code copied')).catch(() => status.err('copy failed'))}>copy</button>
                      </td>
                      <td style={tdStyle}><StatusWord value={voucher.tier} /></td>
                      <td className="loom-mono" style={{ ...tdStyle, fontSize: 11, color: 'var(--bone-dim)' }}>{voucher.purchaser_email}</td>
                      <td className="loom-mono" style={{ ...tdStyle, fontSize: 11, color: 'var(--bone-dim)' }}>{voucher.recipient_email || '—'}</td>
                      <td style={tdStyle}><StatusWord value={voucher.status} /></td>
                      <td className="loom-mono" style={{ ...tdStyle, fontSize: 11, color: 'var(--bone-faint)' }}>{new Date(voucher.created_at).toLocaleDateString()}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                          {voucher.status === 'PAID' && voucher.recipient_email && (
                            <button className="loom-btn-ghost" style={{ fontSize: 11 }} onClick={async () => {
                              if (resendInProgress.current[voucher.id]) return;
                              resendInProgress.current[voucher.id] = true;
                              try {
                                const token = localStorage.getItem('adminToken');
                                await fetch(`${import.meta.env.VITE_API_URL || 'https://api.heirloom.blue/api'}/gift-vouchers/admin/${voucher.id}/resend`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
                                status.ok('voucher resent');
                              } finally {
                                resendInProgress.current[voucher.id] = false;
                              }
                            }}>Resend</button>
                          )}
                          <button className="loom-btn-ghost" style={{ fontSize: 11 }} onClick={() => copyToClipboard(`${window.location.origin}/gift/redeem?code=${voucher.code}`).then(() => status.ok('redeem link copied')).catch(() => status.err('copy failed'))}>Link</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </LedgerTable>
              </div>
            </Panel>
          </div>
        )}

        {/* Gold Legacy Tab */}
        {activeTab === 'legacy' && legacySub === 'gold-legacy' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p className="loom-eyebrow" style={{ color: 'var(--warm)', marginBottom: 4 }}>Gold Legacy Circle</p>
                <p className="loom-mono" style={{ fontSize: 11, color: 'var(--bone-faint)' }}>Exclusive lifetime access vouchers for VIP members</p>
              </div>
              <button className="loom-btn" onClick={() => setShowGoldLegacyModal(true)}>Create Gold Legacy Voucher</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 1, border: '1px solid var(--gold-20)' }}>
              {[
                { v: goldLegacyVouchers?.total || 0, l: 'Total Gold Legacy' },
                { v: goldLegacyVouchers?.vouchers?.filter((v: any) => v.status === 'REDEEMED').length || 0, l: 'Redeemed' },
                { v: goldLegacyVouchers?.vouchers?.filter((v: any) => v.status === 'SENT' || v.status === 'PAID').length || 0, l: 'Pending' },
              ].map(({ v, l }) => (
                <div key={l} style={{ padding: '20px 24px', background: 'var(--ink-card)' }}>
                  <div className="loom-h2" style={{ fontSize: 28, fontWeight: 300, color: 'var(--warm)', marginBottom: 4 }}>{v}</div>
                  <div className="loom-eyebrow">{l}</div>
                </div>
              ))}
            </div>

            <Panel>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <p className="loom-eyebrow" style={{ color: 'var(--warm)' }}>Gold Legacy Members</p>
                <button className="loom-btn-ghost" onClick={() => refetchGoldLegacy()}>Refresh</button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <LedgerTable cols={['Member #', 'Code', 'Recipient', 'Status', 'Created', 'Actions']} empty="No Gold Legacy vouchers created yet">
                  {goldLegacyVouchers?.vouchers?.map((voucher: any) => (
                    <tr key={voucher.id} style={{ borderBottom: '1px solid var(--rule)' }}>
                      <td className="loom-mono" style={{ ...tdStyle, color: 'var(--warm)', fontSize: 12 }}>{voucher.gold_member_number || '—'}</td>
                      <td style={tdStyle}>
                        <span className="loom-mono" style={{ fontSize: 11, color: 'var(--bone-dim)' }}>{voucher.code}</span>
                        {' '}
                        <button className="loom-btn-ghost" style={{ fontSize: 10, padding: '1px 6px' }} onClick={() => copyToClipboard(voucher.code).then(() => status.ok('code copied')).catch(() => status.err('copy failed'))}>copy</button>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ color: 'var(--bone)' }}>{voucher.recipient_name || '—'}</div>
                        <div className="loom-mono" style={{ fontSize: 11, color: 'var(--bone-faint)' }}>{voucher.recipient_email || '—'}</div>
                      </td>
                      <td style={tdStyle}><StatusWord value={voucher.status} /></td>
                      <td className="loom-mono" style={{ ...tdStyle, fontSize: 11, color: 'var(--bone-faint)' }}>{new Date(voucher.created_at).toLocaleDateString()}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        <button className="loom-btn-ghost" style={{ fontSize: 11 }} onClick={() => copyToClipboard(`${window.location.origin}/gold/redeem?code=${voucher.code}`).then(() => status.ok('redeem link copied')).catch(() => status.err('copy failed'))}>Link</button>
                      </td>
                    </tr>
                  ))}
                </LedgerTable>
              </div>
            </Panel>
          </div>
        )}

        {/* Billing Tab */}
        {activeTab === 'billing' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p className="loom-eyebrow" style={{ color: 'var(--copper-label)' }}>Billing Analysis & Error Management</p>
              <button className="loom-btn" onClick={() => adminApi.notifyAllFailedBilling().then(() => status.ok('notifications sent to all failed accounts')).catch(() => status.err('failed to send notifications'))}>Notify All Failed</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 1, border: '1px solid var(--rule)' }}>
              <div style={{ padding: '20px 24px', background: 'var(--ink-card)' }}>
                <div className="loom-h2" style={{ fontSize: 28, fontWeight: 300, color: 'var(--warm)', marginBottom: 4 }}>{billingStats?.failed || 0}</div>
                <div className="loom-eyebrow">Failed</div>
              </div>
              <div style={{ padding: '20px 24px', background: 'var(--ink-card)' }}>
                <div className="loom-h2" style={{ fontSize: 28, fontWeight: 300, color: 'var(--warm)', marginBottom: 4 }}>{billingStats?.pendingRetry || 0}</div>
                <div className="loom-eyebrow">Pending Retry</div>
              </div>
              <div style={{ padding: '20px 24px', background: 'var(--ink-card)' }}>
                <div className="loom-h2" style={{ fontSize: 28, fontWeight: 300, color: 'var(--bone-dim)', marginBottom: 4 }}>{billingStats?.resolved || 0}</div>
                <div className="loom-eyebrow">Resolved</div>
              </div>
              <div style={{ padding: '20px 24px', background: 'var(--ink-card)' }}>
                <div className="loom-h2" style={{ fontSize: 28, fontWeight: 300, color: 'var(--bone-dim)', marginBottom: 4 }}>{billingStats?.last24Hours || 0}</div>
                <div className="loom-eyebrow">Last 24 Hours</div>
              </div>
            </div>

            <Panel title="Billing Errors">
              <LedgerTable cols={['User', 'Error Type', 'Amount', 'Status', 'Retries', 'Date', 'Actions']} empty="No billing errors — all payments processing successfully">
                {billingErrors?.data?.map((error: any) => (
                  <tr key={error.id} style={{ borderBottom: '1px solid var(--rule)' }}>
                    <td style={tdStyle}>
                      <div style={{ color: 'var(--bone)' }}>{error.userName}</div>
                      <div className="loom-mono" style={{ fontSize: 10, color: 'var(--bone-faint)' }}>{error.userEmail}</div>
                    </td>
                    <td style={tdStyle}><span className="loom-mono" style={{ fontSize: 11, color: 'var(--warm)' }}>{error.errorType?.replace(/_/g, ' ')}</span></td>
                    <td className="loom-mono" style={{ ...tdStyle, fontSize: 11, color: 'var(--bone-dim)' }}>${((error.amount || 0) / 100).toFixed(2)} {error.currency}</td>
                    <td style={tdStyle}><StatusWord value={error.status} /></td>
                    <td className="loom-mono" style={{ ...tdStyle, fontSize: 11, color: 'var(--bone-faint)' }}>{error.retryCount || 0}</td>
                    <td className="loom-mono" style={{ ...tdStyle, fontSize: 11, color: 'var(--bone-faint)' }}>{new Date(error.createdAt).toLocaleDateString()}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                        <button className="loom-btn-ghost" style={{ fontSize: 11 }} onClick={() => adminApi.notifyBillingError(error.id).then(() => status.ok('notification sent')).catch(() => status.err('failed to notify'))}>Notify</button>
                        <button className="loom-btn-ghost" style={{ fontSize: 11 }} onClick={() => adminApi.reprocessBillingError(error.id).then(() => status.ok('reprocess initiated')).catch(() => status.err('failed to reprocess'))}>Reprocess</button>
                        <button className="loom-btn-ghost" style={{ fontSize: 11 }} onClick={() => adminApi.resolveBillingError(error.id, { resolution: 'Manually resolved' }).then(() => status.ok('error resolved')).catch(() => status.err('failed to resolve'))}>Resolve</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </LedgerTable>
            </Panel>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p className="loom-eyebrow" style={{ color: 'var(--copper-label)' }}>User Management</p>
              <input
                type="text"
                placeholder="Search users…"
                aria-label="Search users"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                style={{
                  background: 'var(--ink-card)', border: '1px solid var(--rule)',
                  borderRadius: 0, padding: '6px 12px', color: 'var(--bone)',
                  fontFamily: 'var(--serif)', fontSize: 12, width: 220,
                  outline: 'none',
                }}
              />
            </div>
            <Panel>
              <LedgerTable cols={['User', 'Subscription', 'Email Status', 'Joined', 'Last Active', 'Actions']} empty={userSearch ? `No users matching "${userSearch}"` : 'No users found'}>
                {users?.data?.map((user: any) => (
                  <tr key={user.id} style={{ borderBottom: '1px solid var(--rule)' }}>
                    <td style={tdStyle}>
                      <div style={{ color: 'var(--bone)' }}>{user.firstName} {user.lastName}</div>
                      <div className="loom-mono" style={{ fontSize: 10, color: 'var(--bone-faint)' }}>{user.email}</div>
                    </td>
                    <td style={tdStyle}>
                      <StatusWord value={user.tier || 'FREE'} />
                      <div className="loom-mono" style={{ fontSize: 10, color: user.subscriptionStatus === 'ACTIVE' || user.subscriptionStatus === 'TRIALING' ? 'var(--warm)' : 'var(--bone-faint)', marginTop: 2 }}>{user.subscriptionStatus || 'None'}</div>
                    </td>
                    <td style={tdStyle}>
                      <span className="loom-mono" style={{ fontSize: 11, color: user.emailVerified ? 'var(--bone-dim)' : 'var(--warm)' }}>{user.emailVerified ? 'VERIFIED' : 'UNVERIFIED'}</span>
                    </td>
                    <td className="loom-mono" style={{ ...tdStyle, fontSize: 11, color: 'var(--bone-faint)' }}>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="loom-mono" style={{ ...tdStyle, fontSize: 11, color: 'var(--bone-faint)' }}>{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <button className="loom-btn-ghost" style={{ fontSize: 11 }} onClick={() => setSelectedUser(user)}>Manage</button>
                    </td>
                  </tr>
                ))}
              </LedgerTable>
              {users?.pagination && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--rule)' }}>
                  <span className="loom-mono" style={{ fontSize: 11, color: 'var(--bone-faint)' }}>
                    {users.data?.length || 0} of {users.pagination.total} · page {users.pagination.page} / {users.pagination.totalPages}
                  </span>
                </div>
              )}
            </Panel>
          </div>
        )}

        {/* Support Tab — the live ticket queue (open + AI-assistant escalations) */}
        {activeTab === 'support' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p className="loom-eyebrow" style={{ color: 'var(--copper-label)' }}>Support Queue</p>
              <div style={{ display: 'flex', gap: 16 }}>
                <span className="loom-mono" style={{ fontSize: 11, color: 'var(--warm)' }}>{tickets?.data?.filter((t: any) => t.status === 'OPEN').length || 0} OPEN</span>
                <span className="loom-mono" style={{ fontSize: 11, color: 'var(--bone-faint)' }}>{tickets?.data?.filter((t: any) => t.status === 'IN_PROGRESS').length || 0} IN PROGRESS</span>
                <span className="loom-mono" style={{ fontSize: 11, color: 'var(--warm)' }}>{tickets?.data?.filter((t: any) => t.status === 'ESCALATED' || t.category === 'CHATBOT_ESCALATION').length || 0} ESCALATED</span>
              </div>
            </div>
            <Panel>
              <LedgerTable cols={['Subject', 'User', 'Category', 'Status', 'Created', '']} empty="No tickets in the queue.">
                {tickets?.data && tickets.data.length > 0
                  ? tickets.data.map((ticket: any) => {
                      const isEscalated = ticket.status === 'ESCALATED' || ticket.category === 'CHATBOT_ESCALATION';
                      return (
                        <tr
                          key={ticket.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelectedTicket(ticket.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              if (e.key === ' ') e.preventDefault();
                              setSelectedTicket(ticket.id);
                            }
                          }}
                          style={{
                            borderBottom: '1px solid var(--rule)',
                            cursor: 'pointer',
                            borderLeft: isEscalated ? '1px solid var(--warm)' : '1px solid transparent',
                          }}
                          onMouseOver={(e) => (e.currentTarget.style.background = 'var(--ink-card)')}
                          onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td style={tdStyle}>
                            <div style={{ color: 'var(--bone)' }}>{ticket.subject}</div>
                            <span
                              className="loom-mono"
                              style={{ fontSize: 11, color: ticket.priority === 'HIGH' ? 'var(--warm)' : ticket.priority === 'MEDIUM' ? 'var(--bone-dim)' : 'var(--bone-faint)' }}
                            >
                              {ticket.priority}
                            </span>
                          </td>
                          <td style={tdStyle}>
                            <div style={{ color: 'var(--bone-dim)', fontSize: 13 }}>{ticket.user?.name || '—'}</div>
                            <div className="loom-mono" style={{ fontSize: 10, color: 'var(--bone-faint)' }}>{ticket.user?.email || ticket.email}</div>
                          </td>
                          <td style={tdStyle}>
                            <span
                              className="loom-mono"
                              style={{ fontSize: 11, color: ticket.category === 'CHATBOT_ESCALATION' ? 'var(--warm)' : 'var(--bone-dim)' }}
                            >
                              {ticket.category === 'CHATBOT_ESCALATION' ? 'CHATBOT ESCALATION' : (ticket.category || '—')}
                            </span>
                          </td>
                          <td style={tdStyle}>
                            {ticket.status === 'ESCALATED'
                              ? <span className="loom-mono" style={{ fontSize: 11, color: 'var(--warm)' }}>ESCALATED</span>
                              : <StatusWord value={ticket.status} />}
                          </td>
                          <td className="loom-mono" style={{ ...tdStyle, fontSize: 11, color: 'var(--bone-faint)' }}>{new Date(ticket.createdAt).toLocaleDateString()}</td>
                          <td style={{ ...tdStyle, textAlign: 'right' }}>
                            <span className="loom-mono" style={{ fontSize: 11, color: 'var(--bone-faint)' }}>open →</span>
                          </td>
                        </tr>
                      );
                    })
                  : null}
              </LedgerTable>
            </Panel>
          </div>
        )}

        {/* System Health Tab */}
        {activeTab === 'system' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p className="loom-eyebrow" style={{ color: 'var(--copper-label)' }}>System Health</p>
              <span className="loom-mono" style={{ fontSize: 11, color: 'var(--warm)', letterSpacing: '0.12em' }}>{(systemHealth?.status || 'UNKNOWN').toUpperCase()}</span>
            </div>

            {systemHealth?.checks && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 1, border: '1px solid var(--rule)' }}>
                {Object.entries(systemHealth.checks).filter(([k]) => k !== 'timestamp').map(([key, value]) => (
                  <div key={key} style={{ padding: '16px 20px', background: 'var(--ink-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--bone-dim)', textTransform: 'capitalize', fontSize: 13 }}>{key}</span>
                    <span className="loom-mono" style={{ fontSize: 11, color: value === 'healthy' ? 'var(--bone-dim)' : 'var(--warm)' }}>{(value as string).toUpperCase()}</span>
                  </div>
                ))}
              </div>
            )}

            <Panel title="System Statistics">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 1, border: '1px solid var(--rule)' }}>
                {[
                  { v: systemStats?.users || 0, l: 'Total Users' },
                  { v: systemStats?.openTickets || 0, l: 'Open Tickets' },
                  { v: `${((systemStats?.storage?.total || 0) / (1024 * 1024 * 1024)).toFixed(2)} GB`, l: 'Storage Used' },
                  { v: (systemStats?.content?.memories || 0) + (systemStats?.content?.letters || 0), l: 'Total Content' },
                ].map(({ v, l }) => (
                  <div key={l} style={{ padding: '20px 24px', background: 'var(--ink-card)' }}>
                    <div className="loom-h2" style={{ fontSize: 28, fontWeight: 300, color: 'var(--bone)', marginBottom: 4 }}>{v}</div>
                    <div className="loom-eyebrow">{l}</div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        )}

        {/* Audit Logs Tab */}
        {activeTab === 'legacy' && legacySub === 'audit' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <SectionLabel>Audit Logs</SectionLabel>
            <Panel>
              <LedgerTable cols={['Action', 'Admin', 'Details', 'Time']} empty="No audit logs">
                {auditLogs?.data?.map((log: any) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--rule)' }}>
                    <td style={tdStyle}><span className="loom-mono" style={{ fontSize: 11, color: 'var(--bone)' }}>{log.action}</span></td>
                    <td className="loom-mono" style={{ ...tdStyle, fontSize: 11, color: 'var(--bone-dim)' }}>{log.admin?.email || 'System'}</td>
                    <td className="loom-mono" style={{ ...tdStyle, fontSize: 10, color: 'var(--bone-faint)' }}>{log.details ? JSON.stringify(log.details).substring(0, 50) : '—'}</td>
                    <td className="loom-mono" style={{ ...tdStyle, fontSize: 11, color: 'var(--bone-faint)' }}>{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </LedgerTable>
            </Panel>
          </div>
        )}

        {/* Admin Users Tab */}
        {activeTab === 'legacy' && legacySub === 'admins' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p className="loom-eyebrow">Admin Users</p>
              {admin.role === 'SUPER_ADMIN' && <button className="loom-btn" onClick={() => setShowAdminModal(true)}>Add Admin</button>}
            </div>
            <Panel>
              <LedgerTable cols={['Name', 'Email', 'Role', 'Status', 'Last Login']} empty="No admin users">
                {adminUsers?.map((adminUser: any) => (
                  <tr key={adminUser.id} style={{ borderBottom: '1px solid var(--rule)' }}>
                    <td style={{ ...tdStyle, color: 'var(--bone)' }}>{adminUser.firstName} {adminUser.lastName}</td>
                    <td className="loom-mono" style={{ ...tdStyle, fontSize: 11, color: 'var(--bone-dim)' }}>{adminUser.email}</td>
                    <td style={tdStyle}><span className="loom-mono" style={{ fontSize: 11, color: adminUser.role === 'SUPER_ADMIN' ? 'var(--warm)' : 'var(--bone-faint)' }}>{adminUser.role}</span></td>
                    <td style={tdStyle}><span className="loom-mono" style={{ fontSize: 11, color: adminUser.isActive ? 'var(--bone-dim)' : 'var(--warm)' }}>{adminUser.isActive ? 'ACTIVE' : 'INACTIVE'}</span></td>
                    <td className="loom-mono" style={{ ...tdStyle, fontSize: 11, color: 'var(--bone-faint)' }}>{adminUser.lastLoginAt ? new Date(adminUser.lastLoginAt).toLocaleString() : 'Never'}</td>
                  </tr>
                ))}
              </LedgerTable>
            </Panel>
          </div>
        )}

        {/* Emails Tab */}
        {activeTab === 'legacy' && legacySub === 'emails' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <SectionLabel>Email Management</SectionLabel>
            <Panel>
              <LedgerTable cols={['To', 'Subject', 'Status', 'Sent', 'Actions']} empty="No email logs">
                {emailLogs?.data?.map((email: any) => (
                  <tr key={email.id} style={{ borderBottom: '1px solid var(--rule)' }}>
                    <td className="loom-mono" style={{ ...tdStyle, fontSize: 11, color: 'var(--bone-dim)' }}>{email.to}</td>
                    <td style={{ ...tdStyle, color: 'var(--bone)' }}>{email.subject}</td>
                    <td style={tdStyle}><StatusWord value={email.status} /></td>
                    <td className="loom-mono" style={{ ...tdStyle, fontSize: 11, color: 'var(--bone-faint)' }}>{email.sentAt ? new Date(email.sentAt).toLocaleString() : '—'}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <button className="loom-btn-ghost" style={{ fontSize: 11 }} onClick={() => setSelectedEmail(email.id)}>View</button>
                    </td>
                  </tr>
                ))}
              </LedgerTable>
            </Panel>
          </div>
        )}

        {/* Email Detail Modal */}
        {selectedEmail && (
          <EmailDetailModal emailId={selectedEmail} onClose={() => setSelectedEmail(null)} />
        )}

        {/* Reports Tab */}
        {activeTab === 'legacy' && legacySub === 'reports' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <SectionLabel>Reports & Analytics</SectionLabel>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
              <Panel title="Revenue Report">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1, border: '1px solid var(--rule)' }}>
                  {[
                    { l: 'Monthly Recurring Revenue', v: `$${revenueReport?.mrr?.toFixed(2) || '0.00'}`, accent: true },
                    { l: 'Annual Recurring Revenue', v: `$${revenueReport?.arr?.toFixed(2) || '0.00'}`, accent: true },
                    { l: 'Active Subscriptions', v: revenueReport?.activeSubscriptions || 0, accent: false },
                  ].map(({ l, v, accent }) => (
                    <div key={l} style={{ padding: '12px 16px', background: 'var(--ink-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="loom-mono" style={{ fontSize: 11, color: 'var(--bone-dim)' }}>{l}</span>
                      <span className="loom-serif" style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 300, color: accent ? 'var(--warm)' : 'var(--bone)' }}>{v}</span>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel title="User Growth · Last 30 Days">
                <div style={{ padding: '12px 16px', background: 'var(--ink-card)', marginBottom: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--rule)' }}>
                  <span className="loom-mono" style={{ fontSize: 11, color: 'var(--bone-dim)' }}>Total New Signups</span>
                  <span className="loom-serif" style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 300, color: 'var(--warm)' }}>{userGrowth?.totalSignups || 0}</span>
                </div>
                <div style={{ marginTop: 16 }}>
                  <div className="loom-eyebrow" style={{ marginBottom: 8 }}>Daily Signups</div>
                  <div style={{ display: 'flex', gap: 2, height: 64, alignItems: 'flex-end' }}>
                    {(() => {
                      const vals = userGrowth?.data?.slice(-14) || [];
                      const maxSig = Math.max(...vals.map((d: any) => d.signups), 1);
                      return vals.map((day: any, i: number) => (
                        <div key={i} style={{ flex: 1, background: 'var(--bone-dim)', height: `${Math.max(10, (day.signups / maxSig) * 100)}%` }} title={`${day.date}: ${day.signups}`} />
                      ));
                    })()}
                  </div>
                </div>
              </Panel>
            </div>

            <Panel title="Export Data">
              <p className="loom-body" style={{ fontSize: 13, color: 'var(--bone-faint)', marginBottom: 16 }}>Download user data for reporting. Super Admin only.</p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button className="loom-btn-ghost" onClick={async () => {
                  try {
                    const token = localStorage.getItem('adminToken');
                    const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://api.heirloom.blue/api'}/admin/reports/export/users?format=csv`, { headers: { Authorization: `Bearer ${token}` } });
                    if (!res.ok) { const e = await res.json(); status.err(e.error || 'export failed'); return; }
                    const blob = await res.blob(); const url = window.URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`; document.body.appendChild(a); a.click(); window.URL.revokeObjectURL(url); document.body.removeChild(a);
                  } catch (_err) { status.err('export failed'); }
                }}>Export Users (CSV)</button>
                <button className="loom-btn-ghost" onClick={async () => {
                  try {
                    const token = localStorage.getItem('adminToken');
                    const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://api.heirloom.blue/api'}/admin/reports/export/users?format=json`, { headers: { Authorization: `Bearer ${token}` } });
                    if (!res.ok) { const e = await res.json(); status.err(e.error || 'export failed'); return; }
                    const data = await res.json(); const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const url = window.URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `users-export-${new Date().toISOString().split('T')[0]}.json`; document.body.appendChild(a); a.click(); window.URL.revokeObjectURL(url); document.body.removeChild(a);
                  } catch (_err) { status.err('export failed'); }
                }}>Export Users (JSON)</button>
              </div>
            </Panel>
          </div>
        )}

        {/* Social Calendar Tab */}
        {activeTab === 'legacy' && legacySub === 'social' && (
          <SocialCalendarTab />
        )}

      </div>

      {/* Modals */}
            {showCouponModal && (
              <CreateCouponModal onClose={() => setShowCouponModal(false)} />
            )}
            {showVoucherModal && (
              <CreateVoucherModal onClose={() => setShowVoucherModal(false)} onCreated={() => refetchVouchers()} />
            )}
            {showGoldLegacyModal && (
              <CreateGoldLegacyModal onClose={() => { setShowGoldLegacyModal(false); refetchGoldLegacy(); }} />
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

      {/* The ∞ rests warm at the page foot */}
      <div style={{ marginTop: 56 }}>
        <WaxSeal size={28} />
      </div>

      {/* Persistent ledger band — the loom-keeper's reverse */}
      <LedgerBand overview={overview} revenue={revenue} />
    </AppFrame>
  );
}

// ─── AdminBar — admin topbar: "admin · {section}" + encryption-at-rest assurance ──
function AdminBar({ section, email, role, onLogout }: { section: string; email: string; role: string; onLogout: () => void }) {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
        borderBottom: '1px solid var(--rule)', paddingBottom: 16, marginBottom: 28,
        fontFamily: 'var(--mono)', fontSize: 11,
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 14, letterSpacing: '0.12em', color: 'var(--bone)' }}>
        <span className="loom-mark" style={{ fontFamily: 'var(--mono)', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.16em' }}>heirloom</span>
        <span style={{ color: 'var(--bone-faint)' }}>·</span>
        <span style={{ textTransform: 'lowercase' }}>admin · {section}</span>
      </span>
      <span className="loom-mono" style={{ fontSize: 10, letterSpacing: '0.14em', color: 'var(--bone-faint)', textTransform: 'lowercase' }}>
        role · <b style={{ color: 'var(--warm)', fontWeight: 400 }}>{role?.toLowerCase()}</b> · encrypted at rest · prose not read
      </span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 22 }}>
        <span className="loom-mono" style={{ fontSize: 10, color: 'var(--bone-faint)' }}>{email}</span>
        <button
          onClick={onLogout}
          style={{
            background: 'transparent', border: 0, cursor: 'pointer',
            fontFamily: 'var(--mono)', fontSize: 10,
            letterSpacing: '0.18em', textTransform: 'lowercase',
            color: 'var(--bone-faint)', padding: 0,
          }}
          onMouseOver={e => (e.currentTarget.style.color = 'var(--warm)')}
          onMouseOut={e => (e.currentTarget.style.color = 'var(--bone-faint)')}
        >
          sign out
        </button>
      </span>
    </div>
  );
}

// ─── LedgerBand — persistent reverse band with real global counts ─────
function LedgerBand({ overview, revenue }: { overview: any; revenue: any }) {
  const accts = overview?.users?.total;
  const entries =
    overview?.content
      ? (overview.content.memories || 0) + (overview.content.letters || 0) + (overview.content.voiceRecordings || 0)
      : undefined;
  const active = overview?.users?.active;
  const parts: string[] = [];
  if (accts != null) parts.push(`${accts.toLocaleString()} acct`);
  if (entries != null) parts.push(`${entries.toLocaleString()} entries`);
  if (active != null) parts.push(`${active.toLocaleString()} active`);
  const counts = parts.length ? parts.join(' · ') : '—';
  const right = revenue?.mrr != null ? `mrr $${revenue.mrr.toFixed(2)}` : 'everything ok';
  return (
    <div
      style={{
        marginTop: 48, borderTop: '1px solid var(--rule)', paddingTop: 14,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
        fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--bone-faint)',
        letterSpacing: '0.18em', textTransform: 'uppercase',
      }}
    >
      <span>ledger · the loom-keeper's reverse</span>
      <span style={{ color: 'var(--bone-dim)' }}>{counts}</span>
      <span style={{ color: 'var(--warm)' }}>{right}</span>
    </div>
  );
}

// ─── Confirm modal (replaces confirm) ────────────────────────────────
// Confirm modal — reuses ModalShell; replaces native confirm()
function ConfirmModal({ title, body, confirmLabel, onConfirm, onClose }: {
  title: string; body: string; confirmLabel?: string; onConfirm: () => void; onClose: () => void;
}) {
  return (
    <ModalShell onClose={onClose} title={title}>
      <p className="loom-body" style={{ fontSize: 14, color: 'var(--bone-dim)', marginBottom: 24 }}>{body}</p>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, borderTop: '1px solid var(--rule)', paddingTop: 20 }}>
        <button className="loom-btn-ghost" style={{ fontSize: 11 }} onClick={onClose}>cancel</button>
        <button
          className="loom-btn"
          style={{ fontSize: 11, background: 'transparent', borderColor: 'var(--warm)', color: 'var(--warm)' }}
          onClick={() => { onConfirm(); onClose(); }}
        >
          {confirmLabel || 'confirm'}
        </button>
      </div>
    </ModalShell>
  );
}

// ─── Shared style token ──────────────────────────────────────────────
const tdStyle: React.CSSProperties = {
  padding: '10px 16px',
  verticalAlign: 'top',
  color: 'var(--bone)',
  fontSize: 13,
};

// ─── LedgerTable — zero-chrome hairline table ─────────────────────────
function LedgerTable({ cols, children, empty }: { cols: string[]; children?: React.ReactNode; empty?: string }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ borderBottom: '1px solid var(--rule)' }}>
          {cols.map((c, i) => (
            <th key={c} className="loom-mono" style={{ padding: '8px 16px', fontWeight: 400, fontSize: 10, textAlign: i === cols.length - 1 ? 'right' : 'left', color: 'var(--bone-faint)', textTransform: 'uppercase', letterSpacing: '0.18em' }}>{c}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {children}
        {!children && (
          <tr><td colSpan={cols.length} style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--bone-faint)', fontStyle: 'italic', fontSize: 13 }}>{empty || 'No data'}</td></tr>
        )}
      </tbody>
    </table>
  );
}

// ─── StatusWord — loom-mono uppercase status word, no pill/dot ────────
function StatusWord({ value }: { value: string }) {
  if (!value) return null;
  const v = value.toUpperCase();
  const color =
    v === 'ACTIVE' || v === 'VERIFIED' || v === 'SENT' || v === 'RESOLVED' || v === 'REDEEMED' || v === 'PAID' || v === 'FOREVER' ? 'var(--bone-dim)' :
    v === 'FAILED' || v === 'UNVERIFIED' || v === 'INACTIVE' || v === 'EXPIRED' || v === 'TRIGGERED' ? 'var(--warm)' :
    v === 'TRIALING' || v === 'PENDING_RETRY' || v === 'IN_PROGRESS' || v === 'OPEN' ? 'var(--bone-dim)' :
    'var(--bone-faint)';
  return <span className="loom-mono" style={{ fontSize: 11, color }}>{v}</span>;
}

// ─── Panel — flat ink-card surface, hairline border ───────────────────
function Panel({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--ink-card)', border: '1px solid var(--rule)', padding: 24 }}>
      {title && <p className="loom-eyebrow" style={{ marginBottom: 16 }}>{title}</p>}
      {children}
    </div>
  );
}

// ─── StatCard — borderless tile used in stat grids ────────────────────
function StatCard({ label, value, subtext }: { label: string; value: string | number; subtext: string }) {
  return (
    <div style={{ padding: '20px 24px', background: 'var(--ink-card)' }}>
      <div className="loom-eyebrow" style={{ marginBottom: 8 }}>{label}</div>
      <div className="loom-h2" style={{ fontSize: 28, fontWeight: 300, color: 'var(--bone)', marginBottom: 4 }}>{value}</div>
      <div className="loom-mono" style={{ fontSize: 10, color: 'var(--bone-faint)' }}>{subtext}</div>
    </div>
  );
}

// Coupon Row Component
function CouponRow({ coupon }: { coupon: any }) {
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);

  const [couponRowError, setCouponRowError] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: () => adminApi.deleteCoupon(coupon.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
    },
    onError: (err: any) => setCouponRowError(err?.response?.data?.error ?? 'delete failed'),
  });

  const toggleMutation = useMutation({
    mutationFn: () => adminApi.updateCoupon(coupon.id, { isActive: !coupon.isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
    },
    onError: (err: any) => setCouponRowError(err?.response?.data?.error ?? 'update failed'),
  });

  return (
    <tr style={{ borderBottom: '1px solid var(--rule)' }}>
      <td style={tdStyle}>
        <span className="loom-mono" style={{ color: 'var(--warm)', fontSize: 12 }}>{coupon.code}</span>
        {coupon.description && <div className="loom-mono" style={{ fontSize: 10, color: 'var(--bone-faint)', marginTop: 2 }}>{coupon.description}</div>}
      </td>
      <td className="loom-mono" style={{ ...tdStyle, fontSize: 12 }}>
        {coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}%` : `$${(coupon.discountValue / 100).toFixed(2)}`}
      </td>
      <td className="loom-mono" style={{ ...tdStyle, fontSize: 12, color: 'var(--bone-dim)' }}>{coupon.currentUses} / {coupon.maxUses || '—'}</td>
      <td className="loom-mono" style={{ ...tdStyle, fontSize: 11, color: 'var(--bone-faint)' }}>{coupon.validUntil ? new Date(coupon.validUntil).toLocaleDateString() : 'No expiry'}</td>
      <td style={tdStyle}>
        <button className="loom-btn-ghost" style={{ fontSize: 11 }} onClick={() => toggleMutation.mutate()}>
          <span style={{ color: coupon.isActive ? 'var(--warm)' : 'var(--bone-faint)' }}>{coupon.isActive ? 'ACTIVE' : 'INACTIVE'}</span>
        </button>
      </td>
      <td style={{ ...tdStyle, textAlign: 'right' }}>
        <button className="loom-btn-ghost" style={{ fontSize: 11, color: 'var(--warm)' }} onClick={() => setConfirming(true)}>Delete</button>
        {confirming && (
          <ConfirmModal
            title="Delete coupon"
            body={`Delete coupon ${coupon.code}? This cannot be undone.`}
            confirmLabel="delete coupon"
            onConfirm={() => deleteMutation.mutate()}
            onClose={() => setConfirming(false)}
          />
        )}
        {couponRowError && (
          <span role="alert" className="loom-mono" style={{ fontSize: 10, color: 'var(--warm)', marginLeft: 8 }}>{couponRowError}</span>
        )}
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
    <ModalShell onClose={onClose} title="Create Coupon">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <LoomField label="Coupon Code">
          <LoomInput type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} placeholder="SAVE20" />
        </LoomField>
        <LoomField label="Description (optional)">
          <LoomInput type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="20% off for new users" />
        </LoomField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <LoomField label="Discount Type">
            <LoomSelect value={formData.discountType} onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}>
              <option value="PERCENTAGE">Percentage</option>
              <option value="FIXED_AMOUNT">Fixed Amount</option>
            </LoomSelect>
          </LoomField>
          <LoomField label={formData.discountType === 'PERCENTAGE' ? 'Percentage (%)' : 'Amount ($)'}>
            <LoomInput type="number" value={formData.discountValue} onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) })} min={0} max={formData.discountType === 'PERCENTAGE' ? 100 : undefined} />
          </LoomField>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <LoomField label="Max Uses (optional)">
            <LoomInput type="number" value={formData.maxUses} onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })} placeholder="Unlimited" min={1} />
          </LoomField>
          <LoomField label="Valid Until (optional)">
            <LoomInput type="date" value={formData.validUntil} onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })} />
          </LoomField>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button className="loom-btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="loom-btn" style={{ flex: 1 }} onClick={() => createMutation.mutate()} disabled={!formData.code || createMutation.isPending}>
            {createMutation.isPending ? 'Creating…' : 'Create Coupon'}
          </button>
        </div>
      </div>
    </ModalShell>
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
    <ModalShell onClose={onClose} title="Add Admin User">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <LoomField label="Email">
          <LoomInput type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="admin@heirloom.blue" />
        </LoomField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <LoomField label="First Name">
            <LoomInput type="text" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} />
          </LoomField>
          <LoomField label="Last Name">
            <LoomInput type="text" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} />
          </LoomField>
        </div>
        <LoomField label="Role">
          <LoomSelect value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
            <option value="ADMIN">Admin</option>
            <option value="SUPER_ADMIN">Super Admin</option>
          </LoomSelect>
        </LoomField>
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button className="loom-btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="loom-btn" style={{ flex: 1 }} onClick={() => createMutation.mutate()} disabled={!formData.email || !formData.firstName || !formData.lastName || createMutation.isPending}>
            {createMutation.isPending ? 'Creating…' : 'Create Admin'}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

// User Actions Modal
function UserActionsModal({ user, onClose }: { user: any; onClose: () => void }) {
  const queryClient = useQueryClient();
  const status = useInlineStatus();
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [trialDays, setTrialDays] = useState(7);
  const [couponCode, setCouponCode] = useState('');
  const [selectedTier, setSelectedTier] = useState(user.tier || 'FREE');

  const extendTrialMutation = useMutation({
    mutationFn: () => adminApi.extendTrial(user.id, trialDays),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      status.ok('trial extended');
    },
    onError: (err: any) => status.err(err?.response?.data?.error || 'failed to extend trial'),
  });

  const applyCouponMutation = useMutation({
    mutationFn: () => adminApi.applyCouponToUser(user.id, couponCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      status.ok('coupon applied');
      setCouponCode('');
    },
    onError: (err: any) => status.err(err?.response?.data?.error || 'failed to apply coupon'),
  });

  const cancelSubscriptionMutation = useMutation({
    mutationFn: () => adminApi.cancelSubscription(user.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      onClose();
    },
    onError: (err: any) => status.err(err?.response?.data?.error || 'failed to cancel subscription'),
  });

  const updateTierMutation = useMutation({
    mutationFn: () => adminApi.updateUser(user.id, { tier: selectedTier }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      status.ok('tier updated');
    },
    onError: (err: any) => status.err(err?.response?.data?.error || 'failed to update tier'),
  });

  const verifyEmailMutation = useMutation({
    mutationFn: () => adminApi.updateUser(user.id, { emailVerified: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      status.ok('email marked verified');
    },
    onError: (err: any) => status.err(err?.response?.data?.error || 'failed to verify email'),
  });

  // ponytail: render ConfirmModal as the SOLE dialog while confirming — two nested aria-modal shells fight focus-trap/Escape
  if (confirmingCancel) {
    return (
      <ConfirmModal
        title="Cancel subscription"
        body="Cancel this subscription? This cannot be undone."
        confirmLabel="cancel subscription"
        onConfirm={() => cancelSubscriptionMutation.mutate()}
        onClose={() => setConfirmingCancel(false)}
      />
    );
  }

  return (
    <ModalShell onClose={onClose} title="Manage User">
      <InlineStatus status={status} />
      {/* User metadata — status and identifiers only, never entry content */}
      <div style={{ marginBottom: 24, padding: 16, background: 'var(--ink)', border: '1px solid var(--rule)' }}>
        <div style={{ marginBottom: 12 }}>
          <div style={{ color: 'var(--bone)', fontSize: 15, marginBottom: 2 }}>{user.firstName} {user.lastName}</div>
          <div className="loom-mono" style={{ fontSize: 11, color: 'var(--bone-faint)' }}>{user.email}</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { l: 'User ID', v: user.id, mono: true },
            { l: 'Joined', v: new Date(user.createdAt).toLocaleDateString() },
            { l: 'Tier', v: user.tier || 'FREE' },
            { l: 'Email', v: user.emailVerified ? 'VERIFIED' : 'UNVERIFIED' },
            { l: 'Subscription', v: user.subscriptionStatus || 'None' },
            { l: 'Last Active', v: user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never' },
          ].map(({ l, v, mono }) => (
            <div key={l}>
              <div className="loom-eyebrow" style={{ marginBottom: 2 }}>{l}</div>
              <div className={mono ? 'loom-mono' : ''} style={{ fontSize: mono ? 10 : 12, color: 'var(--bone-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <LoomField label="Change Subscription Tier">
          <div style={{ display: 'flex', gap: 8 }}>
            <LoomSelect value={selectedTier} onChange={(e) => setSelectedTier(e.target.value)} style={{ flex: 1 }}>
              <option value="FREE">Free</option>
              <option value="STARTER">Starter (free)</option>
              <option value="FAMILY">Family ({PLAN_PRICE.FAMILY.monthly}/mo)</option>
              <option value="FOREVER">Forever ({PLAN_PRICE.FOUNDER.amount} lifetime)</option>
            </LoomSelect>
            <button className="loom-btn-ghost" onClick={() => updateTierMutation.mutate()} disabled={updateTierMutation.isPending || selectedTier === user.tier}>{updateTierMutation.isPending ? '…' : 'Update'}</button>
          </div>
        </LoomField>

        <LoomField label="Extend Trial Period">
          <div style={{ display: 'flex', gap: 8 }}>
            <LoomInput type="number" value={trialDays} onChange={(e) => setTrialDays(parseInt(e.target.value) || 7)} min={1} max={365} style={{ flex: 1 }} />
            <button className="loom-btn-ghost" onClick={() => extendTrialMutation.mutate()} disabled={extendTrialMutation.isPending}>{extendTrialMutation.isPending ? '…' : `+${trialDays} days`}</button>
          </div>
        </LoomField>

        <LoomField label="Apply Coupon Code">
          <div style={{ display: 'flex', gap: 8 }}>
            <LoomInput type="text" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="COUPON_CODE" style={{ flex: 1 }} />
            <button className="loom-btn-ghost" onClick={() => applyCouponMutation.mutate()} disabled={!couponCode || applyCouponMutation.isPending}>{applyCouponMutation.isPending ? '…' : 'Apply'}</button>
          </div>
        </LoomField>

        {!user.emailVerified && (
          <LoomField label="Email Verification">
            <button className="loom-btn-ghost" style={{ width: '100%' }} onClick={() => verifyEmailMutation.mutate()} disabled={verifyEmailMutation.isPending}>{verifyEmailMutation.isPending ? '…' : 'Mark Email as Verified'}</button>
          </LoomField>
        )}

        <div style={{ paddingTop: 16, borderTop: '1px solid var(--rule)' }}>
          <div className="loom-eyebrow" style={{ color: 'var(--warm)', marginBottom: 8 }}>Danger Zone</div>
          <button
            style={{ width: '100%', background: 'transparent', border: '1px solid var(--warm)', color: 'var(--warm)', padding: '8px 16px', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 12, letterSpacing: '0.08em', opacity: cancelSubscriptionMutation.isPending || !user.subscriptionStatus || user.subscriptionStatus === 'NONE' ? 0.4 : 1 }}
            onClick={() => setConfirmingCancel(true)}
            disabled={cancelSubscriptionMutation.isPending || !user.subscriptionStatus || user.subscriptionStatus === 'NONE'}
          >
            {cancelSubscriptionMutation.isPending ? 'Cancelling…' : 'Cancel Subscription'}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

// Email Detail Modal
function EmailDetailModal({ emailId, onClose }: { emailId: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const status = useInlineStatus();

  const { data: email, isLoading } = useQuery({
    queryKey: ['admin-email', emailId],
    queryFn: () => adminApi.getEmailDetail(emailId).then(r => r.data),
  });

  const resendMutation = useMutation({
    mutationFn: () => adminApi.resendEmail(emailId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-email', emailId] });
      queryClient.invalidateQueries({ queryKey: ['admin-emails'] });
      status.ok('email resent');
    },
    onError: (error: any) => {
      status.err(`failed to resend: ${error.response?.data?.error || error.message}`);
    },
  });

  return (
    <ModalShell onClose={onClose} title="Email Details" wide>
      <InlineStatus status={status} />
      {isLoading ? (
        <p style={{ fontStyle: 'italic', color: 'var(--bone-faint)', padding: '32px 0', textAlign: 'center' }}>Loading…</p>
      ) : email ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <MetaCell label="To" value={email.to} />
            <div style={{ padding: '10px 12px', background: 'var(--ink)', border: '1px solid var(--rule)' }}>
              <div className="loom-eyebrow" style={{ marginBottom: 4 }}>Status</div>
              <StatusWord value={email.status} />
            </div>
          </div>
          <MetaCell label="Subject" value={email.subject} />
          {email.emailType && <MetaCell label="Email Type" value={email.emailType} mono />}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <MetaCell label="Created" value={email.createdAt ? new Date(email.createdAt).toLocaleString() : '—'} />
            <MetaCell label="Sent" value={email.sentAt ? new Date(email.sentAt).toLocaleString() : '—'} />
          </div>
          {email.errorMessage && (
            <div style={{ padding: '10px 12px', border: '1px solid var(--warm)' }}>
              <div className="loom-eyebrow" style={{ marginBottom: 4, color: 'var(--warm)' }}>Error</div>
              <div style={{ fontSize: 13, color: 'var(--warm-dim)' }}>{email.errorMessage}</div>
            </div>
          )}
          <div style={{ padding: '10px 12px', background: 'var(--ink)', border: '1px solid var(--rule)' }}>
            <div className="loom-eyebrow" style={{ marginBottom: 8 }}>Body (HTML Preview)</div>
            {email.body ? (
              /* Sandboxed iframe prevents script execution from email body HTML; the white canvas is intentional — a real external email is legitimately light-on-white. */
              <iframe
                sandbox=""
                srcDoc={email.body}
                style={{ width: '100%', minHeight: 200, maxHeight: 384, border: 0, background: '#fff' }}
                title="Email preview"
              />
            ) : (
              <p style={{ fontStyle: 'italic', color: 'var(--bone-faint)', fontFamily: 'var(--serif)' }}>No body content</p>
            )}
          </div>
          {email.status === 'FAILED' && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="loom-btn" onClick={() => resendMutation.mutate()} disabled={resendMutation.isPending}>{resendMutation.isPending ? 'Resending…' : 'Resend Email'}</button>
            </div>
          )}
        </div>
      ) : (
        <p style={{ fontStyle: 'italic', color: 'var(--bone-faint)', padding: '32px 0', textAlign: 'center' }}>Email not found</p>
      )}
    </ModalShell>
  );
}

// Ticket Detail Modal
function TicketDetailModal({ ticketId, onClose }: { ticketId: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [reply, setReply] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');
  const [showResolveForm, setShowResolveForm] = useState(false);

  const { data: ticket } = useQuery({
    queryKey: ['admin-ticket', ticketId],
    queryFn: () => adminApi.getTicket(ticketId).then(r => r.data),
  });

  const [ticketError, setTicketError] = useState<string | null>(null);

  const replyMutation = useMutation({
    mutationFn: () => adminApi.replyToTicket(ticketId, reply),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
      setReply('');
    },
    onError: (err: any) => setTicketError(err?.response?.data?.error ?? 'could not send reply'),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ status, resolutionNote }: { status: string; resolutionNote?: string }) => 
      adminApi.updateTicket(ticketId, { status, resolutionNote }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
      setShowResolveForm(false);
      setResolutionNote('');
    },
    onError: (err: any) => setTicketError(err?.response?.data?.error ?? 'could not update status'),
  });

  return (
    <ModalShell onClose={onClose} title={ticket?.subject || 'Ticket'} wide>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <StatusWord value={ticket?.status || ''} />
        <span style={{ color: 'var(--rule)' }}>·</span>
        <span className="loom-mono" style={{ fontSize: 11, color: ticket?.priority === 'HIGH' ? 'var(--warm)' : 'var(--bone-faint)' }}>{ticket?.priority}</span>
      </div>

      <div style={{ padding: '10px 12px', background: 'var(--ink)', border: '1px solid var(--rule)', marginBottom: 16 }}>
        <span className="loom-mono" style={{ fontSize: 11, color: 'var(--bone-faint)' }}>From: {ticket?.user?.name} ({ticket?.user?.email})</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
        {ticket?.messages?.map((msg: any) => (
          <div key={msg.id} style={{ padding: '12px 16px', border: '1px solid var(--rule)', marginLeft: msg.senderType === 'ADMIN' ? 32 : 0, marginRight: msg.senderType === 'USER' ? 32 : 0, background: msg.senderType === 'USER' ? 'var(--ink)' : 'transparent', borderColor: 'var(--rule)' }}>
            <div className="loom-mono" style={{ fontSize: 10, color: 'var(--bone-faint)', marginBottom: 6 }}>{msg.senderType === 'ADMIN' ? 'Admin' : 'User'} · {new Date(msg.createdAt).toLocaleString()}</div>
            <div style={{ fontSize: 13, color: 'var(--bone)' }}>{msg.content}</div>
          </div>
        ))}
      </div>

      {ticketError && (
        <p role="alert" className="loom-mono" style={{ fontSize: 11, color: 'var(--warm)', margin: '0 0 8px', letterSpacing: '0.04em' }}>{ticketError}</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Type your reply…" aria-label="Ticket reply" style={{ width: '100%', height: 80, background: 'var(--ink)', border: '1px solid var(--rule)', color: 'var(--bone)', padding: '8px 12px', fontFamily: 'var(--serif)', fontSize: 13, resize: 'vertical', boxSizing: 'border-box', outline: 'none' }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="loom-btn" onClick={() => replyMutation.mutate()} disabled={!reply || replyMutation.isPending}>Send Reply</button>
          {ticket?.status !== 'RESOLVED' && !showResolveForm && (
            <button className="loom-btn-ghost" onClick={() => setShowResolveForm(true)}>Mark Resolved</button>
          )}
        </div>
      </div>

      {showResolveForm && ticket?.status !== 'RESOLVED' && (
        <div style={{ marginTop: 16, padding: 16, background: 'var(--ink)', border: '1px solid var(--rule)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p className="loom-eyebrow" style={{ color: 'var(--warm)' }}>Resolve Ticket</p>
          <textarea value={resolutionNote} onChange={(e) => setResolutionNote(e.target.value)} placeholder="Optional: resolution note for the user…" aria-label="Resolution note" style={{ width: '100%', height: 64, background: 'var(--ink-card)', border: '1px solid var(--rule)', color: 'var(--bone)', padding: '8px 12px', fontFamily: 'var(--serif)', fontSize: 13, resize: 'vertical', boxSizing: 'border-box', outline: 'none' }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="loom-btn" onClick={() => updateStatusMutation.mutate({ status: 'RESOLVED', resolutionNote: resolutionNote || undefined })} disabled={updateStatusMutation.isPending}>{updateStatusMutation.isPending ? 'Resolving…' : 'Confirm Resolution'}</button>
            <button className="loom-btn-ghost" onClick={() => { setShowResolveForm(false); setResolutionNote(''); }}>Cancel</button>
          </div>
        </div>
      )}
    </ModalShell>
  );
}

// Create Voucher Modal
function CreateVoucherModal({ onClose, onCreated }: { onClose: () => void; onCreated?: () => void }) {
  const status = useInlineStatus();
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
        status.err('failed to create voucher(s)');
      }
    } catch {
      status.err('error creating voucher(s)');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ModalShell onClose={onClose} title="Create Gift Voucher">
      <InlineStatus status={status} />
      {createdCodes.length > 0 ? (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <p style={{ color: 'var(--bone)', marginBottom: 16 }}>{createdCodes.length} Voucher{createdCodes.length > 1 ? 's' : ''} Created</p>
          <div style={{ background: 'var(--ink)', border: '1px solid var(--rule)', padding: 16, marginBottom: 16, maxHeight: 192, overflowY: 'auto' }}>
            {createdCodes.map((code, i) => <p key={i} className="loom-mono" style={{ fontSize: 16, color: 'var(--warm)', marginBottom: 4, letterSpacing: '0.12em' }}>{code}</p>)}
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="loom-btn-ghost" onClick={() => copyToClipboard(createdCodes.join('\n')).then(() => status.ok('codes copied')).catch(() => status.err('copy failed'))}>Copy All Codes</button>
            <button className="loom-btn-ghost" onClick={() => copyToClipboard(createdCodes.map(c => `https://heirloom.blue/gift/redeem?code=${c}`).join('\n')).then(() => status.ok('links copied')).catch(() => status.err('copy failed'))}>Copy All Links</button>
            <button className="loom-btn" onClick={onClose}>Done</button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 1, border: '1px solid var(--rule)' }}>
            {(['single', 'bulk'] as const).map(m => (
              <button key={m} aria-pressed={mode === m} className={mode === m ? 'loom-btn' : 'loom-btn-ghost'} style={{ flex: 1, borderRadius: 0 }} onClick={() => setMode(m)}>{m === 'single' ? 'Single Voucher' : 'Bulk Create'}</button>
            ))}
          </div>
          <LoomField label="Quick Presets">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {PROMO_PRESETS.map(p => <button key={p.name} className="loom-btn-ghost" style={{ fontSize: 11 }} onClick={() => applyPreset(p)}>{p.name}</button>)}
            </div>
          </LoomField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <LoomField label="Tier">
              <LoomSelect value={formData.tier} onChange={e => setFormData({ ...formData, tier: e.target.value })}>
                <option value="STARTER">Starter</option>
                <option value="FAMILY">Family</option>
                <option value="FOREVER">Forever</option>
              </LoomSelect>
            </LoomField>
            <LoomField label="Billing Cycle">
              <LoomSelect value={formData.billingCycle} onChange={e => setFormData({ ...formData, billingCycle: e.target.value, durationMonths: e.target.value === 'yearly' ? 12 : 1 })}>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </LoomSelect>
            </LoomField>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <LoomField label="Duration (months)">
              <LoomInput type="number" value={formData.durationMonths} onChange={e => setFormData({ ...formData, durationMonths: parseInt(e.target.value) || 1 })} min={1} max={120} />
            </LoomField>
            {mode === 'bulk' && (
              <LoomField label="Quantity (max 50)">
                <LoomInput type="number" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: Math.min(50, Math.max(1, parseInt(e.target.value) || 1)) })} min={1} max={50} />
              </LoomField>
            )}
          </div>
          {mode === 'single' && (
            <>
              <LoomField label="Recipient Email (optional)">
                <LoomInput type="email" value={formData.recipientEmail} onChange={e => setFormData({ ...formData, recipientEmail: e.target.value })} placeholder="recipient@example.com" />
              </LoomField>
              <LoomField label="Recipient Name (optional)">
                <LoomInput type="text" value={formData.recipientName} onChange={e => setFormData({ ...formData, recipientName: e.target.value })} placeholder="recipient name" />
              </LoomField>
              {formData.recipientEmail && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  {/* ponytail: hide native OS-blue control, render tokenized square that flips with .loom theme; input keeps state + a11y */}
                  <input type="checkbox" checked={formData.sendEmail} onChange={e => setFormData({ ...formData, sendEmail: e.target.checked })} style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
                  <span aria-hidden="true" style={{ flexShrink: 0, width: 14, height: 14, borderRadius: 0, border: `1px solid ${formData.sendEmail ? 'var(--warm)' : 'var(--rule)'}`, background: formData.sendEmail ? 'var(--bone)' : 'transparent', transition: 'border-color 180ms var(--ease), background 180ms var(--ease)' }} />
                  <span className="loom-mono" style={{ fontSize: 11, color: 'var(--bone-dim)' }}>Send gift email to recipient immediately</span>
                </label>
              )}
            </>
          )}
          <LoomField label="Admin Notes (optional)">
            <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} rows={2} placeholder="Promotional campaign, influencer gift…" style={{ width: '100%', background: 'var(--ink)', border: '1px solid var(--rule)', borderRadius: 0, color: 'var(--bone)', padding: '6px 10px', fontFamily: 'var(--serif)', fontSize: 13, resize: 'vertical', boxSizing: 'border-box', outline: 'none' }} />
          </LoomField>
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button className="loom-btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button className="loom-btn" style={{ flex: 1 }} onClick={handleCreate} disabled={isLoading}>{isLoading ? 'Creating…' : mode === 'bulk' ? `Create ${formData.quantity} Vouchers` : 'Create Voucher'}</button>
          </div>
        </div>
      )}
    </ModalShell>
  );
}

function CreateGoldLegacyModal({ onClose }: { onClose: () => void }) {
  const status = useInlineStatus();
  const [formData, setFormData] = useState({
    recipientEmail: '',
    recipientName: '',
    personalMessage: '',
    memberNumber: '',
    sendEmail: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [createdVoucher, setCreatedVoucher] = useState<any>(null);

  const DEFAULT_MESSAGE = `Welcome to the Heirloom Gold Legacy Circle.

You have been personally selected to join an exclusive group of individuals who understand the profound importance of preserving memories for generations to come.

As a Gold Legacy member, you receive lifetime access to all Heirloom features, forever. Your stories, your voice, your memories will be preserved for eternity.

This is more than a subscription—it is an invitation to be part of something timeless.

With deepest gratitude,
The Heirloom Team`;

  const handleCreate = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://api.heirloom.blue/api'}/gift-vouchers/admin/gold-legacy/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          personalMessage: formData.personalMessage || DEFAULT_MESSAGE,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCreatedVoucher(data.voucher);
      } else {
        status.err(data.error || 'failed to create Gold Legacy voucher');
      }
    } catch {
      status.err('error creating Gold Legacy voucher');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ModalShell onClose={onClose} title="Create Gold Legacy Voucher">
      <InlineStatus status={status} />
      {createdVoucher ? (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <p className="loom-h2" style={{ fontSize: 24, fontStyle: 'italic', fontWeight: 300, color: 'var(--warm)', marginBottom: 4 }}>Gold Legacy Voucher Created</p>
          <p className="loom-mono" style={{ fontSize: 11, color: 'var(--bone-faint)', marginBottom: 16 }}>Member #{createdVoucher.memberNumber}</p>
          <div style={{ padding: 16, border: '1px solid var(--gold-20)', marginBottom: 16 }}>
            <p className="loom-mono" style={{ fontSize: 16, color: 'var(--warm)', letterSpacing: '0.12em' }}>{createdVoucher.code}</p>
          </div>
          {createdVoucher.emailSent && <p className="loom-mono" style={{ fontSize: 11, color: 'var(--warm)', marginBottom: 16 }}>Invitation email sent to {createdVoucher.recipientEmail}</p>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="loom-btn-ghost" onClick={() => copyToClipboard(createdVoucher.code).then(() => status.ok('code copied')).catch(() => status.err('copy failed'))}>Copy Code</button>
            <button className="loom-btn" onClick={() => copyToClipboard(`https://heirloom.blue/gold/redeem?code=${createdVoucher.code}`).then(() => status.ok('invitation link copied')).catch(() => status.err('copy failed'))}>Copy Invitation Link</button>
            <button className="loom-btn-ghost" onClick={onClose}>Done</button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ padding: '10px 14px', background: 'var(--ink)', border: '1px solid var(--gold-20)' }}>
            <p className="loom-mono" style={{ fontSize: 11, color: 'var(--bone-dim)' }}>Gold Legacy vouchers grant lifetime access. Reserved for special individuals only.</p>
          </div>
          <LoomField label="Recipient Name">
            <LoomInput type="text" value={formData.recipientName} onChange={e => setFormData({ ...formData, recipientName: e.target.value })} placeholder="recipient name" />
          </LoomField>
          <LoomField label="Recipient Email">
            <LoomInput type="email" value={formData.recipientEmail} onChange={e => setFormData({ ...formData, recipientEmail: e.target.value })} placeholder="recipient@example.com" />
          </LoomField>
          <LoomField label="Member Number (optional)">
            <LoomInput type="text" value={formData.memberNumber} onChange={e => setFormData({ ...formData, memberNumber: e.target.value })} placeholder="G-000001 (auto-generated if empty)" />
          </LoomField>
          <LoomField label="Personal Message">
            <textarea value={formData.personalMessage} onChange={e => setFormData({ ...formData, personalMessage: e.target.value })} rows={6} placeholder={DEFAULT_MESSAGE} style={{ width: '100%', background: 'var(--ink)', border: '1px solid var(--rule)', borderRadius: 0, color: 'var(--bone)', padding: '6px 10px', fontFamily: 'var(--serif)', fontSize: 13, resize: 'vertical', boxSizing: 'border-box', outline: 'none' }} />
            <div className="loom-mono" style={{ fontSize: 10, color: 'var(--bone-faint)', marginTop: 4 }}>Leave empty to use the default message</div>
          </LoomField>
          {formData.recipientEmail && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              {/* ponytail: hide native OS-blue control, render tokenized square that flips with .loom theme; input keeps state + a11y */}
              <input type="checkbox" checked={formData.sendEmail} onChange={e => setFormData({ ...formData, sendEmail: e.target.checked })} style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
              <span aria-hidden="true" style={{ flexShrink: 0, width: 14, height: 14, borderRadius: 0, border: `1px solid ${formData.sendEmail ? 'var(--warm)' : 'var(--rule)'}`, background: formData.sendEmail ? 'var(--bone)' : 'transparent', transition: 'border-color 180ms var(--ease), background 180ms var(--ease)' }} />
              <span className="loom-mono" style={{ fontSize: 11, color: 'var(--bone-dim)' }}>Send Gold Legacy invitation email immediately</span>
            </label>
          )}
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button className="loom-btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button className="loom-btn" style={{ flex: 1 }} onClick={handleCreate} disabled={isLoading}>{isLoading ? 'Creating…' : 'Create Gold Legacy Voucher'}</button>
          </div>
        </div>
      )}
    </ModalShell>
  );
}

// ─── Shared Modal Primitives ──────────────────────────────────────────

function ModalShell({ onClose, title, children, wide }: { onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useFocusTrap(dialogRef, onClose);
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--ink-translucent)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 50, padding: '32px 16px', overflowY: 'auto' }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} style={{ background: 'var(--ink-card)', border: '1px solid var(--rule)', width: '100%', maxWidth: wide ? 720 : 480, padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, borderBottom: '1px solid var(--rule)', paddingBottom: 16 }}>
          <p id={titleId} className="loom-eyebrow" style={{ color: 'var(--bone-dim)' }}>{title}</p>
          <button onClick={onClose} className="loom-mono" style={{ background: 'transparent', border: 0, color: 'var(--bone-faint)', cursor: 'pointer', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', padding: 0, lineHeight: 1 }} aria-label="Close">close</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function LoomField({ label, children }: { label: string; children: React.ReactNode }) {
  // Wrapping <label> implicitly associates the visible eyebrow text with the
  // contained form control (direct or nested), giving every LoomField input/
  // select/textarea an accessible name without per-call id wiring.
  return (
    <label style={{ display: 'block' }}>
      <div className="loom-eyebrow" style={{ marginBottom: 6 }}>{label}</div>
      {children}
    </label>
  );
}

const loomInputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--ink)',
  border: '1px solid var(--rule)',
  borderRadius: 0,
  color: 'var(--bone)',
  padding: '6px 10px',
  fontFamily: 'var(--serif)',
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
};

function LoomInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={{ ...loomInputStyle, ...props.style }} />;
}

function LoomSelect({ children, style, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} style={{ ...loomInputStyle, ...style }}>
      {children}
    </select>
  );
}

function MetaCell({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ padding: '10px 12px', background: 'var(--ink)', border: '1px solid var(--rule)' }}>
      <div className="loom-eyebrow" style={{ marginBottom: 4 }}>{label}</div>
      <div className={mono ? 'loom-mono' : ''} style={{ fontSize: mono ? 11 : 13, color: 'var(--bone)' }}>{value}</div>
    </div>
  );
}
