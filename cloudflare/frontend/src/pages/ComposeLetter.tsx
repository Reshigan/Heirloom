import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { familyApi, lettersApi } from '../services/api';
import { AppFrame } from '../loom/components/AppFrame';
import { ComposerModes, ComposerRail } from '../loom/components/ComposerChrome';

/**
 * ComposeLetter — ComposerLetter (Claude Design · loom3).
 *
 * A letter you write by hand to one person, optionally sealed until a date.
 * The sheet carries the date stamp ("∞ sealed until · …"), an italic
 * salutation and signature, and a floating sealed marker at top-right. The
 * rail holds the real controls: recipient and lock. Wired to lettersApi —
 * "save as draft" creates it unsealed; "seal the letter" creates then seals
 * (which schedules delivery to the recipient on the date).
 */

interface FamilyMember {
  id: string;
  name: string;
  relationship?: string;
  email?: string | null;
}

const todayLabel = new Date().toLocaleDateString(undefined, {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

export function ComposeLetter() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [salutation, setSalutation] = useState('');
  const [body, setBody] = useState('');
  const [signature, setSignature] = useState('');
  const [recipientIdx, setRecipientIdx] = useState(0);
  const [scheduledDate, setScheduledDate] = useState('');
  const [lockOpen, setLockOpen] = useState<'now' | 'date'>('now');
  const [error, setError] = useState<string | null>(null);

  const { data: family } = useQuery({
    queryKey: ['family'],
    queryFn: () => familyApi.getAll().then((r) => r.data as FamilyMember[]).catch(() => []),
  });
  const members: FamilyMember[] = Array.isArray(family) ? family : [];
  const recipient = members[recipientIdx] ?? null;

  const sealedUntil = useMemo(() => {
    if (lockOpen !== 'date' || !scheduledDate) return null;
    const d = new Date(`${scheduledDate}T00:00:00`);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  }, [lockOpen, scheduledDate]);

  const persist = async (seal: boolean) => {
    const trigger = lockOpen === 'date' && scheduledDate ? 'SCHEDULED' : 'IMMEDIATE';
    const { data } = await lettersApi.create({
      title: salutation.trim() || 'A letter',
      salutation: salutation.trim() || null,
      body: body.trim(),
      signature: signature.trim() || null,
      deliveryTrigger: trigger,
      scheduledDate: trigger === 'SCHEDULED' ? scheduledDate : null,
      recipientIds: recipient ? [recipient.id] : [],
    });
    if (seal && data?.id) {
      await lettersApi.seal(data.id);
    }
    return data;
  };

  const draft = useMutation({
    mutationFn: () => persist(false),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['letters'] });
      navigate('/letters');
    },
    onError: (e: any) => setError(e?.response?.data?.error ?? 'Could not save the letter.'),
  });

  const seal = useMutation({
    mutationFn: () => persist(true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['letters'] });
      navigate('/letters');
    },
    onError: (e: any) => setError(e?.response?.data?.error ?? 'Could not seal the letter.'),
  });

  const busy = draft.isPending || seal.isPending;

  return (
    <AppFrame>
      <div style={{ position: 'relative', maxWidth: 700, margin: '0 auto' }}>
        <p className="loom-eyebrow" style={{ marginBottom: 18, color: 'var(--loom-warm)' }}>
          ∞ &nbsp; letter · across time
        </p>
        <ComposerModes active="letter" />

        {/* the sealed marker, floating top-right */}
        {recipient ? (
          <div
            style={{
              position: 'absolute',
              top: 4,
              right: 0,
              textAlign: 'center',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10.5,
              color: 'var(--loom-bone-dim)',
              letterSpacing: '0.06em',
            }}
          >
            <div
              className="loom-serif"
              style={{ color: 'var(--loom-warm)', fontSize: 24, fontWeight: 300, lineHeight: 1, marginBottom: 8 }}
            >
              ∞
            </div>
            <div>{sealedUntil ? `until ${new Date(`${scheduledDate}T00:00:00`).getFullYear()}` : 'open now'} — for</div>
            <div className="loom-serif" style={{ fontStyle: 'italic', color: 'var(--loom-bone)' }}>
              {recipient.name}
            </div>
          </div>
        ) : null}

        {/* date stamp row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            margin: '8px 0 26px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            color: 'var(--loom-bone-faint)',
            letterSpacing: '0.12em',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <span>{todayLabel}</span>
          {sealedUntil ? (
            <span style={{ color: 'var(--loom-warm)' }}>∞ &nbsp;sealed until · {sealedUntil}</span>
          ) : null}
        </div>

        {/* salutation */}
        <input
          value={salutation}
          onChange={(e) => setSalutation(e.target.value)}
          placeholder="To Maya, on her 25th birthday,"
          style={{
            width: '100%',
            border: 0,
            background: 'transparent',
            caretColor: 'var(--loom-warm)',
            fontFamily: "'Source Serif 4', serif",
            fontStyle: 'italic',
            fontSize: 19,
            fontWeight: 400,
            color: 'var(--loom-bone-dim)',
            outline: 'none',
            padding: 0,
            marginBottom: 22,
          }}
        />

        {/* body */}
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="When you read this you will be older than I was when I had you…"
          style={{
            width: '100%',
            border: 0,
            background: 'transparent',
            caretColor: 'var(--loom-warm)',
            fontFamily: "'Source Serif 4', serif",
            fontSize: 20,
            lineHeight: 1.85,
            color: 'var(--loom-bone)',
            minHeight: 300,
            maxWidth: '58ch',
            outline: 'none',
            resize: 'vertical',
            padding: 0,
          }}
        />

        {/* signature */}
        <input
          value={signature}
          onChange={(e) => setSignature(e.target.value)}
          placeholder="— Mum"
          style={{
            width: '100%',
            border: 0,
            background: 'transparent',
            caretColor: 'var(--loom-warm)',
            fontFamily: "'Source Serif 4', serif",
            fontStyle: 'italic',
            fontSize: 18,
            fontWeight: 400,
            color: 'var(--loom-bone-dim)',
            outline: 'none',
            padding: 0,
            marginTop: 32,
          }}
        />

        {error ? (
          <p
            role="alert"
            className="loom-body"
            style={{ marginTop: 24, fontStyle: 'italic', color: '#c25a5a', fontSize: 14 }}
          >
            {error}
          </p>
        ) : null}

        {/* the control rail — recipient · lock · state */}
        <ComposerRail>
          <span>
            <span style={{ color: 'var(--loom-bone-faint)' }}>recipient ·</span>{' '}
            {members.length === 0 ? (
              <button
                type="button"
                onClick={() => navigate('/family')}
                style={railLink('var(--loom-warm)')}
              >
                add a recipient →
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setRecipientIdx((i) => (i + 1) % members.length)}
                title="cycle recipient"
                className="loom-serif"
                style={{ ...railLink('var(--loom-bone)'), fontStyle: 'italic', letterSpacing: 0, fontSize: 13 }}
              >
                {recipient?.name}
              </button>
            )}
          </span>

          <span>
            <span style={{ color: 'var(--loom-bone-faint)' }}>lock ·</span>{' '}
            <button
              type="button"
              onClick={() => setLockOpen('now')}
              style={railLink(lockOpen === 'now' ? 'var(--loom-warm)' : 'var(--loom-bone-dim)')}
            >
              open now
            </button>
            <span style={{ margin: '0 6px', color: 'var(--loom-bone-faint)' }}>/</span>
            <button
              type="button"
              onClick={() => setLockOpen('date')}
              style={railLink(lockOpen === 'date' ? 'var(--loom-warm)' : 'var(--loom-bone-dim)')}
            >
              on a date
            </button>
            {lockOpen === 'date' ? (
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                style={{
                  marginLeft: 10,
                  background: 'transparent',
                  border: '1px solid var(--loom-rule)',
                  color: 'var(--loom-bone)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10.5,
                  padding: '3px 6px',
                  colorScheme: 'dark',
                  borderRadius: 1,
                }}
              />
            ) : null}
          </span>

          <span style={{ color: 'var(--loom-bone-faint)' }}>
            {busy ? 'sealing…' : 'draft · unsealed'}
          </span>
        </ComposerRail>

        <div
          style={{
            marginTop: 28,
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
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--loom-bone-faint)',
              maxWidth: 440,
            }}
          >
            a sealed letter cannot be edited · it is delivered to your recipient {sealedUntil ? `on ${sealedUntil}` : 'as soon as it is sealed'}
          </p>
          <div style={{ display: 'flex', gap: 16 }}>
            <button
              type="button"
              onClick={() => {
                setError(null);
                if (!body.trim()) {
                  setError('Write the letter first — even a line.');
                  return;
                }
                draft.mutate();
              }}
              disabled={busy || !body.trim()}
              className="loom-btn-ghost"
              style={{ opacity: busy || !body.trim() ? 0.5 : 1 }}
            >
              save as draft
            </button>
            <button
              type="button"
              onClick={() => {
                setError(null);
                if (!body.trim()) {
                  setError('Write the letter first — even a line.');
                  return;
                }
                if (lockOpen === 'date' && !scheduledDate) {
                  setError('Choose the date this letter unseals.');
                  return;
                }
                seal.mutate();
              }}
              disabled={busy || !body.trim()}
              className="loom-btn"
              style={{ opacity: busy || !body.trim() ? 0.5 : 1 }}
            >
              {seal.isPending ? 'sealing…' : sealedUntil ? `seal until ${sealedUntil}` : 'seal the letter'}
            </button>
          </div>
        </div>
      </div>
    </AppFrame>
  );
}

function railLink(color: string): React.CSSProperties {
  return {
    background: 'transparent',
    border: 0,
    padding: 0,
    cursor: 'pointer',
    font: 'inherit',
    letterSpacing: 'inherit',
    color,
    transition: 'color 180ms var(--loom-ease)',
  };
}
