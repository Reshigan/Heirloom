import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Surface, Column } from '../components/Surface';
import { MarketingNav } from '../components/MarketingNav';
import { Eyebrow, Display, Body, Caption } from '../components/Type';
import { ButtonV3 } from '../components/Button';
import { Field, Input } from '../components/Field';

export function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register } = useAuthStore();
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms) {
      setError('You need to accept the terms and the privacy notice to continue.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await register(email.trim(), password, firstName.trim(), lastName.trim(), {
        acceptedTerms: true,
        acceptedTermsAt: new Date().toISOString(),
        marketingConsent: false,
        marketingConsentAt: null,
      });
      navigate('/v3/home');
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Could not create your account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Surface>
      <MarketingNav />
      <Column className="py-24">
        <Eyebrow className="mb-6">Begin a thread</Eyebrow>
        <Display size={2} className="mb-7">Just a few details.</Display>
        <Body className="mb-12 text-char">
          You'll be the founder of your family thread. You can invite others — including the
          generations after you — once you're in.
        </Body>

        <form onSubmit={submit} className="space-y-7">
          <div className="grid sm:grid-cols-2 gap-7">
            <Field id="s-first" label="First name">
              <Input id="s-first" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </Field>
            <Field id="s-last" label="Last name">
              <Input id="s-last" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </Field>
          </div>
          <Field id="s-email" label="Email">
            <Input id="s-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field id="s-pw" label="Password" hint="At least 8 characters.">
            <Input id="s-pw" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>

          <label className="flex items-start gap-3 cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-1 accent-mark"
            />
            <Caption>
              I accept the{' '}
              <Link to="/terms" className="text-mark underline underline-offset-[3px] decoration-1 decoration-mark/40 hover:decoration-mark">terms</Link>
              {' '}and the{' '}
              <Link to="/privacy" className="text-mark underline underline-offset-[3px] decoration-1 decoration-mark/40 hover:decoration-mark">privacy notice</Link>.
            </Caption>
          </label>

          {error ? <p role="alert" className="font-news italic text-blood-v3">{error}</p> : null}

          <div className="flex items-center justify-between gap-6 pt-3">
            <Caption>
              Already have an account?{' '}
              <Link to="/v3/login" className="text-mark underline underline-offset-[3px] decoration-1 decoration-mark/40 hover:decoration-mark">
                Sign in
              </Link>
              .
            </Caption>
            <ButtonV3 type="submit" disabled={submitting || !email.trim() || !password.trim() || !firstName.trim() || !lastName.trim()}>
              {submitting ? 'Creating…' : 'Create account'}
            </ButtonV3>
          </div>
        </form>
      </Column>
    </Surface>
  );
}
