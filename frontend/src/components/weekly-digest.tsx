'use client'

import React, { useState, useEffect } from 'react'
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
import { apiClient } from '../lib/api-client'

interface ApiDigestItem {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  icon: string;
  color: string;
}

interface NotificationSettings {
  digestEnabled: boolean;
  frequency: string;
}

const WeeklyDigest: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'digest' | 'reminders' | 'settings'>('digest')
  const [digestItems, setDigestItems] = useState<ApiDigestItem[]>([])
  const [digestStats, setDigestStats] = useState<any>({})
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    weeklyDigest: true,
    daily_reminders: false,
    new_comments: true,
    new_memories: true,
    birthdays: true,
    anniversaries: true,
    story_prompts: true,
    family_activity: true,
    emailNotifications: true,
    pushNotifications: false
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [digestData, settingsData] = await Promise.all([
        apiClient.getWeeklyDigest(),
        apiClient.getNotificationSettings()
      ])
      
      setDigestItems(digestData.items)
      setDigestStats(digestData.stats)
      setNotificationSettings(settingsData)
    } catch (error) {
      console.error('Failed to load digest data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSettingsChange = async (key: keyof NotificationSettings, value: boolean) => {
    try {
      setIsSaving(true)
      const updatedSettings = { ...notificationSettings, [key]: value }
      setNotificationSettings(updatedSettings)
      await apiClient.updateNotificationSettings({ [key]: value })
    } catch (error) {
      console.error('Failed to update settings:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const getIconForType = (type: string) => {
    switch (type) {
      case 'comment': return MessageCircle
      case 'memory': return ImageIcon
      case 'birthday': return Cake
      case 'anniversary': return Heart
      case 'milestone': return Award
      case 'on-this-day': return Heart
      case 'prompt': return Sparkles
      default: return Bell
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-obsidian-900 via-obsidian-800 to-charcoal text-pearl p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-400 mx-auto mb-4"></div>
          <p className="text-gold-300">Loading your weekly digest...</p>
        </div>
      </div>
    )
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
            <div className="p-3 bg-gradient-to-r from-gold-600 to-gold-500 rounded-xl">
              <Bell className="w-6 h-6 text-obsidian-900" />
            </div>
            <div>
              <h1 className="text-3xl font-serif bg-gradient-to-r from-gold-400 to-gold-300 bg-clip-text text-transparent">
                Weekly Digest & Reminders
              </h1>
              <p className="text-gold-400/70 mt-1">
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
                  ? 'bg-gradient-to-r from-gold-600 to-gold-500 text-obsidian-900 shadow-lg'
                  : 'text-gold-400/70 hover:text-gold-400 hover:bg-obsidian-700/50'
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
              <div className="bg-gradient-to-br from-obsidian-800/80 to-charcoal/80 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/20">
                <h3 className="text-xl font-semibold text-gold-300 mb-6 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Your Week in Review
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                  {[
                    { label: 'Memories', value: activityStats.memoriesAdded, icon: ImageIcon, color: 'from-gold-600 to-gold-500' },
                    { label: 'Comments', value: activityStats.commentsReceived, icon: MessageCircle, color: 'from-gold-600/90 to-gold-500/90' },
                    { label: 'Reactions', value: activityStats.reactionsReceived, icon: Heart, color: 'from-gold-600/80 to-gold-500/80' },
                    { label: 'Views', value: activityStats.profileViews, icon: Eye, color: 'from-gold-600/70 to-gold-500/70' },
                    { label: 'Connections', value: activityStats.newConnections, icon: Users, color: 'from-gold-600/60 to-gold-500/60' },
                    { label: 'Stories', value: activityStats.storiesRecorded, icon: Sparkles, color: 'from-gold-600/50 to-gold-500/50' }
                  ].map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="text-center p-4 bg-obsidian-900/50 rounded-lg"
                    >
                      <div className={`w-10 h-10 bg-gradient-to-r ${stat.color} rounded-lg flex items-center justify-center text-obsidian-900 mb-2 mx-auto`}>
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
                
                {digestItems.map((item, index) => {
                  const Icon = getIconForType(item.type)
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-gradient-to-br from-obsidian-800/80 to-charcoal/80 backdrop-blur-sm rounded-xl p-4 border border-gold-500/20 hover:border-gold-500/40 transition-all duration-300 group cursor-pointer"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-3 bg-gradient-to-r ${item.color} rounded-lg flex-shrink-0`}>
                          <Icon className="w-5 h-5 text-obsidian-900" />
                        </div>
                        
                        <div className="flex-1">
                          <h4 className="text-gold-100 font-semibold mb-1 group-hover:text-gold-300 transition-colors">
                            {item.title}
                          </h4>
                          <p className="text-gold-400/70 text-sm mb-2">{item.description}</p>
                          <div className="flex items-center gap-2 text-xs text-gold-400/60">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <ChevronRight className="w-5 h-5 text-gold-400/60 group-hover:text-gold-400 transition-colors flex-shrink-0" />
                      </div>
                    </motion.div>
                  )
                })}
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
              <div className="bg-gradient-to-br from-obsidian-800/80 to-charcoal/80 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/20">
                <h3 className="text-xl font-semibold text-gold-300 mb-6 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Upcoming Events & Reminders
                </h3>
                
                <div className="space-y-4">
                  <p className="text-gold-400/70 text-sm">No upcoming reminders at this time.</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-obsidian-800/80 to-charcoal/80 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/20">
                <h3 className="text-xl font-semibold text-gold-300 mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  This Week's Story Prompt
                </h3>
                <div className="bg-gradient-to-r from-gold-600/20 to-gold-500/20 border border-gold-500/30 rounded-xl p-6">
                  <p className="text-xl font-serif text-gold-100 mb-4 italic">
                    "Tell me about your favorite childhood memory"
                  </p>
                  <p className="text-gold-400/70 mb-4">
                    Take a few minutes this week to record your answer. Your family will treasure these stories for generations.
                  </p>
                  <button className="px-6 py-3 bg-gradient-to-r from-gold-600 to-gold-500 text-obsidian-900 rounded-lg hover:from-gold-500 hover:to-gold-400 transition-all duration-300 font-semibold flex items-center gap-2">
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
              <div className="bg-gradient-to-br from-obsidian-800/80 to-charcoal/80 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/20">
                <h3 className="text-xl font-semibold text-gold-300 mb-6 flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notification Preferences
                </h3>
                
                <div className="space-y-4">
                  {[
                    { key: 'weeklyDigest', label: 'Weekly Digest', description: 'Receive a summary of family activity every week', icon: TrendingUp },
                    { key: 'daily_reminders', label: 'Daily Reminders', description: 'Get daily notifications about upcoming events', icon: Calendar },
                    { key: 'new_comments', label: 'New Comments', description: 'Notify when someone comments on your memories', icon: MessageCircle },
                    { key: 'new_memories', label: 'New Memories', description: 'Alert when family members add new memories', icon: ImageIcon },
                    { key: 'birthdays', label: 'Birthday Reminders', description: 'Remind me of upcoming family birthdays', icon: Cake },
                    { key: 'anniversaries', label: 'Anniversary Reminders', description: 'Remind me of important anniversaries', icon: Heart },
                    { key: 'story_prompts', label: 'Story Prompts', description: 'Send weekly prompts to record family stories', icon: Sparkles },
                    { key: 'family_activity', label: 'Family Activity', description: 'Updates about family member activities', icon: Users }
                  ].map((setting) => (
                    <div key={setting.key} className="flex items-start justify-between p-4 bg-obsidian-900/50 rounded-lg">
                      <div className="flex items-start gap-3 flex-1">
                        <setting.icon className="w-5 h-5 text-gold-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-gold-100 font-medium">{setting.label}</div>
                          <div className="text-gold-400/70 text-sm">{setting.description}</div>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer ml-4">
                        <input
                          type="checkbox"
                          checked={notificationSettings[setting.key as keyof NotificationSettings]}
                          onChange={(e) => handleSettingsChange(setting.key as keyof NotificationSettings, e.target.checked)}
                          className="sr-only peer"
                          disabled={isSaving}
                        />
                        <div className="w-11 h-6 bg-obsidian-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gold-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-gold-600 peer-checked:to-gold-500"></div>
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
                        onChange={(e) => handleSettingsChange('emailNotifications', e.target.checked)}
                        className="sr-only peer"
                        disabled={isSaving}
                      />
                      <div className="w-11 h-6 bg-obsidian-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gold-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-600 peer-checked:to-blue-500"></div>
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
                        onChange={(e) => handleSettingsChange('pushNotifications', e.target.checked)}
                        className="sr-only peer"
                        disabled={isSaving}
                      />
                      <div className="w-11 h-6 bg-obsidian-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gold-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-green-600 peer-checked:to-green-500"></div>
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
