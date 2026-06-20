import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { memoriesApi, lettersApi, familyApi, aiApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { usePageMeta } from '../lib/usePageMeta';
import { type FamilyMember } from '../types';
import { dyeColor, dyeTextColor, dyeVar, DYES, type Dye } from '../loom/dye';
import { EASE as ease } from '../loom/motion';
import { HLogo } from '../loom/components/HLogo';
import { VoiceRefine } from '../loom/components/VoiceRefine';
import { WeaveCeremony } from '../loom/components/WeaveCeremony';
import { uploadMemoryImage, validateImage } from '../utils/uploadImage';
import { handleRadioArrowKeys } from '../hooks/useRadioArrowKeys';
import LegacyRecipientPicker from '../components/LegacyRecipientPicker';
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
  fileSize?: number;
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
  // Drives the recipient field's focus cue declaratively (no DOM-poking).
  const [focused, setFocused] = useState(false);
  // Active descendant for keyboard navigation of the suggestion listbox.
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const listboxId = 'compose-recipient-listbox';

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

  // Whether the listbox is currently shown — keep keyboard + render logic in sync.
  const listOpen = open && filtered.length > 0;

  // Reset the highlight whenever the option set changes or the list closes.
  useEffect(() => {
    setActiveIndex(-1);
  }, [recipientName, recipientId, open]);

  const commit = (m: FamilyMember) => {
    onChange(m.id, m.name);
    setOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      if (!listOpen) return;
      e.preventDefault();
      const next = activeIndex < filtered.length - 1 ? activeIndex + 1 : 0;
      setActiveIndex(next);
      optionRefs.current[next]?.focus();
    } else if (e.key === 'ArrowUp') {
      if (!listOpen) return;
      e.preventDefault();
      const prev = activeIndex > 0 ? activeIndex - 1 : filtered.length - 1;
      setActiveIndex(prev);
      optionRefs.current[prev]?.focus();
    } else if (e.key === 'Enter') {
      if (listOpen && activeIndex >= 0 && filtered[activeIndex]) {
        e.preventDefault();
        commit(filtered[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      if (!listOpen) return;
      e.preventDefault();
      setOpen(false);
      setActiveIndex(-1);
      inputRef.current?.focus();
    }
  };

  // Keyboard handling while focus is inside the option list — mirror the input's
  // navigation, then restore focus to the input on Escape.
  const handleOptionKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, i: number) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = i < filtered.length - 1 ? i + 1 : 0;
      setActiveIndex(next);
      optionRefs.current[next]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = i > 0 ? i - 1 : filtered.length - 1;
      setActiveIndex(prev);
      optionRefs.current[prev]?.focus();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (filtered[i]) commit(filtered[i]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
      setActiveIndex(-1);
      inputRef.current?.focus();
    }
  };

  const selectedMember = recipientId ? members.find((m) => m.id === recipientId) : null;

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ position: 'relative' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            borderBottom: `1px solid ${focused ? 'var(--warm)' : 'var(--rule)'}`,
            paddingBottom: 2,
          }}
        >
          <span
            aria-hidden
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 12,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--bone-dim)',
              flexShrink: 0,
            }}
          >
            to
          </span>
          <input
            ref={inputRef}
            value={recipientName}
            onChange={(e) => {
              onChange(null, e.target.value);
              setOpen(true);
            }}
            onFocus={() => { setOpen(true); setFocused(true); }}
            onBlur={() => { setFocused(false); setTimeout(() => setOpen(false), 200); }}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Grandpa"
            aria-label="Recipient name"
            role="combobox"
            aria-expanded={listOpen}
            aria-controls={listboxId}
            aria-haspopup="listbox"
            aria-autocomplete="list"
            aria-activedescendant={listOpen && activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined}
            style={{
              border: 0,
              background: 'transparent',
              color: 'var(--bone)',
              caretColor: 'var(--warm)',
              fontFamily: 'var(--mono)',
              fontSize: 16,
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

        {listOpen && (
          <div
            id={listboxId}
            role="listbox"
            aria-label="Family member suggestions"
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
            {filtered.map((m, i) => (
              <button
                key={m.id}
                ref={(el) => { optionRefs.current[i] = el; }}
                id={`${listboxId}-opt-${i}`}
                role="option"
                aria-selected={i === activeIndex}
                tabIndex={-1}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); commit(m); }}
                onKeyDown={(e) => handleOptionKeyDown(e, i)}
                style={{
                  display: 'flex',
                  width: '100%',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px 12px 13px',
                  background: 'none',
                  border: 'none',
                  borderLeft: `3px solid ${dyeColor(m.id, m.dye)}`,
                  borderBottom: '1px solid var(--rule)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = 'color-mix(in srgb, var(--bone) 4%, transparent)')
                }
                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              >
                <span
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 13.5,
                    color: dyeTextColor(m.id, m.dye),
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
                <span
                  style={{
                    marginLeft: 'auto',
                    fontFamily: 'var(--mono)',
                    fontSize: 8.5,
                    color: 'var(--bone-faint)',
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    flexShrink: 0,
                  }}
                >
                  woven in
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: 8,
          fontFamily: 'var(--mono)',
          fontSize: 11,
          color: 'var(--bone-faint)',
          letterSpacing: '0.04em',
          fontStyle: 'italic',
          display: 'flex',
          alignItems: 'baseline',
          gap: 8,
        }}
      >
        {selectedMember ? (
          <>
            <span
              aria-hidden
              style={{
                width: 8,
                height: 8,
                flexShrink: 0,
                borderRadius: 0,
                background: dyeColor(selectedMember.id, selectedMember.dye),
                alignSelf: 'center',
              }}
            />
            <span style={{ fontStyle: 'normal', letterSpacing: '0.06em' }}>
              already woven into your bloodline ·{' '}
              <span className="hl-signature" style={{ fontSize: '1.5em' }}>
                {selectedMember.name}
              </span>
            </span>
          </>
        ) : recipientName.trim() ? (
          <span>letter · a new name in the cloth — {recipientName.trim()}</span>
        ) : (
          <span>leave empty to write a personal memory</span>
        )}
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
      <div role="radiogroup" aria-label="delivery trigger" style={{ borderTop: '1px solid var(--rule)' }}>
        {TRIGGER_OPTIONS.map((opt, i) => {
          const active = opt.value === trigger;
          return (
            <div
              key={opt.value}
              role="radio"
              tabIndex={active ? 0 : -1}
              aria-checked={active}
              onClick={() => onTriggerChange(opt.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onTriggerChange(opt.value);
                } else if (e.key === ' ') {
                  e.preventDefault();
                  onTriggerChange(opt.value);
                } else {
                  handleRadioArrowKeys(e, i, TRIGGER_OPTIONS.length, (next) =>
                    onTriggerChange(TRIGGER_OPTIONS[next].value),
                  );
                }
              }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                background: 'transparent',
                border: 0,
                borderBottom: i < TRIGGER_OPTIONS.length - 1 ? '1px solid var(--rule)' : 'none',
                borderLeft: `1px solid ${active ? 'var(--warm)' : 'transparent'}`,
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

              {/* Date input — inline sibling within the row when 'date' is selected */}
              {opt.value === 'date' && active && (
                <div style={{ marginTop: 10 }}>
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
            </div>
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
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--bone-faint)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>edit</span>
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Entry date"
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

/* ─── Shared field label ─────────────────────────────────────────────── */
const fieldLabel: React.CSSProperties = {
  fontFamily: 'var(--mono)',
  fontSize: 11,
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: 'var(--bone-faint)',
  marginBottom: 10,
};

const lineInput: React.CSSProperties = {
  border: 0,
  background: 'transparent',
  color: 'var(--bone)',
  caretColor: 'var(--warm)',
  fontFamily: 'var(--mono)',
  fontSize: 15,
  letterSpacing: '0.05em',
  padding: '6px 0 4px',
  outline: 'none',
  borderBottom: '1px solid var(--rule)',
  transition: 'border-color 180ms var(--ease)',
};

/* ─── About: who or what the memory is about (subject, not recipient) ── */
function AboutField({
  about,
  relation,
  onAboutChange,
  onRelationChange,
}: {
  about: string;
  relation: string;
  onAboutChange: (v: string) => void;
  onRelationChange: (v: string) => void;
}) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={fieldLabel}>about</div>
      <div style={{ display: 'flex', gap: 'clamp(16px, 4vw, 40px)', flexWrap: 'wrap' }}>
        <input
          value={about}
          onChange={(e) => onAboutChange(e.target.value)}
          placeholder="a person, a place, a thing"
          aria-label="What this memory is about"
          style={{ ...lineInput, flex: '2 1 220px' }}
          onFocus={(e) => (e.currentTarget.style.borderBottomColor = 'var(--warm)')}
          onBlur={(e) => (e.currentTarget.style.borderBottomColor = 'var(--rule)')}
        />
        <input
          value={relation}
          onChange={(e) => onRelationChange(e.target.value)}
          placeholder="relation — e.g. grandmother"
          aria-label="Relation to the subject"
          disabled={!about.trim()}
          style={{
            ...lineInput,
            flex: '1 1 160px',
            opacity: about.trim() ? 1 : 0.4,
          }}
          onFocus={(e) => (e.currentTarget.style.borderBottomColor = 'var(--warm)')}
          onBlur={(e) => (e.currentTarget.style.borderBottomColor = 'var(--rule)')}
        />
      </div>
    </div>
  );
}

/* ─── Room: the place in the house this thread belongs to ────────────── */
function RoomField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={fieldLabel}>room</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="the kitchen table, the porch, the old house"
        aria-label="The room or place this belongs to"
        style={{ ...lineInput, width: '100%', maxWidth: 480 }}
        onFocus={(e) => (e.currentTarget.style.borderBottomColor = 'var(--warm)')}
        onBlur={(e) => (e.currentTarget.style.borderBottomColor = 'var(--rule)')}
      />
    </div>
  );
}

/* ─── Emotion: the feeling — chosen by the author, or named by the AI ── */
// Same taxonomy as the worker's classifier so a choice round-trips on save.
const EMOTIONS = [
  'joyful', 'nostalgic', 'grateful', 'loving', 'bittersweet',
  'sad', 'reflective', 'proud', 'peaceful', 'hopeful',
] as const;

function EmotionField({
  body,
  value,
  onChange,
}: {
  body: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [aiNamed, setAiNamed] = useState(false);

  const nameIt = async () => {
    if (body.trim().length < 20 || loading) return;
    setLoading(true);
    try {
      const res = await aiApi.suggestEmotion(body);
      const e = (res.data as any)?.emotion as string | undefined;
      if (e) { onChange(e); setAiNamed(true); }
    } catch {
      // the Listener stays quiet on failure
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ ...fieldLabel, display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <span>the feeling</span>
        <span style={{ letterSpacing: '0.06em', textTransform: 'none', fontStyle: 'italic', color: 'var(--bone-faint)' }}>
          {value
            ? aiNamed ? 'named by the listener — change it freely' : 'your word'
            : 'optional · the listener will name one when you weave'}
        </span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 18px', alignItems: 'baseline' }}>
        {EMOTIONS.map((e) => {
          const active = e === value;
          return (
            <button
              key={e}
              type="button"
              aria-pressed={active}
              onClick={() => { setAiNamed(false); onChange(active ? '' : e); }}
              style={{
                background: 'transparent',
                border: 0,
                padding: '2px 0',
                cursor: 'pointer',
                fontFamily: 'var(--serif)',
                fontStyle: 'italic',
                fontSize: 'clamp(16px, 2vw, 19px)',
                fontWeight: 300,
                color: active ? 'var(--warm)' : 'var(--bone-dim)',
                opacity: value && !active ? 0.5 : 1,
                transition: 'color 180ms var(--ease), opacity 180ms var(--ease)',
              }}
              onMouseEnter={(e2) => { if (!active) e2.currentTarget.style.color = 'var(--bone)'; }}
              onMouseLeave={(e2) => { if (!active) e2.currentTarget.style.color = 'var(--bone-dim)'; }}
            >
              {e}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={nameIt}
        disabled={loading || body.trim().length < 20}
        style={{
          marginTop: 12,
          background: 'transparent',
          border: 0,
          padding: 0,
          cursor: body.trim().length < 20 ? 'default' : 'pointer',
          fontFamily: 'var(--mono)',
          fontSize: 10,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: loading ? 'var(--bone-faint)' : 'var(--warm)',
          opacity: body.trim().length < 20 ? 0.35 : 1,
          transition: 'color 180ms var(--ease), opacity 180ms var(--ease)',
        }}
      >
        {loading ? 'listening…' : 'let the listener name it →'}
      </button>
    </div>
  );
}

/* ─── Witness: who this memory is for (the address to the future) ────── */
// Relationship words that read as a descendant / younger generation. We only
// ever NAME members we can recognise this way — never fabricate. If none match,
// the composer shows the evocative line alone.
const DESCENDANT_WORDS = [
  'child', 'children', 'son', 'daughter', 'kid',
  'grandchild', 'grandson', 'granddaughter', 'grandkid',
  'great-grandchild', 'great-grandson', 'great-granddaughter',
  'niece', 'nephew',
];

function isDescendant(member: FamilyMember): boolean {
  const rel = (member.relationship ?? '').toLowerCase();
  if (!rel) return false;
  return DESCENDANT_WORDS.some((w) => rel.includes(w));
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
  about?: string;
  aboutRelation?: string;
  room?: string;
  emotion?: string;
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
  // CONSOLIDATION (§6.3): the distinct "letter" compose surface is eliminated as
  // a duplicate — the composer is just "a memory" now. The legacy `?as=letter`
  // signal is fully inert: it does NOT open a separate letter mode, change copy,
  // or alter the save path — a visitor arriving with `?as=letter` lands in the
  // ordinary memory compose. (Letter receiving/reading/future-delivery live in
  // other files and are untouched; recipient-driven future delivery via the
  // "to:" field still works on its own — that is not the `?as=letter` surface.)
  void searchParams.get('as'); // intentionally inert — no letter-mode branch
  const isLetterDraft = !!(searchParams.get('id'));
  const draftKey = `${DRAFT_PREFIX}${isLetterDraft ? 'letter' : 'memory'}:${user?.id ?? 'anon'}`;

  const draft0 = useMemo(() => readDraft(draftKey), [draftKey]);

  const [recipientId, setRecipientId] = useState<string | null>(() => draft0.recipientId ?? null);
  const [recipientName, setRecipientName] = useState(() => draft0.recipientName ?? '');
  const [legacyRecipientIds, setLegacyRecipientIds] = useState<string[]>([]);
  const [deliveryTrigger, setDeliveryTrigger] = useState<DeliveryTrigger>(() => draft0.deliveryTrigger ?? 'now');
  const [scheduledDate, setScheduledDate] = useState(() => draft0.scheduledDate ?? '');
  const [entryDate, setEntryDate] = useState(() => draft0.entryDate ?? new Date().toISOString().slice(0, 10));
  const [title, setTitle] = useState(() => draft0.title ?? '');
  const [body, setBody] = useState(() => draft0.body ?? '');
  const [visibility, setVisibility] = useState<Visibility>('family');
  const [dye, setDye] = useState('walnut');
  const [about, setAbout] = useState(() => draft0.about ?? '');
  const [aboutRelation, setAboutRelation] = useState(() => draft0.aboutRelation ?? '');
  const [room, setRoom] = useState(() => draft0.room ?? '');
  const [emotion, setEmotion] = useState(() => draft0.emotion ?? '');
  const [error, setError] = useState<string | null>(null);
  const [bodyError, setBodyError] = useState<string | null>(null);
  const [woven, setWoven] = useState(false);
  // Brief beat between a successful seal and the full weave ceremony — drives the
  // inline "woven ∞" confirmation in the seal area.
  const [sealed, setSealed] = useState(false);
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

  // WITNESS — the younger members this memory is, in part, addressed to. Drawn
  // straight from the family store; we only name members whose relationship
  // reads as a descendant, and show at most two. No data → the evocative line
  // stands alone. We never invent a name.
  const witnesses: FamilyMember[] = useMemo(
    () => members.filter((m) => !m.deletedAt && isDescendant(m)).slice(0, 2),
    [members],
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
  // A prompt carried in from the QuickWizard / a PersonPage suggestion guides
  // the writing as the field's placeholder (never saved unless the user types).
  const seedPrompt = searchParams.get('prompt');
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
    // Rehydrate the legacy-contact bequest so saving an edit doesn't wipe it
    // (the letters PATCH replaces the full set from whatever we send).
    if (Array.isArray(draftLetter.legacyRecipients)) {
      setLegacyRecipientIds(draftLetter.legacyRecipients.map((r: any) => r.id));
    }
  }, [draftLetter]);
  useEffect(() => {
    const m = (editMemory as any)?.data ?? editMemory;
    if (!m || prefilledRef.current) return;
    prefilledRef.current = true;
    setTitle(m.title ?? '');
    setBody(m.description ?? '');
    if (m.metadata?.entryDate) setEntryDate(m.metadata.entryDate);
    if (m.metadata?.dye) setDye(m.metadata.dye);
    if (m.metadata?.about) setAbout(m.metadata.about);
    if (m.metadata?.aboutRelation) setAboutRelation(m.metadata.aboutRelation);
    if (m.metadata?.room) setRoom(m.metadata.room);
    if (m.metadata?.emotion) setEmotion(m.metadata.emotion);
    // Rehydrate the legacy-contact bequest so saving an edit doesn't wipe it
    // (the memories PATCH now replaces the full set from whatever we send).
    if (Array.isArray(m.legacyRecipients)) {
      setLegacyRecipientIds(m.legacyRecipients.map((r: any) => r.id));
    }
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
            about,
            aboutRelation,
            room,
            emotion,
          }),
        );
      } else {
        localStorage.removeItem(draftKey);
      }
    }, 800);
    return () => {
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    };
  }, [body, title, entryDate, recipientId, recipientName, deliveryTrigger, scheduledDate, about, aboutRelation, room, emotion, woven, draftKey]);

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

  const handleBodyChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBody(e.target.value);
    setBodyError(null);
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
                ? { ...im, uploading: false, progress: 100, fileKey: res.fileKey, fileUrl: res.fileUrl, fileSize: res.fileSize }
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
    if (!isLetter) return 'weave it in →';
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
            legacyRecipientIds,
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
          legacyRecipientIds,
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
              legacyRecipientIds,
              metadata: {
                visibility,
                dye,
                dyeMotif: dye,
                entryDate,
                ...(about.trim() ? { about: about.trim() } : {}),
                ...(about.trim() && aboutRelation.trim() ? { aboutRelation: aboutRelation.trim() } : {}),
                ...(room.trim() ? { room: room.trim() } : {}),
                ...(emotion ? { emotion } : {}),
                images: photos.map((p) => ({ fileKey: p.fileKey, fileUrl: p.fileUrl, fileSize: p.fileSize, mimeType: p.mimeType })),
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
            fileSize: photos.reduce((sum, p) => sum + (p.fileSize ?? 0), 0) || undefined,
            mimeType: primary?.mimeType,
            legacyRecipientIds,
            metadata: {
              visibility,
              dye,
              dyeMotif: dye,
              entryDate,
              ...(about.trim() ? { about: about.trim() } : {}),
              ...(about.trim() && aboutRelation.trim() ? { aboutRelation: aboutRelation.trim() } : {}),
              ...(room.trim() ? { room: room.trim() } : {}),
              ...(emotion ? { emotion } : {}),
              images: photos.map((p) => ({ fileKey: p.fileKey, fileUrl: p.fileUrl, fileSize: p.fileSize, mimeType: p.mimeType })),
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
      // Brief "woven ∞" confirmation in the seal area, then the full ceremony.
      // Every authored entry ends in the cloth — letters now weave too (invariant A).
      setSealed(true);
      setTimeout(() => setWoven(true), 720);
    },
    onError: (err: any) => {
      setError(err?.response?.data?.error ?? 'Could not save the entry.');
    },
  });

  const submitDisabled = save.isPending || !hasContent || uploadingCount > 0;

  // ── SEAL — the commit gesture ────────────────────────────────────────
  // The plain submit is replaced by a press-and-hold "Seal". Validation is
  // unchanged (same guards, same save.mutate); only the trigger UX moves. The
  // hold fills a SQUARE bar over 720ms with var(--ease); completing the hold
  // commits, releasing early cancels. Keyboard/AT users seal immediately via
  // Enter/Space — no hold required.
  const [holding, setHolding] = useState(false); // drives the fill (0 → 100%)
  const sealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The author's own dye paints the fill — a real palette token, never copper.
  const sealFill = useMemo(
    () => ((DYES as string[]).includes(dye) ? dyeVar(dye as Dye) : 'var(--bone)'),
    [dye],
  );

  // Run the validation guards once. Returns true when the entry is ready to
  // commit; otherwise surfaces the same inline errors the old button used.
  const validateForSeal = useCallback((): boolean => {
    setError(null);
    if (uploadingCount > 0) {
      setError('Wait for photos to finish uploading.');
      return false;
    }
    if (!body.trim()) {
      setBodyError('write something first');
      return false;
    }
    if (!hasContent) {
      setError(isLetter ? 'Write something — even a sentence.' : 'Write something, or add a photo.');
      return false;
    }
    if (isLetter && deliveryTrigger === 'date' && !scheduledDate) {
      setError('Choose the date this letter unseals.');
      return false;
    }
    return true;
  }, [uploadingCount, body, hasContent, isLetter, deliveryTrigger, scheduledDate]);

  const clearSealTimer = useCallback(() => {
    if (sealTimerRef.current) {
      clearTimeout(sealTimerRef.current);
      sealTimerRef.current = null;
    }
  }, []);

  // Commit immediately — used by the completed hold and by keyboard activation.
  const commitSeal = useCallback(() => {
    clearSealTimer();
    setHolding(false);
    if (submitDisabled) return;
    if (!validateForSeal()) return;
    save.mutate();
  }, [clearSealTimer, submitDisabled, validateForSeal, save]);

  // Pointer press begins the hold. Guards run up front so an invalid entry shows
  // its error instead of starting a fill that can never complete.
  const startHold = useCallback(() => {
    if (submitDisabled || save.isPending) return;
    if (!validateForSeal()) return;
    clearSealTimer();
    setHolding(true);
    sealTimerRef.current = setTimeout(() => {
      sealTimerRef.current = null;
      setHolding(false);
      save.mutate();
    }, 720);
  }, [submitDisabled, save, validateForSeal, clearSealTimer]);

  // Releasing (or leaving) before the 720ms elapses cancels the seal.
  const cancelHold = useCallback(() => {
    clearSealTimer();
    setHolding(false);
  }, [clearSealTimer]);

  useEffect(() => () => clearSealTimer(), [clearSealTimer]);

  const handleCancel = useCallback(() => {
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    if ((body.trim() || title.trim()) && !woven) {
      localStorage.setItem(
        draftKey,
        JSON.stringify({ title, body, entryDate, recipientId, recipientName, deliveryTrigger, scheduledDate, about, aboutRelation, room, emotion }),
      );
    }
    navigate('/loom/index');
  }, [body, title, entryDate, recipientId, recipientName, deliveryTrigger, scheduledDate, about, aboutRelation, room, emotion, woven, navigate, draftKey]);

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
      {/* Woven thread-band — top of the composer, fading into the ground, behind everything */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 'clamp(160px, 28vh, 280px)',
          backgroundImage: 'image-set(url("/woven/thread-band.avif") type("image/avif"), url("/woven/thread-band.webp") type("image/webp"), url("/woven/thread-band.png") type("image/png"))',
          backgroundSize: 'cover',
          backgroundPosition: 'top center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.8,
          pointerEvents: 'none',
          zIndex: 0,
          WebkitMaskImage: 'linear-gradient(to bottom, var(--ink) 0%, transparent 100%)',
          maskImage: 'linear-gradient(to bottom, var(--ink) 0%, transparent 100%)',
        }}
      />

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
          top: 'var(--topbar-h)',
          bottom: 0,
          left: 0,
          right: 0,
          overflowY: 'auto',
          padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)',
          zIndex: 10,
          opacity: revealed ? 1 : 0,
          transform: revealed ? 'translateY(0)' : 'translateY(12px)',
          transition: `opacity 720ms ${ease}, transform 720ms ${ease}`,
        }}
      >
        <div style={{ maxWidth: 'var(--page-max-prose)', margin: '0 auto' }}>
          {/* masthead — mono eyebrow + giant serif prompt, right-aligned mono date pill (cosmic COMPOSER) */}
          <header
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: 'clamp(16px, 4vw, 40px)',
              margin: '0 0 40px',
              flexWrap: 'wrap',
              opacity: writingFocused ? 0.4 : 1,
              transition: `opacity 720ms ${ease}`,
            }}
          >
            <div style={{ flex: '1 1 260px', minWidth: 0 }}>
              <p
                role="heading"
                aria-level={1}
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 11,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: 'var(--warm)',
                  margin: 0,
                }}
              >
                {isLetter ? 'Weave a new letter' : 'Weave a new thread'}
              </p>
            </div>
            <span
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 11,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--bone-dim)',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {new Date(`${entryDate}T00:00:00`).toLocaleDateString(undefined, {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </header>

          {/* ── Witness + Speak — top of screen, above the fold ───────────
              WITNESS: a quiet presence line addressing who this is for, naming a
              couple of younger members in their dye when the family store has
              them. SPEAK: a primary, scroll-free route to recording aloud.
              Both fade with the masthead when the author drops into writing. */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: 'clamp(16px, 4vw, 40px)',
              flexWrap: 'wrap',
              margin: '0 0 36px',
              opacity: writingFocused ? 0.35 : 1,
              transition: `opacity 720ms ${ease}`,
            }}
          >
            <div style={{ flex: '1 1 280px', minWidth: 0 }}>
              <p
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 10,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: 'var(--bone-faint)',
                  margin: '0 0 8px',
                }}
              >
                for those not yet born
              </p>
              <p
                className="hl-serif"
                style={{
                  fontFamily: 'var(--serif)',
                  fontStyle: 'italic',
                  fontSize: 'clamp(15px, 2vw, 17px)',
                  lineHeight: 1.6,
                  color: 'var(--bone-dim)',
                  margin: 0,
                  maxWidth: '46ch',
                }}
              >
                {witnesses.length > 0 ? (
                  <>
                    You are writing to those who come after —{' '}
                    {witnesses.map((m, i) => (
                      <span key={m.id}>
                        {i > 0 && (
                          <span style={{ color: 'var(--bone-faint)' }}>{' and '}</span>
                        )}
                        <span
                          className="hl-signature"
                          style={{
                            fontStyle: 'normal',
                            fontSize: '1.4em',
                            color: dyeTextColor(m.id, m.dye),
                          }}
                        >
                          {m.name}
                        </span>
                      </span>
                    ))}
                    {', and the ones whose names you will never know.'}
                  </>
                ) : (
                  <>You are writing to hands that have not yet been born. Address them.</>
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/record')}
              style={{
                flexShrink: 0,
                background: 'transparent',
                border: '1px solid var(--rule)',
                borderRadius: 0,
                padding: '11px 18px',
                minHeight: 44,
                cursor: 'pointer',
                fontFamily: 'var(--mono)',
                fontSize: 11,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--bone-dim)',
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
              speak it aloud instead →
            </button>
          </div>

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

            {/* Legacy recipients — who inherits this when the time comes (both modes) */}
            <LegacyRecipientPicker
              selectedIds={legacyRecipientIds}
              onChange={setLegacyRecipientIds}
            />
          </div>

          {/* Separator */}
          <div
            style={{
              borderTop: '1px solid var(--rule)',
              marginBottom: 40,
              opacity: writingFocused ? 0.3 : 0.7,
              transition: `opacity 720ms ${ease}`,
            }}
          />

          {/* ── Step 3: The writing area — flat italic serif body (cosmic-composer mockup) ── */}
          <div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isLetter ? 'Name this letter' : 'Give this memory a name'}
              aria-label="Title"
              style={{
                border: 0,
                background: 'transparent',
                color: title ? 'var(--bone)' : 'var(--bone-dim)',
                caretColor: 'var(--warm)',
                fontFamily: 'var(--serif-display)',
                fontWeight: 500,
                fontSize: 'clamp(30px, 5vw, 44px)',
                letterSpacing: '-0.01em',
                width: '100%',
                outline: 'none',
                padding: 0,
                margin: '0 0 24px',
                lineHeight: 1.1,
              }}
            />

            <textarea
              ref={textareaRef}
              value={body}
              onChange={handleBodyChange}
              onFocus={() => setWritingFocused(true)}
              onBlur={() => setWritingFocused(false)}
              aria-label="Memory content"
              aria-invalid={!!bodyError}
              aria-describedby={bodyError ? 'compose-body-error' : undefined}
              placeholder={
                isLetter
                  ? recipientName.trim()
                    ? `Dear ${recipientName},\n\nWrite your letter here…`
                    : 'Write your letter here…'
                  : seedPrompt || 'Share a family memory…'
              }
              style={{
                width: '100%',
                border: 0,
                background: 'transparent',
                caretColor: 'var(--warm)',
                fontFamily: 'var(--serif)',
                fontFeatureSettings: '"onum" 1, "liga" 1',
                fontSize: 'clamp(17px, 2.2vw, 18px)',
                fontWeight: 400,
                lineHeight: 1.75,
                color: 'var(--bone-dim)',
                minHeight: 300,
                outline: 'none',
                resize: 'none',
                padding: 0,
                overflow: 'hidden',
              }}
            />

            {bodyError && (
              <p id="compose-body-error" className="hl-mono" aria-live="polite" aria-atomic="true" style={{ fontSize: 10, color: 'var(--warm)', letterSpacing: '0.1em', marginTop: 6 }}>
                {bodyError}
              </p>
            )}

            {/* speak it → AI offers versions to choose from */}
            <div style={{ marginTop: 16 }}>
              <VoiceRefine
                kind={isLetter ? 'letter' : 'memory'}
                onPick={(text) => setBody((prev) => (prev.trim() ? `${prev.trim()}\n\n${text}` : text))}
              />
            </div>
          </div>

          {/* ── Photos (memory mode only) ─────────────────────────────── */}
          {!isLetter && (
            <div style={{ marginTop: 32 }}>
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
                        alt="attached photo"
                        loading="lazy"
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
                            background: sealFill,
                            transition: 'width 180ms var(--ease)',
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
                            color: 'var(--warm)',
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
                          background: 'var(--ink-translucent)',
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

          {/* ── The attributes — who it's about, where, the feeling ───── */}
          {!isLetter && (
            <div
              style={{
                marginTop: 48,
                paddingTop: 24,
                borderTop: '1px solid var(--rule)',
                opacity: writingFocused ? 0.45 : 1,
                transition: `opacity 720ms ${ease}`,
              }}
            >
              <AboutField
                about={about}
                relation={aboutRelation}
                onAboutChange={setAbout}
                onRelationChange={setAboutRelation}
              />
              <RoomField value={room} onChange={setRoom} />
              <EmotionField body={body} value={emotion} onChange={setEmotion} />
            </div>
          )}

          {/* Listener */}
          <div style={{ marginTop: 32 }}>
            <ListenerLine
              text={suggestion}
              loading={listenerLoading}
              onRefresh={listenerRefresh}
            />
          </div>

          {error && (
            <p
              role="alert"
              aria-live="polite"
              aria-atomic="true"
              style={{
                marginTop: 20,
                fontFamily: 'var(--mono)',
                fontSize: 11,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--warm)',
              }}
            >
              {error}
              {/* Quota/413 from the worker reads "Storage limit reached…". Give it
                  an actionable way out — a quiet link to billing, same mono/warm key. */}
              {/storage limit|upgrade/i.test(error) && (
                <>
                  {' · '}
                  <Link to="/billing" style={{ color: 'var(--warm-bright)', textDecoration: 'underline' }}>
                    See plans
                  </Link>
                </>
              )}
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

          {/* Footer — quiet word-count left, outlined WEAVE IT IN cta right (cosmic-composer mockup) */}
          <div
            style={{
              marginTop: 40,
              paddingTop: 24,
              borderTop: '1px solid var(--rule)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 20,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 24 }}>
              <span
                className="hl-mono"
                style={{
                  fontSize: 10,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--bone-faint)',
                }}
              >
                {`${wordCount} ${wordCount === 1 ? 'word' : 'words'}`}
              </span>
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  background: 'transparent',
                  border: 0,
                  padding: '8px 0',
                  minHeight: 44,
                  cursor: 'pointer',
                  fontFamily: 'var(--mono)',
                  fontSize: 10,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--bone-faint)',
                  transition: 'color 180ms var(--ease)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--bone-dim)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--bone-faint)'; }}
              >
                cancel
              </button>
            </div>
            {/* SEAL — press-and-hold commit. The square dye fill grows behind the
                label over 720ms (var(--ease)); a completed hold or keyboard
                Enter/Space commits, releasing early cancels. No copper disc /
                ring / halo / radial — RULE 2: the fill is a flat dye/bone bar. */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: 8,
                flexShrink: 0,
              }}
            >
              <button
                type="button"
                disabled={submitDisabled}
                aria-label="Seal this entry — press and hold, or press Enter to seal immediately"
                // Keyboard / assistive tech: a real activation seals at once — no
                // hold gesture is required for non-pointer users.
                onClick={(e) => {
                  // Pointer "clicks" are already handled by the hold lifecycle;
                  // only act on genuine keyboard activation (detail === 0).
                  if (e.detail === 0) commitSeal();
                }}
                // Pointer hold lifecycle.
                onPointerDown={(e) => {
                  if (e.pointerType === 'mouse' && e.button !== 0) return;
                  startHold();
                }}
                onPointerUp={cancelHold}
                onPointerLeave={cancelHold}
                onPointerCancel={cancelHold}
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  isolation: 'isolate',
                  background: 'transparent',
                  border: '1px solid var(--copper-border)',
                  borderRadius: 0,
                  padding: '12px 32px',
                  minHeight: 44,
                  fontFamily: 'var(--mono)',
                  fontSize: 12,
                  letterSpacing: '0.26em',
                  textTransform: 'uppercase',
                  color: 'var(--gold-text)',
                  cursor: submitDisabled ? 'default' : 'pointer',
                  opacity: submitDisabled ? 0.4 : 1,
                  touchAction: 'none',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  transition: 'border-color 180ms var(--ease), color 180ms var(--ease), opacity 180ms var(--ease)',
                }}
                onMouseEnter={(e) => {
                  if (submitDisabled) return;
                  e.currentTarget.style.borderColor = 'var(--warm-bright)';
                }}
                onMouseLeave={(e) => {
                  if (submitDisabled) return;
                  e.currentTarget.style.borderColor = 'var(--copper-border)';
                }}
              >
                {/* Square progress fill — dye (or bone), flat, radius 0. */}
                <span
                  aria-hidden
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: holding || sealed || save.isPending ? '100%' : '0%',
                    background: sealFill,
                    opacity: sealed ? 0.4 : 0.28,
                    borderRadius: 0,
                    zIndex: -1,
                    transition: holding ? `width 720ms ${ease}` : `opacity 360ms ${ease}`,
                    pointerEvents: 'none',
                  }}
                />
                <span style={{ position: 'relative' }}>
                  {sealed ? (
                    // Brief confirmation — ∞ as text, copper colour, no glow.
                    <>
                      woven{' '}
                      <span aria-hidden style={{ color: 'var(--warm)' }}>∞</span>
                    </>
                  ) : save.isPending ? (
                    isLetter ? 'sealing…' : 'weaving…'
                  ) : holding ? (
                    'sealing…'
                  ) : (
                    'seal'
                  )}
                </span>
              </button>

              {/* The vow — quiet, beneath the gesture. For a future-delivery
                  letter we keep the WHEN context (submitLabel) so the hold's
                  meaning isn't lost; otherwise the irreversibility vow. */}
              <span
                aria-hidden
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 9.5,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: 'var(--bone-faint)',
                  textAlign: 'right',
                  maxWidth: 260,
                  lineHeight: 1.5,
                }}
              >
                press and hold to seal — this cannot be unwritten
                {isLetter && deliveryTrigger !== 'now' && (
                  <>
                    {' · '}
                    {submitLabel.replace(/\s*→\s*$/, '')}
                  </>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
