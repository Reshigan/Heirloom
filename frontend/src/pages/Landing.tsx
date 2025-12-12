import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Pen, Mic, Image, Shield, Clock, Heart } from 'lucide-react';
import { Logo } from '../components/Logo';

export function Landing() {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  
  return (
    <div className="min-h-screen bg-void">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 md:px-12 py-6">
        <div className="absolute inset-0 bg-gradient-to-b from-void/95 to-transparent" />
        <div className="relative flex items-center justify-between">
          <Logo size="md" />
          <div className="flex items-center gap-6">
            <Link to="/login" className="text-paper/60 hover:text-gold transition-colors">Sign In</Link>
            <Link to="/signup" className="btn btn-primary">Get Started</Link>
          </div>
        </div>
      </nav>
      
      {/* Hero */}
      <section className="min-h-screen flex items-center justify-center px-6 pt-24 relative overflow-hidden">
        <motion.div className="absolute w-[800px] h-[800px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(201, 169, 89, 0.1) 0%, transparent 60%)', top: '10%', left: '50%', x: '-50%' }} animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 10, repeat: Infinity }} />
        
        <div className="relative z-10 text-center max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="mb-6">
            <span className="text-gold/60 tracking-[0.3em] text-sm">PRESERVE WHAT MATTERS</span>
          </motion.div>
          
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }} className="text-5xl md:text-7xl font-light leading-tight mb-8">
            Your memories deserve to live <em className="text-gold">forever</em>
          </motion.h1>
          
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="text-xl text-paper/50 mb-12 max-w-2xl mx-auto">
            Capture photos, record your voice, write letters to loved ones. Delivered on your terms — even after you're gone.
          </motion.p>
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup" className="btn btn-primary flex items-center gap-2 justify-center">
              Start Your Legacy <ArrowRight size={18} />
            </Link>
            <Link to="#features" className="btn btn-secondary">Learn More</Link>
          </motion.div>
        </div>
        
        <motion.div style={{ opacity }} className="absolute bottom-12 left-1/2 -translate-x-1/2">
          <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity }} className="w-6 h-10 border border-paper/20 rounded-full flex justify-center pt-2">
            <div className="w-1 h-2 bg-gold rounded-full" />
          </motion.div>
        </motion.div>
      </section>
      
      {/* Features */}
      <section id="features" className="py-32 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <span className="text-gold/60 tracking-[0.3em] text-sm">FEATURES</span>
            <h2 className="text-4xl md:text-5xl font-light mt-4">Everything you need to preserve your legacy</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Image, title: 'Photo Memories', desc: 'Upload and organize photos with context and stories for each moment.' },
              { icon: Mic, title: 'Voice Recordings', desc: 'Record your voice with guided prompts. Your stories, your voice, forever.' },
              { icon: Pen, title: 'Letters', desc: 'Write heartfelt letters delivered immediately, on a date, or after you\'re gone.' },
              { icon: Clock, title: 'Scheduled Delivery', desc: 'Set exact dates for your messages to be delivered to loved ones.' },
              { icon: Shield, title: 'Legacy Verification', desc: 'Trusted contacts verify your passing before posthumous delivery.' },
              { icon: Heart, title: 'Family Sharing', desc: 'Create a family vault where memories live on for generations.' },
            ].map((feature, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }} className="card group hover:border-gold/20">
                <feature.icon className="w-10 h-10 text-gold/60 mb-4 group-hover:text-gold transition-colors" strokeWidth={1} />
                <h3 className="text-xl mb-2">{feature.title}</h3>
                <p className="text-paper/50">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Pricing */}
      <section className="py-32 px-6 md:px-12 bg-void-light">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <span className="text-gold/60 tracking-[0.3em] text-sm">PRICING</span>
            <h2 className="text-4xl md:text-5xl font-light mt-4">Simple, transparent pricing</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: 'Essential', price: '$2.99', period: '/month', features: ['100 memories', '30 min voice', '20 letters', '5 recipients'], popular: false },
              { name: 'Family', price: '$11.99', period: '/month', features: ['Unlimited memories', '60 min voice', 'Unlimited letters', 'Unlimited recipients', 'Priority support'], popular: true },
              { name: 'Legacy', price: '$299', period: '/year', features: ['Everything in Family', 'Unlimited voice', 'Professional archival', 'Dedicated support', 'Estate planning tools'], popular: false },
            ].map((plan, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }} className={`card relative ${plan.popular ? 'border-gold/30' : ''}`}>
                {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gold text-void text-xs tracking-wider">POPULAR</div>}
                <h3 className="text-xl mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl text-gold">{plan.price}</span>
                  <span className="text-paper/40">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, j) => <li key={j} className="text-paper/60 flex items-center gap-2"><span className="w-1 h-1 bg-gold rounded-full" />{f}</li>)}
                </ul>
                <Link to="/signup" className={`btn w-full text-center ${plan.popular ? 'btn-primary' : 'btn-secondary'}`}>Get Started</Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA */}
      <section className="py-32 px-6 md:px-12">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-light mb-6">Start preserving your legacy today</h2>
          <p className="text-xl text-paper/50 mb-12">Join thousands of families who trust Heirloom with their most precious memories.</p>
          <Link to="/signup" className="btn btn-primary inline-flex items-center gap-2">
            Create Your Vault <ArrowRight size={18} />
          </Link>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-12 px-6 md:px-12 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <Logo size="sm" />
          <div className="flex gap-8 text-sm text-paper/40">
            <Link to="/privacy" className="hover:text-gold">Privacy</Link>
            <Link to="/terms" className="hover:text-gold">Terms</Link>
            <Link to="/contact" className="hover:text-gold">Contact</Link>
          </div>
          <div className="text-sm text-paper/30">© 2025 Heirloom. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
