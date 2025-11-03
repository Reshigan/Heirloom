'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Flame, Award, TrendingUp, Target, Star, Calendar } from 'lucide-react'

interface EngagementStats {
  currentStreak: number
  longestStreak: number
  totalMemories: number
  thisWeekMemories: number
  achievements: Achievement[]
  nextMilestone: {
    name: string
    current: number
    target: number
  }
}

interface Achievement {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  unlockedAt?: Date
  progress?: number
}

export default function EngagementTracker() {
  const stats: EngagementStats = {
    currentStreak: 7,
    longestStreak: 14,
    totalMemories: 47,
    thisWeekMemories: 5,
    nextMilestone: {
      name: '50 Memories',
      current: 47,
      target: 50
    },
    achievements: [
      {
        id: '1',
        name: 'First Memory',
        description: 'Uploaded your first memory',
        icon: <Star className="w-5 h-5 text-gold-400" />,
        unlockedAt: new Date('2024-01-15')
      },
      {
        id: '2',
        name: 'Week Warrior',
        description: '7-day upload streak',
        icon: <Flame className="w-5 h-5 text-orange-400" />,
        unlockedAt: new Date('2024-10-28')
      },
      {
        id: '3',
        name: 'Family Builder',
        description: 'Invited 5 family members',
        icon: <Award className="w-5 h-5 text-purple-400" />,
        progress: 60
      },
      {
        id: '4',
        name: 'Century Club',
        description: 'Upload 100 memories',
        icon: <Target className="w-5 h-5 text-blue-400" />,
        progress: 47
      }
    ]
  }

  const streakPercentage = (stats.currentStreak / stats.longestStreak) * 100

  return (
    <div className="space-y-6">
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-gold-400 mb-4 flex items-center gap-2">
          <Flame className="w-5 h-5" />
          Your Streak
        </h3>
        
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-4xl font-bold text-gold-400">{stats.currentStreak}</div>
            <div className="text-sm text-pearl/60">days in a row</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-semibold text-pearl/80">{stats.longestStreak}</div>
            <div className="text-xs text-pearl/50">longest streak</div>
          </div>
        </div>

        <div className="glass-progress-track">
          <motion.div
            className="glass-progress-fill"
            initial={{ width: 0 }}
            animate={{ width: `${streakPercentage}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>

        <p className="text-xs text-pearl/60 mt-3 text-center">
          Keep it up! Upload a memory today to maintain your streak 🔥
        </p>
      </div>

      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-gold-400 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          This Week
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 rounded-lg bg-obsidian-800/30 border border-gold-500/10">
            <div className="text-3xl font-bold text-gold-400">{stats.thisWeekMemories}</div>
            <div className="text-xs text-pearl/60 mt-1">Memories Added</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-obsidian-800/30 border border-gold-500/10">
            <div className="text-3xl font-bold text-gold-400">{stats.totalMemories}</div>
            <div className="text-xs text-pearl/60 mt-1">Total Memories</div>
          </div>
        </div>
      </div>

      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-gold-400 mb-4 flex items-center gap-2">
          <Target className="w-5 h-5" />
          Next Milestone
        </h3>
        
        <div className="mb-3">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-pearl/80">{stats.nextMilestone.name}</span>
            <span className="text-gold-400 font-medium">
              {stats.nextMilestone.current}/{stats.nextMilestone.target}
            </span>
          </div>
          <div className="glass-progress-track">
            <motion.div
              className="glass-progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${(stats.nextMilestone.current / stats.nextMilestone.target) * 100}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </div>
        
        <p className="text-xs text-pearl/60 text-center">
          Only {stats.nextMilestone.target - stats.nextMilestone.current} more to go!
        </p>
      </div>

      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-gold-400 mb-4 flex items-center gap-2">
          <Award className="w-5 h-5" />
          Achievements
        </h3>
        
        <div className="space-y-3">
          {stats.achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`p-3 rounded-lg border transition-all ${
                achievement.unlockedAt
                  ? 'bg-gold-500/10 border-gold-500/30'
                  : 'bg-obsidian-800/20 border-gold-500/10'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`flex-shrink-0 ${achievement.unlockedAt ? '' : 'opacity-40'}`}>
                  {achievement.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className={`text-sm font-medium ${
                      achievement.unlockedAt ? 'text-gold-400' : 'text-pearl/60'
                    }`}>
                      {achievement.name}
                    </h4>
                    {achievement.unlockedAt && (
                      <span className="text-xs text-gold-400">✓</span>
                    )}
                  </div>
                  <p className="text-xs text-pearl/60 mt-1">{achievement.description}</p>
                  
                  {achievement.progress !== undefined && !achievement.unlockedAt && (
                    <div className="mt-2">
                      <div className="glass-progress-track h-1">
                        <div
                          className="glass-progress-fill h-1"
                          style={{ width: `${achievement.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-pearl/50 mt-1">{achievement.progress}% complete</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
