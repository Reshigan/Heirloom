import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { foundersApi, type FounderCount } from '../services/api';
import { AppFrame } from '../loom/components/AppFrame';

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: "'Inter', sans-serif",
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: 'var(--loom-bone-faint)',
  marginBottom: 10,
};

const fieldStyle: React.CSSProperties = {
  width: '100%',
  background: 'transparent',
  border: '1px solid var(--loom-rule)',
  borderRadius: 2,
  color: 'var(--loom-bone)',
  caretColor: 'var(--loom-warm)',
  fontFamily: "'Source Serif 4', serif",
  fontSize: 16,
  lineHeight: 1.7,
  padding: '12px 14px',
  outline: 'none',
  boxSizing: 'border-box',
};

interface FieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}

function Field({ id, label, value, onChange, type = 'text', required, placeholder }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} style={labelStyle}>
        {label}
        {required ? <span style={{ color: '#c25a5a', marginLeft: 4 }} aria-hidden>*</span> : null}
      </label>
      <input
        id={id}
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={fieldStyle}
      />
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div style={{ borderLeft: '1px solid var(--loom-rule)', paddingLeft: 20 }}>
      <p className="loom-eyebrow" style={{ marginBottom: 8 }}>{label}</p>
      <p className="loom-serif" style={{ fontSize: 28, color: 'var(--loom-bone)', margin: '0 0 4px' }}>{value}</p>
      <p className="loom-mono" style={{ fontSize: 10, color: 'var(--loom-bone-faint)', letterSpacing: '0.08em' }}>{sub}</p>
    </div>
  );
}

export function Founder() {
  const [count, setCount] = useState<FounderCount | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    foundersApi
      .count()
      .then((r) => setCount(r.data))
      .catch(() => undefined);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await foundersApi.pledge({
        name: name.trim(),
        email: email.trim(),
        family_name: familyName.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      if (res.data.checkout_url) {
        window.location.href = res.data.checkout_url;
        return;
      }
      setDone({
        message: res.data.message ?? 'Thank you. We will be in touch within two business days.',
      });
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Could not record your pledge.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppFrame>
      {/* Hero */}
      <header style={{ marginBottom: 56, maxWidth: 720 }}>
        <p className="loom-eyebrow" style={{ marginBottom: 14 }}>Founder pledge — first 100</p>
        <h1
          className="loom-h2"
          style={{ fontSize: 'clamp(40px, 6vw, 72px)', fontWeight: 300, fontStyle: 'italic', margin: 0 }}
        >
          Found the<br />continuity record.
        </h1>
        <p
          className="loom-body"
          style={{ fontSize: 'clamp(17px, 1.5vw, 20px)', color: 'var(--loom-bone-dim)', margin: '20px 0 0', maxWidth: 600, lineHeight: 1.7 }}
        >
          One hundred families seed the successor non-profit. Your name is engraved in the public
          continuity record. Your bloodline gets lifetime Family-tier access. The thread that outlives
          all of us has its first hundred names — yours among them.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, auto)', gap: 28, justifyContent: 'start', marginTop: 40 }}>
          <Stat label="Pledge amount" value="$999" sub="one-time, lifetime" />
          <Stat label="Cap" value={count ? `${count.cap}` : '100'} sub="ever" />
          <Stat label="Remaining" value={count ? `${count.remaining}` : '—'} sub={count ? 'as of right now' : 'loading'} />
        </div>
      </header>

      <hr style={{ border: 0, borderTop: '1px solid var(--loom-rule)', margin: '0 0 56px' }} />

      {/* Benefits */}
      <section style={{ marginBottom: 64, maxWidth: 720 }}>
        <p className="loom-eyebrow" style={{ marginBottom: 14 }}>What you get</p>
        <h2
          className="loom-h2"
          style={{ fontSize: 'clamp(28px, 3.5vw, 40px)', fontWeight: 300, fontStyle: 'italic', margin: '0 0 40px' }}
        >
          Lifetime, engraved.
        </h2>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 28 }}>
          {[
            ['Lifetime Family-tier access for your bloodline.', 'No subscription, no renewals, no churn. Your descendants inherit the same plan.'],
            ['Your name in the continuity record.', 'A real, physical document filed with the successor non-profit at incorporation. Not a webpage that can be deleted — a public-record artifact.'],
            ['Quarterly call with the founder.', 'For as long as Heirloom is operating. Your input shapes the roadmap.'],
            ['You fund the successor non-profit.', 'Your pledge directly seeds the 501(c)(3) that takes over the archive if the company is wound down. The promise to outlast us is paid for, not aspirational.'],
            ['Welcome to the Opening Cohort.', 'A private group with the first hundred families. Quiet, considered. Not a Slack — letters and quarterly dinners where geography allows.'],
          ].map(([title, body]) => (
            <li key={title} style={{ display: 'grid', gridTemplateColumns: '20px 1fr', gap: 20, alignItems: 'baseline' }}>
              <span style={{ color: 'var(--loom-warm)', fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>·</span>
              <div>
                <p className="loom-body" style={{ fontSize: 18, color: 'var(--loom-bone)', margin: '0 0 6px', lineHeight: 1.4 }}>{title}</p>
                <p className="loom-body" style={{ fontSize: 15, color: 'var(--loom-bone-dim)', margin: 0, lineHeight: 1.7 }}>{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <hr style={{ border: 0, borderTop: '1px solid var(--loom-rule)', margin: '0 0 56px' }} />

      {/* Pledge form */}
      <section id="pledge" style={{ maxWidth: 560 }}>
        <p className="loom-eyebrow" style={{ marginBottom: 14 }}>Pledge</p>
        <h2
          className="loom-h2"
          style={{ fontSize: 'clamp(28px, 3.5vw, 40px)', fontWeight: 300, fontStyle: 'italic', margin: '0 0 10px' }}
        >
          Tell us who you are.
        </h2>
        <p
          className="loom-body"
          style={{ color: 'var(--loom-bone-dim)', margin: '0 0 40px', lineHeight: 1.7 }}
        >
          We respond within two business days with a payment link and the next steps. Pledging here
          doesn't charge your card — we want to read your note first.
        </p>

        {done ? (
          <div
            role="status"
            style={{
              border: '1px solid var(--loom-rule)',
              padding: 40,
              textAlign: 'center',
            }}
          >
            <p className="loom-serif" style={{ fontSize: 36, color: 'var(--loom-warm)', margin: '0 0 24px', lineHeight: 1 }} aria-hidden>
              ∞
            </p>
            <h3
              className="loom-h2"
              style={{ fontSize: 26, fontWeight: 300, fontStyle: 'italic', margin: '0 0 14px' }}
            >
              Pledge received.
            </h3>
            <p className="loom-body" style={{ color: 'var(--loom-bone-dim)', maxWidth: 400, margin: '0 auto 28px', lineHeight: 1.7 }}>
              {done.message}
            </p>
            <Link
              to="/"
              className="loom-mono"
              style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--loom-warm)', textDecoration: 'none' }}
            >
              back to heirloom →
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} aria-label="Founder pledge intent form" style={{ display: 'grid', gap: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Your name" id="f-name" required value={name} onChange={setName} />
              <Field label="Email" id="f-email" type="email" required value={email} onChange={setEmail} />
            </div>
            <Field label="Family name — optional" id="f-family" value={familyName} onChange={setFamilyName} placeholder="The Mahmood family" />
            <div>
              <label htmlFor="f-notes" style={labelStyle}>Why this matters to your family — optional</label>
              <textarea
                id="f-notes"
                rows={6}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="A few sentences. Your grandmother. The recipe nobody wrote down. The reason you're putting your hand up for this."
                style={{ ...fieldStyle, resize: 'vertical' }}
              />
            </div>

            {error ? (
              <p role="alert" className="loom-body" style={{ fontStyle: 'italic', color: '#c25a5a', fontSize: 14, margin: 0 }}>
                {error}
              </p>
            ) : null}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, paddingTop: 8 }}>
              <p
                className="loom-mono"
                style={{ fontSize: 10, color: 'var(--loom-bone-faint)', letterSpacing: '0.08em', maxWidth: 220 }}
              >
                {count ? `${count.cap - count.remaining}/${count.cap}` : '—/100'} pledges so far. We'll never sell or share your address.
              </p>
              <button
                type="submit"
                disabled={submitting || !name.trim() || !email.trim()}
                className="loom-btn"
                style={{ opacity: submitting || !name.trim() || !email.trim() ? 0.5 : 1 }}
              >
                {submitting ? 'submitting…' : 'pledge'}
              </button>
            </div>
          </form>
        )}
      </section>

      <div
        style={{
          borderTop: '1px solid var(--loom-rule)',
          marginTop: 96,
          paddingTop: 28,
          display: 'flex',
          gap: 28,
          alignItems: 'center',
        }}
      >
        <span className="loom-mono" style={{ fontSize: 11, color: 'var(--loom-warm)', marginRight: 'auto' }}>
          ∞ heirloom
        </span>
        <Link
          to="/"
          className="loom-mono"
          style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--loom-bone-faint)', textDecoration: 'none' }}
        >
          Home
        </Link>
        <Link
          to="/privacy"
          className="loom-mono"
          style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--loom-bone-faint)', textDecoration: 'none' }}
        >
          Privacy
        </Link>
        <Link
          to="/terms"
          className="loom-mono"
          style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--loom-bone-faint)', textDecoration: 'none' }}
        >
          Terms
        </Link>
        <a
          href="/api/archive/audit"
          className="loom-mono"
          style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--loom-bone-faint)', textDecoration: 'none' }}
        >
          Audit
        </a>
        <span className="loom-mono" style={{ fontSize: 10, letterSpacing: '0.08em', color: 'var(--loom-bone-faint)' }}>
          © {new Date().getFullYear()}
        </span>
      </div>
    </AppFrame>
  );
}
