'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { GoldCard } from '@/components/gold-card'
import { Mail, MessageCircle, Book, HelpCircle } from 'lucide-react'
import Link from 'next/link'

export default function SupportPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Support request:', formData)
    setSubmitted(true)
    setTimeout(() => {
      setSubmitted(false)
      setFormData({ name: '', email: '', subject: '', message: '' })
    }, 3000)
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="luxury-bg" />
      <div className="elegant-grid" />
      
      <div className="relative z-10 container mx-auto px-4 py-12 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Link href="/" className="text-gold-primary hover:text-gold-secondary transition-colors mb-8 inline-block">
            ← Back to Home
          </Link>
          
          <h1 className="text-5xl md:text-6xl font-serif font-light text-gold-primary mb-4 tracking-wide">
            Support Center
          </h1>
          <p className="text-xl text-pearl/70 mb-12">
            We're here to help you preserve your precious memories
          </p>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Contact Options */}
            <div className="space-y-6">
              <GoldCard hover>
                <div className="flex items-start gap-4">
                  <Mail className="text-gold-primary mt-1" size={24} />
                  <div>
                    <h3 className="text-xl font-serif text-pearl mb-2">Email Support</h3>
                    <p className="text-pearl/70 mb-3">
                      Get help from our support team via email
                    </p>
                    <a 
                      href="mailto:support@heirloom.app"
                      className="text-gold-primary hover:text-gold-secondary transition-colors"
                    >
                      support@heirloom.app
                    </a>
                    <p className="text-sm text-pearl/50 mt-2">
                      Response time: Within 24 hours
                    </p>
                  </div>
                </div>
              </GoldCard>

              <GoldCard hover>
                <div className="flex items-start gap-4">
                  <MessageCircle className="text-gold-primary mt-1" size={24} />
                  <div>
                    <h3 className="text-xl font-serif text-pearl mb-2">Live Chat</h3>
                    <p className="text-pearl/70 mb-3">
                      Chat with our support team in real-time
                    </p>
                    <button className="text-gold-primary hover:text-gold-secondary transition-colors">
                      Start Chat (Coming Soon)
                    </button>
                    <p className="text-sm text-pearl/50 mt-2">
                      Available: Mon-Fri, 9am-5pm UTC
                    </p>
                  </div>
                </div>
              </GoldCard>

              <GoldCard hover>
                <div className="flex items-start gap-4">
                  <Book className="text-gold-primary mt-1" size={24} />
                  <div>
                    <h3 className="text-xl font-serif text-pearl mb-2">Documentation</h3>
                    <p className="text-pearl/70 mb-3">
                      Browse our comprehensive guides and tutorials
                    </p>
                    <Link 
                      href="/docs"
                      className="text-gold-primary hover:text-gold-secondary transition-colors"
                    >
                      View Documentation →
                    </Link>
                  </div>
                </div>
              </GoldCard>

              <GoldCard hover>
                <div className="flex items-start gap-4">
                  <HelpCircle className="text-gold-primary mt-1" size={24} />
                  <div>
                    <h3 className="text-xl font-serif text-pearl mb-2">FAQ</h3>
                    <p className="text-pearl/70 mb-3">
                      Find answers to commonly asked questions
                    </p>
                    <Link 
                      href="/faq"
                      className="text-gold-primary hover:text-gold-secondary transition-colors"
                    >
                      View FAQ →
                    </Link>
                  </div>
                </div>
              </GoldCard>
            </div>

            {/* Contact Form */}
            <GoldCard>
              <h2 className="text-2xl font-serif text-gold-primary mb-6">Send Us a Message</h2>
              
              {submitted ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gold-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="text-gold-primary" size={32} />
                  </div>
                  <p className="text-xl text-pearl mb-2">Message Sent!</p>
                  <p className="text-pearl/70">
                    We'll get back to you within 24 hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-pearl mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 bg-obsidian-light border border-gold-primary/20 rounded-lg text-pearl focus:outline-none focus:border-gold-primary transition-colors"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-pearl mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 bg-obsidian-light border border-gold-primary/20 rounded-lg text-pearl focus:outline-none focus:border-gold-primary transition-colors"
                    />
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-pearl mb-2">
                      Subject
                    </label>
                    <input
                      type="text"
                      id="subject"
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-4 py-3 bg-obsidian-light border border-gold-primary/20 rounded-lg text-pearl focus:outline-none focus:border-gold-primary transition-colors"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-pearl mb-2">
                      Message
                    </label>
                    <textarea
                      id="message"
                      required
                      rows={6}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3 bg-obsidian-light border border-gold-primary/20 rounded-lg text-pearl focus:outline-none focus:border-gold-primary transition-colors resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full px-6 py-3 bg-gradient-to-r from-gold-primary to-gold-secondary text-obsidian font-medium rounded-lg hover:shadow-lg hover:shadow-gold-primary/20 transition-all"
                  >
                    Send Message
                  </button>
                </form>
              )}
            </GoldCard>
          </div>

          {/* Additional Resources */}
          <GoldCard>
            <h2 className="text-2xl font-serif text-gold-primary mb-6">Additional Resources</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-lg font-medium text-pearl mb-2">Account & Billing</h3>
                <ul className="space-y-2 text-pearl/70">
                  <li><Link href="/docs/account" className="hover:text-gold-primary transition-colors">Managing your account</Link></li>
                  <li><Link href="/docs/billing" className="hover:text-gold-primary transition-colors">Subscription plans</Link></li>
                  <li><Link href="/docs/payments" className="hover:text-gold-primary transition-colors">Payment methods</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-medium text-pearl mb-2">Features</h3>
                <ul className="space-y-2 text-pearl/70">
                  <li><Link href="/docs/vault" className="hover:text-gold-primary transition-colors">Using your vault</Link></li>
                  <li><Link href="/docs/recipients" className="hover:text-gold-primary transition-colors">Managing recipients</Link></li>
                  <li><Link href="/docs/check-in" className="hover:text-gold-primary transition-colors">Check-in system</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-medium text-pearl mb-2">Privacy & Security</h3>
                <ul className="space-y-2 text-pearl/70">
                  <li><Link href="/privacy" className="hover:text-gold-primary transition-colors">Privacy Policy</Link></li>
                  <li><Link href="/terms" className="hover:text-gold-primary transition-colors">Terms of Service</Link></li>
                  <li><Link href="/docs/security" className="hover:text-gold-primary transition-colors">Security features</Link></li>
                </ul>
              </div>
            </div>
          </GoldCard>
        </motion.div>
      </div>
    </div>
  )
}
