import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { memoriesApi, lettersApi, familyApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { usePageMeta } from '../lib/usePageMeta';
import { type FamilyMember } from '../types';
import { HLogo } from '../loom/components/HLogo';
import { WeaveCeremony } from '../loom/components/WeaveCeremony';
import { uploadMemoryImage, validateImage } from '../utils/uploadImage';
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

interface ComposeImage {
  id: string;
  url: string; // local object URL for preview
  uploading: boolean;
  progress: number;
  fileKey?: string;
  fileUrl?: string;
  mimeType?: string;
  error?: boolean;
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
          fontFamily: 'var(--mono)',
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
              fontFamily: 'var(--mono)',
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
                fontFamily: 'var(--mono)',
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
                fontFamily: 'var(--mono)',
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
              background: 'var(--ink)',
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
                    fontFamily: 'var(--mono)',
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
                      fontFamily: 'var(--mono)',
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
          fontFamily: 'var(--mono)',
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
type DeliveryTrigger = 'now' | 'date' | 'death' | 'milestone' | 'event';

const TRIGGER_OPTIONS: {
  value: DeliveryTrigger;
  label: string;
  hint?: string;
}[] = [
  { value: 'now',       label: 'open now',       hint: 'recipient can read this immediately' },
  { value: 'date',      label: 'on a date',      hint: 'sealed until a date you choose' },
  { value: 'death',     label: 'after death',    hint: 'unseals when your thread is closed' },
  { value: 'milestone', label: 'on a milestone', hint: 'unseals on a family milestone you define later' },
  { value: 'event' as const, label: 'on an event', hint: 'unseals on a named family event — a birth, an age, a milestone you define' },
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
    <div style={{ marginBottom: 32 }}>
      <div
        style={{
          fontFamily: 'var(--mono)',
          fontSize: 11,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: 'var(--bone-faint)',
          marginBottom: 10,
        }}
      >
        available
      </div>

      {/* Stacked option rows — each a full-width tappable target */}
      <div style={{ border: '1px solid var(--rule)' }}>
        {TRIGGER_OPTIONS.map((opt, i) => {
          const active = opt.value === trigger;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onTriggerChange(opt.value)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                background: 'transparent',
                border: 0,
                borderBottom: i < TRIGGER_OPTIONS.length - 1 ? '1px solid var(--rule)' : 'none',
                borderLeft: `3px solid ${active ? 'var(--warm)' : 'transparent'}`,
                padding: '14px 16px 14px 14px',
                cursor: 'pointer',
                minHeight: 48,
                transition: 'border-left-color 180ms var(--ease)',
              }}
            >
              <span
                style={{
                  display: 'block',
                  fontFamily: 'var(--mono)',
                  fontSize: 14,
                  letterSpacing: '0.10em',
                  color: active ? 'var(--bone)' : 'var(--bone-faint)',
                  transition: 'color 180ms var(--ease)',
                  lineHeight: 1.3,
                }}
              >
                {opt.label}
              </span>

              {/* Hint — shown for all options when active, or for death/milestone always */}
              {(active || opt.value === 'death' || opt.value === 'milestone' || opt.value === 'event') && opt.hint && (
                <span
                  style={{
                    display: 'block',
                    marginTop: 3,
                    fontFamily: 'var(--mono)',
                    fontSize: 10,
                    letterSpacing: '0.08em',
                    color: 'var(--bone-faint)',
                    fontStyle: 'italic',
                    lineHeight: 1.5,
                  }}
                >
                  {opt.hint}
                </span>
              )}

              {/* Date input — inline inside the row when 'date' is selected */}
              {opt.value === 'date' && active && (
                <div
                  style={{ marginTop: 10 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => onDateChange(e.target.value)}
                    aria-label="Scheduled date"
                    style={{
                      background: 'transparent',
                      border: '1px solid var(--rule)',
                      color: 'var(--bone)',
                      fontFamily: 'var(--mono)',
                      fontSize: 13,
                      letterSpacing: '0.06em',
                      padding: '8px 10px',
                      colorScheme: 'dark',
                      borderRadius: 0,
                      outline: 'none',
                      width: '100%',
                      maxWidth: 200,
                      boxSizing: 'border-box',
                      touchAction: 'manipulation',
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--warm)')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--rule)')}
                  />
                </div>
              )}
            </button>
          );
        })}
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
          fontFamily: 'var(--mono)',
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
            fontFamily: 'var(--mono)',
            fontSize: 13,
            letterSpacing: '0.06em',
            color: 'var(--bone-dim)',
          }}
        >
          {formatted}
        </span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--bone-faint)', letterSpacing: '0.14em' }}>↗</span>
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

// Derive a graceful title from the opening of the body when the author leaves it blank.
// First sentence (or first line), trimmed to ~48 chars on a word boundary.
function deriveTitle(body: string): string {
  const text = body.trim().replace(/\s+/g, ' ');
  if (!text) return 'untitled';
  const firstUnit = (text.split(/(?<=[.!?])\s/)[0] || text).split('\n')[0].trim();
  const candidate = firstUnit || text;
  if (candidate.length <= 48) return candidate.replace(/[.!?,;:\s]+$/, '');
  const clipped = candidate.slice(0, 48);
  const lastSpace = clipped.lastIndexOf(' ');
  return (lastSpace > 24 ? clipped.slice(0, lastSpace) : clipped).replace(/[.!?,;:\s]+$/, '') + '…';
}
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
  usePageMeta('Compose');
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
  const [images, setImages] = useState<ComposeImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load family members for autosuggest
  const { data: familyData, isError: familyError } = useQuery({
    queryKey: ['family'],
    queryFn: () => familyApi.getAll().then((r) => r.data as FamilyMember[]),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
  const members: FamilyMember[] = useMemo(
    () => (Array.isArray(familyData) ? familyData : []),
    [familyData],
  );

  // Pre-select recipient from ?recipientId or ?for URL param (family profile / QuickWizard shortcut)
  useEffect(() => {
    const urlId = searchParams.get('recipientId') ?? searchParams.get('for');
    const urlName = searchParams.get('forName');
    if (!urlId || recipientId) return;
    const found = members.find((m) => m.id === urlId);
    if (found) {
      setRecipientId(found.id);
      setRecipientName(found.name);
    } else if (urlId && urlName) {
      // Recipient not in loaded family list yet — accept id + name from URL
      setRecipientId(urlId);
      try { setRecipientName(decodeURIComponent(urlName)); } catch { setRecipientName(urlName); }
    }
  }, [searchParams, members, recipientId]);

  // Load an existing draft letter from ?id= (editing an unsealed draft from the
  // Letters room). Prefill composer state so the draft's content is restored.
  const editId = searchParams.get('id');
  // Load an existing memory from ?entry= (edit from ReadingRoom).
  const editEntryId = searchParams.get('entry');
  const prefilledRef = useRef(false);
  const { data: draftLetter } = useQuery({
    queryKey: ['letter', editId],
    queryFn: () => lettersApi.getOne(editId as string).then((r) => r.data),
    enabled: isAuthenticated && !!editId,
    staleTime: 60 * 1000,
  });
  const { data: editMemory } = useQuery({
    queryKey: ['memory', editEntryId],
    queryFn: () => memoriesApi.getOne(editEntryId as string).then((r) => r.data),
    enabled: isAuthenticated && !!editEntryId,
    staleTime: 60 * 1000,
  });
  useEffect(() => {
    if (!draftLetter || prefilledRef.current) return;
    prefilledRef.current = true;
    setTitle(draftLetter.title ?? '');
    setBody(draftLetter.body ?? '');
    const firstRecipient = Array.isArray(draftLetter.recipients) ? draftLetter.recipients[0] : null;
    if (firstRecipient) {
      setRecipientId(firstRecipient.id);
      setRecipientName(firstRecipient.name ?? '');
    } else if (draftLetter.salutation) {
      setRecipientName(draftLetter.salutation);
    }
    const triggerMap: Record<string, DeliveryTrigger> = {
      IMMEDIATE: 'now',
      SCHEDULED: 'date',
      POSTHUMOUS: 'death',
    };
    if (draftLetter.deliveryTrigger) {
      setDeliveryTrigger(triggerMap[String(draftLetter.deliveryTrigger).toUpperCase()] ?? 'now');
    }
    if (draftLetter.scheduledDate) setScheduledDate(draftLetter.scheduledDate);
  }, [draftLetter]);
  useEffect(() => {
    const m = (editMemory as any)?.data ?? editMemory;
    if (!m || prefilledRef.current) return;
    prefilledRef.current = true;
    setTitle(m.title ?? '');
    setBody(m.description ?? '');
    if (m.metadata?.entryDate) setEntryDate(m.metadata.entryDate);
    if (m.metadata?.dye) setDye(m.metadata.dye);
  }, [editMemory]);

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

  const addImages = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      const err = validateImage(file);
      if (err) {
        setError(err);
        return;
      }
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const url = URL.createObjectURL(file);
      setImages((prev) => [...prev, { id, url, uploading: true, progress: 0, mimeType: file.type }]);
      uploadMemoryImage(file, (pct) =>
        setImages((prev) => prev.map((im) => (im.id === id ? { ...im, progress: pct } : im))),
      )
        .then((res) =>
          setImages((prev) =>
            prev.map((im) =>
              im.id === id
                ? { ...im, uploading: false, progress: 100, fileKey: res.fileKey, fileUrl: res.fileUrl }
                : im,
            ),
          ),
        )
        .catch(() =>
          setImages((prev) => prev.map((im) => (im.id === id ? { ...im, uploading: false, error: true } : im))),
        );
    });
  }, []);

  const removeImage = useCallback((id: string) => {
    setImages((prev) => {
      const target = prev.find((im) => im.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((im) => im.id !== id);
    });
  }, []);

  const uploadingCount = images.filter((im) => im.uploading).length;
  const readyImages = images.filter((im) => im.fileKey && !im.error);
  const hasContent = body.trim().length > 0 || (!isLetter && readyImages.length > 0);

  // Navigate after the "woven" celebration fades — both letters and memories
  // land on the ∞ index, where the freshly-woven thread joins the whole cloth.
  useEffect(() => {
    if (!woven) return;
    const t = setTimeout(() => navigate('/loom/index'), 4200);
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
    if (deliveryTrigger === 'event') return 'seal for event →';
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
              : (deliveryTrigger === 'milestone' || deliveryTrigger === 'event')
                ? 'MILESTONE'
                : 'IMMEDIATE';

        if (editId) {
          // Updating an existing letter
          const { data } = await lettersApi.update(editId, {
            title: title.trim() || (recipientName ? `A letter to ${recipientName}` : 'A letter'),
            salutation: recipientName ? `To ${recipientName},` : null,
            body: body.trim(),
            signature: null,
            deliveryTrigger: trigger,
            scheduledDate: trigger === 'SCHEDULED' ? scheduledDate : null,
            recipientIds: recipientId ? [recipientId] : [],
          });
          return data;
        }

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
        const photos = images.filter((im) => im.fileKey && !im.error);
        const primary = photos[0];
        if (editEntryId) {
          // Updating an existing memory
          return memoriesApi
            .update(editEntryId, {
              title: title.trim() || deriveTitle(body),
              description: body.trim(),
              metadata: {
                visibility,
                dye,
                dyeMotif: dye,
                entryDate,
                images: photos.map((p) => ({ fileKey: p.fileKey, fileUrl: p.fileUrl, mimeType: p.mimeType })),
              },
            })
            .then((r) => r.data);
        }
        return memoriesApi
          .create({
            type: primary ? 'PHOTO' : 'TEXT',
            title: title.trim() || deriveTitle(body),
            description: body.trim(),
            fileKey: primary?.fileKey,
            fileUrl: primary?.fileUrl,
            mimeType: primary?.mimeType,
            metadata: {
              visibility,
              dye,
              dyeMotif: dye,
              entryDate,
              images: photos.map((p) => ({ fileKey: p.fileKey, fileUrl: p.fileUrl, mimeType: p.mimeType })),
            },
          })
          .then((r) => r.data);
      }
    },
    onSuccess: () => {
      localStorage.removeItem(draftKey);
      if (isLetter) {
        queryClient.invalidateQueries({ queryKey: ['new-user-check-letters'] });
        queryClient.invalidateQueries({ queryKey: ['letters'] });
        queryClient.invalidateQueries({ queryKey: ['weft-letters'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['new-user-check-memories'] });
        queryClient.invalidateQueries({ queryKey: ['memories-mosaic'] });
        queryClient.invalidateQueries({ queryKey: ['weft-memories'] });
      }
      // Every authored entry ends in the cloth — letters now weave too (invariant A).
      setWoven(true);
    },
    onError: (err: any) => {
      setError(err?.response?.data?.error ?? 'Could not save the entry.');
    },
  });

  const submitDisabled = save.isPending || !hasContent || uploadingCount > 0;

  const handleCancel = useCallback(() => {
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    if ((body.trim() || title.trim()) && !woven) {
      localStorage.setItem(
        draftKey,
        JSON.stringify({ title, body, entryDate, recipientId, recipientName, deliveryTrigger, scheduledDate }),
      );
    }
    navigate('/loom/index');
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
    return (
      <WeaveCeremony
        dye={isLetter ? 'indigo' : dye}
        entryDate={entryDate}
        seed={title || recipientName || 'thread'}
        eyebrow={isLetter ? 'woven into the cloth' : 'woven into the thread'}
        headline={
          isLetter
            ? recipientName.trim()
              ? `Your letter to ${recipientName.trim()} is part of the cloth.`
              : 'Your letter is part of the cloth.'
            : 'Your memory is part of the cloth.'
        }
        footer={
          <>
            <p
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 11,
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
          </>
        }
      />
    );
  }

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: 'transparent',
        color: 'var(--bone)',
      }}
    >
      {/* Topbar */}
      <div className="hl-topbar" style={{ borderBottom: '1px solid var(--rule)', position: 'relative', zIndex: 10 }}>
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
            minHeight: 44,
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
          padding: '48px clamp(20px, 5vw, 48px) calc(100px + env(safe-area-inset-bottom, 0px))',
          zIndex: 10,
          opacity: revealed ? 1 : 0,
          transform: revealed ? 'translateY(0)' : 'translateY(12px)',
          transition: `opacity 720ms ${ease}, transform 720ms ${ease}`,
        }}
      >
        <div style={{ maxWidth: 660, margin: '0 auto' }}>
          {/* eyebrow */}
          <p
            style={{
              fontFamily: 'var(--mono)',
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
            {familyError && (
              <p
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 11,
                  color: 'var(--bone-faint)',
                  fontStyle: 'italic',
                  margin: '0 0 12px',
                  letterSpacing: '0.04em',
                }}
              >
                Could not load family members.
              </p>
            )}
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
              aria-label="Title"
              style={{
                border: 0,
                background: 'transparent',
                color: title ? 'var(--bone)' : 'var(--bone-faint)',
                caretColor: 'var(--warm)',
                fontFamily: 'var(--serif)',
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
              aria-label="Memory content"
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
                fontFamily: 'var(--serif)',
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
                fontFamily: 'var(--mono)',
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

          {/* ── Photos (memory mode only) ─────────────────────────────── */}
          {!isLetter && (
            <div style={{ marginTop: 28, paddingLeft: 'clamp(16px, 3vw, 28px)' }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  addImages(e.target.files);
                  e.target.value = '';
                }}
                style={{ display: 'none' }}
              />

              {images.length > 0 && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))',
                    gap: 10,
                    marginBottom: 16,
                  }}
                >
                  {images.map((im) => (
                    <div key={im.id} style={{ position: 'relative', aspectRatio: '1 / 1', overflow: 'hidden' }}>
                      <img
                        src={im.url}
                        alt=""
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                          filter: im.uploading ? 'brightness(0.6)' : 'none',
                          opacity: im.error ? 0.4 : 1,
                          transition: `filter 360ms ${ease}`,
                        }}
                      />
                      {/* hairline upload progress — never a spinner */}
                      {im.uploading && (
                        <div
                          style={{
                            position: 'absolute',
                            left: 0,
                            bottom: 0,
                            height: 2,
                            width: `${im.progress}%`,
                            background: 'var(--warm)',
                            transition: 'width 180ms cubic-bezier(0.16,1,0.3,1)',
                          }}
                        />
                      )}
                      {im.error && (
                        <span
                          className="hl-mono"
                          style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 9,
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            color: 'var(--danger)',
                            textAlign: 'center',
                            padding: 4,
                          }}
                        >
                          failed
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(im.id)}
                        aria-label="Remove photo"
                        style={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          width: 24,
                          height: 24,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'rgba(14,14,12,0.7)',
                          border: 0,
                          color: 'var(--bone)',
                          fontFamily: 'var(--mono)',
                          fontSize: 13,
                          lineHeight: 1,
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Upload photos"
                style={{
                  background: 'transparent',
                  border: '1px solid var(--rule)',
                  color: 'var(--bone-dim)',
                  fontFamily: 'var(--mono)',
                  fontSize: 11,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  padding: '9px 16px',
                  cursor: 'pointer',
                  minHeight: 44,
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
                {images.length > 0 ? '+ add another photo' : '+ add a photo'}
              </button>
            </div>
          )}

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
                fontFamily: 'var(--serif)',
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
                minHeight: 44,
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
                if (uploadingCount > 0) {
                  setError('Wait for photos to finish uploading.');
                  return;
                }
                if (!hasContent) {
                  setError(isLetter ? 'Write something — even a sentence.' : 'Write something, or add a photo.');
                  return;
                }
                if (isLetter && deliveryTrigger === 'date' && !scheduledDate) {
                  setError('Choose the date this letter unseals.');
                  return;
                }
                save.mutate();
              }}
              disabled={submitDisabled}
              style={{
                background: 'var(--warm)',
                border: '1px solid var(--warm)',
                color: 'var(--ink)',
                fontFamily: 'var(--mono)',
                fontSize: 12,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                padding: '10px 24px',
                cursor: submitDisabled ? 'default' : 'pointer',
                minHeight: 44,
                opacity: submitDisabled ? 0.45 : 1,
                transition: 'opacity 180ms var(--ease), transform 180ms var(--ease)',
              }}
              onMouseEnter={(e) => {
                if (!submitDisabled) e.currentTarget.style.opacity = '0.85';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = submitDisabled ? '0.45' : '1';
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
