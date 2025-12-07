'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';

interface Letter {
  id: string;
  title: string;
  content: string;
  recipientName?: string;
  triggerType?: string;
  status: 'draft' | 'sealed' | 'delivered';
  createdAt: string;
}

export default function LettersPage() {
  const [letters, setLetters] = useState<Letter[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'draft' | 'sealed' | 'delivered'>('all');
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [newLetter, setNewLetter] = useState({
    title: '',
    content: '',
    recipientId: '',
    triggerType: 'manual',
  });

  useEffect(() => {
    fetchLetters();
  }, []);

  const fetchLetters = async () => {
    try {
      const data = await apiClient.getAfterImGoneLetters();
      setLetters(data);
    } catch (error) {
      console.error('Failed to fetch letters:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLetters = letters.filter((letter) => {
    if (activeTab === 'all') return true;
    return letter.status === activeTab;
  });

  const getTabCount = (status: 'draft' | 'sealed' | 'delivered') => {
    return letters.filter((l) => l.status === status).length;
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
          <h1 className="font-display text-3xl text-cream-100">Letters</h1>
          <button onClick={() => setShowEditor(true)} className="btn btn-primary">
            Write Letter
          </button>
        </div>

        {/* Info Banner */}
        <div className="flex items-start gap-4 p-5 bg-gold-500/[0.08] border border-gold-600 rounded-lg mb-8">
          <div className="text-2xl flex-shrink-0">💌</div>
          <div>
            <h4 className="text-base font-semibold text-gold-500 mb-1">After I'm Gone Letters</h4>
            <p className="text-sm text-cream-300 leading-relaxed">
              Write heartfelt messages to be delivered to your loved ones when specific life events occur. Your words will
              live on and provide comfort when they need it most.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-black-500">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-5 py-3 text-base font-medium border-b-2 -mb-px transition-all ${
              activeTab === 'all'
                ? 'text-gold-500 border-gold-500'
                : 'text-black-100 border-transparent hover:text-cream-300'
            }`}
          >
            All Letters
            <span
              className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold rounded-full ml-2 ${
                activeTab === 'all' ? 'bg-gold-500 text-black-900' : 'bg-black-600'
              }`}
            >
              {letters.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('draft')}
            className={`px-5 py-3 text-base font-medium border-b-2 -mb-px transition-all ${
              activeTab === 'draft'
                ? 'text-gold-500 border-gold-500'
                : 'text-black-100 border-transparent hover:text-cream-300'
            }`}
          >
            Drafts
            <span
              className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold rounded-full ml-2 ${
                activeTab === 'draft' ? 'bg-gold-500 text-black-900' : 'bg-black-600'
              }`}
            >
              {getTabCount('draft')}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('sealed')}
            className={`px-5 py-3 text-base font-medium border-b-2 -mb-px transition-all ${
              activeTab === 'sealed'
                ? 'text-gold-500 border-gold-500'
                : 'text-black-100 border-transparent hover:text-cream-300'
            }`}
          >
            Sealed
            <span
              className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold rounded-full ml-2 ${
                activeTab === 'sealed' ? 'bg-gold-500 text-black-900' : 'bg-black-600'
              }`}
            >
              {getTabCount('sealed')}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('delivered')}
            className={`px-5 py-3 text-base font-medium border-b-2 -mb-px transition-all ${
              activeTab === 'delivered'
                ? 'text-gold-500 border-gold-500'
                : 'text-black-100 border-transparent hover:text-cream-300'
            }`}
          >
            Delivered
            <span
              className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold rounded-full ml-2 ${
                activeTab === 'delivered' ? 'bg-gold-500 text-black-900' : 'bg-black-600'
              }`}
            >
              {getTabCount('delivered')}
            </span>
          </button>
        </div>

        {/* Letters Grid */}
        {filteredLetters.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* New Letter Card */}
            <div
              onClick={() => setShowEditor(true)}
              className="flex flex-col items-center justify-center min-h-[280px] bg-gold-500/[0.05] border-2 border-dashed border-gold-600 rounded-lg cursor-pointer transition-all hover:bg-gold-500/10 hover:border-gold-500"
            >
              <div className="w-16 h-16 flex items-center justify-center bg-gold-500/10 border border-gold-600 rounded-full text-4xl mb-4">
                ✍️
              </div>
              <div className="text-lg font-semibold text-cream-100 mb-1">Write New Letter</div>
              <div className="text-sm text-black-100">Create a message for the future</div>
            </div>

            {filteredLetters.map((letter) => (
              <div
                key={letter.id}
                className={`bg-black-700 border border-black-500 rounded-lg overflow-hidden transition-all hover:border-gold-500 hover:-translate-y-0.5 cursor-pointer relative ${
                  letter.status === 'sealed' ? 'after:content-["🔒"] after:absolute after:top-3 after:right-3 after:text-xl' : ''
                }`}
              >
                {/* Envelope Header */}
                <div
                  className={`h-20 flex items-center justify-center relative overflow-hidden ${
                    letter.status === 'draft'
                      ? 'bg-gradient-to-br from-black-500 to-black-600'
                      : 'bg-gradient-to-br from-gold-600 to-gold-700'
                  }`}
                >
                  <div
                    className={`absolute top-0 left-1/2 -translate-x-1/2 border-l-[160px] border-r-[160px] border-t-[40px] border-l-transparent border-r-transparent ${
                      letter.status === 'draft' ? 'border-t-black-700' : 'border-t-gold-800'
                    }`}
                  />
                  <div className="text-4xl z-10">💌</div>
                </div>

                {/* Letter Content */}
                <div className="p-5">
                  <div
                    className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold uppercase tracking-wide rounded-sm mb-3 ${
                      letter.status === 'sealed'
                        ? 'bg-gold-500/15 text-gold-500'
                        : letter.status === 'draft'
                        ? 'bg-black-100/15 text-black-100'
                        : 'bg-success-500/15 text-success-400'
                    }`}
                  >
                    {letter.status}
                  </div>
                  <div className="font-display text-lg text-cream-100 mb-2">{letter.title}</div>
                  <div className="flex items-center gap-2 text-sm text-cream-300 mb-3">
                    <span>To:</span>
                    <span>{letter.recipientName || 'Not specified'}</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 text-sm text-black-100 bg-black-600 rounded-md">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span>{letter.triggerType || 'Manual delivery'}</span>
                  </div>
                  <div className="flex justify-between items-center mt-4 pt-3 border-t border-black-500 text-sm text-black-200">
                    <span>{new Date(letter.createdAt).toLocaleDateString()}</span>
                    <span>•••</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">💌</div>
            <h3 className="font-display text-2xl text-cream-100 mb-2">No letters yet</h3>
            <p className="text-black-100 mb-6">Write your first letter to be delivered in the future</p>
            <button onClick={() => setShowEditor(true)} className="btn btn-primary">
              Write Your First Letter
            </button>
          </div>
        )}
      </div>

      {/* Letter Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 p-8 overflow-y-auto flex items-start justify-center">
          <div className="bg-black-800 border border-black-500 rounded-xl max-w-[800px] w-full animate-slideIn">
            {/* Header */}
            <div className="flex justify-between items-center p-5 sm:p-6 border-b border-black-500">
              <h2 className="font-display text-xl text-cream-100">Write a Letter</h2>
              <button
                onClick={() => setShowEditor(false)}
                className="p-2 text-black-100 hover:text-cream-300 hover:bg-black-600 rounded-md transition-all"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              <div className="mb-4">
                <label className="form-label">Letter Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Give your letter a meaningful title"
                  value={newLetter.title}
                  onChange={(e) => setNewLetter({ ...newLetter, title: e.target.value })}
                />
              </div>

              <div className="mb-4">
                <label className="form-label">Recipient</label>
                <select
                  className="form-input"
                  value={newLetter.recipientId}
                  onChange={(e) => setNewLetter({ ...newLetter, recipientId: e.target.value })}
                >
                  <option value="">Select a recipient</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="form-label">Delivery Trigger</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                  {[
                    { value: 'manual', emoji: '✋', name: 'Manual' },
                    { value: 'birthday', emoji: '🎂', name: 'Birthday' },
                    { value: 'anniversary', emoji: '💍', name: 'Anniversary' },
                    { value: 'graduation', emoji: '🎓', name: 'Graduation' },
                    { value: 'wedding', emoji: '💒', name: 'Wedding' },
                    { value: 'custom', emoji: '📅', name: 'Custom Date' },
                  ].map((trigger) => (
                    <label
                      key={trigger.value}
                      className={`flex flex-col items-center text-center p-4 bg-black-700 border rounded-md cursor-pointer transition-all ${
                        newLetter.triggerType === trigger.value
                          ? 'border-gold-500 bg-gold-500/10'
                          : 'border-black-500 hover:border-black-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="trigger"
                        value={trigger.value}
                        checked={newLetter.triggerType === trigger.value}
                        onChange={(e) => setNewLetter({ ...newLetter, triggerType: e.target.value })}
                        className="sr-only"
                      />
                      <div className="text-2xl mb-2">{trigger.emoji}</div>
                      <div className="text-sm font-medium text-cream-300">{trigger.name}</div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label">Your Message</label>
                <textarea
                  className="min-h-[300px] p-6 bg-black-700 border border-black-500 rounded-lg font-display text-lg leading-relaxed text-cream-300 resize-none w-full focus:outline-none focus:border-gold-500"
                  placeholder="Dear [Name],&#10;&#10;I wanted to share something important with you..."
                  value={newLetter.content}
                  onChange={(e) => setNewLetter({ ...newLetter, content: e.target.value })}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center p-4 sm:p-6 border-t border-black-500 bg-black-850">
              <button onClick={() => setShowEditor(false)} className="btn btn-secondary">
                Save as Draft
              </button>
              <button className="btn btn-primary">Seal & Schedule</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
