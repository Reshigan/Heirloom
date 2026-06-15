import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { voiceApi, familyApi, getAuthHeaders, aiApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { usePageMeta } from '../lib/usePageMeta';
import { WeaveCeremony } from '../loom/components/WeaveCeremony';
import { ClothShell } from '../loom/components/ClothShell';
import { RecipientPicker } from '../loom/components/RecipientPicker';
import { ProgressHair } from '../loom/components/ProgressHair';
import { VoiceRefine } from '../loom/components/VoiceRefine';

/**
 * Record — ComposerSpeak (Loom 3 · §6.3).
 *
 * Single hairline square border, oversized mono timer, plain-text controls.
 * Full MediaRecorder flow: start → pause/resume → stop → save via signed URL + voiceApi.create.
 */

const MAX_RECORDING_SECS = 120; // 2 min — used for hairline progress and auto-stop

const PROMPTS = [
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
  usePageMeta('Record a voice');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuthStore();

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
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [deliveryTrigger, setDeliveryTrigger] = useState<SpeakTrigger>('now');
  const [scheduledDate, setScheduledDate] = useState('');
  const [transcribing, setTranscribing] = useState(false);
  const [showRefine, setShowRefine] = useState(false);
  const [playing, setPlaying] = useState(false);

  // Static amber waveform — deterministic bars derived from the recording so the
  // shape is stable across re-renders (no audio-analyser dependency).
  const waveBars = useState(() =>
    Array.from({ length: 56 }, (_, i) => {
      const s = Math.sin(i * 0.7) * Math.cos(i * 0.31) + Math.sin(i * 1.9) * 0.5;
      return 0.18 + Math.abs(s) * 0.82;
    }),
  )[0];

  const audioElRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    const el = audioElRef.current;
    if (!el) return;
    if (el.paused) {
      void el.play();
      setPlaying(true);
    } else {
      el.pause();
      setPlaying(false);
    }
  };

  // Family autosuggest — only fetch when authenticated to avoid 401s
  const { data: familyData } = useQuery({
    queryKey: ['family'],
    queryFn: familyApi.list,
    enabled: isAuthenticated,
  });
  const familyMembers: { id: string; name: string; relationship?: string | null; dye?: string | null }[] =
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
  const navigateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Clear navigate timer on unmount to avoid state updates after unmount
  useEffect(() => {
    return () => {
      if (navigateTimer.current) clearTimeout(navigateTimer.current);
    };
  }, []);

  // Auto-stop when the 2-minute limit is reached
  useEffect(() => {
    if (elapsed >= MAX_RECORDING_SECS && recordingState === 'recording') {
      mediaRecorderRef.current?.stop();
      setRecordingState('recorded');
      stopTick();
    }
  }, [elapsed, recordingState]);

  const autoTranscribe = useCallback(async (blob: Blob) => {
    setTranscribing(true);
    try {
      const dataUrl = await blobToDataUrl(blob);
      const res = await aiApi.transcribe({ audioUrl: dataUrl });
      const heard = (res.data?.transcript || '').trim();
      if (heard) {
        setTranscript(heard);
        setShowRefine(true);
      }
    } catch {
      // Graceful fail — the manual transcript field stays available. Never block save.
    } finally {
      setTranscribing(false);
    }
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
      const recorder = new MediaRecorder(stream, {
        ...(supportedType ? { mimeType: supportedType } : {}),
        audioBitsPerSecond: 64_000,
      });
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
        void autoTranscribe(blob);
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
    setShowRefine(false);
    setTranscribing(false);
    setPlaying(false);
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
      const uploadResponse = await fetch(upload.uploadUrl ?? upload.url, {
        method: 'PUT',
        body: audioBlob,
        headers: { 'Content-Type': contentType, ...getAuthHeaders() },
      });
      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.status}`);
      }
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
      navigateTimer.current = setTimeout(() => navigate('/loom/index'), 4200);
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Could not save the recording.';
      setError(msg);
    },
  });

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');
  const live = recordingState === 'recording' || recordingState === 'paused';

  // Hairline progress: 0→1 over MAX_RECORDING_SECS while recording
  const progress = recordingState === 'recording' || recordingState === 'paused'
    ? Math.min(elapsed / MAX_RECORDING_SECS, 1)
    : 0;

  return (
    <ClothShell
      topbarLeft={
        <Link
          to="/loom"
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 11,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--bone-faint)',
            textDecoration: 'none',
          }}
        >
          ← heirloom
        </Link>
      }
      topbarCenter="record"
    >
      {/* Hairline recording progress — shown only while live */}
      {live && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: 1,
            width: `${progress * 100}%`,
            background: 'var(--warm)',
            transition: 'width 720ms cubic-bezier(0.16,1,0.3,1)',
            zIndex: 30,
          }}
        />
      )}

      {/* ── main content area — centered, reverent column ──────────── */}
      <div
        style={{
          padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)',
          maxWidth: 'var(--page-max-focus)',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        {/* ── mono kicker, hairline-framed ─────────────────────────── */}
        <div className="hl-rule" style={{ width: 120, height: 1, marginBottom: 22 }} />
        <div
          className="hl-eyebrow hl-mono"
          style={{
            color: 'var(--bone-faint)',
            letterSpacing: '0.3em',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 22,
          }}
        >
          voice
          <span aria-hidden style={{ width: 3, height: 3, background: 'var(--warm)', display: 'inline-block' }} />
          speak it
        </div>
        <div className="hl-rule" style={{ width: 120, height: 1, marginBottom: 40 }} />

        {/* ── thin serif line ──────────────────────────────────────── */}
        <p
          className="hl-serif hl-italic"
          style={{
            fontSize: 'var(--type-subhead)',
            color: 'var(--bone-dim)',
            lineHeight: 1.3,
            margin: '0 0 44px',
          }}
        >
          Say it the way you remember.
        </p>

        {/* ── calm amber hairline waveform ─────────────────────────── */}
        <svg
          aria-hidden
          viewBox="0 0 400 48"
          preserveAspectRatio="none"
          style={{
            width: '100%',
            maxWidth: 400,
            height: 48,
            marginBottom: 40,
            opacity: recordingState === 'recording' ? 0.9 : 0.45,
            transition: 'opacity 360ms cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          <path
            d="M0 24 C 20 24, 26 18, 34 24 S 48 30, 56 24 S 72 8, 84 24 S 100 36, 112 24 S 130 14, 144 24 S 162 30, 176 24 S 196 16, 212 24 S 232 32, 248 24 S 268 18, 284 24 S 304 28, 320 24 S 344 20, 364 24 S 388 24, 400 24"
            fill="none"
            stroke="var(--warm)"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* ── mono timer ───────────────────────────────────────────── */}
        <span
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 'var(--type-subhead)',
            letterSpacing: '0.18em',
            color: recordingState === 'paused' ? 'var(--bone-faint)' : 'var(--bone)',
            lineHeight: 1,
            marginBottom: 28,
            transition: 'color 180ms cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          {mm}:{ss}
        </span>

        {/* ── record control — thin amber ring, no icon ────────────── */}
        {recordingState === 'idle' ? (
          <button
            type="button"
            onClick={start}
            aria-label="Begin recording"
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              border: '1px solid var(--warm)',
              background: 'transparent',
              padding: 0,
              cursor: 'pointer',
            }}
          />
        ) : live ? (
          <button
            type="button"
            onClick={stop}
            aria-label="Stop recording"
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              border: '1px solid var(--warm)',
              background: recordingState === 'recording' ? 'var(--warm-dim)' : 'transparent',
              padding: 0,
              cursor: 'pointer',
              animation: recordingState === 'recording'
                ? 'hl-record-pulse 1400ms cubic-bezier(0.16,1,0.3,1) infinite'
                : 'none',
              transition: 'background 360ms cubic-bezier(0.16,1,0.3,1)',
            }}
          />
        ) : null}

        {/* ── controls below ring ───────────────────────────────── */}
        {live ? (
          <div style={{ marginTop: 28, display: 'flex', gap: 32, alignItems: 'center' }}>
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
                fontSize: 10,
                letterSpacing: '0.32em',
                textTransform: 'uppercase',
                borderBottom: '1px solid currentColor',
              }}
            >
              stop recording
            </button>
            <button
              type="button"
              onClick={togglePause}
              style={{
                background: 'transparent',
                border: 0,
                padding: 0,
                cursor: 'pointer',
                color: 'var(--bone-faint)',
                fontFamily: 'var(--mono)',
                fontSize: 10,
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
              }}
            >
              {recordingState === 'paused' ? 'resume' : 'pause'}
            </button>
          </div>
        ) : recordingState === 'idle' ? (
          <p
            className="hl-mono"
            style={{
              marginTop: 18,
              fontSize: 9,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: 'var(--bone-faint)',
            }}
          >
            tap to record
          </p>
        ) : null}

        {/* ── pre-recording fields (idle only) ──────────────────── */}
        {recordingState === 'idle' ? (
          <div
            style={{
              marginTop: 32,
              display: 'flex',
              flexDirection: 'column',
              gap: 0,
              width: '100%',
              maxWidth: 340,
              padding: '0 24px',
            }}
          >
            {/* To: field */}
            <div style={{ marginBottom: 14 }}>
              <RecipientPicker
                label="to"
                members={familyMembers}
                name={addresseeName}
                selectedId={recipientId}
                onChange={(n, id) => {
                  setAddresseeName(n);
                  setRecipientId(id);
                }}
                placeholder="a name (optional)"
              />
            </div>

            {/* Entry date */}
            <div style={{ marginBottom: 20 }}>
              <div
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase',
                  color: 'var(--bone-faint)', marginBottom: 6,
                }}
              >
                date
              </div>
              <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 6, borderBottom: '1px solid var(--rule)', paddingBottom: 4 }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 13, letterSpacing: '0.04em', color: 'var(--bone-faint)' }}>
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
                  fontFamily: 'var(--mono)',
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
                        fontFamily: 'var(--mono)',
                        fontSize: 13, letterSpacing: '0.08em',
                        color: active ? 'var(--bone)' : 'var(--bone-faint)',
                        transition: 'color 180ms var(--ease)',
                      }}>
                        {opt.label}
                      </span>
                      {(active || opt.value === 'death' || opt.value === 'milestone' || opt.value === 'event') && (
                        <span style={{
                          display: 'block', marginTop: 2,
                          fontFamily: 'var(--mono)',
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
                              fontFamily: 'var(--mono)',
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
                color: 'var(--bone-faint)',
                textAlign: 'center',
                lineHeight: 1.45,
                fontVariationSettings: '"opsz" 20',
                margin: '8px 0 0',
              }}
            >
              {PROMPTS[promptIdx]}
            </p>

            {/* Prompt prev/next */}
            <div
              style={{
                marginTop: 20,
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'center',
                gap: 24,
              }}
            >
              <button
                type="button"
                onClick={() => setPromptIdx((i) => (i - 1 + PROMPTS.length) % PROMPTS.length)}
                style={promptCard()}
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => setPromptIdx((i) => (i + 1) % PROMPTS.length)}
                style={promptCard()}
              >
                →
              </button>
            </div>
          </div>
        ) : null}

        {/* ── cosmic playback — amber waveform + outlined play ring ── */}
        {recordingState === 'recorded' && audioUrl ? (
          <div style={{ width: '100%', maxWidth: 420, marginTop: 8 }}>
            {/* eyebrow */}
            <div
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 11,
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                color: 'var(--bone-faint)',
                textAlign: 'center',
                marginBottom: 56,
              }}
            >
              what you said
            </div>

            {/* timecode */}
            <div
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 54,
                letterSpacing: '0.04em',
                color: 'var(--bone)',
                textAlign: 'center',
                lineHeight: 1,
                marginBottom: 32,
              }}
            >
              {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}
            </div>

            {/* amber bar waveform */}
            <div
              aria-hidden
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                height: 64,
                width: '100%',
                marginBottom: 56,
                opacity: playing ? 1 : 0.85,
                transition: 'opacity 360ms cubic-bezier(0.16,1,0.3,1)',
              }}
            >
              {waveBars.map((amp, i) => (
                <span
                  key={i}
                  style={{
                    flex: '1 1 0',
                    height: `${amp * 100}%`,
                    background: 'var(--warm)',
                    transition: 'height 360ms cubic-bezier(0.16,1,0.3,1)',
                  }}
                />
              ))}
            </div>

            {/* outlined play / pause ring with CSS triangle */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 48 }}>
              <button
                type="button"
                onClick={togglePlay}
                aria-label={playing ? 'Pause playback' : 'Play recording'}
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  border: '1px solid var(--warm)',
                  background: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'border-color 180ms cubic-bezier(0.16,1,0.3,1)',
                }}
              >
                {playing ? (
                  <span
                    aria-hidden
                    style={{ display: 'flex', gap: 5 }}
                  >
                    <span style={{ width: 3, height: 16, background: 'var(--warm)', display: 'block' }} />
                    <span style={{ width: 3, height: 16, background: 'var(--warm)', display: 'block' }} />
                  </span>
                ) : (
                  <span
                    aria-hidden
                    style={{
                      width: 0,
                      height: 0,
                      marginLeft: 4,
                      borderTop: '8px solid transparent',
                      borderBottom: '8px solid transparent',
                      borderLeft: '13px solid var(--warm)',
                      display: 'block',
                    }}
                  />
                )}
              </button>
            </div>

            {/* hidden audio element drives playback */}
            <audio
              ref={audioElRef}
              src={audioUrl}
              onEnded={() => setPlaying(false)}
              onPause={() => setPlaying(false)}
              style={{ display: 'none' }}
            />

            {/* quiet uppercase mono link — find better words → AI refine */}
            <div style={{ textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => setShowRefine(true)}
                disabled={transcribing}
                style={{
                  background: 'transparent',
                  border: 0,
                  padding: '0 0 2px',
                  cursor: transcribing ? 'default' : 'pointer',
                  color: 'var(--warm-dim)',
                  fontFamily: 'var(--mono)',
                  fontSize: 11,
                  letterSpacing: '0.3em',
                  textTransform: 'uppercase',
                  opacity: transcribing ? 0.5 : 1,
                  transition: 'color 180ms cubic-bezier(0.16,1,0.3,1)',
                }}
              >
                find better words
              </button>
            </div>
          </div>
        ) : null}

        {/* ── transcript (after recording stops) ────────────────── */}
        {recordingState === 'recorded' && transcribing ? (
          <div style={{ marginTop: 28, display: 'flex', justifyContent: 'center', width: '100%' }}>
            <ProgressHair label="listening to your words…" width={240} />
          </div>
        ) : null}

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
              color: 'var(--bone-faint)',
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

        {/* ── inline AI refine offer (parity with Write) ────────── */}
        {recordingState === 'recorded' && showRefine && transcript.trim() ? (
          <div style={{ marginTop: 20, width: '100%', maxWidth: 640, padding: '0 24px' }}>
            <VoiceRefine kind="memory" onPick={(text) => setTranscript(text)} />
          </div>
        ) : null}

        {/* ── save / discard row ────────────────────────────────── */}
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
                color: 'var(--bone-faint)',
                fontFamily: 'var(--mono)',
                fontSize: 10,
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                borderBottom: '1px solid var(--rule)',
              }}
            >
              let it fade
            </button>
          </div>
        ) : null}

        {/* ── error ─────────────────────────────────────────────── */}
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

      {/* ── sealed voice ceremony ─────────────────────────────────── */}
      {sealedCeremony && (
        <WeaveCeremony
          dye="saffron"
          entryDate={entryDate}
          seed={title || addresseeName || 'voice'}
          eyebrow="spoken · woven into the cloth"
          headline="Your voice is part of the cloth."
          footer={
            <span
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 11,
                color: 'var(--bone-faint)',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
              }}
            >
              {mm}:{ss} bound to the loom
            </span>
          }
        />
      )}
    </ClothShell>
  );
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function promptCard(): React.CSSProperties {
  return {
    background: 'transparent',
    border: 0,
    padding: 0,
    cursor: 'pointer',
    color: 'var(--bone-faint)',
    fontFamily: 'var(--mono)',
    fontSize: 13,
    letterSpacing: '0.12em',
  };
}
