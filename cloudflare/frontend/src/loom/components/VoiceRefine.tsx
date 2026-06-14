import { useCallback, useEffect, useRef, useState } from 'react';
import { aiApi } from '../../services/api';
import { ProgressHair } from './ProgressHair';

/**
 * VoiceRefine — speak a letter (or memory), have it transcribed, then choose
 * from three AI rewrites or keep your own words.
 *
 * The flow: hold a thought → speak it → Whisper transcribes (Workers AI) →
 * /ai/refine returns three variants (lightly polished · warmer · more concise)
 * → tap one to fill the field, or keep the raw transcript as-is.
 *
 * Drops under any text body. It never replaces silently: it calls `onPick` only
 * when the writer chooses a version, so typed text is never lost without intent.
 *
 * Cosmic Loom chrome: hairline rules, mono labels, warm as signal only, the
 * ProgressHair for waiting — no spinners, no icons.
 */

type Stage = 'idle' | 'recording' | 'working' | 'choosing';
type Variant = { id: string; label: string; text: string };

interface VoiceRefineProps {
  /** Called with the chosen text when the writer picks a version. */
  onPick: (text: string) => void;
  /** Tunes the prompt copy only. */
  kind?: 'letter' | 'memory';
  className?: string;
}

function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

// Word-level highlight: words the AI introduced (not in the spoken original)
// glow warm; the writer's own words stay calm. Not a true LCS diff — a cheap
// multiset check that reads right: it shows what changed, not where it moved.
const wordKey = (w: string) => w.toLowerCase().replace(/[^\p{L}\p{N}']/gu, '');

function DiffText({ base, text }: { base: string; text: string }) {
  const have = new Map<string, number>();
  for (const w of base.split(/\s+/)) {
    const k = wordKey(w);
    if (k) have.set(k, (have.get(k) ?? 0) + 1);
  }
  const tokens = text.split(/(\s+)/); // keep whitespace tokens
  return (
    <p className="hl-serif" style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: 'var(--bone-dim)' }}>
      {tokens.map((tok, i) => {
        if (/^\s+$/.test(tok) || tok === '') return tok;
        const k = wordKey(tok);
        const kept = k !== '' && (have.get(k) ?? 0) > 0;
        if (kept) have.set(k, (have.get(k) as number) - 1);
        return (
          <span key={i} style={kept ? undefined : { color: 'var(--warm)' }}>
            {tok}
          </span>
        );
      })}
    </p>
  );
}

const NUDGES: { id: 'warmer' | 'shorter' | 'plainer'; label: string }[] = [
  { id: 'warmer', label: 'warmer' },
  { id: 'shorter', label: 'shorter' },
  { id: 'plainer', label: 'plainer' },
];

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = () => reject(fr.error);
    fr.readAsDataURL(blob);
  });
}

export function VoiceRefine({ onPick, kind = 'letter', className }: VoiceRefineProps) {
  const [stage, setStage] = useState<Stage>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [working, setWorking] = useState('');
  const [refining, setRefining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  const [variants, setVariants] = useState<Variant[]>([]);
  const [level, setLevel] = useState(0);
  const [nudging, setNudging] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);

  const stopTick = () => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  };

  const stopMeter = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    analyserRef.current = null;
    if (audioCtxRef.current) {
      void audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setLevel(0);
  };

  useEffect(() => () => {
    stopTick();
    stopMeter();
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  const process = useCallback(async (blob: Blob) => {
    setStage('working');
    setWorking('listening to your words…');
    let heard = '';
    try {
      const dataUrl = await blobToDataUrl(blob);
      const tRes = await aiApi.transcribe({ audioUrl: dataUrl });
      heard = (tRes.data?.transcript || '').trim();
    } catch {
      setError('The microphone or network gave out. Try again.');
      setStage('idle');
      return;
    }
    if (!heard) {
      setError("Couldn't quite hear that. Try again, a little closer.");
      setStage('idle');
      return;
    }

    // Show the raw transcript immediately — no blind wait while refine runs.
    setTranscript(heard);
    setVariants([]);
    setRefining(true);
    setStage('choosing');

    try {
      const rRes = await aiApi.refine(heard);
      setVariants(rRes.data?.variants ?? []);
    } catch {
      // Refine failed — the transcript is already keepable, so just stop.
      setVariants([]);
    } finally {
      setRefining(false);
    }
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setTranscript('');
    setVariants([]);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Live input level for the meter — purely visual, never recorded.
      try {
        const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new Ctx();
        audioCtxRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);
        analyserRef.current = analyser;
        const buf = new Uint8Array(analyser.frequencyBinCount);
        const loop = () => {
          const a = analyserRef.current;
          if (!a) return;
          a.getByteTimeDomainData(buf);
          let sum = 0;
          for (let i = 0; i < buf.length; i++) {
            const v = (buf[i] - 128) / 128;
            sum += v * v;
          }
          const rms = Math.sqrt(sum / buf.length);
          setLevel((prev) => prev * 0.6 + Math.min(1, rms * 2.6) * 0.4);
          rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);
      } catch {
        // Meter is optional — recording proceeds without it.
      }

      const type = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']
        .find((t) => MediaRecorder.isTypeSupported(t)) ?? '';
      const recorder = new MediaRecorder(stream, {
        ...(type ? { mimeType: type } : {}),
        audioBitsPerSecond: 64_000,
      });
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || type || 'audio/webm' });
        stream.getTracks().forEach((t) => t.stop());
        stopMeter();
        void process(blob);
      };
      recorder.start();
      setElapsed(0);
      setStage('recording');
      stopTick();
      tickRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } catch {
      stopMeter();
      setError('We could not start the microphone. Check your browser permissions.');
    }
  }, [process]);

  const stop = useCallback(() => {
    recorderRef.current?.stop();
    stopTick();
  }, []);

  const reset = useCallback(() => {
    setStage('idle');
    setTranscript('');
    setVariants([]);
    setRefining(false);
    setError(null);
    stopTick();
    stopMeter();
  }, []);

  const choose = (text: string) => {
    onPick(text);
    reset();
  };

  // Re-shape one variant in place — warmer, shorter, plainer — without
  // disturbing the others. The card keeps its label; only its text changes.
  const applyNudge = async (variant: Variant, nudge: 'warmer' | 'shorter' | 'plainer') => {
    if (nudging) return;
    setNudging(variant.id);
    try {
      const res = await aiApi.refine(variant.text, nudge);
      const next = res.data?.variants?.[0]?.text?.trim();
      if (next) {
        setVariants((prev) => prev.map((v) => (v.id === variant.id ? { ...v, text: next } : v)));
      }
    } catch {
      // Leave the variant as-is — a failed nudge is a no-op, not an error state.
    } finally {
      setNudging(null);
    }
  };

  const eyebrow: React.CSSProperties = {
    fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.24em',
    textTransform: 'uppercase', color: 'var(--bone-faint)',
  };

  return (
    <div className={className} style={{ display: 'grid', gap: 12 }}>
      {/* Trigger / recording control */}
      {stage === 'idle' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <button type="button" onClick={start} className="hl-btn text" style={{ fontSize: 12 }}>
            speak {kind === 'letter' ? 'this letter' : 'this memory'} →
          </button>
          <span style={{ ...eyebrow, fontStyle: 'italic', textTransform: 'none', letterSpacing: '0.04em', color: 'var(--bone-faint)' }}>
            say it aloud — choose how it reads
          </span>
        </div>
      )}

      {stage === 'recording' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span aria-hidden style={{ display: 'flex', alignItems: 'center', gap: 3, height: 22 }}>
            {[0, 1, 2, 3, 4, 5, 6].map((i) => {
              // Center bars react most — a soft bell so the meter reads as a voice, not a VU strip.
              const weight = 1 - Math.abs(i - 3) / 4;
              const h = 3 + level * weight * 19;
              return (
                <span
                  key={i}
                  style={{
                    width: 2, height: h, background: 'var(--warm)',
                    boxShadow: level > 0.08 ? '0 0 6px var(--warm)' : 'none',
                    transition: 'height 90ms linear',
                  }}
                />
              );
            })}
          </span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 15, letterSpacing: '0.08em', color: 'var(--bone)' }}>
            {fmt(elapsed)}
          </span>
          <button type="button" onClick={stop} className="hl-btn" style={{ fontSize: 12, padding: '8px 16px' }}>
            stop
          </button>
          <button type="button" onClick={() => { recorderRef.current?.stop(); reset(); }} className="hl-btn text" style={{ fontSize: 11 }}>
            cancel
          </button>
        </div>
      )}

      {stage === 'working' && <ProgressHair label={working} />}

      {stage === 'choosing' && (
        <div style={{ display: 'grid', gap: 12, border: '1px solid var(--rule)', padding: 16 }}>
          {/* Your words — always keepable */}
          <div style={{ display: 'grid', gap: 8 }}>
            <span style={eyebrow}>your words</span>
            <p className="hl-serif" style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: 'var(--bone-dim)', fontStyle: 'italic' }}>
              {transcript}
            </p>
            <button type="button" onClick={() => choose(transcript)} className="hl-btn text" style={{ fontSize: 11, justifySelf: 'start' }}>
              keep my words →
            </button>
          </div>

          {refining && (
            <div style={{ borderTop: '1px solid var(--rule)', paddingTop: 12 }}>
              <ProgressHair label="finding better words…" />
            </div>
          )}

          {!refining && variants.length > 0 && (
            <div style={{ display: 'grid', gap: 12, borderTop: '1px solid var(--rule)', paddingTop: 12 }}>
              <span style={eyebrow}>or choose a version</span>
              {variants.map((v) => (
                <div key={v.id} style={{ display: 'grid', gap: 8, borderLeft: '2px solid var(--rule-warm, rgba(176,122,74,0.22))', paddingLeft: 12 }}>
                  <span style={{ ...eyebrow, color: 'var(--warm)' }}>{v.label}</span>
                  {nudging === v.id ? (
                    <ProgressHair label="re-shaping…" />
                  ) : (
                    <DiffText base={transcript} text={v.text} />
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <button type="button" onClick={() => choose(v.text)} disabled={nudging === v.id} className="hl-btn" style={{ fontSize: 11, padding: '8px 16px' }}>
                      use this →
                    </button>
                    <span style={{ ...eyebrow, textTransform: 'none', letterSpacing: '0.04em' }}>nudge:</span>
                    {NUDGES.map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => applyNudge(v, n.id)}
                        disabled={nudging !== null}
                        className="hl-btn text"
                        style={{ fontSize: 11, opacity: nudging !== null && nudging !== v.id ? 0.4 : 1 }}
                      >
                        {n.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <button type="button" onClick={reset} className="hl-btn text" style={{ fontSize: 11, justifySelf: 'start', color: 'var(--bone-faint)' }}>
            discard
          </button>
        </div>
      )}

      {error && (
        <p style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.04em', color: 'var(--warm-bright, var(--warm))', margin: 0 }}>
          {error}
        </p>
      )}
    </div>
  );
}

export default VoiceRefine;
