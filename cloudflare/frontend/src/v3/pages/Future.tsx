import { Surface, Column } from '../components/Surface';
import { AppShell } from '../components/AppShell';
import { Eyebrow, Display, Body, Caption, Rule } from '../components/Type';
import { ButtonV3 } from '../components/Button';
import { Field, Input, Textarea } from '../components/Field';

export function Future() {
  return (
    <Surface>
      <AppShell>
        <header className="border-b border-edge">
          <Column width="header" className="py-14">
            <Eyebrow className="mb-5">Future letter</Eyebrow>
            <Display size={2}>Write to the version of you who reads this in thirty years.</Display>
            <Body className="mt-6 max-w-[60ch] text-char">
              Not for anyone else. The thread keeps it sealed; on the date you choose it surfaces
              for you. A long-form check-in with a self you have not yet become.
            </Body>
          </Column>
        </header>
        <Column width="reading" className="py-14">
          <form className="space-y-9">
            <Field id="fl-when" label="Open on" hint="Your birthday in 30 years is suggested.">
              <Input id="fl-when" type="date" />
            </Field>
            <Field id="fl-body" label="Letter">
              <Textarea
                id="fl-body"
                rows={20}
                placeholder="Dear future me,&#10;&#10;Today is…"
                className="text-[1.1875rem] leading-[1.7] italic"
                style={{ borderBottom: 'none' }}
              />
              <Rule />
            </Field>
            <div className="flex items-baseline justify-between gap-6 pt-2">
              <Caption>The body is encrypted at rest. Only the open date is visible until then.</Caption>
              <ButtonV3 type="button">Seal &amp; save</ButtonV3>
            </div>
          </form>
        </Column>
      </AppShell>
    </Surface>
  );
}
