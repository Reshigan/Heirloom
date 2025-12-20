import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, Users, CreditCard, AlertTriangle, Scale, Mail } from '../components/Icons';

export function Terms() {
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
            <h1 className="text-4xl md:text-5xl font-light mb-4">Terms of Service</h1>
            <p className="text-paper/50 mb-12">Last updated: December 16, 2025</p>
            
            <div className="space-y-12">
              {/* Introduction */}
              <section className="card">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="text-gold" size={24} />
                  <h2 className="text-2xl font-light">Agreement to Terms</h2>
                </div>
                <p className="text-paper/70 leading-relaxed">
                  By accessing or using Heirloom ("the Service"), you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access the Service. These terms apply to all visitors, users, and others who access or use the Service.
                </p>
              </section>
              
              {/* Account Terms */}
              <section className="card">
                <div className="flex items-center gap-3 mb-4">
                  <Users className="text-gold" size={24} />
                  <h2 className="text-2xl font-light">Account Terms</h2>
                </div>
                <div className="space-y-4 text-paper/70 leading-relaxed">
                  <p><strong className="text-paper">Age Requirement:</strong> You must be at least 18 years old to use this Service. By using the Service, you represent that you are at least 18 years of age.</p>
                  <p><strong className="text-paper">Account Security:</strong> You are responsible for maintaining the security of your account and password. Heirloom cannot and will not be liable for any loss or damage from your failure to comply with this security obligation.</p>
                  <p><strong className="text-paper">Accurate Information:</strong> You must provide accurate, complete, and current information when creating your account. Failure to do so constitutes a breach of these Terms.</p>
                  <p><strong className="text-paper">One Account Per Person:</strong> You may not create multiple accounts. Each person may only have one account.</p>
                </div>
              </section>
              
              {/* Subscription & Payments */}
              <section className="card">
                <div className="flex items-center gap-3 mb-4">
                  <CreditCard className="text-gold" size={24} />
                  <h2 className="text-2xl font-light">Subscription & Payments</h2>
                </div>
                <div className="space-y-4 text-paper/70 leading-relaxed">
                  <p><strong className="text-paper">Free Trial:</strong> New users receive a 14-day free trial. No credit card is required to start your trial.</p>
                  <p><strong className="text-paper">Billing:</strong> Paid subscriptions are billed in advance on a monthly or yearly basis. You will be charged at the beginning of each billing period.</p>
                  <p><strong className="text-paper">Price Changes:</strong> We reserve the right to modify our prices. Any price changes will be communicated to you at least 30 days in advance.</p>
                  <p><strong className="text-paper">Refunds:</strong> We offer a 30-day money-back guarantee for new subscribers. After 30 days, refunds are provided at our discretion.</p>
                  <p><strong className="text-paper">Cancellation:</strong> You may cancel your subscription at any time. Your subscription will remain active until the end of your current billing period.</p>
                </div>
              </section>
              
              {/* Acceptable Use */}
              <section className="card">
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="text-gold" size={24} />
                  <h2 className="text-2xl font-light">Acceptable Use</h2>
                </div>
                <div className="space-y-4 text-paper/70 leading-relaxed">
                  <p>You agree not to use the Service to:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Upload, post, or transmit any content that is unlawful, harmful, threatening, abusive, harassing, defamatory, or otherwise objectionable</li>
                    <li>Impersonate any person or entity, or falsely state or misrepresent your affiliation with a person or entity</li>
                    <li>Upload content that infringes any patent, trademark, trade secret, copyright, or other proprietary rights</li>
                    <li>Interfere with or disrupt the Service or servers or networks connected to the Service</li>
                    <li>Attempt to gain unauthorized access to any portion of the Service or any other systems or networks</li>
                    <li>Use the Service for any illegal purpose or in violation of any local, state, national, or international law</li>
                  </ul>
                </div>
              </section>
              
              {/* Content Ownership */}
              <section className="card">
                <div className="flex items-center gap-3 mb-4">
                  <Scale className="text-gold" size={24} />
                  <h2 className="text-2xl font-light">Content Ownership & Rights</h2>
                </div>
                <div className="space-y-4 text-paper/70 leading-relaxed">
                  <p><strong className="text-paper">Your Content:</strong> You retain all rights to the content you upload to Heirloom. We do not claim ownership of your photos, voice recordings, letters, or any other content you create.</p>
                  <p><strong className="text-paper">License to Operate:</strong> By uploading content, you grant us a limited license to store, process, and transmit your content solely for the purpose of providing the Service to you.</p>
                  <p><strong className="text-paper">Encryption:</strong> Due to our zero-knowledge encryption, we cannot access, view, or modify your content. You are solely responsible for maintaining backups of your encryption keys.</p>
                  <p><strong className="text-paper">Posthumous Delivery:</strong> Content designated for posthumous delivery will be released to your designated beneficiaries according to your instructions and the verification process you have configured.</p>
                </div>
              </section>
              
              {/* Limitation of Liability */}
              <section className="card">
                <h2 className="text-2xl font-light mb-4">Limitation of Liability</h2>
                <div className="space-y-4 text-paper/70 leading-relaxed">
                  <p>In no event shall Heirloom, its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Your access to or use of or inability to access or use the Service</li>
                    <li>Any conduct or content of any third party on the Service</li>
                    <li>Any content obtained from the Service</li>
                    <li>Unauthorized access, use, or alteration of your transmissions or content</li>
                  </ul>
                </div>
              </section>
              
              {/* Changes to Terms */}
              <section className="card">
                <h2 className="text-2xl font-light mb-4">Changes to Terms</h2>
                <p className="text-paper/70 leading-relaxed">
                  We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.
                </p>
              </section>
              
              {/* Contact */}
              <section className="card">
                <div className="flex items-center gap-3 mb-4">
                  <Mail className="text-gold" size={24} />
                  <h2 className="text-2xl font-light">Contact Us</h2>
                </div>
                <p className="text-paper/70 leading-relaxed">
                  If you have questions about these Terms of Service, please contact us at{' '}
                  <a href="mailto:legal@heirloom.blue" className="text-gold hover:underline">legal@heirloom.blue</a>.
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
            <Link to="/privacy" className="hover:text-gold transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-gold transition-colors text-gold">Terms</Link>
            <Link to="/contact" className="hover:text-gold transition-colors">Contact</Link>
          </div>
          <div className="text-sm text-paper/30">
            © {new Date().getFullYear()} Heirloom. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
