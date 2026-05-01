import { Link } from 'react-router-dom';
import { Surface, Column } from '../components/Surface';
import { AppShell } from '../components/AppShell';
import { Eyebrow, Display, Body, Caption, Rule } from '../components/Type';

const members = [
  { id: '1', name: 'Reshigan Govender', relation: 'Founder', role: 'FOUNDER', gen: 0, status: 'active', dates: 'b. 1981' },
  { id: '2', name: 'Faiza Govender', relation: 'Sister', role: 'AUTHOR', gen: 0, status: 'active', dates: 'b. 1979' },
  { id: '3', name: 'Aunt Nadia', relation: 'Father’s sister', role: 'AUTHOR', gen: -1, status: 'active', dates: 'b. 1948' },
  { id: '4', name: 'Mum', relation: 'Mother', role: 'AUTHOR', gen: -1, status: 'active', dates: 'b. 1953' },
  { id: '5', name: 'Aaliyah Govender', relation: 'Daughter', role: 'PLACEHOLDER → AUTHOR at 18', gen: 1, status: 'placeholder', dates: 'b. 2024' },
  { id: '6', name: 'Pranesh Govender', relation: 'Father', role: 'AUTHOR', gen: -1, status: 'deceased', dates: '1947 — 2009' },
];

const groups: Record<string, typeof members> = members.reduce(
  (acc, m) => {
    const k = m.gen === 0 ? 'Your generation' : m.gen < 0 ? 'Earlier generations' : 'Descendants';
    (acc[k] = acc[k] ?? []).push(m);
    return acc;
  },
  {} as Record<string, typeof members>,
);

export function Family() {
  return (
    <Surface>
      <AppShell>
        <header className="border-b border-edge">
          <Column width="header" className="py-14">
            <Eyebrow className="mb-5">Family</Eyebrow>
            <Display size={2}>The people in your thread.</Display>
            <Body className="mt-6 max-w-[60ch] text-char">
              Living, deceased, and not-yet-born descendants — placeholders that will promote to
              full membership at the age you set. The thread is for everyone whose name is here.
            </Body>
          </Column>
        </header>
        <Column width="header" className="py-12 space-y-12">
          {Object.entries(groups).map(([title, list]) => (
            <section key={title}>
              <div className="flex items-baseline gap-4 mb-6">
                <Eyebrow>{title}</Eyebrow>
                <Rule className="flex-1" />
              </div>
              <ul className="divide-y divide-edge">
                {list.map((m) => (
                  <li key={m.id} className="py-5 grid md:grid-cols-[1fr_240px_140px] gap-3 md:gap-8 items-baseline">
                    <div>
                      <p className="font-news text-[1.25rem] leading-[1.25] text-ink">
                        {m.name}
                        {m.status === 'deceased' ? <span className="ml-3 font-v3mono text-[0.65rem] tracking-[0.28em] uppercase text-char">in memoriam</span> : null}
                        {m.status === 'placeholder' ? <span className="ml-3 font-v3mono text-[0.65rem] tracking-[0.28em] uppercase text-mark">placeholder</span> : null}
                      </p>
                      <Caption>{m.relation} · {m.dates}</Caption>
                    </div>
                    <Caption className="not-italic font-v3mono text-[0.6875rem] tracking-[0.28em] uppercase text-char">{m.role}</Caption>
                    <Link to="/v3/thread" className="font-news text-mark hover:text-mark-deep underline underline-offset-[3px] decoration-1 decoration-mark/40 hover:decoration-mark transition-colors text-[0.95rem]">
                      Read entries →
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <Rule />
          <Link to="/v3/family/invite" className="font-news text-mark hover:text-mark-deep underline underline-offset-[3px] decoration-1 decoration-mark/40 hover:decoration-mark transition-colors">
            Add a member to the thread →
          </Link>
        </Column>
      </AppShell>
    </Surface>
  );
}
