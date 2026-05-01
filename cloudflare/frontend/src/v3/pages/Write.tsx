import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Surface, Column } from '../components/Surface';
import { AppShell } from '../components/AppShell';
import { Eyebrow, Display, Caption, Rule } from '../components/Type';
import { ButtonV3 } from '../components/Button';
import { Field, Input, Textarea, Select } from '../components/Field';

type LockType = 'NONE' | 'DATE' | 'AGE' | 'EVENT' | 'GENERATION';

export function Write() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [visibility, setVisibility] = useState('FAMILY');
  const [lock, setLock] = useState<LockType>('NONE');

  return (
    <Surface>
      <AppShell>
        <header className="border-b border-edge">
          <Column width="header" className="py-12">
            <Link to="/v3/thread" className="font-news text-char hover:text-mark text-[0.95rem] transition-colors">
              ← The thread
            </Link>
            <div className="mt-7">
              <Eyebrow className="mb-5">New entry · The Govender family</Eyebrow>
              <Display size={2}>What do you want the thread to remember?</Display>
            </div>
          </Column>
        </header>

        <Column width="reading" className="py-14">
          <form className="space-y-9">
            <Field id="w-title" label="Title — optional">
              <Input id="w-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="The summer Nan taught me to bake" />
            </Field>

            {/* The body is the centerpiece. Set as a real reading column. */}
            <Field id="w-body" label="Body">
              <Textarea
                id="w-body"
                rows={14}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write to your descendants. Tell them something. They will read this."
                className="text-[1.25rem] leading-[1.65]"
                style={{ borderBottom: 'none' }}
              />
              <Rule />
            </Field>

            <div className="grid sm:grid-cols-2 gap-7">
              <Field id="w-vis" label="Who can read this">
                <Select id="w-vis" value={visibility} onChange={(e) => setVisibility(e.target.value)}>
                  <option value="FAMILY">Family — anyone in the thread, now and later</option>
                  <option value="DESCENDANTS">Descendants only — generations after yours</option>
                  <option value="PRIVATE">Private — for a specific recipient</option>
                </Select>
              </Field>
              <Field id="w-lock" label="Time-lock">
                <Select id="w-lock" value={lock} onChange={(e) => setLock(e.target.value as LockType)}>
                  <option value="NONE">No lock — open immediately</option>
                  <option value="DATE">Open on a specific date</option>
                  <option value="AGE">Open when someone reaches an age</option>
                  <option value="EVENT">Open when an event happens</option>
                  <option value="GENERATION">Open once a generation exists</option>
                </Select>
              </Field>
            </div>

            {lock === 'DATE' ? (
              <Field id="w-date" label="Open on">
                <Input id="w-date" type="date" />
              </Field>
            ) : null}

            {lock === 'AGE' ? (
              <div className="grid sm:grid-cols-2 gap-7">
                <Field id="w-rec" label="Recipient">
                  <Select id="w-rec">
                    <option>— Pick a thread member —</option>
                    <option>Aaliyah Govender (daughter, b. 2024)</option>
                    <option>Faiza Govender (sister, b. 1979)</option>
                  </Select>
                </Field>
                <Field id="w-age" label="Open at age">
                  <Input id="w-age" type="number" min={1} max={120} placeholder="18" />
                </Field>
              </div>
            ) : null}

            {lock === 'EVENT' ? (
              <div className="grid sm:grid-cols-2 gap-7">
                <Field id="w-rec2" label="Recipient">
                  <Select id="w-rec2">
                    <option>— Pick a thread member —</option>
                    <option>Aaliyah Govender</option>
                    <option>Faiza Govender</option>
                  </Select>
                </Field>
                <Field id="w-event" label="Event">
                  <Input id="w-event" placeholder="wedding · first child · graduation" />
                </Field>
              </div>
            ) : null}

            {lock === 'GENERATION' ? (
              <Field id="w-gen" label="Open once a member of generation N exists" hint="+1 = your kids · +2 = grandkids · +3 = great-grandkids.">
                <Input id="w-gen" type="number" min={1} max={6} placeholder="2" />
              </Field>
            ) : null}

            <Rule className="mt-12" />
            <div className="flex items-baseline justify-between gap-6 pt-2">
              <Caption>
                Entries become immutable thirty days after they're written. You can amend them
                after; you cannot rewrite history.
              </Caption>
              <ButtonV3 type="button">Save to the thread</ButtonV3>
            </div>
          </form>
        </Column>
      </AppShell>
    </Surface>
  );
}
