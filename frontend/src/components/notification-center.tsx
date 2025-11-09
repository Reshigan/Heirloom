'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X, Calendar, Award, Sparkles, Heart } from 'lucide-react'
import { LuxCard, LuxButton, LuxPanel } from './lux'

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
        title: 'Vault Backup Complete',
        message: 'Your vault has been securely backed up. All memories are encrypted and safe.',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        read: false,
        icon: <Award className="w-5 h-5 text-green-400" />,
        actionLabel: 'View Status'
      },
      {
        id: '2',
        type: 'reminder',
        title: 'Legacy Token Reminder',
        message: 'Remember to securely store your Legacy Token with your will or estate documents.',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        read: true,
        icon: <Bell className="w-5 h-5 text-gold-400" />,
        actionLabel: 'View Tokens'
      }
    ]

    const planReminders: Record<string, Notification> = {
      essential: {
        id: '3',
        type: 'reminder',
        title: 'Weekly Journaling Reminder',
        message: 'Take a moment this week to document your memories for your vault.',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
        read: false,
        icon: <Calendar className="w-5 h-5 text-gold-400" />,
        actionLabel: 'Add Memory'
      },
      premium: {
        id: '3',
        type: 'reminder',
        title: 'Bi-Weekly Vault Update',
        message: 'Add new memories to your private vault to preserve your legacy.',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
        read: false,
        icon: <Calendar className="w-5 h-5 text-gold-400" />,
        actionLabel: 'Add Memory'
      },
      unlimited: {
        id: '3',
        type: 'reminder',
        title: 'Daily Legacy Moment',
        message: 'Capture today\'s moments for your private vault.',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        read: false,
        icon: <Sparkles className="w-5 h-5 text-gold-400" />,
        actionLabel: 'Add Memory'
      },
      dynasty: {
        id: '3',
        type: 'reminder',
        title: 'Legacy Preservation',
        message: 'Document your story today. Your vault awaits your memories.',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        read: false,
        icon: <Heart className="w-5 h-5 text-gold-400" />,
        actionLabel: 'Add Memory'
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
      className="fixed right-0 top-0 h-full w-full md:w-96 z-50 overflow-hidden flex flex-col"
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
            className="p-2"
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
              className={`cursor-pointer transition-all ${
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
              We'll notify you about vault status and journaling reminders
            </p>
          </div>
        )}
      </div>
    </motion.div>
  )
}
