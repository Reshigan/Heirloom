import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Navigation } from '../components/Navigation';
import { memoriesApi, lettersApi, voiceApi, exportApi } from '../services/api';

type BookStep = 'select' | 'customize' | 'preview' | 'order';

interface BookConfig {
  title: string;
  subtitle: string;
  coverType: 'hardcover' | 'softcover';
  memoryIds: string[];
  letterIds: string[];
  voiceIds: string[];
  includeTranscriptions: boolean;
  includePhotos: boolean;
  includeDates: boolean;
  dedicationText: string;
}

export function BookBuilder() {
  const navigate = useNavigate();
  const [step, setStep] = useState<BookStep>('select');
  const [config, setConfig] = useState<BookConfig>({
    title: 'Our Family Memories',
    subtitle: '',
    coverType: 'hardcover',
    memoryIds: [],
    letterIds: [],
    voiceIds: [],
    includeTranscriptions: true,
    includePhotos: true,
    includeDates: true,
    dedicationText: '',
  });

  const { data: memories } = useQuery({
    queryKey: ['memories-for-book'],
    queryFn: () => memoriesApi.getAll({ limit: 100 }).then((r) => r.data),
  });

  const { data: letters } = useQuery({
    queryKey: ['letters-for-book'],
    queryFn: () => lettersApi.getAll({ limit: 100 }).then((r) => r.data),
  });

  const { data: voices } = useQuery({
    queryKey: ['voices-for-book'],
    queryFn: () => voiceApi.getAll({ limit: 100 }).then((r) => r.data),
  });

  const orderMutation = useMutation({
    mutationFn: () => exportApi.bookOrder(config),
    onSuccess: (data) => {
      if (data.data?.checkoutUrl) {
        window.location.href = data.data.checkoutUrl;
      }
    },
  });

  const totalItems = config.memoryIds.length + config.letterIds.length + config.voiceIds.length;
  const estimatedPages = Math.max(20, totalItems * 2 + 10);

  const stepLabels: Record<BookStep, string> = {
    select: 'Select Content',
    customize: 'Customize',
    preview: 'Preview',
    order: 'Order',
  };

  const stepOrder: BookStep[] = ['select', 'customize', 'preview', 'order'];
  const currentStepIndex = stepOrder.indexOf(step);

  const toggleItem = (type: 'memoryIds' | 'letterIds' | 'voiceIds', id: string) => {
    setConfig((prev) => ({
      ...prev,
      [type]: prev[type].includes(id) ? prev[type].filter((i) => i !== id) : [...prev[type], id],
    }));
  };

  const memoryList = Array.isArray(memories) ? memories : memories?.data || memories?.memories || [];
  const letterList = Array.isArray(letters) ? letters : letters?.data || letters?.letters || [];
  const voiceList = Array.isArray(voices) ? voices : voices?.data || voices?.recordings || [];

  return (
    <div className="min-h-screen bg-void text-paper antialiased">
      <Navigation />

      <main className="relative z-10 px-6 md:px-12 pt-24 pb-32 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <p className="font-mono text-[0.7rem] tracking-[0.32em] uppercase text-gold mb-4">Living Book</p>
          <h1 className="font-body font-light text-3xl md:text-4xl text-paper mb-2 tracking-[-0.014em]">Living Book</h1>
          <p className="text-paper-65 font-body">Print your family thread as a hardback. Keepsake for the shelf; the thread keeps going.</p>
        </div>

        {/* Progress steps */}
        <div className="flex items-center gap-2 mb-10">
          {stepOrder.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-[2px] flex items-center justify-center text-xs font-mono transition-colors ${
                i <= currentStepIndex ? 'bg-gold text-void' : 'bg-void-surface border border-paper-15 text-paper-65'
              }`}>
                {i < currentStepIndex ? '✓' : i + 1}
              </div>
              <span className={`text-xs hidden md:block ${i <= currentStepIndex ? 'text-gold' : 'text-paper-65'}`}>
                {stepLabels[s]}
              </span>
              {i < stepOrder.length - 1 && (
                <div className={`flex-1 h-px ${i < currentStepIndex ? 'bg-gold' : 'bg-paper-15'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {step === 'select' && (
              <div className="space-y-6">
                <p className="text-paper-70">Select the memories, letters, and voice recordings to include in your book.</p>

                {/* Memories */}
                <div>
                  <h3 className="font-body text-lg text-paper mb-3">
                    Memories ({config.memoryIds.length} selected)
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                    {memoryList.map((m: { id: string; title?: string }) => (
                      <button
                        key={m.id}
                        onClick={() => toggleItem('memoryIds', m.id)}
                        className={`p-3 rounded-[2px] border text-left text-xs transition-colors ${
                          config.memoryIds.includes(m.id) ? 'border-gold-40 bg-void-surface text-gold' : 'border-paper-15 bg-void-surface text-paper-70'
                        }`}
                      >
                        {m.title || 'Untitled'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Letters */}
                <div>
                  <h3 className="font-body text-lg text-paper mb-3">
                    Letters ({config.letterIds.length} selected)
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                    {letterList.map((l: { id: string; title?: string; subject?: string }) => (
                      <button
                        key={l.id}
                        onClick={() => toggleItem('letterIds', l.id)}
                        className={`p-3 rounded-[2px] border text-left text-xs transition-colors ${
                          config.letterIds.includes(l.id) ? 'border-gold-40 bg-void-surface text-gold' : 'border-paper-15 bg-void-surface text-paper-70'
                        }`}
                      >
                        {l.title || l.subject || 'Untitled'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Voice recordings */}
                <div>
                  <h3 className="font-body text-lg text-paper mb-3">
                    Voice Recordings ({config.voiceIds.length} selected)
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                    {voiceList.map((v: { id: string; title?: string }) => (
                      <button
                        key={v.id}
                        onClick={() => toggleItem('voiceIds', v.id)}
                        className={`p-3 rounded-[2px] border text-left text-xs transition-colors ${
                          config.voiceIds.includes(v.id) ? 'border-gold-40 bg-void-surface text-gold' : 'border-paper-15 bg-void-surface text-paper-70'
                        }`}
                      >
                        {v.title || 'Untitled'}
                      </button>
                    ))}
                  </div>
                </div>

                <p className="text-paper-65 text-sm">{totalItems} items selected &middot; ~{estimatedPages} pages</p>
              </div>
            )}

            {step === 'customize' && (
              <div className="space-y-6 max-w-lg">
                <div>
                  <label className="block text-xs uppercase tracking-[0.22em] text-paper-50 mb-2.5">Book Title</label>
                  <input
                    type="text"
                    value={config.title}
                    onChange={(e) => setConfig((prev) => ({ ...prev, title: e.target.value }))}
                    className="w-full bg-void-surface border border-paper-15 focus:border-gold focus:outline-none text-paper px-4 py-3 rounded-[2px] font-body text-lg transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-[0.22em] text-paper-50 mb-2.5">Subtitle (optional)</label>
                  <input
                    type="text"
                    value={config.subtitle}
                    onChange={(e) => setConfig((prev) => ({ ...prev, subtitle: e.target.value }))}
                    className="w-full bg-void-surface border border-paper-15 focus:border-gold focus:outline-none text-paper px-4 py-3 rounded-[2px] placeholder:text-paper-30 transition-colors"
                    placeholder="A collection of our most precious moments"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-[0.22em] text-paper-50 mb-2.5">Dedication</label>
                  <textarea
                    value={config.dedicationText}
                    onChange={(e) => setConfig((prev) => ({ ...prev, dedicationText: e.target.value }))}
                    className="w-full bg-void-surface border border-paper-15 focus:border-gold focus:outline-none text-paper px-4 py-3 rounded-[2px] placeholder:text-paper-30 resize-none h-24 transition-colors"
                    placeholder="For my children, with all my love..."
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-[0.22em] text-paper-50 mb-2.5">Cover Type</label>
                  <div className="flex gap-3">
                    {(['hardcover', 'softcover'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setConfig((prev) => ({ ...prev, coverType: type }))}
                        className={`flex-1 p-4 rounded-[2px] border transition-colors ${
                          config.coverType === type ? 'border-gold-40 bg-void-surface text-gold' : 'border-paper-15 bg-void-surface text-paper-70'
                        }`}
                      >
                        <p className="font-body capitalize">{type}</p>
                        <p className="text-xs mt-1 text-paper-50">{type === 'hardcover' ? 'Premium quality' : 'Lightweight & flexible'}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { key: 'includePhotos', label: 'Include photos' },
                    { key: 'includeTranscriptions', label: 'Include voice transcriptions' },
                    { key: 'includeDates', label: 'Include dates' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config[key as keyof BookConfig] as boolean}
                        onChange={(e) => setConfig((prev) => ({ ...prev, [key]: e.target.checked }))}
                        className="w-4 h-4 rounded-[2px] border-paper-15 text-gold focus:ring-gold"
                      />
                      <span className="text-paper-70 text-sm">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {step === 'preview' && (
              <div className="text-center py-8">
                <div className="w-64 h-80 mx-auto mb-8 rounded-[2px] bg-void-surface border border-gold-40 flex flex-col items-center justify-center p-8">
                  <span className="font-body text-3xl text-gold mb-4" aria-hidden>∞</span>
                  <h3 className="font-body text-xl text-paper mb-1">{config.title}</h3>
                  {config.subtitle && <p className="text-paper-70 text-xs">{config.subtitle}</p>}
                  <div className="mt-auto text-paper-65 text-xs">
                    <p>{totalItems} items &middot; ~{estimatedPages} pages</p>
                    <p className="capitalize">{config.coverType}</p>
                  </div>
                </div>
                <p className="text-paper-65 text-sm">
                  Your book preview is ready. Review the details and place your order.
                </p>
              </div>
            )}

            {step === 'order' && (
              <div className="text-center py-8 max-w-md mx-auto">
                <h3 className="font-body font-light text-2xl text-paper mb-4 tracking-[-0.014em]">Order Summary</h3>
                <div className="bg-void-surface border border-paper-15 rounded-[2px] p-6 mb-6 text-left">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-paper-70">
                      <span>Book Title</span>
                      <span className="text-paper">{config.title}</span>
                    </div>
                    <div className="flex justify-between text-paper-70">
                      <span>Cover</span>
                      <span className="text-paper capitalize">{config.coverType}</span>
                    </div>
                    <div className="flex justify-between text-paper-70">
                      <span>Pages (est.)</span>
                      <span className="text-paper">{estimatedPages}</span>
                    </div>
                    <div className="flex justify-between text-paper-70">
                      <span>Items included</span>
                      <span className="text-paper">{totalItems}</span>
                    </div>
                    <div className="border-t border-paper-15 pt-3 flex justify-between">
                      <span className="text-paper">Total</span>
                      <span className="text-gold">{config.coverType === 'hardcover' ? '$49.99' : '$29.99'}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => orderMutation.mutate()}
                  disabled={orderMutation.isPending}
                  className="btn btn-primary w-full justify-center"
                >
                  Place Order
                  {!orderMutation.isPending ? <span aria-hidden>→</span> : null}
                </button>
                <p className="text-paper-65 text-xs mt-3">You&apos;ll be redirected to Stripe for secure payment</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-10">
          <button
            onClick={() => {
              if (currentStepIndex === 0) navigate('/dashboard');
              else setStep(stepOrder[currentStepIndex - 1]);
            }}
            className="inline-flex items-center gap-2 text-paper-70 hover:text-paper transition-colors"
          >
            <span aria-hidden>←</span>
            {currentStepIndex === 0 ? 'Cancel' : 'Back'}
          </button>

          {step !== 'order' && (
            <button
              onClick={() => setStep(stepOrder[currentStepIndex + 1])}
              disabled={step === 'select' && totalItems === 0}
              className="btn btn-primary"
            >
              Continue
              <span aria-hidden>→</span>
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

export default BookBuilder;
