import { Link } from 'react-router-dom';
import { Surface, Column } from '../components/Surface';
import { AppShell } from '../components/AppShell';
import { Eyebrow, Display, Body, Caption, Rule } from '../components/Type';

const cards = [
  { id: '1', quote: 'Anything else is for company.', source: 'Nan, on her biscuits — written 1 May 2026' },
  { id: '2', quote: 'A story is not really yours if it ends with you.', source: 'Aunt Nadia, 12 Mar 2023' },
];

export function Cards() {
  return (
    <Surface>
      <AppShell>
        <header className="border-b border-edge">
          <Column width="header" className="py-14">
            <Eyebrow className="mb-5">Memory cards</Eyebrow>
            <Display size={2}>Postcards from the thread.</Display>
            <Body className="mt-6 max-w-[60ch] text-char">
              A single sentence from an entry, set in display type and printable. For the wall, the
              fridge, the inside cover of a book. No hashtags. No share buttons.
            </Body>
          </Column>
        </header>
        <Column width="header" className="py-12">
          <div className="grid md:grid-cols-2 gap-10">
            {cards.map((c) => (
              <article key={c.id} className="aspect-[4/3] border border-edge bg-bone-2 p-10 flex flex-col">
                <p
                  className="font-news font-light italic text-[clamp(1.25rem,2.4vw,1.875rem)] leading-[1.35] text-ink"
                  style={{ textWrap: 'balance' }}
                >
                  “{c.quote}”
                </p>
                <div className="mt-auto pt-8 border-t border-edge">
                  <Caption className="not-italic font-v3mono text-[0.6875rem] tracking-[0.28em] uppercase text-mark">{c.source}</Caption>
                </div>
              </article>
            ))}
          </div>
          <Rule className="my-12" />
          <Link to="/v3/cards/new" className="font-news text-mark hover:text-mark-deep underline underline-offset-[3px] decoration-1 decoration-mark/40 hover:decoration-mark transition-colors">
            Make a new card from a thread entry →
          </Link>
        </Column>
      </AppShell>
    </Surface>
  );
}
