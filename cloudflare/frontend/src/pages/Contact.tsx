import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ClothShell } from '../loom/components/ClothShell';
import { HLogo } from '../loom/components/HLogo';
import { usePageMeta } from '../lib/usePageMeta';
import {
  CosmicHeader,
  SectionLabel,
  WaxSeal,
} from '../loom/cosmic/CosmicUI';

export function Contact() {
  usePageMeta('Contact', 'Get in touch with the Heirloom team.');
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const submitInProgress = useRef(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitInProgress.current) return;
    setError('');

    if (!form.name || !form.email || !form.subject || !form.message) {
      setError('Please fill in all fields.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('please enter a valid email address');
      return;
    }

    submitInProgress.current = true;
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
      submitInProgress.current = false;
      setIsSubmitting(false);
    }
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: 8,
    fontFamily: 'var(--mono)',
    fontSize: 10,
    letterSpacing: '0.32em',
    textTransform: 'uppercase',
    color: 'var(--bone-dim)',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid var(--rule)',
    borderRadius: 0,
    color: 'var(--bone)',
    caretColor: 'var(--warm)',
    fontFamily: 'var(--serif)',
    fontSize: 18,
    lineHeight: 1.7,
    padding: '12px 0',
    outline: 'none',
    boxSizing: 'border-box',
    display: 'block',
  };

  return (
    <ClothShell topbarLeft={<HLogo href="/" />} topbarCenter="contact">
      <div
        style={{
          maxWidth: 'var(--page-max-prose)',
          margin: '0 auto',
          padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)',
        }}
      >
        {isSubmitted ? (
          /* ── Success state ── */
          <div role="status" style={{ paddingTop: 40 }}>
            <WaxSeal size={36} />
            <h1
              className="hl-serif hl-tight"
              style={{
                fontFamily: 'var(--serif-display)',
                fontSize: 'clamp(34px,7vw,58px)',
                fontWeight: 500,
                lineHeight: 1.04,
                color: 'var(--bone)',
                margin: '28px 0 20px',
              }}
            >
              Message sent.
            </h1>
            <p
              style={{
                fontFamily: 'var(--serif)',
                fontStyle: 'italic',
                fontSize: 17,
                color: 'var(--bone-dim)',
                margin: '0 0 40px',
                lineHeight: 1.7,
              }}
            >
              Thank you for reaching out. We'll get back to you within two business days.
            </p>
            <Link
              to="/"
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 11,
                letterSpacing: '0.26em',
                textTransform: 'uppercase',
                color: 'var(--warm)',
                textDecoration: 'none',
              }}
            >
              Return home →
            </Link>
          </div>
        ) : (
          /* ── Idle / submitting state ── */
          <>
            <CosmicHeader
              eyebrow="contact"
              title="Write to us."
              sub="We respond within two business days."
            />

            {/* Contact channel */}
            <SectionLabel>Where to find us</SectionLabel>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 0',
                borderBottom: '1px solid var(--rule)',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--serif)',
                  fontSize: 14,
                  color: 'var(--bone)',
                }}
              >
                Office
              </span>
              <span
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 10,
                  letterSpacing: '0.14em',
                  color: 'var(--bone-dim)',
                  textAlign: 'right',
                }}
              >
                131 Continental Dr Suite 305, Newark, DE 19713, US
              </span>
            </div>

            {/* Contact form */}
            <SectionLabel>Send a message</SectionLabel>
            <form
              onSubmit={handleSubmit}
              aria-label="Contact form"
              noValidate
              style={{ marginTop: 8 }}
            >
              <div style={{ marginBottom: 20 }}>
                <label htmlFor="c-name" style={labelStyle}>
                  Your name
                </label>
                <input
                  id="c-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Your name"
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label htmlFor="c-email" style={labelStyle}>
                  Email address
                </label>
                <input
                  id="c-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="Email address"
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label htmlFor="c-subject" style={labelStyle}>
                  Subject
                </label>
                <input
                  id="c-subject"
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="Subject"
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: 28 }}>
                <label htmlFor="c-message" style={labelStyle}>
                  Your message
                </label>
                <textarea
                  id="c-message"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Your message"
                  style={{
                    ...inputStyle,
                    minHeight: 160,
                    resize: 'none',
                    paddingBottom: 12,
                  }}
                />
              </div>

              {error ? (
                <p
                  role="alert"
                  style={{
                    fontFamily: 'var(--mono)',
                    fontStyle: 'italic',
                    fontSize: 12,
                    letterSpacing: '0.08em',
                    color: 'var(--warm)',
                    margin: '0 0 20px',
                  }}
                >
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '12px 0',
                  fontFamily: 'var(--mono)',
                  fontSize: 11,
                  letterSpacing: '0.26em',
                  textTransform: 'uppercase',
                  color: 'var(--warm)',
                  cursor: isSubmitting ? 'default' : 'pointer',
                  opacity: isSubmitting ? 0.5 : 1,
                  minHeight: 44,
                  display: 'inline-flex',
                  alignItems: 'center',
                  transition: 'opacity 180ms var(--ease)',
                }}
              >
                {isSubmitting ? 'Sending…' : 'Send →'}
              </button>
            </form>

            <div style={{ marginTop: 72 }}>
              <WaxSeal size={28} />
            </div>
          </>
        )}
      </div>
    </ClothShell>
  );
}

export default Contact;
