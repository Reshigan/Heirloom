import { Link } from 'react-router-dom';
import { Surface, Column } from '../components/Surface';
import { Eyebrow, Display, Body, Rule, Caption } from '../components/Type';

/**
 * /v3/sitemap — the prototype index. Lists every surface in the
 * redesigned tree with a one-line description, so the design can be
 * reviewed end-to-end without having to memorize routes.
 *
 * The order matches DESIGN.md: marketing → reading → writing → people
 * → records → send → reflect → account.
 */
const sections: {
  title: string;
  description: string;
  rows: { to: string; label: string; note: string }[];
}[] = [
  {
    title: 'Public',
    description: 'Everything visible without an account.',
    rows: [
      { to: '/v3', label: 'Landing', note: 'The entry. One column, one accent, no fanfare.' },
      { to: '/v3/founder', label: 'Founder pledge', note: '$999 lifetime, first 100 — the seed of the successor non-profit.' },
      { to: '/v3/founder/welcome', label: 'Founder welcome', note: 'Post-checkout: your number, your name in the record.' },
      { to: '/v3/login', label: 'Sign in', note: 'Email + password. Quiet, single column.' },
      { to: '/v3/signup', label: 'Create account', note: 'Just enough to start a thread.' },
    ],
  },
  {
    title: 'Read',
    description: 'The primary mode. Everything in the thread, organized by who and when.',
    rows: [
      { to: '/v3/home', label: 'Today', note: 'A still home page — not a dashboard. What’s newly written, what’s about to open.' },
      { to: '/v3/thread', label: 'The thread', note: 'The single canonical reading view. Era-grouped, hairline-divided.' },
      { to: '/v3/threads', label: 'All threads', note: 'For families with more than one (in-laws, chosen family, branches).' },
      { to: '/v3/memories', label: 'Memories', note: 'The legacy memories index — preserved, surfaced inside the thread.' },
      { to: '/v3/letters', label: 'Letters', note: 'Sealed entries waiting on dates.' },
      { to: '/v3/voice', label: 'Voice', note: 'Recordings and their transcripts.' },
      { to: '/v3/feed', label: 'Family feed', note: 'Recent activity from across all members.' },
      { to: '/v3/onthisday', label: 'On this day', note: 'A daily ritual surface.' },
    ],
  },
  {
    title: 'Write',
    description: 'Discrete acts of writing. Reached intentionally, not on every screen.',
    rows: [
      { to: '/v3/write', label: 'New entry', note: 'Compose to a thread, with the four lock types.' },
      { to: '/v3/record', label: 'Record voice', note: 'A microphone and a transcript field. That is the whole UI.' },
      { to: '/v3/letter', label: 'Write a letter', note: 'A long-form composer with sealing.' },
      { to: '/v3/capsule', label: 'Time capsule', note: 'A container with a single unlock date.' },
    ],
  },
  {
    title: 'People',
    description: 'Your family thread, your succession plan.',
    rows: [
      { to: '/v3/family', label: 'Family', note: 'Members of the thread — living, deceased, and not-yet-born placeholders.' },
      { to: '/v3/successors', label: 'Successors', note: 'The ranked chain of inheritance for this thread.' },
    ],
  },
  {
    title: 'Records',
    description: 'Structured artifacts derived from the thread.',
    rows: [
      { to: '/v3/lifeevents', label: 'Life events', note: 'Milestone-based unlocks and reminders.' },
      { to: '/v3/milestones', label: 'Milestones', note: 'Personal landmarks worth marking.' },
      { to: '/v3/memorials', label: 'Memorials', note: 'Pages dedicated to deceased members.' },
      { to: '/v3/artifacts', label: 'Story artifacts', note: 'Compiled mini-essays from your entries.' },
      { to: '/v3/book', label: 'Living book', note: 'Print the thread as a hardback.' },
    ],
  },
  {
    title: 'Send',
    description: 'Make something from the thread leave the thread.',
    rows: [
      { to: '/v3/gift', label: 'Gift a memory', note: 'Send a single entry to someone outside the thread.' },
      { to: '/v3/cards', label: 'Memory cards', note: 'Postcard-format shareables (no hashtags).' },
      { to: '/v3/recipient', label: 'Recipient experience', note: 'What it looks like when someone receives an inheritance.' },
    ],
  },
  {
    title: 'Reflect',
    description: 'Tools that look back at what is already written.',
    rows: [
      { to: '/v3/plan', label: 'Thread plan', note: 'A guided checklist of what to write next.' },
      { to: '/v3/streaks', label: 'Streaks', note: 'Lightly. We are not Duolingo.' },
      { to: '/v3/wrapped', label: 'Wrapped', note: 'Annual review. Print-ready.' },
      { to: '/v3/future', label: 'Future letter', note: 'Write to the version of you who will read this in 30 years.' },
    ],
  },
  {
    title: 'Account',
    description: 'Settings, money, the audit.',
    rows: [
      { to: '/v3/settings', label: 'Settings', note: 'Profile, encryption, succession, deadman, support.' },
      { to: '/v3/billing', label: 'Billing', note: 'Subscription state and the upgrade path.' },
      { to: '/v3/archive', label: 'Archive audit', note: 'The public IPFS pin status — proof of continuity.' },
    ],
  },
];

export function Sitemap() {
  return (
    <Surface>
      <header className="border-b border-edge">
        <Column width="header" className="py-12">
          <Eyebrow className="mb-5">v3 prototype · all surfaces</Eyebrow>
          <Display size={2}>Heirloom, redesigned.</Display>
          <Body className="mt-7 max-w-prose text-char">
            Every capability the product has, set on a single design system. Light-mode-first,
            single-column, three faces of type, one accent, hairline rules in place of cards. See
            the <Link to="/v3/design" className="text-mark underline underline-offset-[3px] decoration-1 decoration-mark/40 hover:decoration-mark">design spec</Link> for the rationale, or step through the surfaces below in
            the order a real visitor would encounter them.
          </Body>
        </Column>
      </header>

      <Column width="header" className="py-14 space-y-16">
        {sections.map((section, idx) => (
          <section key={section.title}>
            <div className="flex items-baseline justify-between gap-6 mb-5">
              <Eyebrow>0{idx + 1} · {section.title}</Eyebrow>
              <Caption className="hidden md:block">{section.description}</Caption>
            </div>
            <Caption className="md:hidden mb-4">{section.description}</Caption>
            <Rule className="mb-6" />
            <ul className="divide-y divide-edge">
              {section.rows.map((row) => (
                <li key={row.to} className="py-4">
                  <Link to={row.to} className="block group">
                    <div className="flex items-baseline justify-between gap-6">
                      <span className="font-news text-[1.125rem] text-ink group-hover:text-mark transition-colors">
                        {row.label}
                      </span>
                      <span className="font-v3mono text-[0.75rem] tracking-[0.18em] uppercase text-char shrink-0">
                        {row.to}
                      </span>
                    </div>
                    <p className="font-news italic text-[0.9375rem] text-char mt-1.5">{row.note}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <Rule />
        <p className="font-news italic text-char text-center">
          A reference deck. Send it to a designer with{' '}
          <Link to="/v3/design" className="text-mark underline underline-offset-[3px] decoration-1 decoration-mark/40 hover:decoration-mark">
            DESIGN.md
          </Link>
          .
        </p>
      </Column>
    </Surface>
  );
}
