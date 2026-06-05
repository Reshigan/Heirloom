import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { memoriesApi, lettersApi, familyApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { HLogo } from '../loom/components/HLogo';
import { TapestryCanvas } from '../loom/components/TapestryCanvas';
import type { CanvasEntry } from '../loom/components/TapestryCanvas';
import {
  ComposerRail,
  DyeControl,
  DyeSuggestButton,
  ListenerLine,
  VisibilityControl,
  useListenerAI,
  type Visibility,
} from '../loom/components/ComposerChrome';

/**
 * Compose — unified paper + letter composer (§6.3).
 *
 * Empty "to:" field → personal memory (memoriesApi).
 * Named recipient → letter with delivery trigger (lettersApi).
 *
 * Emotional order: to whom → when available → what → how it's kept.
 */

interface FamilyMember {
  id: string;
  name: string;
  relationship?: string;
}

/* ─── To: field with family autosuggest ─────────────────────────────── */
function ToField({
  members,
  recipientId,
  recipientName,
  onChange,
}: {
  members: FamilyMember[];
  recipientId: string | null;
  recipientName: string;
  onChange: (id: string | null, name: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = recipientName.toLowerCase().trim();
    if (!q || recipientId) return [];
    return members
      .filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          (m.relationship && m.relationship.toLowerCase().includes(q)),
      )
      .slice(0, 6);
  }, [recipientName, recipientId, members]);

  const selectedMember = recipientId ? members.find((m) => m.id === recipientId) : null;

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
        to
      </div>
      <div style={{ position: 'relative' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            borderBottom: '1px solid var(--rule)',
            paddingBottom: 2,
          }}
        >
          <input
            value={recipientName}
            onChange={(e) => {
              onChange(null, e.target.value);
              setOpen(true);
            }}
            onFocus={(e) => { setOpen(true); e.currentTarget.style.borderBottomColor = 'var(--warm)'; }}
            onBlur={(e) => { e.currentTarget.style.borderBottomColor = ''; setTimeout(() => setOpen(false), 200); }}
            placeholder="name a recipient to send as a letter"
            aria-label="Recipient name"
            style={{
              border: 0,
              background: 'transparent',
              color: 'var(--bone)',
              caretColor: 'var(--warm)',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 14,
              letterSpacing: '0.06em',
              padding: '6px 0 4px',
              outline: 'none',
              flex: 1,
              transition: 'color 180ms var(--ease)',
            }}
          />
          {selectedMember?.relationship && (
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                color: 'var(--bone-faint)',
                letterSpacing: '0.12em',
                flexShrink: 0,
              }}
            >
              {selectedMember.relationship}
            </span>
          )}
          {recipientName && (
            <button
              type="button"
              onClick={() => { onChange(null, ''); setOpen(false); }}
              aria-label="Clear recipient"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--bone-faint)',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 14,
                padding: '4px 2px',
                lineHeight: 1,
                flexShrink: 0,
                transition: 'color 180ms var(--ease)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--bone)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--bone-faint)')}
            >
              ×
            </button>
          )}
        </div>

        {open && filtered.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 2px)',
              left: 0,
              right: 0,
              background: '#111110',
              border: '1px solid var(--rule)',
              zIndex: 20,
              maxHeight: 220,
              overflowY: 'auto',
            }}
          >
            {filtered.map((m) => (
              <button
                key={m.id}
                type="button"
                onMouseDown={() => { onChange(m.id, m.name); setOpen(false); }}
                style={{
                  display: 'flex',
                  width: '100%',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 16px',
                  background: 'none',
                  border: 'none',
                  borderBottom: '1px solid rgba(244,236,216,0.05)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = 'rgba(244,236,216,0.04)')
                }
                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              >
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 13,
                    color: 'var(--bone)',
                    letterSpacing: '0.04em',
                  }}
                >
                  {m.name}
                </span>
                {m.relationship && (
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 10,
                      color: 'var(--bone-faint)',
                      letterSpacing: '0.12em',
                    }}
                  >
                    {m.relationship}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

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
        {recipientName.trim()
          ? `letter · addressed to ${recipientName}`
          : 'leave empty to write a personal memory'}
      </div>
    </div>
  );
}

/* ─── Delivery trigger selector ──────────────────────────────────────── */
type DeliveryTrigger = 'now' | 'date' | 'death' | 'milestone';

const TRIGGER_OPTIONS: { value: DeliveryTrigger; label: string }[] = [
  { value: 'now', label: 'open now' },
  { value: 'date', label: 'on a date' },
  { value: 'death', label: 'after death' },
  { value: 'milestone', label: 'on a milestone' },
];

function DeliveryField({
  trigger,
  scheduledDate,
  onTriggerChange,
  onDateChange,
}: {
  trigger: DeliveryTrigger;
  scheduledDate: string;
  onTriggerChange: (v: DeliveryTrigger) => void;
  onDateChange: (v: string) => void;
}) {
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
        available
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 0, alignItems: 'center', marginBottom: 6 }}>
        {TRIGGER_OPTIONS.map((opt, i) => (
          <span key={opt.value} style={{ display: 'inline-flex', alignItems: 'baseline' }}>
            <button
              type="button"
              onClick={() => onTriggerChange(opt.value)}
              style={{
                background: 'transparent',
                border: 0,
                padding: '4px 0',
                cursor: 'pointer',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 13,
                letterSpacing: '0.12em',
                color: opt.value === trigger ? 'var(--bone)' : 'var(--bone-faint)',
                transition: 'color 180ms var(--ease)',
                minHeight: 36,
              }}
            >
              {opt.label}
            </button>
            {i < TRIGGER_OPTIONS.length - 1 && (
              <span
                style={{
                  color: 'var(--bone-faint)',
                  margin: '0 10px',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 12,
                }}
              >
                ·
              </span>
            )}
          </span>
        ))}
      </div>

      {trigger === 'date' && (
        <input
          type="date"
          value={scheduledDate}
          onChange={(e) => onDateChange(e.target.value)}
          style={{
            background: 'transparent',
            border: '1px solid var(--rule)',
            color: 'var(--bone)',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            letterSpacing: '0.08em',
            padding: '4px 8px',
            colorScheme: 'dark',
            borderRadius: 0,
            outline: 'none',
            marginTop: 6,
            transition: 'border-color 180ms var(--ease)',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--warm)')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--rule)')}
        />
      )}

      {trigger === 'death' && (
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
          unseals when your thread is closed
        </div>
      )}

      {trigger === 'milestone' && (
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
          unseals on a family milestone you define later
        </div>
      )}
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
          onChange={(e) => onChange(e.target.value)}
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
const DRAFT_PREFIX = 'hl-compose-draft:';
type DraftData = {
  title?: string;
  body?: string;
  entryDate?: string;
  recipientId?: string | null;
  recipientName?: string;
  deliveryTrigger?: DeliveryTrigger;
  scheduledDate?: string;
};

function readDraft(key: string): DraftData {
  try {
    const r = localStorage.getItem(key);
    return r ? (JSON.parse(r) as DraftData) : {};
  } catch {
    return {};
  }
}

/* ─── Main Compose page ──────────────────────────────────────────────── */
export function Compose() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();
  const draftKey = `${DRAFT_PREFIX}${user?.id ?? 'anon'}`;

  const draft0 = useMemo(() => readDraft(draftKey), [draftKey]);

  const [recipientId, setRecipientId] = useState<string | null>(() => draft0.recipientId ?? null);
  const [recipientName, setRecipientName] = useState(() => draft0.recipientName ?? '');
  const [deliveryTrigger, setDeliveryTrigger] = useState<DeliveryTrigger>(() => draft0.deliveryTrigger ?? 'now');
  const [scheduledDate, setScheduledDate] = useState(() => draft0.scheduledDate ?? '');
  const [entryDate, setEntryDate] = useState(() => draft0.entryDate ?? new Date().toISOString().slice(0, 10));
  const [title, setTitle] = useState(() => draft0.title ?? '');
  const [body, setBody] = useState(() => draft0.body ?? '');
  const [visibility, setVisibility] = useState<Visibility>('family');
  const [dye, setDye] = useState('walnut');
  const [error, setError] = useState<string | null>(null);
  const [woven, setWoven] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [writingFocused, setWritingFocused] = useState(false);
  const wovenAtRef = useRef<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load family members for autosuggest
  const { data: familyData } = useQuery({
    queryKey: ['family'],
    queryFn: () =>
      familyApi
        .getAll()
        .then((r) => r.data as FamilyMember[])
        .catch(() => []),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
  const members: FamilyMember[] = useMemo(
    () => (Array.isArray(familyData) ? familyData : []),
    [familyData],
  );

  // Pre-select recipient from ?recipientId URL param (family profile shortcut)
  useEffect(() => {
    const urlId = searchParams.get('recipientId');
    if (!urlId || recipientId) return;
    const found = members.find((m) => m.id === urlId);
    if (found) {
      setRecipientId(found.id);
      setRecipientName(found.name);
    }
  }, [searchParams, members, recipientId]);

  // isLetter: true when any recipient name is set
  const isLetter = !!(recipientId || recipientName.trim());

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

  // Autosave draft — debounced 800ms
  useEffect(() => {
    if (woven) return;
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    draftTimerRef.current = setTimeout(() => {
      if (body.trim() || title.trim() || recipientName.trim()) {
        localStorage.setItem(
          draftKey,
          JSON.stringify({
            title,
            body,
            entryDate,
            recipientId,
            recipientName,
            deliveryTrigger,
            scheduledDate,
          }),
        );
      } else {
        localStorage.removeItem(draftKey);
      }
    }, 800);
    return () => {
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    };
  }, [body, title, entryDate, recipientId, recipientName, deliveryTrigger, scheduledDate, woven, draftKey]);

  // Guard browser tab close when there's unsaved content
  useEffect(() => {
    if (!body.trim() || woven) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      return (e.returnValue = '');
    };
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

  // Listener AI hint — uses recipient name as the "to" context
  const { suggestion, loading: listenerLoading, refresh: listenerRefresh } =
    useListenerAI(body, recipientName.trim() || undefined);

  // Compute submit label
  const submitLabel = useMemo(() => {
    if (!isLetter) return 'weave into cloth →';
    if (deliveryTrigger === 'now') return 'send letter →';
    if (deliveryTrigger === 'date' && scheduledDate) {
      const d = new Date(`${scheduledDate}T00:00:00`);
      const label = isNaN(d.getTime())
        ? 'seal and save →'
        : `seal until ${d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })} →`;
      return label;
    }
    if (deliveryTrigger === 'death') return 'seal until death →';
    if (deliveryTrigger === 'milestone') return 'seal for milestone →';
    return 'seal and save →';
  }, [isLetter, deliveryTrigger, scheduledDate]);

  const save = useMutation({
    mutationFn: async () => {
      if (isLetter) {
        const trigger =
          deliveryTrigger === 'date' && scheduledDate
            ? 'SCHEDULED'
            : deliveryTrigger === 'death'
              ? 'AFTER_DEATH'
              : deliveryTrigger === 'milestone'
                ? 'MILESTONE'
                : 'IMMEDIATE';

        const { data } = await lettersApi.create({
          title: title.trim() || (recipientName ? `A letter to ${recipientName}` : 'A letter'),
          salutation: recipientName ? `To ${recipientName},` : null,
          body: body.trim(),
          signature: null,
          deliveryTrigger: trigger,
          scheduledDate: trigger === 'SCHEDULED' ? scheduledDate : null,
          recipientIds: recipientId ? [recipientId] : [],
        });

        if (trigger !== 'IMMEDIATE' && data?.id) {
          await lettersApi.seal(data.id);
        }
        return data;
      } else {
        return memoriesApi
          .create({
            type: 'LETTER',
            title: title.trim() || 'untitled',
            description: body.trim(),
            metadata: { visibility, dye, dyeMotif: dye, entryDate },
          })
          .then((r) => r.data);
      }
    },
    onSuccess: () => {
      localStorage.removeItem(draftKey);
      if (isLetter) {
        queryClient.invalidateQueries({ queryKey: ['letters'] });
        queryClient.invalidateQueries({ queryKey: ['weft-letters'] });
        navigate('/letters');
      } else {
        queryClient.invalidateQueries({ queryKey: ['memories-mosaic'] });
        queryClient.invalidateQueries({ queryKey: ['weft-memories'] });
        setWoven(true);
      }
    },
    onError: (err: any) => {
      setError(err?.response?.data?.error ?? 'Could not save the entry.');
    },
  });

  const handleCancel = useCallback(() => {
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    if ((body.trim() || title.trim()) && !woven) {
      localStorage.setItem(
        draftKey,
        JSON.stringify({ title, body, entryDate, recipientId, recipientName, deliveryTrigger, scheduledDate }),
      );
    }
    navigate('/memories');
  }, [body, title, entryDate, recipientId, recipientName, deliveryTrigger, scheduledDate, woven, navigate, draftKey]);

  const handleRecipientChange = useCallback((id: string | null, name: string) => {
    setRecipientId(id);
    setRecipientName(name);
    if (!name.trim()) {
      setDeliveryTrigger('now');
      setScheduledDate('');
    }
  }, []);

  // Woven celebration (memory mode only)
  if (woven) {
    const wovenEntry: CanvasEntry = {
      date: new Date(entryDate),
      n: Math.abs(title.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) || 42,
      dye,
      tier: 'family',
    };

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'var(--ink)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 40,
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
          <TapestryCanvas
            height={72}
            entries={[wovenEntry]}
            kind="specimen"
            animate
            newEntryAt={wovenAtRef.current}
            opts={{
              tStart: new Date(+new Date(entryDate) - 86400000 * 180),
              tEnd: new Date(+new Date(entryDate) + 86400000 * 180),
              background: '#0e0e0c',
              warpEvery: 9,
              showDecadeMarks: false,
              showFraySelvedge: false,
              showWarpHair: false,
            }}
          />
        </div>
        <p
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 10,
            letterSpacing: '0.32em',
            textTransform: 'uppercase',
            color: 'var(--warm)',
            margin: '0 0 20px',
          }}
        >
          woven into the thread
        </p>
        <p
          style={{
            fontFamily: 'var(--serif)',
            fontSize: 'clamp(22px, 4vw, 36px)',
            fontWeight: 300,
            color: 'var(--bone)',
            textAlign: 'center',
            lineHeight: 1.3,
            margin: '0 0 40px',
            maxWidth: 480,
          }}
        >
          Your memory is part of the cloth.
        </p>
        <div
          style={{
            borderTop: '1px solid var(--rule)',
            paddingTop: 28,
            textAlign: 'center',
            maxWidth: 400,
          }}
        >
          <p
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 10,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--bone-faint)',
              margin: '0 0 16px',
            }}
          >
            threads grow richer with voices
          </p>
          <Link
            to="/family"
            style={{
              fontFamily: 'var(--serif)',
              fontSize: 16,
              color: 'var(--warm)',
              textDecoration: 'none',
              letterSpacing: '0.04em',
            }}
          >
            Bring someone into the thread →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="hl-screen"
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: 'var(--ink)',
        color: 'var(--bone)',
      }}
    >
      {/* Topbar */}
      <div className="hl-topbar" style={{ borderBottom: '1px solid var(--rule)' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <HLogo size={18} wordmark mono color="var(--bone-dim)" wordColor="var(--bone-dim)" glow={false} />
          <span
            style={{
              color: 'var(--bone-faint)',
              fontFamily: 'var(--mono)',
              fontSize: 11,
              letterSpacing: '0.08em',
            }}
          >
            · {isLetter ? 'letter' : 'write'}
          </span>
        </span>

        {save.isPending ? (
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.1em', color: 'var(--warm)' }}>
            {isLetter ? 'sealing…' : 'weaving…'}
          </span>
        ) : save.isSuccess ? (
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.1em', color: 'var(--warm)' }}>
            {isLetter ? 'sealed' : 'woven'}
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

      {/* Scrollable content */}
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
            ∞ &nbsp; {isLetter ? 'a sealed letter for the future' : 'a thread in your family cloth'}
          </p>

          {/* ── Step 1: Who is this for? ──────────────────────────────── */}
          <div style={{ opacity: writingFocused ? 0.5 : 1, transition: `opacity 720ms ${ease}` }}>
            <ToField
              members={members}
              recipientId={recipientId}
              recipientName={recipientName}
              onChange={handleRecipientChange}
            />

            {/* ── Step 2: When / How available ───────────────────────── */}
            {isLetter ? (
              <DeliveryField
                trigger={deliveryTrigger}
                scheduledDate={scheduledDate}
                onTriggerChange={setDeliveryTrigger}
                onDateChange={setScheduledDate}
              />
            ) : (
              <EntryDateField value={entryDate} onChange={setEntryDate} />
            )}
          </div>

          {/* Separator */}
          <div
            style={{
              borderTop: '1px solid var(--rule)',
              marginBottom: 36,
              opacity: writingFocused ? 0.3 : 0.7,
              transition: `opacity 720ms ${ease}`,
            }}
          />

          {/* ── Step 3: The writing area ──────────────────────────────── */}
          <div
            style={{
              borderLeft: isLetter
                ? '3px solid rgba(74,100,176,0.25)'
                : '1px solid rgba(176,122,74,0.18)',
              paddingLeft: 'clamp(16px, 3vw, 28px)',
            }}
          >
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isLetter ? 'Subject — or leave it' : 'A title — or leave it'}
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
                isLetter
                  ? recipientName.trim()
                    ? `Dear ${recipientName},\n\nWrite your letter here…`
                    : 'Write your letter here…'
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

            {/* Word count */}
            <div
              style={{
                marginTop: 12,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--bone-faint)',
                opacity: wordCount > 0 ? 1 : 0,
                transition: `opacity 360ms ${ease}`,
              }}
            >
              {wordCount} {wordCount === 1 ? 'word' : 'words'}
            </div>
          </div>

          {/* Listener */}
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
              style={{
                marginTop: 20,
                fontStyle: 'italic',
                color: 'var(--danger)',
                fontSize: 14,
                fontFamily: "'Source Serif 4', serif",
              }}
            >
              {error}
            </p>
          )}

          {/* ── Step 4: How it's kept (memory mode only) ─────────────── */}
          {!isLetter && (
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
          )}

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
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--bone)';
                e.currentTarget.style.borderColor = 'var(--bone-dim)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--bone-dim)';
                e.currentTarget.style.borderColor = 'var(--rule)';
              }}
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
                if (isLetter && deliveryTrigger === 'date' && !scheduledDate) {
                  setError('Choose the date this letter unseals.');
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
              onMouseEnter={(e) => {
                if (!save.isPending && body.trim()) e.currentTarget.style.opacity = '0.85';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = save.isPending || !body.trim() ? '0.45' : '1';
              }}
              onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.97)'; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {save.isPending ? (isLetter ? 'sealing…' : 'saving…') : submitLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
