import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { voiceApi } from '../services/api';
import { AppFrame } from '../loom/components/AppFrame';

/**
 * Record — Loom-native rewrite.
 *
 * One large mic button, an elapsed-time counter, a title field, a
 * transcript (manual for now). Recording uses the standard
 * MediaRecorder API; the file is uploaded via voiceApi.getUploadUrl
 * + PUT, then voiceApi.create persists the metadata. Same upload
 * flow as the v1/v2 page; only the chrome changes.
 *
 * The previous page (1383 lines) included prompts, recipient
 * pickers, year/emotion filters, AI suggestions. Those move into
 * /interview and the More menu; this surface is the daily quick
 * record and stays sharp.
 */
export function Record() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [transcript, setTranscript] = useState('');
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'recorded'>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

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
      tickRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } catch {
      setError('We could not start the microphone. Check your browser permissions.');
    }
  };

  const stop = () => {
    mediaRecorderRef.current?.stop();
    setRecordingState('recorded');
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
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
      // Upload to R2 / S3 via the signed URL the worker returned.
      await fetch(upload.uploadUrl ?? upload.url, {
        method: 'PUT',
        body: audioBlob,
        headers: { 'Content-Type': 'audio/webm' },
      });
      const { data } = await voiceApi.create({
        title: title.trim() || 'untitled recording',
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

  return (
    <AppFrame>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <p className="loom-eyebrow" style={{ marginBottom: 22, color: 'var(--loom-warm)' }}>
          ∿ &nbsp; voice · in your own voice
        </p>

        <h1
          className="loom-h2"
          style={{ fontSize: 'clamp(32px, 4vw, 44px)', fontWeight: 300, fontStyle: 'italic', margin: '0 0 14px' }}
        >
          Speak to the thread.
        </h1>
        <p
          className="loom-body"
          style={{ fontSize: 17, color: 'var(--loom-bone-dim)', margin: '0 0 56px', maxWidth: 580, lineHeight: 1.6 }}
        >
          The fastest way to add a memory is to say it aloud. Tap the circle, talk for as long as
          you like, stop when you're done. Add the title afterward.
        </p>

        {/* The mic */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 56 }}>
          <button
            type="button"
            onClick={recordingState === 'recording' ? stop : recordingState === 'idle' ? start : undefined}
            disabled={recordingState === 'recorded'}
            style={{
              width: 132,
              height: 132,
              borderRadius: '50%',
              border: '2px solid var(--loom-warm)',
              background: recordingState === 'recording' ? 'var(--loom-warm)' : 'transparent',
              color: recordingState === 'recording' ? 'var(--loom-ink)' : 'var(--loom-warm)',
              cursor: recordingState === 'recorded' ? 'default' : 'pointer',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              transition: 'all 220ms cubic-bezier(0.16,1,0.3,1)',
              animation: recordingState === 'recording' ? 'loom-breathe 2.4s ease-in-out infinite' : 'none',
            }}
          >
            {recordingState === 'idle' ? 'Record' : recordingState === 'recording' ? 'Stop' : 'Done'}
          </button>
          <p
            className="loom-mono"
            style={{
              marginTop: 18,
              fontSize: 14,
              letterSpacing: '0.06em',
              color: recordingState === 'recording' ? 'var(--loom-warm)' : 'var(--loom-bone-faint)',
            }}
          >
            {mm}:{ss} {recordingState === 'recording' ? '· recording' : recordingState === 'recorded' ? '· captured' : '· ready'}
          </p>
          {audioUrl && recordingState === 'recorded' ? (
            <div style={{ marginTop: 24, display: 'flex', gap: 16, alignItems: 'center' }}>
              <audio controls src={audioUrl} style={{ height: 36 }} />
              <button type="button" onClick={reset} className="loom-btn-ghost" style={{ padding: '8px 16px' }}>
                redo
              </button>
            </div>
          ) : null}
        </div>

        <hr className="loom-hairline" style={{ marginBottom: 36 }} />

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
            marginTop: 56,
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
              letterSpacing: '0.18em',
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
