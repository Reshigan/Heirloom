import { Link } from 'react-router-dom';
import { AppFrame } from '../loom/components/AppFrame';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ borderTop: '1px solid var(--loom-rule)', paddingTop: 40, marginTop: 40 }}>
      <h2
        className="loom-h2"
        style={{ fontSize: 22, fontWeight: 300, margin: '0 0 20px', fontStyle: 'normal' }}
      >
        {title}
      </h2>
      <div className="loom-body" style={{ color: 'var(--loom-bone-dim)', lineHeight: 1.85 }}>
        {children}
      </div>
    </section>
  );
}

export function Privacy() {
  return (
    <AppFrame>
      <div style={{ maxWidth: '70ch', margin: '0 auto' }}>
        <Link
          to="/"
          className="loom-mono"
          style={{
            display: 'inline-block',
            fontSize: 10,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--loom-bone-faint)',
            textDecoration: 'none',
            marginBottom: 48,
          }}
        >
          ← back to heirloom
        </Link>

        <header style={{ marginBottom: 40 }}>
          <p className="loom-eyebrow" style={{ marginBottom: 14 }}>Privacy Policy</p>
          <h1
            className="loom-h2"
            style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 300, fontStyle: 'italic', margin: 0 }}
          >
            Your memories are sacred.
          </h1>
          <p
            className="loom-mono"
            style={{ fontSize: 11, color: 'var(--loom-bone-faint)', marginTop: 18, letterSpacing: '0.08em' }}
          >
            Last updated: December 16, 2025
          </p>
        </header>

        <Section title="Our commitment to privacy">
          <p>
            At Heirloom, we believe your memories are sacred. We've built our platform with privacy as a
            fundamental principle, not an afterthought. This policy explains how we protect your data and
            respect your privacy rights.
          </p>
        </Section>

        <Section title="Information we collect">
          <p style={{ marginBottom: 12 }}>
            <strong style={{ color: 'var(--loom-bone)', fontWeight: 400 }}>Account information.</strong>{' '}
            When you create an account, we collect your email address, name, and password (which is hashed
            and never stored in plain text).
          </p>
          <p style={{ marginBottom: 12 }}>
            <strong style={{ color: 'var(--loom-bone)', fontWeight: 400 }}>Content you create.</strong>{' '}
            Photos, voice recordings, letters, and other content you upload are encrypted on your device
            before transmission. We cannot read or access this content.
          </p>
          <p style={{ marginBottom: 12 }}>
            <strong style={{ color: 'var(--loom-bone)', fontWeight: 400 }}>Usage data.</strong>{' '}
            We collect anonymized usage statistics to improve our service, such as feature usage patterns
            and performance metrics.
          </p>
          <p>
            <strong style={{ color: 'var(--loom-bone)', fontWeight: 400 }}>Payment information.</strong>{' '}
            Payment processing is handled by Stripe. We never store your full credit card number.
          </p>
        </Section>

        <Section title="Zero-knowledge encryption">
          <p style={{ marginBottom: 12 }}>
            <strong style={{ color: 'var(--loom-bone)', fontWeight: 400 }}>AES-256 encryption.</strong>{' '}
            All your content is encrypted using AES-256, the same standard used by the U.S. government
            for classified information.
          </p>
          <p style={{ marginBottom: 12 }}>
            <strong style={{ color: 'var(--loom-bone)', fontWeight: 400 }}>Zero-knowledge architecture.</strong>{' '}
            Your encryption keys are derived from your password and never leave your device. We cannot
            decrypt your content, even if compelled by law enforcement.
          </p>
          <p>
            <strong style={{ color: 'var(--loom-bone)', fontWeight: 400 }}>End-to-end encryption.</strong>{' '}
            Data is encrypted before leaving your device and can only be decrypted by you or your
            designated beneficiaries.
          </p>
        </Section>

        <Section title="Data storage &amp; security">
          <p style={{ marginBottom: 12 }}>
            <strong style={{ color: 'var(--loom-bone)', fontWeight: 400 }}>Secure infrastructure.</strong>{' '}
            Your data is stored on Cloudflare's global network with enterprise-grade security, redundancy,
            and 99.99% uptime.
          </p>
          <p style={{ marginBottom: 12 }}>
            <strong style={{ color: 'var(--loom-bone)', fontWeight: 400 }}>Geographic distribution.</strong>{' '}
            Data is replicated across multiple secure data centers to ensure availability and disaster recovery.
          </p>
          <p>
            <strong style={{ color: 'var(--loom-bone)', fontWeight: 400 }}>Regular audits.</strong>{' '}
            We conduct regular security audits and penetration testing to identify and address vulnerabilities.
          </p>
        </Section>

        <Section title="Your rights &amp; data deletion">
          <p style={{ marginBottom: 12 }}>
            <strong style={{ color: 'var(--loom-bone)', fontWeight: 400 }}>Access your data.</strong>{' '}
            You can export all your data at any time from your account settings.
          </p>
          <p style={{ marginBottom: 12 }}>
            <strong style={{ color: 'var(--loom-bone)', fontWeight: 400 }}>Delete your data.</strong>{' '}
            You can delete your account and all associated data at any time. Deletion is permanent
            and irreversible.
          </p>
          <p style={{ marginBottom: 12 }}>
            <strong style={{ color: 'var(--loom-bone)', fontWeight: 400 }}>GDPR compliance.</strong>{' '}
            We comply with GDPR and respect your rights to access, rectification, erasure, and data portability.
          </p>
          <p>
            <strong style={{ color: 'var(--loom-bone)', fontWeight: 400 }}>CCPA compliance.</strong>{' '}
            California residents have additional rights under CCPA, including the right to know what data
            we collect and the right to opt-out of data sales (we don't sell data).
          </p>
        </Section>

        <Section title="Contact us">
          <p>
            If you have questions about this privacy policy or your data, please write to us at{' '}
            <a
              href="mailto:privacy@heirloom.blue"
              style={{ color: 'var(--loom-warm)', textDecoration: 'none', borderBottom: '1px solid var(--loom-rule-warm)' }}
            >
              privacy@heirloom.blue
            </a>.
          </p>
        </Section>

        <div
          style={{
            borderTop: '1px solid var(--loom-rule)',
            marginTop: 64,
            paddingTop: 28,
            display: 'flex',
            gap: 28,
            alignItems: 'center',
          }}
        >
          <span className="loom-mono" style={{ fontSize: 11, color: 'var(--loom-warm)', marginRight: 'auto' }}>
            ∞ heirloom
          </span>
          <Link
            to="/terms"
            className="loom-mono"
            style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--loom-bone-faint)', textDecoration: 'none' }}
          >
            Terms
          </Link>
          <a
            href="mailto:support@heirloom.blue"
            className="loom-mono"
            style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--loom-bone-faint)', textDecoration: 'none' }}
          >
            Contact
          </a>
          <span className="loom-mono" style={{ fontSize: 10, letterSpacing: '0.08em', color: 'var(--loom-bone-faint)' }}>
            © {new Date().getFullYear()}
          </span>
        </div>
      </div>
    </AppFrame>
  );
}
