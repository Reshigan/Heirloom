import { Link } from 'react-router-dom';
import { Surface, Column } from '../components/Surface';
import { AppShell } from '../components/AppShell';
import { Eyebrow, Display, Body, ReadingBody, Caption, Rule } from '../components/Type';

const artifacts = [
  {
    id: '1',
    title: 'The Saturdays',
    blurb: 'A short piece compiled from your three entries about your grandmother — written, voice, and the one with the photograph of the kitchen counter.',
    sources: 3,
    when: 'compiled 14 Apr 2026',
  },
  {
    id: '2',
    title: 'Why we left',
    blurb: 'Aunt Nadia’s long entry, set against a 1971 hartal newspaper clipping you scanned. A two-voice piece.',
    sources: 2,
    when: 'compiled 28 Mar 2026',
  },
];

export function Artifacts() {
  return (
    <Surface>
      <AppShell>
        <header className="border-b border-edge">
          <Column width="header" className="py-14">
            <Eyebrow className="mb-5">Story artifacts</Eyebrow>
            <Display size={2}>Compiled pieces from your thread.</Display>
            <Body className="mt-6 max-w-[60ch] text-char">
              Selected entries gathered into a single readable piece — a chapter, an essay, a
              short documentary. The thread is the source; the artifact is a reading.
            </Body>
          </Column>
        </header>
        <Column width="header" className="py-12">
          <ul className="divide-y divide-edge">
            {artifacts.map((a) => (
              <li key={a.id} className="py-8">
                <Link to="/v3/thread" className="block group">
                  <h3 className="font-news text-[1.5rem] leading-[1.25] text-ink mb-2 group-hover:text-mark transition-colors">
                    {a.title}
                  </h3>
                  <ReadingBody className="text-char mb-3 max-w-[60ch]">{a.blurb}</ReadingBody>
                  <Caption className="not-italic font-v3mono text-[0.75rem] tracking-[0.18em] uppercase text-char">
                    {a.sources} sources · {a.when}
                  </Caption>
                </Link>
              </li>
            ))}
          </ul>
          <Rule className="my-12" />
          <Link to="/v3/artifacts/new" className="font-news text-mark hover:text-mark-deep underline underline-offset-[3px] decoration-1 decoration-mark/40 hover:decoration-mark transition-colors">
            Compile a new artifact →
          </Link>
        </Column>
      </AppShell>
    </Surface>
  );
}
