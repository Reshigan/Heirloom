import { Link } from 'react-router-dom';
import { Surface, Column } from '../components/Surface';
import { AppShell } from '../components/AppShell';
import { Eyebrow, Display, Body, Caption, Rule } from '../components/Type';

const sample = [
  { id: '1', name: 'The Govender family', dedication: 'For the ones we know, and the ones who will know us.', members: 7, entries: 24, role: 'Founder' },
  { id: '2', name: 'The Mahmood line', dedication: 'For the cousins we never met.', members: 12, entries: 51, role: 'Author' },
  { id: '3', name: 'A chosen family', dedication: 'The friends we made our family.', members: 5, entries: 9, role: 'Reader' },
];

export function Threads() {
  return (
    <Surface>
      <AppShell>
        <header className="border-b border-edge">
          <Column width="header" className="py-14">
            <Eyebrow className="mb-5">Threads</Eyebrow>
            <Display size={2}>The threads you belong to.</Display>
            <Body className="mt-6 max-w-[60ch] text-char">
              Most people only need one. Some families keep separate threads — for in-laws, for
              chosen family, for branches that became their own.
            </Body>
          </Column>
        </header>
        <Column width="header" className="py-12">
          <ul className="divide-y divide-edge">
            {sample.map((t) => (
              <li key={t.id} className="py-7">
                <Link to="/v3/thread" className="block group">
                  <div className="flex items-baseline justify-between gap-6 mb-2">
                    <h2 className="font-news text-[1.5rem] leading-[1.25] text-ink group-hover:text-mark transition-colors">
                      {t.name}
                    </h2>
                    <Caption className="not-italic font-v3mono text-[0.6875rem] tracking-[0.28em] uppercase text-mark shrink-0">
                      {t.role.toLowerCase()}
                    </Caption>
                  </div>
                  <Caption className="mb-3">{t.dedication}</Caption>
                  <Caption className="not-italic font-v3mono text-[0.75rem] tracking-[0.18em] uppercase text-char">
                    {t.entries} entries · {t.members} members
                  </Caption>
                </Link>
              </li>
            ))}
          </ul>
          <Rule className="my-12" />
          <Link
            to="/v3/threads/new"
            className="font-news text-mark hover:text-mark-deep underline underline-offset-[3px] decoration-1 decoration-mark/40 hover:decoration-mark transition-colors"
          >
            Begin a new thread →
          </Link>
        </Column>
      </AppShell>
    </Surface>
  );
}
