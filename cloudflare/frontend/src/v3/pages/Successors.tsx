import { Link } from 'react-router-dom';
import { Surface, Column } from '../components/Surface';
import { AppShell } from '../components/AppShell';
import { Eyebrow, Display, ReadingBody, Caption, Rule } from '../components/Type';

const chain = [
  { rank: 1, name: 'Faiza Govender', relation: 'Sister', designated: '14 Mar 2026' },
  { rank: 2, name: 'Aunt Nadia', relation: 'Father’s sister', designated: '14 Mar 2026' },
  { rank: 3, name: 'Aaliyah Govender', relation: 'Daughter', designated: '14 Mar 2026 — pending age 18 in 2042' },
];

export function Successors() {
  return (
    <Surface>
      <AppShell>
        <header className="border-b border-edge">
          <Column width="header" className="py-14">
            <Eyebrow className="mb-5">Successors</Eyebrow>
            <Display size={2}>The line of inheritance.</Display>
          </Column>
        </header>
        <Column width="reading" className="py-12">
          <ReadingBody className="text-char">
            If you step away or die, the highest-ranked active successor takes founder rights —
            keeping the thread going without breaking continuity. Founders are succeeded; never
            removed. Designations are append-only and audited.
          </ReadingBody>
          <Rule className="my-12" />
          <ol className="space-y-8">
            {chain.map((s) => (
              <li key={s.rank} className="grid grid-cols-[3rem_1fr_auto] gap-6 items-baseline">
                <span className="font-v3mono text-[0.875rem] tracking-[0.18em] text-mark">#{String(s.rank).padStart(2, '0')}</span>
                <div>
                  <p className="font-news text-[1.25rem] leading-[1.25] text-ink">{s.name}</p>
                  <Caption>{s.relation}</Caption>
                </div>
                <Caption className="not-italic font-v3mono text-[0.6875rem] tracking-[0.28em] uppercase text-char">
                  designated {s.designated}
                </Caption>
              </li>
            ))}
          </ol>
          <Rule className="mt-12 mb-8" />
          <Link to="/v3/family" className="font-news text-mark hover:text-mark-deep underline underline-offset-[3px] decoration-1 decoration-mark/40 hover:decoration-mark transition-colors">
            Designate another successor from family →
          </Link>
        </Column>
      </AppShell>
    </Surface>
  );
}
