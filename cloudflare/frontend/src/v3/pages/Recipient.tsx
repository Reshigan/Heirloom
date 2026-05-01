import { Surface, Column } from '../components/Surface';
import { AppShell } from '../components/AppShell';
import { Eyebrow, Display, Body, ReadingBody, Caption, Rule } from '../components/Type';

export function Recipient() {
  return (
    <Surface>
      <AppShell>
        <header className="border-b border-edge">
          <Column width="header" className="py-14">
            <Eyebrow className="mb-5">Recipient experience</Eyebrow>
            <Display size={2}>What it looks like when someone receives an inheritance.</Display>
            <Body className="mt-6 max-w-[60ch] text-char">
              When a thread is passed to a successor, they see this. A preview, generated from your
              real thread, that shows them what they'll be reading — and what's still locked.
            </Body>
          </Column>
        </header>
        <Column width="reading" className="py-14">
          <ReadingBody>
            <em>Reshigan,</em> you have inherited the Govender family thread on this day. There are
            twenty-four entries already written and two sealed entries waiting to open in your
            lifetime. The first will open on the eighteenth birthday of your daughter Aaliyah, in
            twenty-sixteen years; the second on the fiftieth anniversary of your parents' marriage,
            in fifty years.
          </ReadingBody>
          <Rule className="my-10" />
          <ReadingBody>
            You are the second Founder of this thread. You can read everything; you can write your
            own entries; you can designate the next Successor. You cannot remove what came before.
          </ReadingBody>
          <Rule className="my-10" />
          <Caption>This is a preview, generated from your current thread. Successors see this when their inheritance opens.</Caption>
        </Column>
      </AppShell>
    </Surface>
  );
}
