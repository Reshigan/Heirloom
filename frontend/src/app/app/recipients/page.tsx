'use client';

import { useState, useEffect } from 'react';
import { apiClient, Recipient } from '@/lib/api-client';

export default function RecipientsPage() {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newRecipient, setNewRecipient] = useState({
    email: '',
    name: '',
    relationship: 'family',
    accessLevel: 'POSTHUMOUS'
  });

  useEffect(() => {
    loadRecipients();
  }, []);

  const loadRecipients = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getRecipients();
      setRecipients(data.recipients);
    } catch (error) {
      console.error('Failed to load recipients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecipient = async () => {
    if (!newRecipient.email.trim()) {
      setError('Email is required');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await apiClient.addRecipient(newRecipient);
      setNewRecipient({ email: '', name: '', relationship: 'family', accessLevel: 'POSTHUMOUS' });
      setShowAddModal(false);
      await loadRecipients();
    } catch (error: any) {
      console.error('Failed to add recipient:', error);
      setError(error.message || 'Failed to add recipient');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRecipient = async (id: string) => {
    if (!confirm('Are you sure you want to delete this recipient?')) {
      return;
    }

    try {
      await apiClient.deleteRecipient(id);
      await loadRecipients();
    } catch (error: any) {
      console.error('Failed to delete recipient:', error);
      alert(error.message || 'Failed to delete recipient');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading-ring"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="font-display text-3xl text-cream-100">Recipients</h1>
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
            Add Recipient
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-black-700 border border-black-500 rounded-lg p-5 text-center">
            <div className="font-display text-3xl text-gold-500 mb-1">{recipients.length}</div>
            <div className="text-sm text-black-100">Total Recipients</div>
          </div>
          <div className="bg-black-700 border border-black-500 rounded-lg p-5 text-center">
            <div className="font-display text-3xl text-gold-500 mb-1">
              {recipients.filter((r) => r.accessLevel === 'VERIFIED').length}
            </div>
            <div className="text-sm text-black-100">Verified</div>
          </div>
          <div className="bg-black-700 border border-black-500 rounded-lg p-5 text-center">
            <div className="font-display text-3xl text-gold-500 mb-1">0</div>
            <div className="text-sm text-black-100">Letters Scheduled</div>
          </div>
          <div className="bg-black-700 border border-black-500 rounded-lg p-5 text-center">
            <div className="font-display text-3xl text-gold-500 mb-1">0</div>
            <div className="text-sm text-black-100">Memories Shared</div>
          </div>
        </div>

        {/* Recipients Grid */}
        {recipients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Add Recipient Card */}
            <div
              onClick={() => setShowAddModal(true)}
              className="flex flex-col items-center justify-center min-h-[280px] bg-gold-500/[0.05] border-2 border-dashed border-gold-600 rounded-lg cursor-pointer transition-all hover:bg-gold-500/10 hover:border-gold-500"
            >
              <div className="w-16 h-16 flex items-center justify-center bg-gold-500/10 border border-gold-600 rounded-full mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--gold-500)" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <line x1="20" y1="8" x2="20" y2="14" />
                  <line x1="23" y1="11" x2="17" y2="11" />
                </svg>
              </div>
              <div className="text-lg font-semibold text-cream-100 mb-1">Add Recipient</div>
              <div className="text-sm text-black-100">Invite someone to your legacy</div>
            </div>

            {recipients.map((recipient) => (
              <div
                key={recipient.id}
                className="bg-black-700 border border-black-500 rounded-lg p-5 transition-all hover:border-gold-600"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 flex items-center justify-center bg-gradient-to-br from-gold-600 to-gold-700 text-black-900 font-display text-xl font-semibold rounded-full flex-shrink-0">
                    {recipient.name ? recipient.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-lg font-semibold text-cream-100 mb-1">{recipient.name || 'Unnamed'}</div>
                    <div className="text-sm text-black-100">{recipient.relationship || 'No relationship'}</div>
                  </div>
                  <div
                    className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                      recipient.accessLevel === 'VERIFIED'
                        ? 'bg-success-500/15 text-success-400'
                        : 'bg-warning-500/15 text-warning-400'
                    }`}
                  >
                    {recipient.accessLevel === 'VERIFIED' ? 'Verified' : 'Pending'}
                  </div>
                </div>

                <div className="p-3 bg-black-600 rounded-md mb-4">
                  <div className="flex items-center gap-2 text-sm text-cream-300 py-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <path d="M22 6l-10 7L2 6" />
                    </svg>
                    <span className="truncate">{recipient.email}</span>
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-black-500">
                  <div className="flex-1 text-center">
                    <div className="text-xl font-semibold text-cream-100">0</div>
                    <div className="text-xs text-black-100 mt-1">Letters</div>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="text-xl font-semibold text-cream-100">0</div>
                    <div className="text-xs text-black-100 mt-1">Memories</div>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="text-xl font-semibold text-cream-100">0</div>
                    <div className="text-xs text-black-100 mt-1">Recordings</div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <button className="flex-1 btn btn-secondary btn-sm">Edit</button>
                  <button
                    onClick={() => handleDeleteRecipient(recipient.id)}
                    className="flex-1 btn btn-secondary btn-sm text-error-500 hover:bg-error-500/10"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="font-display text-2xl text-cream-100 mb-2">No recipients yet</h3>
            <p className="text-black-100 mb-6">Add people who will receive your legacy</p>
            <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
              Add Your First Recipient
            </button>
          </div>
        )}
      </div>

      {/* Add Recipient Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 p-8 overflow-y-auto flex items-start justify-center">
          <div className="bg-black-800 border border-black-500 rounded-xl max-w-[500px] w-full animate-slideIn">
            <div className="flex justify-between items-center p-5 sm:p-6 border-b border-black-500">
              <h2 className="font-display text-xl text-cream-100">Add New Recipient</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setError(null);
                }}
                className="p-2 text-black-100 hover:text-cream-300 hover:bg-black-600 rounded-md transition-all"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-error-500/20 border border-error-500/50 rounded text-cream-100 text-sm">
                  {error}
                </div>
              )}

              <div className="mb-4">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="John Doe"
                  value={newRecipient.name}
                  onChange={(e) => setNewRecipient({ ...newRecipient, name: e.target.value })}
                />
              </div>

              <div className="mb-4">
                <label className="form-label">Relationship</label>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {[
                    { value: 'family', emoji: '👨‍👩‍👧‍👦', name: 'Family' },
                    { value: 'spouse', emoji: '💑', name: 'Spouse' },
                    { value: 'child', emoji: '👶', name: 'Child' },
                    { value: 'parent', emoji: '👴', name: 'Parent' },
                    { value: 'friend', emoji: '🤝', name: 'Friend' },
                    { value: 'other', emoji: '👤', name: 'Other' },
                  ].map((rel) => (
                    <label
                      key={rel.value}
                      className={`flex flex-col items-center text-center p-3 bg-black-700 border rounded-md cursor-pointer transition-all ${
                        newRecipient.relationship === rel.value
                          ? 'border-gold-500 bg-gold-500/10'
                          : 'border-black-500 hover:border-black-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="relationship"
                        value={rel.value}
                        checked={newRecipient.relationship === rel.value}
                        onChange={(e) => setNewRecipient({ ...newRecipient, relationship: e.target.value })}
                        className="sr-only"
                      />
                      <div className="text-2xl mb-1">{rel.emoji}</div>
                      <div className="text-sm font-medium text-cream-300">{rel.name}</div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="recipient@example.com"
                  value={newRecipient.email}
                  onChange={(e) => setNewRecipient({ ...newRecipient, email: e.target.value })}
                />
              </div>

              <div className="mb-4">
                <label className="form-label">Phone Number (Optional)</label>
                <input type="tel" className="form-input" placeholder="+1 (555) 000-0000" />
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 sm:p-6 border-t border-black-500 bg-black-850">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setError(null);
                }}
                className="btn btn-secondary"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleAddRecipient}
                className="btn btn-primary"
                disabled={!newRecipient.email || submitting}
              >
                {submitting ? 'Adding...' : 'Add Recipient'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
