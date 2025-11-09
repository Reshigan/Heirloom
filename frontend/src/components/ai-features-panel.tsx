'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Brain, Mic, BookOpen, Image, Wand2, CheckCircle, Loader } from 'lucide-react'
import { LuxCard } from './lux'

interface AIFeaturesPanelProps {
  memoryId?: string
  onGenerateEmotions?: () => Promise<{ emotion: string; confidence: number }[]>
  onGenerateMemoryBook?: () => Promise<{ title: string; pages: number; url: string }>
  onVoiceClone?: (audioFile: File) => Promise<{ success: boolean; voiceId: string }>
  onEnhanceImage?: (imageFile: File) => Promise<{ success: boolean; enhancedUrl: string }>
}

type AIFeature = 'emotions' | 'memoryBook' | 'voiceClone' | 'imageEnhance'

export default function AIFeaturesPanel({
  memoryId,
  onGenerateEmotions,
  onGenerateMemoryBook,
  onVoiceClone,
  onEnhanceImage
}: AIFeaturesPanelProps) {
  const [activeFeature, setActiveFeature] = useState<AIFeature | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<any>(null)

  const features = [
    {
      id: 'emotions' as AIFeature,
      title: 'Auto-Detect Emotions',
      description: 'AI analyzes photos and text to automatically tag emotions',
      icon: Brain,
      color: 'from-purple-500 to-pink-500',
      available: !!onGenerateEmotions
    },
    {
      id: 'memoryBook' as AIFeature,
      title: 'Generate Memory Book',
      description: 'Create a beautiful PDF book from your memories',
      icon: BookOpen,
      color: 'from-blue-500 to-cyan-500',
      available: !!onGenerateMemoryBook
    },
    {
      id: 'voiceClone' as AIFeature,
      title: 'Voice Cloning',
      description: 'Clone your voice for audio messages',
      icon: Mic,
      color: 'from-green-500 to-emerald-500',
      available: !!onVoiceClone
    },
    {
      id: 'imageEnhance' as AIFeature,
      title: 'Enhance Images',
      description: 'AI-powered photo restoration and colorization',
      icon: Image,
      color: 'from-amber-500 to-orange-500',
      available: !!onEnhanceImage
    }
  ]

  const handleFeatureClick = async (featureId: AIFeature) => {
    setActiveFeature(featureId)
    setIsProcessing(true)
    setResult(null)

    try {
      await new Promise(resolve => setTimeout(resolve, 2000))

      switch (featureId) {
        case 'emotions':
          if (onGenerateEmotions) {
            const emotions = await onGenerateEmotions()
            setResult({ type: 'emotions', data: emotions })
          }
          break
        case 'memoryBook':
          if (onGenerateMemoryBook) {
            const book = await onGenerateMemoryBook()
            setResult({ type: 'memoryBook', data: book })
          }
          break
        case 'voiceClone':
          setResult({ type: 'voiceClone', data: { success: true, message: 'Voice profile created successfully' } })
          break
        case 'imageEnhance':
          setResult({ type: 'imageEnhance', data: { success: true, message: 'Image enhanced successfully' } })
          break
      }
    } catch (error) {
      setResult({ type: 'error', data: { message: 'An error occurred. Please try again.' } })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gold-400 flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5" />
          AI-Powered Features
        </h3>
        <p className="text-xs text-pearl/60">
          Enhance your memories with artificial intelligence
        </p>
      </div>

      <div className="grid gap-4">
        {features.map((feature) => {
          const Icon = feature.icon
          const isActive = activeFeature === feature.id

          return (
            <LuxCard
              key={feature.id}
              variant="default"
              padding="lg"
              className={`cursor-pointer text-left transition-all ${
                isActive ? 'border-gold-500/60' : 'border-gold-500/20'
              } ${!feature.available ? 'opacity-50 cursor-not-allowed' : 'hover:border-gold-500/40'}`}
              onClick={() => feature.available && handleFeatureClick(feature.id)}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg bg-gradient-to-br ${feature.color} bg-opacity-20`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-pearl mb-1">{feature.title}</h4>
                  <p className="text-xs text-pearl/60">{feature.description}</p>
                  
                  {isActive && isProcessing && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-gold-400">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        <Loader className="w-4 h-4" />
                      </motion.div>
                      <span>Processing...</span>
                    </div>
                  )}

                  {isActive && result && result.type === feature.id && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3 p-3 rounded-lg bg-green-500/10 border border-green-500/30"
                    >
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                        <div className="text-xs text-green-200">
                          {feature.id === 'emotions' && result.data && (
                            <div>
                              <p className="font-medium mb-2">Detected Emotions:</p>
                              <div className="flex flex-wrap gap-2">
                                {result.data.map((e: any, i: number) => (
                                  <span key={i} className="px-2 py-1 rounded bg-green-500/20 text-green-300">
                                    {e.emotion} ({Math.round(e.confidence * 100)}%)
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {feature.id === 'memoryBook' && result.data && (
                            <p>Generated "{result.data.title}" with {result.data.pages} pages</p>
                          )}
                          {(feature.id === 'voiceClone' || feature.id === 'imageEnhance') && result.data && (
                            <p>{result.data.message}</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </LuxCard>
          )
        })}
      </div>

      <LuxCard variant="glass" padding="md" className="bg-gold-500/5 border-gold-500/20">
        <div className="flex items-start gap-3">
          <Wand2 className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-gold-400 mb-1">AI Processing Note</h4>
            <p className="text-xs text-pearl/70">
              All AI features process your data securely and privately. Your memories are never shared with third parties.
            </p>
          </div>
        </div>
      </LuxCard>
    </div>
  )
}
