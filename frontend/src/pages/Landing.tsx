import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { FutureDate } from '../components/landing/FutureDate';

const PILLARS = [
  {
    eyebrow: 'I',
    title: 'A thread, not a profile.',
    body: 'One archive your whole family writes into across generations. Append-only — what you write today is what your great-granddaughter reads in 2120.',
  },
  {
    eyebrow: 'II',
    title: 'Time-locked entries.',
    body: 'Lock an entry for your granddaughter\'s 18th birthday. Or 50 years from today. Or until the day of your own funeral. Even we can\'t read it until then.',
  },
  {
    eyebrow: 'III',
    title: 'Cross-generational.',
    body: 'Your daughter adds to your grandmother\'s entries. Your grandson asks the archive what it remembers about a kitchen on Kingston Avenue in 1962. Stories compound.',
  },
  {
    eyebrow: 'IV',
    title: 'Outlives the company.',
    body: 'Mirrored to IPFS. Held by a separately-incorporated successor non-profit. Exportable in an open format any time, by any member. Your thread survives if we don\'t.',
  },
];

const STEPS = [
  { n: '01', title: 'Open a thread', body: 'A thread belongs to your family, not to you. Anyone in the bloodline can be granted authorship over time.' },
  { n: '02', title: 'Write the first entry', body: 'A photo with the story behind it. Mom\'s spaghetti recipe before nobody can read her handwriting. The first one is the hardest. The rest get easier.' },
  { n: '03', title: 'Lock for whoever, whenever', body: 'Set an entry to release on a specific date. Or when your granddaughter turns eighteen. Or fifty years from today. Or on your funeral.' },
  { n: '04', title: 'It outlasts you, and us', body: 'IPFS pins. A successor non-profit. Open-format export, one click. No vendor lock-in. The thread continues after you, after us, after the company.' },
];

const PLANS = [
  {
    name: 'Reader',
    price: 'Free',
    cadence: 'forever',
    features: ['Read your family\'s threads', 'Up to 10 entries / year', 'Voice, photo, letter — every format', 'Time-locked entries you receive', 'No deletion. No expiry. Ever.'],
    cta: 'Open a thread',
  },
  {
    name: 'Family',
    price: '$15',
    cadence: '/month per family',
    features: ['Unlimited entries, unlimited members', 'Time-lock by date · age · event', 'Cross-generational comments', 'The Living Book — print on demand', 'Family-only encrypted, even from us'],
    cta: 'Start the thread',
    feature: true,
  },
  {
    name: 'Founder',
    price: '$999',
    cadence: 'lifetime',
    features: ['Everything in Family, forever', 'Funds the successor non-profit', 'Name engraved in the continuity record', 'Quarterly call with the founder', 'First 100 only'],
    cta: 'Become a Founder',
  },
];

export function Landing() {
  return (
    <main className="min-h-screen bg-void text-paper antialiased">
      {/* ---------- Top mark ---------- */}
      <header className="px-6 md:px-12 pt-8 md:pt-10">
        <nav className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-baseline gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 rounded">
            <span className="font-serif text-3xl text-gold leading-none">∞</span>
            <span className="font-sans text-[0.7rem] tracking-[0.34em] uppercase text-paper/70 group-hover:text-paper transition-colors">Heirloom</span>
          </Link>
          <div className="flex items-center gap-7 text-sm">
            <Link to="/creators" className="text-paper/55 hover:text-paper transition-colors hidden md:inline">For creators</Link>
            <Link to="/login" className="text-paper/55 hover:text-paper transition-colors hidden md:inline">Sign in</Link>
            <Link to="/signup" className="btn btn-primary">Open a thread</Link>
          </div>
        </nav>
      </header>

      {/* ---------- Hero ---------- */}
      <section className="px-6 md:px-12 pt-24 md:pt-40 pb-28 md:pb-40">
        <div className="max-w-5xl mx-auto">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="eyebrow mb-8"
          >
            The family thread
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="font-serif font-light text-display-2xl tracking-tight"
            style={{ fontVariationSettings: '"opsz" 72' }}
          >
            Start your family's<br />
            <em className="not-italic text-gold">thousand-year</em> thread.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="mt-10 max-w-prose text-body-xl text-paper/72 leading-relaxed font-light"
          >
            Write today. Lock entries for descendants who don't exist yet. Read what came before. The thread continues after you, after us, after the company.
          </motion.p>

          {/* The wow detail: a real future moment, ticking. */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="mt-12 inline-flex items-center gap-3 pl-4 pr-5 py-2.5 border border-rule rounded-full"
            aria-label="Example time-lock — entry written today opening 30 years from now"
          >
            <span className="seal" aria-hidden style={{ width: 14, height: 14, fontSize: 0 }} />
            <span className="text-paper/35 text-xs tracking-[0.2em] uppercase">an entry written tonight</span>
            <FutureDate yearsAhead={30} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="mt-14 flex flex-wrap items-center gap-5"
          >
            <Link to="/signup" className="btn btn-primary text-base px-7 py-4">
              Open a thread — free forever
              <ArrowRight size={18} />
            </Link>
            <a href="#how" className="text-paper/60 hover:text-paper transition-colors text-sm tracking-wide">
              How it works <span aria-hidden>↓</span>
            </a>
          </motion.div>
        </div>
      </section>

      <hr className="border-rule mx-6 md:mx-12" />

      {/* ---------- Pillars ---------- */}
      <section className="px-6 md:px-12 py-24 md:py-36">
        <div className="max-w-6xl mx-auto">
          <p className="eyebrow mb-6">What it is</p>
          <h2 className="font-serif font-light text-display-lg max-w-prose mb-20">
            A new kind of family archive — built to be read by people who don't exist yet.
          </h2>
          <div className="grid md:grid-cols-2 gap-x-16 gap-y-14">
            {PILLARS.map((p, i) => (
              <motion.article
                key={p.eyebrow}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.6, delay: i * 0.05 }}
                className="border-l border-rule pl-7"
              >
                <p className="font-mono text-xs tracking-[0.3em] text-gold mb-3">{p.eyebrow}</p>
                <h3 className="font-serif font-light text-2xl md:text-3xl mb-4 leading-snug">{p.title}</h3>
                <p className="text-paper/65 leading-relaxed max-w-prose">{p.body}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <hr className="border-rule mx-6 md:mx-12" />

      {/* ---------- How it works ---------- */}
      <section id="how" className="px-6 md:px-12 py-24 md:py-36">
        <div className="max-w-4xl mx-auto">
          <p className="eyebrow mb-6">Steps</p>
          <h2 className="font-serif font-light text-display-lg mb-16">Simple, on the surface.<br />Built to last underneath.</h2>
          <ol className="space-y-12">
            {STEPS.map((s, i) => (
              <motion.li
                key={s.n}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="grid md:grid-cols-[80px_1fr] gap-6 md:gap-12 items-baseline"
              >
                <span className="font-mono text-paper/30 text-sm tracking-[0.2em]">{s.n}</span>
                <div>
                  <h3 className="font-serif font-normal text-xl md:text-2xl mb-2">{s.title}</h3>
                  <p className="text-paper/65 leading-relaxed max-w-prose">{s.body}</p>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>
      </section>

      <hr className="border-rule mx-6 md:mx-12" />

      {/* ---------- Pricing ---------- */}
      <section className="px-6 md:px-12 py-24 md:py-36">
        <div className="max-w-6xl mx-auto">
          <p className="eyebrow mb-6">Pricing</p>
          <h2 className="font-serif font-light text-display-lg mb-3">Per family, not per seat.</h2>
          <p className="text-paper/60 max-w-prose mb-16 text-body-lg">
            One subscription covers your whole bloodline. Free forever for readers. The Founder tier funds the successor non-profit and is capped at the first hundred families.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map((p) => (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className={`p-8 border rounded-xl flex flex-col ${
                  p.feature ? 'border-gold/40 bg-gold/[0.03]' : 'border-rule bg-paper/[0.015]'
                }`}
              >
                <h3 className="font-serif text-2xl mb-1">{p.name}</h3>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-serif text-4xl">{p.price}</span>
                  <span className="text-paper/45 text-sm">{p.cadence}</span>
                </div>
                <ul className="mt-7 mb-8 space-y-2.5 text-paper/72 text-[15px]">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-3">
                      <span className="text-gold flex-shrink-0 mt-1">·</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to={p.name === 'Founder' ? '/founder' : '/signup'}
                  className={`btn mt-auto w-full justify-center ${p.feature ? 'btn-primary' : 'btn-secondary'}`}
                >
                  {p.cta}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <hr className="border-rule mx-6 md:mx-12" />

      {/* ---------- Continuity ---------- */}
      <section className="px-6 md:px-12 py-24 md:py-36">
        <div className="max-w-4xl mx-auto">
          <p className="eyebrow mb-6">Continuity</p>
          <h2 className="font-serif font-light text-display-lg mb-8">
            Built to <em className="not-italic text-gold">outlast the company.</em>
          </h2>
          <p className="text-body-lg text-paper/72 leading-relaxed max-w-prose mb-12">
            Every digital-legacy startup has died and taken users' content with it. We make that an architectural impossibility.
          </p>
          <dl className="grid md:grid-cols-3 gap-x-10 gap-y-10">
            <div>
              <dt className="font-serif text-xl mb-2">Decentralized backups</dt>
              <dd className="text-paper/60 leading-relaxed text-[15px]">Every Thread snapshot pinned to IPFS across multiple independent providers. Your archive exists outside our infrastructure, by design.</dd>
            </div>
            <div>
              <dt className="font-serif text-xl mb-2">Successor non-profit</dt>
              <dd className="text-paper/60 leading-relaxed text-[15px]">A separately incorporated 501(c)(3) holds an irrevocable license to operate the archive if Heirloom dissolves. Funded by Founder pledges.</dd>
            </div>
            <div>
              <dt className="font-serif text-xl mb-2">Open-format export</dt>
              <dd className="text-paper/60 leading-relaxed text-[15px]">One click downloads your full thread as JSON + media files. The export schema is published, versioned, stable. No vendor lock-in.</dd>
            </div>
          </dl>
          <p className="mt-14 text-sm text-paper/45">
            See <a href="/api/archive/audit" className="underline decoration-rule-strong underline-offset-4 hover:text-paper transition-colors">the public continuity audit</a> — pin status updated weekly.
          </p>
        </div>
      </section>

      <hr className="border-rule mx-6 md:mx-12" />

      {/* ---------- Closing ---------- */}
      <section className="px-6 md:px-12 py-32 md:py-44 text-center">
        <div className="max-w-3xl mx-auto">
          <p className="eyebrow mb-6">Begin</p>
          <h2 className="font-serif font-light text-display-xl mb-8 leading-tight">
            The first entry is the hardest one.
          </h2>
          <p className="text-body-xl text-paper/65 mb-12 max-w-prose mx-auto leading-relaxed">
            Open a thread tonight. Lock it for whoever you want, whenever you want. The thread is yours — and your great-granddaughter's — forever.
          </p>
          <Link to="/signup" className="btn btn-primary text-base px-8 py-4">
            Open a thread — free forever
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-rule px-6 md:px-12 py-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-baseline gap-3">
            <span className="text-xl text-gold">∞</span>
            <span className="text-[0.65rem] tracking-[0.34em] uppercase text-paper/55">Heirloom</span>
          </div>
          <div className="flex gap-7 text-sm text-paper/50">
            <Link to="/creators" className="hover:text-paper transition-colors">Creators</Link>
            <Link to="/privacy" className="hover:text-paper transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-paper transition-colors">Terms</Link>
            <a href="/api/archive/audit" className="hover:text-paper transition-colors">Audit</a>
          </div>
          <div className="text-xs font-mono text-paper/35">
            © {new Date().getFullYear()}
          </div>
        </div>
      </footer>
    </main>
  );
}
