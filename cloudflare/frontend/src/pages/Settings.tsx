import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, User, CreditCard, Bell, Shield, Trash2, Clock, Lock, Check, AlertCircle } from 'lucide-react';
import { settingsApi, billingApi, deadmanApi, encryptionApi, legacyContactsApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';

// Notification preferences type
interface NotificationPrefs {
  emailNotifications: boolean;
  pushNotifications: boolean;
  reminderEmails: boolean;
  marketingEmails: boolean;
  weeklyDigest: boolean;
}

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
];

export function Settings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, updateUser, logout } = useAuthStore();

    const [activeTab, setActiveTab] = useState<string>('profile');
    const [profile, setProfile] = useState({ firstName: user?.firstName || '', lastName: user?.lastName || '' });
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
    const [deadmanConfig, setDeadmanConfig] = useState({ intervalDays: 30, gracePeriodDays: 7 });
    const [newLegacyContact, setNewLegacyContact] = useState({ name: '', email: '', relationship: '' });
  
    // Notification preferences state
    const [notificationPrefs, setNotificationPrefs] = useState<NotificationPrefs>({
      emailNotifications: true,
      pushNotifications: true,
      reminderEmails: true,
      marketingEmails: false,
      weeklyDigest: true,
    });
  
    // Status messages for user feedback
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => billingApi.getSubscription().then(r => r.data),
  });

  const { data: limits } = useQuery({
    queryKey: ['limits'],
    queryFn: () => billingApi.getLimits().then(r => r.data),
  });

  const { data: pricing } = useQuery({
    queryKey: ['pricing', user?.preferredCurrency],
    queryFn: () => billingApi.getPricing(user?.preferredCurrency).then(r => r.data),
  });

  const { data: deadmanStatus } = useQuery({
    queryKey: ['deadman-status'],
    queryFn: () => deadmanApi.getStatus().then(r => r.data),
  });

  const { data: encryptionParams } = useQuery({
    queryKey: ['encryption-params'],
    queryFn: () => encryptionApi.getParams().then(r => r.data),
  });

    const { data: legacyContacts } = useQuery({
      queryKey: ['legacy-contacts'],
      queryFn: () => legacyContactsApi.getAll().then(r => r.data),
    });

    // Fetch notification preferences
    const { data: notificationData } = useQuery({
      queryKey: ['notifications'],
      queryFn: () => settingsApi.getNotifications().then(r => r.data),
    });

    // Update notification prefs when data loads
    useEffect(() => {
      if (notificationData?.preferences) {
        setNotificationPrefs(notificationData.preferences);
      }
    }, [notificationData]);

    // Clear status message after 3 seconds
    useEffect(() => {
      if (statusMessage) {
        const timer = setTimeout(() => setStatusMessage(null), 3000);
        return () => clearTimeout(timer);
      }
    }, [statusMessage]);

    const updateProfileMutation = useMutation({
      mutationFn: () => settingsApi.updateProfile(profile),
      onSuccess: (res) => {
        updateUser(res.data);
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        setStatusMessage({ type: 'success', text: 'Profile updated successfully' });
      },
      onError: () => {
        setStatusMessage({ type: 'error', text: 'Failed to update profile' });
      },
    });

    const changePasswordMutation = useMutation({
      mutationFn: () => settingsApi.changePassword({ currentPassword: passwords.current, newPassword: passwords.new }),
      onSuccess: () => {
        setPasswords({ current: '', new: '', confirm: '' });
        setStatusMessage({ type: 'success', text: 'Password changed successfully' });
      },
      onError: () => {
        setStatusMessage({ type: 'error', text: 'Failed to change password. Check your current password.' });
      },
    });

    const updateCurrencyMutation = useMutation({
      mutationFn: (currency: string) => billingApi.updateCurrency(currency),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['pricing'] });
        setStatusMessage({ type: 'success', text: 'Currency updated' });
      },
      onError: () => {
        setStatusMessage({ type: 'error', text: 'Failed to update currency' });
      },
    });

    const checkoutMutation = useMutation({
      mutationFn: (tier: string) => billingApi.checkout({ tier, currency: user?.preferredCurrency }),
      onSuccess: (res) => {
        window.location.href = res.data.url;
      },
      onError: () => {
        setStatusMessage({ type: 'error', text: 'Failed to start checkout' });
      },
    });

    const configureDeadmanMutation = useMutation({
      mutationFn: () => deadmanApi.configure(deadmanConfig),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['deadman-status'] });
        setStatusMessage({ type: 'success', text: 'Dead man\'s switch configured' });
      },
      onError: () => {
        setStatusMessage({ type: 'error', text: 'Failed to configure dead man\'s switch' });
      },
    });

    const checkInMutation = useMutation({
      mutationFn: () => deadmanApi.checkIn(),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['deadman-status'] });
        setStatusMessage({ type: 'success', text: 'Check-in successful' });
      },
      onError: () => {
        setStatusMessage({ type: 'error', text: 'Failed to check in' });
      },
    });

    const addLegacyContactMutation = useMutation({
      mutationFn: () => legacyContactsApi.add(newLegacyContact),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['legacy-contacts'] });
        setNewLegacyContact({ name: '', email: '', relationship: '' });
        setStatusMessage({ type: 'success', text: 'Legacy contact added' });
      },
      onError: () => {
        setStatusMessage({ type: 'error', text: 'Failed to add legacy contact' });
      },
    });

    const deleteAccountMutation = useMutation({
      mutationFn: (password: string) => settingsApi.deleteAccount(password),
      onSuccess: () => {
        logout();
        navigate('/');
      },
      onError: () => {
        setStatusMessage({ type: 'error', text: 'Failed to delete account. Check your password.' });
      },
    });

    // Notification preferences mutation
    const updateNotificationsMutation = useMutation({
      mutationFn: (prefs: NotificationPrefs) => settingsApi.updateNotifications(prefs),
      onSuccess: (res) => {
        if (res.data.preferences) {
          setNotificationPrefs(res.data.preferences);
        }
        setStatusMessage({ type: 'success', text: 'Notification preferences saved' });
      },
      onError: () => {
        setStatusMessage({ type: 'error', text: 'Failed to save notification preferences' });
      },
    });

    // Helper to update a single notification preference
    const handleNotificationToggle = (key: keyof NotificationPrefs, value: boolean) => {
      const updated = { ...notificationPrefs, [key]: value };
      setNotificationPrefs(updated);
      updateNotificationsMutation.mutate(updated);
    };

  const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : '??';

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'subscription', label: 'Subscription', icon: CreditCard },
    { id: 'deadman', label: 'Dead Man\'s Switch', icon: Clock },
    { id: 'encryption', label: 'Encryption', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <div className="min-h-screen px-6 md:px-12 py-12">
      <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-paper/40 hover:text-gold transition-colors mb-8">
        <ArrowLeft size={20} />
        Back to Vault
      </button>

            <div className="max-w-4xl mx-auto">
              <h1 className="text-4xl font-light mb-12">Settings</h1>

              {/* Status message toast */}
              {statusMessage && (
                <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg transition-all ${
                  statusMessage.type === 'success' 
                    ? 'bg-green-500/20 border border-green-500/30 text-green-400' 
                    : 'bg-blood/20 border border-blood/30 text-blood'
                }`}>
                  {statusMessage.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
                  <span>{statusMessage.text}</span>
                </div>
              )}

              <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="md:w-56 space-y-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${
                  activeTab === id ? 'bg-gold/10 text-gold border-l-2 border-gold' : 'text-paper/50 hover:text-gold'
                }`}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 space-y-6">
            {activeTab === 'profile' && (
              <div className="card">
                <div className="flex items-center gap-6 mb-8">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gold to-gold-dim flex items-center justify-center text-void text-2xl font-medium">
                    {initials}
                  </div>
                  <div>
                    <h2 className="text-xl">{user?.firstName} {user?.lastName}</h2>
                    <p className="text-paper/50">{user?.email}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-paper/50 mb-2">First name</label>
                      <input type="text" value={profile.firstName} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} className="input" />
                    </div>
                    <div>
                      <label className="block text-sm text-paper/50 mb-2">Last name</label>
                      <input type="text" value={profile.lastName} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} className="input" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-paper/50 mb-2">Preferred Currency</label>
                    <select
                      value={user?.preferredCurrency || 'USD'}
                      onChange={(e) => updateCurrencyMutation.mutate(e.target.value)}
                      className="input"
                    >
                      {CURRENCIES.map(c => (
                        <option key={c.code} value={c.code}>{c.symbol} {c.name}</option>
                      ))}
                    </select>
                  </div>

                  <button onClick={() => updateProfileMutation.mutate()} disabled={updateProfileMutation.isPending} className="btn btn-primary">
                    {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'subscription' && (
              <div className="space-y-6">
                {/* Current plan */}
                <div className="card">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-gold/20 text-gold text-xs tracking-wider">{subscription?.tier || 'FREE'}</span>
                        {subscription?.isTrialing && (
                          <span className="px-2 py-1 bg-blood/20 text-blood text-xs">
                            Trial: {subscription.trialDaysLeft} days left
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {subscription?.isTrialing && (
                    <div className="p-4 bg-blood/10 border border-blood/30 mb-6">
                      <p className="text-blood text-sm">
                        <strong>Warning:</strong> Your trial expires in {subscription.trialDaysLeft} days.
                        All content will be deleted when the trial ends. Upgrade now to keep your memories safe.
                      </p>
                    </div>
                  )}

                  {limits && (
                    <div className="space-y-3 mb-6">
                      {[
                        { label: 'Memories', data: limits.memories },
                        { label: 'Voice minutes', data: limits.voice },
                        { label: 'Letters', data: limits.letters },
                        { label: 'Storage (MB)', data: limits.storage },
                      ].map(({ label, data }) => (
                        <div key={label}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-paper/50">{label}</span>
                            <span>{data.current} / {data.max === -1 ? '∞' : data.max}</span>
                          </div>
                          <div className="h-1 bg-white/10 rounded">
                            <div
                              className="h-full bg-gold rounded"
                              style={{ width: `${data.max === -1 ? 0 : Math.min(100, (data.current / data.max) * 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pricing */}
                {pricing?.pricing && (
                  <div className="grid md:grid-cols-3 gap-4">
                    {[
                      { tier: 'STARTER', name: 'Starter', price: pricing.pricing.starter?.monthly },
                      { tier: 'FAMILY', name: 'Family', price: pricing.pricing.family?.monthly, popular: true },
                      { tier: 'FOREVER', name: 'Forever', price: pricing.pricing.forever?.yearly, yearly: true },
                    ].map(({ tier, name, price, popular, yearly }) => (
                      <div key={tier} className={`card relative ${popular ? 'border-gold/30' : ''}`}>
                        {popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gold text-void text-xs">POPULAR</div>}
                        <h3 className="text-lg">{name}</h3>
                        <div className="flex items-baseline gap-1 my-4">
                          <span className="text-3xl text-gold">{price?.formatted || 'N/A'}</span>
                          <span className="text-paper/40">/{yearly ? 'year' : 'month'}</span>
                        </div>
                        <button
                          onClick={() => checkoutMutation.mutate(tier)}
                          disabled={subscription?.tier === tier || checkoutMutation.isPending}
                          className={`btn w-full ${subscription?.tier === tier ? 'btn-secondary' : 'btn-primary'}`}
                        >
                          {subscription?.tier === tier ? 'Current Plan' : 'Upgrade'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'deadman' && (
              <div className="space-y-6">
                <div className="card">
                  <h3 className="text-xl mb-2">Dead Man's Switch</h3>
                  <p className="text-paper/50 text-sm mb-6">
                    Configure automatic release of your content to beneficiaries if you don't check in regularly.
                  </p>

                  {deadmanStatus?.enabled ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.04]">
                        <div>
                          <div className={`text-sm ${deadmanStatus.status === 'ACTIVE' ? 'text-green-400' : deadmanStatus.status === 'WARNING' ? 'text-yellow-400' : 'text-blood'}`}>
                            Status: {deadmanStatus.status}
                          </div>
                          <div className="text-paper/50 text-sm mt-1">
                            Next check-in due: {deadmanStatus.nextCheckInDue ? new Date(deadmanStatus.nextCheckInDue).toLocaleDateString() : 'Not set'}
                          </div>
                        </div>
                        <button onClick={() => checkInMutation.mutate()} disabled={checkInMutation.isPending} className="btn btn-primary">
                          {checkInMutation.isPending ? 'Checking in...' : 'Check In Now'}
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-paper/50 mb-2">Check-in interval</label>
                          <select
                            value={deadmanConfig.intervalDays}
                            onChange={(e) => setDeadmanConfig({ ...deadmanConfig, intervalDays: Number(e.target.value) })}
                            className="input"
                          >
                            <option value={7}>Weekly</option>
                            <option value={14}>Every 2 weeks</option>
                            <option value={30}>Monthly</option>
                            <option value={60}>Every 2 months</option>
                            <option value={90}>Quarterly</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm text-paper/50 mb-2">Grace period (days)</label>
                          <input
                            type="number"
                            value={deadmanConfig.gracePeriodDays}
                            onChange={(e) => setDeadmanConfig({ ...deadmanConfig, gracePeriodDays: Number(e.target.value) })}
                            className="input"
                            min={1}
                            max={30}
                          />
                        </div>
                      </div>

                      <button onClick={() => configureDeadmanMutation.mutate()} className="btn btn-secondary">
                        Update Configuration
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Clock className="w-12 h-12 text-paper/20 mx-auto mb-4" />
                      <p className="text-paper/50 mb-4">Dead man's switch is not configured</p>
                      <button onClick={() => configureDeadmanMutation.mutate()} className="btn btn-primary">
                        Enable Dead Man's Switch
                      </button>
                    </div>
                  )}
                </div>

                {/* Legacy Contacts */}
                <div className="card">
                  <h3 className="text-lg mb-4">Legacy Contacts</h3>
                  <p className="text-paper/50 text-sm mb-6">
                    These trusted contacts will be asked to verify your status if you miss check-ins.
                    At least 2 contacts must verify before your content is released.
                  </p>

                  <div className="space-y-3 mb-6">
                    {legacyContacts?.map((contact: any) => (
                      <div key={contact.id} className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/[0.04]">
                        <div>
                          <div className="text-paper">{contact.name}</div>
                          <div className="text-paper/40 text-sm">{contact.email} • {contact.relationship}</div>
                        </div>
                        <span className={`text-xs px-2 py-1 ${contact.verificationStatus === 'VERIFIED' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                          {contact.verificationStatus}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="Name"
                      value={newLegacyContact.name}
                      onChange={(e) => setNewLegacyContact({ ...newLegacyContact, name: e.target.value })}
                      className="input"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={newLegacyContact.email}
                      onChange={(e) => setNewLegacyContact({ ...newLegacyContact, email: e.target.value })}
                      className="input"
                    />
                    <input
                      type="text"
                      placeholder="Relationship"
                      value={newLegacyContact.relationship}
                      onChange={(e) => setNewLegacyContact({ ...newLegacyContact, relationship: e.target.value })}
                      className="input"
                    />
                  </div>
                  <button
                    onClick={() => addLegacyContactMutation.mutate()}
                    disabled={!newLegacyContact.name || !newLegacyContact.email}
                    className="btn btn-secondary mt-3"
                  >
                    Add Legacy Contact
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'encryption' && (
              <div className="card">
                <h3 className="text-xl mb-2">End-to-End Encryption</h3>
                <p className="text-paper/50 text-sm mb-6">
                  Your content is encrypted before it leaves your device. Only you and your designated
                  beneficiaries can decrypt it.
                </p>

                {encryptionParams?.configured ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-500/10 border border-green-500/30 text-green-400">
                      <Lock className="inline w-4 h-4 mr-2" />
                      Encryption is enabled. Your content is protected.
                    </div>

                    <div>
                      <h4 className="text-sm text-paper/50 mb-2">Key Escrow Status</h4>
                      <p className="text-paper/60 text-sm">
                        Your encryption key is securely escrowed and will be released to your beneficiaries
                        when the dead man's switch is triggered.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Lock className="w-12 h-12 text-paper/20 mx-auto mb-4" />
                    <p className="text-paper/50 mb-4">Encryption not yet configured</p>
                    <p className="text-paper/40 text-sm mb-6">
                      Set up end-to-end encryption to ensure only you and your beneficiaries can access your content.
                    </p>
                    <button className="btn btn-primary">Set Up Encryption</button>
                  </div>
                )}
              </div>
            )}

                        {activeTab === 'notifications' && (
                          <div className="card space-y-6">
                            {[
                              { id: 'emailNotifications' as keyof NotificationPrefs, label: 'Email notifications', desc: 'Receive updates about your memories' },
                              { id: 'reminderEmails' as keyof NotificationPrefs, label: 'Check-in reminders', desc: 'Get reminded to check in for dead man\'s switch' },
                              { id: 'pushNotifications' as keyof NotificationPrefs, label: 'Delivery confirmations', desc: 'Know when your letters are delivered' },
                              { id: 'weeklyDigest' as keyof NotificationPrefs, label: 'Weekly digest', desc: 'Get a weekly summary of your activity' },
                            ].map(({ id, label, desc }) => (
                              <div key={id} className="flex items-center justify-between">
                                <div>
                                  <div className="text-paper">{label}</div>
                                  <div className="text-paper/40 text-sm">{desc}</div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    checked={notificationPrefs[id]} 
                                    onChange={(e) => handleNotificationToggle(id, e.target.checked)}
                                    className="sr-only peer" 
                                  />
                                  <div className="w-12 h-7 bg-white/10 peer-checked:bg-gold rounded-full peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-1 after:left-1 after:bg-paper after:rounded-full after:h-5 after:w-5 after:transition-all" />
                                </label>
                              </div>
                            ))}
                            {updateNotificationsMutation.isPending && (
                              <div className="text-paper/40 text-sm">Saving...</div>
                            )}
                          </div>
                        )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="card">
                  <h3 className="text-lg mb-4">Change Password</h3>
                  <div className="space-y-4">
                    <input type="password" placeholder="Current password" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} className="input" />
                    <input type="password" placeholder="New password" value={passwords.new} onChange={(e) => setPasswords({ ...passwords, new: e.target.value })} className="input" />
                    <input type="password" placeholder="Confirm new password" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} className="input" />
                    <button
                      onClick={() => {
                        if (passwords.new !== passwords.confirm) {
                          alert('Passwords do not match');
                          return;
                        }
                        changePasswordMutation.mutate();
                      }}
                      disabled={changePasswordMutation.isPending}
                      className="btn btn-primary"
                    >
                      {changePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </div>

                <div className="card border-blood/30 bg-blood/5">
                  <h3 className="text-lg text-blood mb-2">Danger Zone</h3>
                  <p className="text-paper/50 text-sm mb-4">Once you delete your account, there is no going back.</p>
                  <button
                    onClick={() => {
                      const password = prompt('Enter your password to confirm deletion:');
                      if (password) deleteAccountMutation.mutate(password);
                    }}
                    className="btn border border-blood text-blood hover:bg-blood/10 flex items-center gap-2"
                  >
                    <Trash2 size={16} />
                    Delete Account
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
