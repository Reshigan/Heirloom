import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ClothShell } from '../loom/components/ClothShell';
import { Breadcrumbs } from '../loom/components/Breadcrumbs';
import { CosmicHeader } from '../loom/cosmic/CosmicUI';
import { lettersApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';

/**
 * Screen 04 — Tied Off
 *
 * All time-locked entries arranged on the future horizon. The strip
 * across the top is a 50-year ribbon; each ∞ glyph marks one tied
 * thread, positioned at when it'll come back into the cloth.
 *
 * Below: a four-up grid of cards with date / recipient / kind /
 * remaining time. Each card has a single ∞ glyph in the top right
 * corner — the only icon the product uses.
 */

interface TiedEntry {
  id: string;
  date: string;
  recip: string;
  years: string;
  kind: string;
  weft: number;
  deliverYear: number;
  /** ceremony title — the letter's own title, its milestone, or a recipient phrasing */
  title: string;
  /** the hand that wrote it, from the signature — null when unsigned */
  author: string | null;
  /** the year it was written */
  writtenYear: number | null;
}

export function TiedOff() {
  const { isAuthenticated } = useAuthStore();
  const [locked, setLocked] = useState<TiedEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    const controller = new AbortController();
    lettersApi
      .getAll({ limit: 100 })
      .then((r) => {
        if (controller.signal.aborted) return;
        const raw: any[] = Array.isArray(r.data?.data)
          ? r.data.data
          : Array.isArray(r.data)
          ? r.data
          : [];
        const now = new Date();
        const today = now.getFullYear();
        const futureHorizon = today + 50;

        const future: TiedEntry[] = raw
          .filter((l: any) => l.sealedAt && (l.scheduledDeliveryDate || l.scheduledDate))
          .map((l: any): TiedEntry => {
            const deliverDate = new Date(l.scheduledDeliveryDate ?? l.scheduledDate);
            const yearsUntil = deliverDate.getFullYear() - today;
            const weft = Math.min(
              0.9,
              Math.max(0.02, (deliverDate.getFullYear() - today) / (futureHorizon - today)),
            );
            const recipient =
              Array.isArray(l.recipients) && l.recipients.length > 0
                ? l.recipients[0]?.name
                : Array.isArray(l.recipientNames) && l.recipientNames.length > 0
                ? l.recipientNames[0]
                : (l.salutation?.replace(/^dear\s+/i, '') ?? 'someone');

            // ceremony title: the letter's own title, else its milestone, else a recipient phrasing
            const milestone: string | undefined = l.milestoneLabel ?? undefined;
            const title: string =
              (typeof l.title === 'string' && l.title.trim()) ||
              (milestone ? `a letter for your ${milestone.replace(/^your\s+/i, '')}` : '') ||
              `a letter for ${recipient}`;

            // the hand that wrote it — from the signature, stripped of a leading sign-off
            const signature: string | undefined =
              typeof l.signature === 'string' && l.signature.trim() ? l.signature.trim() : undefined;
            const author = signature
              ? signature.replace(/^(love|yours|with love|from|always),?\s*/i, '').trim() || signature
              : null;

            const written = l.createdAt ? new Date(l.createdAt) : null;
            const writtenYear =
              written && !Number.isNaN(written.getFullYear()) ? written.getFullYear() : null;

            return {
              id: l.id ?? '',
              date: deliverDate.toISOString().slice(0, 10).replace(/-/g, '·'),
              recip: recipient,
              years: yearsUntil <= 0 ? 'due' : yearsUntil === 1 ? '+1 yr' : `+${yearsUntil} yrs`,
              kind: 'letter',
              weft,
              deliverYear: deliverDate.getFullYear(),
              title,
              author,
              writtenYear,
            };
          });

        setLocked(future);
      })
      .catch((err) => { if (err.name !== 'AbortError') setError('could not load sealed threads'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [isAuthenticated]);

  return (
    <ClothShell
      topbarLeft={<Breadcrumbs trail={[{ label: 'the Deep', to: '/loom/pwa' }, { label: 'tied off' }]} />}
      backdropOpacity={0.35}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: `44px clamp(24px, 6vw, 80px) 0`,
          display: 'grid',
          gridTemplateRows: 'auto auto 1fr',
          gap: 32,
        }}
      >
        <div>
          {error && (
            <p className="loom-mono" style={{ fontSize: 10, color: 'var(--copper-label)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8 }}>{error}</p>
          )}
          <CosmicHeader
            eyebrow={`tied off · ${loading ? '…' : `${locked.length} ${locked.length === 1 ? 'thread' : 'threads'} waiting`}`}
            title="sealed against time"
            sub="each is a thread tied off at the loom's edge. when its date arrives, the loom unties it and weaves it back into the Deep — for whoever is reading then."
          />
        </div>

        {/* horizon ribbon */}
        {(() => {
          const years = locked.map((l) => l.deliverYear);
          const minYear = Math.min(...(years.length ? years : [new Date().getFullYear()]), new Date().getFullYear());
          const maxYear = Math.max(...(years.length ? years : [new Date().getFullYear() + 1]), new Date().getFullYear() + 1);
          const todayPct = maxYear === minYear ? 26 : ((new Date().getFullYear() - minYear) / (maxYear - minYear)) * 100;
          return (
        <div
          style={{
            position: 'relative',
            height: 64,
            borderTop: '1px solid var(--rule)',
            borderBottom: '1px solid var(--rule)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              height: '100%',
              width: `${todayPct}%`,
              background:
                'linear-gradient(to right, color-mix(in srgb, var(--bone) 6%, transparent), color-mix(in srgb, var(--bone) 2%, transparent))',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: `${todayPct}%`,
              top: 0,
              bottom: 0,
              width: 1,
              background: 'var(--bone-faint)',
              opacity: 0.5,
            }}
          />
          <div
            className="loom-mono"
            style={{
              position: 'absolute',
              left: `${todayPct}%`,
              top: -16,
              transform: 'translateX(-50%)',
              fontSize: 10,
              color: 'var(--warm)',
            }}
          >
            today
          </div>
          {locked.map((it, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `calc(${todayPct}% + ${it.weft * (100 - todayPct)}%)`,
                top: '50%',
                transform: 'translate(-50%, -50%)',
                display: 'grid',
                justifyItems: 'center',
                gap: 4,
              }}
            >
              <div
                style={{
                  color: 'var(--ember)',
                  fontFamily: 'var(--serif)',
                  fontSize: 18,
                  lineHeight: 1,
                }}
              >
                ∞
              </div>
              <div className="loom-mono" style={{ fontSize: 9, color: 'var(--bone-faint)' }}>
                {it.date.slice(0, 4)}
              </div>
            </div>
          ))}
          <div
            className="loom-mono"
            style={{
              position: 'absolute',
              right: 0,
              top: -16,
              fontSize: 10,
              color: 'var(--bone-faint)',
            }}
          >
            +50 yrs
          </div>
        </div>
          );
        })()}

        {/* the sealed — each tied thread as a centered ceremony card */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 64,
            overflowY: 'auto',
            paddingBottom: 96,
          }}
        >
          {!loading && locked.length === 0 ? (
            <div
              style={{
                paddingTop: 48,
                fontFamily: 'var(--serif)',
                fontSize: 17,
                fontStyle: 'italic',
                color: 'var(--bone-faint)',
                textAlign: 'center',
              }}
            >
              no threads are tied off yet.{' '}
              <Link
                to="/capture"
                style={{ color: 'var(--copper-label)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: 44, padding: '0 4px' }}
              >
                seal a letter →
              </Link>
            </div>
          ) : (
            locked.map((it, i) => (
              <Link
                key={i}
                to={`/loom/letter?id=${it.id}`}
                style={{
                  textDecoration: 'none',
                  color: 'inherit',
                  display: 'block',
                  width: '100%',
                  maxWidth: 540,
                }}
              >
                <SealedCeremony {...it} />
              </Link>
            ))
          )}
        </div>
      </div>
    </ClothShell>
  );
}

/**
 * One sealed thread, set as a ceremony: a large molten ∞ over the letter's
 * title, the seal date in mono warm, and — when the hand is known — an italic
 * byline. Centred inside a single faint rounded-rect frame, the way the wax
 * gathers a sealed page.
 */
function SealedCeremony({ deliverYear, title, author, writtenYear }: TiedEntry) {
  return (
    <div
      style={{
        border: '1px solid var(--rule)',
        borderRadius: 0,
        padding: 'clamp(32px, 6vw, 48px) clamp(24px, 5vw, 40px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 20,
        transition: 'border-color 360ms var(--ease)',
      }}
    >
      {/* the molten wax seal */}
      <div
        aria-hidden
        style={{
          color: 'var(--ember)',
          fontFamily: 'var(--serif)',
          fontSize: 'clamp(40px, 10vw, 64px)',
          lineHeight: 1,
        }}
      >
        ∞
      </div>

      {/* the letter's title */}
      <h2
        style={{
          fontFamily: 'var(--serif-display)',
          fontSize: 'clamp(26px, 5vw, 36px)',
          fontWeight: 500,
          lineHeight: 1.16,
          letterSpacing: '-0.005em',
          color: 'var(--bone)',
          margin: 0,
          maxWidth: '14em',
        }}
      >
        {title}
      </h2>

      {/* seal status + the year it opens */}
      <div
        className="loom-mono"
        style={{
          fontSize: 11,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'var(--copper-label)',
        }}
      >
        sealed · opens {deliverYear}
      </div>

      {/* the hand that wrote it */}
      {author && (
        <p
          style={{
            fontFamily: 'var(--serif)',
            fontStyle: 'italic',
            fontWeight: 300,
            fontSize: 15,
            lineHeight: 1.5,
            color: 'var(--bone-dim)',
            margin: 0,
          }}
        >
          written by {author}{writtenYear ? `, ${writtenYear}` : ''}.
        </p>
      )}
    </div>
  );
}
