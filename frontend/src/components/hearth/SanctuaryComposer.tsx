/**
 * SanctuaryComposer — the writing-as-ritual surface.
 *
 * The Hearth is not just a reading interface. The deeper purpose is for
 * users to bring their real thoughts, emotions, and reflections to the
 * fire — and for that to feel like a different *kind* of act than typing
 * into a chat box or a journal app.
 *
 * Design choices that protect that feeling:
 *
 *   - The fire stays. When the composer opens, the fire moves to the
 *     edge of the canvas; you write *next to* it, not on top of it.
 *   - One question at a time. We surface a single prompt above the
 *     blank field — chosen, not random. The user can ask for another
 *     prompt, or write without one.
 *   - Slow, deliberate UI. No autocomplete. No suggestions. No save
 *     button hovering. Saving is a quiet action at the bottom — "place
 *     it on the fire."
 *   - Voice-first option. The user can speak their entry. Voice often
 *     surfaces deeper truth than typing for this category.
 *   - Time-lock framing at compose time, not as an afterthought. If
 *     this entry is for someone specific in the future, you choose
 *     them now.
 *   - Privacy reassurance present, not buried. A small line: "what you
 *     write is encrypted with your family key. Lockable for any future
 *     date."
 *   - Cadence: writing fast on a phone keyboard works, but the surface
 *     is large enough to reward slow writing on a real keyboard.
 *
 * Spatial-readiness: this composer is a single floating panel that in
 * volumetric layout (Vision Pro / future Orion-class) becomes a
 * physical object you draw close to the fire. The transform-origin is
 * the fire so the future RealityKit port can preserve spatial relation.
 */

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

interface Props {
  open: boolean;
  /** Optional: a target member name if writing TO someone specific. */
  forMember?: { id: string; name: string } | null;
  /** Single suggested prompt or null. */
  prompt?: string | null;
  /** Called when the user requests a new prompt. */
  onAnotherPrompt?: () => void;
  /** Called when user places the entry on the fire. */
  onPlace?: (entry: { title?: string; body: string; lock?: { kind: 'date' | 'age' | 'death'; iso?: string; ageYears?: number } }) => void | Promise<void>;
  onClose: () => void;
}

const DEFAULT_PROMPT = "What's one thing you've never told anyone, that you'd want them to know?";

export function SanctuaryComposer({
  open,
  forMember,
  prompt,
  onAnotherPrompt,
  onPlace,
  onClose,
}: Props) {
  const reduceMotion = useReducedMotion();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [lockKind, setLockKind] = useState<'none' | 'date' | 'age' | 'death'>('none');
  const [lockDate, setLockDate] = useState('');
  const [lockAge, setLockAge] = useState('');
  const [recording, setRecording] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      // Soft autofocus once mount animations settle.
      const t = setTimeout(() => textareaRef.current?.focus(), 700);
      return () => clearTimeout(t);
    }
    setTitle('');
    setBody('');
    setLockKind('none');
    setLockDate('');
    setLockAge('');
    setError(null);
  }, [open]);

  // Native Web Speech API recognition. Falls back gracefully.
  // We type loosely as `any` because @types/dom-speech-recognition is
  // not in the project; adding it would pull a dep we don't otherwise
  // need. The API surface here is well-bounded.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recRef = useRef<any>(null);
  const startRecording = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SR) {
      setError('Voice is not supported on this device. Please type instead.');
      return;
    }
    const rec = new SR();
    rec.lang = 'en-US';
    rec.interimResults = true;
    rec.continuous = true;
    let baseline = body.length ? body + ' ' : '';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      let interim = '';
      let final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += transcript;
        else interim += transcript;
      }
      if (final) baseline = baseline + final;
      setBody(baseline + interim);
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onerror = (e: any) => {
      setError(`Voice paused: ${e.error ?? 'unknown'}`);
      setRecording(false);
    };
    rec.onend = () => setRecording(false);
    recRef.current = rec;
    rec.start();
    setRecording(true);
  };
  const stopRecording = () => {
    recRef.current?.stop();
    recRef.current = null;
    setRecording(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) {
      setError('A sentence is enough. The fire is patient.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      let lock:
        | { kind: 'date' | 'age' | 'death'; iso?: string; ageYears?: number }
        | undefined;
      if (lockKind === 'date' && lockDate) lock = { kind: 'date', iso: new Date(lockDate).toISOString() };
      else if (lockKind === 'age' && lockAge) lock = { kind: 'age', ageYears: parseInt(lockAge, 10) };
      else if (lockKind === 'death') lock = { kind: 'death' };

      await onPlace?.({
        title: title.trim() || undefined,
        body: body.trim(),
        lock,
      });
      onClose();
    } catch (err) {
      setError('Could not place it on the fire. Try once more.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="sanctuary"
          className="fixed inset-0 z-40 flex flex-col items-center justify-center px-4 sm:px-8 md:px-12 py-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Backdrop — pulls the fire's warmth across the surface, dims the
              ambient hearth so the eye lands on the page. */}
          <button
            type="button"
            aria-label="step back from the fire"
            onClick={onClose}
            className="absolute inset-0 cursor-default focus:outline-none"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(15,8,4,0.78) 0%, rgba(8,4,2,0.96) 70%)',
            }}
          />

          <motion.form
            initial={{ y: 14, scale: 0.985 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 8, scale: 0.99 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            onSubmit={submit}
            className="relative max-w-[60ch] w-full"
            aria-label="Sanctuary — write into the fire"
          >
            <p className="font-mono text-[0.65rem] tracking-[0.32em] uppercase text-gold/65 mb-4 text-center">
              {forMember ? `for ${forMember.name}` : 'into the fire'}
            </p>

            {/* Single quiet prompt — not random, chosen */}
            {prompt !== undefined ? (
              <div className="text-center mb-8">
                <p className="font-serif italic text-paper/65 text-lg sm:text-xl leading-relaxed max-w-prose mx-auto">
                  {prompt ?? DEFAULT_PROMPT}
                </p>
                {onAnotherPrompt ? (
                  <button
                    type="button"
                    onClick={onAnotherPrompt}
                    className="mt-3 text-[12px] tracking-wide text-paper/35 hover:text-paper/65 transition-colors"
                  >
                    or wait for another
                  </button>
                ) : null}
              </div>
            ) : null}

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="A title, if it has one"
              maxLength={200}
              className="w-full bg-transparent border-0 border-b border-paper/15 focus:border-gold/60 focus:outline-none text-paper/85 placeholder:text-paper/25 font-serif text-2xl sm:text-3xl py-3 mb-6 transition-colors"
              style={{ fontVariationSettings: '"opsz" 32' }}
            />

            <textarea
              ref={textareaRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Begin. A sentence is enough."
              rows={9}
              className="w-full bg-transparent border-0 focus:outline-none text-paper/90 placeholder:text-paper/25 font-serif text-[18px] sm:text-[19px] leading-[1.85] resize-y py-2"
              style={{ fontVariationSettings: '"opsz" 14' }}
            />

            {/* Lock framing — subtle, not buried, not loud */}
            <div className="mt-8 grid sm:grid-cols-[auto_1fr] gap-x-6 gap-y-3 items-baseline">
              <span className="text-[0.65rem] tracking-[0.28em] uppercase text-paper/40">
                When does it open
              </span>
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-[15px]">
                {(['none', 'date', 'age', 'death'] as const).map((k) => (
                  <label key={k} className="cursor-pointer text-paper/55 has-[:checked]:text-gold">
                    <input
                      type="radio"
                      name="lock"
                      checked={lockKind === k}
                      onChange={() => setLockKind(k)}
                      className="sr-only"
                    />
                    <span className="border-b border-paper/0 has-[:checked]:border-gold/60 pb-0.5">
                      {k === 'none' ? 'now' : k === 'date' ? 'a date' : k === 'age' ? 'a milestone age' : 'after I am gone'}
                    </span>
                  </label>
                ))}
              </div>

              {lockKind === 'date' ? (
                <>
                  <span className="text-[0.65rem] tracking-[0.28em] uppercase text-paper/40">date</span>
                  <input
                    type="date"
                    value={lockDate}
                    onChange={(e) => setLockDate(e.target.value)}
                    className="bg-transparent border-0 border-b border-paper/15 focus:border-gold/60 focus:outline-none text-paper/85 font-mono py-1 max-w-[14rem]"
                    min={new Date(Date.now() + 86400000).toISOString().slice(0, 10)}
                  />
                </>
              ) : null}

              {lockKind === 'age' ? (
                <>
                  <span className="text-[0.65rem] tracking-[0.28em] uppercase text-paper/40">age</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-paper/45 text-sm">when they reach</span>
                    <input
                      type="number"
                      min={1}
                      max={120}
                      value={lockAge}
                      onChange={(e) => setLockAge(e.target.value)}
                      className="bg-transparent border-0 border-b border-paper/15 focus:border-gold/60 focus:outline-none text-paper/85 font-mono w-16 py-1 text-center"
                      placeholder="18"
                    />
                  </div>
                </>
              ) : null}
            </div>

            <p className="mt-8 text-[12px] text-paper/35 leading-relaxed">
              What you place on the fire is encrypted with your family key. Only those you choose, and only when you choose, will see it. Even we cannot read locked entries until they unlock.
            </p>

            {error ? (
              <p role="alert" className="mt-4 text-[14px] text-blood-light/85 italic">
                {error}
              </p>
            ) : null}

            <div className="mt-10 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={recording ? stopRecording : startRecording}
                className="text-[14px] tracking-wide text-paper/55 hover:text-paper transition-colors inline-flex items-center gap-2 focus:outline-none"
                aria-pressed={recording}
              >
                {recording ? (
                  <>
                    <span className="inline-block w-2 h-2 rounded-full bg-blood-light animate-pulse" />
                    speaking — stop
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
                      <rect x="6" y="2" width="4" height="8" rx="2" stroke="currentColor" strokeWidth="1.2" />
                      <path d="M3 8c0 2.8 2.2 5 5 5s5-2.2 5-5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                      <path d="M8 13v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                    speak it instead
                  </>
                )}
              </button>

              <div className="flex items-center gap-5">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-[14px] text-paper/45 hover:text-paper/85 transition-colors"
                >
                  step back
                </button>
                <button
                  type="submit"
                  disabled={submitting || !body.trim()}
                  className="text-[15px] text-paper border border-gold/55 hover:border-gold hover:text-gold-bright disabled:opacity-50 px-5 py-2.5 rounded-md transition-colors"
                  style={{ background: 'rgba(176, 122, 74, 0.08)' }}
                >
                  {submitting ? 'placing…' : 'place it on the fire'}
                </button>
              </div>
            </div>
          </motion.form>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

