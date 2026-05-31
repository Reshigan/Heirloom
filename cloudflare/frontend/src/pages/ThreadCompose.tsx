import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { AppFrame } from '../loom/components/AppFrame';
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
  borderBottom: '1px solid var(--loom-rule)',
  color: 'var(--loom-bone)',
  caretColor: 'var(--loom-warm)',
  fontFamily: "'Inter', sans-serif",
  fontSize: 14,
  padding: '8px 0',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 180ms cubic-bezier(0.16,1,0.3,1)',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: 'none',
  cursor: 'pointer',
  paddingRight: 24,
  backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6'><polyline points='0,0 5,6 10,0' fill='none' stroke='rgba(244,236,216,0.32)' stroke-width='1.2'/></svg>\")",
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
          unlock.age_years = typeof lockAgeYears === 'number' ? lockAgeYears : parseInt(String(lockAgeYears), 10);
        }
        if (lockType === 'RECIPIENT_EVENT') {
          unlock.target_member_id = lockTargetMemberId;
          unlock.event_label = lockEventLabel.trim();
        }
        if (lockType === 'GENERATION') {
          unlock.target_generation = typeof lockGeneration === 'number' ? lockGeneration : parseInt(String(lockGeneration), 10);
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

  const today = new Date().toISOString().slice(0, 10);
  const thread = detail?.thread;

  return (
    <AppFrame>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        {/* Back link */}
        <Link
          to={`/threads/${threadId}`}
          style={{
            display: 'inline-block',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--loom-bone-faint)',
            textDecoration: 'none',
            marginBottom: 40,
            transition: 'color 180ms cubic-bezier(0.16,1,0.3,1)',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--loom-bone-dim)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--loom-bone-faint)'; }}
        >
          ← back to thread
        </Link>

        {/* Header */}
        <header style={{ marginBottom: 48 }}>
          <p className="loom-eyebrow" style={{ marginBottom: 14, color: 'var(--loom-warm)' }}>
            ∞ &nbsp; new entry{thread ? ` · ${thread.name}` : ''}
          </p>
          <h1
            className="loom-h2"
            style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 300, fontStyle: 'italic', margin: 0 }}
          >
            What do you want the thread to remember?
          </h1>
        </header>

        <form
          onSubmit={(e) => {
            e.preventDefault();
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
          }}
          style={{ display: 'grid', gap: 28 }}
        >
          {/* Title */}
          <div>
            <label htmlFor="t-title" className="loom-eyebrow" style={{ display: 'block', marginBottom: 10 }}>
              Title — optional
            </label>
            <input
              id="t-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="The summer Nan taught me to bake"
              maxLength={200}
              style={{
                ...inputStyle,
                fontFamily: "'Source Serif 4', serif",
                fontVariationSettings: "'opsz' 28",
                fontStyle: 'italic',
                fontSize: 22,
                fontWeight: 300,
              }}
            />
          </div>

          {/* Body */}
          <div>
            <label htmlFor="t-body" className="loom-eyebrow" style={{ display: 'block', marginBottom: 10 }}>
              Body
            </label>
            <textarea
              id="t-body"
              rows={12}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write to your descendants. Tell them something. They will read this."
              required
              style={{
                width: '100%',
                background: 'transparent',
                border: 0,
                borderBottom: '1px solid var(--loom-rule)',
                color: 'var(--loom-bone)',
                caretColor: 'var(--loom-warm)',
                fontFamily: "'Source Serif 4', serif",
                fontVariationSettings: "'opsz' 14",
                fontSize: 18,
                lineHeight: 1.85,
                padding: '8px 0',
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box',
                maxWidth: '60ch',
              }}
            />
          </div>

          {/* Visibility */}
          <div>
            <label htmlFor="t-vis" className="loom-eyebrow" style={{ display: 'block', marginBottom: 10 }}>
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
          <div
            style={{
              border: '1px solid var(--loom-rule)',
              padding: '20px 24px',
            }}
          >
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 14, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={enableLock}
                onChange={(e) => setEnableLock(e.target.checked)}
                style={{ marginTop: 3, accentColor: 'var(--loom-warm)', flexShrink: 0 }}
              />
              <div>
                <p
                  className="loom-serif"
                  style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 300, color: 'var(--loom-bone)' }}
                >
                  Seal this entry
                </p>
                <p
                  className="loom-body"
                  style={{ margin: 0, fontSize: 14, color: 'var(--loom-bone-dim)', lineHeight: 1.65 }}
                >
                  The entry stays sealed until the moment you choose. Write today; have it open on a wedding day, a 21st, a centenary.
                </p>
              </div>
            </label>

            {enableLock ? (
              <div style={{ marginTop: 24, paddingLeft: 28, display: 'grid', gap: 20 }}>
                <div>
                  <label htmlFor="t-lock-type" className="loom-eyebrow" style={{ display: 'block', marginBottom: 10 }}>
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
                    <option value="RECIPIENT_EVENT">When an event happens (wedding, first child…)</option>
                    <option value="GENERATION">When a generation exists in the thread</option>
                  </select>
                </div>

                {lockType === 'DATE' ? (
                  <div>
                    <label htmlFor="t-lock-date" className="loom-eyebrow" style={{ display: 'block', marginBottom: 10 }}>
                      Open on
                    </label>
                    <input
                      id="t-lock-date"
                      type="date"
                      min={today}
                      value={lockDate}
                      onChange={(e) => setLockDate(e.target.value)}
                      style={{ ...inputStyle, maxWidth: 200 }}
                    />
                  </div>
                ) : null}

                {lockType === 'AGE' ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 480 }}>
                    <div>
                      <label htmlFor="t-lock-member" className="loom-eyebrow" style={{ display: 'block', marginBottom: 10 }}>
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
                            {m.display_name} {m.relation_label ? `(${m.relation_label})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="t-lock-age" className="loom-eyebrow" style={{ display: 'block', marginBottom: 10 }}>
                        Open at age
                      </label>
                      <input
                        id="t-lock-age"
                        type="number"
                        min={1}
                        max={120}
                        value={lockAgeYears}
                        onChange={(e) => setLockAgeYears(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                        style={inputStyle}
                      />
                    </div>
                  </div>
                ) : null}

                {lockType === 'RECIPIENT_EVENT' ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 480 }}>
                    <div>
                      <label htmlFor="t-lock-event-member" className="loom-eyebrow" style={{ display: 'block', marginBottom: 10 }}>
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
                            {m.display_name} {m.relation_label ? `(${m.relation_label})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="t-lock-event" className="loom-eyebrow" style={{ display: 'block', marginBottom: 10 }}>
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
                    <label htmlFor="t-lock-gen" className="loom-eyebrow" style={{ display: 'block', marginBottom: 10 }}>
                      Open once a member of generation N exists
                    </label>
                    <input
                      id="t-lock-gen"
                      type="number"
                      min={1}
                      max={6}
                      value={lockGeneration}
                      onChange={(e) => setLockGeneration(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                      style={{ ...inputStyle, maxWidth: 120 }}
                    />
                    <p
                      className="loom-mono"
                      style={{ margin: '6px 0 0', fontSize: 10, color: 'var(--loom-bone-faint)', letterSpacing: '0.06em' }}
                    >
                      +1 = your children · +2 = grandchildren · +3 = great-grandchildren
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          {error ? (
            <p
              role="alert"
              className="loom-body"
              style={{ margin: 0, fontStyle: 'italic', color: '#c25a5a', fontSize: 14 }}
            >
              {error}
            </p>
          ) : null}

          {/* Actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              paddingTop: 8,
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
              }}
            >
              {create.isPending ? 'weaving…' : 'append-only · cannot be altered once woven'}
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <Link
                to={`/threads/${threadId}`}
                className="loom-btn-ghost"
                style={{ textDecoration: 'none' }}
              >
                cancel
              </Link>
              <button
                type="submit"
                disabled={create.isPending || !body.trim()}
                className="loom-btn"
                style={{ opacity: create.isPending || !body.trim() ? 0.5 : 1 }}
              >
                {create.isPending ? 'saving…' : 'save to thread'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </AppFrame>
  );
}
