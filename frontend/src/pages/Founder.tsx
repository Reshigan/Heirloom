import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2 } from 'lucide-react';
import api from '../services/api';

interface PledgeCount {
  paid: number;
  pledged: number;
  cap: number;
  remaining: number;
  pledge_amount_usd: number;
}

export function Founder() {
  const [count, setCount] = useState<PledgeCount | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<PledgeCount>('/founders/count').then((r) => setCount(r.data)).catch(() => undefined);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.post<{
        ok: boolean;
        already_pledged?: boolean;
        message?: string;
        cap_reached?: boolean;
        checkout_url?: string | null;
      }>('/founders/pledge', {
        name: name.trim(),
        email: email.trim(),
        family_name: familyName.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      // If we got a Stripe Checkout URL back, redirect there to complete
      // payment. The webhook handles PAID transition + pledge-number
      // assignment + welcome email.
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
    <main className="min-h-screen bg-void text-paper">
      <header className="px-6 md:px-12 pt-8 md:pt-10">
        <nav className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-baseline gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 rounded">
            <span className="font-serif text-3xl text-gold leading-none">∞</span>
            <span className="font-sans text-[0.7rem] tracking-[0.34em] uppercase text-paper/70 group-hover:text-paper transition-colors">Heirloom</span>
          </Link>
          <Link to="/login" className="text-paper/55 hover:text-paper transition-colors text-sm">Sign in</Link>
        </nav>
      </header>

      <section className="px-6 md:px-12 pt-24 md:pt-32 pb-20 md:pb-28">
        <div className="max-w-3xl mx-auto">
          <p className="eyebrow mb-6">Founder pledge — first 100</p>
          <h1
            className="font-serif font-light text-display-2xl tracking-tight leading-[1.04]"
            style={{ fontVariationSettings: '"opsz" 72' }}
          >
            Found the<br />continuity record.
          </h1>
          <p className="mt-10 text-body-xl text-paper/72 leading-relaxed max-w-prose font-light">
            One hundred families seed the successor non-profit. Your name is engraved in the public continuity record. Your bloodline gets lifetime Family-tier access. The thread that outlives all of us has its first hundred names — yours among them.
          </p>

          <div className="mt-14 grid sm:grid-cols-3 gap-x-10 gap-y-8 max-w-2xl">
            <Stat label="Pledge amount" value="$999" sub="one-time, lifetime" />
            <Stat label="Cap" value={count ? `${count.cap}` : '100'} sub="ever" />
            <Stat label="Remaining" value={count ? `${count.remaining}` : '—'} sub={count ? 'as of right now' : 'loading'} />
          </div>
        </div>
      </section>

      <hr className="border-rule mx-6 md:mx-12" />

      <section className="px-6 md:px-12 py-20 md:py-28">
        <div className="max-w-3xl mx-auto">
          <p className="eyebrow mb-6">What you get</p>
          <h2 className="font-serif font-light text-display-md mb-12">Lifetime, engraved.</h2>
          <ul className="space-y-7">
            {[
              [
                'Lifetime Family-tier access for your bloodline.',
                'No subscription, no renewals, no churn. Your descendants inherit the same plan.',
              ],
              [
                'Your name in the continuity record.',
                'A real, physical document filed with the successor non-profit at incorporation. Not a webpage that can be deleted — a public-record artifact.',
              ],
              [
                'Quarterly call with the founder.',
                'For as long as Heirloom is operating. Your input shapes the roadmap.',
              ],
              [
                'You fund the successor non-profit.',
                'Your pledge directly seeds the 501(c)(3) that takes over the archive if the company is wound down. The promise to outlast us is paid for, not aspirational.',
              ],
              [
                'Welcome to the Opening Cohort.',
                'A private group with the first hundred families. Quiet, considered. Not a Slack — letters and quarterly dinners where geography allows.',
              ],
            ].map(([title, body]) => (
              <li key={title} className="grid md:grid-cols-[2rem_1fr] gap-3 md:gap-7">
                <span className="text-gold font-mono text-sm pt-1">·</span>
                <div>
                  <p className="font-serif text-xl text-paper mb-1.5">{title}</p>
                  <p className="text-paper/65 text-[15px] leading-relaxed max-w-prose">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <hr className="border-rule mx-6 md:mx-12" />

      <section id="pledge" className="px-6 md:px-12 py-20 md:py-28">
        <div className="max-w-2xl mx-auto">
          <p className="eyebrow mb-6">Pledge</p>
          <h2 className="font-serif font-light text-display-md mb-3">Tell us who you are.</h2>
          <p className="text-paper/60 mb-12 leading-relaxed">
            We respond within two business days with a payment link and the next steps. Pledging here doesn't charge your card — we want to read your note first.
          </p>

          {done ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="border border-gold/35 rounded-xl p-10 text-center"
              role="status"
            >
              <span className="seal mx-auto mb-7 block" aria-hidden>∞</span>
              <h3 className="font-serif text-2xl mb-3">Pledge received.</h3>
              <p className="text-paper/65 max-w-prose mx-auto leading-relaxed">{done.message}</p>
              <Link to="/" className="inline-flex items-center gap-2 text-gold hover:text-gold-bright mt-8">
                Back to Heirloom <ArrowRight size={16} />
              </Link>
            </motion.div>
          ) : (
            <form onSubmit={submit} className="space-y-6" aria-label="Founder pledge intent form">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Your name" id="f-name" required value={name} onChange={setName} />
                <Field label="Email" id="f-email" type="email" required value={email} onChange={setEmail} />
              </div>
              <Field label="Family name — optional" id="f-family" value={familyName} onChange={setFamilyName} placeholder="The Mahmood family" />
              <div>
                <label htmlFor="f-notes" className="block text-xs uppercase tracking-[0.22em] text-paper/45 mb-2.5">
                  Why this matters to your family — optional
                </label>
                <textarea
                  id="f-notes"
                  rows={6}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="A few sentences. Your grandmother. The recipe nobody wrote down. The reason you're putting your hand up for this."
                  className="input font-serif text-body-md leading-[1.7] resize-y"
                  style={{ fontVariationSettings: '"opsz" 14' }}
                />
              </div>

              {error ? <p role="alert" className="text-blood-light text-sm">{error}</p> : null}

              <div className="flex items-center justify-between gap-4 pt-4">
                <p className="text-xs text-paper/40 max-w-xs leading-relaxed">
                  We're at {count ? `${count.cap - count.remaining}/${count.cap}` : '—/100'} pledges. We'll never sell or share your address.
                </p>
                <button
                  type="submit"
                  disabled={submitting || !name.trim() || !email.trim()}
                  className="btn btn-primary"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
                  {submitting ? 'Submitting…' : 'Pledge'}
                  {!submitting ? <ArrowRight size={16} /> : null}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      <footer className="border-t border-rule px-6 md:px-12 py-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-baseline gap-3">
            <span className="text-xl text-gold">∞</span>
            <span className="text-[0.65rem] tracking-[0.34em] uppercase text-paper/55">Heirloom</span>
          </div>
          <div className="flex gap-7 text-sm text-paper/50">
            <Link to="/" className="hover:text-paper transition-colors">Home</Link>
            <Link to="/privacy" className="hover:text-paper transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-paper transition-colors">Terms</Link>
            <a href="/api/archive/audit" className="hover:text-paper transition-colors">Audit</a>
          </div>
          <div className="text-xs font-mono text-paper/35">© {new Date().getFullYear()}</div>
        </div>
      </footer>
    </main>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="border-l border-rule pl-5">
      <p className="text-[0.65rem] uppercase tracking-[0.28em] text-paper/45 mb-2">{label}</p>
      <p className="font-serif text-3xl text-paper mb-1">{value}</p>
      <p className="text-xs text-paper/45">{sub}</p>
    </div>
  );
}

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
      <label htmlFor={id} className="block text-xs uppercase tracking-[0.22em] text-paper/45 mb-2.5">
        {label}
        {required ? <span className="text-blood-light/70 ml-1" aria-hidden>*</span> : null}
      </label>
      <input
        id={id}
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input"
      />
    </div>
  );
}
