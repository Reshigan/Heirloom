import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { lettersApi } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { LetterOpeningCeremony } from './LetterOpeningCeremony';
import { dyeForId, dyeVar } from '../dye';
import { SurfaceRing } from '../cosmic/CosmicUI';

/**
 * LettersAwaitingMe — the recipient-side milestone surface.
 *
 * Milestone letters are held sealed and delivered only when the family judges
 * the milestone has arrived. When the author releases one, the recipient — if
 * they're on the platform and matched by email — sees a quiet line at the head
 * of their cloth telling them a letter waits. They choose to open it; we never
 * reveal it automatically (a thought on your wedding day must not trip a seal).
 *
 * Opening is a ceremony: the letter's thread weaves into the recipient's own
 * cloth (it now belongs to their thread too), then the words reveal inline. The
 * author, if still living, is notified that it was read — the thread continues.
 */

interface Awaiting {
  id: string;
  salutation?: string | null;
  milestoneLabel?: string | null;
  from: string;
  createdAt: string;
}

interface OpenedLetter {
  id: string;
  title?: string | null;
  salutation?: string | null;
  body?: string | null;
  signature?: string | null;
  milestoneLabel?: string | null;
  openedAt?: string | null;
}

export function LettersAwaitingMe() {
  const { isAuthenticated } = useAuthStore();
  const [opened, setOpened] = useState<Record<string, OpenedLetter>>({});

  const { data } = useQuery({
    queryKey: ['letters-awaiting-me'],
    enabled: isAuthenticated,
    queryFn: () => lettersApi.awaitingMe().then((r) => r.data).catch(() => null),
  });

  const letters: Awaiting[] = Array.isArray((data as any)?.data) ? (data as any).data : [];
  if (letters.length === 0) return null;

  return (
    <div
      style={{
        borderTop: '1px solid var(--warm)',
        borderBottom: '1px solid var(--rule)',
        padding: 'clamp(16px, 3vw, 24px) clamp(24px, 5vw, 48px)',
      }}
    >
      {letters.map((l) => (
        <AwaitingRow
          key={l.id}
          letter={l}
          opened={opened[l.id]}
          onOpened={(full) => setOpened((m) => ({ ...m, [l.id]: full }))}
        />
      ))}
    </div>
  );
}

function AwaitingRow({
  letter,
  opened,
  onOpened,
}: {
  letter: Awaiting;
  opened?: OpenedLetter;
  onOpened: (full: OpenedLetter) => void;
}) {
  const queryClient = useQueryClient();
  const [confirm, setConfirm] = useState(false);
  const [ceremonyLetter, setCeremonyLetter] = useState<OpenedLetter | null>(null);
  const dye = dyeForId(letter.id);

  const openMut = useMutation({
    mutationFn: () => lettersApi.open(letter.id).then((r) => r.data as OpenedLetter),
    onSuccess: (full) => setCeremonyLetter(full),
  });

  // The Unlock: the letter reveals inside the ceremony. Closing it refreshes the
  // cloth so the now-received letter appears woven into the recipient's tapestry.
  if (ceremonyLetter) {
    return (
      <LetterOpeningCeremony
        letter={ceremonyLetter}
        from={letter.from}
        dye={dyeVar(dye)}
        entryDate={letter.createdAt}
        onClose={() => {
          onOpened(ceremonyLetter);
          setCeremonyLetter(null);
          queryClient.invalidateQueries({ queryKey: ['letters-awaiting-me'] });
          queryClient.invalidateQueries({ queryKey: ['letters-received'] });
          queryClient.invalidateQueries({ queryKey: ['loom-index'] });
          queryClient.invalidateQueries({ queryKey: ['weft-letters'] });
        }}
      />
    );
  }

  // Once opened (ceremony closed), the row collapses — the letter now lives on
  // the cloth. A quiet confirmation line remains until the awaiting list refetch.
  if (opened) {
    return (
      <div style={{ paddingTop: 6, paddingBottom: 6, borderLeft: `3px solid ${dyeVar(dye)}`, paddingLeft: 14 }}>
        <span className="hl-mono" style={{ fontSize: 9.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--bone-faint)' }}>
          <SurfaceRing size={11} />&nbsp; {letter.from}'s letter has settled into your Deep
        </span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap', paddingTop: 6, paddingBottom: 6, borderLeft: `3px solid ${dyeVar(dye)}`, paddingLeft: 14 }}>
      <span className="hl-serif" style={{ fontSize: 15, fontStyle: 'italic', color: 'var(--bone)' }}>
        {letter.from} left you a letter
        {letter.milestoneLabel ? <span style={{ color: 'var(--bone-dim)' }}> · for {letter.milestoneLabel}</span> : null}.
      </span>
      {!confirm ? (
        <button type="button" onClick={() => setConfirm(true)}
          className="hl-mono"
          style={{ background: 'transparent', border: 0, padding: 0, cursor: 'pointer', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--warm)' }}>
          open it →
        </button>
      ) : (
        <span style={{ display: 'inline-flex', gap: 14, alignItems: 'center' }}>
          <span className="hl-mono" style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--bone-faint)' }}>open now?</span>
          <button type="button" onClick={() => openMut.mutate()} disabled={openMut.isPending}
            style={{ background: 'transparent', border: '1px solid var(--warm)', borderRadius: 0, padding: '4px 11px', cursor: openMut.isPending ? 'wait' : 'pointer', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--warm)', opacity: openMut.isPending ? 0.6 : 1 }}>
            {openMut.isPending ? 'opening…' : 'yes, open'}
          </button>
          <button type="button" onClick={() => setConfirm(false)} disabled={openMut.isPending}
            style={{ background: 'transparent', border: 0, padding: 0, cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--bone-faint)' }}>
            not yet
          </button>
        </span>
      )}
      {openMut.isError && (
        <span className="hl-mono" style={{ fontSize: 9.5, color: 'var(--dye-madder)', letterSpacing: '0.1em' }}>could not open — try again</span>
      )}
    </div>
  );
}

export default LettersAwaitingMe;
