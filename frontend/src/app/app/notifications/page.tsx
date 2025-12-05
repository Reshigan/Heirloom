'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Bell } from 'lucide-react'
import { GoldCard } from '@/components/gold-card'
import { useNotifications } from '@/contexts/NotificationContext'

export default function NotificationsPage() {
  const { notifications } = useNotifications()

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-12"
      >
        <h1 className="text-5xl md:text-6xl font-serif font-light text-gold-primary mb-4 tracking-wide">
          Notifications
        </h1>
        <p className="text-xl text-pearl/70">
          Stay updated on your memories
        </p>
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
                  <div className={`w-2 h-2 rounded-full mt-2 ${notification.readAt ? 'bg-pearl/30' : 'bg-gold-primary'}`} />
                  <div className="flex-1">
                    <p className="text-pearl">{notification.title || notification.body || notification.type}</p>
                    <p className="text-sm text-pearl/50 mt-1">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
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
