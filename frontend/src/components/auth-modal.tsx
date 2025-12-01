'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, LogIn, UserPlus, Sparkles } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

// Particle component for the auth modal
const AuthParticle = ({ delay, duration, index }: { delay: number; duration: number; index: number }) => {
  const startX = (index % 5) * 80 + Math.random() * 40
  const startY = Math.floor(index / 5) * 100 + Math.random() * 50
  
  return (
    <motion.div
      className="absolute w-1 h-1 rounded-full bg-gold-400"
      style={{ left: `${startX}px`, top: `${startY}px` }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ 
        opacity: [0, 0.8, 0],
        scale: [0, 1.5, 0],
        x: [0, Math.random() * 60 - 30],
        y: [0, Math.random() * 60 - 30]
      }}
      transition={{
        duration: duration,
        delay: delay,
        repeat: Infinity,
        ease: "easeInOut" as const
      }}
    />
  )
}

// Golden ring animation component
const GoldenRing = ({ size, delay, duration }: { size: number; delay: number; duration: number }) => (
  <motion.div
    className="absolute left-1/2 top-1/3 rounded-full border border-gold-400/20 pointer-events-none"
    style={{ 
      width: size, 
      height: size, 
      marginLeft: -size/2, 
      marginTop: -size/2 
    }}
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ 
      opacity: [0, 0.4, 0],
      scale: [0.8, 1.1, 0.8],
      rotate: [0, 360]
    }}
    transition={{
      duration: duration,
      delay: delay,
      repeat: Infinity,
      ease: "linear"
    }}
  />
)

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [familyName, setFamilyName] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showContent, setShowContent] = useState(false)
  const [particles, setParticles] = useState<Array<{ id: number; delay: number; duration: number }>>([])

  const { login, register } = useAuth()

  // Generate particles on mount
  useEffect(() => {
    if (isOpen) {
      const newParticles = Array.from({ length: 15 }, (_, i) => ({
        id: i,
        delay: Math.random() * 2,
        duration: 3 + Math.random() * 2
      }))
      setParticles(newParticles)
      
      // Delay content reveal for dramatic effect
      const timer = setTimeout(() => setShowContent(true), 600)
      return () => clearTimeout(timer)
    } else {
      setShowContent(false)
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await register(email, password, name, familyName)
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setName('')
    setFamilyName('')
    setError('')
  }

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login')
    resetForm()
  }

  // Animation variants
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.4, ease: "easeOut" as const }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.3, ease: "easeIn" as const }
    }
  }

  const modalVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.85,
      y: 40
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: { 
        duration: 0.6, 
        ease: [0.16, 1, 0.3, 1] as const,
        delay: 0.1
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.9,
      y: 20,
      transition: { duration: 0.25, ease: "easeIn" as const }
    }
  }

  const logoVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.6,
      filter: "blur(8px)"
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      filter: "blur(0px)",
      transition: { 
        duration: 0.8, 
        ease: [0.16, 1, 0.3, 1] as const,
        delay: 0.2
      }
    }
  }

  const shimmerVariants = {
    hidden: { x: "-100%", opacity: 0 },
    visible: { 
      x: "100%", 
      opacity: [0, 1, 0],
      transition: { 
        duration: 1.2, 
        delay: 0.6,
        ease: "easeInOut" as const
      }
    }
  }

  const contentVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.5, 
        ease: "easeOut" as const,
        staggerChildren: 0.08,
        delayChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.35, ease: "easeOut" as const }
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-[10001] flex items-end sm:items-center justify-center bg-obsidian-900/80 backdrop-blur-md p-0 sm:p-4"
          onClick={onClose}
        >
          {/* Animated background particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {particles.map(particle => (
              <AuthParticle 
                key={particle.id} 
                delay={particle.delay} 
                duration={particle.duration}
                index={particle.id}
              />
            ))}
          </div>

          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full h-[100dvh] sm:h-auto sm:max-w-md rounded-none sm:rounded-3xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Glassmorphism background */}
            <div className="absolute inset-0 bg-gradient-to-br from-charcoal/95 via-obsidian-900/98 to-charcoal/95 backdrop-blur-2xl" />
            
            {/* Animated border glow */}
            <motion.div
              className="absolute inset-0 rounded-none sm:rounded-3xl pointer-events-none"
              style={{
                background: "linear-gradient(135deg, transparent 40%, rgba(212, 175, 55, 0.25) 50%, transparent 60%)",
                backgroundSize: "200% 200%"
              }}
              animate={{
                backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"]
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "linear"
              }}
            />
            
            {/* Border */}
            <div className="absolute inset-0 rounded-none sm:rounded-3xl border border-gold-500/30 pointer-events-none" />
            
            {/* Top shimmer line */}
            <div className="absolute top-0 left-0 right-0 h-px overflow-hidden pointer-events-none">
              <motion.div
                variants={shimmerVariants}
                initial="hidden"
                animate="visible"
                className="absolute inset-0 bg-gradient-to-r from-transparent via-gold-400 to-transparent"
              />
            </div>

            {/* Decorative rings */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
              <GoldenRing size={250} delay={0} duration={18} />
              <GoldenRing size={350} delay={1.5} duration={22} />
              <GoldenRing size={450} delay={3} duration={26} />
            </div>

            {/* Content wrapper */}
            <div className="relative z-10 p-6 sm:p-8 overflow-y-auto max-h-[100dvh] sm:max-h-[90vh]">
              {/* Close button */}
              <motion.button
                onClick={onClose}
                className="absolute right-4 top-4 w-10 h-10 rounded-full border border-gold-500/30 flex items-center justify-center text-gold-400 hover:border-gold-400 hover:bg-gold/10 transition-all z-20"
                whileHover={{ scale: 1.05, rotate: 90 }}
                whileTap={{ scale: 0.95 }}
              >
                <X className="w-5 h-5" />
              </motion.button>

              {/* Logo Section with dramatic animation */}
              <motion.div 
                variants={logoVariants}
                initial="hidden"
                animate="visible"
                className="mt-4 sm:mt-0 mb-8 text-center"
              >
                {/* Animated logo container */}
                <div className="relative inline-block">
                  {/* Glow effect behind logo */}
                  <motion.div
                    className="absolute inset-0 bg-gold-400/15 blur-2xl rounded-full"
                    animate={{
                      scale: [1, 1.15, 1],
                      opacity: [0.2, 0.4, 0.2]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut" as const
                    }}
                  />
                  
                  {/* Logo text */}
                  <motion.div 
                    className="relative font-serif uppercase tracking-[0.3em] text-gold-400 text-4xl sm:text-5xl"
                    style={{
                      textShadow: "0 0 25px rgba(212, 175, 55, 0.35), 0 0 50px rgba(212, 175, 55, 0.15)"
                    }}
                  >
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4, duration: 0.6 }}
                    >
                      HEIRLOOM
                    </motion.span>
                  </motion.div>
                </div>

                {/* Tagline with sparkle */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                  className="mt-3 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-gold-400/60" />
                  <p className="font-sans text-sm sm:text-base text-gold-300/70">
                    Where Every Memory Becomes a Legacy
                  </p>
                  <Sparkles className="w-4 h-4 text-gold-400/60" />
                </motion.div>

                {/* Decorative divider */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.9, duration: 0.6, ease: "easeOut" as const }}
                  className="mx-auto mt-4 h-px w-32 bg-gradient-to-r from-transparent via-gold-500 to-transparent"
                />
              </motion.div>

              {/* Form content with staggered animation */}
              <AnimatePresence mode="wait">
                {showContent && (
                  <motion.div
                    key={mode}
                    variants={contentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                  >
                    {/* Header */}
                    <motion.div variants={itemVariants} className="mb-6">
                      <h2 className="text-2xl sm:text-3xl font-serif text-gold-300 mb-2">
                        {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                      </h2>
                      <p className="text-sm sm:text-base text-gold-400/70">
                        {mode === 'login'
                          ? 'Sign in to access your family memories'
                          : 'Start preserving your family heritage'}
                      </p>
                    </motion.div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      {mode === 'register' && (
                        <>
                          <motion.div variants={itemVariants}>
                            <label className="block text-xs uppercase tracking-wider text-gold-200/70 mb-2">
                              Your Name
                            </label>
                            <input
                              type="text"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              required
                              className="w-full px-4 py-3 rounded-xl bg-obsidian-800/60 border border-gold-500/20 text-gold-100 placeholder-gold-400/40 focus:outline-none focus:border-gold-400/60 focus:ring-2 focus:ring-gold-400/20 transition-all"
                              placeholder="John Doe"
                            />
                          </motion.div>
                          <motion.div variants={itemVariants}>
                            <label className="block text-xs uppercase tracking-wider text-gold-200/70 mb-2">
                              Family Name
                            </label>
                            <input
                              type="text"
                              value={familyName}
                              onChange={(e) => setFamilyName(e.target.value)}
                              required
                              className="w-full px-4 py-3 rounded-xl bg-obsidian-800/60 border border-gold-500/20 text-gold-100 placeholder-gold-400/40 focus:outline-none focus:border-gold-400/60 focus:ring-2 focus:ring-gold-400/20 transition-all"
                              placeholder="The Doe Family"
                            />
                          </motion.div>
                        </>
                      )}

                      <motion.div variants={itemVariants}>
                        <label className="block text-xs uppercase tracking-wider text-gold-200/70 mb-2">
                          Email
                        </label>
                        <input
                          data-testid="auth-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="w-full px-4 py-3 rounded-xl bg-obsidian-800/60 border border-gold-500/20 text-gold-100 placeholder-gold-400/40 focus:outline-none focus:border-gold-400/60 focus:ring-2 focus:ring-gold-400/20 transition-all"
                          placeholder="you@example.com"
                        />
                      </motion.div>

                      <motion.div variants={itemVariants}>
                        <label className="block text-xs uppercase tracking-wider text-gold-200/70 mb-2">
                          Password
                        </label>
                        <input
                          data-testid="auth-password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="w-full px-4 py-3 rounded-xl bg-obsidian-800/60 border border-gold-500/20 text-gold-100 placeholder-gold-400/40 focus:outline-none focus:border-gold-400/60 focus:ring-2 focus:ring-gold-400/20 transition-all"
                          placeholder="••••••••"
                        />
                      </motion.div>

                      {error && (
                        <motion.div 
                          variants={itemVariants}
                          className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm"
                        >
                          {error}
                        </motion.div>
                      )}

                      <motion.button
                        variants={itemVariants}
                        data-testid="auth-submit"
                        type="submit"
                        disabled={isLoading}
                        className="relative w-full py-3.5 rounded-xl bg-gradient-to-r from-gold-600 to-gold-500 text-obsidian-900 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[48px] text-base overflow-hidden group"
                        whileHover={{ scale: 1.02, boxShadow: "0 8px 30px rgba(212, 175, 55, 0.25)" }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {/* Button shimmer effect */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                          initial={{ x: "-100%" }}
                          whileHover={{ x: "100%" }}
                          transition={{ duration: 0.5 }}
                        />
                        
                        <span className="relative z-10 flex items-center gap-2">
                          {isLoading ? (
                            <motion.div
                              className="w-5 h-5 border-2 border-obsidian-900/30 border-t-obsidian-900 rounded-full"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            />
                          ) : mode === 'login' ? (
                            <>
                              <LogIn className="w-5 h-5" />
                              Sign In
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-5 h-5" />
                              Create Account
                            </>
                          )}
                        </span>
                      </motion.button>
                    </form>

                    <motion.div variants={itemVariants} className="mt-6 text-center">
                      <button
                        onClick={switchMode}
                        className="text-gold-400/70 hover:text-gold-400 transition-colors text-sm"
                      >
                        {mode === 'login'
                          ? "Don't have an account? Sign up"
                          : 'Already have an account? Sign in'}
                      </button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
