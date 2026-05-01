import { Link } from 'react-router-dom';
import { Surface, Column } from '../components/Surface';
import { MarketingNav } from '../components/MarketingNav';
import { Eyebrow, Display, Body, ReadingBody, Rule, Caption } from '../components/Type';
import { LinkV3 } from '../components/Button';

/**
 * v3 Landing.
 *
 * Composition:
 *   - Marketing nav (text-only, hairline-bottom)
 *   - Hero: a single confident headline, on a 920px header column
 *   - Body: 640px reading column, set as a short editorial
 *   - Three pillars, each as a numbered note (no card chrome)
 *   - The promise (continuity beyond company), set as a callout
 *   - Pricing — three plans, one row, no border ornament
 *   - Footer with a single colophon
 *
 * No backgrounds. No animations. No "ethereal" anything.
 */
export function Landing() {
  return (
    <Surface>
      <MarketingNav />

      {/* Hero */}
      <header className="border-b border-edge">
        <Column width="header" className="pt-24 md:pt-32 pb-20 md:pb-28">
          <Eyebrow className="mb-7">A perpetual family thread · est. 2026</Eyebrow>
          <Display size={1}>
            Write today. Lock entries for descendants who don't&nbsp;exist yet.
          </Display>
          <Body className="mt-10 max-w-[560px] text-char">
            Heirloom is an append-only archive built on a generational scale. Members across
            generations can read and add entries; nothing already written is ever silently changed
            or deleted. The thread continues after you, after us, after the company.
          </Body>
          <div className="mt-12 flex items-center gap-8">
            <LinkV3 to="/v3/signup" variant="primary">
              Start your thread
            </LinkV3>
            <LinkV3 to="/v3/founder" variant="link">
              Become a founder ($999, lifetime)
            </LinkV3>
          </div>
        </Column>
      </header>

      {/* Editorial preamble */}
      <section>
        <Column className="pt-24 pb-10">
          <Eyebrow className="mb-6">What this is</Eyebrow>
          <ReadingBody>
            Most products that promise “your legacy” are timelines, photo books, and dashboards.
            They turn family memory into a feed. Heirloom is something else: a family ledger, set
            on a thousand-year clock, written for readers who are not in the room — and who, in
            many cases, do not yet exist.
          </ReadingBody>
        </Column>
      </section>

      {/* Three pillars — numbered marginalia */}
      <section>
        <Column width="wide" className="pb-24">
          <Rule className="mb-12" />
          <ol className="space-y-12">
            {[
              {
                n: '01',
                title: 'Append-only',
                body: 'Entries become immutable thirty days after they are written. Amendments are recorded as new entries — what was true once is preserved, not rewritten. The record outlives revisions.',
              },
              {
                n: '02',
                title: 'Time-locked',
                body: 'Lock an entry until a date, an age, an event, or a generation. Write to the granddaughter who turns eighteen in 2057. The lock is honored; the writing is preserved; the moment of opening is real.',
              },
              {
                n: '03',
                title: 'Multi-generational by design',
                body: 'Thread members include placeholders — descendants not yet born. As they reach configured ages, their access promotes. The archive grows alongside the bloodline.',
              },
              {
                n: '04',
                title: 'Continuity beyond the company',
                body: 'Every thread is mirrored to public IPFS providers on a weekly schedule. Founder-tier funds seed the successor non-profit. If Heirloom shuts down, the threads survive. We operate in the open and the proof is filed publicly.',
              },
            ].map((p) => (
              <li key={p.n} className="grid md:grid-cols-[6rem_1fr] gap-x-8 gap-y-3">
                <span className="font-v3mono text-[0.75rem] tracking-[0.28em] uppercase text-mark">{p.n}</span>
                <div>
                  <h2 className="font-news text-[1.625rem] leading-[1.2] tracking-[-0.012em] text-ink mb-2">
                    {p.title}
                  </h2>
                  <p className="font-news text-[1.0625rem] leading-[1.65] text-char max-w-[58ch]">
                    {p.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Column>
      </section>

      {/* The promise — a callout set as a quotation */}
      <section className="bg-bone-2 border-y border-edge">
        <Column width="wide" className="py-20 md:py-24">
          <p
            className="font-news font-light italic text-[clamp(1.625rem,3vw,2.25rem)] leading-[1.35] text-ink max-w-[34ch]"
            style={{ textWrap: 'balance' }}
          >
            “We are building a record that is not contingent on the survival of the company that
            keeps it. The product is the page; the page outlasts the printer.”
          </p>
          <Caption className="mt-6">— from the continuity charter, filed publicly with the successor non-profit at incorporation.</Caption>
        </Column>
      </section>

      {/* Pricing — three columns, one rule between them, no chrome */}
      <section>
        <Column width="wide" className="py-24">
          <Eyebrow className="mb-8">Plans</Eyebrow>
          <div className="grid md:grid-cols-3">
            {[
              {
                price: 'Free',
                name: 'Reader',
                line: 'Read and contribute to threads you are invited to. No new threads, no time-locks, no founder rights.',
                cta: { to: '/v3/signup', label: 'Read for free' },
              },
              {
                price: '$15 / month',
                name: 'Family',
                line: 'Start your own thread. Invite family, set time-locks, designate successors. The standard plan.',
                cta: { to: '/v3/signup', label: 'Start your thread' },
              },
              {
                price: '$999 once',
                name: 'Founder · first 100',
                line: 'Lifetime Family-tier access for your bloodline. Your name engraved in the public continuity record. Funds the successor non-profit.',
                cta: { to: '/v3/founder', label: 'Become a founder' },
              },
            ].map((p, i) => (
              <div
                key={p.name}
                className={`p-6 md:p-8 ${i > 0 ? 'md:border-l border-edge md:pl-10' : ''} ${i < 2 ? 'border-b md:border-b-0' : ''}`}
              >
                <Caption>{p.price}</Caption>
                <h3 className="font-news text-[1.5rem] leading-[1.2] mt-2 mb-3 text-ink">{p.name}</h3>
                <p className="font-news text-[1rem] leading-[1.6] text-char mb-7 max-w-[34ch]">{p.line}</p>
                <Link
                  to={p.cta.to}
                  className="font-news text-mark hover:text-mark-deep underline underline-offset-[3px] decoration-1 decoration-mark/40 hover:decoration-mark transition-colors"
                >
                  {p.cta.label} →
                </Link>
              </div>
            ))}
          </div>
        </Column>
      </section>

      {/* Footer */}
      <footer className="border-t border-edge">
        <Column width="wide" className="py-10">
          <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-4">
            <p className="font-v3mono text-[0.7rem] tracking-[0.34em] uppercase text-char">Heirloom · 2026</p>
            <div className="flex flex-wrap gap-6 text-sm text-char">
              <Link to="/v3/founder" className="hover:text-mark transition-colors">Founder</Link>
              <Link to="/v3/archive" className="hover:text-mark transition-colors">Archive audit</Link>
              <Link to="/privacy" className="hover:text-mark transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-mark transition-colors">Terms</Link>
              <Link to="/v3/sitemap" className="hover:text-mark transition-colors">All surfaces</Link>
            </div>
          </div>
        </Column>
      </footer>
    </Surface>
  );
}
