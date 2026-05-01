import { Surface, Column } from '../components/Surface';
import { AppShell } from '../components/AppShell';
import { Eyebrow, Display, Body, ReadingBody, Caption, Rule } from '../components/Type';
import { ButtonV3 } from '../components/Button';
import { Field, Input, Select } from '../components/Field';

export function Book() {
  return (
    <Surface>
      <AppShell>
        <header className="border-b border-edge">
          <Column width="header" className="py-14">
            <Eyebrow className="mb-5">Living book</Eyebrow>
            <Display size={2}>Print the thread as a hardback.</Display>
            <Body className="mt-6 max-w-[60ch] text-char">
              The thread is online; the book sits on a shelf. Each printing captures the thread up
              to a moment in time — what's been written, what's been opened. Re-printable as the
              thread grows.
            </Body>
          </Column>
        </header>
        <Column width="reading" className="py-14">
          <ReadingBody className="text-char mb-12">
            We compile your selected entries into a 6 × 9-inch hardback, set in the same
            typography as the thread. Linen-bound. Acid-free paper. Printed and shipped through Lulu.
          </ReadingBody>

          <form className="space-y-9">
            <Eyebrow>What goes in</Eyebrow>
            <div className="grid sm:grid-cols-2 gap-7">
              <Field id="b-from" label="From">
                <Input id="b-from" type="date" />
              </Field>
              <Field id="b-to" label="To">
                <Input id="b-to" type="date" />
              </Field>
            </div>
            <Field id="b-include" label="Include sealed entries that have opened?">
              <Select id="b-include">
                <option>Yes — print everything readable</option>
                <option>No — only entries that were always open</option>
              </Select>
            </Field>

            <Rule className="mt-10" />
            <Eyebrow>Where to ship</Eyebrow>
            <div className="grid sm:grid-cols-2 gap-7">
              <Field id="b-name" label="Name"><Input id="b-name" /></Field>
              <Field id="b-line1" label="Address"><Input id="b-line1" /></Field>
              <Field id="b-city" label="City"><Input id="b-city" /></Field>
              <Field id="b-pc" label="Postcode"><Input id="b-pc" /></Field>
              <Field id="b-country" label="Country"><Input id="b-country" placeholder="GB · US · ZA · …" /></Field>
              <Field id="b-phone" label="Phone"><Input id="b-phone" type="tel" /></Field>
            </div>

            <Rule className="mt-10" />
            <div className="flex items-baseline justify-between gap-6">
              <Caption>Hardback · 6 × 9 in · linen · ~$48 + shipping. We will email a proof before printing.</Caption>
              <ButtonV3 type="button">Order proof</ButtonV3>
            </div>
          </form>
        </Column>
      </AppShell>
    </Surface>
  );
}
