'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Heart, 
  MessageCircle, 
  Smile, 
  ThumbsUp,
  Sparkles,
  Send,
  User,
  MoreVertical,
  Trash2,
  Edit3,
  Reply,
  AtSign
} from 'lucide-react'
import { apiClient } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'

interface Comment {
  id: string
  memoryId: string
  userId: string
  userName: string
  userAvatar: string
  content: string
  timestamp: Date
  reactions: Reaction[]
  replies?: Comment[]
}

interface Reaction {
  type: 'heart' | 'smile' | 'thumbsup' | 'sparkles'
  userId: string
  userName: string
}

interface MemoryCommentsProps {
  memoryId: string
  onRequestMemory?: (userId: string) => void
}

const reactionTypes = [
  { type: 'heart' as const, icon: Heart, label: 'Love', color: 'text-gold-400' },
  { type: 'smile' as const, icon: Smile, label: 'Joy', color: 'text-gold-300' },
  { type: 'thumbsup' as const, icon: ThumbsUp, label: 'Like', color: 'text-gold-400/80' },
  { type: 'sparkles' as const, icon: Sparkles, label: 'Amazing', color: 'text-gold-400/70' }
]

const MemoryComments: React.FC<MemoryCommentsProps> = ({ memoryId, onRequestMemory }) => {
  const { user, isAuthenticated } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [showReactions, setShowReactions] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const currentUserId = user?.id || 'guest'
  const currentUserName = user?.name || 'Guest User'

  useEffect(() => {
    const loadComments = async () => {
      if (!isAuthenticated) {
        setComments([])
        return
      }

      setIsLoading(true)
      setError(null)
      
      try {
        const fetchedComments = await apiClient.getComments(memoryId)
        const commentsWithDates = fetchedComments.map((c: any) => ({
          ...c,
          userAvatar: c.userName.split(' ').map((n: string) => n[0]).join(''),
          timestamp: new Date(c.timestamp),
          replies: Array.isArray(c.replies) ? c.replies.map((r: any) => ({
            ...r,
            userAvatar: r.userName.split(' ').map((n: string) => n[0]).join(''),
            timestamp: new Date(r.timestamp)
          })) : []
        }))
        setComments(commentsWithDates)
      } catch (err: any) {
        console.error('Failed to load comments from backend:', err)
        setError(err.message || 'Failed to load comments')
        setComments([])
      } finally {
        setIsLoading(false)
      }
    }

    loadComments()
  }, [memoryId, isAuthenticated])

  const handleAddComment = async () => {
    if (!newComment.trim() || !isAuthenticated) return

    setIsLoading(true)
    setError(null)

    try {
      const createdComment = await apiClient.createComment(memoryId, newComment, replyingTo || undefined)
      
      const commentWithAvatar = {
        ...createdComment,
        userAvatar: createdComment.userName.split(' ').map((n: string) => n[0]).join(''),
        timestamp: new Date(createdComment.timestamp),
        replies: []
      }

      if (replyingTo) {
        const updatedComments = comments.map(c => {
          if (c.id === replyingTo) {
            return {
              ...c,
              replies: [...(c.replies || []), commentWithAvatar]
            }
          }
          return c
        })
        setComments(updatedComments)
        setReplyingTo(null)
      } else {
        setComments([...comments, commentWithAvatar])
      }

      setNewComment('')
    } catch (err: any) {
      console.error('Failed to add comment:', err)
      setError(err.message || 'Failed to add comment')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddReaction = async (commentId: string, reactionType: 'heart' | 'smile' | 'thumbsup' | 'sparkles') => {
    if (!isAuthenticated) return

    try {
      await apiClient.addReaction(commentId, reactionType)
      
      const updatedComments = comments.map(comment => {
        if (comment.id === commentId) {
          const existingReaction = comment.reactions.find(r => r.userId === currentUserId && r.type === reactionType)
          
          if (existingReaction) {
            return {
              ...comment,
              reactions: comment.reactions.filter(r => !(r.userId === currentUserId && r.type === reactionType))
            }
          } else {
            return {
              ...comment,
              reactions: [...comment.reactions, { type: reactionType, userId: currentUserId, userName: currentUserName }]
            }
          }
        }
        return comment
      })
      
      setComments(updatedComments)
      setShowReactions(null)
    } catch (err: any) {
      console.error('Failed to add reaction:', err)
      setError(err.message || 'Failed to add reaction')
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!isAuthenticated) return

    try {
      await apiClient.deleteComment(commentId)
      const updatedComments = comments.filter(c => c.id !== commentId)
      setComments(updatedComments)
    } catch (err: any) {
      console.error('Failed to delete comment:', err)
      setError(err.message || 'Failed to delete comment')
    }
  }

  const getReactionCount = (reactions: Reaction[], type: string) => {
    return reactions.filter(r => r.type === type).length
  }

  const hasUserReacted = (reactions: Reaction[], type: string) => {
    return reactions.some(r => r.userId === currentUserId && r.type === type)
  }

  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const renderComment = (comment: Comment, isReply: boolean = false) => (
    <motion.div
      key={comment.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${isReply ? 'ml-12 mt-3' : ''}`}
    >
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-obsidian-900 font-bold text-sm flex-shrink-0">
          {comment.userAvatar}
        </div>
        
        <div className="flex-1">
          <div className="bg-obsidian-800/40 rounded-lg p-3 border border-gold-500/10">
            <div className="flex items-start justify-between mb-1">
              <div>
                <span className="font-semibold text-gold-100 text-sm">{comment.userName}</span>
                <span className="text-gold-400/60 text-xs ml-2">{formatTimestamp(comment.timestamp)}</span>
              </div>
              {comment.userId === currentUserId && (
                <button
                  onClick={() => handleDeleteComment(comment.id)}
                  className="p-1 text-gold-400/60 hover:text-gold-300 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
            <p className="text-gold-200 text-sm leading-relaxed">{comment.content}</p>
          </div>

          <div className="flex items-center gap-4 mt-2 ml-1">
            <div className="relative">
              <button
                onClick={() => setShowReactions(showReactions === comment.id ? null : comment.id)}
                className="flex items-center gap-1 text-gold-400/70 hover:text-gold-400 transition-colors text-xs"
              >
                <Heart className="w-3.5 h-3.5" />
                <span>React</span>
              </button>

              <AnimatePresence>
                {showReactions === comment.id && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -5 }}
                    className="absolute bottom-full left-0 mb-2 bg-obsidian-900 border border-gold-500/30 rounded-lg p-2 flex gap-2 shadow-xl z-10"
                  >
                    {reactionTypes.map(({ type, icon: Icon, label, color }) => (
                      <button
                        key={type}
                        onClick={() => handleAddReaction(comment.id, type)}
                        className={`p-2 hover:bg-obsidian-800 rounded-lg transition-colors ${
                          hasUserReacted(comment.reactions, type) ? color : 'text-gold-400/60'
                        }`}
                        title={label}
                      >
                        <Icon className="w-4 h-4" />
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {!isReply && (
              <button
                onClick={() => setReplyingTo(comment.id)}
                className="flex items-center gap-1 text-gold-400/70 hover:text-gold-400 transition-colors text-xs"
              >
                <Reply className="w-3.5 h-3.5" />
                <span>Reply</span>
              </button>
            )}

            {comment.reactions.length > 0 && (
              <div className="flex items-center gap-2">
                {reactionTypes.map(({ type, icon: Icon, color }) => {
                  const count = getReactionCount(comment.reactions, type)
                  if (count === 0) return null
                  return (
                    <div key={type} className={`flex items-center gap-1 ${color} text-xs`}>
                      <Icon className="w-3.5 h-3.5" />
                      <span>{count}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 space-y-3">
              {comment.replies.map(reply => renderComment(reply, true))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-gold-100 font-semibold flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Comments & Reactions
        </h4>
        <div className="text-gold-400/70 text-sm">
          {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-gold-600/20 border border-gold-500/50 text-gold-200 text-sm">
          {error}
        </div>
      )}

      {!isAuthenticated && (
        <div className="text-center py-8 text-gold-400/60">
          <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Sign in to view and add comments</p>
        </div>
      )}

      {isAuthenticated && (
        <>
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {isLoading && comments.length === 0 ? (
              <div className="text-center py-8 text-gold-400/60">
                <div className="w-8 h-8 border-2 border-gold-400/20 border-t-gold-400 rounded-full animate-spin mx-auto mb-3"></div>
                <p>Loading comments...</p>
              </div>
            ) : (
              <>
                <AnimatePresence>
                  {comments.map(comment => renderComment(comment))}
                </AnimatePresence>

                {comments.length === 0 && (
                  <div className="text-center py-8 text-gold-400/60">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No comments yet. Be the first to share your thoughts!</p>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}

      {isAuthenticated && (
        <div className="border-t border-gold-500/20 pt-4">
          {replyingTo && (
            <div className="mb-2 flex items-center gap-2 text-sm text-gold-400/70">
              <Reply className="w-4 h-4" />
              <span>Replying to {comments.find(c => c.id === replyingTo)?.userName}</span>
              <button
                onClick={() => setReplyingTo(null)}
                className="ml-auto text-gold-400 hover:text-gold-300"
              >
                Cancel
              </button>
            </div>
          )}
          
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-obsidian-900 font-bold text-sm flex-shrink-0">
              {user?.name.split(' ').map(n => n[0]).join('') || 'U'}
            </div>
            
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleAddComment()}
                placeholder="Add a comment..."
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-obsidian-800/60 border border-gold-500/20 rounded-lg text-gold-100 placeholder-gold-400/40 focus:outline-none focus:border-gold-400/40 disabled:opacity-50"
              />
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim() || isLoading}
                className="px-4 py-2 bg-gradient-to-r from-gold-600 to-gold-500 text-obsidian-900 rounded-lg hover:from-gold-500 hover:to-gold-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs text-gold-400/60">
            <AtSign className="w-3.5 h-3.5" />
            <span>Use @mentions to notify family members</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default MemoryComments
