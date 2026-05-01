import { Link } from 'react-router-dom';
import { Surface, Column } from '../components/Surface';
import { AppShell } from '../components/AppShell';
import { Eyebrow, Display, Body, Caption, Rule } from '../components/Type';

const recordings = [
  { id: '1', when: '8 Nov 2021', length: '4 min 12 sec', title: 'The Sunday call', transcript: 'A short voice memo I recorded after our weekly call. Mum reading the news to me, the way she always did, even after I had read it.' },
  { id: '2', when: '12 Mar 2023', length: '11 min 38 sec', title: 'Aunt Nadia tells the leaving story', transcript: 'I have not written this down before. Your grandfather did not want us to. But the people who need to know are now old enough…' },
  { id: '3', when: '3 Jun 2024', length: '2 min 04 sec', title: 'Faiza laughing about the wedding', transcript: 'You always said you would never get married, and then you did. I have the photo of your face when the band started.' },
];

export function Voice() {
  return (
    <Surface>
      <AppShell>
        <header className="border-b border-edge">
          <Column width="header" className="py-14">
            <Eyebrow className="mb-5">Voice</Eyebrow>
            <Display size={2}>Voices you've recorded.</Display>
            <Body className="mt-6 max-w-[60ch] text-char">
              The original Family Thread lived in voices. Each recording is set on the thread next
              to its transcript; they are read together, not separately.
            </Body>
          </Column>
        </header>
        <Column width="header" className="py-12">
          <ul className="divide-y divide-edge">
            {recordings.map((r) => (
              <li key={r.id} className="py-7">
                <div className="grid md:grid-cols-[200px_1fr] gap-3 md:gap-10">
                  <div>
                    <Caption className="not-italic font-v3mono text-[0.6875rem] tracking-[0.28em] uppercase text-mark mb-1">
                      Voice · {r.length}
                    </Caption>
                    <Caption>{r.when}</Caption>
                  </div>
                  <div>
                    <h3 className="font-news text-[1.375rem] leading-[1.25] text-ink mb-2">{r.title}</h3>
                    <p className="font-news italic text-[1.0625rem] leading-[1.65] text-char max-w-[58ch]">{r.transcript}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <Rule className="my-12" />
          <Link to="/v3/record" className="font-news text-mark hover:text-mark-deep underline underline-offset-[3px] decoration-1 decoration-mark/40 hover:decoration-mark transition-colors">
            Record a voice memo →
          </Link>
        </Column>
      </AppShell>
    </Surface>
  );
}
