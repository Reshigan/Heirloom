'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Key, 
  Shield, 
  Clock, 
  Users, 
  Heart, 
  Lock, 
  Unlock, 
  Copy, 
  Check, 
  AlertTriangle,
  UserPlus,
  TreePine,
  QrCode,
  Download,
  Eye,
  EyeOff,
  X
} from 'lucide-react'

interface LegacyToken {
  id: string
  profileId: string
  profileName: string
  tokenCode: string
  createdDate: string
  expiryDate?: string
  isActive: boolean
  accessLevel: 'view' | 'edit' | 'admin'
  trustedContacts: string[]
  lastAccessed?: string
  usageCount: number
}

interface LegacyTokenSystemProps {
  isOpen: boolean
  onClose: () => void
  currentProfileId: string
}

export default function LegacyTokenSystem({ isOpen, onClose, currentProfileId }: LegacyTokenSystemProps) {
  const [activeTab, setActiveTab] = useState<'create' | 'manage' | 'access'>('create')
  const [tokens, setTokens] = useState<LegacyToken[]>([])
  const [showToken, setShowToken] = useState<string | null>(null)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const [accessToken, setAccessToken] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<'success' | 'error' | null>(null)

  // Mock data for demonstration
  useEffect(() => {
    setTokens([
      {
        id: '1',
        profileId: currentProfileId,
        profileName: 'John Smith',
        tokenCode: 'LEGACY-2024-JS-A7B9C2D4E6F8',
        createdDate: '2024-01-15',
        isActive: true,
        accessLevel: 'admin',
        trustedContacts: ['jane.smith@email.com', 'michael.smith@email.com'],
        usageCount: 0
      },
      {
        id: '2',
        profileId: currentProfileId,
        profileName: 'John Smith',
        tokenCode: 'LEGACY-2024-JS-X1Y2Z3W4V5U6',
        createdDate: '2024-02-01',
        isActive: true,
        accessLevel: 'view',
        trustedContacts: ['family.friend@email.com'],
        usageCount: 2,
        lastAccessed: '2024-03-15'
      }
    ])
  }, [currentProfileId])

  const generateNewToken = () => {
    const newToken: LegacyToken = {
      id: Date.now().toString(),
      profileId: currentProfileId,
      profileName: 'Current User',
      tokenCode: `LEGACY-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 16).toUpperCase()}`,
      createdDate: new Date().toISOString().split('T')[0],
      isActive: true,
      accessLevel: 'view',
      trustedContacts: [],
      usageCount: 0
    }
    setTokens([...tokens, newToken])
    setShowToken(newToken.id)
  }

  const copyToClipboard = async (token: string, tokenId: string) => {
    try {
      await navigator.clipboard.writeText(token)
      setCopiedToken(tokenId)
      setTimeout(() => setCopiedToken(null), 2000)
    } catch (err) {
      console.error('Failed to copy token:', err)
    }
  }

  const validateAccessToken = async () => {
    setIsValidating(true)
    setValidationResult(null)
    
    // Simulate API validation
    setTimeout(() => {
      const isValid = tokens.some(token => 
        token.tokenCode === accessToken && token.isActive
      )
      setValidationResult(isValid ? 'success' : 'error')
      setIsValidating(false)
    }, 1500)
  }

  const revokeToken = (tokenId: string) => {
    setTokens(tokens.map(token => 
      token.id === tokenId 
        ? { ...token, isActive: false }
        : token
    ))
  }

  if (!isOpen) return null

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-gradient-to-br from-charcoal via-obsidian to-charcoal rounded-2xl shadow-2xl border border-gold-500/30 max-w-4xl w-full max-h-[90vh] overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-gold-600/20 via-gold-500/20 to-gold-600/20 border-b border-gold-500/30 p-6 text-pearl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gold-500/20 border border-gold-500/30 rounded-full flex items-center justify-center">
                <Key className="w-6 h-6 text-gold-400" />
              </div>
              <div>
                <h2 className="text-2xl font-serif font-bold text-gold-400">Legacy Token System</h2>
                <p className="text-pearl/70">Secure posthumous access to family memories</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-gold-500/20 border border-gold-500/30 rounded-full flex items-center justify-center hover:bg-gold-500/30 transition-colors text-gold-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gold-500/20">
          <div className="flex">
            {[
              { id: 'create', label: 'Create Token', icon: <Key className="w-4 h-4" /> },
              { id: 'manage', label: 'Manage Tokens', icon: <Shield className="w-4 h-4" /> },
              { id: 'access', label: 'Access Profile', icon: <Unlock className="w-4 h-4" /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-gold-400 border-b-2 border-gold-400 bg-gold-500/10'
                    : 'text-pearl/60 hover:text-gold-400 hover:bg-obsidian-800/40'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'create' && (
              <motion.div
                key="create"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-gold-50 border border-gold-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-gold-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-gold-800">Important Legacy Information</h3>
                      <p className="text-gold-700 text-sm mt-1">
                        Legacy tokens provide secure access to your profile after passing away. 
                        Only trusted family members should receive these tokens to add your profile to the family tree.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gold-400">Token Configuration</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gold-300 mb-2">
                        Access Level
                      </label>
                      <select className="w-full p-3 bg-obsidian-900/60 border border-gold-500/20 rounded-lg text-gold-100 focus:ring-2 focus:ring-gold-400/20 focus:border-gold-400/60">
                        <option value="view">View Only - Can see memories</option>
                        <option value="edit">Edit Access - Can add memories</option>
                        <option value="admin">Full Admin - Complete control</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gold-300 mb-2">
                        Trusted Contacts (Email)
                      </label>
                      <textarea
                        className="w-full p-3 bg-obsidian-900/60 border border-gold-500/20 rounded-lg text-gold-100 placeholder-gold-400/40 focus:ring-2 focus:ring-gold-400/20 focus:border-gold-400/60"
                        rows={3}
                        placeholder="Enter email addresses of trusted family members..."
                      />
                    </div>

                    <motion.button
                      onClick={generateNewToken}
                      className="w-full bg-gradient-to-r from-gold-600 to-gold-500 text-obsidian-900 py-3 px-6 rounded-lg font-semibold hover:shadow-lg hover:shadow-gold-400/20 transition-all"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <Key className="w-5 h-5" />
                        <span>Generate Legacy Token</span>
                      </div>
                    </motion.button>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gold-400">How It Works</h3>
                    
                    <div className="space-y-3">
                      {[
                        { icon: <Key className="w-5 h-5 text-gold-400" />, text: "Generate a unique legacy token" },
                        { icon: <Users className="w-5 h-5 text-gold-400" />, text: "Share with trusted family members" },
                        { icon: <Heart className="w-5 h-5 text-gold-400" />, text: "Token activates after passing away" },
                        { icon: <TreePine className="w-5 h-5 text-gold-400" />, text: "Family can add you to the tree" }
                      ].map((step, index) => (
                        <motion.div
                          key={index}
                          className="flex items-center space-x-3 p-3 bg-obsidian-800/40 rounded-lg"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          {step.icon}
                          <span className="text-sm text-pearl/80">{step.text}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'manage' && (
              <motion.div
                key="manage"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gold-400">Your Legacy Tokens</h3>
                  <div className="text-sm text-pearl/70">
                    {tokens.filter(t => t.isActive).length} active tokens
                  </div>
                </div>

                <div className="space-y-4">
                  {tokens.map((token) => (
                    <motion.div
                      key={token.id}
                      className="border border-gold-500/20 bg-obsidian-800/40 rounded-lg p-4 hover:border-gold-500/40 transition-all"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${token.isActive ? 'bg-gold-400' : 'bg-red-500'}`} />
                          <div>
                            <div className="font-medium text-gold-300">
                              Token #{token.id}
                            </div>
                            <div className="text-sm text-pearl/70">
                              Created: {token.createdDate} • Access: {token.accessLevel}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setShowToken(showToken === token.id ? null : token.id)}
                            className="p-2 text-gold-400 hover:text-gold-300 transition-colors"
                          >
                            {showToken === token.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          
                          {token.isActive && (
                            <button
                              onClick={() => revokeToken(token.id)}
                              className="p-2 text-gold-400 hover:text-red-500 transition-colors"
                            >
                              <Lock className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <AnimatePresence>
                        {showToken === token.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 pt-4 border-t border-gold-500/20"
                          >
                            <div className="bg-obsidian-900/60 rounded-lg p-3 font-mono text-sm break-all text-gold-300">
                              {token.tokenCode}
                            </div>
                            
                            <div className="flex items-center justify-between mt-3">
                              <div className="text-sm text-pearl/70">
                                Used {token.usageCount} times
                                {token.lastAccessed && ` • Last: ${token.lastAccessed}`}
                              </div>
                              
                              <button
                                onClick={() => copyToClipboard(token.tokenCode, token.id)}
                                className="flex items-center space-x-1 text-gold-400 hover:text-gold-300 transition-colors"
                              >
                                {copiedToken === token.id ? (
                                  <Check className="w-4 h-4" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                                <span className="text-sm">
                                  {copiedToken === token.id ? 'Copied!' : 'Copy'}
                                </span>
                              </button>
                            </div>

                            {token.trustedContacts.length > 0 && (
                              <div className="mt-3">
                                <div className="text-sm font-medium text-gold-300 mb-1">Trusted Contacts:</div>
                                <div className="text-sm text-pearl/70">
                                  {token.trustedContacts.join(', ')}
                                </div>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'access' && (
              <motion.div
                key="access"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-gold-500/20 border border-gold-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserPlus className="w-8 h-8 text-gold-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gold-400 mb-2">
                    Add Deceased Family Member
                  </h3>
                  <p className="text-pearl/70">
                    Enter a legacy token to add a deceased family member's profile to your family tree
                  </p>
                </div>

                <div className="max-w-md mx-auto space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gold-300 mb-2">
                      Legacy Token
                    </label>
                    <input
                      type="text"
                      value={accessToken}
                      onChange={(e) => setAccessToken(e.target.value)}
                      placeholder="LEGACY-2024-XX-XXXXXXXXXXXXXXXX"
                      className="w-full p-3 bg-obsidian-900/60 border border-gold-500/20 rounded-lg text-gold-100 placeholder-gold-400/40 focus:ring-2 focus:ring-gold-400/20 focus:border-gold-400/60 font-mono text-sm"
                    />
                  </div>

                  <motion.button
                    onClick={validateAccessToken}
                    disabled={!accessToken || isValidating}
                    className="w-full bg-gradient-to-r from-gold-600 to-gold-500 text-obsidian-900 py-3 px-6 rounded-lg font-semibold hover:shadow-lg hover:shadow-gold-400/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isValidating ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Validating Token...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <TreePine className="w-5 h-5" />
                        <span>Add to Family Tree</span>
                      </div>
                    )}
                  </motion.button>

                  <AnimatePresence>
                    {validationResult && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`p-4 rounded-lg ${
                          validationResult === 'success'
                            ? 'bg-green-50 border border-green-200 text-green-800'
                            : 'bg-red-50 border border-red-200 text-red-800'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          {validationResult === 'success' ? (
                            <Check className="w-5 h-5" />
                          ) : (
                            <AlertTriangle className="w-5 h-5" />
                          )}
                          <span className="font-medium">
                            {validationResult === 'success'
                              ? 'Token validated! Profile will be added to your family tree.'
                              : 'Invalid or expired token. Please check and try again.'
                            }
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                  <div className="flex items-start space-x-3">
                    <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-800">Security & Privacy</h4>
                      <p className="text-blue-700 text-sm mt-1">
                        Legacy tokens are encrypted and can only be used once. They provide secure access 
                        to deceased family members' profiles while maintaining privacy and security.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  )
}
