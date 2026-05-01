import { Surface, Column } from '../components/Surface';
import { AppShell } from '../components/AppShell';
import { Eyebrow, Display, Body, Caption, Rule } from '../components/Type';

const recent = [
  '1 May', '30 Apr', '29 Apr', '28 Apr', '26 Apr', '24 Apr', '23 Apr', '22 Apr',
  '20 Apr', '19 Apr', '17 Apr', '15 Apr', '13 Apr', '11 Apr',
];

export function Streaks() {
  return (
    <Surface>
      <AppShell>
        <header className="border-b border-edge">
          <Column width="header" className="py-14">
            <Eyebrow className="mb-5">Streaks · gently</Eyebrow>
            <Display size={2}>14 days you wrote in the thread.</Display>
            <Body className="mt-6 max-w-[60ch] text-char">
              We do not nag. The product is not Duolingo. But if you have been writing, this is
              what it looks like.
            </Body>
          </Column>
        </header>
        <Column width="reading" className="py-14">
          <Eyebrow className="mb-5">Days you wrote, last 30</Eyebrow>
          <Rule className="mb-7" />
          <ul className="grid grid-cols-5 sm:grid-cols-7 gap-3">
            {recent.map((d) => (
              <li
                key={d}
                className="border border-mark/60 px-2 py-3 text-center font-v3mono text-[0.7rem] tracking-[0.2em] uppercase text-mark"
              >
                {d}
              </li>
            ))}
            {Array.from({ length: 30 - recent.length }).map((_, i) => (
              <li key={`blank-${i}`} className="border border-edge px-2 py-3 text-center font-v3mono text-[0.7rem] text-char/40">
                ·
              </li>
            ))}
          </ul>
          <Caption className="mt-10">No badges. No fire emojis. The streak is its own reward.</Caption>
        </Column>
      </AppShell>
    </Surface>
  );
}
