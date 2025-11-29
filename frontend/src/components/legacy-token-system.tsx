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
  EyeOff
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
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-modern-blue to-modern-purple p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Key className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Legacy Token System</h2>
                <p className="text-white/80">Secure posthumous access to family memories</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
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
                    ? 'text-modern-blue border-b-2 border-modern-blue bg-modern-blue/5'
                    : 'text-gray-600 hover:text-modern-blue hover:bg-gray-50'
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
                    <h3 className="text-lg font-semibold text-gray-900">Token Configuration</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Access Level
                      </label>
                      <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-modern-blue focus:border-transparent">
                        <option value="view">View Only - Can see memories</option>
                        <option value="edit">Edit Access - Can add memories</option>
                        <option value="admin">Full Admin - Complete control</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Trusted Contacts (Email)
                      </label>
                      <textarea
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-modern-blue focus:border-transparent"
                        rows={3}
                        placeholder="Enter email addresses of trusted family members..."
                      />
                    </div>

                    <motion.button
                      onClick={generateNewToken}
                      className="w-full bg-gradient-to-r from-modern-blue to-modern-purple text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg transition-all"
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
                    <h3 className="text-lg font-semibold text-gray-900">How It Works</h3>
                    
                    <div className="space-y-3">
                      {[
                        { icon: <Key className="w-5 h-5 text-modern-blue" />, text: "Generate a unique legacy token" },
                        { icon: <Users className="w-5 h-5 text-modern-emerald" />, text: "Share with trusted family members" },
                        { icon: <Heart className="w-5 h-5 text-modern-pink" />, text: "Token activates after passing away" },
                        { icon: <TreePine className="w-5 h-5 text-modern-amber" />, text: "Family can add you to the tree" }
                      ].map((step, index) => (
                        <motion.div
                          key={index}
                          className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          {step.icon}
                          <span className="text-sm text-gray-700">{step.text}</span>
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
                  <h3 className="text-lg font-semibold text-gray-900">Your Legacy Tokens</h3>
                  <div className="text-sm text-gray-600">
                    {tokens.filter(t => t.isActive).length} active tokens
                  </div>
                </div>

                <div className="space-y-4">
                  {tokens.map((token) => (
                    <motion.div
                      key={token.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${token.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                          <div>
                            <div className="font-medium text-gray-900">
                              Token #{token.id}
                            </div>
                            <div className="text-sm text-gray-600">
                              Created: {token.createdDate} • Access: {token.accessLevel}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setShowToken(showToken === token.id ? null : token.id)}
                            className="p-2 text-gray-600 hover:text-modern-blue transition-colors"
                          >
                            {showToken === token.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          
                          {token.isActive && (
                            <button
                              onClick={() => revokeToken(token.id)}
                              className="p-2 text-gray-600 hover:text-red-600 transition-colors"
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
                            className="mt-4 pt-4 border-t border-gray-200"
                          >
                            <div className="bg-gray-50 rounded-lg p-3 font-mono text-sm break-all">
                              {token.tokenCode}
                            </div>
                            
                            <div className="flex items-center justify-between mt-3">
                              <div className="text-sm text-gray-600">
                                Used {token.usageCount} times
                                {token.lastAccessed && ` • Last: ${token.lastAccessed}`}
                              </div>
                              
                              <button
                                onClick={() => copyToClipboard(token.tokenCode, token.id)}
                                className="flex items-center space-x-1 text-modern-blue hover:text-modern-purple transition-colors"
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
                                <div className="text-sm font-medium text-gray-700 mb-1">Trusted Contacts:</div>
                                <div className="text-sm text-gray-600">
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
                  <div className="w-16 h-16 bg-modern-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserPlus className="w-8 h-8 text-modern-blue" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Add Deceased Family Member
                  </h3>
                  <p className="text-gray-600">
                    Enter a legacy token to add a deceased family member's profile to your family tree
                  </p>
                </div>

                <div className="max-w-md mx-auto space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Legacy Token
                    </label>
                    <input
                      type="text"
                      value={accessToken}
                      onChange={(e) => setAccessToken(e.target.value)}
                      placeholder="LEGACY-2024-XX-XXXXXXXXXXXXXXXX"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-modern-blue focus:border-transparent font-mono text-sm"
                    />
                  </div>

                  <motion.button
                    onClick={validateAccessToken}
                    disabled={!accessToken || isValidating}
                    className="w-full bg-gradient-to-r from-modern-blue to-modern-purple text-white py-3 px-6 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
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