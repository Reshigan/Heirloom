import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { voiceApi } from '../services/api';
import { HLogo } from '../loom/components/HLogo';
import { TapestryEdge } from '../loom/components/Frame';

/**
 * Record — ComposerSpeak (Loom 3 · §6.3).
 *
 * Standalone dark ink screen. Three concentric breath rings, oversized mono
 * timer, plain-text stop control, prompt carousel at bottom. Full MediaRecorder
 * flow: start → pause/resume → stop → save via signed URL + voiceApi.create.
 */

const PROMPTS = [
  'What did your mother say about the war?',
  'What was the song that always played?',
  'What was your father afraid of?',
  'Where did you feel most at home?',
  'What did you carry that you never showed anyone?',
  'Who taught you the thing you do best?',
];

export function Record() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [transcript, setTranscript] = useState('');
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'paused' | 'recorded'>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [promptIdx, setPromptIdx] = useState(0);
  const [addresseeName, setAddresseeName] = useState('');
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().slice(0, 10));

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mimeTypeRef = useRef<string>('audio/webm');

  useEffect(() => {
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startTick = () => {
    tickRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
  };
  const stopTick = () => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  };

  const start = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const supportedType = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus',
      ].find((t) => MediaRecorder.isTypeSupported(t)) ?? '';
      mimeTypeRef.current = supportedType || 'audio/webm';
      const recorder = new MediaRecorder(stream, supportedType ? { mimeType: supportedType } : undefined);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const actualType = recorder.mimeType || mimeTypeRef.current;
        mimeTypeRef.current = actualType;
        const blob = new Blob(chunksRef.current, { type: actualType });
        setAudioBlob(blob);
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      setElapsed(0);
      setRecordingState('recording');
      startTick();
    } catch {
      setError('We could not start the microphone. Check your browser permissions.');
    }
  };

  const togglePause = () => {
    const r = mediaRecorderRef.current;
    if (!r) return;
    if (recordingState === 'recording') {
      r.pause();
      stopTick();
      setRecordingState('paused');
    } else if (recordingState === 'paused') {
      r.resume();
      startTick();
      setRecordingState('recording');
    }
  };

  const stop = () => {
    mediaRecorderRef.current?.stop();
    setRecordingState('recorded');
    stopTick();
  };

  const reset = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setElapsed(0);
    setRecordingState('idle');
  };

  const save = useMutation({
    mutationFn: async () => {
      if (!audioBlob) throw new Error('No recording to save.');
      const mime = mimeTypeRef.current || audioBlob.type || 'audio/webm';
      const ext = mime.includes('mp4') ? 'm4a' : mime.includes('ogg') ? 'ogg' : 'webm';
      const contentType = mime.split(';')[0]; // strip codec params for upload header
      const filename = `recording-${Date.now()}.${ext}`;
      const { data: upload } = await voiceApi.getUploadUrl({
        filename,
        contentType,
      });
      await fetch(upload.uploadUrl ?? upload.url, {
        method: 'PUT',
        body: audioBlob,
        headers: { 'Content-Type': contentType },
      });
      const { data } = await voiceApi.create({
        title: title.trim() || PROMPTS[promptIdx],
        transcript: transcript.trim() || null,
        fileKey: upload.fileKey ?? upload.key,
        fileUrl: upload.publicUrl ?? upload.url,
        duration: elapsed,
        fileSize: audioBlob.size,
        metadata: {
          to: addresseeName.trim() || undefined,
          entryDate,
        },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories-mosaic'] });
      navigate('/memories');
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Could not save the recording.';
      setError(msg);
    },
  });

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');
  const live = recordingState === 'recording' || recordingState === 'paused';

  return (
    <div
      className="hl-screen"
      style={{
        position: 'absolute',
        inset: 0,
        background: 'var(--ink)',
        overflow: 'hidden',
      }}
    >
      {/* ── topbar ───────────────────────────────────────────────── */}
      <div className="hl-topbar">
        {/* left: HLogo */}
        <Link
          to="/memories"
          style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
        >
          <HLogo size={18} wordmark />
        </Link>

        {/* center: context label */}
        <span
          className="hl-counter"
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            whiteSpace: 'nowrap',
          }}
        >
          speak
        </span>

        {/* right: cancel */}
        <Link to="/memories" className="hl-link warm" style={{ fontSize: 14 }}>
          cancel →
        </Link>
      </div>

      {/* ── ring + timer stage ───────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          top: 'calc(56px + env(safe-area-inset-top, 0px))',
          bottom: 80,
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0,
        }}
      >
        {/* three concentric rings */}
        <div style={{ position: 'relative', width: 240, height: 240, flexShrink: 0 }}>
          {/* outer */}
          <span
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 240,
              height: 240,
              border: '1px solid var(--bone-dim)',
              borderRadius: '50%',
              animation:
                recordingState === 'recording'
                  ? 'loom-breathe 1400ms cubic-bezier(0.16,1,0.3,1) infinite'
                  : 'none',
            }}
          />
          {/* inner — 196px: offset (240-196)/2 = 22 */}
          <span
            style={{
              position: 'absolute',
              top: 22,
              left: 22,
              width: 196,
              height: 196,
              border: '1px solid var(--bone-low)',
              borderRadius: '50%',
              animation:
                recordingState === 'recording'
                  ? 'loom-breathe 1400ms cubic-bezier(0.16,1,0.3,1) infinite 360ms'
                  : 'none',
            }}
          />
          {/* innermost — 152px: offset (240-152)/2 = 44 */}
          <span
            style={{
              position: 'absolute',
              top: 44,
              left: 44,
              width: 152,
              height: 152,
              border: '1px solid var(--bone-faint)',
              borderRadius: '50%',
              opacity: 0.5,
              animation:
                recordingState === 'recording'
                  ? 'loom-breathe 1400ms cubic-bezier(0.16,1,0.3,1) infinite 720ms'
                  : 'none',
            }}
          />

          {/* center: timer or begin tap */}
          <span
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {recordingState === 'idle' ? (
              <button
                type="button"
                onClick={start}
                style={{
                  background: 'transparent',
                  border: 0,
                  padding: 0,
                  cursor: 'pointer',
                  fontFamily: 'var(--mono)',
                  fontSize: 14,
                  letterSpacing: '0.28em',
                  textTransform: 'uppercase',
                  color: 'var(--warm)',
                }}
              >
                begin
              </button>
            ) : (
              <span
                className="hl-mono"
                style={{
                  fontSize: 48,
                  letterSpacing: '0.04em',
                  color: recordingState === 'paused' ? 'var(--bone-dim)' : 'var(--bone)',
                  lineHeight: 1,
                }}
              >
                {mm}:{ss}
              </span>
            )}
          </span>
        </div>

        {/* stop button */}
        {live ? (
          <div style={{ marginTop: 32, display: 'flex', gap: 32, alignItems: 'center' }}>
            <button
              type="button"
              onClick={stop}
              style={{
                background: 'transparent',
                border: 0,
                padding: '0 0 2px',
                cursor: 'pointer',
                color: 'var(--warm)',
                fontFamily: 'var(--sans)',
                fontSize: 18,
                fontWeight: 400,
                letterSpacing: '-0.005em',
                borderBottom: '1px solid currentColor',
              }}
            >
              stop
            </button>
            <button
              type="button"
              onClick={togglePause}
              style={{
                background: 'transparent',
                border: 0,
                padding: 0,
                cursor: 'pointer',
                color: 'var(--bone-dim)',
                fontFamily: 'var(--sans)',
                fontSize: 15,
                fontWeight: 400,
              }}
            >
              {recordingState === 'paused' ? 'resume' : 'pause'}
            </button>
          </div>
        ) : null}

        {/* addressee + date (idle only) — before pressing Begin */}
        {recordingState === 'idle' ? (
          <div
            style={{
              marginTop: 32,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              width: '100%',
              maxWidth: 320,
            }}
          >
            <input
              value={addresseeName}
              onChange={e => setAddresseeName(e.target.value)}
              placeholder="for — a name (optional)"
              style={{
                background: 'transparent',
                border: 0,
                borderBottom: '1px solid var(--rule)',
                color: 'var(--bone)',
                caretColor: 'var(--warm)',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 13,
                letterSpacing: '0.06em',
                padding: '6px 0 4px',
                outline: 'none',
                textAlign: 'center',
                width: '100%',
              }}
            />
            {/* Date: formatted text with invisible overlay input for tap/click */}
            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 6, borderBottom: '1px solid var(--rule)', paddingBottom: 4, width: '100%', justifyContent: 'center' }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, letterSpacing: '0.06em', color: 'var(--bone-dim)' }}>
                {entryDate
                  ? new Date(`${entryDate}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
                  : 'date'}
              </span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--bone-faint)' }}>↗</span>
              <input
                type="date"
                value={entryDate}
                onChange={e => setEntryDate(e.target.value)}
                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
              />
            </div>
            <p
              className="hl-serif hl-italic"
              style={{
                marginTop: 8,
                fontSize: 17,
                color: 'var(--bone-dim)',
                textAlign: 'center',
                maxWidth: 320,
                lineHeight: 1.5,
              }}
            >
              {PROMPTS[promptIdx]}
            </p>
          </div>
        ) : null}

        {/* transcription result — editable after recording stops */}
        {recordingState === 'recorded' ? (
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Transcript will appear here — or write your own."
            rows={3}
            style={{
              marginTop: 28,
              maxWidth: 640,
              width: '100%',
              padding: '0 24px',
              background: 'transparent',
              border: 0,
              borderBottom: '1px solid var(--rule)',
              color: 'var(--bone-dim)',
              fontFamily: 'var(--serif)',
              fontSize: 17,
              fontStyle: 'italic',
              lineHeight: 1.6,
              textAlign: 'center',
              resize: 'none',
              outline: 'none',
            }}
          />
        ) : null}

        {/* save / discard row (after recording) */}
        {recordingState === 'recorded' ? (
          <div
            style={{
              marginTop: 32,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            {audioUrl ? (
              <audio controls src={audioUrl} style={{ height: 32, opacity: 0.7 }} />
            ) : null}

            {/* title field */}
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={PROMPTS[promptIdx]}
              style={{
                width: 280,
                background: 'transparent',
                border: 0,
                borderBottom: '1px solid var(--rule)',
                color: 'var(--bone)',
                fontFamily: 'var(--serif)',
                fontSize: 15,
                padding: '4px 0',
                outline: 'none',
              }}
            />

            <button
              type="button"
              onClick={() => save.mutate()}
              disabled={save.isPending || !audioBlob}
              className="hl-btn"
              style={{ opacity: save.isPending || !audioBlob ? 0.5 : 1 }}
            >
              {save.isPending ? 'saving…' : 'save'}
            </button>

            <button
              type="button"
              onClick={reset}
              style={{
                background: 'transparent',
                border: 0,
                padding: '0 0 2px',
                cursor: 'pointer',
                color: 'var(--bone-dim)',
                fontFamily: 'var(--sans)',
                fontSize: 14,
                borderBottom: '1px solid var(--rule)',
              }}
            >
              discard
            </button>
          </div>
        ) : null}

        {/* error */}
        {error ? (
          <p
            role="alert"
            className="hl-serif"
            style={{
              marginTop: 20,
              fontSize: 14,
              fontStyle: 'italic',
              color: 'var(--danger)',
              textAlign: 'center',
            }}
          >
            {error}
          </p>
        ) : null}
      </div>

      {/* ── prompt cards — horizontal scroll at bottom ───────────── */}
      {recordingState === 'idle' ? (
        <div
          style={{
            position: 'absolute',
            bottom: 24,
            left: 0,
            right: 0,
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'center',
            gap: 24,
            overflowX: 'auto',
            padding: '0 32px',
            scrollbarWidth: 'none',
          }}
        >
          <button
            type="button"
            onClick={() => setPromptIdx((i) => (i - 1 + PROMPTS.length) % PROMPTS.length)}
            style={promptCard()}
          >
            ← {PROMPTS[(promptIdx - 1 + PROMPTS.length) % PROMPTS.length]}
          </button>
          <button
            type="button"
            onClick={() => setPromptIdx((i) => (i + 1) % PROMPTS.length)}
            style={promptCard()}
          >
            {PROMPTS[(promptIdx + 1) % PROMPTS.length]} →
          </button>
        </div>
      ) : null}

      <TapestryEdge />
    </div>
  );
}

function promptCard(): React.CSSProperties {
  return {
    background: 'transparent',
    border: 0,
    padding: 0,
    cursor: 'pointer',
    color: 'var(--bone-dim)',
    fontFamily: 'var(--serif)',
    fontStyle: 'italic',
    fontSize: 16,
    maxWidth: '22ch',
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 1.45,
    whiteSpace: 'normal',
  };
}
