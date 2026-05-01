import { Link } from 'react-router-dom';
import { Surface, Column } from '../components/Surface';
import { AppShell } from '../components/AppShell';
import { Eyebrow, Display, Body, Caption, Rule } from '../components/Type';
import { ButtonV3 } from '../components/Button';

export function Billing() {
  return (
    <Surface>
      <AppShell>
        <header className="border-b border-edge">
          <Column width="header" className="py-14">
            <Eyebrow className="mb-5">Billing</Eyebrow>
            <Display size={2}>Family — $15 / month.</Display>
            <Body className="mt-6 max-w-[60ch] text-char">
              Renews 14 May 2026. Card on file ending in 4242. The plan covers your thread; your
              descendants inherit it without re-paying.
            </Body>
          </Column>
        </header>
        <Column width="header" className="py-12 space-y-12">
          <section className="grid md:grid-cols-3 gap-x-10 gap-y-8 max-w-[820px]">
            {[
              ['Reader', 'Free', 'Read and contribute to threads you’re invited to.', 'Switch to Reader'],
              ['Family', '$15 / mo', 'Start your own thread. Set time-locks. Designate successors.', 'Current plan'],
              ['Founder', '$999 once', 'Lifetime access for your bloodline. Funds the successor non-profit.', 'Become a Founder'],
            ].map(([name, price, line, action], i) => (
              <div key={String(name)} className={`pl-5 ${i > 0 ? 'border-l border-edge' : ''}`}>
                <Caption className="not-italic font-v3mono text-[0.6875rem] tracking-[0.28em] uppercase text-char">{String(price)}</Caption>
                <h3 className="font-news text-[1.5rem] leading-[1.2] mt-1.5">{String(name)}</h3>
                <p className="font-news text-[1rem] leading-[1.6] text-char mt-3 mb-5 max-w-[34ch]">{String(line)}</p>
                <Link
                  to={String(name) === 'Founder' ? '/v3/founder' : '#'}
                  className={`font-news text-[0.95rem] underline underline-offset-[3px] decoration-1 transition-colors ${
                    String(name) === 'Family' ? 'text-char decoration-edge' : 'text-mark decoration-mark/40 hover:decoration-mark hover:text-mark-deep'
                  }`}
                >
                  {String(action)} {String(name) !== 'Family' ? '→' : ''}
                </Link>
              </div>
            ))}
          </section>

          <Rule />

          <section className="max-w-[640px]">
            <Eyebrow className="mb-5">Recent charges</Eyebrow>
            <ul className="divide-y divide-edge">
              {[
                ['14 Apr 2026', 'Family — monthly', '$15.00'],
                ['14 Mar 2026', 'Family — monthly', '$15.00'],
                ['14 Feb 2026', 'Family — monthly', '$15.00'],
              ].map(([d, l, n]) => (
                <li key={d} className="py-4 grid grid-cols-[140px_1fr_auto] gap-4 items-baseline">
                  <Caption className="not-italic font-v3mono text-[0.6875rem] tracking-[0.28em] uppercase text-char">{d}</Caption>
                  <p className="font-news text-[1.0625rem]">{l}</p>
                  <p className="font-news text-[1.0625rem] text-ink">{n}</p>
                </li>
              ))}
            </ul>
          </section>

          <ButtonV3 type="button" variant="ghost">Manage card &amp; receipts</ButtonV3>
        </Column>
      </AppShell>
    </Surface>
  );
}
