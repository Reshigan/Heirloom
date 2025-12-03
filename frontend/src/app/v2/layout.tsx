'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Home, Film, Clock, User, Lock } from 'lucide-react'
import { usePrivacy } from '@/contexts/PrivacyContext'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'

/**
 * V2 Layout - World-First UX/UI
 * Mobile-first design with bottom navigation
 */
export default function V2Layout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isUnlocked, lockVault, getRemainingTime } = usePrivacy()
  const pathname = usePathname()
  const router = useRouter()

  const navItems = [
    { icon: Home, label: 'Home', href: '/v2/home' },
    { icon: Film, label: 'Reels', href: '/v2/reels' },
    { icon: Clock, label: 'Timeline', href: '/v2/timeline' },
    { icon: User, label: 'Profile', href: '/v2/profile' },
  ]

  const handleLockClick = () => {
    if (isUnlocked) {
      lockVault()
      router.push('/app')
    }
  }

  return (
    <div className="min-h-screen bg-obsidian-900 flex flex-col">
      {/* Top Bar */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 bg-gradient-to-b from-obsidian-900 via-obsidian-900/95 to-transparent backdrop-blur-xl"
      >
        <div className="max-w-[700px] mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-xl text-gold-400 tracking-tight">Heirloom</h1>
            <p className="text-xs text-gold-200/60">Your Legacy Vault</p>
          </div>
          
          {/* Lock Status */}
          <button
            onClick={handleLockClick}
            className="flex items-center gap-2 px-3 py-2 bg-gold-400/10 rounded-full hover:bg-gold-400/15 transition-all duration-200 shadow-inner"
          >
            <Lock className={`w-4 h-4 ${isUnlocked ? 'text-green-400' : 'text-gold-400'}`} />
            <span className="text-xs text-gold-200/60">
              {isUnlocked ? 'Unlocked' : 'Locked'}
            </span>
          </button>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      {/* Bottom Navigation - Floating */}
      <motion.nav
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 w-[min(640px,calc(100%-24px))] rounded-2xl bg-obsidian-900/70 backdrop-blur-xl border border-gold-500/15 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.5)]"
      >
        <div className="flex items-center justify-around px-6 py-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all min-w-[48px] min-h-[48px] justify-center"
              >
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gold-400/10 rounded-xl"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                
                <Icon
                  className={`w-6 h-6 relative z-10 transition-colors ${
                    isActive ? 'text-gold-400' : 'text-gold-200/50'
                  }`}
                  strokeWidth={1.5}
                />
                <span
                  className={`text-[10px] relative z-10 transition-colors font-medium ${
                    isActive ? 'text-gold-400' : 'text-gold-200/50'
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </motion.nav>
    </div>
  )
}
