import { Surface, Column } from '../components/Surface';
import { AppShell } from '../components/AppShell';
import { Eyebrow, Display, Body, ReadingBody, Caption, Rule } from '../components/Type';

const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });

const entries = [
  { year: '1 May 2024', author: 'Reshigan', title: 'A walk on the common.', body: 'Mum, you and me on the bench by the pond. You said the ducks were rude. The wind kept lifting your scarf and you laughed each time it did.' },
  { year: '1 May 2018', author: 'Faiza', title: 'The day the painting fell down.', body: 'It made a sound like a book closing in another room. I was making tea and just stood there. Dad came down the stairs in his slippers and we put it back up without saying anything.' },
];

export function OnThisDay() {
  return (
    <Surface>
      <AppShell>
        <header className="border-b border-edge">
          <Column width="header" className="py-14">
            <Eyebrow className="mb-5">On this day · {today}</Eyebrow>
            <Display size={2}>What was written before, on this date.</Display>
            <Body className="mt-6 max-w-[60ch] text-char">
              A daily ritual surface. The thread accumulates over time, and many years from now,
              this is the page your descendants might open every morning.
            </Body>
          </Column>
        </header>
        <Column width="reading" className="py-14 space-y-16">
          {entries.map((e, i) => (
            <article key={i}>
              <div className="flex items-baseline justify-between mb-3">
                <Caption className="not-italic font-v3mono text-[0.6875rem] tracking-[0.28em] uppercase text-mark">
                  {e.year}
                </Caption>
                <Caption className="not-italic font-v3mono text-[0.6875rem] tracking-[0.28em] uppercase text-char">
                  {e.author}
                </Caption>
              </div>
              <h2 className="font-news text-[1.875rem] leading-[1.2] tracking-[-0.012em] mb-5">{e.title}</h2>
              <ReadingBody>{e.body}</ReadingBody>
              {i < entries.length - 1 ? <Rule className="mt-12" /> : null}
            </article>
          ))}
        </Column>
      </AppShell>
    </Surface>
  );
}
