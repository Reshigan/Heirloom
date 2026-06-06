import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ClothShell } from '../loom/components/ClothShell';
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
  date: string;
  recip: string;
  years: string;
  kind: string;
  weft: number;
}

export function TiedOff() {
  const { isAuthenticated } = useAuthStore();
  const [locked, setLocked] = useState<TiedEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    lettersApi
      .getAll({ limit: 100 })
      .then((r) => {
        const raw: any[] = Array.isArray(r.data?.data)
          ? r.data.data
          : Array.isArray(r.data)
          ? r.data
          : [];
        const now = new Date();
        const today = now.getFullYear();
        const futureHorizon = today + 50;

        const future: TiedEntry[] = raw
          .filter((l: any) => l.sealedAt && l.scheduledDeliveryDate)
          .map((l: any): TiedEntry => {
            const deliverDate = new Date(l.scheduledDeliveryDate);
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
              date: deliverDate.toISOString().slice(0, 10).replace(/-/g, '·'),
              recip: recipient,
              years: yearsUntil <= 0 ? 'due' : yearsUntil === 1 ? '+1 yr' : `+${yearsUntil} yrs`,
              kind: 'letter',
              weft,
            };
          });

        setLocked(future);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  return (
    <ClothShell
      topbarLeft={
        <Link
          to="/loom/weft"
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 10,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--bone-faint)',
            textDecoration: 'none',
          }}
        >
          ← cloth
        </Link>
      }
      topbarCenter="tied off"
      backdropOpacity={0.35}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: '44px 80px 0',
          display: 'grid',
          gridTemplateRows: 'auto auto 1fr',
          gap: 32,
        }}
      >
        <div>
          <div className="loom-eyebrow">
            tied off ·{' '}
            {loading
              ? '…'
              : `${locked.length} ${locked.length === 1 ? 'thread' : 'threads'} waiting`}
          </div>
          <div
            className="loom-h2"
            style={{ fontSize: 44, marginTop: 12, fontStyle: 'italic', fontWeight: 300 }}
          >
            sealed against time
          </div>
          <div
            className="loom-body loom-dim"
            style={{ fontSize: 15, fontStyle: 'italic', marginTop: 8, maxWidth: 620 }}
          >
            each is a thread tied off at the loom's edge. when its date arrives, the loom unties
            it and weaves it back into the cloth — for whoever is reading then.
          </div>
        </div>

        {/* horizon ribbon */}
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
              width: '26%',
              background:
                'linear-gradient(to right, rgba(244,236,216,0.06), rgba(244,236,216,0.02))',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: '26%',
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
              left: '26%',
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
                left: `calc(26% + ${it.weft * 70}%)`,
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
                  fontFamily: "'Source Serif 4', serif",
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

        {/* card grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
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
            locked.map((it, i) => <TiedCard key={i} {...it} />)
          )}
        </div>
      </div>
    </ClothShell>
  );
}

function TiedCard({ date, recip, years, kind }: Omit<TiedEntry, 'weft'>) {
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
          fontFamily: "'Source Serif 4', serif",
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
