import { useState } from 'react';
import { Link } from 'react-router-dom';
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

function Field({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={id} style={labelStyle}>{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={fieldStyle}
      />
    </div>
  );
}

export function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.name || !form.email || !form.subject || !form.message) {
      setError('Please fill in all fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://api.heirloom.blue/api'}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setIsSubmitted(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Could not send. Please try again.');
      }
    } catch {
      setError('Could not send. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppFrame>
      <div style={{ maxWidth: 640 }}>
        <Link
          to="/"
          className="loom-mono"
          style={{
            display: 'inline-block',
            fontSize: 10,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--loom-bone-faint)',
            textDecoration: 'none',
            marginBottom: 48,
          }}
        >
          ← back to heirloom
        </Link>

        {isSubmitted ? (
          <div
            role="status"
            style={{
              paddingTop: 40,
              textAlign: 'center',
              opacity: 1,
              animation: 'none',
            }}
          >
            <p
              className="loom-serif"
              style={{ fontSize: 36, color: 'var(--loom-warm)', margin: '0 0 28px', lineHeight: 1 }}
              aria-hidden
            >
              ∞
            </p>
            <h1
              className="loom-h2"
              style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 300, fontStyle: 'italic', margin: '0 0 14px' }}
            >
              Message sent.
            </h1>
            <p
              className="loom-body"
              style={{ color: 'var(--loom-bone-dim)', maxWidth: 480, margin: '0 auto 32px', lineHeight: 1.7 }}
            >
              Thank you for reaching out. We'll get back to you within 24–48 hours.
            </p>
            <Link
              to="/"
              className="loom-mono"
              style={{
                fontSize: 10,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--loom-warm)',
                textDecoration: 'none',
              }}
            >
              return home →
            </Link>
          </div>
        ) : (
          <>
            <header style={{ marginBottom: 40 }}>
              <p className="loom-eyebrow" style={{ marginBottom: 14 }}>Contact</p>
              <h1
                className="loom-h2"
                style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 300, fontStyle: 'italic', margin: 0 }}
              >
                Say something.
              </h1>
              <p
                className="loom-body"
                style={{ fontSize: 17, color: 'var(--loom-bone-dim)', margin: '14px 0 0', lineHeight: 1.6 }}
              >
                A question, a worry, a story you want to tell us first. We read every message.
              </p>
            </header>

            <form onSubmit={handleSubmit} aria-label="Contact form" style={{ display: 'grid', gap: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field id="c-name" label="Your name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Jane Doe" />
                <Field id="c-email" label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="you@example.com" />
              </div>
              <Field id="c-subject" label="Subject" value={form.subject} onChange={(v) => setForm({ ...form, subject: v })} placeholder="How can we help?" />
              <div>
                <label htmlFor="c-message" style={labelStyle}>Message</label>
                <textarea
                  id="c-message"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Tell us more about your question or concern."
                  rows={6}
                  style={{ ...fieldStyle, resize: 'vertical' }}
                />
              </div>

              {error ? (
                <p role="alert" className="loom-body" style={{ fontStyle: 'italic', color: '#c25a5a', fontSize: 14, margin: 0 }}>
                  {error}
                </p>
              ) : null}

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                  paddingTop: 8,
                }}
              >
                <p
                  className="loom-mono"
                  style={{ fontSize: 10, color: 'var(--loom-bone-faint)', letterSpacing: '0.08em', maxWidth: 260 }}
                >
                  Or write directly to{' '}
                  <a
                    href="mailto:support@heirloom.blue"
                    style={{ color: 'var(--loom-warm)', textDecoration: 'none', borderBottom: '1px solid var(--loom-rule-warm)' }}
                  >
                    support@heirloom.blue
                  </a>
                </p>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="loom-btn"
                  style={{ opacity: isSubmitting ? 0.5 : 1 }}
                >
                  {isSubmitting ? 'sending…' : 'send message'}
                </button>
              </div>
            </form>

            <p
              className="loom-mono"
              style={{ fontSize: 10, color: 'var(--loom-bone-faint)', marginTop: 48, letterSpacing: '0.08em' }}
            >
              131 Continental Dr Suite 305, Newark, DE 19713, US
            </p>
          </>
        )}
      </div>
    </AppFrame>
  );
}

export default Contact;
