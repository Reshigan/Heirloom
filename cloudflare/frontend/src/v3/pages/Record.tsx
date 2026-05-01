import { Link } from 'react-router-dom';
import { Surface, Column } from '../components/Surface';
import { AppShell } from '../components/AppShell';
import { Eyebrow, Display, Body, Caption, Rule } from '../components/Type';
import { ButtonV3 } from '../components/Button';
import { Field, Input, Textarea } from '../components/Field';

/**
 * /v3/record — the voice composer.
 *
 * One large mic. One transcript field. That is the page. No waveform
 * visualisations, no playback ornament. The recording is the point;
 * everything else gets out of the way.
 */
export function Record() {
  return (
    <Surface>
      <AppShell>
        <header className="border-b border-edge">
          <Column width="header" className="py-12">
            <Link to="/v3/thread" className="font-news text-char hover:text-mark text-[0.95rem] transition-colors">
              ← The thread
            </Link>
            <div className="mt-7">
              <Eyebrow className="mb-5">Voice · new recording</Eyebrow>
              <Display size={2}>Speak to the thread.</Display>
              <Body className="mt-6 text-char max-w-[60ch]">
                The fastest way to add a memory is to say it aloud. Tap the circle, talk for as long
                as you like, stop when you're done. We'll transcribe it.
              </Body>
            </div>
          </Column>
        </header>

        <Column width="reading" className="py-16">
          {/* The mic — a real piece of furniture. Quiet outside the page. */}
          <div className="flex flex-col items-center text-center mb-16">
            <button
              type="button"
              aria-label="Start recording"
              className="w-32 h-32 rounded-full border-2 border-mark bg-bone hover:bg-mark hover:text-bone text-mark transition-colors flex items-center justify-center mb-5"
            >
              <span className="font-v3mono text-[0.75rem] tracking-[0.32em] uppercase">Record</span>
            </button>
            <Caption>00:00 · ready</Caption>
          </div>

          <Rule className="mb-10" />

          <form className="space-y-9">
            <Field id="r-title" label="Title">
              <Input id="r-title" placeholder="What this recording is about, in a sentence." />
            </Field>
            <Field id="r-transcript" label="Transcript" hint="Auto-generated after recording. You can correct it before saving.">
              <Textarea
                id="r-transcript"
                rows={10}
                placeholder="Will appear here once you stop recording."
                className="text-[1.0625rem] leading-[1.65]"
              />
            </Field>
            <Rule />
            <div className="flex items-baseline justify-between gap-6">
              <Caption>The recording goes into the thread alongside the transcript.</Caption>
              <ButtonV3 type="button">Save voice entry</ButtonV3>
            </div>
          </form>
        </Column>
      </AppShell>
    </Surface>
  );
}
