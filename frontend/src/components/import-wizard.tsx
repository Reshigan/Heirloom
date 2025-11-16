'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Upload, 
  Cloud, 
  Smartphone,
  Facebook,
  Instagram,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  Loader,
  X,
  FolderOpen,
  HardDrive,
  Wifi,
  Download,
  Sparkles,
  Users,
  Calendar,
  MapPin,
  Tag,
  Zap,
  TrendingUp
} from 'lucide-react'

interface ImportSource {
  id: string
  name: string
  icon: React.ComponentType<any>
  description: string
  color: string
  supported: boolean
}

interface ImportProgress {
  total: number
  processed: number
  duplicates: number
  imported: number
  status: 'idle' | 'scanning' | 'processing' | 'complete' | 'error'
}

interface ImportWizardProps {
  onClose: () => void
  onComplete?: (results: ImportProgress) => void
}

const ImportWizard: React.FC<ImportWizardProps> = ({ onClose, onComplete }) => {
  const [step, setStep] = useState<'select' | 'configure' | 'import' | 'complete'>('select')
  const [selectedSource, setSelectedSource] = useState<string | null>(null)
  const [progress, setProgress] = useState<ImportProgress>({
    total: 0,
    processed: 0,
    duplicates: 0,
    imported: 0,
    status: 'idle'
  })
  const [importSettings, setImportSettings] = useState({
    autoTag: true,
    detectFaces: true,
    extractLocation: true,
    detectDuplicates: true,
    organizeByDate: true,
    aiEnhancement: false
  })

  const importSources: ImportSource[] = [
    {
      id: 'google-photos',
      name: 'Google Photos',
      icon: Cloud,
      description: 'Import from your Google Photos library',
      color: 'from-gold-600 to-gold-500',
      supported: true
    },
    {
      id: 'icloud',
      name: 'iCloud Photos',
      icon: Cloud,
      description: 'Import from your iCloud photo library',
      color: 'from-gold-600/80 to-gold-500/80',
      supported: true
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: Facebook,
      description: 'Import photos and memories from Facebook',
      color: 'from-gold-600 to-gold-500',
      supported: true
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: Instagram,
      description: 'Import your Instagram photos and stories',
      color: 'from-gold-600/90 to-gold-500/90',
      supported: true
    },
    {
      id: 'local',
      name: 'Local Files',
      icon: HardDrive,
      description: 'Upload photos and videos from your device',
      color: 'from-gold-600 to-gold-500',
      supported: true
    },
    {
      id: 'usb',
      name: 'USB Drive',
      icon: FolderOpen,
      description: 'Import from external USB drive or SD card',
      color: 'from-gold-600/70 to-gold-500/70',
      supported: true
    }
  ]

  const handleSelectSource = (sourceId: string) => {
    setSelectedSource(sourceId)
    setStep('configure')
  }

  const handleStartImport = () => {
    setStep('import')
    setProgress({
      total: 247,
      processed: 0,
      duplicates: 0,
      imported: 0,
      status: 'scanning'
    })

    setTimeout(() => {
      setProgress(prev => ({ ...prev, status: 'processing' }))
      
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev.processed >= prev.total) {
            clearInterval(interval)
            return {
              ...prev,
              status: 'complete',
              duplicates: 23,
              imported: 224
            }
          }
          return {
            ...prev,
            processed: prev.processed + Math.floor(Math.random() * 15) + 5,
            duplicates: prev.duplicates + Math.floor(Math.random() * 2),
            imported: prev.imported + Math.floor(Math.random() * 12) + 3
          }
        })
      }, 500)
    }, 2000)
  }

  const handleComplete = () => {
    if (onComplete) {
      onComplete(progress)
    }
    onClose()
  }

  const selectedSourceData = importSources.find(s => s.id === selectedSource)

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div
        className="relative w-full h-[100dvh] sm:h-auto sm:max-w-4xl bg-gradient-to-br from-obsidian-900/95 to-charcoal/95 border-0 sm:border border-gold-500/30 rounded-none sm:rounded-2xl overflow-y-auto shadow-2xl"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-gold-400/5 to-transparent pointer-events-none" />
        
        <div className="relative">
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gold-500/20">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 bg-gradient-to-r from-gold-600 to-gold-500 rounded-xl">
                <Upload className="w-5 h-5 sm:w-6 sm:h-6 text-obsidian-900" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-serif text-gold-100">Import Wizard</h2>
                <p className="text-gold-400/70 text-xs sm:text-sm hidden sm:block">Bring your memories into Heirloom</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gold-400 hover:text-gold-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center gap-2">
                {['select', 'configure', 'import', 'complete'].map((s, index) => (
                  <React.Fragment key={s}>
                    <div className={`flex items-center gap-2 ${
                      step === s ? 'text-gold-400' : 
                      ['select', 'configure', 'import', 'complete'].indexOf(step) > index ? 'text-gold-300' : 'text-gold-400/40'
                    }`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                        step === s ? 'border-gold-400 bg-gold-400/20' :
                        ['select', 'configure', 'import', 'complete'].indexOf(step) > index ? 'border-gold-300 bg-gold-300/20' : 'border-gold-400/40'
                      }`}>
                        {['select', 'configure', 'import', 'complete'].indexOf(step) > index ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <span className="text-sm font-semibold">{index + 1}</span>
                        )}
                      </div>
                      <span className="text-sm font-medium capitalize hidden sm:inline">{s}</span>
                    </div>
                    {index < 3 && (
                      <div className={`w-12 h-0.5 ${
                        ['select', 'configure', 'import', 'complete'].indexOf(step) > index ? 'bg-gold-300' : 'bg-gold-400/40'
                      }`} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <AnimatePresence mode="wait">
              {step === 'select' && (
                <motion.div
                  key="select"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  <h3 className="text-xl font-bold text-gold-100 mb-4">Select Import Source</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {importSources.map((source) => (
                      <motion.button
                        key={source.id}
                        onClick={() => handleSelectSource(source.id)}
                        className="flex items-start gap-4 p-4 bg-obsidian-800/60 border border-gold-500/20 rounded-xl hover:border-gold-500/40 transition-all duration-300 text-left group"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className={`p-3 bg-gradient-to-r ${source.color} rounded-lg flex-shrink-0`}>
                          <source.icon className="w-6 h-6 text-obsidian-900" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-gold-100 font-semibold mb-1 group-hover:text-gold-300 transition-colors">
                            {source.name}
                          </h4>
                          <p className="text-gold-400/70 text-sm">{source.description}</p>
                        </div>
                        {source.supported && (
                          <CheckCircle className="w-5 h-5 text-gold-400 flex-shrink-0" />
                        )}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === 'configure' && selectedSourceData && (
                <motion.div
                  key="configure"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-3 bg-gradient-to-r ${selectedSourceData.color} rounded-lg`}>
                      <selectedSourceData.icon className="w-6 h-6 text-obsidian-900" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gold-100">Configure Import</h3>
                      <p className="text-gold-400/70 text-sm">Importing from {selectedSourceData.name}</p>
                    </div>
                  </div>

                  <div className="bg-obsidian-800/60 border border-gold-500/20 rounded-xl p-6 space-y-4">
                    <h4 className="text-gold-100 font-semibold mb-4">Import Settings</h4>
                    
                    {[
                      { key: 'autoTag', label: 'Auto-tag with AI', description: 'Automatically detect and tag people, places, and objects', icon: Tag },
                      { key: 'detectFaces', label: 'Face Detection', description: 'Group photos by people using facial recognition', icon: Users },
                      { key: 'extractLocation', label: 'Extract Location', description: 'Read GPS data and tag locations automatically', icon: MapPin },
                      { key: 'detectDuplicates', label: 'Detect Duplicates', description: 'Skip duplicate photos to save storage space', icon: Zap },
                      { key: 'organizeByDate', label: 'Organize by Date', description: 'Automatically sort memories chronologically', icon: Calendar },
                      { key: 'aiEnhancement', label: 'AI Enhancement', description: 'Restore and enhance old or low-quality photos', icon: Sparkles }
                    ].map((setting) => (
                      <div key={setting.key} className="flex items-start justify-between p-3 bg-obsidian-900/50 rounded-lg">
                        <div className="flex items-start gap-3 flex-1">
                          <setting.icon className="w-5 h-5 text-gold-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="text-gold-100 font-medium">{setting.label}</div>
                            <div className="text-gold-400/70 text-sm">{setting.description}</div>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer ml-4">
                          <input
                            type="checkbox"
                            checked={importSettings[setting.key as keyof typeof importSettings]}
                            onChange={(e) => setImportSettings({
                              ...importSettings,
                              [setting.key]: e.target.checked
                            })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-obsidian-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-gold-600 peer-checked:to-gold-500"></div>
                        </label>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep('select')}
                      className="px-6 py-3 bg-obsidian-800 border border-gold-500/30 text-gold-400 rounded-lg hover:border-gold-400 transition-all duration-300 font-semibold"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleStartImport}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-gold-600 to-gold-500 text-obsidian-900 rounded-lg hover:from-gold-500 hover:to-gold-400 transition-all duration-300 font-semibold flex items-center justify-center gap-2"
                    >
                      <Upload className="w-5 h-5" />
                      Start Import
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 'import' && (
                <motion.div
                  key="import"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gold-100 mb-2">
                      {progress.status === 'scanning' && 'Scanning for memories...'}
                      {progress.status === 'processing' && 'Processing your memories...'}
                      {progress.status === 'complete' && 'Import Complete!'}
                    </h3>
                    <p className="text-gold-400/70">
                      {progress.status === 'scanning' && 'Connecting to your library and analyzing content'}
                      {progress.status === 'processing' && 'Importing, organizing, and enhancing your memories'}
                      {progress.status === 'complete' && 'Your memories have been successfully imported'}
                    </p>
                  </div>

                  <div className="bg-obsidian-800/60 border border-gold-500/20 rounded-xl p-6">
                    {progress.status !== 'complete' && (
                      <div className="flex items-center justify-center mb-6">
                        <Loader className="w-12 h-12 text-gold-400 animate-spin" />
                      </div>
                    )}

                    {progress.status === 'complete' && (
                      <div className="flex items-center justify-center mb-6">
                        <CheckCircle className="w-16 h-16 text-gold-400" />
                      </div>
                    )}

                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gold-400/70 text-sm">Progress</span>
                          <span className="text-gold-100 font-semibold">
                            {Math.min(progress.processed, progress.total)} / {progress.total}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-obsidian-900 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-gold-600 to-gold-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((progress.processed / progress.total) * 100, 100)}%` }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 pt-4">
                        <div className="text-center p-4 bg-obsidian-900/50 rounded-lg">
                          <div className="text-2xl font-bold text-gold-400 mb-1">{progress.imported}</div>
                          <div className="text-gold-400/70 text-sm">Imported</div>
                        </div>
                        <div className="text-center p-4 bg-obsidian-900/50 rounded-lg">
                          <div className="text-2xl font-bold text-gold-400/70 mb-1">{progress.duplicates}</div>
                          <div className="text-gold-400/70 text-sm">Duplicates</div>
                        </div>
                        <div className="text-center p-4 bg-obsidian-900/50 rounded-lg">
                          <div className="text-2xl font-bold text-gold-300 mb-1">{progress.total}</div>
                          <div className="text-gold-400/70 text-sm">Total Found</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {progress.status === 'complete' && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-r from-gold-600/20 to-gold-500/20 border border-gold-500/30 rounded-xl p-6"
                    >
                      <div className="flex items-start gap-3">
                        <TrendingUp className="w-6 h-6 text-gold-400 flex-shrink-0 mt-1" />
                        <div>
                          <h4 className="text-gold-300 font-semibold mb-2">Import Summary</h4>
                          <ul className="text-gold-200/80 text-sm space-y-1">
                            <li>✓ {progress.imported} memories successfully imported</li>
                            <li>✓ {progress.duplicates} duplicates detected and skipped</li>
                            {importSettings.autoTag && <li>✓ AI tagging applied to all memories</li>}
                            {importSettings.detectFaces && <li>✓ {Math.floor(progress.imported * 0.7)} faces detected and grouped</li>}
                            {importSettings.extractLocation && <li>✓ {Math.floor(progress.imported * 0.6)} locations extracted</li>}
                          </ul>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {progress.status === 'complete' && (
                    <button
                      onClick={handleComplete}
                      className="w-full px-6 py-3 bg-gradient-to-r from-gold-600 to-gold-500 text-obsidian-900 rounded-lg hover:from-gold-500 hover:to-gold-400 transition-all duration-300 font-semibold flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      View Imported Memories
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default ImportWizard
