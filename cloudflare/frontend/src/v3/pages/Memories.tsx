import { Link } from 'react-router-dom';
import { Surface, Column } from '../components/Surface';
import { AppShell } from '../components/AppShell';
import { Eyebrow, Display, Body, Caption, Rule } from '../components/Type';

const memories = [
  { id: '1', when: 'Spring 1998', title: 'The kitchen on Saturdays', desc: 'Nan’s biscuits, the radio, the dough on the counter.', kind: 'Memory · text' },
  { id: '2', when: 'June 2007', title: 'Dad’s factory closing', desc: 'The clipping pinned to the cabinet door.', kind: 'Memory · photo' },
  { id: '3', when: '14 Aug 2014', title: 'Walking the long way home', desc: 'Mum’s last summer in the old house.', kind: 'Memory · text' },
  { id: '4', when: 'Winter 2017', title: 'The house on Birchall Road', desc: 'Before the hedge grew in.', kind: 'Memory · photo' },
];

export function Memories() {
  return (
    <Surface>
      <AppShell>
        <header className="border-b border-edge">
          <Column width="header" className="py-14">
            <Eyebrow className="mb-5">Memories</Eyebrow>
            <Display size={2}>Moments you've added to the thread.</Display>
            <Body className="mt-6 max-w-[60ch] text-char">
              Memories you wrote into your thread before it was a thread; carried forward and
              still readable here. New writing goes in alongside them.
            </Body>
          </Column>
        </header>
        <Column width="header" className="py-12">
          <ul className="divide-y divide-edge">
            {memories.map((m) => (
              <li key={m.id} className="py-7">
                <Link to="/v3/thread" className="grid md:grid-cols-[160px_1fr] gap-3 md:gap-10 group">
                  <div>
                    <Caption className="not-italic font-v3mono text-[0.6875rem] tracking-[0.28em] uppercase text-char mb-1">
                      {m.when}
                    </Caption>
                    <Caption className="not-italic font-v3mono text-[0.6875rem] tracking-[0.22em] uppercase text-mark/80">
                      {m.kind}
                    </Caption>
                  </div>
                  <div>
                    <h3 className="font-news text-[1.375rem] leading-[1.25] text-ink mb-1.5 group-hover:text-mark transition-colors">
                      {m.title}
                    </h3>
                    <p className="font-news text-[1.0625rem] leading-[1.65] text-char max-w-[58ch]">{m.desc}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <Rule className="my-12" />
          <Link to="/v3/write" className="font-news text-mark hover:text-mark-deep underline underline-offset-[3px] decoration-1 decoration-mark/40 hover:decoration-mark transition-colors">
            Add a memory to the thread →
          </Link>
        </Column>
      </AppShell>
    </Surface>
  );
}
