'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/contexts/NotificationContext'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const { unreadCount } = useNotifications()

  const navItems = [
    { href: '/app', label: 'Memories', testId: 'nav-memories' },
    { href: '/app/recipients', label: 'Recipients', testId: 'nav-recipients' },
    { href: '/app/check-in', label: 'Check-in', testId: 'nav-checkin' },
    { href: '/app/family', label: 'Family', testId: 'nav-family' },
    { href: '/app/highlights', label: 'Highlights', testId: 'nav-highlights' },
    { href: '/app/time-capsules', label: 'Time Capsules', testId: 'nav-time-capsules' },
    { href: '/app/search', label: 'Search', testId: 'nav-search' },
    { href: '/app/notifications', label: 'Notifications', testId: 'nav-notifications' },
    { href: '/app/letters', label: 'Letters', testId: 'nav-letters' },
    { href: '/app/reels', label: 'Reels', testId: 'nav-reels' },
    { href: '/app/memorial', label: 'Memorial', testId: 'nav-memorial' },
    { href: '/billing', label: 'Billing', testId: 'nav-billing' },
  ]

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Constellation Background */}
      <div className="luxury-bg" />
      <div className="elegant-grid" />

      {/* Navigation */}
      <nav className="luxury-nav">
        <Link href="/app" className="logo">
          HEIRLOOM
        </Link>
        <ul className="nav-menu">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                data-testid={item.testId}
                className={`nav-item ${pathname === item.href ? 'active' : ''}`}
              >
                {item.label}
                {item.label === 'Notifications' && unreadCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-gold-primary text-obsidian rounded-full">
                    {unreadCount}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
        {user && (
          <div className="ml-auto flex items-center gap-4">
            <span className="text-pearl/70 text-sm">{user.name}</span>
            <button
              onClick={logout}
              className="text-pearl/70 hover:text-gold-primary transition-colors text-sm"
            >
              Logout
            </button>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="relative z-10">
        {children}
      </main>
    </div>
  )
}
