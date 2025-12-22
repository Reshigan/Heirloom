import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Lock, Eye, Server, Trash2, Mail } from '../components/Icons';

export function Privacy() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Sanctuary Background */}
      <div className="sanctuary-bg">
        <div className="sanctuary-orb sanctuary-orb-1" />
        <div className="sanctuary-orb sanctuary-orb-2" />
        <div className="sanctuary-stars" />
        <div className="sanctuary-mist" />
      </div>
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50">
        <div className="absolute inset-0 glass-subtle border-b border-white/[0.04]" />
        <div className="relative max-w-7xl mx-auto px-6 md:px-12 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <motion.span 
              className="text-2xl text-gold"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            >
              ∞
            </motion.span>
            <span className="text-lg tracking-[0.2em] text-paper/80">HEIRLOOM</span>
          </Link>
          
          <div className="flex items-center gap-6">
            <Link to="/login" className="text-paper/60 hover:text-gold transition-colors hidden md:block">
              Sign In
            </Link>
            <Link to="/signup" className="btn btn-primary">
              Start Free Trial
            </Link>
          </div>
        </div>
      </nav>
      
      {/* Content */}
      <main className="pt-32 pb-20 px-6 md:px-12">
        <div className="max-w-4xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-2 text-paper/50 hover:text-gold transition-colors mb-8">
            <ArrowLeft size={18} />
            Back to Home
          </Link>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl font-light mb-4">Privacy Policy</h1>
            <p className="text-paper/50 mb-12">Last updated: December 16, 2025</p>
            
            <div className="space-y-12">
              {/* Introduction */}
              <section className="card">
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="text-gold" size={24} />
                  <h2 className="text-2xl font-light">Our Commitment to Privacy</h2>
                </div>
                <p className="text-paper/70 leading-relaxed">
                  At Heirloom, we believe your memories are sacred. We've built our platform with privacy as a fundamental principle, not an afterthought. This policy explains how we protect your data and respect your privacy rights.
                </p>
              </section>
              
              {/* Data Collection */}
              <section className="card">
                <div className="flex items-center gap-3 mb-4">
                  <Eye className="text-gold" size={24} />
                  <h2 className="text-2xl font-light">Information We Collect</h2>
                </div>
                <div className="space-y-4 text-paper/70 leading-relaxed">
                  <p><strong className="text-paper">Account Information:</strong> When you create an account, we collect your email address, name, and password (which is hashed and never stored in plain text).</p>
                  <p><strong className="text-paper">Content You Create:</strong> Photos, voice recordings, letters, and other content you upload are encrypted on your device before transmission. We cannot read or access this content.</p>
                  <p><strong className="text-paper">Usage Data:</strong> We collect anonymized usage statistics to improve our service, such as feature usage patterns and performance metrics.</p>
                  <p><strong className="text-paper">Payment Information:</strong> Payment processing is handled by Stripe. We never store your full credit card number.</p>
                </div>
              </section>
              
              {/* Encryption */}
              <section className="card">
                <div className="flex items-center gap-3 mb-4">
                  <Lock className="text-gold" size={24} />
                  <h2 className="text-2xl font-light">Military-Grade Encryption</h2>
                </div>
                <div className="space-y-4 text-paper/70 leading-relaxed">
                  <p><strong className="text-paper">AES-256 Encryption:</strong> All your content is encrypted using AES-256, the same standard used by the U.S. government for classified information.</p>
                  <p><strong className="text-paper">Zero-Knowledge Architecture:</strong> Your encryption keys are derived from your password and never leave your device. We cannot decrypt your content, even if compelled by law enforcement.</p>
                  <p><strong className="text-paper">End-to-End Encryption:</strong> Data is encrypted before leaving your device and can only be decrypted by you or your designated beneficiaries.</p>
                </div>
              </section>
              
              {/* Data Storage */}
              <section className="card">
                <div className="flex items-center gap-3 mb-4">
                  <Server className="text-gold" size={24} />
                  <h2 className="text-2xl font-light">Data Storage & Security</h2>
                </div>
                <div className="space-y-4 text-paper/70 leading-relaxed">
                  <p><strong className="text-paper">Secure Infrastructure:</strong> Your data is stored on Cloudflare's global network with enterprise-grade security, redundancy, and 99.99% uptime.</p>
                  <p><strong className="text-paper">Geographic Distribution:</strong> Data is replicated across multiple secure data centers to ensure availability and disaster recovery.</p>
                  <p><strong className="text-paper">Regular Audits:</strong> We conduct regular security audits and penetration testing to identify and address vulnerabilities.</p>
                </div>
              </section>
              
              {/* Data Deletion */}
              <section className="card">
                <div className="flex items-center gap-3 mb-4">
                  <Trash2 className="text-gold" size={24} />
                  <h2 className="text-2xl font-light">Your Rights & Data Deletion</h2>
                </div>
                <div className="space-y-4 text-paper/70 leading-relaxed">
                  <p><strong className="text-paper">Access Your Data:</strong> You can export all your data at any time from your account settings.</p>
                  <p><strong className="text-paper">Delete Your Data:</strong> You can delete your account and all associated data at any time. Deletion is permanent and irreversible.</p>
                  <p><strong className="text-paper">GDPR Compliance:</strong> We comply with GDPR and respect your rights to access, rectification, erasure, and data portability.</p>
                  <p><strong className="text-paper">CCPA Compliance:</strong> California residents have additional rights under CCPA, including the right to know what data we collect and the right to opt-out of data sales (we don't sell data).</p>
                </div>
              </section>
              
              {/* Contact */}
              <section className="card">
                <div className="flex items-center gap-3 mb-4">
                  <Mail className="text-gold" size={24} />
                  <h2 className="text-2xl font-light">Contact Us</h2>
                </div>
                <p className="text-paper/70 leading-relaxed">
                  If you have questions about this privacy policy or your data, please contact us at{' '}
                  <a href="mailto:privacy@heirloom.blue" className="text-gold hover:underline">privacy@heirloom.blue</a>.
                </p>
              </section>
            </div>
          </motion.div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="py-12 px-6 md:px-12 border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="text-xl text-gold">∞</span>
            <span className="tracking-[0.15em] text-paper/60">HEIRLOOM</span>
          </div>
          <div className="flex gap-8 text-sm text-paper/40">
            <Link to="/privacy" className="hover:text-gold transition-colors text-gold">Privacy</Link>
            <Link to="/terms" className="hover:text-gold transition-colors">Terms</Link>
            <a href="mailto:support@heirloom.blue" className="hover:text-gold transition-colors">Contact</a>
          </div>
          <div className="text-sm text-paper/30">
            © {new Date().getFullYear()} Heirloom. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
