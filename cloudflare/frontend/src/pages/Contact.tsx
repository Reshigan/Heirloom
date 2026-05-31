import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

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
      <label htmlFor={id} className="block text-xs uppercase tracking-[0.22em] text-paper-50 mb-2.5">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-void-surface border border-paper-15 focus:border-gold focus:outline-none text-paper px-4 py-3 rounded-[2px] placeholder:text-paper-30 transition-colors"
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
    <main className="min-h-screen bg-void text-paper antialiased px-6 md:px-12 py-12">
      <div className="max-w-2xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-paper-50 hover:text-gold transition-colors text-sm"
        >
          <span aria-hidden>←</span> Back to Heirloom
        </Link>

        {isSubmitted ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mt-24 text-center"
            role="status"
          >
            <span className="font-body text-4xl text-gold block mb-7" aria-hidden>∞</span>
            <h1 className="font-body font-light text-3xl mb-3 tracking-[-0.014em]">Message sent.</h1>
            <p className="text-paper-65 max-w-prose mx-auto leading-relaxed">
              Thank you for reaching out. We'll get back to you within 24–48 hours.
            </p>
            <Link to="/" className="inline-flex items-center gap-2 text-gold hover:text-gold-bright mt-8">
              Return home <span aria-hidden>→</span>
            </Link>
          </motion.div>
        ) : (
          <div className="mt-16">
            <p className="font-mono text-[0.7rem] tracking-[0.32em] uppercase text-gold mb-6">Contact</p>
            <h1
              className="font-body font-light leading-[1.1] tracking-[-0.018em]"
              style={{ fontSize: 'clamp(2.25rem, 4vw, 3.25rem)' }}
            >
              Say something.
            </h1>
            <p className="mt-6 text-paper-70 leading-relaxed max-w-prose font-light">
              A question, a worry, a story you want to tell us first. We read every message.
            </p>

            <form onSubmit={handleSubmit} className="mt-12 space-y-6" aria-label="Contact form">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field id="c-name" label="Your name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="John Doe" />
                <Field id="c-email" label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="you@example.com" />
              </div>
              <Field id="c-subject" label="Subject" value={form.subject} onChange={(v) => setForm({ ...form, subject: v })} placeholder="How can we help?" />
              <div>
                <label htmlFor="c-message" className="block text-xs uppercase tracking-[0.22em] text-paper-50 mb-2.5">
                  Message
                </label>
                <textarea
                  id="c-message"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Tell us more about your question or concern."
                  rows={6}
                  className="w-full bg-void-surface border border-paper-15 focus:border-gold focus:outline-none text-paper px-4 py-3 rounded-[2px] placeholder:text-paper-30 transition-colors font-body text-base leading-[1.7] resize-y"
                />
              </div>

              {error ? <p role="alert" className="text-blood text-sm">{error}</p> : null}

              <div className="flex items-center justify-between gap-4 pt-2">
                <p className="text-xs text-paper-50 max-w-xs leading-relaxed">
                  Or reach us directly at{' '}
                  <a href="mailto:support@heirloom.blue" className="text-gold hover:text-gold-bright transition-colors">
                    support@heirloom.blue
                  </a>
                </p>
                <button type="submit" disabled={isSubmitting} className="btn btn-primary">
                  {isSubmitting ? 'Sending…' : 'Send message'}
                  {!isSubmitting ? <span aria-hidden>→</span> : null}
                </button>
              </div>
            </form>

            <p className="text-xs text-paper-30 mt-12 font-mono">
              131 Continental Dr Suite 305, Newark, DE 19713, US
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

export default Contact;
