import { Surface, Column } from '../components/Surface';
import { AppShell } from '../components/AppShell';
import { Eyebrow, Display, Body, ReadingBody, Caption, Rule } from '../components/Type';

export function Wrapped() {
  return (
    <Surface>
      <AppShell>
        <header className="border-b border-edge">
          <Column width="header" className="py-14">
            <Eyebrow className="mb-5">Wrapped · 2025</Eyebrow>
            <Display size={2}>The year, in your thread.</Display>
            <Body className="mt-6 max-w-[60ch] text-char">
              An annual review. Print-ready, designed for a single sheet of A4. Not animated, not
              shareable to social — meant for you, your family, and possibly the inside of a frame.
            </Body>
          </Column>
        </header>
        <Column width="reading" className="py-14 space-y-14">
          <section>
            <Eyebrow className="mb-3">By the numbers</Eyebrow>
            <Rule className="mb-7" />
            <dl className="grid sm:grid-cols-3 gap-y-7 gap-x-12">
              {[
                ['57', 'entries'],
                ['11', 'voice memos'],
                ['3', 'sealed letters'],
                ['7', 'people in the thread'],
                ['2', 'placeholders for descendants'],
                ['1', 'successor designated'],
              ].map(([n, l]) => (
                <div key={l} className="border-l border-edge pl-4">
                  <dt className="font-news text-[2.5rem] leading-[1] text-ink">{n}</dt>
                  <dd className="mt-1 font-v3mono text-[0.7rem] tracking-[0.28em] uppercase text-char">{l}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section>
            <Eyebrow className="mb-3">What you wrote about most</Eyebrow>
            <Rule className="mb-5" />
            <ReadingBody>
              Your father (eleven entries), the kitchen on Saturdays (six), the year you spent in
              Cape Town (five), and the question of where the press papers ended up (four).
            </ReadingBody>
          </section>
          <section>
            <Eyebrow className="mb-3">A line worth keeping</Eyebrow>
            <Rule className="mb-5" />
            <p
              className="font-news font-light italic text-[clamp(1.5rem,3vw,2.25rem)] leading-[1.35] text-ink max-w-[42ch]"
              style={{ textWrap: 'balance' }}
            >
              “Anything else is for company.”
            </p>
            <Caption className="mt-3">From "On Saturday mornings", written 1 May 2026.</Caption>
          </section>
          <Caption>Print this page; it's set for a single sheet at A4.</Caption>
        </Column>
      </AppShell>
    </Surface>
  );
}
