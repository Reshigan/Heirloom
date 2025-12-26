import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Bell, Shield, Clock, Crown, X, Check, Loader2, RefreshCw, Mic, Edit3, Share2, HelpCircle, Sparkles, Gift, Copy, Heart
} from '../components/Icons';
import { useAuthStore } from '../stores/authStore';
import { billingApi, memoriesApi, familyApi, deadmanApi, aiApi, settingsApi, referralApi } from '../services/api';
import { Navigation } from '../components/Navigation';
import { PlatformTour, usePlatformTour } from '../components/PlatformTour';
import { WhatsNewNotification } from '../components/WhatsNewNotification';

// Sanctuary Object Icons as SVG components
const MemoriesIcon = () => (
  <svg viewBox="0 0 72 72" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
    <rect x="8" y="12" width="56" height="48" rx="4"/>
    <circle cx="24" cy="32" r="6" fill="currentColor" fillOpacity="0.3"/>
    <path d="M8 48l16-12 12 8 20-16 8 8"/>
    <rect x="4" y="16" width="56" height="48" rx="4" strokeOpacity="0.3"/>
    <rect x="12" y="8" width="56" height="48" rx="4" strokeOpacity="0.15"/>
  </svg>
);

const LettersIcon = () => (
  <svg viewBox="0 0 72 72" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
    <rect x="8" y="8" width="56" height="56" rx="4"/>
    <path d="M16 24h40M16 34h40M16 44h28" strokeOpacity="0.4"/>
    <path d="M58 52c0-12-8-16-12-16s-10 4-14 12" strokeWidth="2"/>
    <circle cx="58" cy="52" r="2" fill="currentColor"/>
  </svg>
);

const VoiceIcon = () => (
  <svg viewBox="0 0 72 72" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
    <rect x="26" y="8" width="20" height="32" rx="10"/>
    <path d="M14 32v4a22 22 0 0044 0v-4"/>
    <path d="M36 58v8M28 66h16"/>
    <path d="M20 24h8M44 24h8M20 32h8M44 32h8" strokeOpacity="0.4"/>
  </svg>
);

const FamilyIcon = () => (
  <svg viewBox="0 0 72 72" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
    <circle cx="36" cy="16" r="8"/>
    <circle cx="16" cy="52" r="7"/>
    <circle cx="36" cy="52" r="7"/>
    <circle cx="56" cy="52" r="7"/>
    <path d="M36 24v12M36 36l-20 9M36 36l20 9"/>
  </svg>
);

const CornerMark = () => (
  <svg viewBox="0 0 24 24" className="w-full h-full" stroke="currentColor" strokeWidth="1" fill="none">
    <path d="M2 12V2h10"/>
  </svg>
);

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
    const [showTrialWarning, setShowTrialWarning] = useState(true);
    const [showNotifications, setShowNotifications] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [aiPrompt, setAiPrompt] = useState<string | null>(null);
    const [isLoadingPrompt, setIsLoadingPrompt] = useState(false);

    // Platform Tour - use user-scoped key so tour only shows once per user
    const { isOpen: isTourOpen, hasCompletedTour, openTour, closeTour, completeTour } = usePlatformTour(user?.id);

    // Show tour automatically on first visit
    useEffect(() => {
      if (!hasCompletedTour) {
        // Small delay to let the page load first
        const timer = setTimeout(() => openTour(), 1000);
        return () => clearTimeout(timer);
      }
    }, [hasCompletedTour, openTour]);

    // Queries
  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => billingApi.getSubscription().then(r => r.data),
  });

  const { data: rawStats } = useQuery({
    queryKey: ['memories-stats'],
    queryFn: () => memoriesApi.getStats().then(r => r.data),
  });

  const stats = rawStats ? {
    totalMemories: rawStats.total || 0,
    totalLetters: rawStats.byType?.letters || 0,
    totalVoiceMinutes: rawStats.byType?.voice || 0,
  } : undefined;

  const { data: family } = useQuery({
    queryKey: ['family'],
    queryFn: () => familyApi.getAll().then(r => r.data),
  });

  const { data: deadmanStatus } = useQuery({
    queryKey: ['deadman-status'],
    queryFn: () => deadmanApi.getStatus().then(r => r.data),
  });

    const { data: legacyScore } = useQuery({
      queryKey: ['legacy-score'],
      queryFn: () => aiApi.getLegacyScore().then(r => r.data),
    });

        const { data: notificationsData } = useQuery({
          queryKey: ['notifications'],
          queryFn: () => settingsApi.getNotifications().then(r => r.data),
        });

        const { data: referralData } = useQuery({
          queryKey: ['my-referral'],
          queryFn: () => referralApi.getMyReferral().then(r => r.data),
        });

        // Family Echo Inbox - messages from recipients
        const { data: inboxData } = useQuery({
          queryKey: ['inbox'],
          queryFn: () => settingsApi.getInbox().then(r => r.data),
        });

    const [showNewFeaturesNotification, setShowNewFeaturesNotification] = useState(true);

    const newFeaturesNotification = notificationsData?.recentNotifications?.find(
      (n: { type: string; read: boolean }) => n.type === 'NEW_FEATURES_DEC_2024' && !n.read
    );

    const dismissNewFeaturesNotification = async (notificationId: string) => {
      try {
        await settingsApi.markNotificationRead(notificationId);
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        setShowNewFeaturesNotification(false);
      } catch {
        setShowNewFeaturesNotification(false);
      }
    };

    const checkInMutation = useMutation({
    mutationFn: () => deadmanApi.checkIn(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deadman-status'] });
      showToast('Check-in successful', 'success');
    },
  });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Load AI prompt on mount
  useEffect(() => {
    const loadPrompt = async () => {
      setIsLoadingPrompt(true);
      try {
        const response = await aiApi.getPrompt();
        setAiPrompt(response.data?.prompt || "What's a childhood memory that shaped who you are today?");
      } catch {
        setAiPrompt("What's a childhood memory that shaped who you are today?");
      }
      setIsLoadingPrompt(false);
    };
    loadPrompt();
  }, []);

  const refreshPrompt = async () => {
    setIsLoadingPrompt(true);
    try {
      const response = await aiApi.getPrompt();
      setAiPrompt(response.data?.prompt || "What moment are you most grateful for this year?");
    } catch {
      setAiPrompt("What moment are you most grateful for this year?");
    }
    setIsLoadingPrompt(false);
  };

    const isTrialing = subscription?.status === 'TRIALING';
    const trialDaysLeft = subscription?.trialDaysRemaining || 0;
    const familyCount = Array.isArray(family) ? family.length : (family?.data?.length || 0);
    const isGoldLegacy = subscription?.tier === 'FOREVER' || subscription?.billingCycle === 'lifetime';

  // Calculate legacy score percentage
  const scorePercent = legacyScore?.score || 0;
  const scoreTier = typeof legacyScore?.tier === 'object' ? legacyScore.tier.name : (legacyScore?.tier || 'Just Started');
  const scoreTierDescription = typeof legacyScore?.tier === 'object' ? legacyScore.tier.description : legacyScore?.description;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Eternal Background */}
      <div className="eternal-bg">
        <div className="eternal-aura" />
        <div className="eternal-stars" />
        <div className="eternal-mist" />
      </div>

      {/* Floating Particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-gold/30"
            style={{
              width: 2 + Math.random() * 2,
              height: 2 + Math.random() * 2,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 0.5, 0],
            }}
            transition={{
              duration: 15 + Math.random() * 10,
              repeat: Infinity,
              delay: Math.random() * 10,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      <Navigation />

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-xl glass-strong flex items-center gap-3 ${
              toast.type === 'success' ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'
            }`}
          >
            {toast.type === 'success' ? <Check className="text-green-400" size={20} /> : <X className="text-red-400" size={20} />}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Controls */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-20 px-6 md:px-12 pt-20 md:pt-24"
      >
        <div className="flex items-center justify-end max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            {/* Dead Man's Switch Status */}
            {deadmanStatus?.enabled && (
              <motion.button
                onClick={() => checkInMutation.mutate()}
                disabled={checkInMutation.isPending}
                className={`px-4 py-2 rounded-lg glass flex items-center gap-2 text-sm transition-all ${
                  deadmanStatus.needsCheckIn ? 'border border-blood/50 text-blood' : 'text-green-400'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {checkInMutation.isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Shield size={16} />
                )}
                {deadmanStatus.needsCheckIn ? 'Check In Required' : 'Protected'}
              </motion.button>
            )}

            {/* Notifications */}
            <div className="relative">
              <motion.button
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-12 h-12 rounded-full glass flex items-center justify-center text-paper/50 hover:text-paper transition-colors relative border border-paper/10"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Bell size={20} />
                {isTrialing && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-blood rounded-full" />
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

            {/* Trial Warning Banner - Don't show for Gold Legacy members */}
            <AnimatePresence>
              {isTrialing && showTrialWarning && !isGoldLegacy && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="relative z-10 px-6 md:px-12 mt-4"
          >
            <div className="max-w-7xl mx-auto">
              <div className="glass border border-gold/20 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                    <Clock size={20} className="text-gold" />
                  </div>
                  <div>
                    <p className="font-medium">{trialDaysLeft} days left in your trial</p>
                    <p className="text-sm text-paper/50">Upgrade now to keep your memories forever</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <motion.button
                    onClick={() => navigate('/settings?tab=subscription')}
                    className="btn btn-primary btn-sm"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Crown size={16} />
                    Upgrade
                  </motion.button>
                  <button
                    onClick={() => setShowTrialWarning(false)}
                    className="text-paper/40 hover:text-paper transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
              )}
            </AnimatePresence>

            {/* New Features Notification Banner */}
            <AnimatePresence>
              {newFeaturesNotification && showNewFeaturesNotification && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="relative z-10 px-6 md:px-12 mt-4"
                >
                  <div className="max-w-7xl mx-auto">
                    <div className="glass border border-gold/30 rounded-xl p-4 flex items-center justify-between bg-gradient-to-r from-gold/10 to-transparent">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                          <Sparkles size={20} className="text-gold" />
                        </div>
                        <div>
                          <p className="font-medium text-gold">New Features Available!</p>
                          <p className="text-sm text-paper/60">Legacy Playbook, Story Artifacts, Life Events & more</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <motion.button
                          onClick={() => openTour()}
                          className="btn btn-primary btn-sm"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <HelpCircle size={16} />
                          Take Tour
                        </motion.button>
                        <button
                          onClick={() => dismissNewFeaturesNotification(newFeaturesNotification.id)}
                          className="text-paper/40 hover:text-paper transition-colors"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="relative z-10 px-6 md:px-12 py-8 md:py-16 max-w-[1400px] mx-auto">
        
              {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16 md:mb-20"
        >
          <p className="text-sm tracking-[0.2em] text-paper/50 uppercase mb-4">Your Sanctuary Awaits</p>
                    <h1 className="font-display text-4xl md:text-5xl font-normal tracking-wide mb-5">
                      Welcome back, <em className="font-body italic text-gold">{user?.firstName || 'Friend'}</em>
                    </h1>
                    {isGoldLegacy && (
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4" style={{
                        background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(184, 134, 11, 0.1) 100%)',
                        border: '1px solid rgba(212, 175, 55, 0.4)',
                      }}>
                        <span className="text-lg" style={{ color: '#D4AF37' }}>∞</span>
                        <span className="text-sm font-medium tracking-wider" style={{ color: '#D4AF37' }}>GOLD LEGACY MEMBER</span>
                      </div>
                    )}
          <p className="text-paper/50 text-lg font-light max-w-lg mx-auto mb-6">
            Every moment you preserve becomes eternal. What will you create today?
          </p>
          
          <motion.button
            onClick={() => navigate('/quick')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gold text-void font-medium hover:bg-gold/90 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Sparkles size={18} />
            Leave a 60-Second Message
          </motion.button>
        </motion.section>

        {/* Sanctuary Grid - Four Sacred Objects */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          className="mb-16 md:mb-20"
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {/* Memories */}
            <motion.button
              onClick={() => navigate('/memories')}
              className="sanctuary-object group"
              whileHover={{ y: -8 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="sanctuary-corner sanctuary-corner--tl"><CornerMark /></div>
              <div className="sanctuary-corner sanctuary-corner--tr"><CornerMark /></div>
              <div className="sanctuary-corner sanctuary-corner--bl"><CornerMark /></div>
              <div className="sanctuary-corner sanctuary-corner--br"><CornerMark /></div>
              <div className="sanctuary-content">
                <div className="sanctuary-symbol text-gold group-hover:scale-110 transition-transform duration-500">
                  <MemoriesIcon />
                </div>
                <h3 className="sanctuary-title group-hover:text-gold transition-colors">Memories</h3>
                <p className="sanctuary-count">{stats?.totalMemories || 0} preserved</p>
              </div>
            </motion.button>

            {/* Letters */}
            <motion.button
              onClick={() => navigate('/compose')}
              className="sanctuary-object group"
              whileHover={{ y: -8 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="sanctuary-corner sanctuary-corner--tl"><CornerMark /></div>
              <div className="sanctuary-corner sanctuary-corner--tr"><CornerMark /></div>
              <div className="sanctuary-corner sanctuary-corner--bl"><CornerMark /></div>
              <div className="sanctuary-corner sanctuary-corner--br"><CornerMark /></div>
              <div className="sanctuary-content">
                <div className="sanctuary-symbol text-gold group-hover:scale-110 transition-transform duration-500">
                  <LettersIcon />
                </div>
                <h3 className="sanctuary-title group-hover:text-gold transition-colors">Letters</h3>
                <p className="sanctuary-count">{stats?.totalLetters || 0} written</p>
              </div>
            </motion.button>

            {/* Voice */}
            <motion.button
              onClick={() => navigate('/record')}
              className="sanctuary-object group"
              whileHover={{ y: -8 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="sanctuary-corner sanctuary-corner--tl"><CornerMark /></div>
              <div className="sanctuary-corner sanctuary-corner--tr"><CornerMark /></div>
              <div className="sanctuary-corner sanctuary-corner--bl"><CornerMark /></div>
              <div className="sanctuary-corner sanctuary-corner--br"><CornerMark /></div>
              <div className="sanctuary-content">
                <div className="sanctuary-symbol text-gold group-hover:scale-110 transition-transform duration-500">
                  <VoiceIcon />
                </div>
                <h3 className="sanctuary-title group-hover:text-gold transition-colors">Voice</h3>
                <p className="sanctuary-count">{stats?.totalVoiceMinutes || 0} minutes</p>
              </div>
            </motion.button>

            {/* Family */}
            <motion.button
              onClick={() => navigate('/family')}
              className="sanctuary-object group"
              whileHover={{ y: -8 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="sanctuary-corner sanctuary-corner--tl"><CornerMark /></div>
              <div className="sanctuary-corner sanctuary-corner--tr"><CornerMark /></div>
              <div className="sanctuary-corner sanctuary-corner--bl"><CornerMark /></div>
              <div className="sanctuary-corner sanctuary-corner--br"><CornerMark /></div>
              <div className="sanctuary-content">
                <div className="sanctuary-symbol text-gold group-hover:scale-110 transition-transform duration-500">
                  <FamilyIcon />
                </div>
                <h3 className="sanctuary-title group-hover:text-gold transition-colors">Family</h3>
                <p className="sanctuary-count">{familyCount} connected</p>
              </div>
            </motion.button>
          </div>
        </motion.section>

        {/* Legacy Score Section */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
          className="mb-16 md:mb-20"
        >
          <div className="legacy-card">
            {/* Share Button */}
            <button className="legacy-share">
              <Share2 size={18} />
            </button>

            {/* Legacy Orb with Ring */}
            <div className="legacy-orb">
              <div className="legacy-orb-glow" />
              <div className="legacy-ring-container">
                <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
                  <defs>
                    <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#e8c878"/>
                      <stop offset="100%" stopColor="#9c7a3c"/>
                    </linearGradient>
                  </defs>
                  <circle 
                    cx="80" cy="80" r="70" 
                    fill="none" 
                    stroke="rgba(235, 230, 220, 0.08)" 
                    strokeWidth="3"
                  />
                  <circle 
                    cx="80" cy="80" r="70" 
                    fill="none" 
                    stroke="url(#goldGradient)" 
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray="440"
                    strokeDashoffset={440 - (440 * scorePercent) / 100}
                    className="transition-all duration-1000 ease-out"
                    style={{ filter: 'drop-shadow(0 0 8px rgba(212, 168, 83, 0.4))' }}
                  />
                </svg>
              </div>
              <div className="legacy-value">
                <span className="font-display text-4xl md:text-5xl tracking-wide">{scorePercent}</span>
                <span className="text-xs tracking-[0.2em] text-paper/50 uppercase mt-1">Score</span>
              </div>
            </div>

            {/* Legacy Info */}
            <div className="legacy-info">
              <div className="legacy-tier">
                <div className="legacy-tier-badge">
                  <Shield size={24} />
                </div>
                <span className="legacy-tier-name">{scoreTier}</span>
              </div>
              <p className="legacy-desc">
                {scoreTierDescription || 'Continue preserving memories to build your legacy and unlock new tiers.'}
              </p>
            </div>
          </div>
        </motion.section>

        {/* For The People You Love - Viral Driver Features with Emotional Appeal */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.45 }}
          className="mb-16 md:mb-20"
        >
          <div className="text-center mb-8">
            <h2 className="font-display text-xl md:text-2xl tracking-wide text-gold mb-2">For the People You Love Most</h2>
            <p className="text-sm text-paper/50 max-w-lg mx-auto">These tools help you leave something real behind—stories, voice, and presence for the moments that matter.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.button
              onClick={() => navigate('/legacy-plan')}
              className="glass rounded-xl p-5 md:p-6 text-left hover:bg-paper/5 transition-all group border border-blue-500/20 hover:border-blue-500/40"
              whileHover={{ y: -4 }}
            >
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 mb-3 group-hover:scale-110 transition-transform">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 md:w-6 md:h-6">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                </svg>
              </div>
              <h3 className="font-medium text-sm md:text-base mb-1 group-hover:text-gold transition-colors">Make Sure They Don't Lose Your Stories</h3>
              <p className="text-xs text-paper/50 mb-2 italic">A simple plan for the memories your family will one day wish they had.</p>
              <p className="text-xs text-paper/40">In 10 minutes, choose the people and moments that matter most. Start by picking one person you love, then add 3 stories they should know.</p>
              <span className="inline-block mt-3 text-xs text-blue-400 group-hover:text-blue-300">Start my plan →</span>
            </motion.button>

            <motion.button
              onClick={() => navigate('/story-artifacts')}
              className="glass rounded-xl p-5 md:p-6 text-left hover:bg-paper/5 transition-all group border border-pink-500/20 hover:border-pink-500/40"
              whileHover={{ y: -4 }}
            >
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-pink-500/20 flex items-center justify-center text-pink-400 mb-3 group-hover:scale-110 transition-transform">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 md:w-6 md:h-6">
                  <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>
                  <path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5"/>
                </svg>
              </div>
              <h3 className="font-medium text-sm md:text-base mb-1 group-hover:text-gold transition-colors">Turn Memories Into Something They Can Rewatch</h3>
              <p className="text-xs text-paper/50 mb-2 italic">A tribute they can keep—your voice, your photos, your meaning.</p>
              <p className="text-xs text-paper/40">Choose a theme (Childhood, Love, Lessons) and we'll help you weave memories into a short film. Start with 5 photos and one voice note.</p>
              <span className="inline-block mt-3 text-xs text-pink-400 group-hover:text-pink-300">Create a tribute →</span>
            </motion.button>

            <motion.button
              onClick={() => navigate('/life-events')}
              className="glass rounded-xl p-5 md:p-6 text-left hover:bg-paper/5 transition-all group border border-yellow-500/20 hover:border-yellow-500/40"
              whileHover={{ y: -4 }}
            >
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-yellow-500/20 flex items-center justify-center text-yellow-400 mb-3 group-hover:scale-110 transition-transform">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 md:w-6 md:h-6">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <path d="M16 2v4M8 2v4M3 10h18"/>
                  <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>
                </svg>
              </div>
              <h3 className="font-medium text-sm md:text-base mb-1 group-hover:text-gold transition-colors">Be Present for Milestones—Even Years From Now</h3>
              <p className="text-xs text-paper/50 mb-2 italic">For the days you can't predict, but your love should still arrive.</p>
              <p className="text-xs text-paper/40">Record messages for graduations, weddings, first jobs, hard days. Start with one milestone and write a 2–3 sentence note.</p>
              <span className="inline-block mt-3 text-xs text-yellow-400 group-hover:text-yellow-300">Set a milestone message →</span>
            </motion.button>

            <motion.button
              onClick={() => navigate('/recipient-experience')}
              className="glass rounded-xl p-5 md:p-6 text-left hover:bg-paper/5 transition-all group border border-purple-500/20 hover:border-purple-500/40"
              whileHover={{ y: -4 }}
            >
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 mb-3 group-hover:scale-110 transition-transform">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 md:w-6 md:h-6">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                </svg>
              </div>
              <h3 className="font-medium text-sm md:text-base mb-1 group-hover:text-gold transition-colors">Invite Family to Help You Remember</h3>
              <p className="text-xs text-paper/50 mb-2 italic">Because the people you love carry pieces of your story too.</p>
              <p className="text-xs text-paper/40">Create a shared space where family can add photos, stories, and voice notes. Start by inviting one person who would love to contribute.</p>
              <span className="inline-block mt-3 text-xs text-purple-400 group-hover:text-purple-300">Invite someone →</span>
            </motion.button>
          </div>
        </motion.section>

        {/* Family Echo Inbox - Messages from Recipients */}
        {inboxData && inboxData.messages && inboxData.messages.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.48 }}
            className="mb-16 md:mb-20"
          >
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500/20 border border-pink-500/30 mb-3">
                <Heart size={16} className="text-pink-400" />
                <span className="text-sm text-pink-300">
                  {inboxData.unreadCount > 0 ? `${inboxData.unreadCount} new` : ''} Notes from Family
                </span>
              </div>
              <h2 className="font-display text-xl md:text-2xl tracking-wide text-gold">Your Family Responded</h2>
              <p className="text-sm text-paper/50 max-w-lg mx-auto mt-2">
                The people you love have sent you notes about the memories you've shared.
              </p>
            </div>
            <div className="space-y-4 max-w-2xl mx-auto">
              {inboxData.messages.slice(0, 3).map((msg: any) => (
                <motion.div
                  key={msg.id}
                  className={`glass rounded-xl p-5 border transition-all ${
                    !msg.read_at ? 'border-pink-500/30 bg-pink-500/5' : 'border-paper/10'
                  }`}
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500/30 to-purple-500/30 flex items-center justify-center text-lg font-medium flex-shrink-0">
                      {msg.sender_name?.[0] || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{msg.sender_name}</span>
                        {msg.sender_relationship && (
                          <span className="text-xs text-paper/40">({msg.sender_relationship})</span>
                        )}
                        {!msg.read_at && (
                          <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 text-xs">New</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        {msg.reaction_type === 'THANK_YOU' && (
                          <span className="text-sm text-gold">Thank You</span>
                        )}
                        {msg.reaction_type === 'LOVE_THIS' && (
                          <span className="text-sm text-pink-400">I Love This</span>
                        )}
                        {msg.reaction_type === 'REMEMBER_THIS' && (
                          <span className="text-sm text-purple-400">I Remember This Too</span>
                        )}
                        {msg.reaction_type === 'CUSTOM' && (
                          <span className="text-sm text-paper/50">Sent a note</span>
                        )}
                      </div>
                      {msg.message && (
                        <p className="text-paper/70 text-sm italic">"{msg.message}"</p>
                      )}
                      <p className="text-xs text-paper/30 mt-2">
                        {new Date(msg.created_at).toLocaleDateString('en-US', { 
                          month: 'short', day: 'numeric', year: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
              {inboxData.messages.length > 3 && (
                <button
                  onClick={() => navigate('/settings?tab=inbox')}
                  className="w-full py-3 glass rounded-xl text-center text-paper/60 hover:text-gold transition-colors"
                >
                  View all {inboxData.messages.length} messages
                </button>
              )}
            </div>
          </motion.section>
        )}

        {/* Share & Earn Section - Referral Widget */}
        {referralData && (
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
            className="mb-16 md:mb-20"
          >
            <div className="glass rounded-xl p-6 md:p-8 border border-gold/20">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                  <Gift size={32} className="text-gold" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-xl font-medium mb-2">Share Heirloom, Get Rewarded</h3>
                  <p className="text-paper/50 text-sm mb-4">
                    For every friend who joins using your link, you both get an extra month free. 
                    Help families preserve their memories while extending your own subscription.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 bg-void-elevated rounded-lg border border-paper/10">
                      <span className="text-gold font-mono text-sm">{referralData.url || `https://heirloom.blue/signup?ref=${referralData.code}`}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(referralData.url || `https://heirloom.blue/signup?ref=${referralData.code}`);
                          showToast('Link copied!', 'success');
                        }}
                        className="text-paper/50 hover:text-gold transition-colors"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const url = referralData.url || `https://heirloom.blue/signup?ref=${referralData.code}`;
                          const text = "I've been using Heirloom to preserve my family's memories. Join me and we both get an extra month free!";
                          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
                          referralApi.trackShare('twitter');
                        }}
                        className="px-3 py-2 rounded-lg bg-[#1DA1F2]/20 text-[#1DA1F2] hover:bg-[#1DA1F2]/30 transition-colors text-sm"
                      >
                        Twitter
                      </button>
                      <button
                        onClick={() => {
                          const url = referralData.url || `https://heirloom.blue/signup?ref=${referralData.code}`;
                          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
                          referralApi.trackShare('facebook');
                        }}
                        className="px-3 py-2 rounded-lg bg-[#4267B2]/20 text-[#4267B2] hover:bg-[#4267B2]/30 transition-colors text-sm"
                      >
                        Facebook
                      </button>
                      <button
                        onClick={() => {
                          const url = referralData.url || `https://heirloom.blue/signup?ref=${referralData.code}`;
                          const text = "I've been using Heirloom to preserve my family's memories. Join me and we both get an extra month free!";
                          window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
                          referralApi.trackShare('whatsapp');
                        }}
                        className="px-3 py-2 rounded-lg bg-[#25D366]/20 text-[#25D366] hover:bg-[#25D366]/30 transition-colors text-sm"
                      >
                        WhatsApp
                      </button>
                    </div>
                  </div>
                </div>
                {referralData.conversions > 0 && (
                  <div className="text-center px-6 py-4 bg-gold/10 rounded-lg">
                    <div className="text-3xl font-light text-gold">{referralData.conversions}</div>
                    <div className="text-xs text-paper/50">Friends joined</div>
                  </div>
                )}
              </div>
            </div>
          </motion.section>
        )}

        {/* Reflection Card - AI Prompt */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
          className="mb-16 md:mb-20"
        >
          <div className="reflection-card">
            {/* Decorative top line */}
            <div className="absolute top-0 left-12 right-12 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
            
            <div className="reflection-header">
              <div className="reflection-icon">
                <svg viewBox="0 0 24 24" className="w-6 h-6" stroke="currentColor" strokeWidth="1.5" fill="none">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                  <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.3"/>
                </svg>
              </div>
              <div className="reflection-meta">
                <h3 className="font-display text-sm tracking-[0.12em] uppercase">Today's Reflection</h3>
                <p className="text-xs text-paper/50 mt-1">Personalized by Heirloom AI</p>
              </div>
            </div>

            <p className="reflection-prompt">
              {isLoadingPrompt ? (
                <span className="text-paper/50">Loading your personalized prompt...</span>
              ) : (
                `"${aiPrompt}"`
              )}
            </p>

            <div className="reflection-actions">
              <motion.button
                onClick={() => navigate('/record')}
                className="btn btn-record"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="pulse-dot" />
                <Mic size={16} />
                Record Answer
              </motion.button>
              <motion.button
                onClick={() => navigate('/compose')}
                className="btn btn-secondary"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Edit3 size={16} />
                Write Instead
              </motion.button>
              <motion.button
                onClick={refreshPrompt}
                disabled={isLoadingPrompt}
                className="btn btn-ghost"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <RefreshCw size={16} className={isLoadingPrompt ? 'animate-spin' : ''} />
                New Prompt
              </motion.button>
            </div>
          </div>
        </motion.section>

      </main>

      {/* Help/Tour Button - Fixed position */}
      <motion.button
        onClick={openTour}
        className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full glass flex items-center justify-center text-gold hover:text-gold/80 transition-colors border border-gold/30 hover:border-gold/50"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        title="Take a tour"
      >
        <HelpCircle size={24} />
      </motion.button>

      {/* Platform Tour Modal */}
      <PlatformTour
        isOpen={isTourOpen}
        onClose={closeTour}
        onComplete={completeTour}
      />

      {/* What's New Notification */}
      <WhatsNewNotification />
    </div>
  );
}
