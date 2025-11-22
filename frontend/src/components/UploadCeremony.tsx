'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Sparkles, Check } from 'lucide-react'
import { GlassButton } from './design-system'

interface UploadCeremonyProps {
  isOpen: boolean
  onClose: () => void
  onUpload: (files: File[]) => Promise<void>
}

type CeremonyPhase = 'initiation' | 'processing' | 'enrichment' | 'completion'

export function UploadCeremony({ isOpen, onClose, onUpload }: UploadCeremonyProps) {
  const [phase, setPhase] = useState<CeremonyPhase>('initiation')
  const [files, setFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [progress, setProgress] = useState(0)
  const [processingSteps, setProcessingSteps] = useState<string[]>([])

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
    
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      (file) => file.type.startsWith('image/') || file.type.startsWith('video/')
    )
    
    if (droppedFiles.length > 0) {
      setFiles(droppedFiles)
      startProcessing(droppedFiles)
    }
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    if (selectedFiles.length > 0) {
      setFiles(selectedFiles)
      startProcessing(selectedFiles)
    }
  }, [])

  const startProcessing = async (uploadFiles: File[]) => {
    setPhase('processing')
    
    const steps = [
      'Analyzing content...',
      'Detecting faces...',
      'Enhancing quality...',
      'Extracting metadata...',
      'Preparing for preservation...',
    ]
    
    for (let i = 0; i < steps.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 800))
      setProcessingSteps((prev) => [...prev, steps[i]])
      setProgress(((i + 1) / steps.length) * 100)
    }
    
    setPhase('enrichment')
    
    setTimeout(async () => {
      try {
        await onUpload(uploadFiles)
        setPhase('completion')
        setTimeout(() => {
          handleClose()
        }, 3000)
      } catch (error) {
        console.error('Upload failed:', error)
        handleClose()
      }
    }, 2000)
  }

  const handleClose = () => {
    setPhase('initiation')
    setFiles([])
    setProgress(0)
    setProcessingSteps([])
    setIsDragging(false)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[2000] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-obsidian/95 backdrop-blur-[20px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <div className="relative w-full h-full flex items-center justify-center p-4">
            {phase === 'initiation' && (
              <motion.div
                className="text-center max-w-2xl"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <motion.h2
                  className="font-serif text-4xl md:text-6xl font-light text-gold mb-6"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  What memories will you preserve today?
                </motion.h2>

                <div
                  className="relative w-full max-w-xl h-96 mx-auto mt-12 rounded-3xl border-2 border-dashed transition-all duration-300"
                  style={{
                    borderColor: isDragging ? '#D4AF37' : 'rgba(212, 175, 55, 0.3)',
                    background: isDragging
                      ? 'radial-gradient(circle at center, rgba(212, 175, 55, 0.1) 0%, transparent 70%)'
                      : 'radial-gradient(circle at center, rgba(212, 175, 55, 0.05) 0%, transparent 70%)',
                  }}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <motion.div
                    className="absolute inset-0 flex flex-col items-center justify-center"
                    animate={{
                      scale: isDragging ? 1.05 : 1,
                    }}
                  >
                    <motion.div
                      className="w-32 h-32 rounded-full border-2 border-gold/30 flex items-center justify-center mb-6"
                      animate={{
                        rotate: 360,
                        borderColor: isDragging ? '#D4AF37' : 'rgba(212, 175, 55, 0.3)',
                      }}
                      transition={{
                        rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
                        borderColor: { duration: 0.3 },
                      }}
                    >
                      <Upload className="w-12 h-12 text-gold" />
                    </motion.div>

                    <p className="text-xl text-pearl mb-4">Drop your memories here</p>
                    <p className="text-sm text-gold-light/60 mb-6">or</p>

                    <label>
                      <input
                        type="file"
                        multiple
                        accept="image/*,video/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <GlassButton variant="primary" size="lg">
                        Choose Files
                      </GlassButton>
                    </label>
                  </motion.div>

                  {isDragging && (
                    <motion.div
                      className="absolute inset-0 pointer-events-none"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      {Array.from({ length: 20 }).map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute w-1 h-1 bg-gold rounded-full"
                          style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                          }}
                          animate={{
                            scale: [0, 1, 0],
                            opacity: [0, 1, 0],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: Math.random() * 2,
                          }}
                        />
                      ))}
                    </motion.div>
                  )}
                </div>

                <motion.button
                  className="mt-8 text-gold-light/60 hover:text-gold transition-colors"
                  onClick={handleClose}
                  whileHover={{ scale: 1.05 }}
                >
                  Cancel
                </motion.button>
              </motion.div>
            )}

            {phase === 'processing' && (
              <motion.div
                className="text-center max-w-2xl"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <h2 className="font-serif text-4xl md:text-5xl font-light text-gold mb-12">
                  Preserving Your Memories
                </h2>

                <div className="relative w-64 h-64 mx-auto mb-12">
                  <svg className="w-full h-full -rotate-90">
                    <circle
                      cx="128"
                      cy="128"
                      r="120"
                      stroke="rgba(212, 175, 55, 0.2)"
                      strokeWidth="8"
                      fill="none"
                    />
                    <motion.circle
                      cx="128"
                      cy="128"
                      r="120"
                      stroke="#D4AF37"
                      strokeWidth="8"
                      fill="none"
                      strokeLinecap="round"
                      initial={{ strokeDasharray: '0 753.98' }}
                      animate={{ strokeDasharray: `${(progress / 100) * 753.98} 753.98` }}
                      transition={{ duration: 0.5 }}
                    />
                  </svg>

                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <motion.div
                        className="text-5xl font-light text-gold mb-2"
                        key={progress}
                        initial={{ scale: 1.2, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                      >
                        {Math.round(progress)}%
                      </motion.div>
                      <div className="text-sm text-gold-light/60">Processing</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {processingSteps.map((step, index) => (
                    <motion.div
                      key={index}
                      className="flex items-center justify-center gap-3 text-pearl"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Check className="w-4 h-4 text-gold" />
                      <span className="text-sm">{step}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {phase === 'enrichment' && (
              <motion.div
                className="text-center max-w-2xl"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <motion.div
                  className="w-32 h-32 mx-auto mb-8"
                  animate={{
                    rotate: 360,
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    rotate: { duration: 2, repeat: Infinity, ease: 'linear' },
                    scale: { duration: 2, repeat: Infinity },
                  }}
                >
                  <Sparkles className="w-full h-full text-gold" />
                </motion.div>

                <h2 className="font-serif text-4xl md:text-5xl font-light text-gold mb-6">
                  Adding Final Touches
                </h2>
                <p className="text-pearl/70">
                  Your memories are being enhanced and prepared for preservation...
                </p>
              </motion.div>
            )}

            {phase === 'completion' && (
              <motion.div
                className="text-center max-w-2xl"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <motion.div
                  className="relative w-32 h-32 mx-auto mb-8"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                >
                  <div className="w-full h-full rounded-full bg-gold/20 border-2 border-gold flex items-center justify-center">
                    <Check className="w-16 h-16 text-gold" />
                  </div>
                  
                  {Array.from({ length: 30 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 bg-gold rounded-full"
                      style={{
                        left: '50%',
                        top: '50%',
                      }}
                      initial={{ scale: 0, x: 0, y: 0 }}
                      animate={{
                        scale: [0, 1, 0],
                        x: Math.cos((i / 30) * Math.PI * 2) * 150,
                        y: Math.sin((i / 30) * Math.PI * 2) * 150,
                        opacity: [1, 1, 0],
                      }}
                      transition={{
                        duration: 1.5,
                        delay: i * 0.02,
                      }}
                    />
                  ))}
                </motion.div>

                <h2 className="font-serif text-4xl md:text-5xl font-light text-gold mb-6">
                  Memory Preserved
                </h2>
                <p className="text-xl text-pearl/70 mb-4">
                  {files.length} {files.length === 1 ? 'memory' : 'memories'} added to your constellation
                </p>
                <p className="text-sm text-gold-light/50 italic">
                  "Another star shines in your family's sky"
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
