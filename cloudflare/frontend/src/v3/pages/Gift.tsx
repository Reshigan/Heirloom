import { Surface, Column } from '../components/Surface';
import { AppShell } from '../components/AppShell';
import { Eyebrow, Display, Body, Caption, Rule } from '../components/Type';
import { ButtonV3 } from '../components/Button';
import { Field, Input, Textarea, Select } from '../components/Field';

export function Gift() {
  return (
    <Surface>
      <AppShell>
        <header className="border-b border-edge">
          <Column width="header" className="py-14">
            <Eyebrow className="mb-5">Gift a memory</Eyebrow>
            <Display size={2}>Send something from your thread.</Display>
            <Body className="mt-6 max-w-[60ch] text-char">
              Pick one entry from your thread and send it to someone outside the thread — a friend,
              a relative not yet a member, a family they used to be part of. They get a private
              link; nothing else of yours is shared.
            </Body>
          </Column>
        </header>
        <Column width="reading" className="py-14">
          <form className="space-y-9">
            <Field id="g-entry" label="Entry">
              <Select id="g-entry">
                <option>— Pick an entry to share —</option>
                <option>On Saturday mornings (1 May 2026)</option>
                <option>A clipping I found in a drawer (30 Apr 2026)</option>
                <option>Why we left Lahore in 1971 (12 Mar 2023)</option>
              </Select>
            </Field>
            <div className="grid sm:grid-cols-2 gap-7">
              <Field id="g-name" label="Their name"><Input id="g-name" /></Field>
              <Field id="g-email" label="Their email"><Input id="g-email" type="email" /></Field>
            </div>
            <Field id="g-note" label="A short note — optional" hint="Read with the entry. Set in your handwriting if you have one configured.">
              <Textarea id="g-note" rows={4} />
            </Field>
            <Rule />
            <div className="flex items-baseline justify-between gap-6">
              <Caption>The link expires after 30 days. Recipients can read; not amend.</Caption>
              <ButtonV3 type="button">Send</ButtonV3>
            </div>
          </form>
        </Column>
      </AppShell>
    </Surface>
  );
}
