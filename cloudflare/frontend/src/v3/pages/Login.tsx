import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Surface, Column } from '../components/Surface';
import { MarketingNav } from '../components/MarketingNav';
import { Eyebrow, Display, Caption } from '../components/Type';
import { ButtonV3 } from '../components/Button';
import { Field, Input } from '../components/Field';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(email.trim(), password);
      navigate('/v3/home');
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Email or password is wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Surface>
      <MarketingNav />
      <Column className="py-24">
        <Eyebrow className="mb-6">Sign in</Eyebrow>
        <Display size={2} className="mb-10">Welcome back.</Display>

        <form onSubmit={submit} className="space-y-7">
          <Field id="l-email" label="Email">
            <Input id="l-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field id="l-pw" label="Password">
            <Input id="l-pw" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          {error ? <p role="alert" className="font-news italic text-blood-v3">{error}</p> : null}
          <div className="flex items-center justify-between gap-6 pt-3">
            <Link
              to="/v3/forgot"
              className="font-news text-char hover:text-mark text-sm underline underline-offset-[3px] decoration-1 decoration-edge hover:decoration-mark transition-colors"
            >
              Forgot your password
            </Link>
            <ButtonV3 type="submit" disabled={submitting || !email.trim() || !password.trim()}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </ButtonV3>
          </div>
        </form>

        <Caption className="mt-12">
          New here?{' '}
          <Link to="/v3/signup" className="text-mark underline underline-offset-[3px] decoration-1 decoration-mark/40 hover:decoration-mark">
            Create an account
          </Link>
          .
        </Caption>
      </Column>
    </Surface>
  );
}
