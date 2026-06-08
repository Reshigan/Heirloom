import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { familyApi, legacyContactsApi, lettersApi } from '../services/api';
import { HLogo } from '../loom/components/HLogo';
import { UserMenu } from '../loom/components/Frame';
import { ClothShell } from '../loom/components/ClothShell';
import { RecipientPicker } from '../loom/components/RecipientPicker';
import { useAuthStore } from '../stores/authStore';

/**
 * ComposeLetter — loom3 standalone rewrite (§6.3 Composer · letter mode).
 *
 * A letter written by hand to one person, optionally sealed until a date.
 * Wired to lettersApi — "save draft →" creates unsealed; "seal and save →"
 * creates then seals (scheduling delivery to recipient on date).
 *
 * No AppFrame. hl-screen dark ink standalone. TapestryEdge anchors bottom.
 */

interface FamilyMember {
  id: string;
  name: string;
  relationship?: string;
  email?: string | null;
}

interface LegacyContact {
  id: string;
  name: string;
  email: string;
  relationship: string;
}

export function ComposeLetter() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchParams] = useSearchParams();
  const letterId = searchParams.get('id');

  const [salutation, setSalutation] = useState('');
  const [body, setBody] = useState('');
  const [signature, setSignature] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientId, setRecipientId] = useState<string | null>(null);
  const [scheduledDate, setScheduledDate] = useState('');
  const [milestoneLabel, setMilestoneLabel] = useState('');
  const [deliveryTrigger, setDeliveryTrigger] = useState<'now' | 'date' | 'death' | 'milestone'>(
    'now',
  );
  const [signatureTouched, setSignatureTouched] = useState(false);
  const [legacyRecipientIds, setLegacyRecipientIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const user = useAuthStore((s) => s.user);

  const { data: family } = useQuery({
    queryKey: ['family'],
    queryFn: () =>
      familyApi
        .getAll()
        .then((r) => r.data as FamilyMember[])
        .catch(() => []),
  });
  const members: FamilyMember[] = Array.isArray(family) ? family : [];

  const { data: legacyContactsData } = useQuery({
    queryKey: ['legacy-contacts'],
    queryFn: () =>
      legacyContactsApi
        .getAll()
        .then((r) => {
          const d = r.data as any;
          // API returns a flat array directly
          return (Array.isArray(d) ? d : d?.contacts ?? []) as LegacyContact[];
        })
        .catch(() => [] as LegacyContact[]),
  });
  const legacyContacts: LegacyContact[] = Array.isArray(legacyContactsData) ? legacyContactsData : [];

  const { data: existingLetter } = useQuery({
    queryKey: ['letter', letterId],
    queryFn: () => lettersApi.getOne(letterId!).then((r) => r.data),
    enabled: !!letterId,
  });

  useEffect(() => {
    if (!existingLetter) return;
    if (existingLetter.salutation) setSalutation(existingLetter.salutation);
    if (existingLetter.body) setBody(existingLetter.body);
    if (existingLetter.signature) {
      setSignature(existingLetter.signature);
      setSignatureTouched(true);
    }
    if (existingLetter.milestoneLabel) setMilestoneLabel(existingLetter.milestoneLabel);
    if (existingLetter.scheduledDate) setScheduledDate(existingLetter.scheduledDate);
    const trigger = existingLetter.deliveryTrigger;
    // The worker normalises milestone onto SCHEDULED with a null date; a present
    // milestoneLabel is what distinguishes it from a plain dated seal.
    if (trigger === 'SCHEDULED' && existingLetter.milestoneLabel && !existingLetter.scheduledDate)
      setDeliveryTrigger('milestone');
    else if (trigger === 'SCHEDULED') setDeliveryTrigger('date');
    else if (trigger === 'POSTHUMOUS' || trigger === 'AFTER_DEATH') setDeliveryTrigger('death');
    else if (trigger === 'MILESTONE') setDeliveryTrigger('milestone');
    else setDeliveryTrigger('now');
    // Select recipient by ID match
    const r = existingLetter.recipients?.[0];
    if (r?.id) {
      setRecipientId(r.id);
      setRecipientName(r.name ?? '');
    }
    // Populate legacy recipients if the API returns them
    const legacyRecs = (existingLetter as any).legacyRecipients;
    if (Array.isArray(legacyRecs) && legacyRecs.length > 0) {
      setLegacyRecipientIds(legacyRecs.map((lc: any) => lc.id ?? lc));
    }
  }, [existingLetter]);

  // Auto-populate the signature with the author's name. Only while it's still
  // pristine — once the user types their own sign-off we never overwrite it,
  // and an existing letter's saved signature always wins.
  useEffect(() => {
    if (signatureTouched || signature || letterId) return;
    const full = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim();
    if (full) setSignature(`— ${full}`);
  }, [user, signatureTouched, signature, letterId]);

  const sealedUntil = useMemo(() => {
    if (deliveryTrigger !== 'date' || !scheduledDate) return null;
    const d = new Date(`${scheduledDate}T00:00:00`);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [deliveryTrigger, scheduledDate]);

  const toggleLegacyContact = (id: string) => {
    setLegacyRecipientIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const persist = async (seal: boolean) => {
    const trigger =
      deliveryTrigger === 'date' && scheduledDate
        ? 'SCHEDULED'
        : deliveryTrigger === 'death'
          ? 'AFTER_DEATH'
          : deliveryTrigger === 'milestone'
            ? 'MILESTONE'
            : 'IMMEDIATE';
    const payload = {
      title: salutation.trim() || 'A letter',
      salutation: salutation.trim() || null,
      body: body.trim(),
      signature: signature.trim() || null,
      deliveryTrigger: trigger,
      scheduledDate: trigger === 'SCHEDULED' ? scheduledDate : null,
      milestoneLabel: deliveryTrigger === 'milestone' ? milestoneLabel.trim() || null : null,
      recipientIds: recipientId ? [recipientId] : [],
      legacyRecipientIds,
    };
    let data: any;
    if (letterId) {
      const res = await lettersApi.update(letterId, payload);
      data = res.data;
      // Only seal if not already sealed
      if (seal && !existingLetter?.sealedAt) {
        await lettersApi.seal(letterId);
      }
    } else {
      const res = await lettersApi.create(payload);
      data = res.data;
      if (seal && data?.id) {
        await lettersApi.seal(data.id);
      }
    }
    return data;
  };

  const draft = useMutation({
    mutationFn: () => persist(false),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['new-user-check-letters'] });
      queryClient.invalidateQueries({ queryKey: ['letters'] });
      queryClient.invalidateQueries({ queryKey: ['weft-letters'] });
      navigate('/loom/letter');
    },
    onError: (e: any) =>
      setError(e?.response?.data?.error ?? 'Could not save the letter.'),
  });

  const seal = useMutation({
    mutationFn: () => persist(true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['new-user-check-letters'] });
      queryClient.invalidateQueries({ queryKey: ['letters'] });
      queryClient.invalidateQueries({ queryKey: ['weft-letters'] });
      navigate('/loom/letter');
    },
    onError: (e: any) =>
      setError(e?.response?.data?.error ?? 'Could not seal the letter.'),
  });

  const busy = draft.isPending || seal.isPending;

  const triggerOptions: { value: typeof deliveryTrigger; label: string }[] = [
    { value: 'now', label: 'open now' },
    { value: 'date', label: 'on a date' },
    { value: 'death', label: 'after death' },
    { value: 'milestone', label: 'on a milestone' },
  ];

  return (
    <ClothShell
      topbarLeft={
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <HLogo
            size={18}
            wordmark
            mono
            color="var(--bone-dim)"
            wordColor="var(--bone-dim)"
            glow={false}
          />
          <span
            style={{
              color: 'var(--bone-dim)',
              fontFamily: 'var(--mono)',
              fontSize: 11,
              letterSpacing: '0.08em',
            }}
          >
            {' '}·{' '}letter
          </span>
        </span>
      }
      topbarCenter={
        <span
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 11,
            letterSpacing: '0.14em',
            color: 'var(--bone-faint)',
            textTransform: 'lowercase',
            whiteSpace: 'nowrap',
          }}
        >
          sealed · for the future
        </span>
      }
      topbarRight={
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 18 }}>
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
            disabled={busy}
            style={{
              background: 'none',
              border: 'none',
              cursor: busy ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--mono)',
              fontSize: 11,
              letterSpacing: '0.08em',
              color: 'var(--warm)',
              padding: '0 4px',
              minHeight: 44,
              opacity: busy ? 0.5 : 1,
              transition: 'opacity 180ms cubic-bezier(0.16,1,0.3,1)',
            }}
          >
            {draft.isPending ? 'saving…' : 'save draft →'}
          </button>
          <UserMenu />
        </span>
      }
    >
      <div
        style={{
          maxWidth: 720,
          margin: '0 auto',
          padding: 'clamp(24px,5vw,48px) clamp(20px, 5vw, 56px) 96px',
        }}
      >
          {/* eyebrow */}
          <p
            className="hl-eyebrow"
            style={{ marginBottom: 22 }}
          >
            a letter to the future
          </p>

          {/* salutation */}
          <input
            value={salutation}
            onChange={(e) => setSalutation(e.target.value)}
            placeholder="To [name], on this day,"
            style={{
              width: '100%',
              border: 0,
              borderBottom: '1px solid var(--rule)',
              background: 'transparent',
              caretColor: 'var(--warm)',
              fontFamily: 'var(--serif)',
              fontSize: 20,
              fontWeight: 400,
              color: 'var(--bone)',
              outline: 'none',
              padding: '0 0 8px',
              marginBottom: 24,
            }}
          />

          {/* body */}
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your letter here…"
            rows={12}
            style={{
              width: '100%',
              border: 0,
              background: 'transparent',
              caretColor: 'var(--warm)',
              fontFamily: 'var(--serif)',
              fontSize: 18,
              fontWeight: 400,
              lineHeight: 1.85,
              color: 'var(--bone)',
              minHeight: 280,
              outline: 'none',
              resize: 'none',
              padding: 0,
            }}
          />

          {/* signature */}
          <input
            value={signature}
            onChange={(e) => {
              setSignatureTouched(true);
              setSignature(e.target.value);
            }}
            placeholder="— your name"
            style={{
              width: '100%',
              border: 0,
              background: 'transparent',
              caretColor: 'var(--warm)',
              fontFamily: 'var(--serif)',
              fontStyle: 'italic',
              fontSize: 18,
              fontWeight: 400,
              color: 'var(--bone-dim)',
              outline: 'none',
              padding: 0,
              marginTop: 32,
            }}
          />

          {/* delivery trigger row */}
          <div
            style={{
              marginTop: 32,
              display: 'flex',
              gap: 24,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            {triggerOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setDeliveryTrigger(opt.value)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  minHeight: 44,
                  paddingTop: 12,
                  paddingBottom: 12,
                  fontFamily: 'var(--mono)',
                  fontSize: 10,
                  letterSpacing: '0.32em',
                  textTransform: 'uppercase',
                  color:
                    deliveryTrigger === opt.value
                      ? 'var(--warm)'
                      : 'var(--bone-faint)',
                  transition: 'color 180ms cubic-bezier(0.16,1,0.3,1)',
                }}
              >
                {opt.label}
              </button>
            ))}

            {deliveryTrigger === 'date' && (
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--rule)',
                  color: 'var(--bone)',
                  fontFamily: 'var(--mono)',
                  fontSize: 10,
                  letterSpacing: '0.08em',
                  padding: '3px 6px',
                  colorScheme: 'dark',
                  borderRadius: 0,
                  outline: 'none',
                }}
              />
            )}

            {deliveryTrigger === 'milestone' && (
              <input
                type="text"
                value={milestoneLabel}
                onChange={(e) => setMilestoneLabel(e.target.value)}
                placeholder="which milestone — e.g. her 18th birthday"
                style={{
                  flex: 1,
                  minWidth: 220,
                  background: 'transparent',
                  border: 0,
                  borderBottom: '1px solid var(--rule)',
                  color: 'var(--bone)',
                  caretColor: 'var(--warm)',
                  fontFamily: 'var(--serif)',
                  fontSize: 15,
                  padding: '2px 0 4px',
                  outline: 'none',
                }}
              />
            )}
          </div>

          {deliveryTrigger === 'milestone' && (
            <p
              className="hl-mono"
              style={{
                marginTop: 10,
                fontSize: 10,
                letterSpacing: '0.1em',
                color: 'var(--bone-faint)',
                maxWidth: 420,
                lineHeight: 1.6,
              }}
            >
              the letter stays sealed and is opened by your family when this
              milestone arrives.
            </p>
          )}

          {/* recipient row — autocomplete over friends & family, add-new inline */}
          <div style={{ marginTop: 16, maxWidth: 340 }}>
            <RecipientPicker
              label="for"
              members={members}
              name={recipientName}
              selectedId={recipientId}
              onChange={(n, id) => {
                setRecipientName(n);
                setRecipientId(id);
              }}
              placeholder="a name (optional)"
            />
          </div>

          {/* legacy contact recipients — only shown if contacts exist */}
          {legacyContacts.length > 0 && (
            <div style={{ marginTop: 16 }}>
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
                also for
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {legacyContacts.map((contact) => {
                  const selected = legacyRecipientIds.includes(contact.id);
                  return (
                    <button
                      key={contact.id}
                      type="button"
                      onClick={() => toggleLegacyContact(contact.id)}
                      style={{
                        background: 'none',
                        border: `1px solid ${selected ? 'var(--warm)' : 'var(--rule)'}`,
                        borderRadius: 0,
                        cursor: 'pointer',
                        padding: '4px 8px',
                        fontFamily: 'var(--mono)',
                        fontSize: 10,
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        color: selected ? 'var(--warm)' : 'var(--bone-faint)',
                        transition: 'color 180ms cubic-bezier(0.16,1,0.3,1), border-color 180ms cubic-bezier(0.16,1,0.3,1)',
                      }}
                    >
                      {contact.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <hr className="hl-rule" style={{ marginTop: 28 }} />

          {/* error / success feedback */}
          {error ? (
            <p
              role="alert"
              className="hl-mono"
              style={{
                marginTop: 16,
                fontSize: 10,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--danger)',
              }}
            >
              {error}
            </p>
          ) : null}

          {(draft.isSuccess || seal.isSuccess) ? (
            <p
              className="hl-mono"
              style={{
                marginTop: 16,
                fontSize: 10,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--warm)',
              }}
            >
              {seal.isSuccess ? 'letter sealed ·' : 'draft saved ·'} navigating…
            </p>
          ) : null}

          {/* primary CTA */}
          <button
            type="button"
            onClick={() => {
              setError(null);
              if (!body.trim()) {
                setError('Write the letter first — even a line.');
                return;
              }
              if (deliveryTrigger === 'date' && !scheduledDate) {
                setError('Choose the date this letter unseals.');
                return;
              }
              if (deliveryTrigger === 'milestone' && !milestoneLabel.trim()) {
                setError('Name the milestone this letter waits for.');
                return;
              }
              seal.mutate();
            }}
            disabled={busy}
            className="hl-btn"
            style={{
              marginTop: 24,
              opacity: busy ? 0.5 : 1,
              transition: 'opacity 180ms cubic-bezier(0.16,1,0.3,1)',
              cursor: busy ? 'not-allowed' : 'pointer',
            }}
          >
            {seal.isPending
              ? 'sealing…'
              : sealedUntil
                ? `seal until ${sealedUntil}`
                : 'seal and save →'}
          </button>
      </div>
    </ClothShell>
  );
}
