'use client'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="glass-panel p-8">
          <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
          
          <div className="space-y-6 text-gray-200">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
              <p>
                At Heirloom, operated by Vantax Limited, a company incorporated in Delaware, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our private posthumous vault platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-white mb-2 mt-4">Personal Information</h3>
              <p className="mb-2">We collect information that you provide directly to us:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Name, email address, and account credentials</li>
                <li>Payment information (processed securely through Stripe)</li>
                <li>Profile information and preferences</li>
                <li>Executor and guardian contact information</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-2 mt-4">Vault Content</h3>
              <p className="mb-2">Content you upload to your vault:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Photos, videos, audio recordings, and documents</li>
                <li>Memory descriptions, titles, and metadata</li>
                <li>Emotion tags, locations, and dates</li>
                <li>Privacy settings and time-lock configurations</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-2 mt-4">Usage Information</h3>
              <p className="mb-2">We automatically collect certain information:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Device information (browser type, operating system)</li>
                <li>IP address and location data</li>
                <li>Usage patterns and feature interactions</li>
                <li>Log data and error reports</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">3. How We Use Your Information</h2>
              <p className="mb-2">We use your information to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide, maintain, and improve the Service</li>
                <li>Process your transactions and manage subscriptions</li>
                <li>Send you technical notices and support messages</li>
                <li>Communicate about features, updates, and security</li>
                <li>Monitor and analyze usage patterns</li>
                <li>Detect and prevent fraud and abuse</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">4. Vault Privacy and Security</h2>
              <p className="mb-2">Your vault content is protected through:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>End-to-end encryption:</strong> All vault content is encrypted at rest and in transit</li>
                <li><strong>Private by default:</strong> Your memories are never shared without explicit authorization</li>
                <li><strong>Access controls:</strong> Only you can access your vault during your lifetime</li>
                <li><strong>Token-based unsealing:</strong> Vault access after death requires valid Legacy Token</li>
                <li><strong>Privacy levels:</strong> You control who can see each memory (Public, Private, Restricted)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">5. Information Sharing and Disclosure</h2>
              <p className="mb-2">We do not sell your personal information. We may share information:</p>
              
              <h3 className="text-xl font-semibold text-white mb-2 mt-4">With Your Consent</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>With token redeemers after your passing (as configured by you)</li>
                <li>With executors and guardians you designate</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-2 mt-4">Service Providers</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Cloud storage providers (AWS S3 / Cloudflare R2)</li>
                <li>Payment processors (Stripe)</li>
                <li>Email service providers (Resend)</li>
                <li>Analytics providers (anonymized data only)</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-2 mt-4">Legal Requirements</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>To comply with legal obligations</li>
                <li>To respond to lawful requests from authorities</li>
                <li>To protect our rights and prevent fraud</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">6. Data Retention</h2>
              <p className="mb-2">We retain your information:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Vault content:</strong> Indefinitely, as the purpose is posthumous preservation</li>
                <li><strong>Account data:</strong> Until you delete your account</li>
                <li><strong>Usage logs:</strong> For 90 days</li>
                <li><strong>Payment records:</strong> For 7 years (legal requirement)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">7. Your Rights and Choices</h2>
              <p className="mb-2">You have the right to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your account and data</li>
                <li><strong>Export:</strong> Download your vault content at any time</li>
                <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">8. Security Measures</h2>
              <p className="mb-2">We implement industry-standard security measures:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>AES-256 encryption for data at rest</li>
                <li>TLS 1.3 for data in transit</li>
                <li>Regular security audits and penetration testing</li>
                <li>Multi-factor authentication support</li>
                <li>Secure password hashing (bcrypt)</li>
                <li>Regular backups and disaster recovery</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">9. AI Features and Data Processing</h2>
              <p>
                If you use our AI-powered features (emotion detection, voice cloning, memory books), your content may be processed by third-party AI providers. This processing is done securely and your content is not used to train AI models.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">10. Children&apos;s Privacy</h2>
              <p>
                Heirloom is not intended for users under 18 years of age. We do not knowingly collect information from children. If we discover that a child has provided us with personal information, we will delete it immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">11. International Data Transfers</h2>
              <p>
                Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">12. Cookies and Tracking</h2>
              <p className="mb-2">We use cookies and similar technologies to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Maintain your session and preferences</li>
                <li>Analyze usage patterns and improve the Service</li>
                <li>Provide personalized features</li>
              </ul>
              <p className="mt-2">You can control cookies through your browser settings.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">13. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of significant changes by email or through the Service. Your continued use after changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">14. Contact Us</h2>
              <p className="mb-2">
                For questions about this Privacy Policy or to exercise your rights, contact us at:
              </p>
              <ul className="list-none space-y-1 ml-4">
                <li>Email: privacy@heirloom.com</li>
                <li>Company: Vantax Limited</li>
                <li>Jurisdiction: Delaware, United States</li>
              </ul>
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
