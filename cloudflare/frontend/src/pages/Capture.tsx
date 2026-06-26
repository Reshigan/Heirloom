import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  memoriesApi,
  lettersApi,
  voiceApi,
  familyApi,
  aiApi,
  getAuthHeaders,
} from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { usePageMeta } from '../lib/usePageMeta';
import { ClothShell } from '../loom/components/ClothShell';
import { RecipientPicker } from '../loom/components/RecipientPicker';
import { WeaveCeremony } from '../loom/components/WeaveCeremony';
import { uploadMemoryImage, validateImage } from '../utils/uploadImage';
import { enqueueVoice } from '../lib/voiceOfflineQueue';

/**
 * Capture — the voice-first single-screen cockpit (The Deep · Component A).
 *
 * One surface replaces the old multi-route capture. Speak is the default: the
 * recording transcribes into an editable body, which settles as a Memory (no
 * recipient) or a Letter (recipient set) — or you keep it as voice, attach a
 * picture, or write instead. Advanced scheduling/editing stays in /compose.
 *
 * Memory default: empty "to:" → memoriesApi; a named recipient → lettersApi
 * (IMMEDIATE). A photo always settles as a Memory.
 */

const MAX_RECORDING_SECS = 120; // 2 min — hairline progress + auto-stop

type RecState = 'idle' | 'recording' | 'paused' | 'recorded';

export function Capture() {
  usePageMeta('Capture');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();

  // ── content ───────────────────────────────────────────────────────────
  const [body, setBody] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientId, setRecipientId] = useState<string | null>(null);
  const [entryDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  // ── voice ─────────────────────────────────────────────────────────────
  const [recState, setRecState] = useState<RecState>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [keepAsVoice, setKeepAsVoice] = useState(false);
  const [transcribing, setTranscribing] = useState(false);

  // ── photo ─────────────────────────────────────────────────────────────
  const [photo, setPhoto] = useState<{ fileKey: string; fileUrl: string; fileSize: number; mimeType: string } | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // ── flow ──────────────────────────────────────────────────────────────
  const [writing, setWriting] = useState(false); // "write instead" — skip the record ring
  const [held, setHeld] = useState(false); // offline-held voice notice
  const [woven, setWoven] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bodyRef = useRef<HTMLTextAreaElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mimeTypeRef = useRef<string>('audio/webm');
  const streamRef = useRef<MediaStream | null>(null);
  const navTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // A photo always settles as a Memory; recipient only routes text/voice.
  const isLetter = !photo && !!(recipientId || recipientName.trim());
  const hasContent = body.trim().length > 0 || !!audioBlob || !!photo;

  const { data: familyData } = useQuery({
    queryKey: ['family'],
    queryFn: familyApi.list,
    enabled: isAuthenticated,
  });
  const familyMembers: { id: string; name: string; relationship?: string | null }[] =
    Array.isArray(familyData) ? familyData : [];

  // ── cleanup ───────────────────────────────────────────────────────────
  useEffect(() => () => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (navTimer.current) clearTimeout(navTimer.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') mediaRecorderRef.current.stop();
  }, []);
  useEffect(() => () => { if (audioUrl) URL.revokeObjectURL(audioUrl); }, [audioUrl]);
  useEffect(() => () => { if (photoPreview) URL.revokeObjectURL(photoPreview); }, [photoPreview]);

  // Auto-stop at the 2-minute ceiling.
  useEffect(() => {
    if (elapsed >= MAX_RECORDING_SECS && recState === 'recording') stop();
  }, [elapsed, recState]); // eslint-disable-line react-hooks/exhaustive-deps

  const startTick = () => { tickRef.current = setInterval(() => setElapsed((e) => e + 1), 1000); };
  const stopTick = () => { if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; } };

  const autoTranscribe = useCallback(async (blob: Blob) => {
    setTranscribing(true);
    try {
      const dataUrl = await blobToDataUrl(blob);
      const res = await aiApi.transcribe({ audioUrl: dataUrl });
      const heard = (res.data?.transcript || '').trim();
      if (heard) setBody(heard);
      else setError("Couldn't transcribe — keep it as voice, or write the words yourself.");
    } catch {
      setError("Couldn't transcribe — keep it as voice, or write the words yourself.");
    } finally {
      setTranscribing(false);
    }
  }, []);

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const supported = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']
        .find((t) => MediaRecorder.isTypeSupported(t)) ?? '';
      mimeTypeRef.current = supported || 'audio/webm';
      const recorder = new MediaRecorder(stream, { ...(supported ? { mimeType: supported } : {}), audioBitsPerSecond: 64_000 });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
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
      setRecState('recording');
      startTick();
    } catch {
      setError('We could not start the microphone. Check your browser permissions.');
    }
  };

  const togglePause = () => {
    const r = mediaRecorderRef.current;
    if (!r) return;
    if (recState === 'recording') { r.pause(); stopTick(); setRecState('paused'); }
    else if (recState === 'paused') { r.resume(); startTick(); setRecState('recording'); }
  };

  function stop() {
    mediaRecorderRef.current?.stop();
    setRecState('recorded');
    stopTick();
  }

  const resetVoice = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setElapsed(0);
    setRecState('idle');
    setKeepAsVoice(false);
    setTranscribing(false);
    setError(null);
  };

  const pickPhoto = useCallback(async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    const bad = validateImage(file);
    if (bad) { setError(bad); return; }
    setError(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(URL.createObjectURL(file));
    setUploadingPhoto(true);
    try {
      const up = await uploadMemoryImage(file);
      setPhoto(up);
    } catch (e: any) {
      setError(e?.message ?? 'Could not add the picture.');
      setPhotoPreview(null);
    } finally {
      setUploadingPhoto(false);
    }
  }, [photoPreview]);

  // ── save ────────────────────────────────────────────────────────────────
  const save = useMutation<{ held: boolean }, unknown, void>({
    mutationFn: async () => {
      // 1. Voice kept as voice.
      if (audioBlob && keepAsVoice) {
        const mime = mimeTypeRef.current || audioBlob.type || 'audio/webm';
        const ext = mime.includes('mp4') ? 'm4a' : mime.includes('ogg') ? 'ogg' : 'webm';
        const contentType = mime.split(';')[0];
        const filename = `recording-${Date.now()}.${ext}`;
        const clientKey = randomKey();
        const metadata = {
          to: recipientName.trim() || undefined,
          recipientId: recipientId || undefined,
          entryDate,
        };
        const holdToQueue = async () => {
          try {
            await enqueueVoice({
              blob: audioBlob, filename, contentType,
              title: deriveTitle(body) || 'A voice',
              transcript: body.trim() || null,
              duration: elapsed, metadata, legacyRecipientIds: [], clientKey,
            });
          } catch {
            throw new Error("This device can't hold the recording offline (private mode or no storage). Stay on this screen and try again once you have a connection.");
          }
          return { held: true };
        };
        if (typeof navigator !== 'undefined' && navigator.onLine === false) return holdToQueue();
        let upload: any;
        try {
          ({ data: upload } = await voiceApi.getUploadUrl({ filename, contentType }));
        } catch (err) { if (isNetworkError(err)) return holdToQueue(); throw err; }
        let res: Response;
        try {
          res = await fetch(upload.uploadUrl ?? upload.url, {
            method: 'PUT', body: audioBlob,
            headers: { 'Content-Type': contentType, ...getAuthHeaders() },
          });
        } catch (err) { if (isNetworkError(err)) return holdToQueue(); throw err; }
        if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
        try {
          await voiceApi.create({
            title: deriveTitle(body) || 'A voice',
            transcript: body.trim() || null,
            fileKey: upload.fileKey ?? upload.key,
            fileUrl: upload.publicUrl ?? upload.url,
            duration: elapsed, fileSize: audioBlob.size,
            legacyRecipientIds: [], clientKey, metadata,
          });
        } catch (err) { if (isNetworkError(err)) return holdToQueue(); throw err; }
        return { held: false };
      }

      // 2. Letter (recipient set, no photo).
      if (isLetter) {
        await lettersApi.create({
          title: deriveTitle(body) || `A letter to ${recipientName.trim()}`,
          salutation: recipientName.trim() ? `To ${recipientName.trim()},` : null,
          body: body.trim(),
          signature: null,
          deliveryTrigger: 'IMMEDIATE',
          scheduledDate: null,
          recipientIds: recipientId ? [recipientId] : [],
          legacyRecipientIds: [],
        });
        return { held: false };
      }

      // 3. Memory — text or photo.
      await memoriesApi.create({
        type: photo ? 'PHOTO' : 'TEXT',
        title: deriveTitle(body) || (photo ? 'A picture' : 'untitled'),
        description: body.trim(),
        fileKey: photo?.fileKey,
        fileUrl: photo?.fileUrl,
        fileSize: photo?.fileSize,
        mimeType: photo?.mimeType,
        legacyRecipientIds: [],
        metadata: {
          entryDate,
          ...(photo ? { images: [photo] } : {}),
        },
      });
      return { held: false };
    },
    onSuccess: (result) => {
      if (result.held) {
        setHeld(true);
        navTimer.current = setTimeout(() => navigate('/loom/weft'), 2600);
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['memories-mosaic'] });
      queryClient.invalidateQueries({ queryKey: ['weft-memories'] });
      queryClient.invalidateQueries({ queryKey: ['weft-voice'] });
      queryClient.invalidateQueries({ queryKey: ['weft-letters'] });
      queryClient.invalidateQueries({ queryKey: ['new-user-check-memories'] });
      queryClient.invalidateQueries({ queryKey: ['new-user-check-voice'] });
      queryClient.invalidateQueries({ queryKey: ['new-user-check-letters'] });
      setWoven(true);
    },
    onError: (err: unknown) => {
      setError(err instanceof Error ? err.message : 'Could not let it settle.');
    },
  });

  // ── seal (press-and-hold 720ms) ───────────────────────────────────────
  const [holding, setHolding] = useState(false);
  const [holdHint, setHoldHint] = useState(false);
  const sealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busy = save.isPending || uploadingPhoto || transcribing;
  const submitDisabled = busy || !hasContent;

  const clearSealTimer = useCallback(() => {
    if (sealTimer.current) { clearTimeout(sealTimer.current); sealTimer.current = null; }
  }, []);
  const validate = useCallback((): boolean => {
    setError(null);
    if (uploadingPhoto) { setError('Wait for the picture to finish.'); return false; }
    if (!hasContent) { setError('Speak, write, or add a picture first.'); return false; }
    return true;
  }, [uploadingPhoto, hasContent]);
  const startHold = useCallback(() => {
    if (submitDisabled) return;
    if (!validate()) return;
    clearSealTimer();
    setHoldHint(false);
    setHolding(true);
    sealTimer.current = setTimeout(() => { sealTimer.current = null; setHolding(false); save.mutate(); }, 720);
  }, [submitDisabled, validate, clearSealTimer, save]);
  const cancelHold = useCallback(() => {
    const cutShort = sealTimer.current !== null && holding;
    clearSealTimer();
    setHolding(false);
    if (cutShort) setHoldHint(true);
  }, [clearSealTimer, holding]);
  const commitSeal = useCallback(() => {
    clearSealTimer();
    setHolding(false);
    if (submitDisabled || !validate()) return;
    save.mutate();
  }, [clearSealTimer, submitDisabled, validate, save]);
  useEffect(() => () => clearSealTimer(), [clearSealTimer]);

  const ceremonyCopy = useMemo(() => {
    if (isLetter) return { eyebrow: 'lowered into the Deep', headline: `Your letter to ${recipientName.trim() || 'them'} has settled.` };
    if (audioBlob && keepAsVoice) return { eyebrow: 'lowered into the Deep', headline: 'Your voice has settled into the Deep.' };
    return { eyebrow: 'lowered into the Deep', headline: 'It has settled into the Deep.' };
  }, [isLetter, audioBlob, keepAsVoice, recipientName]);

  if (woven) {
    return (
      <WeaveCeremony
        dye="indigo"
        entryDate={entryDate}
        seed={deriveTitle(body) || recipientName || 'thread'}
        eyebrow={ceremonyCopy.eyebrow}
        headline={ceremonyCopy.headline}
      />
    );
  }

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');
  const live = recState === 'recording' || recState === 'paused';
  const progress = live ? Math.min(elapsed / MAX_RECORDING_SECS, 1) : 0;
  const showRecordRing = recState === 'idle' && !audioBlob && !writing && !photo;
  const showBody = writing || recState === 'recorded' || !!photo || transcribing;

  return (
    <ClothShell
      topbarLeft={<Link to="/loom/weft" style={crumb}>← the deep</Link>}
      topbarCenter="capture"
    >
      {live && (
        <div aria-hidden="true" style={{ position: 'absolute', top: 0, left: 0, height: 1, width: `${progress * 100}%`, background: 'var(--bone-dim)', transition: 'width 720ms var(--ease)', zIndex: 30 }} />
      )}

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '8vh 24px 96px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}>

        {/* ── the record ring (idle) ─────────────────────────────── */}
        {showRecordRing && (
          <>
            <p style={{ ...mono, color: 'var(--bone-faint)', textAlign: 'center' }}>speak, and let it settle</p>
            <button
              type="button"
              onClick={startRecording}
              aria-label="Record a voice memory"
              style={{
                width: 132, height: 132, borderRadius: '50%',
                border: '1px solid var(--warm)', background: 'transparent',
                color: 'var(--warm)', cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--serif)', fontSize: 15, fontStyle: 'italic',
                transition: 'border-color 360ms var(--ease), color 360ms var(--ease)',
              }}
            >
              speak
            </button>
            <div style={{ display: 'flex', gap: 28, marginTop: 4 }}>
              <button type="button" onClick={() => { setWriting(true); setTimeout(() => bodyRef.current?.focus(), 40); }} style={ghost}>write instead</button>
              <button type="button" onClick={() => fileRef.current?.click()} style={ghost}>add a picture</button>
            </div>
          </>
        )}

        {/* ── recording / paused ─────────────────────────────────── */}
        {live && (
          <>
            <div aria-live="polite" style={{ fontFamily: 'var(--mono)', fontSize: 48, letterSpacing: '0.04em', color: 'var(--bone)' }}>{mm}:{ss}</div>
            <div style={{ display: 'flex', gap: 28 }}>
              <button type="button" onClick={togglePause} style={ghost}>{recState === 'paused' ? 'resume' : 'pause'}</button>
              <button type="button" onClick={stop} style={{ ...ghost, color: 'var(--warm)' }}>done</button>
            </div>
          </>
        )}

        {/* ── transcribing / recorded / write / photo ────────────── */}
        {showBody && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 18 }}>
            {transcribing && <p style={{ ...mono, color: 'var(--bone-faint)', textAlign: 'center' }}>listening back…</p>}

            {photoPreview && (
              <img src={photoPreview} alt="" style={{ width: '100%', maxHeight: 320, objectFit: 'cover', border: '1px solid var(--rule)', opacity: uploadingPhoto ? 0.6 : 1 }} />
            )}

            <textarea
              ref={bodyRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={photo ? 'A word about this picture (optional)…' : 'The words, as you remember them…'}
              aria-label="Memory content"
              rows={photo ? 3 : 7}
              style={{
                width: '100%', resize: 'vertical', background: 'transparent', border: 0, outline: 'none',
                fontFamily: 'var(--serif)', fontSize: 19, lineHeight: 1.85, color: 'var(--bone)',
              }}
            />

            {audioUrl && !writing && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
                <audio src={audioUrl} controls style={{ height: 32 }} />
                <label style={{ ...mono, color: 'var(--bone-dim)', display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', minHeight: 44 }}>
                  <input type="checkbox" checked={keepAsVoice} onChange={(e) => setKeepAsVoice(e.target.checked)} />
                  keep as voice
                </label>
                <button type="button" onClick={resetVoice} style={ghost}>re-record</button>
              </div>
            )}

            {!photo && (
              <button type="button" onClick={() => fileRef.current?.click()} style={{ ...ghost, alignSelf: 'flex-start' }}>add a picture</button>
            )}
          </div>
        )}

        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { pickPhoto(e.target.files); e.target.value = ''; }} />

        {/* ── recipient (optional, hidden for photos) ────────────── */}
        {showBody && !photo && (
          <div style={{ width: '100%' }}>
            <RecipientPicker
              members={familyMembers}
              name={recipientName}
              selectedId={recipientId}
              onChange={(name, id) => { setRecipientName(name); setRecipientId(id); }}
              label="to"
              placeholder="someone in your bloodline (optional)"
            />
            <p style={{ ...mono, color: 'var(--bone-faint)', marginTop: 8 }}>
              {isLetter ? 'this becomes a letter, sent to them' : 'leave empty and it settles as a memory'}
            </p>
          </div>
        )}

        {/* ── status ─────────────────────────────────────────────── */}
        {error && <p role="alert" style={{ fontFamily: 'var(--serif)', fontSize: 15, color: 'var(--warm)', textAlign: 'center' }}>{error}</p>}
        {held && <p role="status" style={{ fontFamily: 'var(--serif)', fontSize: 15, color: 'var(--bone-dim)', textAlign: 'center' }}>Held safely — it will settle once you are back online.</p>}

        {/* ── seal ───────────────────────────────────────────────── */}
        {showBody && (
          <button
            type="button"
            disabled={submitDisabled}
            onPointerDown={startHold}
            onPointerUp={cancelHold}
            onPointerLeave={cancelHold}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); commitSeal(); } }}
            aria-label="Let it settle"
            style={{
              position: 'relative', overflow: 'hidden', marginTop: 8,
              minWidth: 220, minHeight: 52, padding: '0 28px',
              border: '1px solid var(--warm)', background: 'transparent',
              color: submitDisabled ? 'var(--bone-faint)' : 'var(--warm)',
              cursor: submitDisabled ? 'default' : 'pointer',
              fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 17,
              opacity: submitDisabled ? 0.5 : 1,
            }}
          >
            <span aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'var(--warm-glow)', transformOrigin: 'left', transform: `scaleX(${holding ? 1 : 0})`, transition: holding ? 'transform 720ms var(--ease)' : 'none' }} />
            <span style={{ position: 'relative' }}>
              {save.isPending ? 'settling…' : holdHint ? 'keep holding…' : 'let it settle →'}
            </span>
          </button>
        )}

        <Link to="/compose" style={{ ...mono, color: 'var(--bone-faint)', textDecoration: 'none', marginTop: 4 }}>more options →</Link>
      </div>
    </ClothShell>
  );
}

export default Capture;

/* ─── styles ──────────────────────────────────────────────────────────── */
const mono: React.CSSProperties = { fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase' };
const crumb: React.CSSProperties = { ...mono, color: 'var(--bone-faint)', textDecoration: 'none' };
const ghost: React.CSSProperties = { ...mono, background: 'none', border: 0, color: 'var(--bone-dim)', cursor: 'pointer', minHeight: 44, display: 'inline-flex', alignItems: 'center', padding: 0 };

/* ─── helpers (copied lean from Compose/Record to keep this page standalone) ─ */
function deriveTitle(text: string): string {
  const t = text.trim().replace(/\s+/g, ' ');
  if (!t) return '';
  const first = (t.split(/(?<=[.!?])\s/)[0] || t).split('\n')[0].trim();
  const c = first || t;
  if (c.length <= 48) return c.replace(/[.!?,;:\s]+$/, '');
  const clip = c.slice(0, 48);
  const sp = clip.lastIndexOf(' ');
  return (sp > 24 ? clip.slice(0, sp) : clip).replace(/[.!?,;:\s]+$/, '') + '…';
}
function randomKey(): string {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `vk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}
function isNetworkError(err: unknown): boolean {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true;
  if (err instanceof TypeError) return true;
  const e = err as { code?: string; response?: unknown; request?: unknown; message?: string } | null;
  if (!e) return false;
  if (e.code === 'ERR_NETWORK' || e.code === 'ECONNABORTED') return true;
  if (e.request && !e.response) return true;
  const msg = (e.message ?? '').toLowerCase();
  return msg.includes('failed to fetch') || msg.includes('load failed') || msg.includes('network');
}
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
