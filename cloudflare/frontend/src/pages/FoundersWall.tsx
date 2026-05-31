import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { foundersApi, type FounderCount } from '../services/api';

/**
 * FoundersWall — "the continuity record · public" (§Pass-3, moment 04).
 *
 * Founders pay $999 once; their name is engraved in the public continuity
 * record. This is a public, logged-out-reachable surface on the parchment
 * surface variant.
 *
 * HONESTY: the backend exposes only a founders COUNT (foundersApi.count →
 * { paid, pledged, cap, remaining }). There is no names-list endpoint. We
 * therefore render the REAL live count + remaining seats + the $999 framing,
 * and a SINGLE, explicitly-labelled example row that demonstrates the record's
 * format. We do NOT fabricate a roster of real-looking pledger names.
 */

const PARCHMENT = {
  bg: 'var(--parchment)',
  ink: 'var(--parchment-ink)',
  dim: 'var(--parchment-dim)',
  faint: 'var(--parchment-faint)',
  rule: 'var(--parchment-rule)',
} as const;

function numberToWords(n: number): string {
  // Small, dependency-free spell-out for the headline (0–9,999 covers the cap range).
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

export function FoundersWall() {
  const [count, setCount] = useState<FounderCount | null>(null);

  useEffect(() => {
    foundersApi
      .count()
      .then((r) => setCount(r.data))
      .catch(() => undefined);
  }, []);

  // The number of names actually in the record = those who have paid.
  const engraved = count ? count.paid : null;
  const remaining = count ? count.remaining : null;
  const capValue = count ? count.cap : 100;
  const amount = count ? count.pledge_amount_usd : 999;

  const headline =
    engraved === null
      ? 'The names, as they are engraved.'
      : engraved === 0
        ? 'The record opens with no names — yet.'
        : `${cap(numberToWords(engraved))} ${engraved === 1 ? 'name' : 'names'}, so far.`;

  return (
    <div
      className="hl-screen parchment"
      style={{ minHeight: '100vh', background: PARCHMENT.bg, color: PARCHMENT.ink, boxSizing: 'border-box' }}
    >
      {/* minimal standalone top bar (parchment) */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 32px',
          borderBottom: `1px solid ${PARCHMENT.rule}`,
        }}
      >
        <Link
          to="/"
          className="loom-mark"
          style={{ textDecoration: 'none', color: PARCHMENT.ink }}
        >
          <span className="infmark" style={{ color: 'var(--parchment-ink)', paddingRight: 4 }}>
            ∞
          </span>
          heirloom
        </Link>
        <span
          className="hl-mono"
          style={{ fontSize: 10, color: PARCHMENT.faint, letterSpacing: '0.18em', textTransform: 'uppercase' }}
        >
          the continuity record · public
        </span>
      </header>

      {/* hero */}
      <div style={{ padding: '64px 56px 28px', maxWidth: 1100, margin: '0 auto' }}>
        <div className="hl-eyebrow dark" style={{ marginBottom: 18, color: PARCHMENT.dim }}>
          the continuity record · public
        </div>
        <h1
          className="hl-serif"
          style={{
            fontSize: 'clamp(40px, 6vw, 56px)',
            lineHeight: 1.05,
            fontWeight: 300,
            margin: 0,
            letterSpacing: '-0.022em',
            maxWidth: '20ch',
            color: PARCHMENT.ink,
          }}
        >
          {headline}
        </h1>
        <p
          className="hl-serif"
          style={{ fontSize: 17, lineHeight: 1.65, color: PARCHMENT.dim, maxWidth: '60ch', marginTop: 20, fontWeight: 400 }}
        >
          Founders pay ${amount} once. The money funds the successor non-profit. The name is engraved in
          the continuity record — the only public list this product ever keeps. Read in 2076, and read in
          2176.
        </p>

        {/* live count strip — the real numbers, or honest emptiness */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, auto)',
            gap: 0,
            justifyContent: 'start',
            marginTop: 40,
            border: `1px solid ${PARCHMENT.rule}`,
          }}
        >
          {[
            { label: 'names engraved', value: engraved === null ? '—' : String(engraved), sub: engraved === null ? 'loading' : 'paid in full' },
            { label: 'seats remaining', value: remaining === null ? '—' : String(remaining), sub: `of ${capValue}, ever` },
            { label: 'the pledge', value: `$${amount}`, sub: 'one-time · lifetime' },
          ].map((s, i) => (
            <div key={s.label} style={{ padding: '20px 28px', borderRight: i < 2 ? `1px solid ${PARCHMENT.rule}` : 0 }}>
              <div
                className="hl-mono"
                style={{ fontSize: 9.5, color: PARCHMENT.faint, letterSpacing: '0.22em', textTransform: 'uppercase' }}
              >
                {s.label}
              </div>
              <div
                className="hl-serif"
                style={{ fontSize: 40, fontWeight: 300, color: PARCHMENT.ink, letterSpacing: '-0.022em', marginTop: 10, lineHeight: 1 }}
              >
                {s.value}
              </div>
              <div className="hl-mono" style={{ fontSize: 10, color: PARCHMENT.dim, marginTop: 8, letterSpacing: '0.06em' }}>
                {s.sub}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* the record — column headers + one explicitly-illustrative format row */}
      <div style={{ padding: '0 56px 56px', maxWidth: 1100, margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            borderTop: `1px solid ${PARCHMENT.rule}`,
            borderBottom: `1px solid ${PARCHMENT.rule}`,
            padding: '14px 0',
            fontFamily: 'var(--mono)',
            fontSize: 10,
            color: PARCHMENT.faint,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
          }}
        >
          <span style={{ width: 90 }}>pledge no.</span>
          <span style={{ flex: 1, paddingLeft: 24 }}>name in record</span>
          <span style={{ width: 140 }}>engraved</span>
          <span style={{ width: 200, textAlign: 'right' }}>origin</span>
        </div>

        {/* Single illustrative row — labelled as the record's FORMAT, not a real pledger. */}
        <div style={{ display: 'flex', alignItems: 'baseline', padding: '11px 0', borderBottom: `1px solid ${PARCHMENT.rule}` }}>
          <span className="hl-mono" style={{ width: 90, fontSize: 11, color: PARCHMENT.dim, letterSpacing: '0.08em' }}>
            00XX
          </span>
          <span
            className="hl-serif"
            style={{ flex: 1, paddingLeft: 24, fontSize: 17, color: PARCHMENT.dim, fontWeight: 400, fontStyle: 'italic', letterSpacing: '-0.005em' }}
          >
            — your family's name, exactly as you give it —
          </span>
          <span className="hl-mono" style={{ width: 140, fontSize: 10.5, color: PARCHMENT.faint, letterSpacing: '0.06em' }}>
            on payment
          </span>
          <span
            className="hl-mono"
            style={{ width: 200, fontSize: 10, color: PARCHMENT.faint, letterSpacing: '0.14em', textTransform: 'uppercase', textAlign: 'right' }}
          >
            city · country
          </span>
        </div>

        <p
          className="hl-mono"
          style={{ fontSize: 10, color: PARCHMENT.faint, letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 16 }}
        >
          ↑ the format of the record. one row per founding family — engraved on payment, in order of pledge.
        </p>

        {/* honest explanation of why no roster is shown */}
        <div
          style={{
            marginTop: 40,
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) auto',
            gap: 56,
            alignItems: 'flex-end',
            borderTop: `1px solid ${PARCHMENT.rule}`,
            paddingTop: 28,
          }}
        >
          <p
            className="hl-serif"
            style={{ fontSize: 14, lineHeight: 1.7, fontStyle: 'italic', color: PARCHMENT.dim, maxWidth: '64ch', margin: 0, fontWeight: 400 }}
          >
            The full roster is published only once the successor non-profit is incorporated, and only
            with each family's consent — a name in a thousand-year record is not given lightly. Until
            then, the count above is live and exact. There are{' '}
            {remaining === null ? 'a limited number of' : remaining}{' '}
            {remaining === 1 ? 'seat' : 'seats'} left.
          </p>
          <Link
            to="/founders"
            className="hl-btn"
            style={{ background: 'var(--warm)', color: 'var(--parchment)', textDecoration: 'none', whiteSpace: 'nowrap' }}
          >
            put your name in the record
          </Link>
        </div>

        {/* footer */}
        <div
          style={{
            borderTop: `1px solid ${PARCHMENT.rule}`,
            marginTop: 56,
            paddingTop: 24,
            display: 'flex',
            gap: 24,
            alignItems: 'center',
          }}
        >
          <span className="hl-mono" style={{ fontSize: 10, color: PARCHMENT.faint, letterSpacing: '0.18em', textTransform: 'uppercase', marginRight: 'auto' }}>
            heirloom.blue · the family thread
          </span>
          <Link to="/" className="hl-mono" style={{ fontSize: 10, color: PARCHMENT.faint, letterSpacing: '0.18em', textTransform: 'uppercase', textDecoration: 'none' }}>
            home
          </Link>
          <Link to="/founders" className="hl-mono" style={{ fontSize: 10, color: PARCHMENT.faint, letterSpacing: '0.18em', textTransform: 'uppercase', textDecoration: 'none' }}>
            pledge
          </Link>
        </div>
      </div>
    </div>
  );
}
