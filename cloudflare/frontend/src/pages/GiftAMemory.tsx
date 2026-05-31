import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
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
    { id: 'memory' as const, label: 'A Photo Memory', desc: 'Share a cherished photo with someone special' },
    { id: 'voice' as const, label: 'A Voice Recording', desc: 'Let them hear the sound of your voice' },
    { id: 'letter' as const, label: 'A Written Letter', desc: 'Words from the heart, preserved forever' },
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
    <div className="min-h-screen bg-void text-paper antialiased">
      <Navigation />

      <main className="px-6 md:px-12 pt-24 pb-32 max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <span className="font-body text-4xl text-gold block mb-4" aria-hidden>∞</span>
          <p className="font-mono text-[0.7rem] tracking-[0.32em] uppercase text-gold mb-4">Gift a memory</p>
          <h1
            className="font-body font-light text-paper mb-2 tracking-[-0.018em]"
            style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}
          >
            Gift a memory.
          </h1>
          <p className="text-paper-65 font-body">Send something from your thread — or invite them to start their own</p>
        </div>

        {sendMutation.isSuccess ? (
          <div className="text-center py-12">
            <span className="font-body text-4xl text-gold block mb-6" aria-hidden>∞</span>
            <h2 className="font-body text-2xl text-paper mb-2">Gift sent.</h2>
            <p className="text-paper-65 mb-1">
              Your memory gift has been sent to <span className="text-gold">{config.recipientName}</span>
            </p>
            <p className="text-paper-50 text-sm mb-8">
              They&apos;ll receive an email with a link to unwrap their gift.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  setConfig({ memoryType: 'memory', memoryId: '', memoryTitle: '', recipientEmail: '', recipientName: '', personalMessage: '', unlockDate: '' });
                  setStep('select-type');
                  sendMutation.reset();
                }}
                className="btn btn-ghost"
              >
                Send another gift
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="btn btn-primary"
              >
                Back to dashboard <span aria-hidden>→</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {step === 'select-type' && (
              <div className="space-y-3">
                <p className="text-paper-50 text-center mb-6">What would you like to gift?</p>
                {typeOptions.map(({ id, label, desc }) => (
                  <button
                    key={id}
                    onClick={() => {
                      setConfig((prev) => ({ ...prev, memoryType: id }));
                      setStep('select-content');
                    }}
                    className="w-full text-left p-5 bg-void-surface border border-paper-15 hover:border-gold-40 transition-colors"
                  >
                    <p className="font-body text-lg text-paper">{label}</p>
                    <p className="text-paper-50 text-sm">{desc}</p>
                  </button>
                ))}
              </div>
            )}

            {step === 'select-content' && (
              <div className="space-y-3">
                <p className="text-paper-50 text-center mb-6">Choose the {config.memoryType} to gift</p>
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
                      className={`w-full text-left p-4 border transition-colors ${
                        config.memoryId === item.id
                          ? 'border-gold-40 bg-gold/5'
                          : 'border-paper-15 bg-void-surface hover:border-paper-30'
                      }`}
                    >
                      <p className="text-paper-70 text-sm">{item.title || item.subject || 'Untitled'}</p>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setStep('select-type')}
                  className="text-paper-50 hover:text-paper text-sm transition-colors"
                >
                  <span aria-hidden>←</span> Back
                </button>
              </div>
            )}

            {step === 'recipient' && (
              <div className="space-y-4 max-w-md mx-auto">
                <p className="text-paper-50 text-center mb-6">Who should receive this gift?</p>
                <div>
                  <label className="block text-xs uppercase tracking-[0.22em] text-paper-50 mb-2.5">Recipient&apos;s name</label>
                  <input
                    type="text"
                    value={config.recipientName}
                    onChange={(e) => setConfig((prev) => ({ ...prev, recipientName: e.target.value }))}
                    className="w-full bg-void-surface border border-paper-15 focus:border-gold focus:outline-none text-paper px-4 py-3 rounded-[2px] placeholder:text-paper-30 transition-colors"
                    placeholder="Their name"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-[0.22em] text-paper-50 mb-2.5">Recipient&apos;s email</label>
                  <input
                    type="email"
                    value={config.recipientEmail}
                    onChange={(e) => setConfig((prev) => ({ ...prev, recipientEmail: e.target.value }))}
                    className="w-full bg-void-surface border border-paper-15 focus:border-gold focus:outline-none text-paper px-4 py-3 rounded-[2px] placeholder:text-paper-30 transition-colors"
                    placeholder="their@email.com"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-[0.22em] text-paper-50 mb-2.5">Personal message (optional)</label>
                  <textarea
                    value={config.personalMessage}
                    onChange={(e) => setConfig((prev) => ({ ...prev, personalMessage: e.target.value }))}
                    className="w-full bg-void-surface border border-paper-15 focus:border-gold focus:outline-none text-paper px-4 py-3 rounded-[2px] placeholder:text-paper-30 transition-colors font-body text-base leading-[1.7] resize-y h-24"
                    placeholder="Write a heartfelt message…"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-[0.22em] text-paper-50 mb-2.5">Unlock date (optional)</label>
                  <input
                    type="date"
                    value={config.unlockDate}
                    onChange={(e) => setConfig((prev) => ({ ...prev, unlockDate: e.target.value }))}
                    className="w-full bg-void-surface border border-paper-15 focus:border-gold focus:outline-none text-paper px-4 py-3 rounded-[2px] placeholder:text-paper-30 transition-colors"
                  />
                  <p className="text-paper-50 text-xs mt-1">Leave empty to make it available immediately</p>
                </div>

                <div className="flex justify-between items-center pt-4">
                  <button
                    onClick={() => setStep('select-content')}
                    className="text-paper-50 hover:text-paper text-sm transition-colors"
                  >
                    <span aria-hidden>←</span> Back
                  </button>
                  <button
                    onClick={() => sendMutation.mutate()}
                    disabled={!config.recipientEmail || !config.recipientName || sendMutation.isPending}
                    className="btn btn-primary"
                  >
                    {sendMutation.isPending ? 'Sending…' : 'Send gift'}
                    {!sendMutation.isPending ? <span aria-hidden>→</span> : null}
                  </button>
                </div>

                {sendMutation.isError && (
                  <p role="alert" className="text-blood text-sm text-center">
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
