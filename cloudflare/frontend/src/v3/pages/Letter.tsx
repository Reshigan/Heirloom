import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Surface, Column } from '../components/Surface';
import { AppShell } from '../components/AppShell';
import { Eyebrow, Display, Caption, Rule } from '../components/Type';
import { ButtonV3 } from '../components/Button';
import { Field, Input, Textarea, Select } from '../components/Field';

export function Letter() {
  const [trigger, setTrigger] = useState('SCHEDULED');
  return (
    <Surface>
      <AppShell>
        <header className="border-b border-edge">
          <Column width="header" className="py-12">
            <Link to="/v3/letters" className="font-news text-char hover:text-mark text-[0.95rem] transition-colors">
              ← Letters
            </Link>
            <div className="mt-7">
              <Eyebrow className="mb-5">A letter</Eyebrow>
              <Display size={2}>Write to one person, on one day.</Display>
            </div>
          </Column>
        </header>
        <Column width="reading" className="py-14">
          <form className="space-y-9">
            <Field id="lt-sal" label="Dear">
              <Input id="lt-sal" placeholder="Aaliyah" />
            </Field>
            <Field id="lt-body" label="Letter">
              <Textarea
                id="lt-body"
                rows={20}
                placeholder="My dear,&#10;&#10;You will be reading this on…"
                className="text-[1.25rem] leading-[1.7] font-news italic"
                style={{ borderBottom: 'none' }}
              />
              <Rule />
            </Field>
            <Field id="lt-sig" label="Signed">
              <Input id="lt-sig" placeholder="With all my love, your father" />
            </Field>
            <div className="grid sm:grid-cols-2 gap-7">
              <Field id="lt-trig" label="Delivery">
                <Select id="lt-trig" value={trigger} onChange={(e) => setTrigger(e.target.value)}>
                  <option value="IMMEDIATE">Open immediately on save</option>
                  <option value="SCHEDULED">Open on a specific date</option>
                  <option value="DEADMAN">Open on my death (verified)</option>
                </Select>
              </Field>
              {trigger === 'SCHEDULED' ? (
                <Field id="lt-date" label="Date">
                  <Input id="lt-date" type="date" />
                </Field>
              ) : null}
            </div>
            <Rule className="mt-12" />
            <div className="flex items-baseline justify-between gap-6">
              <Caption>Once you seal a letter, the body is encrypted at rest and only reopens when the trigger resolves.</Caption>
              <div className="flex items-center gap-4">
                <ButtonV3 type="button" variant="ghost">Save draft</ButtonV3>
                <ButtonV3 type="button">Seal &amp; save</ButtonV3>
              </div>
            </div>
          </form>
        </Column>
      </AppShell>
    </Surface>
  );
}
