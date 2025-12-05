'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Settings, Bell, Mail, Sparkles, Calendar, Heart, Users, Save } from 'lucide-react'
import { GoldCard } from '@/components/gold-card'
import { apiClient } from '@/lib/api-client'

interface NotificationSettings {
  weekly_digest: boolean
  daily_reminders: boolean
  new_comments: boolean
  new_memories: boolean
  birthdays: boolean
  anniversaries: boolean
  story_prompts: boolean
  family_activity: boolean
  email_notifications: boolean
  push_notifications: boolean
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await apiClient.get('/notifications/settings')
      setSettings(response.data)
    } catch (error) {
      console.error('Failed to load notification settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!settings) return

    try {
      setSaving(true)
      await apiClient.put('/notifications/settings', settings)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Failed to save notification settings:', error)
    } finally {
      setSaving(false)
    }
  }

  const toggleSetting = (key: keyof NotificationSettings) => {
    if (!settings) return
    setSettings({
      ...settings,
      [key]: !settings[key]
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center py-16">
          <p className="text-pearl/50">Loading settings...</p>
        </div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center py-16">
          <p className="text-pearl/50">Failed to load settings</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-12"
      >
        <h1 className="text-5xl md:text-6xl font-serif font-light text-gold-primary mb-4 tracking-wide">
          Notification Settings
        </h1>
        <p className="text-xl text-pearl/70">
          Customize how you receive updates
        </p>
      </motion.div>

      <div className="space-y-6">
        <GoldCard>
          <div className="flex items-center gap-3 mb-6">
            <Mail className="text-gold-primary" size={24} />
            <h2 className="text-2xl font-serif text-pearl">Email Notifications</h2>
          </div>
          
          <div className="space-y-4">
            <SettingToggle
              label="Email Notifications"
              description="Receive notifications via email"
              checked={settings.email_notifications}
              onChange={() => toggleSetting('email_notifications')}
            />
            
            <SettingToggle
              label="Weekly Digest"
              description="Get a weekly summary of your vault activity"
              checked={settings.weekly_digest}
              onChange={() => toggleSetting('weekly_digest')}
            />
            
            <SettingToggle
              label="Daily Reminders"
              description="Receive daily reminders to add memories"
              checked={settings.daily_reminders}
              onChange={() => toggleSetting('daily_reminders')}
            />
          </div>
        </GoldCard>

        <GoldCard>
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="text-gold-primary" size={24} />
            <h2 className="text-2xl font-serif text-pearl">Content & Engagement</h2>
          </div>
          
          <div className="space-y-4">
            <SettingToggle
              label="Story Prompts"
              description="Get inspired with story prompts to capture memories"
              checked={settings.story_prompts}
              onChange={() => toggleSetting('story_prompts')}
            />
            
            <SettingToggle
              label="New Comments"
              description="Notify when someone comments on your memories"
              checked={settings.new_comments}
              onChange={() => toggleSetting('new_comments')}
            />
            
            <SettingToggle
              label="New Memories"
              description="Notify when new memories are added to your vault"
              checked={settings.new_memories}
              onChange={() => toggleSetting('new_memories')}
            />
          </div>
        </GoldCard>

        <GoldCard>
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="text-gold-primary" size={24} />
            <h2 className="text-2xl font-serif text-pearl">Special Occasions</h2>
          </div>
          
          <div className="space-y-4">
            <SettingToggle
              label="Birthdays"
              description="Remind you of upcoming birthdays"
              checked={settings.birthdays}
              onChange={() => toggleSetting('birthdays')}
            />
            
            <SettingToggle
              label="Anniversaries"
              description="Remind you of important anniversaries"
              checked={settings.anniversaries}
              onChange={() => toggleSetting('anniversaries')}
            />
          </div>
        </GoldCard>

        <GoldCard>
          <div className="flex items-center gap-3 mb-6">
            <Users className="text-gold-primary" size={24} />
            <h2 className="text-2xl font-serif text-pearl">Family & Social</h2>
          </div>
          
          <div className="space-y-4">
            <SettingToggle
              label="Family Activity"
              description="Notify when family members interact with your vault"
              checked={settings.family_activity}
              onChange={() => toggleSetting('family_activity')}
            />
          </div>
        </GoldCard>

        <div className="flex justify-end gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gold-primary to-gold-secondary text-obsidian font-medium rounded-lg hover:shadow-lg hover:shadow-gold-primary/20 transition-all disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
          </button>
        </div>

        {saved && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-gold-primary text-sm"
          >
            Settings saved successfully!
          </motion.div>
        )}
      </div>
    </div>
  )
}

interface SettingToggleProps {
  label: string
  description: string
  checked: boolean
  onChange: () => void
}

function SettingToggle({ label, description, checked, onChange }: SettingToggleProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gold-primary/10 last:border-0">
      <div className="flex-1">
        <p className="text-pearl font-medium">{label}</p>
        <p className="text-sm text-pearl/50 mt-1">{description}</p>
      </div>
      <button
        onClick={onChange}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          checked ? 'bg-gold-primary' : 'bg-obsidian-light'
        }`}
      >
        <div
          className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-pearl transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}
