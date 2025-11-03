'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X, Calendar, Users, Award, Sparkles, TrendingUp, Heart } from 'lucide-react'

interface Notification {
  id: string
  type: 'reminder' | 'milestone' | 'activity' | 'achievement' | 'prompt'
  title: string
  message: string
  timestamp: Date
  read: boolean
  icon: React.ReactNode
  actionLabel?: string
  actionUrl?: string
}

interface NotificationCenterProps {
  userPlan: 'essential' | 'premium' | 'unlimited' | 'dynasty'
  onClose: () => void
}

export default function NotificationCenter({ userPlan, onClose }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const mockNotifications = generateNotifications(userPlan)
    setNotifications(mockNotifications)
    setUnreadCount(mockNotifications.filter(n => !n.read).length)
  }, [userPlan])

  const generateNotifications = (plan: string): Notification[] => {
    const baseNotifications: Notification[] = [
      {
        id: '1',
        type: 'prompt',
        title: 'Memory Prompt',
        message: 'On this day 5 years ago, you celebrated your anniversary. Share that memory!',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        read: false,
        icon: <Calendar className="w-5 h-5 text-gold-400" />,
        actionLabel: 'Add Memory',
        actionUrl: '/memories/add'
      },
      {
        id: '2',
        type: 'activity',
        title: 'Family Activity',
        message: 'Sarah Hamilton added 3 new photos to "Summer Vacation 2023"',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
        read: false,
        icon: <Users className="w-5 h-5 text-blue-400" />,
        actionLabel: 'View Photos'
      },
      {
        id: '3',
        type: 'milestone',
        title: '🎉 Milestone Reached!',
        message: 'You\'ve uploaded 50 memories! Your family story is growing.',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        read: true,
        icon: <Award className="w-5 h-5 text-gold-500" />,
        actionLabel: 'View Stats'
      }
    ]

    const planReminders: Record<string, Notification> = {
      essential: {
        id: '4',
        type: 'reminder',
        title: 'Weekly Memory Reminder',
        message: 'It\'s been 7 days since your last upload. Keep your family story alive!',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
        read: false,
        icon: <Bell className="w-5 h-5 text-gold-400" />,
        actionLabel: 'Upload Now'
      },
      premium: {
        id: '4',
        type: 'reminder',
        title: 'Bi-Weekly Check-In',
        message: 'Share a memory from this week to keep your streak going!',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
        read: false,
        icon: <TrendingUp className="w-5 h-5 text-gold-400" />,
        actionLabel: 'Continue Streak'
      },
      unlimited: {
        id: '4',
        type: 'reminder',
        title: 'Daily Memory Moment',
        message: 'Take a moment to capture today\'s special moments with your family.',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        read: false,
        icon: <Sparkles className="w-5 h-5 text-gold-400" />,
        actionLabel: 'Capture Now'
      },
      dynasty: {
        id: '4',
        type: 'reminder',
        title: 'Legacy Builder Alert',
        message: 'Your daily legacy moment awaits. Document your family\'s story today.',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        read: false,
        icon: <Heart className="w-5 h-5 text-gold-400" />,
        actionLabel: 'Build Legacy'
      }
    }

    return [...baseNotifications, planReminders[plan]]
  }

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
    const notification = notifications.find(n => n.id === id)
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
  }

  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className="fixed right-0 top-0 h-full w-full md:w-96 glass-panel z-50 overflow-hidden flex flex-col"
    >
      <div className="p-6 border-b border-gold-500/20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gold-400">Notifications</h2>
            {unreadCount > 0 && (
              <p className="text-sm text-pearl/60">{unreadCount} unread</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="glass-icon-button p-2"
            aria-label="Close notifications"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-sm text-gold-400 hover:text-gold-300 transition-colors"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <AnimatePresence>
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className={`glass-card p-4 cursor-pointer transition-all ${
                !notification.read ? 'border-gold-500/40' : 'border-gold-500/10'
              }`}
              onClick={() => markAsRead(notification.id)}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {notification.icon}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={`text-sm font-medium ${
                      !notification.read ? 'text-pearl' : 'text-pearl/70'
                    }`}>
                      {notification.title}
                    </h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteNotification(notification.id)
                      }}
                      className="text-pearl/40 hover:text-pearl/80 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <p className="text-sm text-pearl/60 mt-1 leading-relaxed">
                    {notification.message}
                  </p>
                  
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-gold-400/60">
                      {formatTimestamp(notification.timestamp)}
                    </span>
                    
                    {notification.actionLabel && (
                      <button className="text-xs text-gold-400 hover:text-gold-300 font-medium transition-colors">
                        {notification.actionLabel} →
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {!notification.read && (
                <div className="absolute top-4 right-4 w-2 h-2 bg-gold-400 rounded-full" />
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {notifications.length === 0 && (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-pearl/20 mx-auto mb-4" />
            <p className="text-pearl/60">No notifications yet</p>
            <p className="text-sm text-pearl/40 mt-2">
              We'll notify you about family activity and memory prompts
            </p>
          </div>
        )}
      </div>
    </motion.div>
  )
}
