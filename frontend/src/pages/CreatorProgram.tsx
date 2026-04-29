import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Loader2, Sparkles } from 'lucide-react';
import api from '../services/api';

interface ApplyForm {
  name: string;
  email: string;
  instagramHandle: string;
  tiktokHandle: string;
  youtubeChannel: string;
  websiteUrl: string;
  followerCount: string;
  niche: string;
}

const TIERS = [
  { name: 'Nano', range: 'under 1K', commission: '15%', codeDiscount: '10% off for your audience' },
  { name: 'Micro', range: '1K–10K', commission: '20%', codeDiscount: '15% off for your audience' },
  { name: 'Mid', range: '10K–100K', commission: '25%', codeDiscount: '20% off for your audience' },
  { name: 'Macro', range: '100K–1M', commission: '30%', codeDiscount: '25% off for your audience' },
  { name: 'Mega', range: '1M+', commission: '40% + flat fee', codeDiscount: '30% off for your audience' },
];

const PERKS = [
  'A unique discount code for your audience, generated automatically',
  'Your own landing page at heirloom.blue/ref/your-handle',
  'Lifetime free Family plan for your own family thread',
  'Real-time dashboard — clicks, signups, commission earned',
  'Stripe payouts directly to your bank, automatic when you hit threshold',
  'Custom assets — pre-cleared captions, video clips, brand kit',
];

export function CreatorProgram() {
  const [form, setForm] = useState<ApplyForm>({
    name: '',
    email: '',
    instagramHandle: '',
    tiktokHandle: '',
    youtubeChannel: '',
    websiteUrl: '',
    followerCount: '',
    niche: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.post('/influencers/apply', {
        name: form.name,
        email: form.email,
        instagramHandle: form.instagramHandle || undefined,
        tiktokHandle: form.tiktokHandle || undefined,
        youtubeChannel: form.youtubeChannel || undefined,
        websiteUrl: form.websiteUrl || undefined,
        followerCount: form.followerCount ? parseInt(form.followerCount, 10) : 0,
        niche: form.niche || undefined,
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Could not submit application');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-void text-paper">
      <nav className="px-6 md:px-12 py-5 flex items-center justify-between max-w-7xl mx-auto">
        <Link to="/" className="flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-gold/40 rounded">
          <span className="text-2xl text-gold">∞</span>
          <span className="text-lg tracking-[0.2em] text-paper/80">HEIRLOOM</span>
        </Link>
        <Link to="/login" className="text-sm text-paper/60 hover:text-paper transition-colors">
          Sign in
        </Link>
      </nav>

      <section className="px-6 md:px-12 pt-12 md:pt-20 pb-12 md:pb-20 max-w-4xl mx-auto">
        <p className="text-gold tracking-[0.3em] text-xs mb-4">CREATOR PROGRAM</p>
        <h1 className="font-serif text-4xl md:text-6xl leading-tight">
          Help families start the thread.
        </h1>
        <p className="text-xl text-paper/60 mt-6 max-w-2xl leading-relaxed">
          Heirloom is a perpetual, multi-generational family archive — the first product designed to outlive the company that built it. We pay creators who introduce it to the families who need it.
        </p>
        <div className="mt-10 flex items-center gap-3 text-paper/40 text-sm">
          <Sparkles size={16} className="text-gold" />
          You keep your free lifetime Family plan whether or not you post.
        </div>
      </section>

      <section className="px-6 md:px-12 pb-16 md:pb-24 max-w-5xl mx-auto">
        <p className="text-gold tracking-[0.3em] text-xs mb-3">COMMISSION TIERS</p>
        <h2 className="font-serif text-3xl md:text-4xl mb-10">Per-tier rates, paid out automatically.</h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {TIERS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="rounded-xl border border-paper/10 bg-paper/[0.02] p-5"
            >
              <h3 className="font-serif text-xl text-paper mb-1">{t.name}</h3>
              <p className="text-paper/40 text-xs font-mono">{t.range} followers</p>
              <p className="mt-4 text-gold text-2xl">{t.commission}</p>
              <p className="text-paper/50 text-xs">commission per yearly sub</p>
              <p className="mt-3 text-paper/60 text-xs">{t.codeDiscount}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="px-6 md:px-12 pb-16 md:pb-24 max-w-3xl mx-auto">
        <p className="text-gold tracking-[0.3em] text-xs mb-3">WHAT YOU GET</p>
        <h2 className="font-serif text-3xl md:text-4xl mb-8">Built for honest creators.</h2>
        <ul className="space-y-3">
          {PERKS.map((perk) => (
            <li key={perk} className="flex items-start gap-3 text-paper/70 leading-relaxed">
              <Check size={18} className="text-gold flex-shrink-0 mt-1" />
              <span>{perk}</span>
            </li>
          ))}
        </ul>
        <p className="text-paper/40 text-sm mt-8 leading-relaxed">
          We don't ask you to follow a script. We don't direct your message. The product is unusual — multi-generational, time-locked, committed to outlasting us — and we want creators who tell their family's honest experience with it.
        </p>
      </section>

      <section id="apply" className="px-6 md:px-12 pb-24 max-w-2xl mx-auto">
        <p className="text-gold tracking-[0.3em] text-xs mb-3">APPLY</p>
        <h2 className="font-serif text-3xl md:text-4xl mb-8">Tell us about yourself.</h2>

        {submitted ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-xl border border-gold/30 bg-gold/[0.04] p-8 text-center"
            role="status"
          >
            <h3 className="font-serif text-2xl mb-3">Application received.</h3>
            <p className="text-paper/60 leading-relaxed max-w-md mx-auto">
              We review applications within 48 hours. You'll get an email with your unique discount code and landing page once approved.
            </p>
            <Link to="/" className="inline-flex items-center gap-2 text-gold hover:text-gold-bright mt-6">
              Back to Heirloom <ArrowRight size={16} />
            </Link>
          </motion.div>
        ) : (
          <form onSubmit={submit} className="space-y-5" aria-label="Creator program application">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Your name" id="cp-name" required value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
              <Field label="Email" id="cp-email" type="email" required value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Instagram handle" id="cp-ig" value={form.instagramHandle} onChange={(v) => setForm({ ...form, instagramHandle: v })} placeholder="@yourhandle" />
              <Field label="TikTok handle" id="cp-tt" value={form.tiktokHandle} onChange={(v) => setForm({ ...form, tiktokHandle: v })} placeholder="@yourhandle" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="YouTube channel" id="cp-yt" value={form.youtubeChannel} onChange={(v) => setForm({ ...form, youtubeChannel: v })} placeholder="channel URL or handle" />
              <Field label="Website" id="cp-web" value={form.websiteUrl} onChange={(v) => setForm({ ...form, websiteUrl: v })} placeholder="optional" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field
                label="Largest follower count"
                id="cp-followers"
                type="number"
                value={form.followerCount}
                onChange={(v) => setForm({ ...form, followerCount: v })}
                placeholder="approx, your biggest platform"
              />
              <Field
                label="Niche"
                id="cp-niche"
                value={form.niche}
                onChange={(v) => setForm({ ...form, niche: v })}
                placeholder="grief, family, aging parents, genealogy…"
              />
            </div>

            {error ? <p role="alert" className="text-blood text-sm">{error}</p> : null}

            <button
              type="submit"
              disabled={submitting || !form.name || !form.email}
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-gold text-void font-medium rounded-lg hover:bg-gold-bright transition-colors disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:ring-offset-2 focus:ring-offset-void"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
              {submitting ? 'Submitting…' : 'Apply to the program'}
              {!submitting ? <ArrowRight size={16} /> : null}
            </button>
            <p className="text-xs text-paper/40 leading-relaxed">
              We respond within 48 hours. By applying you confirm you'd disclose the partnership in any sponsored content per your platform's rules.
            </p>
          </form>
        )}
      </section>

      <footer className="border-t border-paper/5 py-10 px-6 md:px-12 text-paper/40 text-sm text-center">
        © {new Date().getFullYear()} Heirloom · <Link to="/privacy" className="hover:text-paper">Privacy</Link> · <Link to="/terms" className="hover:text-paper">Terms</Link>
      </footer>
    </main>
  );
}

interface FieldProps {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}

function Field({ label, id, value, onChange, type = 'text', placeholder, required }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs uppercase tracking-[0.2em] text-paper/40 mb-2">
        {label}
        {required ? <span className="text-blood/70 ml-1" aria-hidden>*</span> : null}
      </label>
      <input
        id={id}
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-void/40 border border-paper/10 rounded-lg px-4 py-3 text-paper placeholder:text-paper/30 focus:outline-none focus:border-gold/40 focus:ring-2 focus:ring-gold/20 transition"
      />
    </div>
  );
}
