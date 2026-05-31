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

export function Terms() {
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
          <p className="loom-eyebrow" style={{ marginBottom: 14 }}>Terms of Service</p>
          <h1
            className="loom-h2"
            style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 300, fontStyle: 'italic', margin: 0 }}
          >
            How we work together.
          </h1>
          <p
            className="loom-mono"
            style={{ fontSize: 11, color: 'var(--loom-bone-faint)', marginTop: 18, letterSpacing: '0.08em' }}
          >
            Last updated: December 16, 2025
          </p>
        </header>

        <Section title="Agreement to terms">
          <p>
            By accessing or using Heirloom ("the Service"), you agree to be bound by these Terms of
            Service. If you disagree with any part of these terms, you may not access the Service. These
            terms apply to all visitors, users, and others who access or use the Service.
          </p>
        </Section>

        <Section title="Account terms">
          <p style={{ marginBottom: 12 }}>
            <strong style={{ color: 'var(--loom-bone)', fontWeight: 400 }}>Age requirement.</strong>{' '}
            You must be at least 18 years old to use this Service. By using the Service, you represent
            that you are at least 18 years of age.
          </p>
          <p style={{ marginBottom: 12 }}>
            <strong style={{ color: 'var(--loom-bone)', fontWeight: 400 }}>Account security.</strong>{' '}
            You are responsible for maintaining the security of your account and password. Heirloom
            cannot and will not be liable for any loss or damage from your failure to comply with this
            security obligation.
          </p>
          <p style={{ marginBottom: 12 }}>
            <strong style={{ color: 'var(--loom-bone)', fontWeight: 400 }}>Accurate information.</strong>{' '}
            You must provide accurate, complete, and current information when creating your account.
            Failure to do so constitutes a breach of these Terms.
          </p>
          <p>
            <strong style={{ color: 'var(--loom-bone)', fontWeight: 400 }}>One account per person.</strong>{' '}
            You may not create multiple accounts. Each person may only have one account.
          </p>
        </Section>

        <Section title="Subscription &amp; payments">
          <p style={{ marginBottom: 12 }}>
            <strong style={{ color: 'var(--loom-bone)', fontWeight: 400 }}>Free trial.</strong>{' '}
            New users receive a 14-day free trial. No credit card is required to start your trial.
          </p>
          <p style={{ marginBottom: 12 }}>
            <strong style={{ color: 'var(--loom-bone)', fontWeight: 400 }}>Billing.</strong>{' '}
            Paid subscriptions are billed in advance on a monthly or yearly basis. You will be charged
            at the beginning of each billing period.
          </p>
          <p style={{ marginBottom: 12 }}>
            <strong style={{ color: 'var(--loom-bone)', fontWeight: 400 }}>Price changes.</strong>{' '}
            We reserve the right to modify our prices. Any price changes will be communicated to you
            at least 30 days in advance.
          </p>
          <p style={{ marginBottom: 12 }}>
            <strong style={{ color: 'var(--loom-bone)', fontWeight: 400 }}>Refunds.</strong>{' '}
            We offer a 30-day money-back guarantee for new subscribers. After 30 days, refunds are
            provided at our discretion.
          </p>
          <p>
            <strong style={{ color: 'var(--loom-bone)', fontWeight: 400 }}>Cancellation.</strong>{' '}
            You may cancel your subscription at any time. Your subscription will remain active until
            the end of your current billing period.
          </p>
        </Section>

        <Section title="Acceptable use">
          <p style={{ marginBottom: 14 }}>You agree not to use the Service to:</p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }}>
            {[
              'Upload, post, or transmit any content that is unlawful, harmful, threatening, abusive, harassing, defamatory, or otherwise objectionable.',
              'Impersonate any person or entity, or falsely state or misrepresent your affiliation with a person or entity.',
              'Upload content that infringes any patent, trademark, trade secret, copyright, or other proprietary rights.',
              'Interfere with or disrupt the Service or servers or networks connected to the Service.',
              'Attempt to gain unauthorized access to any portion of the Service or any other systems or networks.',
              'Use the Service for any illegal purpose or in violation of any local, state, national, or international law.',
            ].map((item) => (
              <li key={item} style={{ display: 'flex', gap: 14, alignItems: 'baseline' }}>
                <span style={{ color: 'var(--loom-warm)', fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>·</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Content ownership &amp; rights">
          <p style={{ marginBottom: 12 }}>
            <strong style={{ color: 'var(--loom-bone)', fontWeight: 400 }}>Your content.</strong>{' '}
            You retain all rights to the content you upload to Heirloom. We do not claim ownership of
            your photos, voice recordings, letters, or any other content you create.
          </p>
          <p style={{ marginBottom: 12 }}>
            <strong style={{ color: 'var(--loom-bone)', fontWeight: 400 }}>License to operate.</strong>{' '}
            By uploading content, you grant us a limited license to store, process, and transmit your
            content solely for the purpose of providing the Service to you.
          </p>
          <p style={{ marginBottom: 12 }}>
            <strong style={{ color: 'var(--loom-bone)', fontWeight: 400 }}>Encryption.</strong>{' '}
            Due to our zero-knowledge encryption, we cannot access, view, or modify your content. You
            are solely responsible for maintaining backups of your encryption keys.
          </p>
          <p>
            <strong style={{ color: 'var(--loom-bone)', fontWeight: 400 }}>Posthumous delivery.</strong>{' '}
            Content designated for posthumous delivery will be released to your designated beneficiaries
            according to your instructions and the verification process you have configured.
          </p>
        </Section>

        <Section title="Limitation of liability">
          <p style={{ marginBottom: 14 }}>
            In no event shall Heirloom, its directors, employees, partners, agents, suppliers, or
            affiliates, be liable for any indirect, incidental, special, consequential, or punitive
            damages, including without limitation, loss of profits, data, use, goodwill, or other
            intangible losses, resulting from:
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }}>
            {[
              'Your access to or use of or inability to access or use the Service.',
              'Any conduct or content of any third party on the Service.',
              'Any content obtained from the Service.',
              'Unauthorized access, use, or alteration of your transmissions or content.',
            ].map((item) => (
              <li key={item} style={{ display: 'flex', gap: 14, alignItems: 'baseline' }}>
                <span style={{ color: 'var(--loom-warm)', fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>·</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Changes to terms">
          <p>
            We reserve the right to modify or replace these Terms at any time. If a revision is
            material, we will provide at least 30 days' notice prior to any new terms taking effect.
            What constitutes a material change will be determined at our sole discretion. By continuing
            to access or use our Service after those revisions become effective, you agree to be bound
            by the revised terms.
          </p>
        </Section>

        <Section title="Contact us">
          <p>
            If you have questions about these Terms of Service, please write to us at{' '}
            <a
              href="mailto:legal@heirloom.blue"
              style={{ color: 'var(--loom-warm)', textDecoration: 'none', borderBottom: '1px solid var(--loom-rule-warm)' }}
            >
              legal@heirloom.blue
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
            to="/privacy"
            className="loom-mono"
            style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--loom-bone-faint)', textDecoration: 'none' }}
          >
            Privacy
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
