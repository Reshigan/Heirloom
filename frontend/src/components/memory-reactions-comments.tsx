'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Smile, Droplet, Star, MessageCircle, Send, X } from 'lucide-react'
import { LuxCard, LuxButton } from './lux'

interface Reaction {
  userId: string
  userName: string
  type: 'heart' | 'smile' | 'tear' | 'star'
  timestamp: Date
}

interface Comment {
  userId: string
  userName: string
  userAvatar?: string
  text: string
  timestamp: Date
}

interface MemoryReactionsCommentsProps {
  memoryId: string
  memoryTitle: string
  reactions: Reaction[]
  comments: Comment[]
  currentUserId: string
  currentUserName: string
  onAddReaction: (type: 'heart' | 'smile' | 'tear' | 'star') => void
  onRemoveReaction: () => void
  onAddComment: (text: string) => void
  isVaultUnsealed: boolean
}

const reactionConfig = {
  heart: { icon: Heart, label: 'Love', color: 'text-red-400' },
  smile: { icon: Smile, label: 'Joy', color: 'text-yellow-400' },
  tear: { icon: Droplet, label: 'Touching', color: 'text-blue-400' },
  star: { icon: Star, label: 'Inspiring', color: 'text-gold-400' }
}

export default function MemoryReactionsComments({
  memoryId,
  memoryTitle,
  reactions,
  comments,
  currentUserId,
  currentUserName,
  onAddReaction,
  onRemoveReaction,
  onAddComment,
  isVaultUnsealed
}: MemoryReactionsCommentsProps) {
  const [showCommentInput, setShowCommentInput] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [showReactionPicker, setShowReactionPicker] = useState(false)

  const currentUserReaction = reactions.find(r => r.userId === currentUserId)
  
  const reactionCounts = reactions.reduce((acc, r) => {
    acc[r.type] = (acc[r.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const handleAddComment = () => {
    if (!commentText.trim()) return
    onAddComment(commentText)
    setCommentText('')
    setShowCommentInput(false)
  }

  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  if (!isVaultUnsealed) {
    return (
      <div className="glass-card p-6 text-center">
        <MessageCircle className="w-12 h-12 text-pearl/20 mx-auto mb-3" />
        <p className="text-pearl/60 text-sm">
          Reactions and comments will be available after the vault is unsealed
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Reactions Bar */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gold-400">Reactions</h4>
          <div className="flex items-center gap-2">
            {Object.entries(reactionCounts).map(([type, count]) => {
              const config = reactionConfig[type as keyof typeof reactionConfig]
              const Icon = config.icon
              return (
                <div key={type} className="flex items-center gap-1 text-xs">
                  <Icon className={`w-4 h-4 ${config.color}`} />
                  <span className="text-pearl/70">{count}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentUserReaction ? (
            <button
              onClick={onRemoveReaction}
              className="glass-button px-4 py-2 flex items-center gap-2"
            >
              {React.createElement(reactionConfig[currentUserReaction.type].icon, {
                className: `w-4 h-4 ${reactionConfig[currentUserReaction.type].color}`
              })}
              <span className="text-sm">{reactionConfig[currentUserReaction.type].label}</span>
              <X className="w-3 h-3 ml-1" />
            </button>
          ) : (
            <div className="relative">
              <button
                onClick={() => setShowReactionPicker(!showReactionPicker)}
                className="glass-button-primary px-4 py-2 text-sm"
              >
                Add Reaction
              </button>

              <AnimatePresence>
                {showReactionPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full mt-2 left-0 glass-card p-2 flex gap-2 z-10"
                  >
                    {(Object.keys(reactionConfig) as Array<keyof typeof reactionConfig>).map((type) => {
                      const config = reactionConfig[type]
                      const Icon = config.icon
                      return (
                        <motion.button
                          key={type}
                          onClick={() => {
                            onAddReaction(type)
                            setShowReactionPicker(false)
                          }}
                          className="p-2 rounded-lg hover:bg-obsidian-800/50 transition-colors"
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                          title={config.label}
                        >
                          <Icon className={`w-5 h-5 ${config.color}`} />
                        </motion.button>
                      )
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Comments Section */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-gold-400 flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Comments ({comments.length})
          </h4>
          {!showCommentInput && (
            <button
              onClick={() => setShowCommentInput(true)}
              className="text-xs text-gold-400 hover:text-gold-300 transition-colors"
            >
              Add Comment
            </button>
          )}
        </div>

        {/* Comment Input */}
        <AnimatePresence>
          {showCommentInput && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4"
            >
              <div className="glass-input-container mb-2">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Share your thoughts about this memory..."
                  className="glass-input min-h-[80px] resize-none"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowCommentInput(false)
                    setCommentText('')
                  }}
                  className="glass-button text-sm px-3 py-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddComment}
                  disabled={!commentText.trim()}
                  className="glass-button-primary text-sm px-3 py-1 flex items-center gap-2"
                >
                  <Send className="w-3 h-3" />
                  Post Comment
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Comments List */}
        <div className="space-y-3">
          {comments.length === 0 ? (
            <p className="text-center text-pearl/50 text-sm py-4">
              No comments yet. Be the first to share your thoughts!
            </p>
          ) : (
            comments.map((comment, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-3 rounded-lg bg-obsidian-800/30 border border-gold-500/10"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-500/20 to-gold-600/20 flex items-center justify-center text-sm border border-gold-500/30 flex-shrink-0">
                    {comment.userAvatar || comment.userName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-pearl">{comment.userName}</span>
                      <span className="text-xs text-pearl/50">{formatTimestamp(comment.timestamp)}</span>
                    </div>
                    <p className="text-sm text-pearl/80 leading-relaxed">{comment.text}</p>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
