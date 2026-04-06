import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Heart, Loader2, Gift, Check, Image, Mic, Pen } from '../components/Icons';
import { Navigation } from '../components/Navigation';
import { giftsApi, memoriesApi, lettersApi, voiceApi } from '../services/api';

type GiftStep = 'select-type' | 'select-content' | 'recipient' | 'confirm';

interface GiftConfig {
  memoryType: 'memory' | 'voice' | 'letter';
  memoryId: string;
  memoryTitle: string;
  recipientEmail: string;
  recipientName: string;
  personalMessage: string;
  unlockDate: string;
}

export function GiftAMemory() {
  const navigate = useNavigate();
  const [step, setStep] = useState<GiftStep>('select-type');
  const [config, setConfig] = useState<GiftConfig>({
    memoryType: 'memory',
    memoryId: '',
    memoryTitle: '',
    recipientEmail: '',
    recipientName: '',
    personalMessage: '',
    unlockDate: '',
  });

  const { data: memories } = useQuery({
    queryKey: ['gift-memories'],
    queryFn: () => memoriesApi.getAll({ limit: 50 }).then((r) => r.data),
    enabled: config.memoryType === 'memory',
  });

  const { data: letters } = useQuery({
    queryKey: ['gift-letters'],
    queryFn: () => lettersApi.getAll({ limit: 50 }).then((r) => r.data),
    enabled: config.memoryType === 'letter',
  });

  const { data: voices } = useQuery({
    queryKey: ['gift-voices'],
    queryFn: () => voiceApi.getAll({ limit: 50 }).then((r) => r.data),
    enabled: config.memoryType === 'voice',
  });

  const sendMutation = useMutation({
    mutationFn: () => giftsApi.send({
      memory_type: config.memoryType,
      memory_id: config.memoryId,
      recipient_email: config.recipientEmail,
      recipient_name: config.recipientName,
      personal_message: config.personalMessage,
      unlock_date: config.unlockDate || undefined,
    }),
    onSuccess: () => setStep('confirm' as GiftStep),
  });

  const typeOptions = [
    { id: 'memory' as const, label: 'A Photo Memory', icon: Image, desc: 'Share a cherished photo with someone special' },
    { id: 'voice' as const, label: 'A Voice Recording', icon: Mic, desc: 'Let them hear the sound of your voice' },
    { id: 'letter' as const, label: 'A Written Letter', icon: Pen, desc: 'Words from the heart, preserved forever' },
  ];

  const getContentList = () => {
    if (config.memoryType === 'memory') {
      const list = Array.isArray(memories) ? memories : memories?.data || memories?.memories || [];
      return list;
    }
    if (config.memoryType === 'letter') {
      const list = Array.isArray(letters) ? letters : letters?.data || letters?.letters || [];
      return list;
    }
    if (config.memoryType === 'voice') {
      const list = Array.isArray(voices) ? voices : voices?.data || voices?.recordings || [];
      return list;
    }
    return [];
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="eternal-bg">
        <div className="eternal-aura" />
        <div className="eternal-stars" />
        <div className="eternal-mist" />
      </div>
      <Navigation />

      <main className="relative z-10 px-6 md:px-12 pt-24 pb-32 max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-gold/20 to-blood/20 border border-gold/20 flex items-center justify-center">
            <Gift size={28} className="text-gold" />
          </div>
          <h1 className="font-serif text-3xl md:text-4xl text-paper mb-2">Gift a Memory</h1>
          <p className="text-paper/50 font-serif">Send a piece of your legacy to someone you love</p>
        </div>

        {sendMutation.isSuccess ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
              <Check size={36} className="text-green-400" />
            </div>
            <h2 className="font-serif text-2xl text-paper mb-2">Gift Sent!</h2>
            <p className="text-paper/50 mb-1">
              Your memory gift has been sent to <span className="text-gold">{config.recipientName}</span>
            </p>
            <p className="text-paper/40 text-sm mb-8">
              They&apos;ll receive an email with a link to unwrap their gift.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  setConfig({ memoryType: 'memory', memoryId: '', memoryTitle: '', recipientEmail: '', recipientName: '', personalMessage: '', unlockDate: '' });
                  setStep('select-type');
                  sendMutation.reset();
                }}
                className="px-5 py-2.5 rounded-xl border border-paper/20 text-paper/60 hover:text-paper transition-colors text-sm"
              >
                Send Another Gift
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="px-5 py-2.5 rounded-xl bg-gold/20 text-gold text-sm"
              >
                Back to Dashboard
              </button>
            </div>
          </motion.div>
        ) : (
          <>
            {step === 'select-type' && (
              <div className="space-y-3">
                <p className="text-paper/60 text-center mb-6">What would you like to gift?</p>
                {typeOptions.map(({ id, label, icon: Icon, desc }) => (
                  <motion.button
                    key={id}
                    onClick={() => {
                      setConfig((prev) => ({ ...prev, memoryType: id }));
                      setStep('select-content');
                    }}
                    className="w-full text-left p-5 rounded-xl glass border border-paper/10 hover:border-gold/30 transition-all flex items-center gap-4"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center flex-shrink-0">
                      <Icon size={24} className="text-gold" />
                    </div>
                    <div>
                      <p className="font-serif text-lg text-paper">{label}</p>
                      <p className="text-paper/40 text-sm">{desc}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}

            {step === 'select-content' && (
              <div className="space-y-3">
                <p className="text-paper/60 text-center mb-6">Choose the {config.memoryType} to gift</p>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {getContentList().map((item: { id: string; title?: string; subject?: string }) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setConfig((prev) => ({
                          ...prev,
                          memoryId: item.id,
                          memoryTitle: item.title || item.subject || 'Untitled',
                        }));
                        setStep('recipient');
                      }}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${
                        config.memoryId === item.id
                          ? 'border-gold/50 bg-gold/10'
                          : 'border-paper/10 bg-paper/5 hover:border-paper/20'
                      }`}
                    >
                      <p className="text-paper/80 text-sm">{item.title || item.subject || 'Untitled'}</p>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setStep('select-type')}
                  className="text-paper/40 hover:text-paper/60 text-sm transition-colors"
                >
                  &larr; Back
                </button>
              </div>
            )}

            {step === 'recipient' && (
              <div className="space-y-4 max-w-md mx-auto">
                <p className="text-paper/60 text-center mb-6">Who should receive this gift?</p>
                <div>
                  <label className="block text-sm text-paper/50 mb-1">Recipient&apos;s Name</label>
                  <input
                    type="text"
                    value={config.recipientName}
                    onChange={(e) => setConfig((prev) => ({ ...prev, recipientName: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-paper/5 border border-paper/10 text-paper focus:border-gold/30 focus:outline-none"
                    placeholder="Their name"
                  />
                </div>
                <div>
                  <label className="block text-sm text-paper/50 mb-1">Recipient&apos;s Email</label>
                  <input
                    type="email"
                    value={config.recipientEmail}
                    onChange={(e) => setConfig((prev) => ({ ...prev, recipientEmail: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-paper/5 border border-paper/10 text-paper focus:border-gold/30 focus:outline-none"
                    placeholder="their@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm text-paper/50 mb-1">Personal Message (optional)</label>
                  <textarea
                    value={config.personalMessage}
                    onChange={(e) => setConfig((prev) => ({ ...prev, personalMessage: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-paper/5 border border-paper/10 text-paper focus:border-gold/30 focus:outline-none resize-none h-24"
                    placeholder="Write a heartfelt message..."
                  />
                </div>
                <div>
                  <label className="block text-sm text-paper/50 mb-1">Unlock Date (optional)</label>
                  <input
                    type="date"
                    value={config.unlockDate}
                    onChange={(e) => setConfig((prev) => ({ ...prev, unlockDate: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-paper/5 border border-paper/10 text-paper focus:border-gold/30 focus:outline-none"
                  />
                  <p className="text-paper/30 text-xs mt-1">Leave empty to make it available immediately</p>
                </div>

                <div className="flex justify-between items-center pt-4">
                  <button
                    onClick={() => setStep('select-content')}
                    className="text-paper/40 hover:text-paper/60 text-sm transition-colors"
                  >
                    &larr; Back
                  </button>
                  <motion.button
                    onClick={() => sendMutation.mutate()}
                    disabled={!config.recipientEmail || !config.recipientName || sendMutation.isPending}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-gold to-gold-dim text-void font-medium text-sm disabled:opacity-50"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {sendMutation.isPending ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Heart size={16} />
                    )}
                    Send Gift
                  </motion.button>
                </div>

                {sendMutation.isError && (
                  <p className="text-blood text-sm text-center">
                    Failed to send gift. Please try again.
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default GiftAMemory;
