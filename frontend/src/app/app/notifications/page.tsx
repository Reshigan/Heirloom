'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Bell, Check, CheckCheck, Sparkles, TrendingUp, Settings } from 'lucide-react'
import { GoldCard } from '@/components/gold-card'
import { useNotifications } from '@/contexts/NotificationContext'
import { apiClient } from '@/lib/api-client'
import Link from 'next/link'

export default function NotificationsPage() {
  const { notifications, refreshNotifications } = useNotifications()
  const [loading, setLoading] = useState(false)

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await apiClient.post('/notifications/mark-read', {
        ids: [notificationId]
      })
      await refreshNotifications()
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const handleMarkAllAsSeen = async () => {
    try {
      setLoading(true)
      await apiClient.post('/notifications/mark-all-seen', {})
      await refreshNotifications()
    } catch (error) {
      console.error('Failed to mark all as seen:', error)
    } finally {
      setLoading(false)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'story_prompt':
        return <Sparkles className="text-gold-primary" size={20} />
      case 'usage_limit_warning':
      case 'usage_limit_reached':
        return <TrendingUp className="text-orange-400" size={20} />
      default:
        return <Bell className="text-gold-primary" size={20} />
    }
  }

  const getNotificationAction = (notification: any) => {
    if (notification.type === 'story_prompt') {
      return (
        <Link
          href="/app"
          className="text-sm text-gold-primary hover:text-gold-secondary transition-colors"
        >
          Add a Memory →
        </Link>
      )
    }
    if (notification.type === 'usage_limit_warning' || notification.type === 'usage_limit_reached') {
      return (
        <Link
          href="/billing"
          className="text-sm text-gold-primary hover:text-gold-secondary transition-colors"
        >
          Upgrade Plan →
        </Link>
      )
    }
    if (notification.actionUrl) {
      return (
        <Link
          href={notification.actionUrl}
          className="text-sm text-gold-primary hover:text-gold-secondary transition-colors"
        >
          View →
        </Link>
      )
    }
    return null
  }

  const unreadCount = notifications.filter(n => !n.readAt).length

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-12"
      >
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-5xl md:text-6xl font-serif font-light text-gold-primary tracking-wide">
            Notifications
          </h1>
          <Link
            href="/app/settings"
            className="flex items-center gap-2 px-4 py-2 bg-obsidian-light/50 hover:bg-obsidian-light/70 border border-gold-primary/20 rounded-lg transition-colors"
          >
            <Settings size={18} className="text-gold-primary" />
            <span className="text-sm text-pearl">Preferences</span>
          </Link>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xl text-pearl/70">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
          {notifications.length > 0 && (
            <button
              onClick={handleMarkAllAsSeen}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gold-primary hover:text-gold-secondary transition-colors disabled:opacity-50"
            >
              <CheckCheck size={16} />
              Mark all as seen
            </button>
          )}
        </div>
      </motion.div>

      {notifications.length === 0 ? (
        <GoldCard>
          <div className="text-center py-16">
            <Bell className="mx-auto mb-4 text-gold-primary/50" size={64} />
            <p className="text-xl text-pearl/70 mb-2">No notifications</p>
            <p className="text-sm text-pearl/50">
              You're all caught up!
            </p>
          </div>
        </GoldCard>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification, index) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 + index * 0.05 }}
            >
              <GoldCard hover>
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        {notification.title && (
                          <h3 className="text-lg font-medium text-pearl mb-1">
                            {notification.title}
                          </h3>
                        )}
                        <p className="text-pearl/70 text-sm">
                          {notification.body || notification.type}
                        </p>
                        <p className="text-xs text-pearl/50 mt-2">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {!notification.readAt && (
                        <div className="w-2 h-2 rounded-full bg-gold-primary flex-shrink-0 mt-2" />
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-3">
                      {getNotificationAction(notification)}
                      {!notification.readAt && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="flex items-center gap-1 text-xs text-pearl/50 hover:text-pearl transition-colors"
                        >
                          <Check size={14} />
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </GoldCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
