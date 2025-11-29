'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Heart, Plus, Eye, MessageCircle, Upload, Loader2, Globe, Lock, CheckCircle2, AlertCircle } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import toast from 'react-hot-toast'

interface MemorialPage {
  id: string
  slug: string
  displayName: string
  birthDate?: string
  deathDate?: string
  biography?: string
  profileImageUrl?: string
  coverImageUrl?: string
  featuredMemoryIds: string[]
  isPublic: boolean
  allowContributions: boolean
  requireApproval: boolean
  viewCount: number
  contributionCount: number
  createdAt: string
  updatedAt: string
  contributions?: MemorialContribution[]
  tributes?: MemorialTribute[]
}

interface MemorialContribution {
  id: string
  contributorEmail: string
  contributorName?: string
  thumbnailUrl?: string
  type: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

interface MemorialTribute {
  id: string
  authorName: string
  authorEmail?: string
  message: string
  createdAt: string
}

interface MemorialPagesProps {
  onClose: () => void
}

export default function MemorialPages({ onClose }: MemorialPagesProps) {
  const [memorialPage, setMemorialPage] = useState<MemorialPage | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [pendingContributions, setPendingContributions] = useState<MemorialContribution[]>([])
  
  const [slug, setSlug] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [deathDate, setDeathDate] = useState('')
  const [biography, setBiography] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [allowContributions, setAllowContributions] = useState(true)
  const [requireApproval, setRequireApproval] = useState(true)

  useEffect(() => {
    fetchMemorialPage()
    fetchPendingContributions()
  }, [])

  const fetchMemorialPage = async () => {
    try {
      const data = await apiClient.get('/api/memorial-pages/mine')
      if (data) {
        setMemorialPage(data)
        setSlug(data.slug)
        setDisplayName(data.displayName)
        setBirthDate(data.birthDate ? new Date(data.birthDate).toISOString().split('T')[0] : '')
        setDeathDate(data.deathDate ? new Date(data.deathDate).toISOString().split('T')[0] : '')
        setBiography(data.biography || '')
        setIsPublic(data.isPublic)
        setAllowContributions(data.allowContributions)
        setRequireApproval(data.requireApproval)
      }
    } catch (error) {
      console.error('Failed to fetch memorial page:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPendingContributions = async () => {
    try {
      const data = await apiClient.get('/api/memorial-pages/contributions/pending')
      setPendingContributions(data)
    } catch (error) {
      console.error('Failed to fetch pending contributions:', error)
    }
  }

  const handleSaveMemorialPage = async () => {
    if (!slug || !displayName) {
      toast.error('Slug and display name are required')
      return
    }

    try {
      const data = await apiClient.post('/api/memorial-pages', {
        slug,
        displayName,
        birthDate: birthDate || undefined,
        deathDate: deathDate || undefined,
        biography: biography || undefined,
        isPublic,
        allowContributions,
        requireApproval
      })

      setMemorialPage(data)
      setIsEditing(false)
      toast.success('Memorial page saved successfully')
    } catch (error: any) {
      console.error('Failed to save memorial page:', error)
      if (error.response?.status === 409) {
        toast.error('This slug is already taken. Please choose a different one.')
      } else {
        toast.error('Failed to save memorial page')
      }
    }
  }

  const handleReviewContribution = async (contributionId: string, status: 'approved' | 'rejected') => {
    try {
      await apiClient.put(`/api/memorial-pages/contributions/${contributionId}/review`, { status })
      setPendingContributions(pendingContributions.filter(c => c.id !== contributionId))
      
      if (status === 'approved') {
        await fetchMemorialPage()
        toast.success('Contribution approved')
      } else {
        toast.success('Contribution rejected')
      }
    } catch (error) {
      console.error('Failed to review contribution:', error)
      toast.error('Failed to review contribution')
    }
  }

  const getPublicUrl = () => {
    if (!memorialPage) return ''
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    return `${baseUrl}/memorial/${memorialPage.slug}`
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gradient-to-br from-obsidian-800 to-obsidian-900 rounded-2xl border border-gold-500/20 max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gold-500/20">
          <div className="flex items-center gap-3">
            <Heart className="w-6 h-6 text-gold-400" />
            <div>
              <h2 className="text-2xl font-serif text-gold-400">Memorial Page</h2>
              <p className="text-sm text-gold-200/50 mt-1">
                Create a beautiful tribute page for your legacy
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full border border-gold-500/30 flex items-center justify-center text-gold-400 hover:border-gold-400 hover:bg-gold/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-88px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-gold-400 animate-spin" />
            </div>
          ) : isEditing || !memorialPage ? (
            <div className="space-y-6">
              <div className="bg-gold-500/10 border border-gold-500/30 rounded-lg p-4 flex items-start gap-3">
                <Globe className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gold-200/70">
                  <p className="font-medium text-gold-200 mb-1">Create Your Memorial Page</p>
                  <p>
                    Build a beautiful tribute page where friends and family can share memories, 
                    leave messages, and contribute photos after you're gone.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gold-200 mb-2">
                    Page URL Slug *
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gold-200/50">/memorial/</span>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      className="flex-1 px-4 py-3 bg-obsidian-900/50 border border-gold-500/30 rounded-lg text-gold-100 placeholder-gold-500/30 focus:outline-none focus:border-gold-400"
                      placeholder="john-smith"
                    />
                  </div>
                  <p className="text-xs text-gold-200/40 mt-1">
                    This will be your memorial page URL
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gold-200 mb-2">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-4 py-3 bg-obsidian-900/50 border border-gold-500/30 rounded-lg text-gold-100 placeholder-gold-500/30 focus:outline-none focus:border-gold-400"
                    placeholder="John Smith"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gold-200 mb-2">
                    Birth Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full px-4 py-3 bg-obsidian-900/50 border border-gold-500/30 rounded-lg text-gold-100 focus:outline-none focus:border-gold-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gold-200 mb-2">
                    Death Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={deathDate}
                    onChange={(e) => setDeathDate(e.target.value)}
                    className="w-full px-4 py-3 bg-obsidian-900/50 border border-gold-500/30 rounded-lg text-gold-100 focus:outline-none focus:border-gold-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gold-200 mb-2">
                  Biography (Optional)
                </label>
                <textarea
                  value={biography}
                  onChange={(e) => setBiography(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 bg-obsidian-900/50 border border-gold-500/30 rounded-lg text-gold-100 placeholder-gold-500/30 focus:outline-none focus:border-gold-400"
                  placeholder="Share a brief biography or life story..."
                />
              </div>

              <div className="space-y-4 bg-obsidian-900/30 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gold-200">Privacy & Contribution Settings</h3>
                
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="w-5 h-5 rounded border-gold-500/30 bg-obsidian-900 text-gold-500 focus:ring-gold-400"
                  />
                  <div>
                    <p className="text-sm text-gold-200">Make page public</p>
                    <p className="text-xs text-gold-200/50">Allow anyone to view this memorial page</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowContributions}
                    onChange={(e) => setAllowContributions(e.target.checked)}
                    className="w-5 h-5 rounded border-gold-500/30 bg-obsidian-900 text-gold-500 focus:ring-gold-400"
                  />
                  <div>
                    <p className="text-sm text-gold-200">Allow contributions</p>
                    <p className="text-xs text-gold-200/50">Let others add photos and memories</p>
                  </div>
                </label>

                {allowContributions && (
                  <label className="flex items-center gap-3 cursor-pointer ml-8">
                    <input
                      type="checkbox"
                      checked={requireApproval}
                      onChange={(e) => setRequireApproval(e.target.checked)}
                      className="w-5 h-5 rounded border-gold-500/30 bg-obsidian-900 text-gold-500 focus:ring-gold-400"
                    />
                    <div>
                      <p className="text-sm text-gold-200">Require approval</p>
                      <p className="text-xs text-gold-200/50">Review contributions before they appear</p>
                    </div>
                  </label>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSaveMemorialPage}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-obsidian-900 rounded-lg font-medium hover:from-gold-400 hover:to-gold-500 transition-all"
                >
                  {memorialPage ? 'Update Page' : 'Create Page'}
                </button>
                {memorialPage && (
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-3 border border-gold-500/30 text-gold-400 rounded-lg font-medium hover:border-gold-400 hover:bg-gold/10 transition-all"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Memorial Page Overview */}
              <div className="bg-obsidian-900/50 border border-gold-500/20 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-serif text-gold-100 mb-2">{memorialPage.displayName}</h3>
                    {memorialPage.birthDate && memorialPage.deathDate && (
                      <p className="text-gold-200/50">
                        {new Date(memorialPage.birthDate).getFullYear()} - {new Date(memorialPage.deathDate).getFullYear()}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 border border-gold-500/30 text-gold-400 rounded-lg text-sm font-medium hover:border-gold-400 hover:bg-gold/10 transition-all"
                  >
                    Edit Page
                  </button>
                </div>

                {memorialPage.biography && (
                  <p className="text-gold-200/70 mb-4">{memorialPage.biography}</p>
                )}

                <div className="flex items-center gap-6 text-sm text-gold-200/50">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    <span>{memorialPage.viewCount} views</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    <span>{memorialPage.contributionCount} contributions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    <span>{memorialPage.tributes?.length || 0} tributes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {memorialPage.isPublic ? (
                      <>
                        <Globe className="w-4 h-4 text-green-400" />
                        <span className="text-green-400">Public</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 text-gold-400" />
                        <span>Private</span>
                      </>
                    )}
                  </div>
                </div>

                {memorialPage.isPublic && (
                  <div className="mt-4 pt-4 border-t border-gold-500/20">
                    <p className="text-sm text-gold-200/50 mb-2">Public URL:</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={getPublicUrl()}
                        readOnly
                        className="flex-1 px-4 py-2 bg-obsidian-900/50 border border-gold-500/30 rounded-lg text-gold-100 text-sm"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(getPublicUrl())
                          toast.success('URL copied to clipboard!')
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-gold-500/20 to-gold-600/20 border border-gold-500/30 text-gold-400 rounded-lg text-sm font-medium hover:from-gold-500/30 hover:to-gold-600/30 transition-all"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Pending Contributions */}
              {pendingContributions.length > 0 && (
                <div>
                  <h3 className="text-lg font-serif text-gold-200 mb-4">
                    Pending Contributions ({pendingContributions.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pendingContributions.map((contribution) => (
                      <div
                        key={contribution.id}
                        className="bg-obsidian-900/50 border border-gold-500/20 rounded-lg overflow-hidden"
                      >
                        <div className="aspect-square bg-gradient-to-br from-gold-500/20 to-gold-500/5 flex items-center justify-center">
                          {contribution.thumbnailUrl ? (
                            <img
                              src={contribution.thumbnailUrl}
                              alt="Contribution"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Upload className="w-12 h-12 text-gold-400/50" />
                          )}
                        </div>
                        <div className="p-4 space-y-3">
                          <div>
                            <p className="text-sm font-medium text-gold-200">
                              {contribution.contributorName || 'Anonymous'}
                            </p>
                            <p className="text-xs text-gold-200/50">
                              {contribution.contributorEmail}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleReviewContribution(contribution.id, 'approved')}
                              className="flex-1 px-3 py-2 bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg text-sm font-medium hover:bg-green-500/30 transition-all flex items-center justify-center gap-1"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleReviewContribution(contribution.id, 'rejected')}
                              className="flex-1 px-3 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/30 transition-all flex items-center justify-center gap-1"
                            >
                              <X className="w-4 h-4" />
                              Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Tributes */}
              {memorialPage.tributes && memorialPage.tributes.length > 0 && (
                <div>
                  <h3 className="text-lg font-serif text-gold-200 mb-4">
                    Recent Tributes ({memorialPage.tributes.length})
                  </h3>
                  <div className="space-y-4">
                    {memorialPage.tributes.slice(0, 5).map((tribute) => (
                      <div
                        key={tribute.id}
                        className="bg-obsidian-900/50 border border-gold-500/20 rounded-lg p-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-500/20 to-gold-500/5 flex items-center justify-center flex-shrink-0">
                            <Heart className="w-5 h-5 text-gold-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gold-200 mb-1">
                              {tribute.authorName}
                            </p>
                            <p className="text-sm text-gold-200/70">{tribute.message}</p>
                            <p className="text-xs text-gold-200/40 mt-2">
                              {new Date(tribute.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
