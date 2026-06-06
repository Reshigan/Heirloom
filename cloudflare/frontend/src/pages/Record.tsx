import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { voiceApi, familyApi } from '../services/api';
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

type SpeakTrigger = 'now' | 'date' | 'death' | 'milestone' | 'event';

const SPEAK_TRIGGERS: { value: SpeakTrigger; label: string; hint: string }[] = [
  { value: 'now',       label: 'open now',      hint: 'recipient can hear this immediately' },
  { value: 'date',      label: 'on a date',     hint: 'sealed until a date you choose' },
  { value: 'death',     label: 'after death',   hint: 'unseals when your thread is closed' },
  { value: 'milestone', label: 'on a milestone', hint: 'unseals on a family milestone' },
  { value: 'event',     label: 'on an event',   hint: 'unseals on a named family event' },
];

export function Record() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  const [title, setTitle] = useState('');
  const [transcript, setTranscript] = useState('');
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'paused' | 'recorded'>('idle');
  const [sealedCeremony, setSealedCeremony] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [promptIdx, setPromptIdx] = useState(0);
  const [addresseeName, setAddresseeName] = useState('');
  const [recipientId, setRecipientId] = useState<string | null>(null);
  const [toOpen, setToOpen] = useState(false);
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [deliveryTrigger, setDeliveryTrigger] = useState<SpeakTrigger>('now');
  const [scheduledDate, setScheduledDate] = useState('');

  // Family autosuggest
  const { data: familyData } = useQuery({
    queryKey: ['family'],
    queryFn: () => familyApi.getAll().then(r => (r.data as any)?.members ?? r.data ?? []),
  });
  const familyMembers: { id: string; name: string; relationship?: string }[] =
    Array.isArray(familyData) ? familyData : [];

  // Pre-fill recipient from ?recipientId= URL param
  useEffect(() => {
    const id = searchParams.get('recipientId');
    if (!id || !familyMembers.length) return;
    const m = familyMembers.find(m => m.id === id);
    if (m) { setRecipientId(m.id); setAddresseeName(m.name); }
  }, [searchParams, familyMembers]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mimeTypeRef = useRef<string>('audio/webm');
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  // Stop microphone on unmount — prevents the browser mic indicator staying active
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (mediaRecorderRef.current?.state !== 'inactive') mediaRecorderRef.current?.stop();
    };
  }, []);

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
      streamRef.current = stream;
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
          recipientId: recipientId || undefined,
          entryDate,
          deliveryTrigger: deliveryTrigger !== 'now' ? deliveryTrigger : undefined,
          scheduledDate: deliveryTrigger === 'date' ? scheduledDate : undefined,
        },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories-mosaic'] });
      queryClient.invalidateQueries({ queryKey: ['weft-voice'] });
      queryClient.invalidateQueries({ queryKey: ['new-user-check-voice'] });
      setSealedCeremony(true);
      setTimeout(() => navigate('/memories'), 1400);
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
          overflowY: 'auto',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: recordingState === 'idle' ? 'flex-start' : 'center',
          gap: 0,
          paddingTop: recordingState === 'idle' ? 28 : 0,
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
                  fontSize: 13,
                  letterSpacing: '0.32em',
                  textTransform: 'uppercase',
                  color: 'var(--warm)',
                }}
              >
                speak
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
                fontFamily: 'var(--mono)',
                fontSize: 13,
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                borderBottom: '1px solid currentColor',
              }}
            >
              seal
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
                fontFamily: 'var(--mono)',
                fontSize: 11,
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
              }}
            >
              {recordingState === 'paused' ? 'resume' : 'pause'}
            </button>
          </div>
        ) : null}

        {/* Pre-recording fields: to, date, delivery — scrollable section */}
        {recordingState === 'idle' ? (
          <div
            style={{
              marginTop: 28,
              display: 'flex',
              flexDirection: 'column',
              gap: 0,
              width: '100%',
              maxWidth: 340,
              padding: '0 24px',
            }}
          >
            {/* To: field with family autosuggest */}
            <div style={{ position: 'relative', marginBottom: 14 }}>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase',
                  color: 'var(--bone-faint)', marginBottom: 6,
                }}
              >
                to
              </div>
              <input
                value={addresseeName}
                onChange={e => {
                  setAddresseeName(e.target.value);
                  setRecipientId(null);
                  setToOpen(true);
                }}
                onFocus={() => setToOpen(true)}
                onBlur={() => setTimeout(() => setToOpen(false), 200)}
                placeholder="a name (optional)"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'transparent',
                  border: 0, borderBottom: '1px solid var(--rule)',
                  color: 'var(--bone)', caretColor: 'var(--warm)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 14, letterSpacing: '0.04em',
                  padding: '6px 0 4px', outline: 'none',
                }}
              />
              {toOpen && familyMembers.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0,
                  background: '#111', border: '1px solid var(--rule)',
                  zIndex: 40, maxHeight: 160, overflowY: 'auto',
                }}>
                  {familyMembers
                    .filter(m => !addresseeName || m.name.toLowerCase().includes(addresseeName.toLowerCase()))
                    .map(m => (
                      <button
                        key={m.id}
                        type="button"
                        onMouseDown={() => {
                          setAddresseeName(m.name);
                          setRecipientId(m.id);
                          setToOpen(false);
                        }}
                        style={{
                          display: 'block', width: '100%', textAlign: 'left',
                          background: 'transparent', border: 0,
                          padding: '10px 12px', cursor: 'pointer',
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 13, color: 'var(--bone-dim)',
                          borderBottom: '1px solid var(--rule)',
                        }}
                      >
                        {m.name}
                        {m.relationship && (
                          <span style={{ marginLeft: 8, fontSize: 10, color: 'var(--bone-faint)', textTransform: 'uppercase', letterSpacing: '0.16em' }}>
                            {m.relationship}
                          </span>
                        )}
                      </button>
                    ))}
                </div>
              )}
            </div>

            {/* Entry date */}
            <div style={{ marginBottom: 20 }}>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase',
                  color: 'var(--bone-faint)', marginBottom: 6,
                }}
              >
                date
              </div>
              <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 6, borderBottom: '1px solid var(--rule)', paddingBottom: 4 }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, letterSpacing: '0.04em', color: 'var(--bone-dim)' }}>
                  {entryDate
                    ? new Date(`${entryDate}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                    : 'today'}
                </span>
                <input
                  type="date"
                  value={entryDate}
                  onChange={e => setEntryDate(e.target.value)}
                  style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
                />
              </div>
            </div>

            {/* Delivery trigger */}
            <div style={{ marginBottom: 20 }}>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase',
                  color: 'var(--bone-faint)', marginBottom: 6,
                }}
              >
                available
              </div>
              <div style={{ border: '1px solid var(--rule)' }}>
                {SPEAK_TRIGGERS.map((opt, i) => {
                  const active = opt.value === deliveryTrigger;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setDeliveryTrigger(opt.value)}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left',
                        background: 'transparent', border: 0,
                        borderBottom: i < SPEAK_TRIGGERS.length - 1 ? '1px solid var(--rule)' : 'none',
                        borderLeft: `3px solid ${active ? 'var(--warm)' : 'transparent'}`,
                        padding: '12px 14px', cursor: 'pointer',
                        transition: 'border-left-color 180ms var(--ease)',
                      }}
                    >
                      <span style={{
                        display: 'block',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 13, letterSpacing: '0.08em',
                        color: active ? 'var(--bone)' : 'var(--bone-faint)',
                        transition: 'color 180ms var(--ease)',
                      }}>
                        {opt.label}
                      </span>
                      {(active || opt.value === 'death' || opt.value === 'milestone' || opt.value === 'event') && (
                        <span style={{
                          display: 'block', marginTop: 2,
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 10, letterSpacing: '0.06em',
                          color: 'var(--bone-faint)', fontStyle: 'italic',
                        }}>
                          {opt.hint}
                        </span>
                      )}
                      {opt.value === 'date' && active && (
                        <div style={{ marginTop: 8 }} onClick={e => e.stopPropagation()}>
                          <input
                            type="date"
                            value={scheduledDate}
                            onChange={e => setScheduledDate(e.target.value)}
                            style={{
                              background: 'transparent', border: '1px solid var(--rule)',
                              color: 'var(--bone)',
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: 13, padding: '6px 10px', colorScheme: 'dark',
                              borderRadius: 0, outline: 'none', width: '100%', maxWidth: 180,
                              boxSizing: 'border-box',
                            }}
                          />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Writing prompt */}
            <p
              className="hl-serif hl-italic"
              style={{
                fontSize: 18,
                color: 'var(--bone-dim)',
                textAlign: 'center',
                lineHeight: 1.45,
                fontVariationSettings: '"opsz" 20',
                margin: '8px 0 0',
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
              {save.isPending ? 'sealing…' : 'seal this voice →'}
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
                fontFamily: 'var(--mono)',
                fontSize: 11,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                borderBottom: '1px solid var(--rule)',
              }}
            >
              let it fade
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

      {/* ── sealed voice ceremony ─────────────────────────────────── */}
      {sealedCeremony && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'var(--ink)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            animation: 'hl-fade 360ms var(--ease) both',
            zIndex: 100,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 32,
              color: 'var(--warm)',
              letterSpacing: '0.04em',
              animation: 'hl-rise 720ms var(--ease) 180ms both',
            }}
          >
            ∞
          </span>
          <span
            className="hl-serif hl-italic"
            style={{
              fontSize: 18,
              color: 'var(--bone)',
              animation: 'hl-rise 720ms var(--ease) 360ms both',
              fontVariationSettings: '"opsz" 18',
            }}
          >
            spoken · sealed
          </span>
          <span
            className="hl-mono"
            style={{
              fontSize: 11,
              color: 'var(--bone-faint)',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              animation: 'hl-rise 720ms var(--ease) 540ms both',
            }}
          >
            {mm}:{ss} bound to the loom
          </span>
        </div>
      )}
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
