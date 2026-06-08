import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ClothShell } from '../loom/components/ClothShell';
import { HLogo } from '../loom/components/HLogo';

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

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid var(--rule)',
    borderRadius: 0,
    color: 'var(--bone)',
    caretColor: 'var(--warm)',
    fontFamily: 'var(--serif)',
    fontSize: 16,
    lineHeight: 1.7,
    padding: '10px 0',
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <ClothShell topbarLeft={<HLogo />} topbarCenter="contact">
      <div style={{ maxWidth: 700, margin: '0 auto', padding: 'clamp(24px,5vw,48px)' }}>
        {isSubmitted ? (
          <div role="status" style={{ paddingTop: 40 }}>
            <p
              className="hl-serif"
              style={{ fontSize: 36, color: 'var(--warm)', margin: '0 0 28px', lineHeight: 1 }}
              aria-hidden
            >
              ∞
            </p>
            <h1
              className="hl-serif hl-tight"
              style={{ fontSize: 52, fontWeight: 300, margin: '0 0 20px', color: 'var(--bone)' }}
            >
              Message sent.
            </h1>
            <p
              className="hl-prose"
              style={{ fontSize: 17, color: 'var(--bone-dim)', margin: '0 0 40px', lineHeight: 1.7 }}
            >
              Thank you for reaching out. We'll get back to you within two business days.
            </p>
            <Link to="/" className="hl-link warm" style={{ fontSize: 15 }}>
              return home →
            </Link>
          </div>
        ) : (
          <>
            <h1
              className="hl-serif hl-tight"
              style={{ fontSize: 52, fontWeight: 300, margin: '0 0 20px', color: 'var(--bone)' }}
            >
              Write to us.
            </h1>
            <p
              className="hl-prose"
              style={{ fontSize: 17, color: 'var(--bone-dim)', margin: '0 0 40px', lineHeight: 1.6 }}
            >
              We respond within two business days.
            </p>

            <form onSubmit={handleSubmit} aria-label="Contact form" noValidate>
              <div style={{ marginBottom: 18 }}>
                <input
                  id="c-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Your name"
                  aria-label="Your name"
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: 18 }}>
                <input
                  id="c-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="Email address"
                  aria-label="Email address"
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: 18 }}>
                <input
                  id="c-subject"
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="Subject"
                  aria-label="Subject"
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: 24 }}>
                <textarea
                  id="c-message"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Your message"
                  aria-label="Your message"
                  style={{
                    ...inputStyle,
                    minHeight: 160,
                    resize: 'none',
                    paddingBottom: 12,
                  }}
                />
              </div>

              {error ? (
                <p role="alert" className="hl-prose" style={{ fontStyle: 'italic', color: 'var(--danger)', fontSize: 14, margin: '0 0 18px' }}>
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="hl-btn"
                style={{ opacity: isSubmitting ? 0.5 : 1 }}
              >
                {isSubmitting ? 'sending…' : 'Send →'}
              </button>
            </form>

            <p
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 10,
                color: 'var(--bone-dim)',
                marginTop: 48,
                letterSpacing: '0.08em',
              }}
            >
              131 Continental Dr Suite 305, Newark, DE 19713, US
            </p>
          </>
        )}
      </div>
    </ClothShell>
  );
}

export default Contact;
