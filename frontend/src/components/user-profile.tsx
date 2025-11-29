'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, 
  Settings, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Download, 
  Upload, 
  Trash2, 
  Edit3, 
  Camera, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Users, 
  Image, 
  Clock, 
  Award, 
  Heart,
  Star,
  Eye,
  MessageCircle,
  Share2,
  Save,
  X
} from 'lucide-react'
import { mockFamilyMembers, mockMemories, mockTimelineEvents } from '../data/mock-family-data'

interface UserProfileProps {
  userId?: string
  onClose?: () => void
}

const UserProfile: React.FC<UserProfileProps> = ({ userId = 'c1', onClose }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'stats' | 'settings' | 'privacy'>('profile')
  const [isEditing, setIsEditing] = useState(false)
  const [showImageUpload, setShowImageUpload] = useState(false)
  
  // Get user data (using Michael Hamilton as example)
  const user = mockFamilyMembers.find(m => m.id === userId) || mockFamilyMembers[8] // Michael Hamilton
  const userMemories = mockMemories.filter(m => m.participants.includes(userId))
  const userEvents = mockTimelineEvents.filter(e => e.participants.includes(userId))
  
  // Profile form state
  const [profileData, setProfileData] = useState({
    name: user.name,
    email: 'michael.hamilton@email.com',
    phone: '+1 (555) 123-4567',
    bio: user.bio,
    location: user.birthPlace,
    website: 'https://michaelhamiltux.com',
    notifications: {
      email: true,
      push: true,
      family: true,
      memories: true
    },
    privacy: {
      profileVisible: true,
      memoriesVisible: true,
      contactVisible: false
    },
    theme: 'luxury-gold'
  })

  const stats = {
    memoriesShared: userMemories.length,
    familyConnections: user.relationships.length,
    timelineEvents: userEvents.length,
    profileViews: 1247,
    memoriesViewed: 3891,
    commentsReceived: 156,
    likesReceived: 892
  }

  const handleSave = () => {
    // Save profile data
    setIsEditing(false)
    // TODO: Implement API call to save profile data
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setShowImageUpload(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
      <motion.div
        className="relative w-full max-w-4xl max-h-[90vh] bg-obsidian-900/95 border border-gold-500/30 rounded-2xl overflow-hidden shadow-2xl"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gold-500/20">
          <h2 className="text-2xl font-bold text-gold-100">User Profile</h2>
          <div className="flex items-center gap-2">
            {isEditing && (
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-gradient-to-r from-gold-600 to-gold-500 text-obsidian-900 rounded-lg hover:from-gold-500 hover:to-gold-400 transition-all duration-300 font-semibold flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-gold-400 hover:text-gold-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex h-[calc(90vh-100px)]">
          {/* Sidebar */}
          <div className="w-64 border-r border-gold-500/20 p-4">
            <nav className="space-y-2">
              {[
                { id: 'profile', label: 'Profile', icon: User },
                { id: 'stats', label: 'Statistics', icon: Award },
                { id: 'settings', label: 'Settings', icon: Settings },
                { id: 'privacy', label: 'Privacy', icon: Shield }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-gold-600/20 to-gold-500/20 border border-gold-500/30 text-gold-100'
                      : 'text-gold-400/80 hover:text-gold-100 hover:bg-obsidian-800/40'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              {activeTab === 'profile' && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-6 space-y-6"
                >
                  {/* Profile Header */}
                  <div className="flex items-start gap-6">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-obsidian-900 font-bold text-2xl">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <button
                        onClick={() => setShowImageUpload(true)}
                        className="absolute -bottom-1 -right-1 p-2 bg-obsidian-800 border border-gold-500/30 rounded-full text-gold-400 hover:text-gold-300 transition-colors"
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-2xl font-bold text-gold-100">{user.name}</h3>
                        <button
                          onClick={() => setIsEditing(!isEditing)}
                          className="p-2 text-gold-400 hover:text-gold-300 transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-gold-400/80 mb-1">{user.occupation}</p>
                      <div className="flex items-center gap-4 text-sm text-gold-500/80">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{user.birthPlace}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Born {new Date(user.birthDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Profile Form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-gold-100 font-semibold mb-2">Full Name</label>
                        <input
                          type="text"
                          value={profileData.name}
                          onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                          disabled={!isEditing}
                          className="w-full px-4 py-2 bg-obsidian-800/60 border border-gold-500/20 rounded-lg text-gold-100 focus:outline-none focus:border-gold-400/40 disabled:opacity-60"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-gold-100 font-semibold mb-2">Email</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gold-400 w-4 h-4" />
                          <input
                            type="email"
                            value={profileData.email}
                            onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                            disabled={!isEditing}
                            className="w-full pl-10 pr-4 py-2 bg-obsidian-800/60 border border-gold-500/20 rounded-lg text-gold-100 focus:outline-none focus:border-gold-400/40 disabled:opacity-60"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-gold-100 font-semibold mb-2">Phone</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gold-400 w-4 h-4" />
                          <input
                            type="tel"
                            value={profileData.phone}
                            onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                            disabled={!isEditing}
                            className="w-full pl-10 pr-4 py-2 bg-obsidian-800/60 border border-gold-500/20 rounded-lg text-gold-100 focus:outline-none focus:border-gold-400/40 disabled:opacity-60"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-gold-100 font-semibold mb-2">Location</label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gold-400 w-4 h-4" />
                          <input
                            type="text"
                            value={profileData.location}
                            onChange={(e) => setProfileData({...profileData, location: e.target.value})}
                            disabled={!isEditing}
                            className="w-full pl-10 pr-4 py-2 bg-obsidian-800/60 border border-gold-500/20 rounded-lg text-gold-100 focus:outline-none focus:border-gold-400/40 disabled:opacity-60"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-gold-100 font-semibold mb-2">Website</label>
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gold-400 w-4 h-4" />
                          <input
                            type="url"
                            value={profileData.website}
                            onChange={(e) => setProfileData({...profileData, website: e.target.value})}
                            disabled={!isEditing}
                            className="w-full pl-10 pr-4 py-2 bg-obsidian-800/60 border border-gold-500/20 rounded-lg text-gold-100 focus:outline-none focus:border-gold-400/40 disabled:opacity-60"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-gold-100 font-semibold mb-2">Bio</label>
                        <textarea
                          value={profileData.bio}
                          onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                          disabled={!isEditing}
                          rows={6}
                          className="w-full px-4 py-2 bg-obsidian-800/60 border border-gold-500/20 rounded-lg text-gold-100 focus:outline-none focus:border-gold-400/40 disabled:opacity-60 resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Achievements */}
                  <div>
                    <h4 className="text-gold-100 font-semibold mb-3">Achievements</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {user.achievements.map((achievement, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-obsidian-800/40 border border-gold-500/20 rounded-lg">
                          <Award className="w-5 h-5 text-gold-400" />
                          <span className="text-gold-300">{achievement}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'stats' && (
                <motion.div
                  key="stats"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-6 space-y-6"
                >
                  <h3 className="text-xl font-bold text-gold-100 mb-4">Profile Statistics</h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Memories Shared', value: stats.memoriesShared, icon: Image, color: 'from-blue-600 to-blue-500' },
                      { label: 'Family Connections', value: stats.familyConnections, icon: Users, color: 'from-green-600 to-green-500' },
                      { label: 'Timeline Events', value: stats.timelineEvents, icon: Clock, color: 'from-purple-600 to-purple-500' },
                      { label: 'Profile Views', value: stats.profileViews, icon: Eye, color: 'from-orange-600 to-orange-500' },
                      { label: 'Memories Viewed', value: stats.memoriesViewed, icon: Heart, color: 'from-pink-600 to-pink-500' },
                      { label: 'Comments Received', value: stats.commentsReceived, icon: MessageCircle, color: 'from-indigo-600 to-indigo-500' },
                      { label: 'Likes Received', value: stats.likesReceived, icon: Star, color: 'from-gold-600 to-gold-500' },
                      { label: 'Shares', value: 47, icon: Share2, color: 'from-teal-600 to-teal-500' }
                    ].map((stat, index) => (
                      <motion.div
                        key={stat.label}
                        className="p-4 bg-gradient-to-br from-obsidian-800/60 to-obsidian-900/80 border border-gold-500/20 rounded-xl"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className={`w-10 h-10 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center text-white mb-3`}>
                          <stat.icon className="w-5 h-5" />
                        </div>
                        <div className="text-2xl font-bold text-gold-100 mb-1">{stat.value.toLocaleString()}</div>
                        <div className="text-gold-400/80 text-sm">{stat.label}</div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Activity Chart Placeholder */}
                  <div className="bg-gradient-to-br from-obsidian-800/60 to-obsidian-900/80 border border-gold-500/20 rounded-xl p-6">
                    <h4 className="text-gold-100 font-semibold mb-4">Activity Overview</h4>
                    <div className="h-48 flex items-center justify-center text-gold-400/60">
                      <div className="text-center">
                        <Award className="w-12 h-12 mx-auto mb-2" />
                        <p>Activity chart would be displayed here</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'settings' && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-6 space-y-6"
                >
                  <h3 className="text-xl font-bold text-gold-100 mb-4">Settings</h3>
                  
                  {/* Notifications */}
                  <div className="bg-gradient-to-br from-obsidian-800/60 to-obsidian-900/80 border border-gold-500/20 rounded-xl p-6">
                    <h4 className="text-gold-100 font-semibold mb-4 flex items-center gap-2">
                      <Bell className="w-5 h-5" />
                      Notifications
                    </h4>
                    <div className="space-y-4">
                      {[
                        { key: 'email', label: 'Email Notifications', description: 'Receive updates via email' },
                        { key: 'push', label: 'Push Notifications', description: 'Browser push notifications' },
                        { key: 'family', label: 'Family Updates', description: 'New family member activities' },
                        { key: 'memories', label: 'Memory Notifications', description: 'New memories and comments' }
                      ].map(setting => (
                        <div key={setting.key} className="flex items-center justify-between">
                          <div>
                            <div className="text-gold-100 font-medium">{setting.label}</div>
                            <div className="text-gold-400/80 text-sm">{setting.description}</div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={profileData.notifications[setting.key as keyof typeof profileData.notifications]}
                              onChange={(e) => setProfileData({
                                ...profileData,
                                notifications: {
                                  ...profileData.notifications,
                                  [setting.key]: e.target.checked
                                }
                              })}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-obsidian-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-600"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Theme */}
                  <div className="bg-gradient-to-br from-obsidian-800/60 to-obsidian-900/80 border border-gold-500/20 rounded-xl p-6">
                    <h4 className="text-gold-100 font-semibold mb-4 flex items-center gap-2">
                      <Palette className="w-5 h-5" />
                      Theme
                    </h4>
                    <select
                      value={profileData.theme}
                      onChange={(e) => setProfileData({...profileData, theme: e.target.value})}
                      className="w-full px-4 py-2 bg-obsidian-800/60 border border-gold-500/20 rounded-lg text-gold-100 focus:outline-none focus:border-gold-400/40"
                    >
                      <option value="luxury-gold">Luxury Gold</option>
                      <option value="classic-silver">Classic Silver</option>
                      <option value="vintage-bronze">Vintage Bronze</option>
                      <option value="modern-platinum">Modern Platinum</option>
                    </select>
                  </div>

                  {/* Data Management */}
                  <div className="bg-gradient-to-br from-obsidian-800/60 to-obsidian-900/80 border border-gold-500/20 rounded-xl p-6">
                    <h4 className="text-gold-100 font-semibold mb-4">Data Management</h4>
                    <div className="space-y-3">
                      <button className="w-full flex items-center gap-3 px-4 py-3 bg-blue-600/20 border border-blue-500/30 rounded-lg text-blue-300 hover:bg-blue-600/30 transition-colors">
                        <Download className="w-5 h-5" />
                        Export My Data
                      </button>
                      <button className="w-full flex items-center gap-3 px-4 py-3 bg-green-600/20 border border-green-500/30 rounded-lg text-green-300 hover:bg-green-600/30 transition-colors">
                        <Upload className="w-5 h-5" />
                        Import Data
                      </button>
                      <button className="w-full flex items-center gap-3 px-4 py-3 bg-red-600/20 border border-red-500/30 rounded-lg text-red-300 hover:bg-red-600/30 transition-colors">
                        <Trash2 className="w-5 h-5" />
                        Delete Account
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'privacy' && (
                <motion.div
                  key="privacy"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-6 space-y-6"
                >
                  <h3 className="text-xl font-bold text-gold-100 mb-4">Privacy Settings</h3>
                  
                  <div className="bg-gradient-to-br from-obsidian-800/60 to-obsidian-900/80 border border-gold-500/20 rounded-xl p-6">
                    <h4 className="text-gold-100 font-semibold mb-4 flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Visibility Settings
                    </h4>
                    <div className="space-y-4">
                      {[
                        { key: 'profileVisible', label: 'Profile Visibility', description: 'Allow family members to view your profile' },
                        { key: 'memoriesVisible', label: 'Memories Visibility', description: 'Show your memories to family members' },
                        { key: 'contactVisible', label: 'Contact Information', description: 'Display contact information on profile' }
                      ].map(setting => (
                        <div key={setting.key} className="flex items-center justify-between">
                          <div>
                            <div className="text-gold-100 font-medium">{setting.label}</div>
                            <div className="text-gold-400/80 text-sm">{setting.description}</div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={profileData.privacy[setting.key as keyof typeof profileData.privacy]}
                              onChange={(e) => setProfileData({
                                ...profileData,
                                privacy: {
                                  ...profileData.privacy,
                                  [setting.key]: e.target.checked
                                }
                              })}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-obsidian-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-600"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-obsidian-800/60 to-obsidian-900/80 border border-gold-500/20 rounded-xl p-6">
                    <h4 className="text-gold-100 font-semibold mb-4">Data Usage</h4>
                    <p className="text-gold-300/80 text-sm mb-4">
                      Your data is used to provide personalized family history experiences and connect you with family members. 
                      We never share your personal information with third parties without your explicit consent.
                    </p>
                    <button className="text-gold-400 hover:text-gold-300 transition-colors text-sm underline">
                      Read Full Privacy Policy
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Image Upload Modal */}
        <AnimatePresence>
          {showImageUpload && (
            <motion.div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowImageUpload(false)}
            >
              <motion.div
                className="bg-obsidian-900/95 border border-gold-500/30 rounded-xl p-6 max-w-md w-full mx-4"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-xl font-bold text-gold-100 mb-4">Upload Profile Picture</h3>
                <div
                  className="border-2 border-dashed border-gold-500/30 rounded-xl p-8 text-center hover:border-gold-400/50 transition-colors cursor-pointer"
                  onClick={() => document.getElementById('profile-image-input')?.click()}
                >
                  <Camera className="w-12 h-12 text-gold-400 mx-auto mb-4" />
                  <p className="text-gold-100 font-semibold mb-2">Choose Profile Picture</p>
                  <p className="text-gold-400/80 text-sm">JPG, PNG or GIF up to 5MB</p>
                </div>
                <input
                  id="profile-image-input"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowImageUpload(false)}
                    className="flex-1 px-4 py-2 border border-gold-500/30 text-gold-100 rounded-lg hover:border-gold-400/50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => document.getElementById('profile-image-input')?.click()}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-gold-600 to-gold-500 text-obsidian-900 rounded-lg hover:from-gold-500 hover:to-gold-400 transition-all duration-300 font-semibold"
                  >
                    Browse
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

export default UserProfile
