import { Surface, Column } from '../components/Surface';
import { AppShell } from '../components/AppShell';
import { Eyebrow, Display, Body, Caption, Rule } from '../components/Type';

const milestones = [
  { date: '1 Jan 2026', label: 'Started writing again', note: 'Resumed the practice after the year of silence.' },
  { date: '15 Mar 2026', label: 'Founded the family thread', note: 'The first entry; the dedication; the seven members.' },
  { date: '1 May 2026', label: '24th entry', note: 'Crossed into the second handful.' },
];

export function Milestones() {
  return (
    <Surface>
      <AppShell>
        <header className="border-b border-edge">
          <Column width="header" className="py-14">
            <Eyebrow className="mb-5">Milestones</Eyebrow>
            <Display size={2}>What you've marked.</Display>
            <Body className="mt-6 max-w-[60ch] text-char">
              Personal landmarks worth keeping a record of. Less formal than life events; more
              your own.
            </Body>
          </Column>
        </header>
        <Column width="reading" className="py-14">
          <ul className="divide-y divide-edge">
            {milestones.map((m, i) => (
              <li key={i} className="py-7">
                <Caption className="not-italic font-v3mono text-[0.6875rem] tracking-[0.28em] uppercase text-mark mb-1.5">{m.date}</Caption>
                <h3 className="font-news text-[1.375rem] leading-[1.25] mb-2">{m.label}</h3>
                <Caption>{m.note}</Caption>
              </li>
            ))}
          </ul>
          <Rule className="my-10" />
          <Caption>To record a new milestone, add an entry to the thread tagged with type "milestone".</Caption>
        </Column>
      </AppShell>
    </Surface>
  );
}
