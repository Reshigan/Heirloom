'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, MessageCircle, Share2, Award, Upload, Users, Calendar, Sparkles } from 'lucide-react'

interface Activity {
  id: string
  type: 'upload' | 'comment' | 'reaction' | 'milestone' | 'collaboration'
  user: {
    name: string
    avatar: string
    relationship: string
  }
  content: string
  memory?: {
    title: string
    thumbnail: string
  }
  timestamp: Date
  reactions: number
  comments: number
}

export default function ActivityFeed() {
  const [activities] = useState<Activity[]>([
    {
      id: '1',
      type: 'upload',
      user: {
        name: 'Sarah Hamilton',
        avatar: '👩',
        relationship: 'Daughter'
      },
      content: 'added 5 new photos to Summer Vacation 2023',
      memory: {
        title: 'Beach Day',
        thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200'
      },
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      reactions: 12,
      comments: 3
    },
    {
      id: '2',
      type: 'milestone',
      user: {
        name: 'Michael Hamilton',
        avatar: '👨',
        relationship: 'Father'
      },
      content: 'reached 100 memories milestone! 🎉',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      reactions: 24,
      comments: 8
    },
    {
      id: '3',
      type: 'collaboration',
      user: {
        name: 'Eleanor Whitmore',
        avatar: '👵',
        relationship: 'Grandmother'
      },
      content: 'added a story to "Family Reunion 1985"',
      memory: {
        title: 'The Great Gathering',
        thumbnail: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=200'
      },
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      reactions: 18,
      comments: 5
    },
    {
      id: '4',
      type: 'comment',
      user: {
        name: 'Jessica Hamilton',
        avatar: '👩‍🦰',
        relationship: 'Mother'
      },
      content: 'commented on "Wedding Day 1990"',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      reactions: 6,
      comments: 2
    }
  ])

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'upload':
        return <Upload className="w-4 h-4 text-blue-400" />
      case 'comment':
        return <MessageCircle className="w-4 h-4 text-green-400" />
      case 'reaction':
        return <Heart className="w-4 h-4 text-red-400" />
      case 'milestone':
        return <Award className="w-4 h-4 text-gold-400" />
      case 'collaboration':
        return <Users className="w-4 h-4 text-purple-400" />
    }
  }

  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-serif text-gold-400">Family Activity</h2>
        <button className="text-sm text-gold-400 hover:text-gold-300 transition-colors">
          View All
        </button>
      </div>

      <div className="space-y-3">
        {activities.map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-card p-4 hover:border-gold-500/30 transition-all cursor-pointer"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-500/20 to-gold-600/20 flex items-center justify-center text-xl border border-gold-500/30">
                  {activity.user.avatar}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <p className="text-sm text-pearl">
                      <span className="font-medium text-gold-400">{activity.user.name}</span>
                      {' '}
                      <span className="text-pearl/70">{activity.content}</span>
                    </p>
                    <p className="text-xs text-pearl/50 mt-1">
                      {activity.user.relationship} · {formatTimestamp(activity.timestamp)}
                    </p>
                  </div>
                  
                  <div className="flex-shrink-0">
                    {getActivityIcon(activity.type)}
                  </div>
                </div>

                {activity.memory && (
                  <div className="mt-3 flex items-center gap-3 p-2 rounded-lg bg-obsidian-800/30 border border-gold-500/10">
                    <img
                      src={activity.memory.thumbnail}
                      alt={activity.memory.title}
                      className="w-12 h-12 rounded object-cover"
                    />
                    <span className="text-sm text-pearl/80">{activity.memory.title}</span>
                  </div>
                )}

                <div className="flex items-center gap-4 mt-3 text-xs text-pearl/60">
                  <button className="flex items-center gap-1 hover:text-gold-400 transition-colors">
                    <Heart className="w-4 h-4" />
                    <span>{activity.reactions}</span>
                  </button>
                  <button className="flex items-center gap-1 hover:text-gold-400 transition-colors">
                    <MessageCircle className="w-4 h-4" />
                    <span>{activity.comments}</span>
                  </button>
                  <button className="flex items-center gap-1 hover:text-gold-400 transition-colors">
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="glass-card p-6 text-center">
        <Sparkles className="w-8 h-8 text-gold-400 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gold-400 mb-2">Stay Connected</h3>
        <p className="text-sm text-pearl/70 mb-4">
          Invite more family members to see their activity here
        </p>
        <button className="glass-button-primary">
          Invite Family
        </button>
      </div>
    </div>
  )
}
