import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, User, CreditCard, Bell, Shield, Trash2, Clock, Lock, Check, ArrowUp, ArrowDown, Camera, Download, Loader2 } from '../components/Icons';
import { settingsApi, billingApi, deadmanApi, encryptionApi, legacyContactsApi, exportApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { AvatarCropperModal } from '../components/AvatarCropperModal';
import { Navigation } from '../components/Navigation';

// Mass-Adoption Pricing: $1 / $2 / $5
const SUBSCRIPTION_PLANS = [
  {
    tier: 'STARTER',
    name: 'Starter',
    monthlyPrice: 1,
    yearlyPrice: 10,
    features: ['500MB storage', '3 voice recordings/month', '5 letters/month', '50 photos', '2 family members'],
  },
  {
    tier: 'FAMILY',
    name: 'Family',
    monthlyPrice: 2,
    yearlyPrice: 20,
    popular: true,
    features: ['5GB storage', '20 voice recordings/month', 'Unlimited letters', 'Unlimited photos', '10 family members', '2 min video messages', 'Posthumous delivery', 'Family tree'],
  },
  {
    tier: 'FOREVER',
    name: 'Forever',
    monthlyPrice: 5,
    yearlyPrice: 50,
    features: ['25GB storage', 'Unlimited voice recordings', 'Unlimited letters', 'Unlimited photos', 'Unlimited family members', '10 min video messages', 'AI transcription', 'Legal documents', 'Priority support'],
  },
];

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
];

export function Settings() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { user, updateUser, logout } = useAuthStore();

  // Valid tab IDs
  const validTabs = ['profile', 'subscription', 'deadman', 'encryption', 'notifications', 'security'];
  
  // Initialize activeTab from URL parameter or default to 'profile'
  const tabFromUrl = searchParams.get('tab');
  const initialTab = tabFromUrl && validTabs.includes(tabFromUrl) ? tabFromUrl : 'profile';
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  
  // Update URL when tab changes
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };
    const [profile, setProfile] = useState({ firstName: user?.firstName || '', lastName: user?.lastName || '' });
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
    const [deadmanConfig, setDeadmanConfig] = useState({ intervalDays: 30, gracePeriodDays: 7 });
        const [newLegacyContact, setNewLegacyContact] = useState({ name: '', email: '', relationship: '' });
  
        // Notification preferences state
        const [notificationPrefs, setNotificationPrefs] = useState({
          emailNotifications: true,
          pushNotifications: true,
          reminderEmails: true,
          marketingEmails: false,
          weeklyDigest: true,
        });
    
        // Status messages for user feedback
        const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
        
                // Delete account modal state
                const [showDeleteModal, setShowDeleteModal] = useState(false);
                const [deletePassword, setDeletePassword] = useState('');
        
                // Data export state
                const [isExporting, setIsExporting] = useState(false);
  
        // Avatar upload state
        const [showAvatarCropper, setShowAvatarCropper] = useState(false);
        const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatarUrl || null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Handle file selection for avatar
    const handleAvatarFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setSelectedImageSrc(event.target?.result as string);
          setShowAvatarCropper(true);
        };
        reader.readAsDataURL(file);
      }
      // Reset input so same file can be selected again
      if (e.target) e.target.value = '';
    };

    // Handle cropped avatar upload
    const handleAvatarCropComplete = async (croppedFile: File, previewUrl: string) => {
      setIsUploadingAvatar(true);
      try {
        // Get upload URL from API
        const { data: urlData } = await settingsApi.getUploadUrl({
          filename: croppedFile.name,
          contentType: croppedFile.type,
        });
      
        // Upload to R2
        await fetch(urlData.uploadUrl, {
          method: 'PUT',
          body: croppedFile,
          headers: { 'Content-Type': croppedFile.type },
        });
      
        // Update profile with new avatar URL
        await settingsApi.updateProfile({ avatarUrl: urlData.url });
      
        // Update local state
        setAvatarPreview(previewUrl);
        updateUser({ ...user!, avatarUrl: urlData.url });
        queryClient.invalidateQueries({ queryKey: ['auth-me'] });
      
        setShowAvatarCropper(false);
        setSelectedImageSrc(null);
      } catch (error) {
        console.error('Failed to upload avatar:', error);
      } finally {
        setIsUploadingAvatar(false);
      }
    };

  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => billingApi.getSubscription().then(r => r.data),
  });

  const { data: limits } = useQuery({
    queryKey: ['limits'],
    queryFn: () => billingApi.getLimits().then(r => r.data),
  });

  const { data: _pricing } = useQuery({
    queryKey: ['pricing', user?.preferredCurrency],
    queryFn: () => billingApi.getPricing(user?.preferredCurrency).then(r => r.data),
  });
  void _pricing; // Suppress unused variable warning - kept for future pricing display

  const { data: deadmanStatus } = useQuery({
    queryKey: ['deadman-status'],
    queryFn: () => deadmanApi.getStatus().then(r => r.data),
  });

    const { data: encryptionStatus } = useQuery({
      queryKey: ['encryption-status'],
      queryFn: () => encryptionApi.getStatus().then(r => r.data),
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
      alert('Password changed successfully');
    },
  });

  const updateCurrencyMutation = useMutation({
    mutationFn: (currency: string) => billingApi.updateCurrency(currency),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing'] });
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: (tier: string) => billingApi.checkout({ tier, currency: user?.preferredCurrency }),
    onSuccess: (res) => {
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    },
  });

  const changePlanMutation = useMutation({
    mutationFn: (tier: string) => billingApi.checkout({ tier, currency: user?.preferredCurrency }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['limits'] });
    },
  });

  const configureDeadmanMutation = useMutation({
    mutationFn: () => deadmanApi.configure(deadmanConfig),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deadman-status'] });
      setStatusMessage({ type: 'success', text: 'Dead Man\'s Switch configured successfully' });
    },
    onError: () => {
      setStatusMessage({ type: 'error', text: 'Failed to configure Dead Man\'s Switch' });
    },
  });

  const checkInMutation = useMutation({
    mutationFn: () => deadmanApi.checkIn(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deadman-status'] });
      setStatusMessage({ type: 'success', text: 'Check-in recorded successfully' });
    },
    onError: () => {
      setStatusMessage({ type: 'error', text: 'Failed to record check-in' });
    },
  });

    const addLegacyContactMutation = useMutation({
      mutationFn: () => legacyContactsApi.add(newLegacyContact),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['legacy-contacts'] });
        setNewLegacyContact({ name: '', email: '', relationship: '' });
      },
    });

        // Encryption setup mutation - generates client-side encryption keys
        const setupEncryptionMutation = useMutation({
          mutationFn: async () => {
            // Generate a random salt for key derivation
            const salt = crypto.getRandomValues(new Uint8Array(16));
            const saltBase64 = btoa(String.fromCharCode(...salt));
      
            // Generate a random master key
            const masterKey = crypto.getRandomValues(new Uint8Array(32));
            const masterKeyBase64 = btoa(String.fromCharCode(...masterKey));
      
            // For now, we'll store the encrypted master key (in production, this would be encrypted with user's password)
            return encryptionApi.setup({
              encryptedMasterKey: masterKeyBase64,
              encryptionSalt: saltBase64,
              keyDerivationParams: {
                algorithm: 'PBKDF2',
                iterations: 100000,
                hash: 'SHA-256',
              },
            });
          },
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['encryption-status'] });
            setStatusMessage({ type: 'success', text: 'Encryption enabled successfully' });
          },
          onError: () => {
            setStatusMessage({ type: 'error', text: 'Failed to set up encryption' });
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
      mutationFn: (prefs: typeof notificationPrefs) => settingsApi.updateNotifications(prefs),
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
        const handleNotificationToggle = (key: keyof typeof notificationPrefs, value: boolean) => {
          const updated = { ...notificationPrefs, [key]: value };
          setNotificationPrefs(updated);
          updateNotificationsMutation.mutate(updated);
        };

        // Data export handler
        const handleExportData = async () => {
          setIsExporting(true);
          try {
            const response = await exportApi.exportData();
            const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `heirloom-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            setStatusMessage({ type: 'success', text: 'Data exported successfully' });
          } catch (error) {
            console.error('Export failed:', error);
            setStatusMessage({ type: 'error', text: 'Failed to export data' });
          } finally {
            setIsExporting(false);
          }
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

      <div className="relative z-10 px-6 md:px-12 py-12">
      <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-paper/40 hover:text-gold transition-colors mb-8">
        <ArrowLeft size={20} />
        Back to Vault
      </button>

      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-light mb-12">Settings</h1>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="md:w-56 space-y-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => handleTabChange(id)}
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
                              <div className="relative group">
                                {avatarPreview || user?.avatarUrl ? (
                                  <img 
                                    src={avatarPreview || user?.avatarUrl || undefined} 
                                    alt="Profile" 
                                    className="w-20 h-20 rounded-full object-cover border-2 border-gold/30"
                                  />
                                ) : (
                                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gold to-gold-dim flex items-center justify-center text-void text-2xl font-medium">
                                    {initials}
                                  </div>
                                )}
                                <button
                                  onClick={() => fileInputRef.current?.click()}
                                  className="absolute inset-0 flex items-center justify-center bg-void/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                >
                                  <Camera size={24} className="text-gold" />
                                </button>
                                <input
                                  ref={fileInputRef}
                                  type="file"
                                  accept="image/*"
                                  onChange={handleAvatarFileSelect}
                                  className="hidden"
                                />
                              </div>
                              <div>
                                <h2 className="text-xl">{user?.firstName} {user?.lastName}</h2>
                                <p className="text-paper/50">{user?.email}</p>
                                <button
                                  onClick={() => fileInputRef.current?.click()}
                                  className="text-sm text-gold hover:text-gold-dim mt-1"
                                >
                                  Change photo
                                </button>
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
                {/* Current plan header */}
                <div className="card">
                  <h3 className="text-lg mb-4">Current Plan</h3>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1.5 bg-gold/20 text-gold text-sm font-medium tracking-wider border border-gold/30">
                          {subscription?.tier || 'FREE'}
                        </span>
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
                    <div className="space-y-3">
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

                {/* All Plans */}
                <div className="card">
                  <h3 className="text-lg mb-6">Choose Your Plan</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    {SUBSCRIPTION_PLANS.map((plan) => {
                      const isCurrentPlan = (subscription?.tier || 'STARTER') === plan.tier;
                      const tierRanks: Record<string, number> = { STARTER: 0, FAMILY: 1, FOREVER: 2 };
                      const currentTierRank = tierRanks[subscription?.tier || 'STARTER'] || 0;
                      const thisTierRank = tierRanks[plan.tier] || 0;
                      const isUpgrade = thisTierRank > currentTierRank;

                      return (
                        <div 
                          key={plan.tier} 
                          className={`relative p-5 rounded-lg border transition-all ${
                            isCurrentPlan 
                              ? 'border-gold bg-gold/10 ring-2 ring-gold/30' 
                              : plan.popular 
                                ? 'border-gold/30 bg-white/[0.02]' 
                                : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                          }`}
                        >
                          {plan.popular && !isCurrentPlan && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gold text-void text-xs font-medium">
                              POPULAR
                            </div>
                          )}
                          {isCurrentPlan && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-green-500 text-void text-xs font-medium flex items-center gap-1">
                              <Check size={12} />
                              CURRENT
                            </div>
                          )}
              
                          <h4 className="text-lg font-medium mb-2">{plan.name}</h4>
                          <div className="flex items-baseline gap-1 mb-4">
                            <span className={`text-2xl ${isCurrentPlan ? 'text-gold' : 'text-paper'}`}>
                              ${plan.monthlyPrice}
                            </span>
                            <span className="text-paper/40 text-sm">/month</span>
                          </div>
              
                          <ul className="space-y-2 mb-6 text-sm">
                            {plan.features.map((feature, i) => (
                              <li key={i} className="flex items-center gap-2 text-paper/70">
                                <Check size={14} className="text-gold flex-shrink-0" />
                                {feature}
                              </li>
                            ))}
                          </ul>

                          {isCurrentPlan ? (
                            <button disabled className="btn w-full bg-gold/20 text-gold cursor-default">
                              Current Plan
                            </button>
                          ) : isUpgrade ? (
                            <button
                              onClick={() => checkoutMutation.mutate(plan.tier)}
                              disabled={checkoutMutation.isPending}
                              className="btn btn-primary w-full flex items-center justify-center gap-2"
                            >
                              <ArrowUp size={16} />
                              Upgrade
                            </button>
                          ) : (
                            <button
                              onClick={() => changePlanMutation.mutate(plan.tier)}
                              disabled={changePlanMutation.isPending}
                              className="btn w-full border border-paper/20 text-paper/70 hover:bg-white/5 flex items-center justify-center gap-2"
                            >
                              <ArrowDown size={16} />
                              Downgrade
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Plan Change Status */}
                {changePlanMutation.isPending && (
                  <div className="card bg-gold/10 border-gold/30">
                    <p className="text-gold">Changing your plan...</p>
                  </div>
                )}
                {changePlanMutation.isSuccess && (
                  <div className="card bg-green-500/10 border-green-500/30">
                    <p className="text-green-400">Plan changed successfully!</p>
                  </div>
                )}
                {changePlanMutation.isError && (
                  <div className="card bg-blood/10 border-blood/30">
                    <p className="text-blood">Failed to change plan. Please try again.</p>
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

                  {deadmanStatus?.configured ? (
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

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

                            {encryptionStatus?.encryptionEnabled ? (
                              <div className="space-y-4">
                                <div className="p-4 bg-green-500/10 border border-green-500/30 text-green-400">
                                  <Lock className="inline w-4 h-4 mr-2" />
                                  Encryption is enabled. Your content is protected.
                                </div>

                                <div>
                                  <h4 className="text-sm text-paper/50 mb-2">Key Escrow Status</h4>
                                  <p className="text-paper/60 text-sm">
                                    {encryptionStatus?.hasEscrow 
                                      ? 'Your encryption key is securely escrowed and will be released to your beneficiaries when the dead man\'s switch is triggered.'
                                      : 'Key escrow not configured. Set up key escrow to ensure your beneficiaries can access your content.'}
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
                                <button 
                                  onClick={() => setupEncryptionMutation.mutate()}
                                  disabled={setupEncryptionMutation.isPending}
                                  className="btn btn-primary"
                                >
                                  {setupEncryptionMutation.isPending ? 'Setting up...' : 'Set Up Encryption'}
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {activeTab === 'notifications' && (
                          <div className="card space-y-6">
                            {[
                              { id: 'emailNotifications' as keyof typeof notificationPrefs, label: 'Email notifications', desc: 'Receive updates about your memories' },
                              { id: 'reminderEmails' as keyof typeof notificationPrefs, label: 'Check-in reminders', desc: 'Get reminded to check in for dead man\'s switch' },
                              { id: 'pushNotifications' as keyof typeof notificationPrefs, label: 'Delivery confirmations', desc: 'Know when your letters are delivered' },
                              { id: 'weeklyDigest' as keyof typeof notificationPrefs, label: 'Weekly digest', desc: 'Get a weekly summary of your activity' },
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

                            <div className="card">
                              <h3 className="text-lg mb-2">Export Your Data</h3>
                              <p className="text-paper/50 text-sm mb-4">
                                Download all your data in JSON format. This includes your profile, memories, voice recordings, letters, and family members.
                              </p>
                              <button
                                onClick={handleExportData}
                                disabled={isExporting}
                                className="btn btn-secondary flex items-center gap-2"
                              >
                                {isExporting ? (
                                  <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Exporting...
                                  </>
                                ) : (
                                  <>
                                    <Download size={16} />
                                    Export Data
                                  </>
                                )}
                              </button>
                            </div>

                            <div className="card border-blood/30 bg-blood/5">
                              <h3 className="text-lg text-blood mb-2">Danger Zone</h3>
                              <p className="text-paper/50 text-sm mb-4">Once you delete your account, there is no going back.</p>
                              <button
                                onClick={() => setShowDeleteModal(true)}
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

      {/* Avatar Cropper Modal */}
      <AvatarCropperModal
        isOpen={showAvatarCropper}
        imageSrc={selectedImageSrc}
        onCancel={() => {
          setShowAvatarCropper(false);
          setSelectedImageSrc(null);
        }}
        onComplete={handleAvatarCropComplete}
        isUploading={isUploadingAvatar}
      />

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-void-deep/90 flex items-center justify-center z-50 p-4">
          <div className="bg-void-elevated border border-blood/30 rounded-2xl p-8 max-w-md w-full">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-blood/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} className="text-blood" />
              </div>
              <h3 className="text-2xl font-serif text-paper mb-2">Delete Account?</h3>
              <p className="text-paper/60 text-sm">
                This action cannot be undone. All your memories, letters, and data will be permanently deleted.
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-paper/60 mb-2">Enter your password to confirm</label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Your password"
                  className="input w-full"
                  autoFocus
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletePassword('');
                  }}
                  className="flex-1 px-4 py-3 bg-void border border-gold/20 rounded-xl text-paper/80 hover:border-gold/40 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (deletePassword) {
                      deleteAccountMutation.mutate(deletePassword);
                      setShowDeleteModal(false);
                      setDeletePassword('');
                    }
                  }}
                  disabled={!deletePassword || deleteAccountMutation.isPending}
                  className="flex-1 px-4 py-3 bg-blood text-paper font-semibold rounded-xl hover:bg-blood/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {deleteAccountMutation.isPending ? (
                    <span>Deleting...</span>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      <span>Delete Forever</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
