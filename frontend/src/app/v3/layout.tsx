'use client'

import React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  LayoutDashboard, 
  FileText, 
  PenLine, 
  Users, 
  Calendar, 
  Shield, 
  Settings,
  CreditCard,
  Lock,
  Unlock
} from 'lucide-react'
import { usePrivacy } from '@/contexts/PrivacyContext'
import { useAuth } from '@/contexts/AuthContext'

/**
 * V3 Layout - Privacy Vault with Dead Man's Switch
 * 
 * Design: Workspace layout with left rail navigation
 * - Desktop: Left sidebar with navigation
 * - Mobile: Top app bar with overflow menu
 * - Light, editorial theme (paper/ink)
 * - Estate planning patterns (not social)
 */

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  requiresUnlock?: boolean
}

const navItems: NavItem[] = [
  { href: '/v3/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/v3/vault', label: 'Letters & Media', icon: FileText, requiresUnlock: true },
  { href: '/v3/compose', label: 'Compose', icon: PenLine, requiresUnlock: true },
  { href: '/v3/recipients', label: 'Recipients', icon: Users, requiresUnlock: true },
  { href: '/v3/check-in', label: 'Check-in', icon: Calendar },
  { href: '/v3/security', label: 'Security', icon: Shield },
  { href: '/v3/settings', label: 'Settings', icon: Settings },
  { href: '/v3/billing', label: 'Billing', icon: CreditCard },
]

export default function V3Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { isUnlocked, lockVault, getRemainingTime } = usePrivacy()
  const { user } = useAuth()
  const [showMobileMenu, setShowMobileMenu] = React.useState(false)

  const remainingMinutes = Math.floor(getRemainingTime() / 1000 / 60)

  const handleLockToggle = () => {
    if (isUnlocked) {
      lockVault()
    } else {
      router.push('/v3/unlock')
    }
  }

  return (
    <div className="min-h-screen bg-paper flex">
      {/* Desktop Left Rail Navigation */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:border-r lg:border-divider bg-white">
        {/* Logo & User */}
        <div className="p-6 border-b border-divider">
          <h1 className="font-serif text-2xl text-navy-500 mb-1">Heirloom</h1>
          <p className="text-sm text-ink/60">Privacy Vault</p>
          
          {user && (
            <div className="mt-4 pt-4 border-t border-divider">
              <p className="text-sm font-medium text-ink">{user.name}</p>
              <p className="text-xs text-ink/60">{user.email}</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            const isLocked = item.requiresUnlock && !isUnlocked

            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                disabled={isLocked}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  isActive
                    ? 'bg-navy-50 text-navy-500 font-medium'
                    : isLocked
                    ? 'text-ink/30 cursor-not-allowed'
                    : 'text-ink/70 hover:bg-navy-50/50 hover:text-navy-500'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{item.label}</span>
                {isLocked && <Lock className="w-3 h-3 ml-auto" />}
              </button>
            )
          })}
        </nav>

        {/* Lock Status */}
        <div className="p-4 border-t border-divider">
          <button
            onClick={handleLockToggle}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isUnlocked
                ? 'bg-sage-50 text-sage-600 hover:bg-sage-100'
                : 'bg-navy-50 text-navy-500 hover:bg-navy-100'
            }`}
          >
            {isUnlocked ? (
              <>
                <Unlock className="w-5 h-5" />
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium">Unlocked</p>
                  <p className="text-xs opacity-70">{remainingMinutes}m remaining</p>
                </div>
              </>
            ) : (
              <>
                <Lock className="w-5 h-5" />
                <span className="text-sm font-medium">Unlock Vault</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-divider">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="font-serif text-xl text-navy-500">Heirloom</h1>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleLockToggle}
              className={`p-2 rounded-lg ${
                isUnlocked ? 'text-sage-600' : 'text-navy-500'
              }`}
            >
              {isUnlocked ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </button>
            
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 text-ink/70"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-full left-0 right-0 bg-white border-b border-divider shadow-lg"
          >
            <nav className="p-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                const isLocked = item.requiresUnlock && !isUnlocked

                return (
                  <button
                    key={item.href}
                    onClick={() => {
                      router.push(item.href)
                      setShowMobileMenu(false)
                    }}
                    disabled={isLocked}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      isActive
                        ? 'bg-navy-50 text-navy-500 font-medium'
                        : isLocked
                        ? 'text-ink/30 cursor-not-allowed'
                        : 'text-ink/70 hover:bg-navy-50/50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm">{item.label}</span>
                    {isLocked && <Lock className="w-3 h-3 ml-auto" />}
                  </button>
                )
              })}
            </nav>
          </motion.div>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
        {children}
      </main>
    </div>
  )
}
