'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bell, 
  Calendar, 
  Clock,
  Heart,
  MessageCircle,
  Star,
  TrendingUp,
  Users,
  Image as ImageIcon,
  Sparkles,
  Gift,
  Cake,
  Award,
  MapPin,
  Eye,
  ChevronRight,
  Settings,
  Mail,
  Smartphone,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { mockMemories, mockTimelineEvents, mockFamilyMembers } from '../data/mock-family-data'

interface DigestItem {
  id: string
  type: 'comment' | 'memory' | 'birthday' | 'anniversary' | 'milestone' | 'on-this-day' | 'prompt'
  title: string
  description: string
  timestamp: Date
  icon: React.ComponentType<any>
  color: string
  actionUrl?: string
}

const WeeklyDigest: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'digest' | 'reminders' | 'settings'>('digest')
  const [notificationSettings, setNotificationSettings] = useState({
    weeklyDigest: true,
    dailyReminders: false,
    newComments: true,
    newMemories: true,
    birthdays: true,
    anniversaries: true,
    storyPrompts: true,
    familyActivity: true,
    emailNotifications: true,
    pushNotifications: false
  })

  const currentDate = new Date()
  const weekStart = new Date(currentDate)
  weekStart.setDate(currentDate.getDate() - 7)

  const digestItems: DigestItem[] = [
    {
      id: '1',
      type: 'comment',
      title: 'New Comments on Your Memories',
      description: '5 family members commented on 3 of your memories this week',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      icon: MessageCircle,
      color: 'from-blue-600 to-blue-500',
      actionUrl: '/memories'
    },
    {
      id: '2',
      type: 'memory',
      title: 'New Family Memories Added',
      description: 'Emma Hamilton shared 8 new photos from her marine research trip',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      icon: ImageIcon,
      color: 'from-green-600 to-green-500',
      actionUrl: '/memories'
    },
    {
      id: '3',
      type: 'birthday',
      title: 'Upcoming Birthday',
      description: 'Oliver Hamilton turns 7 in 3 days! (May 30)',
      timestamp: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      icon: Cake,
      color: 'from-pink-600 to-pink-500',
      actionUrl: '/family'
    },
    {
      id: '4',
      type: 'on-this-day',
      title: 'On This Day - 25 Years Ago',
      description: 'James and Linda Hamilton got married on this day in 2000',
      timestamp: new Date(Date.now()),
      icon: Heart,
      color: 'from-red-600 to-red-500',
      actionUrl: '/timeline'
    },
    {
      id: '5',
      type: 'prompt',
      title: 'Weekly Story Prompt',
      description: 'Tell me about your favorite childhood memory',
      timestamp: new Date(Date.now()),
      icon: Sparkles,
      color: 'from-purple-600 to-purple-500',
      actionUrl: '/record'
    },
    {
      id: '6',
      type: 'milestone',
      title: 'Family Milestone Reached',
      description: 'Your family has preserved 500 memories on Heirloom!',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      icon: Award,
      color: 'from-gold-600 to-gold-500'
    }
  ]

  const upcomingReminders = [
    {
      id: '1',
      title: 'Oliver Hamilton\'s Birthday',
      date: new Date(2025, 4, 30),
      type: 'birthday',
      icon: Cake,
      color: 'text-pink-400'
    },
    {
      id: '2',
      title: 'James & Linda Anniversary',
      date: new Date(2025, 5, 15),
      type: 'anniversary',
      icon: Heart,
      color: 'text-red-400'
    },
    {
      id: '3',
      title: 'Weekly Story Recording',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      type: 'prompt',
      icon: Sparkles,
      color: 'text-purple-400'
    },
    {
      id: '4',
      title: 'Year in Review Generation',
      date: new Date(2025, 11, 1),
      type: 'milestone',
      icon: Star,
      color: 'text-gold-400'
    }
  ]

  const activityStats = {
    memoriesAdded: 12,
    commentsReceived: 23,
    reactionsReceived: 47,
    profileViews: 89,
    newConnections: 2,
    storiesRecorded: 3
  }

  const getDaysUntil = (date: Date) => {
    const now = new Date()
    const diff = date.getTime() - now.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    if (days === 0) return 'Today'
    if (days === 1) return 'Tomorrow'
    if (days < 0) return 'Past'
    return `In ${days} days`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-obsidian-900 via-obsidian-800 to-charcoal text-pearl p-8">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-purple-600 to-purple-500 rounded-xl">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-purple-300 bg-clip-text text-transparent">
                Weekly Digest & Reminders
              </h1>
              <p className="text-purple-400/70 mt-1">
                Stay connected with your family's story
              </p>
            </div>
          </div>
        </motion.div>

        <div className="flex space-x-1 mb-8 bg-obsidian-800/50 p-1 rounded-xl backdrop-blur-sm">
          {[
            { id: 'digest', label: 'This Week', icon: TrendingUp },
            { id: 'reminders', label: 'Upcoming', icon: Calendar },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg'
                  : 'text-purple-400/70 hover:text-purple-400 hover:bg-obsidian-700/50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'digest' && (
            <motion.div
              key="digest"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="bg-gradient-to-br from-obsidian-800/80 to-charcoal/80 backdrop-blur-sm rounded-2xl p-6 border border-purple-600/20">
                <h3 className="text-xl font-semibold text-gold-300 mb-6 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Your Week in Review
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                  {[
                    { label: 'Memories', value: activityStats.memoriesAdded, icon: ImageIcon, color: 'from-blue-600 to-blue-500' },
                    { label: 'Comments', value: activityStats.commentsReceived, icon: MessageCircle, color: 'from-green-600 to-green-500' },
                    { label: 'Reactions', value: activityStats.reactionsReceived, icon: Heart, color: 'from-red-600 to-red-500' },
                    { label: 'Views', value: activityStats.profileViews, icon: Eye, color: 'from-purple-600 to-purple-500' },
                    { label: 'Connections', value: activityStats.newConnections, icon: Users, color: 'from-gold-600 to-gold-500' },
                    { label: 'Stories', value: activityStats.storiesRecorded, icon: Sparkles, color: 'from-pink-600 to-pink-500' }
                  ].map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="text-center p-4 bg-obsidian-900/50 rounded-lg"
                    >
                      <div className={`w-10 h-10 bg-gradient-to-r ${stat.color} rounded-lg flex items-center justify-center text-white mb-2 mx-auto`}>
                        <stat.icon className="w-5 h-5" />
                      </div>
                      <div className="text-2xl font-bold text-gold-100 mb-1">{stat.value}</div>
                      <div className="text-gold-400/70 text-xs">{stat.label}</div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gold-300 flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Recent Activity
                </h3>
                
                {digestItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-gradient-to-br from-obsidian-800/80 to-charcoal/80 backdrop-blur-sm rounded-xl p-4 border border-purple-600/20 hover:border-purple-600/40 transition-all duration-300 group cursor-pointer"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-3 bg-gradient-to-r ${item.color} rounded-lg flex-shrink-0`}>
                        <item.icon className="w-5 h-5 text-white" />
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="text-gold-100 font-semibold mb-1 group-hover:text-gold-300 transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-gold-400/70 text-sm mb-2">{item.description}</p>
                        <div className="flex items-center gap-2 text-xs text-gold-400/60">
                          <Clock className="w-3 h-3" />
                          <span>{item.timestamp.toLocaleDateString()}</span>
                        </div>
                      </div>

                      {item.actionUrl && (
                        <ChevronRight className="w-5 h-5 text-gold-400/60 group-hover:text-gold-400 transition-colors flex-shrink-0" />
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'reminders' && (
            <motion.div
              key="reminders"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="bg-gradient-to-br from-obsidian-800/80 to-charcoal/80 backdrop-blur-sm rounded-2xl p-6 border border-purple-600/20">
                <h3 className="text-xl font-semibold text-gold-300 mb-6 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Upcoming Events & Reminders
                </h3>
                
                <div className="space-y-4">
                  {upcomingReminders.map((reminder, index) => (
                    <motion.div
                      key={reminder.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 bg-obsidian-900/50 rounded-lg border border-purple-600/10 hover:border-purple-600/30 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <reminder.icon className={`w-6 h-6 ${reminder.color}`} />
                        <div>
                          <h4 className="text-gold-100 font-semibold">{reminder.title}</h4>
                          <p className="text-gold-400/70 text-sm">{reminder.date.toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-gold-100 font-semibold">{getDaysUntil(reminder.date)}</div>
                        <div className="text-gold-400/60 text-xs capitalize">{reminder.type}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-obsidian-800/80 to-charcoal/80 backdrop-blur-sm rounded-2xl p-6 border border-purple-600/20">
                <h3 className="text-xl font-semibold text-gold-300 mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  This Week's Story Prompt
                </h3>
                <div className="bg-gradient-to-r from-purple-600/20 to-purple-500/20 border border-purple-500/30 rounded-xl p-6">
                  <p className="text-xl font-serif text-gold-100 mb-4 italic">
                    "Tell me about your favorite childhood memory"
                  </p>
                  <p className="text-gold-400/70 mb-4">
                    Take a few minutes this week to record your answer. Your family will treasure these stories for generations.
                  </p>
                  <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg hover:from-purple-500 hover:to-purple-400 transition-all duration-300 font-semibold flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Record Your Story
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="bg-gradient-to-br from-obsidian-800/80 to-charcoal/80 backdrop-blur-sm rounded-2xl p-6 border border-purple-600/20">
                <h3 className="text-xl font-semibold text-gold-300 mb-6 flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notification Preferences
                </h3>
                
                <div className="space-y-4">
                  {[
                    { key: 'weeklyDigest', label: 'Weekly Digest', description: 'Receive a summary of family activity every week', icon: TrendingUp },
                    { key: 'dailyReminders', label: 'Daily Reminders', description: 'Get daily notifications about upcoming events', icon: Calendar },
                    { key: 'newComments', label: 'New Comments', description: 'Notify when someone comments on your memories', icon: MessageCircle },
                    { key: 'newMemories', label: 'New Memories', description: 'Alert when family members add new memories', icon: ImageIcon },
                    { key: 'birthdays', label: 'Birthday Reminders', description: 'Remind me of upcoming family birthdays', icon: Cake },
                    { key: 'anniversaries', label: 'Anniversary Reminders', description: 'Remind me of important anniversaries', icon: Heart },
                    { key: 'storyPrompts', label: 'Story Prompts', description: 'Send weekly prompts to record family stories', icon: Sparkles },
                    { key: 'familyActivity', label: 'Family Activity', description: 'Updates about family member activities', icon: Users }
                  ].map((setting) => (
                    <div key={setting.key} className="flex items-start justify-between p-4 bg-obsidian-900/50 rounded-lg">
                      <div className="flex items-start gap-3 flex-1">
                        <setting.icon className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-gold-100 font-medium">{setting.label}</div>
                          <div className="text-gold-400/70 text-sm">{setting.description}</div>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer ml-4">
                        <input
                          type="checkbox"
                          checked={notificationSettings[setting.key as keyof typeof notificationSettings]}
                          onChange={(e) => setNotificationSettings({
                            ...notificationSettings,
                            [setting.key]: e.target.checked
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-obsidian-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple-600 peer-checked:to-purple-500"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-obsidian-800/80 to-charcoal/80 backdrop-blur-sm rounded-2xl p-6 border border-purple-600/20">
                <h3 className="text-xl font-semibold text-gold-300 mb-6 flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Delivery Channels
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-start justify-between p-4 bg-obsidian-900/50 rounded-lg">
                    <div className="flex items-start gap-3 flex-1">
                      <Mail className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-gold-100 font-medium">Email Notifications</div>
                        <div className="text-gold-400/70 text-sm">Receive notifications via email</div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-4">
                      <input
                        type="checkbox"
                        checked={notificationSettings.emailNotifications}
                        onChange={(e) => setNotificationSettings({
                          ...notificationSettings,
                          emailNotifications: e.target.checked
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-obsidian-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-600 peer-checked:to-blue-500"></div>
                    </label>
                  </div>

                  <div className="flex items-start justify-between p-4 bg-obsidian-900/50 rounded-lg">
                    <div className="flex items-start gap-3 flex-1">
                      <Smartphone className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-gold-100 font-medium">Push Notifications</div>
                        <div className="text-gold-400/70 text-sm">Receive push notifications on your device</div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-4">
                      <input
                        type="checkbox"
                        checked={notificationSettings.pushNotifications}
                        onChange={(e) => setNotificationSettings({
                          ...notificationSettings,
                          pushNotifications: e.target.checked
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-obsidian-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-green-600 peer-checked:to-green-500"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-600/20 to-green-500/20 border border-green-500/30 rounded-xl p-4 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-green-300 font-semibold mb-1">Settings Saved</div>
                  <div className="text-green-200/80 text-sm">Your notification preferences have been updated successfully.</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default WeeklyDigest
