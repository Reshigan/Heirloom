import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { TapestryEdge } from '../loom/components/Frame';
import { ClothShell } from '../loom/components/ClothShell';
import { HLogo } from '../loom/components/HLogo';
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

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'transparent',
  border: 0,
  borderBottom: '1px solid var(--rule)',
  color: 'var(--bone)',
  caretColor: 'var(--warm)',
  fontFamily: "var(--serif, 'Source Serif 4', serif)",
  fontSize: 16,
  fontWeight: 300,
  padding: '8px 0',
  outline: 'none',
  boxSizing: 'border-box',
  borderRadius: 0,
  transition: 'border-color 180ms cubic-bezier(0.16,1,0.3,1)',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  fontFamily: "var(--mono, 'JetBrains Mono', monospace)",
  fontSize: 11,
  letterSpacing: '0.04em',
  appearance: 'none',
  cursor: 'pointer',
  paddingRight: 24,
  backgroundImage:
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6'><polyline points='0,0 5,6 10,0' fill='none' stroke='rgba(244,236,216,0.32)' stroke-width='1.2'/></svg>\")",
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 4px center',
};

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
      disabled={create.isPending || !body.trim()}
      style={{
        background: 'transparent',
        border: 0,
        padding: 0,
        cursor: create.isPending || !body.trim() ? 'default' : 'pointer',
        fontFamily: "var(--mono, 'JetBrains Mono', monospace)",
        fontSize: 11,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: 'var(--warm)',
        opacity: create.isPending || !body.trim() ? 0.4 : 1,
        transition: 'opacity 180ms cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      {create.isPending ? 'saving…' : 'save →'}
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
            maxWidth: 720,
            margin: '0 auto',
            padding: 'clamp(24px, 5vw, 56px)',
          }}
        >
          <form
            onSubmit={(e) => { e.preventDefault(); handleSave(); }}
            style={{ display: 'grid', gap: 28 }}
          >
            {/* Title input */}
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
                borderBottom: '1px solid var(--rule)',
                color: 'var(--bone)',
                caretColor: 'var(--warm)',
                fontFamily: "var(--serif, 'Source Serif 4', serif)",
                fontVariationSettings: "'opsz' 28",
                fontStyle: 'italic',
                fontSize: 28,
                fontWeight: 300,
                padding: '8px 0',
                outline: 'none',
                boxSizing: 'border-box',
                borderRadius: 0,
                marginBottom: 20,
              }}
            />

            {/* Body textarea */}
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
                fontFamily: "var(--serif, 'Source Serif 4', serif)",
                fontVariationSettings: "'opsz' 14",
                fontSize: 18,
                fontWeight: 300,
                lineHeight: 1.85,
                padding: 0,
                outline: 'none',
                resize: 'none',
                minHeight: 280,
                boxSizing: 'border-box',
                borderRadius: 0,
              }}
            />

            <hr className="hl-rule" />

            {/* Visibility selector */}
            <div>
              <label
                htmlFor="t-vis"
                className="hl-eyebrow"
                style={{ display: 'block', marginBottom: 10, color: 'var(--bone-dim)' }}
              >
                Who can read this
              </label>
              <select
                id="t-vis"
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as ThreadVisibility)}
                style={{ ...selectStyle, maxWidth: 480 }}
              >
                <option value="FAMILY">Family — anyone in the thread, now and later</option>
                <option value="DESCENDANTS">Descendants only — generations after yours</option>
                <option value="PRIVATE">Private — for a specific recipient (future feature)</option>
              </select>
            </div>

            {/* Time-lock panel */}
            <div style={{ border: '1px solid var(--rule)', padding: '20px 24px' }}>
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
                    style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 300, color: 'var(--bone)' }}
                  >
                    Seal this entry
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 14,
                      color: 'var(--bone-dim)',
                      lineHeight: 1.65,
                      fontFamily: "var(--serif, 'Source Serif 4', serif)",
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
                    <label
                      htmlFor="t-lock-type"
                      className="hl-eyebrow"
                      style={{ display: 'block', marginBottom: 10, color: 'var(--bone-dim)' }}
                    >
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
                      <label
                        htmlFor="t-lock-date"
                        className="hl-eyebrow"
                        style={{ display: 'block', marginBottom: 10, color: 'var(--bone-dim)' }}
                      >
                        Open on
                      </label>
                      <input
                        id="t-lock-date"
                        type="date"
                        min={today}
                        value={lockDate}
                        onChange={(e) => setLockDate(e.target.value)}
                        style={{ ...inputStyle, maxWidth: 200, fontFamily: "var(--mono, 'JetBrains Mono', monospace)", fontSize: 12 }}
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
                        <label
                          htmlFor="t-lock-member"
                          className="hl-eyebrow"
                          style={{ display: 'block', marginBottom: 10, color: 'var(--bone-dim)' }}
                        >
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
                        <label
                          htmlFor="t-lock-age"
                          className="hl-eyebrow"
                          style={{ display: 'block', marginBottom: 10, color: 'var(--bone-dim)' }}
                        >
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
                          style={inputStyle}
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
                        <label
                          htmlFor="t-lock-event-member"
                          className="hl-eyebrow"
                          style={{ display: 'block', marginBottom: 10, color: 'var(--bone-dim)' }}
                        >
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
                        <label
                          htmlFor="t-lock-event"
                          className="hl-eyebrow"
                          style={{ display: 'block', marginBottom: 10, color: 'var(--bone-dim)' }}
                        >
                          Event
                        </label>
                        <input
                          id="t-lock-event"
                          type="text"
                          value={lockEventLabel}
                          onChange={(e) => setLockEventLabel(e.target.value)}
                          placeholder="wedding, first_child, graduation"
                          style={inputStyle}
                        />
                      </div>
                    </div>
                  ) : null}

                  {lockType === 'GENERATION' ? (
                    <div>
                      <label
                        htmlFor="t-lock-gen"
                        className="hl-eyebrow"
                        style={{ display: 'block', marginBottom: 10, color: 'var(--bone-dim)' }}
                      >
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
                        style={{ ...inputStyle, maxWidth: 120 }}
                      />
                      <p
                        className="hl-mono"
                        style={{
                          margin: '6px 0 0',
                          fontSize: 10,
                          color: 'var(--bone-faint)',
                          letterSpacing: '0.06em',
                        }}
                      >
                        +1 = your children · +2 = grandchildren · +3 = great-grandchildren
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            {/* Inline error */}
            {error ? (
              <p
                role="alert"
                style={{
                  margin: 0,
                  fontFamily: "var(--serif, 'Source Serif 4', serif)",
                  fontStyle: 'italic',
                  fontSize: 14,
                  color: 'var(--danger)',
                  fontWeight: 300,
                }}
              >
                {error}
              </p>
            ) : null}

            {/* Append-only notice */}
            <p
              className="hl-eyebrow"
              style={{ margin: 0, color: 'var(--bone-faint)' }}
            >
              {create.isPending ? 'weaving…' : 'append-only · cannot be altered once woven'}
            </p>

            {/* Save button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Link
                to={`/threads/${threadId}`}
                style={{
                  fontFamily: "var(--mono, 'JetBrains Mono', monospace)",
                  fontSize: 11,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--bone-faint)',
                  textDecoration: 'none',
                  transition: 'color 180ms cubic-bezier(0.16,1,0.3,1)',
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
              <button
                type="submit"
                disabled={create.isPending || !body.trim()}
                className="hl-btn"
                onClick={handleSave}
                style={{
                  opacity: create.isPending || !body.trim() ? 0.4 : 1,
                  transition: 'opacity 180ms cubic-bezier(0.16,1,0.3,1)',
                }}
              >
                {create.isPending ? 'saving…' : 'save entry →'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* TapestryEdge at the bottom */}
      <TapestryEdge />
    </ClothShell>
  );
}
