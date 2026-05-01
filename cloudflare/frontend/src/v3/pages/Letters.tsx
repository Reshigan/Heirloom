import { Link } from 'react-router-dom';
import { Surface, Column } from '../components/Surface';
import { AppShell } from '../components/AppShell';
import { Eyebrow, Display, Body, Caption, Rule } from '../components/Type';

const letters = [
  { id: '1', to: 'Aaliyah, on her 18th', opens: '9 March 2042', sealed: true, snippet: 'Sealed. Will open on her birthday in 2042.' },
  { id: '2', to: 'My father, twenty years on', opens: 'Opened 14 Aug 2024', sealed: false, snippet: 'A letter to my father, sealed for twenty years and opened on the anniversary of his passing. Read by all members of the thread.' },
  { id: '3', to: 'For everyone in 2076', opens: '12 June 2076', sealed: true, snippet: 'Sealed. Will open on the 50th anniversary of the Govender / Mahmood marriage.' },
];

export function Letters() {
  return (
    <Surface>
      <AppShell>
        <header className="border-b border-edge">
          <Column width="header" className="py-14">
            <Eyebrow className="mb-5">Letters</Eyebrow>
            <Display size={2}>Sealed entries waiting on dates.</Display>
            <Body className="mt-6 max-w-[60ch] text-char">
              Letters are entries with a future open. The body is encrypted at rest; the recipient
              and the date are public; the rest opens when the lock resolves.
            </Body>
          </Column>
        </header>
        <Column width="header" className="py-12">
          <ul className="divide-y divide-edge">
            {letters.map((l) => (
              <li key={l.id} className="py-7">
                <Link to="/v3/thread" className="grid md:grid-cols-[200px_1fr] gap-3 md:gap-10 group">
                  <div>
                    <Caption className="not-italic font-v3mono text-[0.6875rem] tracking-[0.28em] uppercase text-mark mb-1">
                      {l.sealed ? 'Sealed' : 'Opened'}
                    </Caption>
                    <Caption>{l.opens}</Caption>
                  </div>
                  <div>
                    <h3 className="font-news text-[1.375rem] leading-[1.25] text-ink mb-1.5 group-hover:text-mark transition-colors">
                      {l.sealed ? <span className="text-mark mr-2" aria-hidden>◉</span> : null}
                      {l.to}
                    </h3>
                    <p className="font-news text-[1.0625rem] leading-[1.65] text-char max-w-[58ch]">{l.snippet}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <Rule className="my-12" />
          <Link to="/v3/letter" className="font-news text-mark hover:text-mark-deep underline underline-offset-[3px] decoration-1 decoration-mark/40 hover:decoration-mark transition-colors">
            Write a letter →
          </Link>
        </Column>
      </AppShell>
    </Surface>
  );
}
