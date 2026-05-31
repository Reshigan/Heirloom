import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { voiceApi } from '../services/api';
import { AppFrame } from '../loom/components/AppFrame';
import { ComposerModes } from '../loom/components/ComposerChrome';

/**
 * Record — ComposerSpeak (Claude Design · loom3).
 *
 * The voice mode, designed for the patriarch: one prompt, concentric breath
 * rings, an oversized mono timer, and two plain text controls (stop · pause).
 * Recording is the real MediaRecorder flow — start, pause/resume, stop —
 * uploaded via the signed URL and persisted with voiceApi.create. Title and
 * transcript move below the ring, quiet, for after you've spoken.
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

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
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
      const filename = `recording-${Date.now()}.webm`;
      const { data: upload } = await voiceApi.getUploadUrl({
        filename,
        contentType: 'audio/webm',
      });
      await fetch(upload.uploadUrl ?? upload.url, {
        method: 'PUT',
        body: audioBlob,
        headers: { 'Content-Type': 'audio/webm' },
      });
      const { data } = await voiceApi.create({
        title: title.trim() || PROMPTS[promptIdx],
        transcript: transcript.trim() || null,
        fileKey: upload.fileKey ?? upload.key,
        fileUrl: upload.publicUrl ?? upload.url,
        duration: elapsed,
        fileSize: audioBlob.size,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
      navigate('/memories');
    },
    onError: (err: any) => {
      setError(err?.message ?? 'Could not save the recording.');
    },
  });

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');
  const live = recordingState === 'recording' || recordingState === 'paused';

  return (
    <AppFrame>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <p className="loom-eyebrow" style={{ marginBottom: 18, color: 'var(--loom-warm)' }}>
          ∞ &nbsp; voice · in your own voice
        </p>
        <ComposerModes active="speak" />

        {/* the prompt + breath rings — the hero */}
        <div style={{ textAlign: 'center', padding: '24px 0 8px' }}>
          <p
            className="loom-serif"
            style={{
              fontSize: 22,
              fontStyle: 'italic',
              fontWeight: 400,
              color: 'var(--loom-bone-dim)',
              margin: '0 0 36px',
              minHeight: 30,
            }}
          >
            {PROMPTS[promptIdx]}
          </p>

          <button
            type="button"
            onClick={recordingState === 'idle' ? start : undefined}
            disabled={recordingState !== 'idle'}
            aria-label={recordingState === 'idle' ? 'Begin recording' : 'Recording'}
            style={{
              position: 'relative',
              width: 280,
              height: 280,
              margin: '0 auto',
              background: 'transparent',
              border: 0,
              padding: 0,
              cursor: recordingState === 'idle' ? 'pointer' : 'default',
              display: 'block',
            }}
          >
            <span
              style={{
                position: 'absolute',
                inset: 0,
                border: '1px solid var(--loom-bone-dim)',
                borderRadius: '50%',
                animation: recordingState === 'recording' ? 'loom-breathe 1400ms var(--loom-ease) infinite' : 'none',
              }}
            />
            <span
              style={{
                position: 'absolute',
                inset: 22,
                border: '1px solid var(--loom-bone-ghost)',
                borderRadius: '50%',
                animation: recordingState === 'recording' ? 'loom-breathe 1400ms var(--loom-ease) infinite 360ms' : 'none',
              }}
            />
            <span
              style={{
                position: 'absolute',
                inset: 56,
                border: '1px solid var(--loom-bone-faint)',
                borderRadius: '50%',
                opacity: 0.5,
                animation: recordingState === 'recording' ? 'loom-breathe 1400ms var(--loom-ease) infinite 720ms' : 'none',
              }}
            />
            <span
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              {recordingState === 'idle' ? (
                <span
                  className="loom-mono"
                  style={{
                    fontSize: 12,
                    letterSpacing: '0.28em',
                    textTransform: 'uppercase',
                    color: 'var(--loom-warm)',
                  }}
                >
                  begin
                </span>
              ) : (
                <span
                  className="loom-mono"
                  style={{
                    fontSize: 48,
                    letterSpacing: '0.04em',
                    color: recordingState === 'paused' ? 'var(--loom-bone-dim)' : 'var(--loom-bone)',
                  }}
                >
                  {mm}:{ss}
                </span>
              )}
            </span>
          </button>

          {/* controls */}
          <div style={{ marginTop: 36, display: 'flex', justifyContent: 'center', gap: 32, alignItems: 'center', minHeight: 30 }}>
            {live ? (
              <>
                <button type="button" onClick={stop} style={textLink('var(--loom-warm)', 22, true)}>
                  stop
                </button>
                <button type="button" onClick={togglePause} style={textLink('var(--loom-bone-dim)', 18, false)}>
                  {recordingState === 'paused' ? 'resume' : 'pause'}
                </button>
              </>
            ) : recordingState === 'recorded' ? (
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                {audioUrl ? <audio controls src={audioUrl} style={{ height: 36 }} /> : null}
                <button type="button" onClick={reset} className="loom-btn-ghost" style={{ padding: '8px 16px' }}>
                  redo
                </button>
              </div>
            ) : null}
          </div>

          {recordingState === 'idle' ? (
            <p
              className="loom-serif"
              style={{ marginTop: 24, color: 'var(--loom-bone-faint)', fontStyle: 'italic', fontSize: 15 }}
            >
              We'll transcribe it for you. You can read it back before saving.
            </p>
          ) : null}
        </div>

        {/* prompt cards row */}
        {recordingState === 'idle' ? (
          <div
            style={{
              margin: '28px 0 8px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'baseline',
              gap: 24,
              fontFamily: "'Source Serif 4', serif",
              fontStyle: 'italic',
              fontSize: 15,
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              onClick={() => setPromptIdx((i) => (i - 1 + PROMPTS.length) % PROMPTS.length)}
              style={{ ...promptCard(), opacity: 0.4 }}
            >
              ← {PROMPTS[(promptIdx - 1 + PROMPTS.length) % PROMPTS.length]}
            </button>
            <button
              type="button"
              onClick={() => setPromptIdx((i) => (i + 1) % PROMPTS.length)}
              style={{ ...promptCard(), opacity: 0.4 }}
            >
              {PROMPTS[(promptIdx + 1) % PROMPTS.length]} →
            </button>
          </div>
        ) : null}

        <hr className="loom-hairline" style={{ margin: '36px 0' }} />

        {/* title + transcript — quiet, for after */}
        <div style={{ display: 'grid', gap: 28 }}>
          <label>
            <span className="loom-eyebrow" style={{ display: 'block', marginBottom: 8, fontSize: 10 }}>
              title
            </span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What this recording is about, in a sentence"
            />
          </label>

          <label>
            <span className="loom-eyebrow" style={{ display: 'block', marginBottom: 8, fontSize: 10 }}>
              transcript — optional
            </span>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Type a few words or paste the transcript. The loom can transcribe the audio later."
              rows={6}
              style={{ minHeight: 140 }}
            />
          </label>
        </div>

        {error ? (
          <p role="alert" className="loom-body" style={{ marginTop: 24, fontStyle: 'italic', color: '#c25a5a', fontSize: 14 }}>
            {error}
          </p>
        ) : null}

        <div
          style={{
            marginTop: 48,
            paddingTop: 24,
            borderTop: '1px solid var(--loom-rule)',
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 24,
            flexWrap: 'wrap',
          }}
        >
          <p
            className="loom-mono"
            style={{
              margin: 0,
              fontSize: 10,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--loom-bone-faint)',
              maxWidth: 480,
            }}
          >
            captured locally · uploaded encrypted · the recording goes into your thread alongside the transcript
          </p>
          <div style={{ display: 'flex', gap: 16 }}>
            <button type="button" onClick={() => navigate('/memories')} className="loom-btn-ghost">
              cancel
            </button>
            <button
              type="button"
              onClick={() => save.mutate()}
              disabled={save.isPending || !audioBlob}
              className="loom-btn"
              style={{ opacity: save.isPending || !audioBlob ? 0.5 : 1 }}
            >
              {save.isPending ? 'saving…' : 'save voice entry'}
            </button>
          </div>
        </div>
      </div>
    </AppFrame>
  );
}

function textLink(color: string, fontSize: number, underline: boolean): React.CSSProperties {
  return {
    background: 'transparent',
    border: 0,
    padding: underline ? '0 0 3px' : 0,
    cursor: 'pointer',
    color,
    fontFamily: "'Inter', sans-serif",
    fontSize,
    fontWeight: 400,
    letterSpacing: '-0.005em',
    borderBottom: underline ? '1px solid currentColor' : 0,
  };
}

function promptCard(): React.CSSProperties {
  return {
    background: 'transparent',
    border: 0,
    padding: 0,
    cursor: 'pointer',
    color: 'var(--loom-bone-faint)',
    fontFamily: "'Source Serif 4', serif",
    fontStyle: 'italic',
    fontSize: 15,
    maxWidth: '22ch',
    textAlign: 'center',
  };
}
