import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Bell, Settings, LogOut, Shield, Clock, Crown, AlertTriangle,
  ChevronRight, X, Check, Loader2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore';
import { billingApi, memoriesApi, familyApi, deadmanApi } from '../services/api';
import { Navigation } from '../components/Navigation';

export function Dashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const queryClient = useQueryClient();
  const deskRef = useRef<HTMLDivElement>(null);
  
  const [showTrialWarning, setShowTrialWarning] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Mouse tracking for parallax
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // Reduced parallax for more cinematic, less toy-like feel
  const rotateX = useTransform(mouseY, [-300, 300], [1.2, -1.2]);
  const rotateY = useTransform(mouseX, [-500, 500], [-1.8, 1.8]);
  
  const springRotateX = useSpring(rotateX, { stiffness: 100, damping: 30 });
  const springRotateY = useSpring(rotateY, { stiffness: 100, damping: 30 });

  // Queries
  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => billingApi.getSubscription().then(r => r.data),
  });

  const { data: limits } = useQuery({
    queryKey: ['limits'],
    queryFn: () => billingApi.getLimits().then(r => r.data),
  });

  const { data: rawStats } = useQuery({
    queryKey: ['memories-stats'],
    queryFn: () => memoriesApi.getStats().then(r => r.data),
  });

  // Map backend stats response to expected dashboard format
  // Backend returns: { total, byType: { photos, videos, voice, letters }, totalStorage }
  // Dashboard expects: { totalMemories, totalLetters, totalVoiceMinutes }
  const stats = rawStats ? {
    totalMemories: rawStats.total || 0,
    totalLetters: rawStats.byType?.letters || 0,
    totalVoiceMinutes: rawStats.byType?.voice || 0, // Using voice count as proxy for minutes
    totalPhotos: rawStats.byType?.photos || 0,
    totalVideos: rawStats.byType?.videos || 0,
    totalStorage: rawStats.totalStorage || 0,
  } : undefined;

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

  // Mouse move handler for desk parallax
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!deskRef.current) return;
      const rect = deskRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      mouseX.set(e.clientX - centerX);
      mouseY.set(e.clientY - centerY);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const isTrialing = subscription?.status === 'TRIALING';
  const trialDaysLeft = subscription?.trialDaysRemaining || 0;

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

      {/* Floating dust particles */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(40)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-gold/20"
            style={{
              width: Math.random() > 0.7 ? 3 : 2,
              height: Math.random() > 0.7 ? 3 : 2,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -150, 0],
              x: [0, Math.random() * 50 - 25, 0],
              opacity: [0, 0.6, 0],
            }}
            transition={{
              duration: 15 + Math.random() * 15,
              repeat: Infinity,
              delay: Math.random() * 15,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Ambient warm light from top */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none">
        <div className="w-full h-full bg-gradient-radial from-amber-500/10 via-transparent to-transparent blur-3xl" />
      </div>

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

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-20 px-6 md:px-12 py-6"
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <motion.div 
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate('/dashboard')}
            whileHover={{ scale: 1.02 }}
          >
            <motion.span 
              className="text-3xl text-gold"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            >
              ∞
            </motion.span>
            <span className="text-xl tracking-[0.15em] text-paper/80">HEIRLOOM</span>
          </motion.div>

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
                {deadmanStatus.needsCheckIn ? t('dashboard.checkInRequired') : t('dashboard.protected')}
              </motion.button>
            )}

            {/* Notifications */}
            <div className="relative">
              <motion.button
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-10 h-10 rounded-full glass flex items-center justify-center text-paper/60 hover:text-gold transition-colors relative"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Bell size={20} />
                {isTrialing && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-blood rounded-full" />
                )}
              </motion.button>
            </div>

            {/* Settings */}
            <motion.button
              onClick={() => navigate('/settings')}
              className="w-10 h-10 rounded-full glass flex items-center justify-center text-paper/60 hover:text-gold transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Settings size={20} />
            </motion.button>

            {/* User avatar */}
            <motion.button
              onClick={() => navigate('/settings')}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-gold to-gold-dim flex items-center justify-center text-void font-medium relative overflow-hidden"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
              <span className="relative">{user?.firstName?.[0] || 'U'}</span>
            </motion.button>

            {/* Logout */}
            <motion.button
              onClick={logout}
              className="w-10 h-10 rounded-full glass flex items-center justify-center text-paper/60 hover:text-blood transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Sign out"
            >
              <LogOut size={20} />
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Trial Warning Banner */}
      <AnimatePresence>
        {isTrialing && showTrialWarning && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="relative z-10 px-6 md:px-12"
          >
            <div className="max-w-7xl mx-auto">
              <div className="glass border border-gold/20 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                    <Clock size={20} className="text-gold" />
                  </div>
                  <div>
                                        <p className="font-medium">
                                          {t('dashboard.trialDaysLeft', { days: trialDaysLeft })}
                                        </p>
                                        <p className="text-sm text-paper/50">
                                          {t('dashboard.upgradePrompt')}
                                        </p>
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
                                      {t('billing.trial.upgrade')}
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

      {/* Main Content */}
      <main className="relative z-10 px-6 md:px-12 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Welcome */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
                        <h1 className="text-3xl md:text-4xl font-light mb-2">
                          {t('dashboard.welcome', { name: '' })} <em className="text-gold">{user?.firstName || t('common.friend')}</em>
                        </h1>
                        <p className="text-paper/50">{t('dashboard.sanctuaryAwaits')}</p>
          </motion.div>

          {/* 3D Desk with Objects */}
          <motion.div
            ref={deskRef}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative mb-12"
            style={{
              perspective: '1500px',
            }}
          >
            <motion.div
              style={{
                rotateX: springRotateX,
                rotateY: springRotateY,
                transformStyle: 'preserve-3d',
              }}
            >
              {/* Desk Surface - Premium dark wood slab */}
              <div 
                className="relative rounded-3xl md:rounded-[28px] p-8 md:p-12 min-h-[520px]"
                style={{
                  background: `
                    radial-gradient(circle at 10% 0%, rgba(255, 255, 255, 0.04) 0%, transparent 40%),
                    radial-gradient(circle at 90% 100%, rgba(0, 0, 0, 0.5) 0%, transparent 55%),
                    linear-gradient(135deg, #2a2118 0%, #1e1811 50%, #17120c 100%)
                  `,
                  boxShadow: `
                    0 50px 100px rgba(0,0,0,0.85),
                    0 25px 50px rgba(0,0,0,0.7),
                    0 10px 20px rgba(0,0,0,0.5),
                    inset 0 1px 0 rgba(255,255,255,0.08),
                    inset 0 -1px 0 rgba(0,0,0,0.4)
                  `,
                }}
              >
                {/* Subtle noise texture for tactile feel */}
                <div 
                  className="absolute inset-0 rounded-3xl md:rounded-[28px] pointer-events-none opacity-[0.12]"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 160 160' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`,
                    mixBlendMode: 'soft-light',
                  }}
                />

                {/* Subtle top edge highlight */}
                <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-amber-500/15 to-transparent" />

                {/* Desk Objects Container */}
                <div className="relative grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
                  
                  {/* Photo Stack - Memories - Premium matte paper look */}
                  <motion.button
                    onClick={() => navigate('/memories')}
                    className="group relative"
                    whileHover={{ scale: 1.02, y: -6 }}
                    whileTap={{ scale: 0.99 }}
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    {/* Ambient occlusion shadow */}
                    <div 
                      className="absolute -inset-2 rounded-2xl pointer-events-none"
                      style={{ boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}
                    />
                    <div className="relative w-full aspect-[4/5]">
                      {/* Stacked photos effect - more subtle rotation */}
                      {[2, 1, 0].map((i) => (
                        <div
                          key={i}
                          className="absolute inset-0 rounded-[10px]"
                          style={{
                            transform: `rotate(${(i - 1) * 3.5}deg) translateZ(${i * 3}px)`,
                            background: 'linear-gradient(145deg, #f5f1e7 0%, #e7ddcf 45%, #d9cdbb 100%)',
                            boxShadow: '0 8px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.6)',
                          }}
                        >
                          {/* Photo content area - darker, more realistic */}
                          <div 
                            className="absolute inset-3 rounded-[8px] overflow-hidden"
                            style={{
                              background: 'radial-gradient(circle at 20% 0%, rgba(255,255,255,0.15) 0%, transparent 40%), linear-gradient(135deg, #2b3a4a 0%, #1b2633 45%, #11151b 100%)',
                              boxShadow: 'inset 0 0 12px rgba(0,0,0,0.3)',
                            }}
                          />
                          {/* Subtle frame edge */}
                          <div className="absolute inset-0 rounded-[10px] border border-amber-100/20" />
                        </div>
                      ))}
                      
                      {/* Subtle glass reflection */}
                      <div className="absolute inset-0 rounded-[10px] bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" style={{ transform: 'translateZ(10px)' }} />
                    </div>
                    
                    <div className="mt-4 text-center">
                                            <h3 className="text-lg font-medium group-hover:text-gold transition-colors duration-300">{t('nav.memories')}</h3>
                                            <p className="text-sm text-paper/50">{stats?.totalMemories || 0} {t('dashboard.captured')}</p>
                    </div>
                  </motion.button>

                  {/* Letter with Pen - Compose - Luxury stationery look */}
                  <motion.button
                    onClick={() => navigate('/compose')}
                    className="group relative"
                    whileHover={{ scale: 1.02, y: -6 }}
                    whileTap={{ scale: 0.99 }}
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    {/* Ambient occlusion shadow */}
                    <div 
                      className="absolute -inset-2 rounded-2xl pointer-events-none"
                      style={{ boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}
                    />
                    <div className="relative w-full aspect-[4/5]">
                      {/* Paper - Premium stationery */}
                      <div
                        className="absolute inset-0 rounded-[8px]"
                        style={{
                          background: 'linear-gradient(180deg, #faf7f0 0%, #f3ede2 55%, #e7dece 100%)',
                          boxShadow: '0 12px 28px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.8)',
                          transform: 'rotate(-1.5deg)',
                        }}
                      >
                        {/* Subtle paper texture */}
                        <div 
                          className="absolute inset-0 rounded-[8px] opacity-20"
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 240 240' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.35'/%3E%3C/svg%3E")`,
                            mixBlendMode: 'soft-light',
                          }}
                        />
                        
                        {/* Elegant writing lines */}
                        <div className="absolute inset-7 space-y-5 opacity-40">
                          {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-px bg-[#c4b8a6]/50" />
                          ))}
                        </div>
                        
                        {/* Subtle handwritten text simulation */}
                        <div className="absolute inset-7 pt-1">
                          <div className="h-0.5 w-14 bg-amber-900/15 rounded mb-4" />
                          <div className="h-0.5 w-20 bg-amber-900/10 rounded mb-3" />
                          <div className="h-0.5 w-16 bg-amber-900/10 rounded" />
                        </div>
                      </div>
                      
                      {/* Fountain Pen - Premium metallic */}
                      <div
                        className="absolute -right-5 top-1/2"
                        style={{
                          width: '126px',
                          height: '18px',
                          borderRadius: '3px 9px 9px 3px',
                          background: 'linear-gradient(90deg, #181825 0%, #25263a 35%, #1a1b2a 70%, #0f101a 100%)',
                          boxShadow: '0 6px 14px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)',
                          transform: 'rotate(30deg) translateY(-50%)',
                        }}
                      >
                        {/* Pen nib - refined gold */}
                        <div 
                          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full"
                          style={{
                            width: '18px',
                            height: '7px',
                            background: 'linear-gradient(90deg, #d4af37 0%, #b8962e 100%)',
                            clipPath: 'polygon(100% 0%, 100% 100%, 0% 50%)',
                          }}
                        />
                        {/* Gold band - subtle */}
                        <div className="absolute right-8 top-0 bottom-0 w-3 bg-gradient-to-b from-[#d4af37] via-[#b8962e] to-[#d4af37] rounded-sm opacity-90" />
                        {/* Clip */}
                        <div 
                          className="absolute right-2 -top-1.5 w-0.5 h-5 bg-gradient-to-b from-[#d4af37] to-[#b8962e] rounded-full"
                          style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
                        />
                      </div>
                    </div>
                    
                    <div className="mt-4 text-center">
                                            <h3 className="text-lg font-medium group-hover:text-gold transition-colors duration-300">{t('dashboard.writeLetter')}</h3>
                                            <p className="text-sm text-paper/50">{stats?.totalLetters || 0} {t('dashboard.written')}</p>
                    </div>
                  </motion.button>

                  {/* Vintage Recorder - Voice - Premium audio equipment look */}
                  <motion.button
                    onClick={() => navigate('/record')}
                    className="group relative"
                    whileHover={{ scale: 1.02, y: -6 }}
                    whileTap={{ scale: 0.99 }}
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    {/* Ambient occlusion shadow */}
                    <div 
                      className="absolute -inset-2 rounded-2xl pointer-events-none"
                      style={{ boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}
                    />
                    <div className="relative w-full aspect-[4/5]">
                      {/* Recorder body - Premium dark metal */}
                      <div 
                        className="absolute inset-0 rounded-xl"
                        style={{
                          background: 'linear-gradient(180deg, #26211d 0%, #15110d 50%, #0b0805 100%)',
                          boxShadow: '0 16px 36px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
                        }}
                      >
                        {/* Subtle chrome trim */}
                        <div className="absolute top-2 left-4 right-4 h-px bg-gradient-to-r from-transparent via-amber-500/25 to-transparent rounded-full" />
                        
                        {/* Reels - Static, premium look */}
                        <div className="absolute top-6 left-0 right-0 flex justify-center gap-6">
                          {[0, 1].map((i) => (
                            <div key={i} className="relative">
                              <div 
                                className="w-12 h-12 rounded-full"
                                style={{
                                  background: 'radial-gradient(circle at 30% 30%, #3a3530 0%, #252220 50%, #151210 100%)',
                                  boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.6), 0 2px 4px rgba(0,0,0,0.3)',
                                }}
                              >
                                <div className="absolute inset-2 rounded-full bg-gradient-to-br from-amber-500/5 to-transparent" />
                                <div className="absolute inset-4 rounded-full bg-[#0a0908]" />
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* VU Meter - Subtle, professional */}
                        <div 
                          className="absolute bottom-12 left-4 right-4 h-8 rounded"
                          style={{
                            background: '#080706',
                            boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.8)',
                          }}
                        >
                          <div className="absolute inset-1 flex items-end justify-center gap-0.5">
                            {[...Array(12)].map((_, i) => (
                              <motion.div
                                key={i}
                                className="w-1 rounded-sm opacity-85"
                                style={{
                                  background: i < 8 ? '#16a34a' : i < 10 ? '#ca8a04' : '#dc2626',
                                }}
                                animate={{ height: ['18%', `${22 + Math.random() * 35}%`, '18%'] }}
                                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.06, ease: 'easeInOut' }}
                              />
                            ))}
                          </div>
                        </div>
                        
                        {/* Control buttons - Refined */}
                        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
                          <div 
                            className="w-5 h-5 rounded-full"
                            style={{
                              background: 'radial-gradient(circle at 30% 30%, #dc2626 0%, #991b1b 100%)',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
                            }}
                          />
                          <div 
                            className="w-5 h-5 rounded"
                            style={{
                              background: 'linear-gradient(180deg, #4a4a4a 0%, #2a2a2a 100%)',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 text-center">
                                            <h3 className="text-lg font-medium group-hover:text-gold transition-colors duration-300">{t('dashboard.recordVoice')}</h3>
                                            <p className="text-sm text-paper/50">{stats?.totalVoiceMinutes || 0} {t('dashboard.minutes')}</p>
                    </div>
                  </motion.button>

                  {/* Family Frame - Premium wooden frame look */}
                  <motion.button
                    onClick={() => navigate('/family')}
                    className="group relative"
                    whileHover={{ scale: 1.02, y: -6 }}
                    whileTap={{ scale: 0.99 }}
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    {/* Ambient occlusion shadow */}
                    <div 
                      className="absolute -inset-2 rounded-2xl pointer-events-none"
                      style={{ boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}
                    />
                    <div className="relative w-full aspect-[4/5]">
                      {/* Premium wooden frame */}
                      <div 
                        className="absolute inset-0 rounded-lg"
                        style={{
                          background: 'linear-gradient(135deg, #5c4a3a 0%, #4a3c30 25%, #3d3228 50%, #4a3c30 75%, #5c4a3a 100%)',
                          boxShadow: '0 16px 36px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.3)',
                          padding: '10px',
                        }}
                      >
                        {/* Inner frame with depth */}
                        <div 
                          className="absolute inset-3 rounded"
                          style={{
                            boxShadow: 'inset 0 4px 16px rgba(0,0,0,0.5)',
                            background: 'linear-gradient(180deg, #151210 0%, #1e1a16 100%)',
                          }}
                        >
                          {/* Family members preview */}
                          <div className="absolute inset-2 flex flex-wrap items-center justify-center gap-2 p-2">
                            {family?.slice(0, 4).map((member: any, i: number) => (
                              <div
                                key={member.id}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-xs text-void font-medium"
                                style={{
                                  background: 'linear-gradient(135deg, #d4af37 0%, #b8962e 100%)',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
                                }}
                              >
                                {member.name[0]}
                              </div>
                            ))}
                            {(!family || family.length === 0) && (
                                                            <div className="text-paper/30 text-xs text-center">
                                                              {t('family.addMember')}
                                                            </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Subtle frame accent */}
                        <div className="absolute top-1 left-1/2 -translate-x-1/2 w-6 h-1 rounded-full bg-gradient-to-b from-amber-500/15 to-transparent" />
                      </div>
                      
                      {/* Subtle glass reflection */}
                      <div className="absolute inset-3 rounded bg-gradient-to-br from-white/3 via-transparent to-transparent pointer-events-none" />
                    </div>
                    
                    <div className="mt-4 text-center">
                                            <h3 className="text-lg font-medium group-hover:text-gold transition-colors duration-300">{t('nav.family')}</h3>
                                            <p className="text-sm text-paper/50">{family?.length || 0} {t('dashboard.members')}</p>
                    </div>
                  </motion.button>
                </div>

                {/* Decorative Objects - Subtle, premium props */}
                
                {/* Ink Bottle - Static, refined */}
                <div
                  className="absolute bottom-8 left-8 w-10 h-14"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <div 
                    className="w-full h-full rounded-b-lg rounded-t-sm"
                    style={{
                      background: 'linear-gradient(180deg, rgba(18,18,25,0.95) 0%, rgba(8,8,15,0.98) 100%)',
                      boxShadow: 'inset 0 -6px 12px rgba(180,150,70,0.15), 0 6px 12px rgba(0,0,0,0.5)',
                    }}
                  >
                    {/* Ink level - subtle */}
                    <div className="absolute bottom-0 left-1 right-1 h-2/5 rounded-b-md bg-gradient-to-t from-amber-600/20 to-transparent" />
                    {/* Glass shine - subtle */}
                    <div className="absolute inset-0 rounded-b-lg bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                  </div>
                  {/* Cap */}
                  <div 
                    className="absolute -top-2.5 left-1 right-1 h-3 rounded-t-full"
                    style={{
                      background: 'linear-gradient(180deg, #2a2a2a 0%, #151515 100%)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
                    }}
                  />
                </div>

                {/* Wax Seal - Static, premium */}
                <div className="absolute bottom-8 right-8">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{
                      background: 'radial-gradient(circle at 30% 30%, #8b2020 0%, #6b1515 50%, #4a0f0f 100%)',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
                    }}
                  >
                    <span className="text-amber-200/80 text-base">∞</span>
                  </div>
                </div>

                                {/* True 3D Candle */}
                                <div
                                  className="absolute top-2 right-6"
                                  style={{ width: 40, height: 90, perspective: 400 }}
                                >
                                  <div
                                    className="relative w-full h-full"
                                    style={{ transformStyle: 'preserve-3d', transform: 'rotateX(8deg) rotateY(-10deg)' }}
                                  >
                                    {/* Contact shadow on desk */}
                                    <div
                                      className="absolute left-1/2 bottom-0 -translate-x-1/2"
                                      style={{
                                        width: 36,
                                        height: 14,
                                        borderRadius: '50%',
                                        background: 'radial-gradient(circle at 50% 50%, rgba(0,0,0,0.7) 0%, transparent 70%)',
                                        opacity: 0.75,
                                        filter: 'blur(3px)',
                                        transform: 'translateZ(0)',
                                      }}
                                    />

                                    {/* Candle body - cylindrical with lateral gradient */}
                                    <div
                                      className="absolute left-1/2 bottom-1 -translate-x-1/2"
                                      style={{
                                        width: 18,
                                        height: 52,
                                        borderRadius: 999,
                                        background: 'linear-gradient(90deg, #1b1a16 0%, #f8f3e2 22%, #fdf8ea 45%, #f1e7cf 60%, #c1b69c 80%, #6b6351 100%)',
                                        boxShadow: '0 6px 12px rgba(0,0,0,0.65), inset 0 0 6px rgba(0,0,0,0.3)',
                                        transform: 'translateZ(8px)',
                                      }}
                                    />

                                    {/* Top ellipse / wax rim */}
                                    <div
                                      className="absolute left-1/2 bottom-[53px] -translate-x-1/2"
                                      style={{
                                        width: 20,
                                        height: 10,
                                        borderRadius: '50%',
                                        background: 'radial-gradient(circle at 30% 20%, #fff9ea 0%, #f6ebd4 45%, #cbbda3 80%, #736755 100%)',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.5), inset 0 -1px 2px rgba(0,0,0,0.35)',
                                        transform: 'translateZ(10px)',
                                      }}
                                    />

                                    {/* Wick */}
                                    <div
                                      className="absolute left-1/2 bottom-[60px] -translate-x-1/2"
                                      style={{
                                        width: 2,
                                        height: 6,
                                        borderRadius: 999,
                                        background: 'linear-gradient(to bottom, #2b2118, #0b0704)',
                                        transform: 'translateZ(12px)',
                                      }}
                                    />

                                    {/* Flame with CSS animation */}
                                    <div
                                      className="absolute left-1/2 bottom-[66px] -translate-x-1/2"
                                      style={{ transform: 'translateZ(14px)' }}
                                    >
                                      {/* Outer glow halo */}
                                      <div
                                        className="absolute -inset-4 pointer-events-none"
                                        style={{
                                          background: 'radial-gradient(circle, rgba(251,191,36,0.35) 0%, rgba(251,146,60,0.2) 40%, transparent 70%)',
                                          filter: 'blur(4px)',
                                        }}
                                      />
                      
                                      {/* Flame shape with flicker animation */}
                                      <div
                                        className="relative"
                                        style={{
                                          width: 10,
                                          height: 18,
                                          transformOrigin: '50% 100%',
                                          animation: 'flame-flicker 1.6s ease-in-out infinite',
                                        }}
                                      >
                                        {/* Outer flame */}
                                        <div
                                          style={{
                                            position: 'absolute',
                                            inset: 0,
                                            borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
                                            background: 'radial-gradient(circle at 30% 20%, #fff7d1 0%, #facc6b 35%, #f97316 70%, transparent 72%)',
                                            filter: 'blur(0.4px)',
                                          }}
                                        />
                                        {/* Inner flame core */}
                                        <div
                                          style={{
                                            position: 'absolute',
                                            inset: 3,
                                            borderRadius: '50% 50% 50% 50% / 65% 65% 35% 35%',
                                            background: 'radial-gradient(circle at 30% 10%, #ffffff 0%, #fde68a 40%, transparent 70%)',
                                          }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>

              </div>
            </motion.div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid md:grid-cols-3 gap-6"
          >
            {/* Storage */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-paper/70">Storage Used</h3>
                <span className="badge badge-gold">{subscription?.tier || 'Trial'}</span>
              </div>
                <div className="progress-bar mb-2">
                  <div 
                    className="progress-bar-fill" 
                    style={{ width: `${limits?.storage?.percentage ?? limits?.storageUsedPercent ?? 0}%` }} 
                  />
                </div>
                <div className="flex justify-between text-sm text-paper/50">
                  <span>{limits?.storage?.usedMB ?? limits?.storageUsedMB ?? 0} MB used</span>
                  <span>{limits?.storage?.maxLabel ?? limits?.storageLimitMB ?? '100 MB'} limit</span>
                </div>
            </div>

            {/* Dead Man's Switch */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-paper/70">Protection Status</h3>
                <Shield size={20} className={deadmanStatus?.enabled ? 'text-green-400' : 'text-paper/30'} />
              </div>
              {deadmanStatus?.enabled ? (
                <>
                  <p className="text-green-400 mb-2">Active</p>
                  <p className="text-sm text-paper/50">
                    Next check-in: {deadmanStatus.nextCheckIn ? new Date(deadmanStatus.nextCheckIn).toLocaleDateString() : 'N/A'}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-paper/50 mb-2">Not configured</p>
                  <button
                    onClick={() => navigate('/settings?tab=deadman')}
                    className="text-sm text-gold hover:text-gold-bright transition-colors flex items-center gap-1"
                  >
                    Set up protection <ChevronRight size={14} />
                  </button>
                </>
              )}
            </div>

            {/* Quick Actions */}
            <div className="card">
              <h3 className="text-paper/70 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => navigate('/compose')}
                  className="w-full text-left px-4 py-3 rounded-lg glass hover:bg-white/5 transition-all flex items-center justify-between group"
                >
                  <span>Write a letter</span>
                  <ChevronRight size={16} className="text-paper/30 group-hover:text-gold transition-colors" />
                </button>
                <button
                  onClick={() => navigate('/record')}
                  className="w-full text-left px-4 py-3 rounded-lg glass hover:bg-white/5 transition-all flex items-center justify-between group"
                >
                  <span>Record your voice</span>
                  <ChevronRight size={16} className="text-paper/30 group-hover:text-gold transition-colors" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
