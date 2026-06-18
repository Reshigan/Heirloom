import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { TapestryEdge } from '../loom/components/Frame';
import { ClothShell } from '../loom/components/ClothShell';
import { HLogo } from '../loom/components/HLogo';
import { WaxSeal } from '../loom/cosmic/CosmicUI';
import { threadsApi, type ThreadVisibility, type ThreadLockType } from '../services/api';

/**
 * /threads/:id/compose — write an entry directly to a specific thread.
 *
 * Supports an optional DATE-based time lock. AGE / EVENT / GENERATION locks
 * require a target_member_id picker that's not yet built — use the legacy
 * Capsules surface for those, or wait for the next iteration here.
 *
 * The body is sent as plaintext in body_ciphertext for now (the thread
 * encryption envelope arrives in a later phase). The worker accepts this.
 */

const EASE = 'cubic-bezier(0.16,1,0.3,1)';

/** Mono uppercase eyebrow / field label. */
const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: "var(--mono, 'Space Mono', monospace)",
  fontSize: 10,
  letterSpacing: '0.26em',
  textTransform: 'uppercase',
  color: 'var(--bone-faint)',
  marginBottom: 12,
};

/** Underline-only mono field (dates / numbers / text inside the lock panel). */
const fieldStyle: React.CSSProperties = {
  width: '100%',
  background: 'transparent',
  border: 0,
  borderBottom: '1px solid var(--rule)',
  color: 'var(--bone)',
  caretColor: 'var(--warm)',
  fontFamily: "var(--mono, 'Space Mono', monospace)",
  fontSize: 13,
  letterSpacing: '0.04em',
  fontWeight: 400,
  padding: '8px 0',
  outline: 'none',
  boxSizing: 'border-box',
  borderRadius: 0,
  transition: `border-color 180ms ${EASE}`,
};

/** Underline-only mono select — same skin, native dropdown caret. */
const selectStyle: React.CSSProperties = {
  ...fieldStyle,
  appearance: 'none',
  cursor: 'pointer',
  paddingRight: 24,
  backgroundImage:
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6'><polyline points='0,0 5,6 10,0' fill='none' stroke='rgba(242,230,208,0.32)' stroke-width='1.2'/></svg>\")",
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 4px center',
};

/** A bottom-bar pill: mono, uppercase, hairline-bordered. */
function pillStyle(warm: boolean, disabled = false): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    background: 'transparent',
    border: `1px solid ${warm ? 'var(--warm)' : 'var(--rule)'}`,
    borderRadius: 0,
    padding: '0 22px',
    minHeight: 44,
    cursor: disabled ? 'default' : 'pointer',
    fontFamily: "var(--mono, 'Space Mono', monospace)",
    fontSize: 12,
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
    color: warm ? 'var(--warm)' : 'var(--bone-dim)',
    textDecoration: 'none',
    opacity: disabled ? 0.4 : 1,
    transition: `opacity 180ms ${EASE}, border-color 180ms ${EASE}`,
  };
}

export function ThreadCompose() {
  const { id } = useParams<{ id: string }>();
  const threadId = id ?? '';
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [visibility, setVisibility] = useState<ThreadVisibility>('FAMILY');
  const [enableLock, setEnableLock] = useState(false);
  const [lockType, setLockType] = useState<ThreadLockType>('DATE');
  const [lockDate, setLockDate] = useState('');
  const [lockTargetMemberId, setLockTargetMemberId] = useState('');
  const [lockAgeYears, setLockAgeYears] = useState<number | ''>('');
  const [lockEventLabel, setLockEventLabel] = useState('');
  const [lockGeneration, setLockGeneration] = useState<number | ''>('');
  const [error, setError] = useState<string | null>(null);

  const { data: detail } = useQuery({
    queryKey: ['thread', threadId],
    queryFn: () => threadsApi.get(threadId).then((r) => r.data),
    enabled: !!threadId,
  });

  const { data: membersData } = useQuery({
    queryKey: ['thread', threadId, 'members'],
    queryFn: () => threadsApi.listMembers(threadId).then((r) => r.data),
    enabled: !!threadId,
  });
  const members = membersData?.members ?? [];

  const create = useMutation({
    mutationFn: () => {
      const payload: Parameters<typeof threadsApi.createEntry>[1] = {
        title: title.trim() || undefined,
        body_ciphertext: body.trim(),
        visibility,
      };
      if (enableLock) {
        const unlock: NonNullable<typeof payload.unlock> = {
          lock_type: lockType,
          encrypted_key: '',
        };
        if (lockType === 'DATE') unlock.unlock_date = lockDate;
        if (lockType === 'AGE') {
          unlock.target_member_id = lockTargetMemberId;
          unlock.age_years =
            typeof lockAgeYears === 'number'
              ? lockAgeYears
              : parseInt(String(lockAgeYears), 10);
        }
        if (lockType === 'RECIPIENT_EVENT') {
          unlock.target_member_id = lockTargetMemberId;
          unlock.event_label = lockEventLabel.trim();
        }
        if (lockType === 'GENERATION') {
          unlock.target_generation =
            typeof lockGeneration === 'number'
              ? lockGeneration
              : parseInt(String(lockGeneration), 10);
        }
        payload.unlock = unlock;
      }
      return threadsApi.createEntry(threadId, payload).then((r) => r.data);
    },
    onSuccess: () => {
      navigate(`/threads/${threadId}`);
    },
    onError: (err: { response?: { data?: { error?: string } }; message?: string }) => {
      setError(err?.response?.data?.error ?? err?.message ?? 'Could not save entry.');
    },
  });

  const handleSave = () => {
    setError(null);
    if (!body.trim()) {
      setError('Write something — even a sentence.');
      return;
    }
    if (enableLock) {
      if (lockType === 'DATE' && !lockDate) {
        setError('Pick the date the entry should open, or turn the lock off.');
        return;
      }
      if (lockType === 'AGE' && (!lockTargetMemberId || !lockAgeYears)) {
        setError('Pick a member and an age for the age-gate lock.');
        return;
      }
      if (lockType === 'RECIPIENT_EVENT' && (!lockTargetMemberId || !lockEventLabel.trim())) {
        setError('Pick a member and describe the event the lock waits for.');
        return;
      }
      if (lockType === 'GENERATION' && !lockGeneration) {
        setError('Pick the generation the entry should wait for.');
        return;
      }
    }
    create.mutate();
  };

  const today = new Date().toISOString().slice(0, 10);
  const thread = detail?.thread;
  const busy = create.isPending;
  const canSave = !!body.trim() && !busy;

  const topbarLeftContent = (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 18 }}>
      <Link
        to="/loom"
        style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
      >
        <HLogo size={18} wordmark />
      </Link>
      {thread?.name && (
        <>
          <span style={{ color: 'var(--bone-low)' }}>·</span>
          <span
            className="hl-eyebrow"
            style={{ color: 'var(--bone-dim)', textTransform: 'none', letterSpacing: 0, fontSize: 13 }}
          >
            {thread.name}
          </span>
        </>
      )}
    </span>
  );

  const topbarRightContent = (
    <button
      type="button"
      onClick={handleSave}
      disabled={!canSave}
      style={{
        background: 'transparent',
        border: 0,
        padding: 0,
        cursor: canSave ? 'pointer' : 'default',
        fontFamily: "var(--mono, 'Space Mono', monospace)",
        fontSize: 11,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        color: 'var(--warm)',
        opacity: canSave ? 1 : 0.4,
        transition: `opacity 180ms ${EASE}`,
      }}
    >
      {busy ? 'weaving…' : 'weave →'}
    </button>
  );

  return (
    <ClothShell
      topbarLeft={topbarLeftContent}
      topbarCenter="adding to the thread"
      topbarRight={topbarRightContent}
    >
      {/* ── Scrollable content area ── */}
      <div
        style={{
          position: 'absolute',
          top: 56,
          bottom: 28,
          left: 0,
          right: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        <div
          style={{
            maxWidth: 'var(--page-max-wide)',
            margin: '0 auto',
            padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)',
          }}
        >
          {/* Mono eyebrow + giant serif prompt (COMPOSER head) */}
          <header style={{ marginBottom: 40, maxWidth: '16em' }}>
            <div
              style={{
                fontFamily: "var(--mono, 'Space Mono', monospace)",
                fontSize: 11,
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                color: 'var(--bone-faint)',
                marginBottom: 18,
              }}
            >
              weave a new entry
            </div>
            <h1
              style={{
                fontFamily: "var(--serif-display, 'Cormorant Garamond', serif)",
                fontSize: 'clamp(30px, 5vw, 44px)',
                lineHeight: 1.06,
                letterSpacing: '-0.012em',
                color: 'var(--bone)',
                margin: 0,
                fontWeight: 500,
              }}
            >
              What will you tell{' '}
              <span style={{ fontStyle: 'italic', color: 'var(--warm)' }}>them</span>?
            </h1>
            <p
              style={{
                fontFamily: "var(--serif, 'Spectral', serif)",
                fontStyle: 'italic',
                fontWeight: 300,
                fontSize: 17,
                lineHeight: 1.55,
                color: 'var(--bone-dim)',
                margin: '20px 0 0',
                maxWidth: '30em',
              }}
            >
              Write to your descendants. What you weave here cannot be altered once it is woven.
            </p>
          </header>

          <form
            onSubmit={(e) => { e.preventDefault(); handleSave(); }}
            style={{ display: 'grid', gap: 28 }}
          >
            {/* Flat transparent serif title input — no box, warm caret */}
            <input
              id="t-title"
              aria-label="Thread title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="The summer Nan taught me to bake"
              maxLength={200}
              style={{
                width: '100%',
                background: 'transparent',
                border: 0,
                color: 'var(--bone)',
                caretColor: 'var(--warm)',
                fontFamily: "var(--serif, 'Spectral', serif)",
                fontVariationSettings: "'opsz' 40",
                fontSize: 'clamp(30px, 5vw, 44px)',
                fontWeight: 380,
                lineHeight: 1.1,
                letterSpacing: '-0.012em',
                padding: 0,
                outline: 'none',
                boxSizing: 'border-box',
                borderRadius: 0,
              }}
            />

            {/* Serif body textarea — 18px / 1.75 prose */}
            <textarea
              id="t-body"
              aria-label="Thread body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write to your descendants. Tell them something. They will read this."
              required
              style={{
                width: '100%',
                background: 'transparent',
                border: 0,
                color: 'var(--bone)',
                caretColor: 'var(--warm)',
                fontFamily: "var(--serif, 'Spectral', serif)",
                fontVariationSettings: "'opsz' 14",
                fontSize: 18,
                fontWeight: 300,
                lineHeight: 1.75,
                padding: 0,
                outline: 'none',
                resize: 'none',
                minHeight: 300,
                boxSizing: 'border-box',
                borderRadius: 0,
              }}
            />

            {/* Visibility — mono label + underline select */}
            <div>
              <label htmlFor="t-vis" style={labelStyle}>
                who can read this
              </label>
              <select
                id="t-vis"
                aria-label="Who can read this"
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as ThreadVisibility)}
                style={{ ...selectStyle, maxWidth: 480 }}
              >
                <option value="FAMILY">Family — anyone in the thread, now and later</option>
                <option value="DESCENDANTS">Descendants only — generations after yours</option>
                <option value="PRIVATE">Private — for a specific recipient (future feature)</option>
              </select>
            </div>

            {/* Time-lock — mono label + checkbox row */}
            <div>
              <span style={labelStyle}>when it opens</span>
              <label
                style={{ display: 'flex', alignItems: 'flex-start', gap: 14, cursor: 'pointer' }}
              >
                <input
                  type="checkbox"
                  checked={enableLock}
                  onChange={(e) => setEnableLock(e.target.checked)}
                  style={{ marginTop: 3, accentColor: 'var(--warm)', flexShrink: 0 }}
                />
                <div>
                  <p
                    className="hl-serif"
                    style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 300, color: 'var(--bone)', fontFamily: "var(--serif, 'Spectral', serif)" }}
                  >
                    Seal this entry
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 14,
                      color: 'var(--bone-dim)',
                      lineHeight: 1.65,
                      fontFamily: "var(--serif, 'Spectral', serif)",
                      fontWeight: 300,
                    }}
                  >
                    The entry stays sealed until the moment you choose. Write today; have it open on
                    a wedding day, a 21st, a centenary.
                  </p>
                </div>
              </label>

              {enableLock ? (
                <div style={{ marginTop: 24, paddingLeft: 28, display: 'grid', gap: 20 }}>
                  <div>
                    <label htmlFor="t-lock-type" style={labelStyle}>
                      Lock type
                    </label>
                    <select
                      id="t-lock-type"
                      value={lockType}
                      onChange={(e) => setLockType(e.target.value as ThreadLockType)}
                      style={{ ...selectStyle, maxWidth: 360 }}
                    >
                      <option value="DATE">A specific date</option>
                      <option value="AGE">When someone reaches an age</option>
                      <option value="RECIPIENT_EVENT">
                        When an event happens (wedding, first child…)
                      </option>
                      <option value="GENERATION">
                        When a generation exists in the thread
                      </option>
                    </select>
                  </div>

                  {lockType === 'DATE' ? (
                    <div>
                      <label htmlFor="t-lock-date" style={labelStyle}>
                        Open on
                      </label>
                      <input
                        id="t-lock-date"
                        type="date"
                        min={today}
                        value={lockDate}
                        onChange={(e) => setLockDate(e.target.value)}
                        style={{ ...fieldStyle, maxWidth: 200 }}
                      />
                    </div>
                  ) : null}

                  {lockType === 'AGE' ? (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 20,
                        maxWidth: 480,
                      }}
                    >
                      <div>
                        <label htmlFor="t-lock-member" style={labelStyle}>
                          Recipient
                        </label>
                        <select
                          id="t-lock-member"
                          value={lockTargetMemberId}
                          onChange={(e) => setLockTargetMemberId(e.target.value)}
                          style={selectStyle}
                        >
                          <option value="">— pick a member —</option>
                          {members.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.display_name}
                              {m.relation_label ? ` (${m.relation_label})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="t-lock-age" style={labelStyle}>
                          Open at age
                        </label>
                        <input
                          id="t-lock-age"
                          type="number"
                          min={1}
                          max={120}
                          value={lockAgeYears}
                          onChange={(e) =>
                            setLockAgeYears(
                              e.target.value === '' ? '' : parseInt(e.target.value, 10)
                            )
                          }
                          style={fieldStyle}
                        />
                      </div>
                    </div>
                  ) : null}

                  {lockType === 'RECIPIENT_EVENT' ? (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 20,
                        maxWidth: 480,
                      }}
                    >
                      <div>
                        <label htmlFor="t-lock-event-member" style={labelStyle}>
                          Recipient
                        </label>
                        <select
                          id="t-lock-event-member"
                          value={lockTargetMemberId}
                          onChange={(e) => setLockTargetMemberId(e.target.value)}
                          style={selectStyle}
                        >
                          <option value="">— pick a member —</option>
                          {members.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.display_name}
                              {m.relation_label ? ` (${m.relation_label})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="t-lock-event" style={labelStyle}>
                          Event
                        </label>
                        <input
                          id="t-lock-event"
                          type="text"
                          value={lockEventLabel}
                          onChange={(e) => setLockEventLabel(e.target.value)}
                          placeholder="wedding, first_child, graduation"
                          style={fieldStyle}
                        />
                      </div>
                    </div>
                  ) : null}

                  {lockType === 'GENERATION' ? (
                    <div>
                      <label htmlFor="t-lock-gen" style={labelStyle}>
                        Open once a member of generation N exists
                      </label>
                      <input
                        id="t-lock-gen"
                        type="number"
                        min={1}
                        max={6}
                        value={lockGeneration}
                        onChange={(e) =>
                          setLockGeneration(
                            e.target.value === '' ? '' : parseInt(e.target.value, 10)
                          )
                        }
                        style={{ ...fieldStyle, maxWidth: 120 }}
                      />
                      <p
                        className="hl-mono"
                        style={{
                          margin: '6px 0 0',
                          fontSize: 10,
                          color: 'var(--bone-faint)',
                          letterSpacing: '0.06em',
                          fontFamily: "var(--mono, 'Space Mono', monospace)",
                        }}
                      >
                        +1 = your children · +2 = grandchildren · +3 = great-grandchildren
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            {/* Inline mono/serif error — warm, never red, never toast */}
            {error ? (
              <p
                role="alert"
                style={{
                  margin: 0,
                  fontFamily: "var(--serif, 'Spectral', serif)",
                  fontStyle: 'italic',
                  fontSize: 14,
                  color: 'var(--warm)',
                  fontWeight: 300,
                }}
              >
                {error}
              </p>
            ) : null}

            {/* ── Bottom action bar — WEAVE pill + lock-state pill + cancel ── */}
            <div
              style={{
                marginTop: 8,
                paddingTop: 22,
                borderTop: '1px solid var(--rule)',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                flexWrap: 'wrap',
              }}
            >
              <button
                type="submit"
                disabled={!canSave}
                onClick={handleSave}
                style={pillStyle(true, !canSave)}
              >
                {busy ? 'weaving…' : 'weave →'}
              </button>

              {/* Secondary: seal / lock state pill (mirrors the time-lock toggle) */}
              <button
                type="button"
                onClick={() => setEnableLock((v) => !v)}
                style={pillStyle(false)}
              >
                {enableLock ? 'sealed ·' : 'seal entry'}
                {enableLock && (
                  <span style={{ color: 'var(--warm)', letterSpacing: '0.14em' }}>
                    {lockType === 'DATE'
                      ? lockDate || 'date'
                      : lockType === 'AGE'
                        ? 'age'
                        : lockType === 'RECIPIENT_EVENT'
                          ? 'event'
                          : 'generation'}
                  </span>
                )}
              </button>

              <Link
                to={`/threads/${threadId}`}
                style={{
                  fontFamily: "var(--mono, 'Space Mono', monospace)",
                  fontSize: 11,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: 'var(--bone-faint)',
                  textDecoration: 'none',
                  marginLeft: 'auto',
                  transition: `color 180ms ${EASE}`,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.color = 'var(--bone-dim)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.color = 'var(--bone-faint)';
                }}
              >
                cancel
              </Link>
            </div>

            {/* Append-only notice, then the resting ∞ */}
            <p
              className="hl-mono"
              style={{
                margin: '4px 0 0',
                fontSize: 10,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--bone-faint)',
                fontFamily: "var(--mono, 'Space Mono', monospace)",
              }}
            >
              {busy ? 'weaving…' : 'append-only · cannot be altered once woven'}
            </p>

            <div style={{ marginTop: 40 }}>
              <WaxSeal />
            </div>
          </form>
        </div>
      </div>

      {/* TapestryEdge at the bottom */}
      <TapestryEdge />
    </ClothShell>
  );
}
