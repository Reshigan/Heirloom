import { useState } from 'react';
import { Surface, Column } from '../components/Surface';
import { AppShell } from '../components/AppShell';
import { Eyebrow, Display, Body, Caption, Rule } from '../components/Type';
import { ButtonV3 } from '../components/Button';
import { Field, Input } from '../components/Field';

const tabs = [
  { id: 'profile', label: 'Profile' },
  { id: 'encryption', label: 'Encryption' },
  { id: 'succession', label: 'Succession' },
  { id: 'deadman', label: 'Deadman' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'security', label: 'Security' },
  { id: 'support', label: 'Support' },
];

export function Settings() {
  const [active, setActive] = useState('profile');
  return (
    <Surface>
      <AppShell>
        <header className="border-b border-edge">
          <Column width="header" className="py-14">
            <Eyebrow className="mb-5">Settings</Eyebrow>
            <Display size={2}>Your account.</Display>
          </Column>
        </header>

        <Column width="header" className="py-12">
          {/* Tabs as small caps row, no pills, no boxes */}
          <nav className="border-b border-edge mb-12 -mx-6 md:-mx-0">
            <ul className="flex gap-7 overflow-x-auto px-6 md:px-0">
              {tabs.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => setActive(t.id)}
                    className={`font-v3mono text-[0.7rem] tracking-[0.3em] uppercase pb-4 -mb-px border-b-2 transition-colors whitespace-nowrap ${
                      active === t.id ? 'text-mark border-mark' : 'text-char border-transparent hover:text-mark'
                    }`}
                  >
                    {t.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {active === 'profile' ? (
            <form className="space-y-9 max-w-[640px]">
              <div className="grid sm:grid-cols-2 gap-7">
                <Field id="p-first" label="First name"><Input id="p-first" defaultValue="Reshigan" /></Field>
                <Field id="p-last" label="Last name"><Input id="p-last" defaultValue="Govender" /></Field>
              </div>
              <Field id="p-email" label="Email"><Input id="p-email" type="email" defaultValue="reshigan@example.com" /></Field>
              <ButtonV3 type="button">Save</ButtonV3>
            </form>
          ) : null}

          {active === 'encryption' ? (
            <div className="max-w-[640px] space-y-6">
              <Body className="text-char">
                Each thread holds its body content encrypted with a family key escrowed across your
                successor designations. If you lose access, the key is recoverable through the
                successor chain.
              </Body>
              <Rule />
              <Caption>Encryption set up · 14 March 2026 · key escrowed across 3 successors.</Caption>
              <ButtonV3 type="button" variant="ghost">Re-issue keys</ButtonV3>
            </div>
          ) : null}

          {active === 'succession' ? (
            <div className="max-w-[640px] space-y-6">
              <Body className="text-char">
                If you die or step away, the highest-ranked active successor takes founder rights.
                See the full chain on the{' '}
                <a href="/v3/successors" className="text-mark underline underline-offset-[3px] decoration-1 decoration-mark/40 hover:decoration-mark">
                  successors page
                </a>.
              </Body>
              <Caption>3 successors designated · 1 placeholder pending age 18 in 2042.</Caption>
            </div>
          ) : null}

          {active === 'deadman' ? (
            <div className="max-w-[640px] space-y-6">
              <Body className="text-char">
                We send you a quiet check-in every 90 days. If you do not respond for 60 days
                after, your designated emergency contacts are notified, and entries with the
                "open on author's death" lock begin a 60-day verification window.
              </Body>
              <Caption>Last check-in confirmed · 22 February 2026.</Caption>
              <ButtonV3 type="button" variant="ghost">Confirm I'm here</ButtonV3>
            </div>
          ) : null}

          {active === 'notifications' ? (
            <div className="max-w-[640px] space-y-4">
              {[
                ['Weekly digest of new entries from family members', true],
                ['Quiet quarterly Founder check-in', true],
                ['Monthly summary of opened locks', false],
              ].map(([label, on]) => (
                <label key={String(label)} className="flex items-baseline gap-4 cursor-pointer">
                  <input type="checkbox" defaultChecked={Boolean(on)} className="mt-1 accent-mark" />
                  <span className="font-news text-[1.0625rem] text-ink">{String(label)}</span>
                </label>
              ))}
            </div>
          ) : null}

          {active === 'security' ? (
            <div className="max-w-[640px] space-y-6">
              <Body className="text-char">Two-factor authentication, password change, recovery key.</Body>
              <Caption>2FA · enabled (authenticator app) · last password change 14 March 2026.</Caption>
            </div>
          ) : null}

          {active === 'support' ? (
            <div className="max-w-[640px] space-y-4">
              <Body className="text-char">If something is wrong, or someone has died, write to us.</Body>
              <Caption>support@heirloom.blue · we respond within two business days.</Caption>
            </div>
          ) : null}
        </Column>
      </AppShell>
    </Surface>
  );
}
