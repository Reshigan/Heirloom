'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Mic, 
  Square, 
  Play, 
  Pause, 
  Save, 
  X, 
  Sparkles,
  Clock,
  User,
  Calendar,
  MapPin,
  RefreshCw,
  CheckCircle,
  Volume2
} from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { useAuth } from '@/contexts/AuthContext'

interface StoryRecorderProps {
  onClose: () => void
  onSave?: (story: StoryData) => void
}

interface StoryData {
  title: string
  transcript: string
  date: string
  participants: string[]
  location: string
  duration: number
  prompt: string
}

const storyPrompts = [
  {
    id: 1,
    category: 'Childhood',
    prompt: 'Tell me about your favorite childhood memory',
    followUp: 'What made that moment so special?'
  },
  {
    id: 2,
    category: 'Family',
    prompt: 'Describe a family tradition that means the most to you',
    followUp: 'How did this tradition start?'
  },
  {
    id: 3,
    category: 'Career',
    prompt: 'Share the story of your first job or career milestone',
    followUp: 'What did you learn from that experience?'
  },
  {
    id: 4,
    category: 'Love',
    prompt: 'Tell me about how you met your spouse or a significant person in your life',
    followUp: 'What was your first impression?'
  },
  {
    id: 5,
    category: 'Adventure',
    prompt: 'Describe the most adventurous thing you\'ve ever done',
    followUp: 'Would you do it again?'
  },
  {
    id: 6,
    category: 'Wisdom',
    prompt: 'What\'s the most important lesson life has taught you?',
    followUp: 'How has this shaped who you are today?'
  },
  {
    id: 7,
    category: 'Heritage',
    prompt: 'Tell me about your family\'s cultural heritage or traditions',
    followUp: 'Which traditions do you want to pass down?'
  },
  {
    id: 8,
    category: 'Milestone',
    prompt: 'Share a story about a major life milestone',
    followUp: 'How did this change your perspective?'
  }
]

const StoryRecorder: React.FC<StoryRecorderProps> = ({ onClose, onSave }) => {
  const { isAuthenticated } = useAuth()
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [currentPrompt, setCurrentPrompt] = useState(storyPrompts[0])
  const [transcript, setTranscript] = useState('')
  const [showFollowUp, setShowFollowUp] = useState(false)
  const [storyTitle, setStoryTitle] = useState('')
  const [storyLocation, setStoryLocation] = useState('')
  const [recordingComplete, setRecordingComplete] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRecording, isPaused])

  const handleStartRecording = () => {
    setIsRecording(true)
    setIsPaused(false)
    setTranscript('')
    setRecordingTime(0)
    setShowFollowUp(false)
    
    setTimeout(() => {
      setTranscript('This is a simulated transcript. In a real implementation, this would capture your voice and convert it to text in real-time using speech recognition...')
    }, 2000)
  }

  const handlePauseResume = () => {
    setIsPaused(!isPaused)
  }

  const handleStopRecording = () => {
    setIsRecording(false)
    setIsPaused(false)
    setRecordingComplete(true)
    
    if (recordingTime > 30) {
      setShowFollowUp(true)
    }
  }

  const handleNewPrompt = () => {
    const randomPrompt = storyPrompts[Math.floor(Math.random() * storyPrompts.length)]
    setCurrentPrompt(randomPrompt)
    setShowFollowUp(false)
  }

  const handleSave = async () => {
    if (!isAuthenticated) {
      setError('You must be signed in to save stories')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const storyData = {
        title: storyTitle || `${currentPrompt.category} Story`,
        transcript: transcript,
        date: new Date().toISOString().split('T')[0],
        participants: [],
        location: storyLocation,
        duration: recordingTime,
        tags: [currentPrompt.category.toLowerCase()]
      }
      
      await apiClient.createStory(storyData)
      
      if (onSave) {
        onSave({
          ...storyData,
          prompt: currentPrompt.prompt
        })
      }
      
      onClose()
    } catch (err: any) {
      console.error('Failed to save story:', err)
      setError(err.message || 'Failed to save story')
    } finally {
      setIsSaving(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        className="relative w-full max-w-3xl bg-gradient-to-br from-obsidian-900/95 to-charcoal/95 border border-gold-500/30 rounded-2xl overflow-hidden shadow-2xl"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-gold-400/5 to-transparent pointer-events-none" />
        
        <div className="relative p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-gold-600 to-gold-500 rounded-xl">
                <Mic className="w-6 h-6 text-obsidian-900" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gold-100">Guided Story Recorder</h2>
                <p className="text-gold-400/70 text-sm">Preserve your memories with voice</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gold-400 hover:text-gold-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            <div className="bg-obsidian-800/60 border border-gold-500/20 rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="text-xs uppercase tracking-wider text-gold-400/70 mb-2">
                    {currentPrompt.category} Story
                  </div>
                  <h3 className="text-xl font-serif text-gold-100 mb-3">
                    {currentPrompt.prompt}
                  </h3>
                  <AnimatePresence>
                    {showFollowUp && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-gold-300/80 italic"
                      >
                        {currentPrompt.followUp}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
                <button
                  onClick={handleNewPrompt}
                  className="p-2 text-gold-400 hover:text-gold-300 transition-colors"
                  title="Get new prompt"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center justify-center gap-4 py-8">
                {!isRecording && !recordingComplete && (
                  <motion.button
                    onClick={handleStartRecording}
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-gold-600 to-gold-400 flex items-center justify-center text-obsidian-900 hover:from-gold-500 hover:to-gold-300 transition-all duration-300 shadow-lg shadow-gold-400/30"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Mic className="w-8 h-8" />
                  </motion.button>
                )}

                {isRecording && (
                  <>
                    <motion.button
                      onClick={handlePauseResume}
                      className="w-16 h-16 rounded-full bg-obsidian-800 border-2 border-gold-500/30 flex items-center justify-center text-gold-400 hover:border-gold-400 transition-all duration-300"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {isPaused ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
                    </motion.button>

                    <div className="relative">
                      <motion.div
                        className="w-24 h-24 rounded-full bg-gradient-to-br from-gold-600 to-gold-500 flex items-center justify-center"
                        animate={{
                          scale: isPaused ? 1 : [1, 1.1, 1],
                          opacity: isPaused ? 0.5 : 1
                        }}
                        transition={{
                          scale: { duration: 1.5, repeat: Infinity },
                          opacity: { duration: 0.3 }
                        }}
                      >
                        <Volume2 className="w-10 h-10 text-obsidian-900" />
                      </motion.div>
                      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-gold-100 font-mono text-lg">
                          <Clock className="w-4 h-4" />
                          {formatTime(recordingTime)}
                        </div>
                      </div>
                    </div>

                    <motion.button
                      onClick={handleStopRecording}
                      className="w-16 h-16 rounded-full bg-obsidian-800 border-2 border-gold-500/30 flex items-center justify-center text-gold-400 hover:border-gold-400 transition-all duration-300"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Square className="w-6 h-6" />
                    </motion.button>
                  </>
                )}

                {recordingComplete && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-2 text-gold-400"
                  >
                    <CheckCircle className="w-8 h-8" />
                    <span className="text-lg font-semibold">Recording Complete!</span>
                  </motion.div>
                )}
              </div>

              {isPaused && (
                <div className="text-center text-gold-400/70 text-sm">
                  Recording paused - Click play to continue
                </div>
              )}
            </div>

            {transcript && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-obsidian-800/60 border border-gold-500/20 rounded-xl p-6"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-gold-400" />
                  <h4 className="text-gold-100 font-semibold">Live Transcript</h4>
                </div>
                <div className="text-gold-300/90 leading-relaxed max-h-40 overflow-y-auto">
                  {transcript}
                </div>
              </motion.div>
            )}

            {recordingComplete && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {error && (
                  <div className="p-3 rounded-lg bg-gold-600/20 border border-gold-500/50 text-gold-200 text-sm">
                    {error}
                  </div>
                )}

                {!isAuthenticated && (
                  <div className="p-3 rounded-lg bg-gold-600/20 border border-gold-500/50 text-gold-200 text-sm">
                    Please sign in to save your story
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gold-100 font-semibold mb-2 text-sm">
                      Story Title
                    </label>
                    <input
                      type="text"
                      value={storyTitle}
                      onChange={(e) => setStoryTitle(e.target.value)}
                      placeholder={`${currentPrompt.category} Story`}
                      disabled={isSaving}
                      className="w-full px-4 py-2 bg-obsidian-800/60 border border-gold-500/20 rounded-lg text-gold-100 placeholder-gold-400/40 focus:outline-none focus:border-gold-400/40 disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-gold-100 font-semibold mb-2 text-sm">
                      Location
                    </label>
                    <input
                      type="text"
                      value={storyLocation}
                      onChange={(e) => setStoryLocation(e.target.value)}
                      placeholder="Where did this happen?"
                      disabled={isSaving}
                      className="w-full px-4 py-2 bg-obsidian-800/60 border border-gold-500/20 rounded-lg text-gold-100 placeholder-gold-400/40 focus:outline-none focus:border-gold-400/40 disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    disabled={isSaving || !isAuthenticated}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-gold-600 to-gold-500 text-obsidian-900 rounded-lg hover:from-gold-500 hover:to-gold-400 transition-all duration-300 font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-5 h-5 border-2 border-obsidian-900/20 border-t-obsidian-900 rounded-full animate-spin"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Save Story
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setRecordingComplete(false)
                      setTranscript('')
                      setRecordingTime(0)
                      setStoryTitle('')
                      setStoryLocation('')
                      setError(null)
                    }}
                    disabled={isSaving}
                    className="px-6 py-3 bg-obsidian-800 border border-gold-500/30 text-gold-400 rounded-lg hover:border-gold-400 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Record Again
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-gold-500/20">
            <div className="flex items-center gap-4 text-sm text-gold-400/70">
              <div className="flex items-center gap-1">
                <Sparkles className="w-4 h-4" />
                <span>AI-powered transcription</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>Auto-saved every 30 seconds</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default StoryRecorder
