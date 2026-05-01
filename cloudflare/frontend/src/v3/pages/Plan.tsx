import { Link } from 'react-router-dom';
import { Surface, Column } from '../components/Surface';
import { AppShell } from '../components/AppShell';
import { Eyebrow, Display, Body, Caption, Rule } from '../components/Type';

const items = [
  { done: true, label: 'Write the dedication for your thread.', sec: 'Founding' },
  { done: true, label: 'Add the people who must be in the thread now.', sec: 'Founding' },
  { done: true, label: 'Designate at least one successor.', sec: 'Founding' },
  { done: true, label: 'Add a placeholder for each known descendant.', sec: 'Founding' },
  { done: false, label: 'Write the story of your name — what it means, where it comes from.', sec: 'The first ten' },
  { done: false, label: 'Write about the house you grew up in. Just the rooms.', sec: 'The first ten' },
  { done: false, label: 'Tell the story of how your parents met. As you know it.', sec: 'The first ten' },
  { done: false, label: 'Record one voice memo for someone who isn’t born yet.', sec: 'The first ten' },
  { done: false, label: 'Seal a letter to be opened on a specific birthday.', sec: 'The first ten' },
  { done: false, label: 'Compile your photos with one-line captions for each.', sec: 'The first ten' },
  { done: false, label: 'Write what you know about your grandparents’ siblings.', sec: 'The first ten' },
  { done: false, label: 'Tell the story of your work, in three paragraphs.', sec: 'The first ten' },
];

export function Plan() {
  const groups = items.reduce((acc, it) => {
    (acc[it.sec] = acc[it.sec] ?? []).push(it);
    return acc;
  }, {} as Record<string, typeof items>);

  const done = items.filter((i) => i.done).length;
  return (
    <Surface>
      <AppShell>
        <header className="border-b border-edge">
          <Column width="header" className="py-14">
            <Eyebrow className="mb-5">Thread plan</Eyebrow>
            <Display size={2}>What to write, in what order.</Display>
            <Body className="mt-6 max-w-[60ch] text-char">
              A guide, not a roadmap. The thread is yours; this is just the order most people find
              easiest to start with. Cross items off as you write them.
            </Body>
            <Caption className="mt-7">
              {done} of {items.length} done.
            </Caption>
          </Column>
        </header>
        <Column width="reading" className="py-14 space-y-12">
          {Object.entries(groups).map(([sec, list]) => (
            <section key={sec}>
              <div className="flex items-baseline gap-4 mb-5">
                <Eyebrow>{sec}</Eyebrow>
                <Rule className="flex-1" />
              </div>
              <ul className="space-y-4">
                {list.map((it) => (
                  <li key={it.label} className="flex items-baseline gap-4">
                    <span
                      className={`font-v3mono text-[0.6875rem] tracking-[0.28em] uppercase shrink-0 mt-0.5 ${
                        it.done ? 'text-mark' : 'text-char'
                      }`}
                    >
                      {it.done ? '✓ done' : 'todo'}
                    </span>
                    <p className={`font-news text-[1.0625rem] leading-[1.6] ${it.done ? 'text-char line-through decoration-1' : 'text-ink'}`}>
                      {it.label}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <Link to="/v3/write" className="font-news text-mark hover:text-mark-deep underline underline-offset-[3px] decoration-1 decoration-mark/40 hover:decoration-mark transition-colors">
            Write the next one →
          </Link>
        </Column>
      </AppShell>
    </Surface>
  );
}
