import { Link } from 'react-router-dom';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-paper-15 pt-10">
      <h2 className="font-body font-light text-2xl mb-5 tracking-[-0.012em]">{title}</h2>
      <div className="space-y-4 text-paper-70 leading-[1.8] font-body">{children}</div>
    </section>
  );
}

export function Privacy() {
  return (
    <main className="min-h-screen bg-void text-paper antialiased">
      <header className="px-6 md:px-12 pt-8 md:pt-10">
        <nav className="max-w-3xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-baseline gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-gold rounded">
            <span className="font-body text-3xl text-gold leading-none">∞</span>
            <span className="text-[0.7rem] tracking-[0.34em] uppercase text-paper-70 group-hover:text-paper transition-colors">Heirloom</span>
          </Link>
          <Link to="/login" className="text-paper-50 hover:text-paper transition-colors text-sm">
            Sign in
          </Link>
        </nav>
      </header>

      <section className="px-6 md:px-12 pt-20 md:pt-28 pb-20 md:pb-28">
        <div className="max-w-3xl mx-auto">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-paper-50 hover:text-gold transition-colors text-sm mb-12"
          >
            <span aria-hidden>←</span> Back to Heirloom
          </Link>

          <p className="font-mono text-[0.7rem] tracking-[0.32em] uppercase text-gold mb-6">Privacy Policy</p>
          <h1
            className="font-body font-light leading-[1.06] tracking-[-0.02em]"
            style={{ fontSize: 'clamp(2.5rem, 5vw, 3.75rem)' }}
          >
            Privacy Policy
          </h1>
          <p className="mt-6 text-paper-50 font-mono text-sm">Last updated: December 16, 2025</p>

          <div className="mt-16 space-y-10">
            <Section title="Our Commitment to Privacy">
              <p>
                At Heirloom, we believe your memories are sacred. We've built our platform with privacy as a fundamental principle, not an afterthought. This policy explains how we protect your data and respect your privacy rights.
              </p>
            </Section>

            <Section title="Information We Collect">
              <p><strong className="text-paper font-normal">Account Information:</strong> When you create an account, we collect your email address, name, and password (which is hashed and never stored in plain text).</p>
              <p><strong className="text-paper font-normal">Content You Create:</strong> Photos, voice recordings, letters, and other content you upload are encrypted on your device before transmission. We cannot read or access this content.</p>
              <p><strong className="text-paper font-normal">Usage Data:</strong> We collect anonymized usage statistics to improve our service, such as feature usage patterns and performance metrics.</p>
              <p><strong className="text-paper font-normal">Payment Information:</strong> Payment processing is handled by Stripe. We never store your full credit card number.</p>
            </Section>

            <Section title="Military-Grade Encryption">
              <p><strong className="text-paper font-normal">AES-256 Encryption:</strong> All your content is encrypted using AES-256, the same standard used by the U.S. government for classified information.</p>
              <p><strong className="text-paper font-normal">Zero-Knowledge Architecture:</strong> Your encryption keys are derived from your password and never leave your device. We cannot decrypt your content, even if compelled by law enforcement.</p>
              <p><strong className="text-paper font-normal">End-to-End Encryption:</strong> Data is encrypted before leaving your device and can only be decrypted by you or your designated beneficiaries.</p>
            </Section>

            <Section title="Data Storage & Security">
              <p><strong className="text-paper font-normal">Secure Infrastructure:</strong> Your data is stored on Cloudflare's global network with enterprise-grade security, redundancy, and 99.99% uptime.</p>
              <p><strong className="text-paper font-normal">Geographic Distribution:</strong> Data is replicated across multiple secure data centers to ensure availability and disaster recovery.</p>
              <p><strong className="text-paper font-normal">Regular Audits:</strong> We conduct regular security audits and penetration testing to identify and address vulnerabilities.</p>
            </Section>

            <Section title="Your Rights & Data Deletion">
              <p><strong className="text-paper font-normal">Access Your Data:</strong> You can export all your data at any time from your account settings.</p>
              <p><strong className="text-paper font-normal">Delete Your Data:</strong> You can delete your account and all associated data at any time. Deletion is permanent and irreversible.</p>
              <p><strong className="text-paper font-normal">GDPR Compliance:</strong> We comply with GDPR and respect your rights to access, rectification, erasure, and data portability.</p>
              <p><strong className="text-paper font-normal">CCPA Compliance:</strong> California residents have additional rights under CCPA, including the right to know what data we collect and the right to opt-out of data sales (we don't sell data).</p>
            </Section>

            <Section title="Contact Us">
              <p>
                If you have questions about this privacy policy or your data, please contact us at{' '}
                <a href="mailto:privacy@heirloom.blue" className="text-gold hover:text-gold-bright transition-colors">privacy@heirloom.blue</a>.
              </p>
            </Section>
          </div>
        </div>
      </section>

      <footer className="border-t border-paper-15 px-6 md:px-12 py-10">
        <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-baseline gap-3">
            <span className="text-xl text-gold">∞</span>
            <span className="text-[0.65rem] tracking-[0.34em] uppercase text-paper-50">Heirloom</span>
          </div>
          <div className="flex gap-7 text-sm text-paper-50">
            <Link to="/privacy" className="text-gold hover:text-gold-bright transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-paper transition-colors">Terms</Link>
            <a href="mailto:support@heirloom.blue" className="hover:text-paper transition-colors">Contact</a>
          </div>
          <div className="text-xs font-mono text-paper-30">© {new Date().getFullYear()}</div>
        </div>
      </footer>
    </main>
  );
}
