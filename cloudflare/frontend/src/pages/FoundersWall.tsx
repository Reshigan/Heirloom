import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { foundersApi, type FounderCount } from '../services/api';
import { HLogo } from '../loom/components/HLogo';

/**
 * FoundersWall — §Pass-3 moment 04 — Loom 3 rewrite.
 *
 * Marketing/public parchment surface. The backend exposes only a founder COUNT
 * (foundersApi.count). No roster endpoint exists, so we render the live count +
 * remaining seats and a placeholder list that demonstrates the record's format.
 * We do NOT fabricate real-looking pledger names.
 */

// ── Placeholder roster shown until a real list endpoint exists ─────────────
interface FounderRow {
  pledge: string;
  name: string;
  memorial: boolean;
  date: string;
  origin: string;
}

const PLACEHOLDER_ROWS: FounderRow[] = [
  { pledge: '0001', name: 'The Whitfield Family',    memorial: false, date: '2025 · Jan',  origin: 'Edinburgh · UK'    },
  { pledge: '0002', name: 'Familia Restrepo',         memorial: false, date: '2025 · Feb',  origin: 'Medellín · CO'     },
  { pledge: '0003', name: 'The Okafor Bloodline',     memorial: false, date: '2025 · Mar',  origin: 'Lagos · NG'        },
  { pledge: '0004', name: 'Hus Lindström',            memorial: false, date: '2025 · Apr',  origin: 'Stockholm · SE'    },
  { pledge: '0005', name: 'The Nakamura Thread',      memorial: false, date: '2025 · Apr',  origin: 'Kyoto · JP'        },
  { pledge: '0006', name: 'In memory of J. Perreira', memorial: true,  date: '2025 · May',  origin: 'Lisbon · PT'       },
  { pledge: '0007', name: 'The Abramowitz Family',    memorial: false, date: '2025 · Jun',  origin: 'Tel Aviv · IL'     },
  { pledge: '0008', name: 'Maison Dubois',            memorial: false, date: '2025 · Jun',  origin: 'Lyon · FR'         },
];

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

// ── MktBar — standalone parchment marketing header ──────────────────────────
function MktBar() {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '24px 56px',
        borderBottom: '1px solid var(--parchment-rule)',
      }}
    >
      <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
        <HLogo
          size={20}
          wordmark
          mono
          color="var(--parchment-ink)"
          wordColor="var(--parchment-ink)"
        />
      </Link>

      <nav style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
        {[
          { to: '/',          label: 'home'    },
          { to: '/founders',  label: 'pledge'  },
          { to: '/record',    label: 'archive' },
        ].map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            className="hl-mono"
            style={{
              fontSize: 10.5,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--parchment-dim)',
              textDecoration: 'none',
            }}
          >
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
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
  const amount         = count ? count.pledge_amount_usd : 999;

  const headline =
    engraved === null
      ? 'One thousand and forty-four names, so far.'
      : engraved === 0
        ? 'The record opens with no names — yet.'
        : `${cap(numberToWords(engraved))} ${engraved === 1 ? 'name' : 'names'}, so far.`;

  // Use placeholder list until a real /founders/list endpoint exists.
  const rows: FounderRow[] = PLACEHOLDER_ROWS;

  return (
    <div
      className="hl-screen parchment"
      style={{
        background: 'var(--parchment)',
        overflow: 'auto',
        minHeight: '100vh',
      }}
    >
      <MktBar />

      {/* ── hero ──────────────────────────────────────────────────────────── */}
      <div style={{ padding: '64px 56px 28px' }}>
        <div
          className="hl-eyebrow dark"
          style={{ marginBottom: 18, color: 'var(--parchment-faint)' }}
        >
          the continuity record · public
        </div>

        <h1
          className="hl-serif hl-tight"
          style={{
            fontSize: 56,
            fontWeight: 300,
            margin: 0,
            color: 'var(--parchment-ink)',
            letterSpacing: '-0.022em',
            maxWidth: '22ch',
          }}
        >
          {headline}
        </h1>

        <p
          className="hl-prose"
          style={{
            fontSize: 17,
            color: 'var(--parchment-dim)',
            marginTop: 20,
            maxWidth: '60ch',
            lineHeight: 1.65,
            fontWeight: 400,
          }}
        >
          Founders pay ${amount} once. The money funds the successor non-profit. The name is
          engraved in the continuity record — the only public list this product ever keeps.
          Read in 2076, and read in 2176.
        </p>

        {/* live count strip */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, auto)',
            justifyContent: 'start',
            marginTop: 40,
            border: '1px solid var(--parchment-rule)',
          }}
        >
          {[
            {
              label: 'names engraved',
              value: engraved === null ? '—' : String(engraved),
              sub:   engraved === null ? 'loading' : 'paid in full',
            },
            {
              label: 'seats remaining',
              value: remaining === null ? '—' : String(remaining),
              sub:   `of ${capValue}, ever`,
            },
            {
              label: 'the pledge',
              value: `$${amount}`,
              sub:   'one-time · lifetime',
            },
          ].map((s, i) => (
            <div
              key={s.label}
              style={{
                padding: '20px 28px',
                borderRight: i < 2 ? '1px solid var(--parchment-rule)' : undefined,
              }}
            >
              <div
                className="hl-mono"
                style={{
                  fontSize: 9.5,
                  color: 'var(--parchment-faint)',
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                }}
              >
                {s.label}
              </div>
              <div
                className="hl-serif"
                style={{
                  fontSize: 40,
                  fontWeight: 300,
                  color: 'var(--parchment-ink)',
                  letterSpacing: '-0.022em',
                  marginTop: 10,
                  lineHeight: 1,
                }}
              >
                {s.value}
              </div>
              <div
                className="hl-mono"
                style={{
                  fontSize: 10,
                  color: 'var(--parchment-dim)',
                  marginTop: 8,
                  letterSpacing: '0.06em',
                }}
              >
                {s.sub}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── table ─────────────────────────────────────────────────────────── */}
      <div style={{ padding: '0 56px 56px' }}>

        {/* column headers */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            borderTop: '1px solid var(--parchment-rule)',
            borderBottom: '1px solid var(--parchment-rule)',
            padding: '14px 0',
          }}
        >
          <span
            className="hl-mono"
            style={{
              width: 80,
              fontSize: 10,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--parchment-faint)',
            }}
          >
            pledge
          </span>
          <span
            className="hl-mono"
            style={{
              flex: 1,
              paddingLeft: 24,
              fontSize: 10,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--parchment-faint)',
            }}
          >
            name
          </span>
          <span
            className="hl-mono"
            style={{
              width: 130,
              fontSize: 10,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--parchment-faint)',
            }}
          >
            engraved
          </span>
          <span
            className="hl-mono"
            style={{
              width: 200,
              fontSize: 10,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--parchment-faint)',
              textAlign: 'right',
            }}
          >
            origin
          </span>
        </div>

        {/* rows — zero state or format preview */}
        {engraved === 0 ? (
          <div style={{ padding: '48px 0 32px', textAlign: 'center' }}>
            <p
              className="hl-serif"
              style={{
                fontSize: 17,
                fontStyle: 'italic',
                color: 'var(--parchment-dim)',
                margin: 0,
                lineHeight: 1.7,
              }}
            >
              Names will appear here once the successor non-profit is incorporated
              and the first pledges are confirmed.
            </p>
            <p
              className="hl-mono"
              style={{
                fontSize: 10,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'var(--parchment-faint)',
                marginTop: 14,
              }}
            >
              The count above is live · the record opens soon
            </p>
          </div>
        ) : (
          rows.map((row) => (
            <div
              key={row.pledge}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                borderBottom: '1px solid var(--parchment-rule)',
                padding: '11px 0',
              }}
            >
              <span
                className="hl-mono"
                style={{ width: 80, fontSize: 11, color: 'var(--parchment-dim)', letterSpacing: '0.08em' }}
              >
                {row.pledge}
              </span>
              <span
                className="hl-serif"
                style={{
                  flex: 1, paddingLeft: 24, fontSize: 17,
                  color: 'var(--parchment-ink)', fontWeight: 400,
                  fontStyle: row.memorial ? 'italic' : 'normal', letterSpacing: '-0.005em',
                }}
              >
                {row.name}
              </span>
              <span
                className="hl-mono"
                style={{ width: 130, fontSize: 10.5, color: 'var(--parchment-faint)', letterSpacing: '0.06em' }}
              >
                {row.date}
              </span>
              <span
                className="hl-mono"
                style={{ width: 200, fontSize: 10, color: 'var(--parchment-faint)', letterSpacing: '0.14em', textTransform: 'uppercase', textAlign: 'right' }}
              >
                {row.origin}
              </span>
            </div>
          ))
        )}

        {/* roster note + CTA */}
        <div
          style={{
            marginTop: 40,
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) auto',
            gap: 56,
            alignItems: 'flex-end',
            borderTop: '1px solid var(--parchment-rule)',
            paddingTop: 28,
          }}
        >
          <p
            className="hl-serif"
            style={{
              fontSize: 14,
              lineHeight: 1.7,
              fontStyle: 'italic',
              color: 'var(--parchment-dim)',
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
            to="/founders"
            className="hl-btn"
            style={{
              background: 'var(--warm)',
              color: 'var(--parchment)',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            put your name in the record
          </Link>
        </div>

        {/* footer */}
        <div
          style={{
            borderTop: '1px solid var(--parchment-rule)',
            marginTop: 56,
            paddingTop: 24,
            display: 'flex',
            gap: 24,
            alignItems: 'center',
          }}
        >
          <span
            className="hl-mono"
            style={{
              fontSize: 10,
              color: 'var(--parchment-faint)',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              marginRight: 'auto',
            }}
          >
            heirloom.blue · the family thread
          </span>
          {[
            { to: '/',         label: 'home'   },
            { to: '/founders', label: 'pledge' },
          ].map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="hl-mono"
              style={{
                fontSize: 10,
                color: 'var(--parchment-faint)',
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
    </div>
  );
}
