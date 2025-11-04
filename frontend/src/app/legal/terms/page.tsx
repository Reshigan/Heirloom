'use client'

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="glass-panel p-8">
          <h1 className="text-4xl font-bold text-white mb-8">Terms of Service</h1>
          
          <div className="space-y-6 text-gray-200">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing and using Heirloom (&quot;the Service&quot;), operated by Vantax Limited, a company incorporated in Delaware (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these Terms of Service, please do not use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">2. Description of Service</h2>
              <p>
                Heirloom is a private posthumous vault platform that allows users to store digital memories, photos, videos, documents, and other content (&quot;Memories&quot;) that remain private during their lifetime and can be accessed by designated recipients after death through Legacy Token redemption.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">3. User Accounts</h2>
              <p className="mb-2">
                To use the Service, you must create an account. You agree to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide accurate, current, and complete information during registration</li>
                <li>Maintain the security of your password and account</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
                <li>Be responsible for all activities that occur under your account</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">4. Privacy and Vault Security</h2>
              <p className="mb-2">
                Your vault and all Memories stored within it are:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Private and encrypted during your lifetime</li>
                <li>Only accessible to you while you are alive</li>
                <li>Unsealed only upon Legacy Token redemption after your passing</li>
                <li>Subject to privacy levels you set (Public, Private, Restricted)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">5. Legacy Tokens</h2>
              <p className="mb-2">
                Legacy Tokens are unique codes that allow designated recipients to access your vault after your passing. You acknowledge that:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Tokens can be redeemed multiple times by different recipients</li>
                <li>Token redemption is sufficient authority to unseal your vault</li>
                <li>You are responsible for securely storing and distributing your tokens</li>
                <li>Lost tokens can be regenerated from your account</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">6. Content Ownership and Rights</h2>
              <p className="mb-2">
                You retain all ownership rights to the content you upload. By using the Service, you grant Heirloom:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>A license to store, process, and display your content</li>
                <li>The right to backup and secure your content</li>
                <li>Permission to deliver your content to token redeemers after your passing</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">7. Prohibited Content</h2>
              <p className="mb-2">
                You may not upload content that:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Violates any laws or regulations</li>
                <li>Infringes on intellectual property rights</li>
                <li>Contains malware or harmful code</li>
                <li>Is illegal, threatening, abusive, or defamatory</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">8. Subscription Plans</h2>
              <p className="mb-2">
                Heirloom offers multiple subscription tiers with different storage limits and features. You agree that:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Subscription fees are non-refundable</li>
                <li>Plans automatically renew unless cancelled</li>
                <li>We may change pricing with 30 days notice</li>
                <li>Downgrading may result in loss of access to premium features</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">9. Executors and Guardians</h2>
              <p>
                You may designate executors or guardians to manage your vault after your passing. Executors have the authority to approve token redemptions, manage access, and perform other administrative functions as specified by you.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">10. Service Availability</h2>
              <p>
                While we strive for 99.9% uptime, we do not guarantee uninterrupted access to the Service. We reserve the right to modify, suspend, or discontinue the Service with reasonable notice.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">11. Limitation of Liability</h2>
              <p>
                Heirloom shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">12. Termination</h2>
              <p>
                We reserve the right to terminate or suspend your account for violation of these Terms. Upon termination, your right to use the Service will immediately cease.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">13. Changes to Terms</h2>
              <p>
                We may modify these Terms at any time. Continued use of the Service after changes constitutes acceptance of the modified Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">14. Contact Information</h2>
              <p>
                For questions about these Terms, please contact us at legal@heirloom.com
              </p>
            </section>

            <p className="text-sm text-gray-400 mt-8">
              Last Updated: November 4, 2025
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
