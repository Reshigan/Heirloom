import { Surface, Column } from '../components/Surface';
import { AppShell } from '../components/AppShell';
import { Eyebrow, Display, Body, Caption } from '../components/Type';

const events = [
  { when: 'b. 1981', who: 'Reshigan', what: 'Born — Durban' },
  { when: '1999', who: 'Reshigan', what: 'Left for university in Cape Town' },
  { when: '2007', who: 'Pranesh (father)', what: 'Closed the family factory' },
  { when: '2009', who: 'Pranesh', what: 'In memoriam' },
  { when: '2024', who: 'Aaliyah', what: 'Born — your daughter' },
];

export function LifeEvents() {
  return (
    <Surface>
      <AppShell>
        <header className="border-b border-edge">
          <Column width="header" className="py-14">
            <Eyebrow className="mb-5">Life events</Eyebrow>
            <Display size={2}>The dates worth knowing.</Display>
            <Body className="mt-6 max-w-[60ch] text-char">
              Birth, marriage, departure, return. The milestones the thread orients itself
              against. New entries can be tied to these events; locks can wait for them.
            </Body>
          </Column>
        </header>
        <Column width="header" className="py-12">
          <ol className="divide-y divide-edge">
            {events.map((e, i) => (
              <li key={i} className="py-6 grid md:grid-cols-[160px_180px_1fr] gap-3 md:gap-10 items-baseline">
                <Caption className="not-italic font-v3mono text-[0.6875rem] tracking-[0.28em] uppercase text-mark">{e.when}</Caption>
                <Caption>{e.who}</Caption>
                <p className="font-news text-[1.0625rem] text-ink">{e.what}</p>
              </li>
            ))}
          </ol>
        </Column>
      </AppShell>
    </Surface>
  );
}
