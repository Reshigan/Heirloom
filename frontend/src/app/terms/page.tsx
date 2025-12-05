'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { GoldCard } from '@/components/gold-card'
import Link from 'next/link'

export default function TermsPage() {
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
            Terms of Service
          </h1>
          <p className="text-pearl/70 mb-8">Last updated: December 5, 2024</p>

          <GoldCard>
            <div className="prose prose-invert max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-serif text-gold-primary mb-4">1. Acceptance of Terms</h2>
                <p className="text-pearl/80 mb-4">
                  By accessing and using Heirloom ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these Terms of Service, please do not use the Service.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-serif text-gold-primary mb-4">2. Description of Service</h2>
                <p className="text-pearl/80 mb-4">
                  Heirloom is a digital memory preservation platform that allows users to securely store, organize, and share personal memories, photos, videos, and documents. The Service includes features such as:
                </p>
                <ul className="list-disc list-inside text-pearl/80 mb-4 space-y-2">
                  <li>Encrypted vault storage for memories and media</li>
                  <li>Dead man's switch functionality for legacy planning</li>
                  <li>Recipient and trusted contact management</li>
                  <li>Automated check-in reminders</li>
                  <li>AI-powered memory curation and organization</li>
                  <li>Notification and reminder systems</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-serif text-gold-primary mb-4">3. User Accounts</h2>
                <p className="text-pearl/80 mb-4">
                  To use the Service, you must create an account. You are responsible for:
                </p>
                <ul className="list-disc list-inside text-pearl/80 mb-4 space-y-2">
                  <li>Maintaining the confidentiality of your account credentials</li>
                  <li>All activities that occur under your account</li>
                  <li>Notifying us immediately of any unauthorized use</li>
                  <li>Ensuring your account information is accurate and up-to-date</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-serif text-gold-primary mb-4">4. Subscription and Payment</h2>
                <p className="text-pearl/80 mb-4">
                  Heirloom offers multiple subscription tiers with varying features and storage limits. By subscribing to a paid plan:
                </p>
                <ul className="list-disc list-inside text-pearl/80 mb-4 space-y-2">
                  <li>You authorize us to charge your payment method on a recurring basis</li>
                  <li>Subscriptions automatically renew unless cancelled</li>
                  <li>You may cancel your subscription at any time</li>
                  <li>Refunds are provided in accordance with our refund policy</li>
                  <li>We reserve the right to change pricing with 30 days notice</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-serif text-gold-primary mb-4">5. Content and Intellectual Property</h2>
                <p className="text-pearl/80 mb-4">
                  You retain all rights to the content you upload to Heirloom. By using the Service, you grant us a limited license to:
                </p>
                <ul className="list-disc list-inside text-pearl/80 mb-4 space-y-2">
                  <li>Store and process your content to provide the Service</li>
                  <li>Use AI and machine learning to enhance and organize your memories</li>
                  <li>Share your content with recipients you designate</li>
                </ul>
                <p className="text-pearl/80 mb-4">
                  We will never sell your personal content or use it for advertising purposes.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-serif text-gold-primary mb-4">6. Privacy and Data Security</h2>
                <p className="text-pearl/80 mb-4">
                  We take your privacy seriously. Your data is:
                </p>
                <ul className="list-disc list-inside text-pearl/80 mb-4 space-y-2">
                  <li>Encrypted at rest and in transit using industry-standard encryption</li>
                  <li>Stored securely on our servers</li>
                  <li>Protected by multiple layers of security</li>
                  <li>Subject to our Privacy Policy</li>
                </ul>
                <p className="text-pearl/80 mb-4">
                  Please review our <Link href="/privacy" className="text-gold-primary hover:text-gold-secondary">Privacy Policy</Link> for detailed information about how we collect, use, and protect your data.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-serif text-gold-primary mb-4">7. Dead Man's Switch</h2>
                <p className="text-pearl/80 mb-4">
                  Our dead man's switch feature allows you to designate recipients who will receive access to your vault if you fail to check in for an extended period. By using this feature:
                </p>
                <ul className="list-disc list-inside text-pearl/80 mb-4 space-y-2">
                  <li>You acknowledge that recipients will gain access to your content</li>
                  <li>You are responsible for keeping your check-in schedule</li>
                  <li>We will make reasonable efforts to notify you before vault release</li>
                  <li>You can cancel the release process during the grace period</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-serif text-gold-primary mb-4">8. Prohibited Uses</h2>
                <p className="text-pearl/80 mb-4">
                  You agree not to use the Service to:
                </p>
                <ul className="list-disc list-inside text-pearl/80 mb-4 space-y-2">
                  <li>Upload illegal, harmful, or offensive content</li>
                  <li>Violate any laws or regulations</li>
                  <li>Infringe on intellectual property rights</li>
                  <li>Harass, abuse, or harm others</li>
                  <li>Distribute malware or viruses</li>
                  <li>Attempt to gain unauthorized access to our systems</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-serif text-gold-primary mb-4">9. Termination</h2>
                <p className="text-pearl/80 mb-4">
                  We reserve the right to suspend or terminate your account if:
                </p>
                <ul className="list-disc list-inside text-pearl/80 mb-4 space-y-2">
                  <li>You violate these Terms of Service</li>
                  <li>Your account is inactive for an extended period</li>
                  <li>We are required to do so by law</li>
                  <li>We discontinue the Service</li>
                </ul>
                <p className="text-pearl/80 mb-4">
                  Upon termination, you may request a copy of your data within 30 days.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-serif text-gold-primary mb-4">10. Limitation of Liability</h2>
                <p className="text-pearl/80 mb-4">
                  To the maximum extent permitted by law, Heirloom shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-serif text-gold-primary mb-4">11. Changes to Terms</h2>
                <p className="text-pearl/80 mb-4">
                  We may update these Terms of Service from time to time. We will notify you of any material changes by email or through the Service. Your continued use of the Service after such changes constitutes acceptance of the new terms.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-serif text-gold-primary mb-4">12. Contact Us</h2>
                <p className="text-pearl/80 mb-4">
                  If you have any questions about these Terms of Service, please contact us at:
                </p>
                <p className="text-pearl/80">
                  Email: <a href="mailto:support@heirloom.app" className="text-gold-primary hover:text-gold-secondary">support@heirloom.app</a><br />
                  Support: <Link href="/support" className="text-gold-primary hover:text-gold-secondary">Visit our Support Center</Link>
                </p>
              </section>
            </div>
          </GoldCard>
        </motion.div>
      </div>
    </div>
  )
}
