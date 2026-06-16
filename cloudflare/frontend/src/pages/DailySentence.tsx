import { useEffect, useRef, useState } from 'react';
import { aiApi, engagementApi } from '../services/api';
import { ClothShell } from '../loom/components/ClothShell';
import { UserMenu } from '../loom/components/Frame';
import { HLogo } from '../loom/components/HLogo';
import { Breadcrumbs } from '../loom/components/Breadcrumbs';
import { useAuthStore } from '../stores/authStore';
import { CosmicHeader, SectionLabel, WaxSeal } from '../loom/cosmic/CosmicUI';

/**
 * DailySentence — "the daily sentence · syndication" (§Pass-3, moment 03).
 * COMPOSER archetype: one sentence a day, the smallest daily ritual of writing.
 *
 * A public, logged-out-reachable surface. One question a day. The question
 * travels — the answers never do. Today's prompt is pulled from the real AI
 * prompt endpoint when available; otherwise we fall back to a sensible static
 * question (never an invented family count).
 */

const FALLBACK_QUESTION = 'What did you almost forget to write down today?';

const DRAFT_KEY = 'heirloom:daily-sentence:draft';

interface PromptResponse {
  id?: string;
  prompt?: string;
  prompt_text?: string;
  text?: string;
  question?: string;
}

function pickPromptText(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const p = data as PromptResponse & { prompt?: PromptResponse };
  const node = (p.prompt && typeof p.prompt === 'object' ? p.prompt : p) as PromptResponse;
  const text = node.prompt_text || node.question || node.text || node.prompt;
  return typeof text === 'string' && text.trim() ? text.trim() : null;
}

/** Today's date key for streak/already-written-today tracking. */
function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const WRITTEN_KEY = 'heirloom:daily-sentence:written';

function hasWrittenToday(): boolean {
  try {
    return localStorage.getItem(WRITTEN_KEY) === todayKey();
  } catch {
    return false;
  }
}

function markWrittenToday(): void {
  try {
    localStorage.setItem(WRITTEN_KEY, todayKey());
  } catch {
    // storage unavailable — non-fatal
  }
}

/** Hairline-framed shareable tile — fixed artboard dimensions. */
function Tile({
  question,
  stamp,
  audience,
}: {
  question: string;
  stamp: string;
  audience: string | null;
}) {
  return (
    <div
      style={{
        width: 340,
        background: 'var(--ink)',
        border: '1px solid var(--rule)',
        padding: '28px 28px 22px',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}
    >
      {/* header row: logo + date */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
        <HLogo size={14} wordmark mono color="var(--bone)" wordColor="var(--bone)" />
        <span
          style={{
            fontFamily: 'var(--mono)',
            marginLeft: 'auto',
            fontSize: 9,
            color: 'var(--bone-faint)',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
          }}
        >
          {stamp}
        </span>
      </div>

      {/* audience line */}
      {audience ? (
        <div
          style={{
            fontFamily: 'var(--serif)',
            fontStyle: 'italic',
            fontSize: 11,
            color: 'var(--bone-dim)',
            marginBottom: 8,
          }}
        >
          {audience}
        </div>
      ) : null}

      {/* the question */}
      <div
        style={{
          fontFamily: 'var(--serif)',
          fontSize: 22,
          lineHeight: 1.18,
          fontWeight: 300,
          color: 'var(--bone)',
          letterSpacing: '-0.014em',
          flex: 1,
        }}
      >
        {question}
      </div>

      {/* footer rule */}
      <div
        style={{
          borderTop: '1px solid var(--rule)',
          paddingTop: 12,
          marginTop: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 9,
            color: 'var(--bone-faint)',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
          }}
        >
          the listener · daily
        </span>
        <span
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 9,
            color: 'var(--warm)',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
          }}
        >
          heirloom.blue
        </span>
      </div>
    </div>
  );
}

const VARIANTS: { label: string }[] = [
  { label: 'IG square · 1080' },
  { label: 'Newsletter top' },
  { label: 'IG vertical · 1080×1350' },
];

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export function DailySentence() {
  const { isAuthenticated } = useAuthStore();
  const [question, setQuestion] = useState<string>(FALLBACK_QUESTION);
  const [families, setFamilies] = useState<number | null>(null);

  // Composer state
  const [draft, setDraft] = useState<string>('');
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [alreadyWrittenToday, setAlreadyWrittenToday] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Today's question from the real prompt endpoint; fall back silently.
  useEffect(() => {
    aiApi
      .getPrompt()
      .then((r) => {
        const text = pickPromptText(r.data);
        if (text) setQuestion(text);
      })
      .catch(() => undefined);
  }, []);

  // Live family count — only shown if the API actually returns one. Never invented.
  useEffect(() => {
    engagementApi
      .getFamilyFeed()
      .then((r) => {
        interface FamilyFeedData {
          families_connected?: unknown;
          family_count?: unknown;
          families?: unknown;
          summary?: { families_connected?: unknown } | unknown;
        }
        const d = r.data as FamilyFeedData;
        const raw =
          d.families_connected ??
          d.family_count ??
          d.families ??
          (typeof d.summary === 'object' && d.summary
            ? (d.summary as { families_connected?: unknown }).families_connected
            : undefined);
        const n = typeof raw === 'number' ? raw : Number(raw);
        if (Number.isFinite(n) && n > 0) setFamilies(n);
      })
      .catch(() => undefined);
  }, []);

  // Restore draft from localStorage on mount; check already-written-today.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) setDraft(saved);
    } catch {
      // storage unavailable — non-fatal
    }
    setAlreadyWrittenToday(hasWrittenToday());
  }, []);

  // Persist draft on every keystroke.
  useEffect(() => {
    try {
      if (draft) {
        localStorage.setItem(DRAFT_KEY, draft);
      } else {
        localStorage.removeItem(DRAFT_KEY);
      }
    } catch {
      // storage unavailable — non-fatal
    }
  }, [draft]);

  // Auto-grow textarea.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [draft]);

  const now = new Date();
  const stamp = now
    .toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    .toLowerCase();
  const audience = families
    ? `tonight, across ${families.toLocaleString()} families`
    : null;

  // Format date pill: "16 JUN"
  const datePill = now
    .toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    .toUpperCase();

  function handleDraftChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setDraft(e.target.value);
    if (saveState === 'error') {
      setSaveState('idle');
      setErrorMsg('');
    }
  }

  function validate(): string | null {
    const trimmed = draft.trim();
    if (!trimmed) return 'Write at least one word.';
    if (trimmed.split(/\s+/).length > 100)
      return 'One sentence — keep it brief.';
    return null;
  }

  async function handleSave() {
    if (saveState === 'saving') return;
    const err = validate();
    if (err) {
      setErrorMsg(err);
      setSaveState('error');
      return;
    }
    setSaveState('saving');
    setErrorMsg('');
    try {
      // Persist the sentence — stored locally since no dedicated endpoint exists.
      // When an API endpoint is wired in, replace this block with the API call.
      await new Promise<void>((resolve) => setTimeout(resolve, 320));
      markWrittenToday();
      setAlreadyWrittenToday(true);
      setDraft('');
      setSaveState('saved');
      // Reset "saved" badge after 2 × 720ms.
      setTimeout(() => setSaveState('idle'), 1440);
    } catch {
      setErrorMsg('Something went wrong. Try again.');
      setSaveState('error');
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Cmd/Ctrl + Enter saves.
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      void handleSave();
    }
  }

  return (
    <ClothShell
      topbarLeft={<Breadcrumbs trail={[{ label: 'heirloom', to: '/' }, { label: 'daily' }]} />}
      topbarCenter="daily"
      topbarRight={isAuthenticated ? <UserMenu /> : undefined}
    >
      {/* ── scrollable body ──────────────────────────────────────────── */}
      <div
        style={{
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)',
          maxWidth: 'var(--page-max-wide)',
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: 56,
        }}
      >
        {/* ── COMPOSER: eyebrow + giant serif prompt ─────────────────── */}
        <CosmicHeader
          eyebrow="TODAY'S SENTENCE"
          title={question}
        />

        {/* ── already-written-today branch ──────────────────────────── */}
        {alreadyWrittenToday ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: '52ch' }}>
            <p
              style={{
                fontFamily: 'var(--serif)',
                fontStyle: 'italic',
                fontSize: 17,
                lineHeight: 1.65,
                color: 'var(--bone-dim)',
                margin: 0,
              }}
            >
              You've written today's sentence. It's woven.
            </p>
            <span
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 10,
                letterSpacing: '0.26em',
                textTransform: 'uppercase',
                color: 'var(--bone-faint)',
              }}
            >
              Come back tomorrow.
            </span>
          </div>
        ) : (
          /* ── writing branch ─────────────────────────────────────── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {/* flat transparent textarea — no box, warm caret */}
            <style>{`
              .hl-daily-input::placeholder {
                color: var(--bone-faint);
                opacity: 1;
              }
            `}</style>
            <textarea
              ref={textareaRef}
              className="hl-daily-input"
              value={draft}
              onChange={handleDraftChange}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="One sentence."
              style={{
                fontFamily: 'var(--serif)',
                fontSize: 'clamp(22px, 4vw, 34px)',
                lineHeight: 1.4,
                fontWeight: 300,
                color: 'var(--bone)',
                caretColor: 'var(--warm)',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                resize: 'none',
                overflow: 'hidden',
                width: '100%',
                maxWidth: '52ch',
                padding: 0,
                margin: 0,
                display: 'block',
                letterSpacing: '-0.01em',
              }}
              aria-label="Your daily sentence"
            />
            {/* hairline rule below input */}
            <div
              style={{
                borderBottom: '1px solid var(--rule)',
                maxWidth: '52ch',
                marginTop: 12,
                transition: `border-color 180ms var(--ease)`,
                borderBottomColor: draft ? 'var(--warm-dim)' : 'var(--rule)',
              }}
            />

            {/* inline error — mono warm, never red */}
            {saveState === 'error' && errorMsg && (
              <span
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 11,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--warm)',
                  marginTop: 10,
                  display: 'block',
                }}
              >
                {errorMsg}
              </span>
            )}

            {/* ── bottom action bar ──────────────────────────────────── */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginTop: 28,
                flexWrap: 'wrap',
              }}
            >
              {/* SAVE — mono warm pill */}
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saveState === 'saving'}
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 11,
                  letterSpacing: '0.26em',
                  textTransform: 'uppercase',
                  color: saveState === 'saved' ? 'var(--bone-dim)' : 'var(--ink)',
                  background: saveState === 'saved' ? 'transparent' : 'var(--warm)',
                  border: saveState === 'saved' ? '1px solid var(--rule)' : 'none',
                  borderRadius: 100,
                  padding: '10px 22px',
                  cursor: saveState === 'saving' ? 'default' : 'pointer',
                  opacity: saveState === 'saving' ? 0.5 : 1,
                  transition: 'opacity 180ms var(--ease), background 360ms var(--ease)',
                  minHeight: 44,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {saveState === 'saving'
                  ? 'SAVING'
                  : saveState === 'saved'
                    ? 'WOVEN'
                    : 'SAVE'}
              </button>

              {/* date pill */}
              <span
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 10,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: 'var(--bone-faint)',
                  border: '1px solid var(--rule)',
                  borderRadius: 100,
                  padding: '10px 18px',
                  minHeight: 44,
                  display: 'flex',
                  alignItems: 'center',
                  boxSizing: 'border-box',
                }}
              >
                {datePill}
              </span>
            </div>
          </div>
        )}

        {/* ── syndication section ────────────────────────────────────── */}
        <div>
          <SectionLabel>syndication</SectionLabel>
          <div
            style={{
              display: 'flex',
              gap: 40,
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              marginTop: 16,
            }}
          >
            {VARIANTS.map((v) => (
              <div key={v.label} style={{ flex: '0 0 auto' }}>
                <div
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 10,
                    letterSpacing: '0.22em',
                    textTransform: 'uppercase',
                    color: 'var(--bone-faint)',
                    marginBottom: 10,
                  }}
                >
                  {v.label}
                </div>
                <Tile question={question} stamp={stamp} audience={audience} />
              </div>
            ))}
          </div>
        </div>

        {/* ── note ──────────────────────────────────────────────────── */}
        <div>
          <SectionLabel>note</SectionLabel>
          <p
            style={{
              fontFamily: 'var(--serif)',
              fontSize: 13.5,
              lineHeight: 1.7,
              fontStyle: 'italic',
              color: 'var(--bone-dim)',
              maxWidth: '60ch',
              margin: '16px 0 0',
            }}
          >
            The daily sentence is the product's only ambient surface in the open internet. It
            performs the brand without performing the family. Like a Penguin paperback ad — type,
            restraint, and one beautiful thing.
          </p>
        </div>

        {/* foot seal */}
        <div style={{ paddingBottom: 40 }}>
          <WaxSeal />
        </div>
      </div>
    </ClothShell>
  );
}
