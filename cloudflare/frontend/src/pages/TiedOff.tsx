import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ClothShell } from '../loom/components/ClothShell';
import { Breadcrumbs } from '../loom/components/Breadcrumbs';
import { RoomHeader } from '../loom/components/room';
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
              Array.isArray(l.recipientNames) && l.recipientNames.length > 0
                ? l.recipientNames[0]
                : (l.salutation?.replace(/^dear\s+/i, '') ?? 'someone');
            return {
              id: l.id ?? '',
              date: deliverDate.toISOString().slice(0, 10).replace(/-/g, '·'),
              recip: recipient,
              years: yearsUntil <= 0 ? 'due' : yearsUntil === 1 ? '+1 yr' : `+${yearsUntil} yrs`,
              kind: 'letter',
              weft,
              deliverYear: deliverDate.getFullYear(),
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
      topbarLeft={<Breadcrumbs trail={[{ label: 'cloth', to: '/loom/weft' }, { label: 'tied off' }]} />}
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
            <p className="loom-mono" style={{ fontSize: 10, color: 'var(--danger)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8 }}>{error}</p>
          )}
          <RoomHeader
            eyebrow={`tied off · ${loading ? '…' : `${locked.length} ${locked.length === 1 ? 'thread' : 'threads'} waiting`}`}
            title="sealed against time"
            lede="each is a thread tied off at the loom's edge. when its date arrives, the loom unties it and weaves it back into the cloth — for whoever is reading then."
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
                'linear-gradient(to right, rgba(244,236,216,0.06), rgba(244,236,216,0.02))',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: `${todayPct}%`,
              top: 0,
              bottom: 0,
              width: 1,
              background: 'var(--warm)',
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
                  color: 'var(--warm)',
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

        {/* card grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: 24,
            alignContent: 'start',
            overflowY: 'auto',
            paddingBottom: 80,
          }}
        >
          {!loading && locked.length === 0 ? (
            <div
              style={{
                gridColumn: '1/-1',
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
                to="/compose"
                style={{ color: 'var(--warm)', textDecoration: 'none' }}
              >
                seal a letter →
              </Link>
            </div>
          ) : (
            locked.map((it, i) => (
              <Link
                key={i}
                to={`/loom/letter?id=${it.id}`}
                style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
              >
                <TiedCard {...it} />
              </Link>
            ))
          )}
        </div>
      </div>
    </ClothShell>
  );
}

function TiedCard({ date, recip, years, kind }: Omit<TiedEntry, 'weft' | 'id' | 'deliverYear'>) {
  return (
    <div
      style={{
        border: '1px solid var(--rule)',
        padding: '26px 22px',
        position: 'relative',
        display: 'grid',
        gap: 14,
        minHeight: 168,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: -10,
          right: 18,
          background: 'var(--ink)',
          padding: '0 8px',
          color: 'var(--warm)',
          fontFamily: 'var(--serif)',
          fontSize: 18,
          lineHeight: 1,
        }}
      >
        ∞
      </div>
      <div className="loom-mono" style={{ fontSize: 10, color: 'var(--warm)' }}>
        {date}
      </div>
      <div
        className="loom-serif"
        style={{
          fontVariationSettings: "'opsz' 28",
          fontSize: 19,
          fontStyle: 'italic',
          fontWeight: 400,
          lineHeight: 1.3,
        }}
      >
        {recip}
      </div>
      <div
        style={{
          marginTop: 'auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
        }}
      >
        <span className="loom-eyebrow" style={{ fontSize: 9 }}>
          {kind}
        </span>
        <span className="loom-mono" style={{ fontSize: 10, color: 'var(--bone-faint)' }}>
          {years}
        </span>
      </div>
    </div>
  );
}
