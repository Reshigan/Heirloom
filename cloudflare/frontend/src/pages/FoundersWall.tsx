import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { foundersApi, type FounderCount } from '../services/api';
import { PLAN_PRICE_NUM } from '../lib/plans';
import { HLogo } from '../loom/components/HLogo';
import { ClothShell } from '../loom/components/ClothShell';
import { CosmicHeader, EntryRow, SectionLabel, WaxSeal } from '../loom/cosmic/CosmicUI';

/**
 * FoundersWall — §Pass-3 moment 04 — cosmic LEDGER re-skin.
 *
 * Marketing/public parchment surface. The backend exposes only a founder COUNT
 * (foundersApi.count). No roster endpoint exists — names will be published once
 * the successor non-profit is incorporated and pledges are confirmed. The page
 * reads as the family's continuity record: a count eyebrow over a serif headline,
 * the live figures as hairline-ruled ledger rows, then the ∞ wax seal at the foot.
 */

// ── helpers ─────────────────────────────────────────────────────────────────
function numberToWords(n: number): string {
  if (!Number.isFinite(n) || n < 0) return String(n);
  if (n === 0) return 'No';
  const ones = [
    'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
    'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
    'seventeen', 'eighteen', 'nineteen',
  ];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  const under100 = (x: number): string => {
    if (x < 20) return ones[x];
    const t = Math.floor(x / 10);
    const o = x % 10;
    return o ? `${tens[t]}-${ones[o]}` : tens[t];
  };
  const under1000 = (x: number): string => {
    if (x < 100) return under100(x);
    const h = Math.floor(x / 100);
    const r = x % 100;
    return r ? `${ones[h]} hundred and ${under100(r)}` : `${ones[h]} hundred`;
  };
  if (n < 1000) return under1000(n);
  const th = Math.floor(n / 1000);
  const r = n % 1000;
  const head = `${under1000(th)} thousand`;
  if (!r) return head;
  return r < 100 ? `${head} and ${under1000(r)}` : `${head}, ${under1000(r)}`;
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ── FoundersWall ─────────────────────────────────────────────────────────────
export function FoundersWall() {
  const [count, setCount] = useState<FounderCount | null>(null);

  useEffect(() => {
    foundersApi
      .count()
      .then((r) => setCount(r.data))
      .catch(() => undefined);
  }, []);

  const engraved       = count ? count.paid              : null;
  const remaining      = count ? count.remaining         : null;
  const capValue       = count ? count.cap               : 100;
  const amount         = count ? count.pledge_amount_usd : PLAN_PRICE_NUM.FOUNDER.lifetime;

  const headline =
    engraved === null
      ? 'The founding cohort.'
      : engraved === 0
        ? 'The record opens with no names — yet.'
        : `${cap(numberToWords(engraved))} ${engraved === 1 ? 'name' : 'names'}, so far.`;

  // The live count, expressed as ledger rows — title (serif) left, figure (mono) right.
  const ledger = [
    {
      title: 'Names engraved',
      sub: engraved === null ? 'loading' : 'paid in full',
      meta: engraved === null ? '—' : String(engraved),
    },
    {
      title: 'Seats remaining',
      sub: `of ${capValue}, ever`,
      meta: remaining === null ? '—' : String(remaining),
    },
    {
      title: 'The pledge',
      sub: 'one-time · lifetime',
      meta: `$${amount}`,
    },
  ];

  return (
    <ClothShell
      topbarLeft={<HLogo href="/" />}
      topbarCenter="founders wall"
      topbarRight={<Link to="/founder">pledge →</Link>}
    >
      <div style={{ maxWidth: 700, margin: '0 auto', padding: 'clamp(24px,5vw,48px)' }}>
        {/* ── ledger header ─────────────────────────────────────────────────── */}
        <CosmicHeader
          eyebrow={
            engraved === null
              ? 'the continuity record · public'
              : `${engraved} engraved · ${remaining === null ? capValue : remaining} of ${capValue} remaining`
          }
          title={headline}
          sub={
            <>
              Founders pay ${amount} once. The money funds the successor non-profit. The name is
              engraved in the continuity record — the only public list this product ever keeps.
              Read in 2076, and read in 2176.
            </>
          }
        />

        {/* ── the record ──────────────────────────────────────────────────────── */}
        <SectionLabel>the record</SectionLabel>

        {ledger.map((row) => (
          <EntryRow key={row.title} title={row.title} sub={row.sub} meta={row.meta} />
        ))}

        {/* roster — waiting for confirmed pledges */}
        <div style={{ padding: '44px 0 8px', textAlign: 'center' }}>
          <p
            style={{
              fontFamily: 'var(--serif)',
              fontSize: 17,
              fontStyle: 'italic',
              color: 'var(--bone-dim)',
              margin: 0,
              lineHeight: 1.7,
            }}
          >
            The first hundred families to begin their thread. Their names will
            appear here when they do.
          </p>
          <p
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 10,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--bone-faint)',
              marginTop: 14,
            }}
          >
            The count above is live · the record opens when pledges are confirmed
          </p>
        </div>

        {/* roster note + CTA */}
        <div
          style={{
            marginTop: 32,
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) auto',
            gap: 56,
            alignItems: 'flex-end',
            borderTop: '1px solid var(--rule)',
            paddingTop: 28,
          }}
        >
          <p
            style={{
              fontFamily: 'var(--serif)',
              fontSize: 14,
              lineHeight: 1.7,
              fontStyle: 'italic',
              color: 'var(--bone-dim)',
              maxWidth: '64ch',
              margin: 0,
              fontWeight: 400,
            }}
          >
            The full roster is published only once the successor non-profit is incorporated, and
            only with each family's consent — a name in a thousand-year record is not given
            lightly. Until then, the count above is live and exact. There are{' '}
            {remaining === null ? 'a limited number of' : remaining}{' '}
            {remaining === 1 ? 'seat' : 'seats'} left.
          </p>
          <Link
            to="/founder"
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 11,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--gold-text)',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              padding: '12px 0',
            }}
          >
            put your name in the record →
          </Link>
        </div>

        {/* ── wax seal ──────────────────────────────────────────────────────── */}
        <div style={{ marginTop: 56 }}>
          <WaxSeal />
        </div>

        {/* footer */}
        <div
          style={{
            borderTop: '1px solid var(--rule)',
            marginTop: 40,
            paddingTop: 24,
            display: 'flex',
            gap: 24,
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 10,
              color: 'var(--bone-faint)',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              marginRight: 'auto',
            }}
          >
            heirloom.blue · the family thread
          </span>
          {[
            { to: '/',        label: 'home'   },
            { to: '/founder', label: 'pledge' },
          ].map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 10,
                color: 'var(--bone-faint)',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                textDecoration: 'none',
              }}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </ClothShell>
  );
}
