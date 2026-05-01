import { Link } from 'react-router-dom';
import { Surface, Column } from '../components/Surface';
import { AppShell } from '../components/AppShell';
import { Eyebrow, Display, Body, Caption, Rule } from '../components/Type';
import { ButtonV3 } from '../components/Button';
import { Field, Input, Textarea } from '../components/Field';

export function Capsule() {
  return (
    <Surface>
      <AppShell>
        <header className="border-b border-edge">
          <Column width="header" className="py-12">
            <Link to="/v3/thread" className="font-news text-char hover:text-mark text-[0.95rem] transition-colors">
              ← The thread
            </Link>
            <div className="mt-7">
              <Eyebrow className="mb-5">Time capsule</Eyebrow>
              <Display size={2}>Sealed, opens on a date.</Display>
              <Body className="mt-6 text-char max-w-[60ch]">
                A capsule is a small collection — a few entries gathered together, sealed, and
                opened on a single date. New time-locked work goes through{' '}
                <Link to="/v3/write" className="text-mark underline underline-offset-[3px] decoration-1 decoration-mark/40 hover:decoration-mark">
                  the thread composer
                </Link>{' '}
                with a lock. This page is for assembled groups.
              </Body>
            </div>
          </Column>
        </header>
        <Column width="reading" className="py-14">
          <form className="space-y-9">
            <Field id="c-title" label="Title">
              <Input id="c-title" placeholder="The 2026 capsule — to open in 2050" />
            </Field>
            <Field id="c-desc" label="Description" hint="A note that opens with the capsule, before the entries.">
              <Textarea id="c-desc" rows={5} />
            </Field>
            <Field id="c-open" label="Open on">
              <Input id="c-open" type="date" />
            </Field>
            <Rule />
            <Eyebrow>Add entries to this capsule</Eyebrow>
            <Caption>You'll pick existing thread entries to seal into this capsule once it's created.</Caption>
            <Rule className="mt-12" />
            <div className="flex items-baseline justify-between gap-6">
              <Caption>The capsule will appear on the thread with a sealed marker until the date you set.</Caption>
              <ButtonV3 type="button">Create capsule</ButtonV3>
            </div>
          </form>
        </Column>
      </AppShell>
    </Surface>
  );
}
