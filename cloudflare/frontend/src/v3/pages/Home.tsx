import { Link } from 'react-router-dom';
import { Surface, Column } from '../components/Surface';
import { AppShell } from '../components/AppShell';
import { Eyebrow, Display, Body, Caption, Rule } from '../components/Type';

/**
 * /v3/home — "Today."
 *
 * A still page. Not a dashboard. The premise: if you only ever opened
 * Heirloom once a week, this is what you'd want to see — what is newly
 * written in your thread, what is about to open, what is still
 * waiting on you.
 *
 * No widgets. No counters. No charts. Reading-column-first.
 */

const sampleNew = [
  {
    when: 'Today',
    by: 'Reshigan',
    title: 'On Saturday mornings.',
    snippet:
      'Nan would lay the dough out and let me press it down with my palms. The kitchen smelled of nutmeg and butter, and the radio played the same…',
  },
  {
    when: 'Yesterday',
    by: 'Faiza (sister)',
    title: 'A clipping I found in a drawer.',
    snippet:
      'Mum had pinned this article to the inside of the cabinet — the one about Dad’s factory. The paper is brown now, but the headline still…',
  },
  {
    when: '2 days ago',
    by: 'Aunt Nadia',
    title: 'Why we left Lahore in 1971.',
    snippet:
      'I have not written this down before. Your grandfather did not want us to. But the people who need to know are now old enough…',
  },
];

const sampleUpcoming = [
  { who: 'For Aaliyah', when: 'on her 18th birthday — 9 March 2042', what: 'A letter from your mother.' },
  { who: 'For everyone in the thread', when: 'on the 50th anniversary — 12 June 2076', what: 'The full unsealed correspondence between your grandparents.' },
];

export function Home() {
  return (
    <Surface>
      <AppShell>
        <Column width="header" className="pt-12 md:pt-16 pb-10">
          <Eyebrow className="mb-5">Today · 1 May 2026</Eyebrow>
          <Display size={2}>Welcome back, Reshigan.</Display>
          <Body className="mt-7 max-w-[58ch] text-char">
            Three new entries since you were last here. Two locks open in the next decade. The
            thread is yours to read; whatever you write today will be there for them.
          </Body>
        </Column>

        <Rule />

        <Column width="header" className="py-12">
          <div className="flex items-baseline justify-between mb-7">
            <Eyebrow>Newly written</Eyebrow>
            <Link
              to="/v3/thread"
              className="font-news text-mark hover:text-mark-deep underline underline-offset-[3px] decoration-1 decoration-mark/40 hover:decoration-mark transition-colors text-[0.95rem]"
            >
              Read the thread →
            </Link>
          </div>
          <ul className="divide-y divide-edge">
            {sampleNew.map((e) => (
              <li key={e.title} className="py-7">
                <div className="grid md:grid-cols-[140px_1fr] gap-4 md:gap-10">
                  <div>
                    <Caption className="not-italic font-v3mono text-[0.6875rem] tracking-[0.28em] uppercase text-char mb-1.5">
                      {e.when}
                    </Caption>
                    <Caption>{e.by}</Caption>
                  </div>
                  <div>
                    <h3 className="font-news text-[1.375rem] leading-[1.25] text-ink mb-2">
                      {e.title}
                    </h3>
                    <p className="font-news text-[1.0625rem] leading-[1.65] text-char max-w-[58ch]">
                      {e.snippet}{' '}
                      <Link
                        to="/v3/thread"
                        className="text-mark hover:text-mark-deep underline underline-offset-[3px] decoration-1 decoration-mark/40 hover:decoration-mark transition-colors"
                      >
                        Read on →
                      </Link>
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Column>

        <div className="bg-bone-2 border-y border-edge">
          <Column width="header" className="py-14">
            <Eyebrow className="mb-7">Locks opening soon</Eyebrow>
            {sampleUpcoming.length === 0 ? (
              <Body className="text-char italic">No locks open within the visible horizon.</Body>
            ) : (
              <ul className="space-y-7">
                {sampleUpcoming.map((u) => (
                  <li key={u.what} className="grid md:grid-cols-[1fr_2fr] gap-4 md:gap-10">
                    <div>
                      <Caption className="not-italic font-v3mono text-[0.6875rem] tracking-[0.28em] uppercase text-mark mb-1.5">
                        {u.who}
                      </Caption>
                      <Caption>{u.when}</Caption>
                    </div>
                    <p className="font-news text-[1.125rem] leading-[1.5] text-ink">{u.what}</p>
                  </li>
                ))}
              </ul>
            )}
          </Column>
        </div>

        <Column width="header" className="py-14">
          <Eyebrow className="mb-7">Waiting on you</Eyebrow>
          <ul className="space-y-5">
            {[
              { label: 'Your thread plan is at 4 of 12 entries.', to: '/v3/plan' },
              { label: 'Your mother appears in 3 entries but has no profile yet.', to: '/v3/family' },
              { label: 'Your annual review for 2025 is ready to read.', to: '/v3/wrapped' },
            ].map((row) => (
              <li key={row.label}>
                <Link
                  to={row.to}
                  className="font-news text-[1.0625rem] text-ink hover:text-mark transition-colors group"
                >
                  {row.label}{' '}
                  <span className="text-mark/60 group-hover:text-mark transition-colors">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </Column>
      </AppShell>
    </Surface>
  );
}
