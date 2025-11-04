'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, UserPlus, X, Mail, CheckCircle, AlertCircle } from 'lucide-react'

interface Executor {
  id: string
  name: string
  email: string
  relationship: string
  status: 'pending' | 'accepted' | 'declined'
  invitedAt: Date
}

interface ExecutorGuardianManagerProps {
  executors: Executor[]
  guardians: Executor[]
  onAddExecutor: (executor: Omit<Executor, 'id' | 'status' | 'invitedAt'>) => void
  onAddGuardian: (guardian: Omit<Executor, 'id' | 'status' | 'invitedAt'>) => void
  onRemove: (id: string, type: 'executor' | 'guardian') => void
}

export default function ExecutorGuardianManager({
  executors,
  guardians,
  onAddExecutor,
  onAddGuardian,
  onRemove
}: ExecutorGuardianManagerProps) {
  const [showAddForm, setShowAddForm] = useState<'executor' | 'guardian' | null>(null)
  const [formData, setFormData] = useState({ name: '', email: '', relationship: '' })

  const handleSubmit = (type: 'executor' | 'guardian') => {
    if (!formData.name || !formData.email) return

    if (type === 'executor') {
      onAddExecutor(formData)
    } else {
      onAddGuardian(formData)
    }

    setFormData({ name: '', email: '', relationship: '' })
    setShowAddForm(null)
  }

  const renderPersonList = (people: Executor[], type: 'executor' | 'guardian') => (
    <div className="space-y-3">
      {people.map((person) => (
        <motion.div
          key={person.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, x: -100 }}
          className="glass-card p-4"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-pearl">{person.name}</h4>
                {person.status === 'accepted' && (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                )}
                {person.status === 'pending' && (
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                )}
              </div>
              <p className="text-xs text-pearl/60">{person.email}</p>
              {person.relationship && (
                <p className="text-xs text-pearl/50 mt-1">{person.relationship}</p>
              )}
              <p className="text-xs text-gold-400/60 mt-2">
                {person.status === 'accepted' ? 'Accepted' : 'Invitation pending'}
              </p>
            </div>
            <button
              onClick={() => onRemove(person.id, type)}
              className="text-pearl/40 hover:text-red-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Executors Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gold-400 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Executors
            </h3>
            <p className="text-xs text-pearl/60 mt-1">
              Trusted people who can manage your vault after death
            </p>
          </div>
          <button
            onClick={() => setShowAddForm('executor')}
            className="glass-button-primary text-sm px-4 py-2"
          >
            <UserPlus className="w-4 h-4 inline mr-2" />
            Add Executor
          </button>
        </div>

        {executors.length > 0 ? (
          renderPersonList(executors, 'executor')
        ) : (
          <div className="glass-card p-6 text-center">
            <Shield className="w-12 h-12 text-pearl/20 mx-auto mb-3" />
            <p className="text-pearl/60 text-sm">No executors added yet</p>
          </div>
        )}
      </div>

      {/* Guardians Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gold-400 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Guardians
            </h3>
            <p className="text-xs text-pearl/60 mt-1">
              People who can approve or deny redemption requests
            </p>
          </div>
          <button
            onClick={() => setShowAddForm('guardian')}
            className="glass-button-primary text-sm px-4 py-2"
          >
            <UserPlus className="w-4 h-4 inline mr-2" />
            Add Guardian
          </button>
        </div>

        {guardians.length > 0 ? (
          renderPersonList(guardians, 'guardian')
        ) : (
          <div className="glass-card p-6 text-center">
            <Shield className="w-12 h-12 text-pearl/20 mx-auto mb-3" />
            <p className="text-pearl/60 text-sm">No guardians added yet</p>
          </div>
        )}
      </div>

      {/* Add Form Modal */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddForm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-modal max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-serif text-gold-400">
                  Add {showAddForm === 'executor' ? 'Executor' : 'Guardian'}
                </h3>
                <button
                  onClick={() => setShowAddForm(null)}
                  className="glass-icon-button p-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-pearl/70 mb-2 block">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="glass-input w-full"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="text-sm text-pearl/70 mb-2 block">Email</label>
                  <div className="glass-input-container">
                    <Mail className="w-5 h-5 text-gold-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="glass-input"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-pearl/70 mb-2 block">Relationship (Optional)</label>
                  <input
                    type="text"
                    value={formData.relationship}
                    onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                    className="glass-input w-full"
                    placeholder="Brother, Lawyer, etc."
                  />
                </div>

                <button
                  onClick={() => handleSubmit(showAddForm)}
                  disabled={!formData.name || !formData.email}
                  className="glass-button-primary w-full"
                >
                  Send Invitation
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
