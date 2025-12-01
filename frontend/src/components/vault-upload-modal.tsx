'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Upload, 
  File, 
  Image as ImageIcon, 
  Video, 
  Music, 
  FileText,
  AlertCircle,
  CheckCircle,
  Loader2,
  Heart,
  Smile,
  Sparkles,
  Clock,
  Users
} from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { VaultEncryption } from '@/lib/encryption'

interface VaultUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  vaultEncryption: VaultEncryption
}

interface UploadProgress {
  stage: 'idle' | 'encrypting' | 'uploading' | 'complete' | 'error'
  progress: number
  message: string
}

const EMOTION_CATEGORIES = [
  { id: 'joy', label: 'Joy', icon: Smile, color: 'from-yellow-400 to-orange-400' },
  { id: 'love', label: 'Love', icon: Heart, color: 'from-pink-400 to-red-400' },
  { id: 'nostalgia', label: 'Nostalgia', icon: Clock, color: 'from-purple-400 to-indigo-400' },
  { id: 'gratitude', label: 'Gratitude', icon: Sparkles, color: 'from-green-400 to-teal-400' },
  { id: 'wisdom', label: 'Wisdom', icon: FileText, color: 'from-blue-400 to-cyan-400' },
]

const VISIBILITY_OPTIONS = [
  { id: 'PRIVATE', label: 'Private', description: 'Only you can see this memory' },
  { id: 'POSTHUMOUS', label: 'Posthumous', description: 'Shared with family after death' },
]

export default function VaultUploadModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  vaultEncryption 
}: VaultUploadModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [emotion, setEmotion] = useState('joy')
  const [importance, setImportance] = useState(5)
  const [visibility, setVisibility] = useState('PRIVATE')
  const [isDragging, setIsDragging] = useState(false)
  const [progress, setProgress] = useState<UploadProgress>({
    stage: 'idle',
    progress: 0,
    message: ''
  })
  const [uploadLimitWarning, setUploadLimitWarning] = useState<string | null>(null)
  const [storageLimitWarning, setStorageLimitWarning] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      checkLimits()
    }
  }, [isOpen])

  const checkLimits = async () => {
    try {
      const stats = await apiClient.getVaultStats()
      
      if (stats.uploads.remaining <= 0) {
        setUploadLimitWarning(
          `Upload limit reached (${stats.uploads.thisWeek}/${stats.uploads.limit}). Resets ${new Date(stats.uploads.nextReset).toLocaleDateString()}`
        )
      } else if (stats.uploads.remaining <= 1) {
        setUploadLimitWarning(
          `Only ${stats.uploads.remaining} upload remaining this week`
        )
      }

      if (stats.storage.percentUsed >= 90) {
        setStorageLimitWarning(
          `Storage ${stats.storage.percentUsed.toFixed(0)}% full (${stats.storage.used}/${stats.storage.limit})`
        )
      }
    } catch (error) {
      console.error('Failed to check limits:', error)
    }
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return ImageIcon
    if (fileType.startsWith('video/')) return Video
    if (fileType.startsWith('audio/')) return Music
    return FileText
  }

  const getFileType = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return 'photo'
    if (mimeType.startsWith('video/')) return 'video'
    if (mimeType.startsWith('audio/')) return 'audio'
    return 'document'
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      setFile(droppedFile)
      if (!title) {
        setTitle(droppedFile.name.replace(/\.[^/.]+$/, ''))
      }
    }
  }, [title])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''))
      }
    }
  }

  const handleUpload = async () => {
    if (!file) return

    try {
      setProgress({
        stage: 'encrypting',
        progress: 20,
        message: 'Encrypting your memory...'
      })

      const fileType = getFileType(file.type)
      
      const { encryptedFile, encryptedDek, iv } = await vaultEncryption.encryptFile(file)
      
      const reader = new FileReader()
      const encryptedDataPromise = new Promise<string>((resolve) => {
        reader.onload = () => {
          const arrayBuffer = reader.result as ArrayBuffer
          const bytes = new Uint8Array(arrayBuffer)
          const binary = Array.from(bytes).map(b => String.fromCharCode(b)).join('')
          resolve(btoa(binary))
        }
      })
      reader.readAsArrayBuffer(encryptedFile)
      const encryptedData = await encryptedDataPromise

      setProgress({
        stage: 'encrypting',
        progress: 50,
        message: 'Encryption complete, preparing upload...'
      })

      let thumbnailUrl: string | undefined
      if (file.type.startsWith('image/')) {
        thumbnailUrl = await generateThumbnail(file)
      }

      setProgress({
        stage: 'uploading',
        progress: 60,
        message: 'Uploading to vault...'
      })

      const result = await apiClient.uploadItem({
        type: fileType,
        title: title || file.name,
        encryptedData: `${encryptedData}:${iv}`,
        encryptedDek,
        thumbnailUrl,
        fileSizeBytes: file.size,
        emotionCategory: emotion,
        importanceScore: importance,
      })

      setProgress({
        stage: 'uploading',
        progress: 90,
        message: 'Finalizing...'
      })

      setProgress({
        stage: 'complete',
        progress: 100,
        message: 'Memory preserved successfully!'
      })

      setTimeout(() => {
        onSuccess?.()
        handleClose()
      }, 1500)

    } catch (error: any) {
      console.error('Upload failed:', error)
      setProgress({
        stage: 'error',
        progress: 0,
        message: error.message || 'Upload failed. Please try again.'
      })
    }
  }

  const generateThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          
          const maxSize = 200
          let width = img.width
          let height = img.height
          
          if (width > height) {
            if (width > maxSize) {
              height *= maxSize / width
              width = maxSize
            }
          } else {
            if (height > maxSize) {
              width *= maxSize / height
              height = maxSize
            }
          }
          
          canvas.width = width
          canvas.height = height
          ctx?.drawImage(img, 0, 0, width, height)
          
          resolve(canvas.toDataURL('image/jpeg', 0.7))
        }
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(file)
    })
  }

  const handleClose = () => {
    setFile(null)
    setTitle('')
    setEmotion('joy')
    setImportance(5)
    setVisibility('PRIVATE')
    setProgress({ stage: 'idle', progress: 0, message: '' })
    setUploadLimitWarning(null)
    setStorageLimitWarning(null)
    onClose()
  }

  if (!isOpen) return null

  const FileIcon = file ? getFileIcon(file.type) : Upload
  const isUploading = progress.stage === 'encrypting' || progress.stage === 'uploading'
  const canUpload = file && title && !isUploading && uploadLimitWarning === null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-gradient-to-br from-charcoal/95 via-obsidian/95 to-charcoal/95 backdrop-blur-2xl border border-gold-500/30 rounded-2xl shadow-2xl shadow-gold-400/10 overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-gold-500/20">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-2xl text-gold-400 tracking-wide">Preserve Memory</h2>
                <p className="text-sm text-gold-200/70 mt-1">Upload and encrypt your precious moments</p>
              </div>
              <button
                onClick={handleClose}
                className="w-10 h-10 rounded-full border border-gold-500/30 flex items-center justify-center text-gold-400 hover:border-gold-400 hover:bg-gold/10 transition-all"
                disabled={isUploading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
            {/* Warnings */}
            {uploadLimitWarning && (
              <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-red-400 font-medium">Upload Limit Reached</p>
                  <p className="text-xs text-red-300/70 mt-1">{uploadLimitWarning}</p>
                </div>
              </div>
            )}

            {storageLimitWarning && (
              <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-yellow-400 font-medium">Storage Warning</p>
                  <p className="text-xs text-yellow-300/70 mt-1">{storageLimitWarning}</p>
                </div>
              </div>
            )}

            {/* File Upload Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-xl p-8 transition-all ${
                isDragging
                  ? 'border-gold-400 bg-gold-400/10'
                  : file
                  ? 'border-gold-500/30 bg-gold-500/5'
                  : 'border-gold-500/20 bg-obsidian-800/40'
              }`}
            >
              <input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={handleFileSelect}
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                disabled={isUploading}
              />

              {!file ? (
                <label htmlFor="file-upload" className="cursor-pointer block text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full border border-gold-500/30 flex items-center justify-center text-gold-400">
                    <Upload className="w-8 h-8" />
                  </div>
                  <p className="text-gold-400 font-medium mb-2">Drop your file here or click to browse</p>
                  <p className="text-xs text-gold-200/50">Supports images, videos, audio, and documents</p>
                </label>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg border border-gold-500/30 flex items-center justify-center text-gold-400 flex-shrink-0">
                    <FileIcon className="w-8 h-8" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gold-400 font-medium truncate">{file.name}</p>
                    <p className="text-xs text-gold-200/50 mt-1">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  {!isUploading && (
                    <button
                      onClick={() => setFile(null)}
                      className="w-8 h-8 rounded-full border border-gold-500/30 flex items-center justify-center text-gold-400 hover:border-gold-400 hover:bg-gold/10 transition-all flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Title Input */}
            {file && (
              <div className="mt-6">
                <label className="block text-xs uppercase tracking-[0.15em] text-gold-200/70 mb-2">
                  Memory Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Give this memory a meaningful title..."
                  className="w-full px-4 py-3 bg-obsidian-800/40 border border-gold-500/30 rounded-lg text-gold-100 placeholder-gold-200/30 focus:outline-none focus:border-gold-400 transition-all"
                  disabled={isUploading}
                />
              </div>
            )}

            {/* Emotion Category */}
            {file && (
              <div className="mt-6">
                <label className="block text-xs uppercase tracking-[0.15em] text-gold-200/70 mb-3">
                  Emotion
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {EMOTION_CATEGORIES.map((cat) => {
                    const Icon = cat.icon
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setEmotion(cat.id)}
                        disabled={isUploading}
                        className={`p-3 rounded-lg border transition-all ${
                          emotion === cat.id
                            ? 'border-gold-400 bg-gold-400/10'
                            : 'border-gold-500/20 bg-obsidian-800/40 hover:border-gold-500/40'
                        }`}
                      >
                        <Icon className={`w-5 h-5 mx-auto mb-1 ${
                          emotion === cat.id ? 'text-gold-400' : 'text-gold-200/50'
                        }`} />
                        <p className={`text-xs ${
                          emotion === cat.id ? 'text-gold-400' : 'text-gold-200/50'
                        }`}>
                          {cat.label}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Visibility Options */}
            {file && (
              <div className="mt-6">
                <label className="block text-xs uppercase tracking-[0.15em] text-gold-200/70 mb-3">
                  Visibility
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {VISIBILITY_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setVisibility(option.id)}
                      disabled={isUploading}
                      className={`p-4 rounded-lg border transition-all text-left ${
                        visibility === option.id
                          ? 'border-gold-400 bg-gold-400/10'
                          : 'border-gold-500/20 bg-obsidian-800/40 hover:border-gold-500/40'
                      }`}
                    >
                      <p className={`font-medium mb-1 ${
                        visibility === option.id ? 'text-gold-400' : 'text-gold-200/70'
                      }`}>
                        {option.label}
                      </p>
                      <p className={`text-xs ${
                        visibility === option.id ? 'text-gold-200/70' : 'text-gold-200/50'
                      }`}>
                        {option.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Importance Slider */}
            {file && (
              <div className="mt-6">
                <label className="block text-xs uppercase tracking-[0.15em] text-gold-200/70 mb-3">
                  Importance: {importance}/10
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={importance}
                  onChange={(e) => setImportance(parseInt(e.target.value))}
                  disabled={isUploading}
                  className="w-full h-2 bg-obsidian-800/40 rounded-lg appearance-none cursor-pointer accent-gold-400"
                  style={{
                    background: `linear-gradient(to right, rgb(212, 175, 55) 0%, rgb(212, 175, 55) ${importance * 10}%, rgba(212, 175, 55, 0.1) ${importance * 10}%, rgba(212, 175, 55, 0.1) 100%)`
                  }}
                />
              </div>
            )}

            {/* Progress */}
            {progress.stage !== 'idle' && (
              <div className="mt-6 p-4 bg-obsidian-800/60 border border-gold-500/20 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  {progress.stage === 'complete' ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : progress.stage === 'error' ? (
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  ) : (
                    <Loader2 className="w-5 h-5 text-gold-400 animate-spin" />
                  )}
                  <p className={`text-sm font-medium ${
                    progress.stage === 'complete' ? 'text-green-400' :
                    progress.stage === 'error' ? 'text-red-400' :
                    'text-gold-400'
                  }`}>
                    {progress.message}
                  </p>
                </div>
                {progress.stage !== 'error' && (
                  <div className="w-full h-2 bg-obsidian-900/60 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-gold-400 to-gold-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress.progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gold-500/20 flex items-center justify-between">
            <p className="text-xs text-gold-200/50">
              All files are encrypted before upload
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleClose}
                disabled={isUploading}
                className="px-4 py-2 rounded-lg border border-gold-500/30 text-gold-400 hover:border-gold-400 hover:bg-gold/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase tracking-[0.15em]"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!canUpload}
                className="px-6 py-2 rounded-lg bg-gradient-to-r from-gold-400 to-gold-500 text-obsidian-900 font-medium hover:from-gold-500 hover:to-gold-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase tracking-[0.15em] shadow-lg shadow-gold-400/20"
              >
                {isUploading ? 'Uploading...' : 'Preserve Memory'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
