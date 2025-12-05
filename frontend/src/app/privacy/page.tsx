'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { GoldCard } from '@/components/gold-card'
import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="luxury-bg" />
      <div className="elegant-grid" />
      
      <div className="relative z-10 container mx-auto px-4 py-12 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Link href="/" className="text-gold-primary hover:text-gold-secondary transition-colors mb-8 inline-block">
            ← Back to Home
          </Link>
          
          <h1 className="text-5xl md:text-6xl font-serif font-light text-gold-primary mb-4 tracking-wide">
            Privacy Policy
          </h1>
          <p className="text-pearl/70 mb-8">Last updated: December 5, 2024</p>

          <GoldCard>
            <div className="prose prose-invert max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-serif text-gold-primary mb-4">1. Introduction</h2>
                <p className="text-pearl/80 mb-4">
                  At Heirloom, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Service. Please read this policy carefully.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-serif text-gold-primary mb-4">2. Information We Collect</h2>
                
                <h3 className="text-xl font-serif text-gold-primary/80 mb-3 mt-6">Personal Information</h3>
                <p className="text-pearl/80 mb-4">
                  We collect information that you provide directly to us:
                </p>
                <ul className="list-disc list-inside text-pearl/80 mb-4 space-y-2">
                  <li>Name and email address</li>
                  <li>Account credentials (encrypted passwords)</li>
                  <li>Payment information (processed securely through Stripe)</li>
                  <li>Profile information and preferences</li>
                </ul>

                <h3 className="text-xl font-serif text-gold-primary/80 mb-3 mt-6">Content You Upload</h3>
                <p className="text-pearl/80 mb-4">
                  When you use Heirloom, you may upload:
                </p>
                <ul className="list-disc list-inside text-pearl/80 mb-4 space-y-2">
                  <li>Photos, videos, and documents</li>
                  <li>Text memories and stories</li>
                  <li>Metadata associated with your content</li>
                  <li>Recipient and trusted contact information</li>
                </ul>

                <h3 className="text-xl font-serif text-gold-primary/80 mb-3 mt-6">Automatically Collected Information</h3>
                <p className="text-pearl/80 mb-4">
                  We automatically collect certain information when you use the Service:
                </p>
                <ul className="list-disc list-inside text-pearl/80 mb-4 space-y-2">
                  <li>Device information (browser type, operating system)</li>
                  <li>IP address and location data</li>
                  <li>Usage data (features used, time spent)</li>
                  <li>Log data (access times, pages viewed)</li>
                  <li>Cookies and similar tracking technologies</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-serif text-gold-primary mb-4">3. How We Use Your Information</h2>
                <p className="text-pearl/80 mb-4">
                  We use the information we collect to:
                </p>
                <ul className="list-disc list-inside text-pearl/80 mb-4 space-y-2">
                  <li>Provide, maintain, and improve the Service</li>
                  <li>Process your transactions and manage subscriptions</li>
                  <li>Send you notifications, reminders, and updates</li>
                  <li>Respond to your comments and questions</li>
                  <li>Analyze usage patterns to improve user experience</li>
                  <li>Detect, prevent, and address technical issues and fraud</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-serif text-gold-primary mb-4">4. Data Security</h2>
                <p className="text-pearl/80 mb-4">
                  We implement industry-standard security measures to protect your data:
                </p>
                <ul className="list-disc list-inside text-pearl/80 mb-4 space-y-2">
                  <li>AES-256 encryption for data at rest</li>
                  <li>TLS/SSL encryption for data in transit</li>
                  <li>Secure authentication and authorization</li>
                  <li>Regular security audits and updates</li>
                  <li>Access controls and monitoring</li>
                  <li>Secure backup and disaster recovery procedures</li>
                </ul>
                <p className="text-pearl/80 mb-4">
                  While we strive to protect your data, no method of transmission over the Internet is 100% secure. We cannot guarantee absolute security.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-serif text-gold-primary mb-4">5. Data Sharing and Disclosure</h2>
                <p className="text-pearl/80 mb-4">
                  We do not sell your personal information. We may share your information in the following circumstances:
                </p>
                <ul className="list-disc list-inside text-pearl/80 mb-4 space-y-2">
                  <li><strong>With your consent:</strong> When you explicitly authorize us to share information</li>
                  <li><strong>With recipients:</strong> Content shared with designated recipients through the dead man's switch</li>
                  <li><strong>Service providers:</strong> Third-party vendors who help us operate the Service (e.g., hosting, payment processing)</li>
                  <li><strong>Legal requirements:</strong> When required by law or to protect our rights</li>
                  <li><strong>Business transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-serif text-gold-primary mb-4">6. Your Rights and Choices</h2>
                <p className="text-pearl/80 mb-4">
                  You have the following rights regarding your personal information:
                </p>
                <ul className="list-disc list-inside text-pearl/80 mb-4 space-y-2">
                  <li><strong>Access:</strong> Request a copy of your personal data</li>
                  <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                  <li><strong>Deletion:</strong> Request deletion of your account and data</li>
                  <li><strong>Export:</strong> Download your data in a portable format</li>
                  <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
                  <li><strong>Notification preferences:</strong> Manage your notification settings</li>
                </ul>
                <p className="text-pearl/80 mb-4">
                  To exercise these rights, please contact us at <a href="mailto:privacy@heirloom.app" className="text-gold-primary hover:text-gold-secondary">privacy@heirloom.app</a> or visit your <Link href="/app/settings" className="text-gold-primary hover:text-gold-secondary">account settings</Link>.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-serif text-gold-primary mb-4">7. GDPR Compliance (EU Users)</h2>
                <p className="text-pearl/80 mb-4">
                  If you are located in the European Economic Area (EEA), you have additional rights under the General Data Protection Regulation (GDPR):
                </p>
                <ul className="list-disc list-inside text-pearl/80 mb-4 space-y-2">
                  <li>Right to data portability</li>
                  <li>Right to restrict processing</li>
                  <li>Right to object to processing</li>
                  <li>Right to lodge a complaint with a supervisory authority</li>
                </ul>
                <p className="text-pearl/80 mb-4">
                  Our legal basis for processing your data includes: consent, contract performance, legal obligations, and legitimate interests.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-serif text-gold-primary mb-4">8. Cookies and Tracking</h2>
                <p className="text-pearl/80 mb-4">
                  We use cookies and similar tracking technologies to:
                </p>
                <ul className="list-disc list-inside text-pearl/80 mb-4 space-y-2">
                  <li>Remember your preferences and settings</li>
                  <li>Authenticate your account</li>
                  <li>Analyze site traffic and usage patterns</li>
                  <li>Improve our Service</li>
                </ul>
                <p className="text-pearl/80 mb-4">
                  You can control cookies through your browser settings. Note that disabling cookies may affect Service functionality.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-serif text-gold-primary mb-4">9. Data Retention</h2>
                <p className="text-pearl/80 mb-4">
                  We retain your information for as long as necessary to:
                </p>
                <ul className="list-disc list-inside text-pearl/80 mb-4 space-y-2">
                  <li>Provide the Service to you</li>
                  <li>Comply with legal obligations</li>
                  <li>Resolve disputes and enforce agreements</li>
                </ul>
                <p className="text-pearl/80 mb-4">
                  When you delete your account, we will delete or anonymize your personal information within 30 days, except where we are required to retain it by law.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-serif text-gold-primary mb-4">10. Children's Privacy</h2>
                <p className="text-pearl/80 mb-4">
                  Heirloom is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-serif text-gold-primary mb-4">11. International Data Transfers</h2>
                <p className="text-pearl/80 mb-4">
                  Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your data in accordance with this Privacy Policy and applicable laws.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-serif text-gold-primary mb-4">12. Changes to This Policy</h2>
                <p className="text-pearl/80 mb-4">
                  We may update this Privacy Policy from time to time. We will notify you of any material changes by email or through the Service. The "Last updated" date at the top of this policy indicates when it was last revised.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-serif text-gold-primary mb-4">13. Contact Us</h2>
                <p className="text-pearl/80 mb-4">
                  If you have questions or concerns about this Privacy Policy or our data practices, please contact us:
                </p>
                <p className="text-pearl/80">
                  Email: <a href="mailto:privacy@heirloom.app" className="text-gold-primary hover:text-gold-secondary">privacy@heirloom.app</a><br />
                  Support: <Link href="/support" className="text-gold-primary hover:text-gold-secondary">Visit our Support Center</Link><br />
                  Data Protection Officer: <a href="mailto:dpo@heirloom.app" className="text-gold-primary hover:text-gold-secondary">dpo@heirloom.app</a>
                </p>
              </section>
            </div>
          </GoldCard>
        </motion.div>
      </div>
    </div>
  )
}
