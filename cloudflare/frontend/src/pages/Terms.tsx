import { Link } from 'react-router-dom';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-paper-15 pt-10">
      <h2 className="font-body font-light text-2xl mb-5 tracking-[-0.012em]">{title}</h2>
      <div className="space-y-4 text-paper-70 leading-[1.8] font-body">{children}</div>
    </section>
  );
}

export function Terms() {
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

          <p className="font-mono text-[0.7rem] tracking-[0.32em] uppercase text-gold mb-6">Terms of Service</p>
          <h1
            className="font-body font-light leading-[1.06] tracking-[-0.02em]"
            style={{ fontSize: 'clamp(2.5rem, 5vw, 3.75rem)' }}
          >
            Terms of Service
          </h1>
          <p className="mt-6 text-paper-50 font-mono text-sm">Last updated: December 16, 2025</p>

          <div className="mt-16 space-y-10">
            <Section title="Agreement to Terms">
              <p>
                By accessing or using Heirloom ("the Service"), you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access the Service. These terms apply to all visitors, users, and others who access or use the Service.
              </p>
            </Section>

            <Section title="Account Terms">
              <p><strong className="text-paper font-normal">Age Requirement:</strong> You must be at least 18 years old to use this Service. By using the Service, you represent that you are at least 18 years of age.</p>
              <p><strong className="text-paper font-normal">Account Security:</strong> You are responsible for maintaining the security of your account and password. Heirloom cannot and will not be liable for any loss or damage from your failure to comply with this security obligation.</p>
              <p><strong className="text-paper font-normal">Accurate Information:</strong> You must provide accurate, complete, and current information when creating your account. Failure to do so constitutes a breach of these Terms.</p>
              <p><strong className="text-paper font-normal">One Account Per Person:</strong> You may not create multiple accounts. Each person may only have one account.</p>
            </Section>

            <Section title="Subscription & Payments">
              <p><strong className="text-paper font-normal">Free Trial:</strong> New users receive a 14-day free trial. No credit card is required to start your trial.</p>
              <p><strong className="text-paper font-normal">Billing:</strong> Paid subscriptions are billed in advance on a monthly or yearly basis. You will be charged at the beginning of each billing period.</p>
              <p><strong className="text-paper font-normal">Price Changes:</strong> We reserve the right to modify our prices. Any price changes will be communicated to you at least 30 days in advance.</p>
              <p><strong className="text-paper font-normal">Refunds:</strong> We offer a 30-day money-back guarantee for new subscribers. After 30 days, refunds are provided at our discretion.</p>
              <p><strong className="text-paper font-normal">Cancellation:</strong> You may cancel your subscription at any time. Your subscription will remain active until the end of your current billing period.</p>
            </Section>

            <Section title="Acceptable Use">
              <p>You agree not to use the Service to:</p>
              <ul className="list-disc list-outside space-y-2 ml-5 marker:text-gold">
                <li>Upload, post, or transmit any content that is unlawful, harmful, threatening, abusive, harassing, defamatory, or otherwise objectionable</li>
                <li>Impersonate any person or entity, or falsely state or misrepresent your affiliation with a person or entity</li>
                <li>Upload content that infringes any patent, trademark, trade secret, copyright, or other proprietary rights</li>
                <li>Interfere with or disrupt the Service or servers or networks connected to the Service</li>
                <li>Attempt to gain unauthorized access to any portion of the Service or any other systems or networks</li>
                <li>Use the Service for any illegal purpose or in violation of any local, state, national, or international law</li>
              </ul>
            </Section>

            <Section title="Content Ownership & Rights">
              <p><strong className="text-paper font-normal">Your Content:</strong> You retain all rights to the content you upload to Heirloom. We do not claim ownership of your photos, voice recordings, letters, or any other content you create.</p>
              <p><strong className="text-paper font-normal">License to Operate:</strong> By uploading content, you grant us a limited license to store, process, and transmit your content solely for the purpose of providing the Service to you.</p>
              <p><strong className="text-paper font-normal">Encryption:</strong> Due to our zero-knowledge encryption, we cannot access, view, or modify your content. You are solely responsible for maintaining backups of your encryption keys.</p>
              <p><strong className="text-paper font-normal">Posthumous Delivery:</strong> Content designated for posthumous delivery will be released to your designated beneficiaries according to your instructions and the verification process you have configured.</p>
            </Section>

            <Section title="Limitation of Liability">
              <p>In no event shall Heirloom, its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from:</p>
              <ul className="list-disc list-outside space-y-2 ml-5 marker:text-gold">
                <li>Your access to or use of or inability to access or use the Service</li>
                <li>Any conduct or content of any third party on the Service</li>
                <li>Any content obtained from the Service</li>
                <li>Unauthorized access, use, or alteration of your transmissions or content</li>
              </ul>
            </Section>

            <Section title="Changes to Terms">
              <p>
                We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.
              </p>
            </Section>

            <Section title="Contact Us">
              <p>
                If you have questions about these Terms of Service, please contact us at{' '}
                <a href="mailto:legal@heirloom.blue" className="text-gold hover:text-gold-bright transition-colors">legal@heirloom.blue</a>.
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
            <Link to="/privacy" className="hover:text-paper transition-colors">Privacy</Link>
            <Link to="/terms" className="text-gold hover:text-gold-bright transition-colors">Terms</Link>
            <a href="mailto:support@heirloom.blue" className="hover:text-paper transition-colors">Contact</a>
          </div>
          <div className="text-xs font-mono text-paper-30">© {new Date().getFullYear()}</div>
        </div>
      </footer>
    </main>
  );
}
