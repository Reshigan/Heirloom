'use client'

import React, { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Upload, 
  Camera, 
  Video, 
  Music, 
  FileText, 
  Image, 
  File,
  X, 
  Check, 
  AlertCircle,
  Cloud,
  Zap,
  Tag,
  Calendar,
  MapPin,
  Users,
  Heart,
  Star,
  Sparkles,
  Download,
  Share2,
  Eye,
  Trash2,
  Edit,
  Plus
} from 'lucide-react'

interface UploadFile {
  id: string
  file: File
  name: string
  size: number
  type: string
  preview?: string
  progress: number
  status: 'uploading' | 'completed' | 'error' | 'processing'
  metadata: {
    title: string
    description: string
    tags: string[]
    date: string
    location: string
    familyMembers: string[]
    category: 'photo' | 'video' | 'audio' | 'document'
    isPrivate: boolean
  }
}

interface AnimatedUploadInterfaceProps {
  isOpen: boolean
  onClose: () => void
  onUploadComplete?: (files: UploadFile[]) => void
}

export default function AnimatedUploadInterface({ isOpen, onClose, onUploadComplete }: AnimatedUploadInterfaceProps) {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<UploadFile | null>(null)
  const [uploadMode, setUploadMode] = useState<'single' | 'batch'>('single')
  const [showMetadataForm, setShowMetadataForm] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  const acceptedTypes = {
    'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    'video/*': ['.mp4', '.mov', '.avi', '.mkv'],
    'audio/*': ['.mp3', '.wav', '.m4a', '.flac'],
    'application/pdf': ['.pdf'],
    'text/*': ['.txt', '.md']
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="w-6 h-6" />
    if (type.startsWith('video/')) return <Video className="w-6 h-6" />
    if (type.startsWith('audio/')) return <Music className="w-6 h-6" />
    if (type.includes('pdf') || type.startsWith('text/')) return <FileText className="w-6 h-6" />
    return <File className="w-6 h-6" />
  }

  const getFileCategory = (type: string): 'photo' | 'video' | 'audio' | 'document' => {
    if (type.startsWith('image/')) return 'photo'
    if (type.startsWith('video/')) return 'video'
    if (type.startsWith('audio/')) return 'audio'
    return 'document'
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const createFilePreview = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.readAsDataURL(file)
      } else {
        resolve('')
      }
    })
  }

  const processFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    
    for (const file of fileArray) {
      const preview = await createFilePreview(file)
      const uploadFile: UploadFile = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        preview,
        progress: 0,
        status: 'uploading',
        metadata: {
          title: file.name.replace(/\.[^/.]+$/, ''),
          description: '',
          tags: [],
          date: new Date().toISOString().split('T')[0],
          location: '',
          familyMembers: [],
          category: getFileCategory(file.type),
          isPrivate: false
        }
      }

      setUploadFiles(prev => [...prev, uploadFile])
      simulateUpload(uploadFile.id)
    }
  }

  const simulateUpload = (fileId: string) => {
    const interval = setInterval(() => {
      setUploadFiles(prev => prev.map(file => {
        if (file.id === fileId) {
          const newProgress = Math.min(file.progress + Math.random() * 15, 100)
          const newStatus = newProgress === 100 ? 'completed' : 'uploading'
          
          if (newProgress === 100) {
            clearInterval(interval)
            // Simulate processing phase
            setTimeout(() => {
              setUploadFiles(prev => prev.map(f => 
                f.id === fileId ? { ...f, status: 'processing' } : f
              ))
              
              // Complete processing
              setTimeout(() => {
                setUploadFiles(prev => prev.map(f => 
                  f.id === fileId ? { ...f, status: 'completed' } : f
                ))
              }, 1000)
            }, 500)
          }
          
          return { ...file, progress: newProgress, status: newStatus }
        }
        return file
      }))
    }, 200)
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      processFiles(files)
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      processFiles(files)
    }
  }

  const removeFile = (fileId: string) => {
    setUploadFiles(prev => prev.filter(file => file.id !== fileId))
  }

  const updateFileMetadata = (fileId: string, metadata: Partial<UploadFile['metadata']>) => {
    setUploadFiles(prev => prev.map(file => 
      file.id === fileId 
        ? { ...file, metadata: { ...file.metadata, ...metadata } }
        : file
    ))
  }

  const handleComplete = () => {
    const completedFiles = uploadFiles.filter(file => file.status === 'completed')
    onUploadComplete?.(completedFiles)
    onClose()
  }

  if (!isOpen) return null

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="absolute inset-4 bg-gradient-to-br from-charcoal via-obsidian to-charcoal rounded-2xl shadow-2xl border border-gold-500/30 overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-gold-600/20 via-gold-500/20 to-gold-600/20 border-b border-gold-500/30 p-6 text-pearl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <motion.div
                className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center"
                animate={{ 
                  rotate: [0, 360],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                  scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                }}
              >
                <Upload className="w-6 h-6" />
              </motion.div>
              <div>
                <h2 className="text-2xl font-serif font-bold text-gold-400">Upload Memories</h2>
                <p className="text-pearl/70">
                  {uploadFiles.length > 0 
                    ? `${uploadFiles.filter(f => f.status === 'completed').length}/${uploadFiles.length} files uploaded`
                    : 'Drag & drop or click to upload'
                  }
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {uploadFiles.length > 0 && (
                <motion.button
                  onClick={handleComplete}
                  className="flex items-center space-x-2 px-4 py-2 bg-gold-500/20 border border-gold-500/30 rounded-lg hover:bg-gold-500/30 transition-colors text-gold-400"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={uploadFiles.some(f => f.status !== 'completed')}
                >
                  <Check className="w-4 h-4" />
                  <span>Complete</span>
                </motion.button>
              )}
              
              <button
                onClick={onClose}
                className="w-8 h-8 bg-gold-500/20 border border-gold-500/30 rounded-full flex items-center justify-center hover:bg-gold-500/30 transition-colors text-gold-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Upload Mode Toggle */}
        <div className="bg-obsidian-800/40 border-b border-gold-500/20 p-4">
          <div className="flex items-center justify-between">
            <div className="flex bg-obsidian-900/60 border border-gold-500/20 rounded-lg overflow-hidden">
              <button
                onClick={() => setUploadMode('single')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  uploadMode === 'single'
                    ? 'bg-gold-500/20 text-gold-400 border-r border-gold-500/30'
                    : 'text-pearl/60 hover:bg-obsidian-800/40'
                }`}
              >
                Single Upload
              </button>
              <button
                onClick={() => setUploadMode('batch')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  uploadMode === 'batch'
                    ? 'bg-gold-500/20 text-gold-400'
                    : 'text-pearl/60 hover:bg-obsidian-800/40'
                }`}
              >
                Batch Upload
              </button>
            </div>

            <div className="text-sm text-pearl/60">
              Supported: Images, Videos, Audio, Documents
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          {uploadFiles.length === 0 ? (
            /* Drop Zone */
            <motion.div
              ref={dropZoneRef}
              className={`h-full flex items-center justify-center p-8 transition-colors ${
                isDragOver 
                  ? 'bg-gold-500/10 border-gold-400' 
                  : 'bg-obsidian-800/40 border-gold-500/20'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              whileHover={{ scale: 1.02 }}
              animate={isDragOver ? { scale: 1.05 } : { scale: 1 }}
            >
              <div className="text-center max-w-md">
                <motion.div
                  className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center border-2 ${
                    isDragOver ? 'bg-gold-500/20 border-gold-400 text-gold-400' : 'bg-obsidian-900/60 border-gold-500/30 text-gold-400/60'
                  }`}
                  animate={isDragOver ? { 
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0]
                  } : {}}
                  transition={{ duration: 0.5 }}
                >
                  <Cloud className="w-12 h-12" />
                </motion.div>
                
                <h3 className="text-xl font-serif font-semibold text-gold-400 mb-2">
                  {isDragOver ? 'Drop files here!' : 'Upload Your Memories'}
                </h3>
                
                <p className="text-pearl/60 mb-6">
                  Drag and drop files here, or click to browse
                </p>

                <div className="space-y-4">
                  <motion.button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full bg-gradient-to-r from-gold-600 to-gold-500 text-obsidian-900 py-3 px-6 rounded-lg font-semibold hover:shadow-lg hover:shadow-gold-400/20 transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <Upload className="w-5 h-5" />
                      <span>Choose Files</span>
                    </div>
                  </motion.button>

                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { icon: <Camera className="w-5 h-5" />, label: 'Photos', color: 'bg-gold-500/20 border border-gold-500/30 text-gold-400' },
                      { icon: <Video className="w-5 h-5" />, label: 'Videos', color: 'bg-gold-500/20 border border-gold-500/30 text-gold-400' },
                      { icon: <Music className="w-5 h-5" />, label: 'Audio', color: 'bg-gold-500/20 border border-gold-500/30 text-gold-400' },
                      { icon: <FileText className="w-5 h-5" />, label: 'Documents', color: 'bg-gold-500/20 border border-gold-500/30 text-gold-400' }
                    ].map((type, index) => (
                      <motion.div
                        key={type.label}
                        className={`${type.color} p-3 rounded-lg text-center`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.05 }}
                      >
                        <div className="flex items-center justify-center space-x-2">
                          {type.icon}
                          <span className="text-sm font-medium">{type.label}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            /* File List */
            <div className="h-full overflow-y-auto p-6">
              <div className="space-y-4">
                {uploadFiles.map((file, index) => (
                  <motion.div
                    key={file.id}
                    className="bg-obsidian-900/60 border border-gold-500/20 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-gold-500/40 transition-all"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-start space-x-4">
                      {/* File Preview */}
                      <div className="w-16 h-16 bg-obsidian-800/60 border border-gold-500/20 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {file.preview ? (
                          <img src={file.preview} alt={file.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-gold-400/60">
                            {getFileIcon(file.type)}
                          </div>
                        )}
                      </div>

                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gold-400 truncate">{file.name}</h4>
                          <div className="flex items-center space-x-2">
                            {file.status === 'completed' && (
                              <motion.div
                                className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 500 }}
                              >
                                <Check className="w-4 h-4 text-white" />
                              </motion.div>
                            )}
                            
                            {file.status === 'processing' && (
                              <motion.div
                                className="w-6 h-6 bg-gold-500/20 border border-gold-500/30 rounded-full flex items-center justify-center"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              >
                                <Zap className="w-3 h-3 text-gold-400" />
                              </motion.div>
                            )}

                            <button
                              onClick={() => removeFile(file.id)}
                              className="w-6 h-6 text-gold-400/60 hover:text-red-400 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="text-sm text-pearl/60 mb-2">
                          {formatFileSize(file.size)} • {file.metadata.category}
                        </div>

                        {/* Progress Bar */}
                        {file.status === 'uploading' && (
                          <div className="mb-3">
                            <div className="flex items-center justify-between text-xs text-pearl/50 mb-1">
                              <span>Uploading...</span>
                              <span>{Math.round(file.progress)}%</span>
                            </div>
                            <div className="w-full bg-obsidian-800/60 rounded-full h-2">
                              <motion.div
                                className="bg-gradient-to-r from-gold-600 to-gold-500 h-2 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${file.progress}%` }}
                                transition={{ duration: 0.3 }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Processing Indicator */}
                        {file.status === 'processing' && (
                          <div className="mb-3">
                            <div className="flex items-center space-x-2 text-sm text-gold-400">
                              <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 1, repeat: Infinity }}
                              >
                                <Sparkles className="w-4 h-4" />
                              </motion.div>
                              <span>Processing and analyzing...</span>
                            </div>
                          </div>
                        )}

                        {/* Metadata Form */}
                        {file.status === 'completed' && (
                          <motion.div
                            className="space-y-3 pt-3 border-t border-gold-500/20"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            transition={{ delay: 0.5 }}
                          >
                            <div className="grid grid-cols-2 gap-3">
                              <input
                                type="text"
                                placeholder="Title"
                                value={file.metadata.title}
                                onChange={(e) => updateFileMetadata(file.id, { title: e.target.value })}
                                className="px-3 py-2 bg-obsidian-800/60 border border-gold-500/20 rounded-lg text-sm text-gold-100 placeholder-gold-400/40 focus:ring-2 focus:ring-gold-400/20 focus:border-gold-400/60"
                              />
                              
                              <input
                                type="date"
                                value={file.metadata.date}
                                onChange={(e) => updateFileMetadata(file.id, { date: e.target.value })}
                                className="px-3 py-2 bg-obsidian-800/60 border border-gold-500/20 rounded-lg text-sm text-gold-100 placeholder-gold-400/40 focus:ring-2 focus:ring-gold-400/20 focus:border-gold-400/60"
                              />
                            </div>

                            <textarea
                              placeholder="Description"
                              value={file.metadata.description}
                              onChange={(e) => updateFileMetadata(file.id, { description: e.target.value })}
                              className="w-full px-3 py-2 bg-obsidian-800/60 border border-gold-500/20 rounded-lg text-sm text-gold-100 placeholder-gold-400/40 focus:ring-2 focus:ring-gold-400/20 focus:border-gold-400/60"
                              rows={2}
                            />

                            <div className="grid grid-cols-2 gap-3">
                              <input
                                type="text"
                                placeholder="Location"
                                value={file.metadata.location}
                                onChange={(e) => updateFileMetadata(file.id, { location: e.target.value })}
                                className="px-3 py-2 bg-obsidian-800/60 border border-gold-500/20 rounded-lg text-sm text-gold-100 placeholder-gold-400/40 focus:ring-2 focus:ring-gold-400/20 focus:border-gold-400/60"
                              />
                              
                              <input
                                type="text"
                                placeholder="Tags (comma separated)"
                                value={file.metadata.tags.join(', ')}
                                onChange={(e) => updateFileMetadata(file.id, { 
                                  tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                                })}
                                className="px-3 py-2 bg-obsidian-800/60 border border-gold-500/20 rounded-lg text-sm text-gold-100 placeholder-gold-400/40 focus:ring-2 focus:ring-gold-400/20 focus:border-gold-400/60"
                              />
                            </div>

                            <div className="flex items-center justify-between">
                              <label className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={file.metadata.isPrivate}
                                  onChange={(e) => updateFileMetadata(file.id, { isPrivate: e.target.checked })}
                                  className="rounded border-gold-500/30 text-gold-500 focus:ring-gold-400/20 bg-obsidian-800/60"
                                />
                                <span className="text-sm text-pearl/70">Private memory</span>
                              </label>

                              <div className="flex items-center space-x-2">
                                <motion.button
                                  className="p-2 text-gold-400/60 hover:text-gold-400 transition-colors"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  <Star className="w-4 h-4" />
                                </motion.button>
                                
                                <motion.button
                                  className="p-2 text-gold-400/60 hover:text-gold-400 transition-colors"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  <Share2 className="w-4 h-4" />
                                </motion.button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Add More Files Button */}
              <motion.button
                onClick={() => fileInputRef.current?.click()}
                className="w-full mt-6 border-2 border-dashed border-gold-500/30 rounded-xl p-6 text-gold-400/60 hover:border-gold-400 hover:text-gold-400 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Plus className="w-5 h-5" />
                  <span>Add More Files</span>
                </div>
              </motion.button>
            </div>
          )}
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={Object.keys(acceptedTypes).join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />
      </motion.div>
    </motion.div>
  )
}
