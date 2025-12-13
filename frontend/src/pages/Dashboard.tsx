import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Shield, Crown, ChevronRight, X, Check, Loader2,
  Settings, LogOut, Bell
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { billingApi, memoriesApi, familyApi, deadmanApi } from '../services/api';

export function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const queryClient = useQueryClient();
  const sanctuaryRef = useRef<HTMLDivElement>(null);
  
  const [showTrialWarning, setShowTrialWarning] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Mouse tracking for global parallax
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // Smooth parallax transforms
  const parallaxX = useSpring(useTransform(mouseX, [-500, 500], [15, -15]), { stiffness: 50, damping: 30 });
  const parallaxY = useSpring(useTransform(mouseY, [-300, 300], [10, -10]), { stiffness: 50, damping: 30 });

  // Queries
  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => billingApi.getSubscription().then(r => r.data),
  });

  const { data: limits } = useQuery({
    queryKey: ['limits'],
    queryFn: () => billingApi.getLimits().then(r => r.data),
  });

  const { data: stats } = useQuery({
    queryKey: ['memories-stats'],
    queryFn: () => memoriesApi.getStats().then(r => r.data),
  });

  const { data: family } = useQuery({
    queryKey: ['family'],
    queryFn: () => familyApi.getAll().then(r => r.data),
  });

  const { data: deadmanStatus } = useQuery({
    queryKey: ['deadman-status'],
    queryFn: () => deadmanApi.getStatus().then(r => r.data),
  });

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

  // Mouse move handler
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      mouseX.set(e.clientX - centerX);
      mouseY.set(e.clientY - centerY);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const isTrialing = subscription?.status === 'TRIALING';
  const trialDaysLeft = subscription?.trialDaysRemaining || 0;

  // Card data for the sanctuary items
  const sanctuaryItems = [
    {
      id: 'memories',
      title: 'Memory Vault',
      subtitle: `${stats?.totalMemories || 0} treasures preserved`,
      icon: '📷',
      gradient: 'from-amber-900/40 via-amber-800/20 to-transparent',
      accent: '#c9a959',
      path: '/memories',
      description: 'Your photographs and precious moments',
    },
    {
      id: 'compose',
      title: 'Letters',
      subtitle: `${stats?.totalLetters || 0} sealed across time`,
      icon: '✉️',
      gradient: 'from-rose-900/30 via-rose-800/15 to-transparent',
      accent: '#8b2942',
      path: '/compose',
      description: 'Words waiting for their perfect moment',
    },
    {
      id: 'voice',
      title: 'Voice Archive',
      subtitle: `${stats?.totalRecordings || 0} stories captured`,
      icon: '🎙️',
      gradient: 'from-emerald-900/30 via-emerald-800/15 to-transparent',
      accent: '#2d5a4a',
      path: '/record',
      description: 'Your voice, echoing through generations',
    },
    {
      id: 'family',
      title: 'Family Tree',
      subtitle: `${family?.length || 0} souls connected`,
      icon: '🌳',
      gradient: 'from-blue-900/30 via-blue-800/15 to-transparent',
      accent: '#3d5a80',
      path: '/family',
      description: 'The constellation of your lineage',
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#05070a]">
      
      {/* ============ IMMERSIVE BACKGROUND LAYERS ============ */}
      
      {/* Deep space base */}
      <div className="fixed inset-0 bg-gradient-to-b from-[#0a0c12] via-[#080a0f] to-[#05070a]" />
      
      {/* Volumetric fog layers */}
      <motion.div 
        className="fixed inset-0 pointer-events-none"
        style={{ x: parallaxX, y: parallaxY }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(201,169,89,0.08),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_80%_20%,rgba(139,41,66,0.05),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_20%_80%,rgba(45,90,74,0.04),transparent_50%)]" />
      </motion.div>

      {/* Animated nebula clouds */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute w-[800px] h-[600px] -top-40 -left-40"
          style={{
            background: 'radial-gradient(circle, rgba(201,169,89,0.03) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
          animate={{
            x: [0, 100, 50, 0],
            y: [0, 50, 100, 0],
            scale: [1, 1.2, 1.1, 1],
          }}
          transition={{ duration: 60, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute w-[600px] h-[600px] -bottom-40 -right-20"
          style={{
            background: 'radial-gradient(circle, rgba(139,41,66,0.04) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
          animate={{
            x: [0, -80, -40, 0],
            y: [0, -60, -30, 0],
            scale: [1, 1.15, 1.05, 1],
          }}
          transition={{ duration: 45, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Star field - multiple layers for depth */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(80)].map((_, i) => (
          <motion.div
            key={`star-${i}`}
            className="absolute rounded-full"
            style={{
              width: Math.random() > 0.9 ? 2 : 1,
              height: Math.random() > 0.9 ? 2 : 1,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: i % 5 === 0 ? '#c9a959' : 'rgba(245,243,238,0.6)',
            }}
            animate={{
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>

      {/* Floating golden particles */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            className="absolute w-1 h-1 rounded-full bg-gold/40"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -200, 0],
              x: [0, Math.random() * 100 - 50, 0],
              opacity: [0, 0.6, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 15 + Math.random() * 20,
              repeat: Infinity,
              delay: Math.random() * 15,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Central light beam from above */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1px] h-[60vh] pointer-events-none">
        <div className="w-full h-full bg-gradient-to-b from-gold/20 via-gold/5 to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-[radial-gradient(ellipse,rgba(201,169,89,0.1),transparent_70%)] blur-2xl" />
      </div>

      {/* ============ TOAST NOTIFICATION ============ */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-2xl backdrop-blur-xl border ${
              toast.type === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/30' 
                : 'bg-red-500/10 border-red-500/30'
            } flex items-center gap-3 shadow-2xl`}
          >
            {toast.type === 'success' ? (
              <Check className="text-emerald-400" size={20} />
            ) : (
              <X className="text-red-400" size={20} />
            )}
            <span className="text-paper/90">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============ HEADER ============ */}
      <motion.header
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative z-20 px-6 md:px-12 py-6"
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Logo */}
          <motion.div 
            className="flex items-center gap-4 cursor-pointer group"
            onClick={() => navigate('/dashboard')}
            whileHover={{ scale: 1.02 }}
          >
            <div className="relative">
              <motion.span 
                className="text-4xl text-gold block"
                animate={{ 
                  rotate: 360,
                  textShadow: [
                    '0 0 20px rgba(201,169,89,0.3)',
                    '0 0 40px rgba(201,169,89,0.5)',
                    '0 0 20px rgba(201,169,89,0.3)',
                  ],
                }}
                transition={{ 
                  rotate: { duration: 30, repeat: Infinity, ease: 'linear' },
                  textShadow: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
                }}
              >
                ∞
              </motion.span>
              <div className="absolute inset-0 blur-xl bg-gold/20 rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div>
              <span className="text-xl tracking-[0.2em] text-paper/90 font-light">HEIRLOOM</span>
              <div className="h-px w-0 group-hover:w-full bg-gradient-to-r from-gold to-transparent transition-all duration-500" />
            </div>
          </motion.div>

          {/* Header Actions */}
          <div className="flex items-center gap-3">
            {/* Dead Man's Switch Status */}
            {deadmanStatus?.enabled && (
              <motion.button
                onClick={() => checkInMutation.mutate()}
                disabled={checkInMutation.isPending}
                className={`px-4 py-2 rounded-xl backdrop-blur-md border transition-all flex items-center gap-2 text-sm ${
                  deadmanStatus.needsCheckIn 
                    ? 'bg-blood/10 border-blood/40 text-blood hover:bg-blood/20' 
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {checkInMutation.isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Shield size={16} />
                )}
                <span className="hidden sm:inline">
                  {deadmanStatus.needsCheckIn ? 'Check In' : 'Protected'}
                </span>
              </motion.button>
            )}

            {/* Notifications */}
            <motion.button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-3 rounded-xl backdrop-blur-md bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Bell size={18} className="text-paper/70" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-gold rounded-full animate-pulse" />
            </motion.button>

            {/* Settings */}
            <motion.button
              onClick={() => navigate('/settings')}
              className="p-3 rounded-xl backdrop-blur-md bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
              whileHover={{ scale: 1.05, rotate: 90 }}
              whileTap={{ scale: 0.95 }}
            >
              <Settings size={18} className="text-paper/70" />
            </motion.button>

            {/* Logout */}
            <motion.button
              onClick={logout}
              className="p-3 rounded-xl backdrop-blur-md bg-white/5 border border-white/10 hover:bg-blood/20 hover:border-blood/30 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <LogOut size={18} className="text-paper/70" />
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* ============ TRIAL WARNING BANNER ============ */}
      <AnimatePresence>
        {isTrialing && showTrialWarning && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="relative z-10 mx-6 md:mx-12 mb-6"
          >
            <div className="max-w-7xl mx-auto">
              <div className="relative overflow-hidden rounded-2xl backdrop-blur-xl bg-gradient-to-r from-gold/10 via-gold/5 to-transparent border border-gold/20">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_left,rgba(201,169,89,0.1),transparent_50%)]" />
                <div className="relative px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-xl bg-gold/20">
                      <Crown className="text-gold" size={20} />
                    </div>
                    <div>
                      <p className="text-paper/90 font-medium">
                        {trialDaysLeft} days remaining in your trial
                      </p>
                      <p className="text-paper/50 text-sm">
                        Unlock unlimited storage and premium features
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <motion.button
                      onClick={() => navigate('/settings?tab=billing')}
                      className="px-5 py-2 rounded-xl bg-gold text-void font-medium text-sm hover:bg-gold-bright transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Upgrade Now
                    </motion.button>
                    <button
                      onClick={() => setShowTrialWarning(false)}
                      className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <X size={16} className="text-paper/50" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============ MAIN CONTENT ============ */}
      <main className="relative z-10 px-6 md:px-12 pb-12">
        <div className="max-w-7xl mx-auto">
          
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center mb-16"
          >
            <motion.h1 
              className="text-4xl md:text-6xl font-light mb-4 tracking-tight"
              style={{
                background: 'linear-gradient(135deg, #f5f3ee 0%, #c9a959 50%, #f5f3ee 100%)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
              animate={{
                backgroundPosition: ['0% center', '200% center'],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            >
              Welcome back, {user?.firstName || 'Friend'}
            </motion.h1>
            <p className="text-paper/40 text-lg">Your sanctuary awaits</p>
            
            {/* Decorative line */}
            <motion.div 
              className="mt-8 mx-auto w-32 h-px"
              style={{
                background: 'linear-gradient(90deg, transparent, #c9a959, transparent)',
              }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
            />
          </motion.div>

          {/* ============ SANCTUARY CARDS GRID ============ */}
          <motion.div
            ref={sanctuaryRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12"
            style={{ perspective: '2000px' }}
          >
            {sanctuaryItems.map((item, index) => (
              <motion.button
                key={item.id}
                onClick={() => navigate(item.path)}
                onMouseEnter={() => setHoveredCard(item.id)}
                onMouseLeave={() => setHoveredCard(null)}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                className="group relative text-left"
                style={{
                  transformStyle: 'preserve-3d',
                }}
                whileHover={{ 
                  scale: 1.02,
                  rotateX: -2,
                  rotateY: index % 2 === 0 ? 2 : -2,
                  z: 50,
                }}
              >
                {/* Card */}
                <div 
                  className="relative overflow-hidden rounded-3xl p-8 min-h-[240px] transition-all duration-500"
                  style={{
                    background: `linear-gradient(135deg, rgba(20,22,30,0.9) 0%, rgba(12,14,20,0.95) 100%)`,
                    border: '1px solid rgba(255,255,255,0.06)',
                    boxShadow: hoveredCard === item.id 
                      ? `0 30px 80px -20px rgba(0,0,0,0.8), 0 0 0 1px ${item.accent}30, inset 0 1px 0 rgba(255,255,255,0.05)`
                      : '0 20px 60px -20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.03)',
                  }}
                >
                  {/* Gradient overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-60 group-hover:opacity-100 transition-opacity duration-500`} />
                  
                  {/* Animated border glow */}
                  <motion.div
                    className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: `linear-gradient(135deg, ${item.accent}20, transparent, ${item.accent}10)`,
                    }}
                  />
                  
                  {/* Shine effect */}
                  <motion.div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100"
                    style={{
                      background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.03) 45%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.03) 55%, transparent 60%)',
                    }}
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '100%' }}
                    transition={{ duration: 0.8 }}
                  />

                  {/* Content */}
                  <div className="relative z-10 h-full flex flex-col">
                    {/* Icon */}
                    <motion.div 
                      className="text-5xl mb-6"
                      animate={hoveredCard === item.id ? { 
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0],
                      } : {}}
                      transition={{ duration: 0.5 }}
                    >
                      {item.icon}
                    </motion.div>
                    
                    {/* Title */}
                    <h3 
                      className="text-2xl font-light mb-2 transition-colors duration-300"
                      style={{ color: hoveredCard === item.id ? item.accent : '#f5f3ee' }}
                    >
                      {item.title}
                    </h3>
                    
                    {/* Description */}
                    <p className="text-paper/40 text-sm mb-4 line-clamp-2">
                      {item.description}
                    </p>
                    
                    {/* Stats */}
                    <div className="mt-auto flex items-center justify-between">
                      <span className="text-paper/60 text-sm">{item.subtitle}</span>
                      <motion.div
                        className="flex items-center gap-1 text-sm"
                        style={{ color: item.accent }}
                        animate={hoveredCard === item.id ? { x: [0, 5, 0] } : {}}
                        transition={{ duration: 0.5, repeat: hoveredCard === item.id ? Infinity : 0 }}
                      >
                        Enter <ChevronRight size={16} />
                      </motion.div>
                    </div>
                  </div>

                  {/* Corner accent */}
                  <div 
                    className="absolute top-0 right-0 w-32 h-32 opacity-20 group-hover:opacity-40 transition-opacity"
                    style={{
                      background: `radial-gradient(circle at top right, ${item.accent}, transparent 70%)`,
                    }}
                  />
                </div>
              </motion.button>
            ))}
          </motion.div>

          {/* ============ BOTTOM STATS ROW ============ */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {/* Storage Card */}
            <div className="relative overflow-hidden rounded-2xl p-6 backdrop-blur-xl bg-white/[0.02] border border-white/[0.05]">
              <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-paper/60 font-light">Storage</h3>
                  <span className="text-xs px-3 py-1 rounded-full bg-gold/10 text-gold border border-gold/20">
                    {subscription?.tier || 'Trial'}
                  </span>
                </div>
                
                {/* Progress bar */}
                <div className="h-2 rounded-full bg-white/5 overflow-hidden mb-3">
                  <motion.div 
                    className="h-full rounded-full"
                    style={{
                      background: 'linear-gradient(90deg, #c9a959, #e8d5a3)',
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${limits?.storageUsedPercent || 0}%` }}
                    transition={{ duration: 1, delay: 0.8 }}
                  />
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-paper/40">{limits?.storageUsedMB || 0} MB used</span>
                  <span className="text-paper/60">{limits?.storageLimitMB || 100} MB</span>
                </div>
              </div>
            </div>

            {/* Protection Status Card */}
            <div className="relative overflow-hidden rounded-2xl p-6 backdrop-blur-xl bg-white/[0.02] border border-white/[0.05]">
              <div className={`absolute inset-0 bg-gradient-to-br ${deadmanStatus?.enabled ? 'from-emerald-500/5' : 'from-paper/5'} to-transparent`} />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-paper/60 font-light">Protection</h3>
                  <Shield 
                    size={20} 
                    className={deadmanStatus?.enabled ? 'text-emerald-400' : 'text-paper/30'} 
                  />
                </div>
                
                {deadmanStatus?.enabled ? (
                  <>
                    <p className="text-emerald-400 font-medium mb-2">Active</p>
                    <p className="text-sm text-paper/40">
                      Next check-in: {deadmanStatus.nextCheckIn 
                        ? new Date(deadmanStatus.nextCheckIn).toLocaleDateString() 
                        : 'N/A'}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-paper/40 mb-3">Not configured</p>
                    <motion.button
                      onClick={() => navigate('/settings?tab=deadman')}
                      className="text-sm text-gold hover:text-gold-bright transition-colors flex items-center gap-1"
                      whileHover={{ x: 3 }}
                    >
                      Set up protection <ChevronRight size={14} />
                    </motion.button>
                  </>
                )}
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="relative overflow-hidden rounded-2xl p-6 backdrop-blur-xl bg-white/[0.02] border border-white/[0.05]">
              <div className="absolute inset-0 bg-gradient-to-br from-blood/5 to-transparent" />
              <div className="relative">
                <h3 className="text-paper/60 font-light mb-4">Quick Actions</h3>
                
                <div className="space-y-2">
                  <motion.button
                    onClick={() => navigate('/compose')}
                    className="w-full text-left px-4 py-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.03] hover:border-gold/20 transition-all flex items-center justify-between group"
                    whileHover={{ x: 3 }}
                  >
                    <span className="text-paper/80">Write a letter</span>
                    <ChevronRight size={16} className="text-paper/30 group-hover:text-gold transition-colors" />
                  </motion.button>
                  
                  <motion.button
                    onClick={() => navigate('/record')}
                    className="w-full text-left px-4 py-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.03] hover:border-gold/20 transition-all flex items-center justify-between group"
                    whileHover={{ x: 3 }}
                  >
                    <span className="text-paper/80">Record your voice</span>
                    <ChevronRight size={16} className="text-paper/30 group-hover:text-gold transition-colors" />
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ============ FOOTER INFINITY ============ */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-16 text-center"
          >
            <motion.span 
              className="text-3xl text-gold/20"
              animate={{ 
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              ∞
            </motion.span>
          </motion.div>

        </div>
      </main>
    </div>
  );
}
