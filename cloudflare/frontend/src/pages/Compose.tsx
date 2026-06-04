import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { memoriesApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { HLogo } from '../loom/components/HLogo';
import { TapestryCanvas } from '../loom/components/TapestryCanvas';
import type { CanvasEntry } from '../loom/components/TapestryCanvas';
import {
  ComposerModes,
  ComposerRail,
  DyeControl,
  DyeSuggestButton,
  ListenerLine,
  VisibilityControl,
  useListenerAI,
  type Visibility,
} from '../loom/components/ComposerChrome';

/**
 * Compose — ComposerPaper (§6.3).
 *
 * A single Source Serif 4 column. You write for someone — yourself, your
 * family, a friend, those not yet born. Who it's for shapes the wording;
 * the Listener reads the draft and offers a phrase that fits.
 *
 * Emotional order: for whom → when → what → how it's kept.
 */

/* ─── Addressee quick-select ─────────────────────────────────────────── */
type AddresseeType = 'self' | 'family' | 'friend' | 'future';

const ADDRESSEES: { key: AddresseeType; label: string; hint: string }[] = [
  { key: 'self',   label: 'myself',     hint: 'a note to who you are right now' },
  { key: 'family', label: 'family',     hint: 'your bloodline reads this together' },
  { key: 'friend', label: 'a friend',   hint: 'someone specific — name them below' },
  { key: 'future', label: 'the future', hint: 'someone not yet born will find this' },
];

function AddresseeSelect({
  type,
  name,
  onTypeChange,
  onNameChange,
}: {
  type: AddresseeType;
  name: string;
  onTypeChange: (t: AddresseeType) => void;
  onNameChange: (n: string) => void;
}) {
  const needsName = type === 'friend' || type === 'family';
  const hint = ADDRESSEES.find(a => a.key === type)?.hint ?? '';

  return (
    <div style={{ marginBottom: 28 }}>
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: 'var(--bone-faint)',
          marginBottom: 10,
        }}
      >
        for
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 0, marginBottom: 6 }}>
        {ADDRESSEES.map((a, i) => (
          <span key={a.key} style={{ display: 'inline-flex', alignItems: 'baseline' }}>
            <button
              type="button"
              onClick={() => onTypeChange(a.key)}
              style={{
                background: 'transparent',
                border: 0,
                padding: '4px 0',
                cursor: 'pointer',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 13,
                letterSpacing: '0.12em',
                color: a.key === type ? 'var(--bone)' : 'var(--bone-faint)',
                transition: 'color 180ms var(--ease)',
                minHeight: 36,
              }}
            >
              {a.label}
            </button>
            {i < ADDRESSEES.length - 1 && (
              <span style={{ color: 'var(--bone-faint)', margin: '0 10px', fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>·</span>
            )}
          </span>
        ))}
      </div>

      {needsName && (
        <input
          value={name}
          onChange={e => onNameChange(e.target.value)}
          placeholder={type === "friend" ? "their name…" : "a name (optional)"}
          style={{
            display: 'block',
            width: '100%',
            maxWidth: '28ch',
            border: 0,
            borderBottom: '1px solid var(--rule)',
            background: 'transparent',
            color: 'var(--bone)',
            caretColor: 'var(--warm)',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 16,
            letterSpacing: '0.04em',
            padding: '6px 0 4px',
            outline: 'none',
            transition: 'border-color 180ms var(--ease)',
          }}
          onFocus={e => (e.currentTarget.style.borderColor = 'var(--warm)')}
          onBlur={e => (e.currentTarget.style.borderColor = 'var(--rule)')}
        />
      )}

      <div
        style={{
          marginTop: 6,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          color: 'var(--bone-faint)',
          letterSpacing: '0.04em',
          fontStyle: 'italic',
        }}
      >
        {hint}
      </div>
    </div>
  );
}

/* ─── Date selector ──────────────────────────────────────────────────── */
function EntryDateField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const formatted = value
    ? new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
      })
    : '';

  return (
    <div style={{ marginBottom: 32 }}>
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: 'var(--bone-faint)',
          marginBottom: 8,
        }}
      >
        on
      </div>
      {/* Overlay pattern: formatted text is visible; input is absolutely positioned
          over it at full opacity:0 so it catches taps without showing native chrome.
          iOS Safari requires a real visible input — opacity:0 satisfies that. */}
      <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--rule)', paddingBottom: 2 }}>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 13,
            letterSpacing: '0.06em',
            color: 'var(--bone-dim)',
          }}
        >
          {formatted}
        </span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--bone-faint)', letterSpacing: '0.14em' }}>↗</span>
        <input
          type="date"
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0,
            cursor: 'pointer',
            width: '100%',
            height: '100%',
          }}
        />
      </div>
    </div>
  );
}

/* ─── Draft persistence ─────────────────────────────────────────────── */
const DRAFT_PREFIX = 'hl-compose-draft:'; // namespaced by user id — prevents cross-user leakage on shared devices
type DraftData = { title?: string; body?: string; addresseeType?: AddresseeType; addresseeName?: string; entryDate?: string };
function readDraft(key: string): DraftData {
  try { const r = localStorage.getItem(key); return r ? (JSON.parse(r) as DraftData) : {}; }
  catch { return {}; }
}

/* ─── Main Compose page ──────────────────────────────────────────────── */
export function Compose() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const draftKey = `${DRAFT_PREFIX}${user?.id ?? 'anon'}`;

  const [addresseeType, setAddresseeType] = useState<AddresseeType>(() => (readDraft(draftKey).addresseeType ?? 'family') as AddresseeType);
  const [addresseeName, setAddresseeName] = useState(() => readDraft(draftKey).addresseeName ?? '');
  const [entryDate, setEntryDate] = useState(() => readDraft(draftKey).entryDate ?? new Date().toISOString().slice(0, 10));
  const [title, setTitle] = useState(() => readDraft(draftKey).title ?? '');
  const [body, setBody] = useState(() => readDraft(draftKey).body ?? '');
  const [visibility, setVisibility] = useState<Visibility>('family');
  const [dye, setDye] = useState('walnut');
  const [error, setError] = useState<string | null>(null);
  const [woven, setWoven] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [writingFocused, setWritingFocused] = useState(false);
  const wovenAtRef = useRef<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 80);
    return () => clearTimeout(t);
  }, []);

  // Auto-expand textarea with content
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [body]);

  // Autosave draft to localStorage — debounced 800ms; cleared on successful save
  useEffect(() => {
    if (woven) return;
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    draftTimerRef.current = setTimeout(() => {
      if (body.trim() || title.trim()) {
        localStorage.setItem(draftKey, JSON.stringify({ addresseeType, addresseeName, entryDate, title, body }));
      } else {
        localStorage.removeItem(draftKey);
      }
    }, 800);
    return () => { if (draftTimerRef.current) clearTimeout(draftTimerRef.current); };
  }, [body, title, addresseeType, addresseeName, entryDate, woven, draftKey]);

  // Guard browser tab close when there's unsaved content within the debounce window
  useEffect(() => {
    if (!body.trim() || woven) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); return (e.returnValue = ''); };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [body, woven]);

  const wordCount = body.trim() ? body.trim().split(/\s+/).length : 0;

  const ease = 'cubic-bezier(0.16,1,0.3,1)';

  const handleBodyChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBody(e.target.value);
  }, []);

  // Navigate to memories after the "woven" celebration fades
  useEffect(() => {
    if (!woven) return;
    wovenAtRef.current = performance.now();
    const t = setTimeout(() => navigate('/memories'), 4200);
    return () => clearTimeout(t);
  }, [woven, navigate]);

  // The resolved "to" value for AI and metadata
  const toValue =
    addresseeType === 'self' ? 'myself' :
    addresseeType === 'future' ? 'the future' :
    addresseeName.trim() || (addresseeType === 'family' ? 'family' : undefined);

  const { suggestion, loading: listenerLoading, refresh: listenerRefresh } =
    useListenerAI(body, toValue);

  const save = useMutation({
    mutationFn: () =>
      memoriesApi
        .create({
          type: 'LETTER',
          title: title.trim() || 'untitled',
          description: body.trim(),
          metadata: {
            visibility,
            dye,
            dyeMotif: dye,
            to: toValue,
            entryDate,
          },
        })
        .then(r => r.data),
    onSuccess: () => {
      localStorage.removeItem(draftKey);
      queryClient.invalidateQueries({ queryKey: ['memories-mosaic'] });
      setWoven(true);
    },
    onError: (err: any) => {
      setError(err?.response?.data?.error ?? 'Could not save the entry.');
    },
  });

  // Flush draft immediately on cancel so in-flight debounce doesn't race navigation
  const handleCancel = useCallback(() => {
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    if ((body.trim() || title.trim()) && !woven) {
      localStorage.setItem(draftKey, JSON.stringify({ addresseeType, addresseeName, entryDate, title, body }));
    }
    navigate('/memories');
  }, [body, title, addresseeType, addresseeName, entryDate, woven, navigate, draftKey]);

  if (woven) {
    // Synthetic entry representing the just-woven memory
    const wovenEntry: CanvasEntry = {
      date: new Date(entryDate),
      n: Math.abs(title.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) || 42,
      dye,
      tier: 'family',
    };

    return (
      <div style={{ position: 'absolute', inset: 0, background: 'var(--ink)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        {/* Tapestry weave-in flash — new thread lighting up */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
          <TapestryCanvas
            height={72}
            entries={[wovenEntry]}
            kind="specimen"
            animate
            newEntryAt={wovenAtRef.current}
            opts={{
              tStart: new Date(+new Date(entryDate) - 86400000 * 180),
              tEnd:   new Date(+new Date(entryDate) + 86400000 * 180),
              background: '#0e0e0c',
              warpEvery: 9,
              showDecadeMarks: false,
              showFraySelvedge: false,
              showWarpHair: false,
            }}
          />
        </div>
        <p style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--warm)', margin: '0 0 20px' }}>
          woven into the thread
        </p>
        <p style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(22px, 4vw, 36px)', fontWeight: 300, color: 'var(--bone)', textAlign: 'center', lineHeight: 1.3, margin: '0 0 40px', maxWidth: 480 }}>
          Your memory is part of the cloth.
        </p>
        <div style={{ borderTop: '1px solid var(--rule)', paddingTop: 28, textAlign: 'center', maxWidth: 400 }}>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--bone-faint)', margin: '0 0 16px' }}>
            threads grow richer with voices
          </p>
          <Link to="/family" style={{ fontFamily: 'var(--serif)', fontSize: 16, color: 'var(--warm)', textDecoration: 'none', letterSpacing: '0.04em' }}>
            Bring someone into the thread →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="hl-screen"
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: 'var(--ink)', color: 'var(--bone)' }}
    >
      {/* Topbar — uses .hl-topbar class so safe-area padding is handled globally */}
      <div className="hl-topbar" style={{ borderBottom: '1px solid var(--rule)' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <HLogo size={18} wordmark mono color="var(--bone-dim)" wordColor="var(--bone-dim)" glow={false} />
          <span style={{ color: 'var(--bone-faint)', fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.08em' }}>
            · write
          </span>
        </span>

        {save.isPending ? (
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.1em', color: 'var(--warm)' }}>
            weaving…
          </span>
        ) : save.isSuccess ? (
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.1em', color: 'var(--warm)' }}>
            woven
          </span>
        ) : (
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.1em', color: 'var(--bone-faint)' }}>
            draft
          </span>
        )}

        <button
          type="button"
          onClick={handleCancel}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'var(--mono)',
            fontSize: 11,
            letterSpacing: '0.08em',
            color: 'var(--warm)',
            padding: '8px 0',
            minHeight: 36,
          }}
        >
          back →
        </button>
      </div>

      {/* Scrollable content — starts below the dynamic topbar height */}
      <div
        className="hl-compose-scroll"
        style={{
          position: 'absolute',
          top: 'calc(56px + env(safe-area-inset-top, 0px))',
          bottom: 0,
          left: 0,
          right: 0,
          overflowY: 'auto',
          padding: '48px clamp(20px, 5vw, 48px) 100px',
          opacity: revealed ? 1 : 0,
          transform: revealed ? 'translateY(0)' : 'translateY(12px)',
          transition: `opacity 720ms ${ease}, transform 720ms ${ease}`,
        }}
      >
        <div style={{ maxWidth: 660, margin: '0 auto' }}>
          {/* eyebrow */}
          <p
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: 'var(--warm)',
              margin: '0 0 32px',
              opacity: writingFocused ? 0.4 : 1,
              transition: `opacity 720ms ${ease}`,
            }}
          >
            ∞ &nbsp; a thread in your family cloth
          </p>

          {/* Mode switcher — paper / letter */}
          <div style={{ opacity: writingFocused ? 0.5 : 1, transition: `opacity 720ms ${ease}` }}>
            <ComposerModes active="paper" />
          </div>

          {/* ── Step 1: Who is this for? ─────────────────────────────── */}
          <div style={{ opacity: writingFocused ? 0.5 : 1, transition: `opacity 720ms ${ease}` }}>
            <AddresseeSelect
              type={addresseeType}
              name={addresseeName}
              onTypeChange={t => {
                setAddresseeType(t);
                if (t === 'self' || t === 'future') setAddresseeName('');
              }}
              onNameChange={setAddresseeName}
            />

            {/* ── Step 2: When did this happen? ────────────────────────── */}
            <EntryDateField value={entryDate} onChange={setEntryDate} />
          </div>

          {/* Separator: entering the writing space */}
          <div style={{
            borderTop: '1px solid var(--rule)',
            marginBottom: 36,
            opacity: writingFocused ? 0.3 : 0.7,
            transition: `opacity 720ms ${ease}`,
          }} />

          {/* ── Step 3: The writing area ──────────────────────────────── */}
          <div style={{
            borderLeft: '1px solid rgba(176,122,74,0.18)',
            paddingLeft: 'clamp(16px, 3vw, 28px)',
          }}>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="A title — or leave it"
              style={{
                border: 0,
                background: 'transparent',
                color: title ? 'var(--bone)' : 'var(--bone-faint)',
                caretColor: 'var(--warm)',
                fontFamily: "'Source Serif 4', serif",
                fontVariationSettings: "'opsz' 32",
                fontStyle: 'italic',
                fontSize: 'clamp(22px, 4vw, 28px)',
                fontWeight: 300,
                letterSpacing: '-0.01em',
                width: '100%',
                outline: 'none',
                padding: 0,
                margin: '0 0 20px',
                lineHeight: 1.2,
              }}
            />

            <textarea
              ref={textareaRef}
              value={body}
              onChange={handleBodyChange}
              onFocus={() => setWritingFocused(true)}
              onBlur={() => setWritingFocused(false)}
              placeholder={
                addresseeType === 'self'
                  ? 'What do you want the future version of yourself to know?'
                  : addresseeType === 'future'
                  ? 'Write to someone not yet born — what do they need to understand about now?'
                  : addresseeName.trim()
                  ? `Write to ${addresseeName.trim()}. What do you want them to hold?`
                  : 'Write freely. The Listener will read alongside you.'
              }
              style={{
                width: '100%',
                border: 0,
                background: 'transparent',
                caretColor: 'var(--warm)',
                fontFamily: "'Source Serif 4', serif",
                fontVariationSettings: "'opsz' 14",
                fontFeatureSettings: '"onum" 1, "liga" 1',
                fontSize: 'clamp(18px, 4vw, 21px)',
                lineHeight: 1.9,
                color: 'var(--bone)',
                minHeight: 260,
                outline: 'none',
                resize: 'none',
                padding: 0,
                overflow: 'hidden',
              }}
            />

            {/* Word count — appears once writing starts */}
            <div style={{
              marginTop: 12,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--bone-faint)',
              opacity: wordCount > 0 ? 1 : 0,
              transition: `opacity 360ms ${ease}`,
            }}>
              {wordCount} {wordCount === 1 ? 'word' : 'words'}
            </div>
          </div>

          {/* Listener — full-width beneath the writing area */}
          <div style={{ marginTop: 28, paddingLeft: 'clamp(16px, 3vw, 28px)' }}>
            <ListenerLine
              text={suggestion}
              loading={listenerLoading}
              onRefresh={listenerRefresh}
            />
          </div>

          {error && (
            <p
              role="alert"
              style={{ marginTop: 20, fontStyle: 'italic', color: 'var(--danger)', fontSize: 14, fontFamily: "'Source Serif 4', serif" }}
            >
              {error}
            </p>
          )}

          {/* ── Step 4: How it's kept ─────────────────────────────────── */}
          <ComposerRail>
            <VisibilityControl value={visibility} onChange={setVisibility} />
            <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 10 }}>
              <DyeControl value={dye} onChange={setDye} />
              <DyeSuggestButton body={body} onSuggest={setDye} />
            </span>
            <span style={{ color: 'var(--bone-faint)' }}>
              {save.isPending ? 'weaving…' : 'once saved · immutable in 30 days'}
            </span>
          </ComposerRail>

          {/* Actions */}
          <div
            style={{
              marginTop: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              onClick={handleCancel}
              style={{
                background: 'transparent',
                border: '1px solid var(--rule)',
                color: 'var(--bone-dim)',
                fontFamily: 'var(--mono)',
                fontSize: 12,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                padding: '10px 20px',
                cursor: 'pointer',
                minHeight: 40,
                transition: 'color 180ms var(--ease), border-color 180ms var(--ease)',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--bone)'; e.currentTarget.style.borderColor = 'var(--bone-dim)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--bone-dim)'; e.currentTarget.style.borderColor = 'var(--rule)'; }}
            >
              cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setError(null);
                if (!body.trim()) {
                  setError('Write something — even a sentence.');
                  return;
                }
                save.mutate();
              }}
              disabled={save.isPending || !body.trim()}
              style={{
                background: 'var(--warm)',
                border: '1px solid var(--warm)',
                color: 'var(--ink)',
                fontFamily: 'var(--mono)',
                fontSize: 12,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                padding: '10px 24px',
                cursor: save.isPending || !body.trim() ? 'default' : 'pointer',
                minHeight: 40,
                opacity: save.isPending || !body.trim() ? 0.45 : 1,
                transition: 'opacity 180ms var(--ease), transform 180ms var(--ease)',
              }}
              onMouseEnter={e => { if (!save.isPending && body.trim()) e.currentTarget.style.opacity = '0.85'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = save.isPending || !body.trim() ? '0.45' : '1'; }}
              onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.97)'; }}
              onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {save.isPending ? 'saving…' : 'weave into cloth →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
