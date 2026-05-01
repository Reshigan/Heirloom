import { Link } from 'react-router-dom';
import { Surface, Column } from '../components/Surface';
import { AppShell } from '../components/AppShell';
import { Eyebrow, Display, Caption } from '../components/Type';

const events = [
  { when: '2h ago', who: 'Aunt Nadia', what: 'added an entry: "On the press, and what we did not sell."' },
  { when: '1d ago', who: 'Faiza', what: 'commented on "A clipping I found in a drawer."' },
  { when: '3d ago', who: 'Reshigan', what: 'invited Aaliyah (PLACEHOLDER · age 14) to the thread.' },
  { when: '1w ago', who: 'Aunt Nadia', what: 'sealed an entry to open on the next family wedding.' },
  { when: '2w ago', who: 'Faiza', what: 'designated Aunt Nadia as a successor.' },
];

export function FamilyFeed() {
  return (
    <Surface>
      <AppShell>
        <header className="border-b border-edge">
          <Column width="header" className="py-14">
            <Eyebrow className="mb-5">Family feed</Eyebrow>
            <Display size={2}>What everyone has been doing.</Display>
          </Column>
        </header>
        <Column width="header" className="py-12">
          <ol className="space-y-6">
            {events.map((e, i) => (
              <li key={i} className="grid md:grid-cols-[100px_1fr] gap-3 md:gap-8">
                <Caption className="not-italic font-v3mono text-[0.6875rem] tracking-[0.28em] uppercase text-char">
                  {e.when}
                </Caption>
                <p className="font-news text-[1.0625rem] leading-[1.65] text-ink">
                  <span className="text-mark">{e.who}</span> {e.what}{' '}
                  <Link
                    to="/v3/thread"
                    className="text-char hover:text-mark transition-colors underline underline-offset-[3px] decoration-1 decoration-edge hover:decoration-mark"
                  >
                    Open
                  </Link>
                </p>
              </li>
            ))}
          </ol>
        </Column>
      </AppShell>
    </Surface>
  );
}
