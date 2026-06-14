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
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  const [variants, setVariants] = useState<Variant[]>([]);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTick = () => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  };

  useEffect(() => () => {
    stopTick();
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  const process = useCallback(async (blob: Blob) => {
    setStage('working');
    try {
      setWorking('listening to your words…');
      const dataUrl = await blobToDataUrl(blob);
      const tRes = await aiApi.transcribe({ audioUrl: dataUrl });
      const heard = (tRes.data?.transcript || '').trim();
      if (!heard) {
        setError("Couldn't quite hear that. Try again, a little closer.");
        setStage('idle');
        return;
      }
      setTranscript(heard);

      setWorking('finding better words…');
      const rRes = await aiApi.refine(heard);
      setVariants(rRes.data?.variants ?? []);
      setStage('choosing');
    } catch {
      // Transcript may exist even if refine failed — let them keep their words.
      setVariants([]);
      setStage(transcript ? 'choosing' : 'idle');
      if (!transcript) setError('The microphone or network gave out. Try again.');
    }
  }, [transcript]);

  const start = useCallback(async () => {
    setError(null);
    setTranscript('');
    setVariants([]);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
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
        void process(blob);
      };
      recorder.start();
      setElapsed(0);
      setStage('recording');
      stopTick();
      tickRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } catch {
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
    setError(null);
  }, []);

  const choose = (text: string) => {
    onPick(text);
    reset();
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
          <span aria-hidden style={{ width: 8, height: 8, background: 'var(--warm)', boxShadow: '0 0 10px var(--warm)' }} />
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

          {variants.length > 0 && (
            <div style={{ display: 'grid', gap: 12, borderTop: '1px solid var(--rule)', paddingTop: 12 }}>
              <span style={eyebrow}>or choose a version</span>
              {variants.map((v) => (
                <div key={v.id} style={{ display: 'grid', gap: 8, borderLeft: '2px solid var(--rule-warm, rgba(176,122,74,0.22))', paddingLeft: 12 }}>
                  <span style={{ ...eyebrow, color: 'var(--warm)' }}>{v.label}</span>
                  <p className="hl-serif" style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: 'var(--bone)' }}>
                    {v.text}
                  </p>
                  <button type="button" onClick={() => choose(v.text)} className="hl-btn" style={{ fontSize: 11, padding: '8px 16px', justifySelf: 'start' }}>
                    use this →
                  </button>
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
