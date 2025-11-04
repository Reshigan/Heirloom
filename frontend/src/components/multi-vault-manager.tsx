'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Vault, Plus, X, Users, Key, Edit2, Trash2, Lock } from 'lucide-react'

interface VaultInfo {
  id: string
  name: string
  tokenId: string
  audienceType: 'immediate' | 'extended' | 'custom'
  memoryCount: number
  createdAt: Date
  customAudience?: string[]
}

interface MultiVaultManagerProps {
  vaults: VaultInfo[]
  onCreateVault: (vault: Omit<VaultInfo, 'id' | 'tokenId' | 'memoryCount' | 'createdAt'>) => void
  onDeleteVault: (id: string) => void
  onEditVault: (id: string, updates: Partial<VaultInfo>) => void
}

const audienceTypeConfig = {
  immediate: { label: 'Immediate Family', description: 'Spouse, children, parents', icon: '👨‍👩‍👧‍👦' },
  extended: { label: 'Extended Family', description: 'Cousins, aunts, uncles, etc.', icon: '👥' },
  custom: { label: 'Custom Audience', description: 'Specific people you choose', icon: '✨' }
}

export default function MultiVaultManager({
  vaults,
  onCreateVault,
  onDeleteVault,
  onEditVault
}: MultiVaultManagerProps) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    audienceType: 'immediate' as 'immediate' | 'extended' | 'custom'
  })

  const handleCreate = () => {
    if (!formData.name) return
    onCreateVault(formData)
    setFormData({ name: '', audienceType: 'immediate' })
    setShowCreateForm(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gold-400 flex items-center gap-2">
            <Vault className="w-5 h-5" />
            My Vaults
          </h3>
          <p className="text-xs text-pearl/60 mt-1">
            Create separate vaults for different audiences
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="glass-button-primary text-sm px-4 py-2"
        >
          <Plus className="w-4 h-4 inline mr-2" />
          New Vault
        </button>
      </div>

      {/* Vault Cards */}
      <div className="grid gap-4">
        {vaults.map((vault) => {
          const audienceConfig = audienceTypeConfig[vault.audienceType]

          return (
            <motion.div
              key={vault.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 hover:border-gold-500/40 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gold-500/20 to-gold-600/20 flex items-center justify-center text-2xl border border-gold-500/30">
                    {audienceConfig.icon}
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-pearl mb-1">{vault.name}</h4>
                    <p className="text-xs text-pearl/60">{audienceConfig.label}</p>
                    <p className="text-xs text-pearl/50 mt-1">{audienceConfig.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {/* Edit vault */}}
                    className="glass-icon-button p-2"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteVault(vault.id)}
                    className="glass-icon-button p-2 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 rounded-lg bg-obsidian-800/30 border border-gold-500/10">
                  <div className="text-2xl font-bold text-gold-400">{vault.memoryCount}</div>
                  <div className="text-xs text-pearl/60 mt-1">Memories</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-obsidian-800/30 border border-gold-500/10">
                  <div className="text-2xl font-bold text-gold-400">
                    <Lock className="w-6 h-6 mx-auto" />
                  </div>
                  <div className="text-xs text-pearl/60 mt-1">Sealed</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-obsidian-800/30 border border-gold-500/10">
                  <div className="text-xs font-mono text-gold-400 truncate">{vault.tokenId}</div>
                  <div className="text-xs text-pearl/60 mt-1">Token ID</div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-pearl/50">
                <Key className="w-3 h-3" />
                <span>Created {vault.createdAt.toLocaleDateString()}</span>
              </div>
            </motion.div>
          )
        })}
      </div>

      {vaults.length === 0 && (
        <div className="glass-card p-12 text-center">
          <Vault className="w-16 h-16 text-pearl/20 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-pearl mb-2">No Vaults Yet</h4>
          <p className="text-sm text-pearl/60 mb-6">
            Create your first vault to organize memories for different audiences
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="glass-button-primary"
          >
            Create Your First Vault
          </button>
        </div>
      )}

      {/* Create Vault Modal */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-modal max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-serif text-gold-400">Create New Vault</h3>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="glass-icon-button p-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-pearl/70 mb-2 block">Vault Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="glass-input w-full"
                    placeholder="e.g., My Children's Vault"
                  />
                </div>

                <div>
                  <label className="text-sm text-pearl/70 mb-2 block">Audience Type</label>
                  <div className="space-y-2">
                    {(Object.keys(audienceTypeConfig) as Array<keyof typeof audienceTypeConfig>).map((type) => {
                      const config = audienceTypeConfig[type]
                      const isSelected = formData.audienceType === type

                      return (
                        <button
                          key={type}
                          onClick={() => setFormData({ ...formData, audienceType: type })}
                          className={`w-full glass-card p-4 text-left transition-all ${
                            isSelected ? 'border-gold-500/60' : 'border-gold-500/20'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{config.icon}</span>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-pearl">{config.label}</h4>
                                {isSelected && <div className="w-2 h-2 rounded-full bg-gold-400" />}
                              </div>
                              <p className="text-xs text-pearl/60 mt-1">{config.description}</p>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <button
                  onClick={handleCreate}
                  disabled={!formData.name}
                  className="glass-button-primary w-full"
                >
                  Create Vault
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
