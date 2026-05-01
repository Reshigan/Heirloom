import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { foundersApi, type FounderCount } from '../../services/api';
import { Surface, Column } from '../components/Surface';
import { MarketingNav } from '../components/MarketingNav';
import { Eyebrow, Display, Body, ReadingBody, Rule, Caption } from '../components/Type';
import { ButtonV3 } from '../components/Button';
import { Field, Input, Textarea } from '../components/Field';

export function Founder() {
  const [count, setCount] = useState<FounderCount | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    foundersApi.count().then((r) => setCount(r.data)).catch(() => undefined);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await foundersApi.pledge({
        name: name.trim(),
        email: email.trim(),
        family_name: familyName.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      if (res.data.checkout_url) {
        window.location.href = res.data.checkout_url;
        return;
      }
      setDone(res.data.message ?? 'Pledge received. We will be in touch within two business days.');
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Could not record your pledge.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Surface>
      <MarketingNav />

      <header className="border-b border-edge">
        <Column width="header" className="py-20 md:py-28">
          <Eyebrow className="mb-6">Founder pledge · first 100</Eyebrow>
          <Display size={1}>Found the continuity record.</Display>
          <Body className="mt-10 max-w-[560px] text-char">
            One hundred families seed the successor non-profit. Your name is engraved in the public
            continuity record. Your bloodline gets lifetime Family-tier access. The thread that
            outlives all of us has its first hundred names — yours among them.
          </Body>
          <div className="mt-12 grid sm:grid-cols-3 gap-x-12 gap-y-6 max-w-xl">
            <Stat label="Pledge" value="$999" sub="one-time, lifetime" />
            <Stat label="Cap" value={count ? `${count.cap}` : '100'} sub="ever" />
            <Stat label="Remaining" value={count ? `${count.remaining}` : '—'} sub={count ? 'right now' : 'loading'} />
          </div>
        </Column>
      </header>

      {/* What you get */}
      <section>
        <Column width="wide" className="py-20">
          <Eyebrow className="mb-7">What you get</Eyebrow>
          <Display size={3} className="mb-12">Lifetime, engraved.</Display>
          <ol className="space-y-10">
            {[
              ['Lifetime Family-tier access for your bloodline.', 'No subscription, no renewals, no churn. Your descendants inherit the same plan.'],
              ['Your name in the continuity record.', 'A real, physical document filed with the successor non-profit at incorporation. Not a webpage that can be deleted — a public-record artifact.'],
              ['Quarterly call with the founder.', 'For as long as Heirloom is operating. Your input shapes the roadmap.'],
              ['You fund the successor non-profit.', 'Your pledge directly seeds the 501(c)(3) that takes over the archive if the company is wound down.'],
              ['Welcome to the Opening Cohort.', 'A private group with the first hundred families. Quiet, considered. Letters and quarterly dinners where geography allows.'],
            ].map(([title, body], i) => (
              <li key={title} className="grid md:grid-cols-[3rem_1fr] gap-x-8">
                <span className="font-v3mono text-[0.75rem] tracking-[0.28em] uppercase text-mark">0{i + 1}</span>
                <div>
                  <h3 className="font-news text-[1.375rem] leading-[1.25] mb-2">{title}</h3>
                  <p className="font-news text-[1.0625rem] leading-[1.65] text-char max-w-[58ch]">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </Column>
      </section>

      <Rule />

      {/* Pledge form */}
      <section id="pledge">
        <Column className="py-20">
          <Eyebrow className="mb-6">Pledge</Eyebrow>
          <Display size={3} className="mb-3">Tell us who you are.</Display>
          <ReadingBody className="text-char mb-12">
            We respond within two business days with a payment link and the next steps. Pledging
            here doesn't charge your card — we want to read your note first.
          </ReadingBody>

          {done ? (
            <div className="border border-edge bg-bone-2 p-10">
              <Eyebrow className="mb-4">Pledge received</Eyebrow>
              <Body className="text-ink">{done}</Body>
              <Link
                to="/v3"
                className="inline-block mt-6 font-news text-mark hover:text-mark-deep underline underline-offset-[3px] decoration-1 decoration-mark/40 hover:decoration-mark transition-colors"
              >
                Back to Heirloom →
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-7" aria-label="Founder pledge intent form">
              <div className="grid sm:grid-cols-2 gap-7">
                <Field id="f-name" label="Your name">
                  <Input id="f-name" required value={name} onChange={(e) => setName(e.target.value)} />
                </Field>
                <Field id="f-email" label="Email">
                  <Input id="f-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </Field>
              </div>
              <Field id="f-family" label="Family name — optional">
                <Input id="f-family" value={familyName} onChange={(e) => setFamilyName(e.target.value)} placeholder="The Mahmood family" />
              </Field>
              <Field id="f-notes" label="Why this matters to your family — optional" hint="A few sentences. Your grandmother, the recipe nobody wrote down, the reason you’re putting your hand up.">
                <Textarea id="f-notes" rows={6} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </Field>
              {error ? <p role="alert" className="font-news text-blood-v3 italic">{error}</p> : null}
              <div className="flex items-center justify-between gap-6 pt-4">
                <Caption className="max-w-[28ch]">
                  We're at {count ? `${count.cap - count.remaining}/${count.cap}` : '—/100'} pledges. We will never sell or share your address.
                </Caption>
                <ButtonV3 type="submit" disabled={submitting || !name.trim() || !email.trim()}>
                  {submitting ? 'Submitting…' : 'Pledge'}
                </ButtonV3>
              </div>
            </form>
          )}
        </Column>
      </section>
    </Surface>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="border-l border-edge pl-5">
      <Caption className="not-italic font-v3mono text-[0.6875rem] tracking-[0.28em] uppercase text-char mb-2">{label}</Caption>
      <p className="font-news text-[2rem] leading-[1] text-ink mb-1.5">{value}</p>
      <Caption className="not-italic font-news text-[0.875rem] text-char">{sub}</Caption>
    </div>
  );
}
