import { Link } from 'react-router-dom';
import { Surface, Column } from '../components/Surface';
import { AppShell } from '../components/AppShell';
import { Eyebrow, Display, ReadingBody, Caption, Rule } from '../components/Type';

/**
 * /v3/thread — the canonical reading view.
 *
 * Era-grouped, single column, hairline rules. The way a private edition
 * of a family book might be set: each era has a small caps header, each
 * entry has a date, an author, and prose. Long entries get pull-quotes;
 * voice entries surface their transcript with an audio token.
 *
 * No avatars. No icons (except a single ◉ before sealed entries that
 * have just opened).
 */

interface Entry {
  id: string;
  era: string;
  date: string;
  author: string;
  title: string;
  body: string[];
  kind?: 'voice' | 'photo' | 'letter';
  pullquote?: string;
  newlyOpened?: boolean;
  lock?: { type: 'AGE' | 'DATE' | 'EVENT' | 'GENERATION'; description: string };
}

const eras: { name: string; entries: Entry[] }[] = [
  {
    name: 'Now · 2026',
    entries: [
      {
        id: '1',
        era: '2026',
        date: '1 May 2026',
        author: 'Reshigan',
        title: 'On Saturday mornings.',
        body: [
          'Nan would lay the dough out and let me press it down with my palms. The kitchen smelled of nutmeg and butter, and the radio played the same Hindi serial every week — the one she pretended to dislike but always knew the names of.',
          'She let me think I was helping. The biscuits would come out lopsided and I would arrange them on the rack like medals. We ate the broken ones first; “anything else,” she said, “is for company.”',
        ],
        pullquote: 'Anything else is for company.',
      },
      {
        id: '2',
        era: '2026',
        date: '30 April 2026',
        author: 'Faiza',
        title: 'A clipping I found in a drawer.',
        body: [
          'Mum had pinned this article to the inside of the cabinet — the one about Dad’s factory. The paper is brown now, but the headline still reads "Local employer recognized for steady work in a difficult year." She had circled his name in pencil. I did not know she had done that.',
        ],
        kind: 'photo',
      },
    ],
  },
  {
    name: '2024 — 2020',
    entries: [
      {
        id: '3',
        era: '2023',
        date: '12 March 2023',
        author: 'Aunt Nadia',
        title: 'Why we left Lahore in 1971.',
        body: [
          'I have not written this down before. Your grandfather did not want us to. But the people who need to know are now old enough, and he has been gone for fifteen years, and a story is not really yours if it ends with you.',
          'The week after the second hartal, your grandfather sold the press. He did not tell us until after. We had three days to pack. The men at the gate took the radio and one of the suitcases; the other we carried between us on the train.',
        ],
      },
      {
        id: '4',
        era: '2021',
        date: '8 November 2021',
        author: 'Reshigan',
        title: 'Voice note · The Sunday call.',
        body: [
          'A short voice memo I recorded after our weekly call. Mum reading the news to me, the way she always did, even after I had read it.',
        ],
        kind: 'voice',
      },
    ],
  },
  {
    name: 'Sealed · waiting',
    entries: [
      {
        id: '5',
        era: '—',
        date: 'Opens 9 March 2042',
        author: 'For Aaliyah',
        title: 'A letter from your mother.',
        body: [
          'Sealed. Will open on Aaliyah’s 18th birthday — 9 March 2042. Until then, only the existence of this entry is visible; the body is encrypted.',
        ],
        lock: { type: 'AGE', description: 'opens at age 18' },
      },
      {
        id: '6',
        era: '—',
        date: 'Opens 12 June 2076',
        author: 'For everyone in the thread',
        title: 'The unsealed correspondence between your grandparents.',
        body: [
          'Sealed. Will open on the 50th anniversary — 12 June 2076. Compiled from the letters they wrote each other in 1968-1971; submitted to the thread by their daughter in 2026.',
        ],
        lock: { type: 'EVENT', description: '50th anniversary' },
      },
    ],
  },
];

export function Thread() {
  return (
    <Surface>
      <AppShell>
        {/* Thread header — wide column, dedication set as marginalia */}
        <header className="border-b border-edge">
          <Column width="header" className="py-14">
            <Eyebrow className="mb-5">Thread · The Govender family</Eyebrow>
            <Display size={2}>For the ones we know, and the ones who will know us.</Display>
            <Caption className="mt-7 max-w-[60ch]">
              Founded by Reshigan Govender on 14 March 2026 · 7 active members · 2 placeholders
              for descendants not yet of age · 24 entries · 2 sealed entries waiting on dates.
            </Caption>
            <div className="mt-8 flex flex-wrap gap-x-7 gap-y-3 items-baseline">
              <Link
                to="/v3/write"
                className="font-news text-mark hover:text-mark-deep underline underline-offset-[3px] decoration-1 decoration-mark/40 hover:decoration-mark transition-colors"
              >
                Add an entry →
              </Link>
              <Link
                to="/v3/family"
                className="font-news text-char hover:text-mark transition-colors"
              >
                Members
              </Link>
              <Link
                to="/v3/successors"
                className="font-news text-char hover:text-mark transition-colors"
              >
                Successors
              </Link>
              <Link
                to="/v3/book"
                className="font-news text-char hover:text-mark transition-colors"
              >
                Print as a living book
              </Link>
            </div>
          </Column>
        </header>

        {/* Reading column */}
        <Column width="reading" className="py-16">
          {eras.map((era, eraIdx) => (
            <section key={era.name} className={eraIdx > 0 ? 'mt-20' : ''}>
              <div className="flex items-baseline gap-4 mb-10">
                <Eyebrow>{era.name}</Eyebrow>
                <Rule className="flex-1" />
              </div>
              <div className="space-y-16">
                {era.entries.map((entry) => (
                  <article key={entry.id} className="relative">
                    <header className="mb-5">
                      <div className="flex items-baseline justify-between gap-4 mb-2">
                        <Caption className="not-italic font-v3mono text-[0.6875rem] tracking-[0.28em] uppercase text-char">
                          {entry.date}
                        </Caption>
                        <Caption className="not-italic font-v3mono text-[0.6875rem] tracking-[0.28em] uppercase text-char">
                          {entry.author}
                        </Caption>
                      </div>
                      <h2 className="font-news text-[1.875rem] leading-[1.2] tracking-[-0.012em] text-ink">
                        {entry.lock ? <span className="text-mark mr-2" aria-hidden>◉</span> : null}
                        {entry.title}
                      </h2>
                    </header>

                    {entry.kind === 'voice' ? (
                      <div className="border-l-2 border-mark pl-5 py-3 mb-6 bg-bone-2/40">
                        <Caption className="not-italic font-v3mono text-[0.6875rem] tracking-[0.28em] uppercase text-mark mb-2">
                          Voice · 4 min 12 sec
                        </Caption>
                        <p className="font-news italic text-[1.0625rem] leading-[1.65] text-char">
                          {entry.body[0]}
                        </p>
                      </div>
                    ) : null}

                    {entry.kind !== 'voice' && entry.body.map((para, i) => (
                      <ReadingBody key={i} className={i > 0 ? 'mt-5' : ''}>
                        {para}
                      </ReadingBody>
                    ))}

                    {entry.pullquote ? (
                      <blockquote className="my-10 pl-7 border-l border-mark/60">
                        <p className="font-news italic text-[1.5rem] leading-[1.4] text-ink max-w-[40ch]">
                          {entry.pullquote}
                        </p>
                      </blockquote>
                    ) : null}

                    {entry.lock ? (
                      <Caption className="mt-5">
                        Lock type: {entry.lock.type.toLowerCase()} · {entry.lock.description}.
                      </Caption>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
          ))}
        </Column>
      </AppShell>
    </Surface>
  );
}
