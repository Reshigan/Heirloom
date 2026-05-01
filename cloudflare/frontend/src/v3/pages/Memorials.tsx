import { Link } from 'react-router-dom';
import { Surface, Column } from '../components/Surface';
import { AppShell } from '../components/AppShell';
import { Eyebrow, Display, Body, ReadingBody, Caption, Rule } from '../components/Type';

const memorials = [
  {
    id: '1',
    name: 'Pranesh Govender',
    dates: '1947 — 2009',
    relation: 'My father',
    epitaph: 'He kept the press alive longer than the trade was kind to. He kept us together longer than we deserved.',
  },
];

export function Memorials() {
  return (
    <Surface>
      <AppShell>
        <header className="border-b border-edge">
          <Column width="header" className="py-14">
            <Eyebrow className="mb-5">Memorials</Eyebrow>
            <Display size={2}>For the ones who came before.</Display>
            <Body className="mt-6 max-w-[60ch] text-char">
              A page for each member of the thread who has died. The thread continues; their
              entries remain attributed; what they wrote is what they wrote.
            </Body>
          </Column>
        </header>
        <Column width="reading" className="py-14">
          {memorials.map((m, i) => (
            <article key={m.id} className={i > 0 ? 'mt-16' : ''}>
              <Caption className="not-italic font-v3mono text-[0.6875rem] tracking-[0.28em] uppercase text-mark mb-3">
                In memoriam · {m.dates}
              </Caption>
              <Display size={3}>{m.name}</Display>
              <Caption className="mt-3">{m.relation}</Caption>
              <Rule className="my-8" />
              <ReadingBody className="italic">"{m.epitaph}"</ReadingBody>
              <Rule className="my-8" />
              <Link
                to="/v3/thread"
                className="font-news text-mark hover:text-mark-deep underline underline-offset-[3px] decoration-1 decoration-mark/40 hover:decoration-mark transition-colors"
              >
                Read the entries he wrote, and the entries written about him →
              </Link>
            </article>
          ))}
        </Column>
      </AppShell>
    </Surface>
  );
}
