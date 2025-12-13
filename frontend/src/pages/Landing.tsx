import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { ArrowRight, Pen, Mic, Image, Shield, Clock, Heart, Lock, Users, Sparkles, Check } from 'lucide-react';

export function Landing() {
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const pricingRef = useRef(null);
  
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.15], [0, -50]);
  
  const featuresInView = useInView(featuresRef, { once: true, margin: "-100px" });
  const pricingInView = useInView(pricingRef, { once: true, margin: "-100px" });
  
  const features = [
    { icon: Image, title: 'Memory Vault', desc: 'Upload and organize photos with context and stories for each moment. End-to-end encrypted.' },
    { icon: Mic, title: 'Voice Stories', desc: 'Record your voice with guided prompts. Your stories, your voice, preserved forever.' },
    { icon: Pen, title: 'Time-Capsule Letters', desc: 'Write letters delivered immediately, on a specific date, or after you\'re gone.' },
    { icon: Sparkles, title: 'AI Writing Assistant', desc: 'Local AI helps you find the right words for letters, captions, and voice story ideas. 100% private.' },
    { icon: Clock, title: 'Year Wrapped', desc: 'Spotify-style annual review of your legacy journey. See your emotions, memories, and milestones.' },
    { icon: Users, title: 'Family Constellation', desc: 'Connect your loved ones and designate legacy recipients in your family tree.' },
    { icon: Shield, title: 'Legacy Contacts', desc: 'Trusted contacts verify your passing before posthumous content delivery.' },
    { icon: Lock, title: 'E2E Encryption', desc: 'Zero-knowledge architecture. Only you and your beneficiaries can decrypt.' },
  ];
  
  const plans = [
    { 
      name: 'Essential', 
      price: '$2.99', 
      period: '/month',
      features: ['100 memories', '30 min voice', '20 letters', '5 recipients', '1GB storage'],
      popular: false 
    },
    { 
      name: 'Family', 
      price: '$11.99', 
      period: '/month',
      features: ['Unlimited memories', '60 min voice', 'Unlimited letters', 'Unlimited recipients', '10GB storage', 'Priority support'],
      popular: true 
    },
    { 
      name: 'Legacy', 
      price: '$299', 
      period: '/year',
      features: ['Everything in Family', 'Unlimited voice', 'Professional archival', '100GB storage', 'Estate planning tools', 'Dedicated support'],
      popular: false 
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Sanctuary Background */}
      <div className="sanctuary-bg">
        <div className="sanctuary-orb sanctuary-orb-1" />
        <div className="sanctuary-orb sanctuary-orb-2" />
        <div className="sanctuary-orb sanctuary-orb-3" />
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
      
      {/* Hero */}
      <section ref={heroRef} className="min-h-screen flex items-center justify-center px-6 pt-24 relative">
        <motion.div 
          className="text-center max-w-4xl relative z-10"
          style={{ opacity: heroOpacity, y: heroY }}
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 glass-subtle rounded-full mb-8">
              <Sparkles size={16} className="text-gold" />
              <span className="text-sm text-paper/60 tracking-wider">14-DAY FREE TRIAL</span>
            </div>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-light leading-[1.1] mb-8"
          >
            Your memories deserve
            <br />
            to live <em className="relative">
              forever
              <motion.span
                className="absolute -bottom-2 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1, delay: 0.8 }}
              />
            </em>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="text-xl md:text-2xl text-paper/50 mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            A sanctuary for your life's precious moments. Capture photos, record your voice, 
            write letters to loved ones — delivered on your terms, even after you're gone.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to="/signup" className="btn btn-primary text-lg px-8 py-4 group">
              Begin Your Legacy
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href="#features" className="btn btn-secondary text-lg px-8 py-4">
              Discover More
            </a>
          </motion.div>
          
          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-8 mt-16 text-paper/40"
          >
            {[
              { icon: Lock, text: 'E2E Encrypted' },
              { icon: Shield, text: 'Zero Knowledge' },
              { icon: Users, text: '10K+ Families' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2">
                <Icon size={18} />
                <span className="text-sm">{text}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
        
        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-12 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <motion.div
            className="w-6 h-10 border border-paper/20 rounded-full flex justify-center pt-2"
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <motion.div
              className="w-1 h-2 bg-gold rounded-full"
              animate={{ y: [0, 8, 0], opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
        </motion.div>
      </section>
      
      {/* Features */}
      <section ref={featuresRef} id="features" className="py-32 px-6 md:px-12 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <span className="text-gold tracking-[0.3em] text-sm">FEATURES</span>
            <h2 className="text-4xl md:text-5xl font-light mt-4">
              Everything you need to preserve your legacy
            </h2>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 40 }}
                animate={featuresInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="card group"
              >
                <div className="w-14 h-14 glass rounded-xl flex items-center justify-center mb-5 group-hover:bg-gold/10 transition-colors">
                  <feature.icon size={24} className="text-gold/70 group-hover:text-gold transition-colors" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-medium mb-3">{feature.title}</h3>
                <p className="text-paper/50 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* How it works */}
      <section className="py-32 px-6 md:px-12 relative">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <span className="text-gold tracking-[0.3em] text-sm">HOW IT WORKS</span>
            <h2 className="text-4xl md:text-5xl font-light mt-4">Simple. Secure. Forever.</h2>
          </div>
          
          <div className="space-y-0">
            {[
              { step: '01', title: 'Create Your Sanctuary', desc: 'Sign up and set up your encrypted vault. Your content is protected from the moment it\'s created.' },
              { step: '02', title: 'Preserve Your Memories', desc: 'Upload photos, record voice messages, write letters. Every moment is encrypted before leaving your device.' },
              { step: '03', title: 'Set Your Wishes', desc: 'Choose when and how your content is delivered. Immediately, on a specific date, or after you\'re gone.' },
              { step: '04', title: 'Rest Assured', desc: 'The dead man\'s switch monitors your check-ins. Your legacy contacts verify your passing before release.' },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6 }}
                className={`flex items-start gap-8 ${i % 2 === 0 ? '' : 'flex-row-reverse text-right'}`}
              >
                <div className={`flex-shrink-0 w-20 h-20 rounded-full glass flex items-center justify-center ${i % 2 === 0 ? '' : 'ml-auto'}`}>
                  <span className="text-2xl text-gold font-light">{item.step}</span>
                </div>
                <div className="flex-1 pb-16 border-l border-gold/20 pl-8" style={{ marginLeft: i % 2 === 0 ? 0 : 'auto', marginRight: i % 2 === 0 ? 'auto' : 0 }}>
                  <h3 className="text-2xl font-light mb-2">{item.title}</h3>
                  <p className="text-paper/50">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Pricing */}
      <section ref={pricingRef} id="pricing" className="py-32 px-6 md:px-12 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-void-light/50 to-transparent" />
        
        <div className="max-w-6xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={pricingInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <span className="text-gold tracking-[0.3em] text-sm">PRICING</span>
            <h2 className="text-4xl md:text-5xl font-light mt-4">Simple, transparent pricing</h2>
            <p className="text-paper/50 mt-4">Start with a 14-day free trial. No credit card required.</p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 40 }}
                animate={pricingInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className={`card relative ${plan.popular ? 'border-gold/30 scale-105' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 bg-gold text-void text-xs tracking-wider rounded-full font-medium">
                      MOST POPULAR
                    </span>
                  </div>
                )}
                
                <h3 className="text-xl font-medium mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl text-gold">{plan.price}</span>
                  <span className="text-paper/40">{plan.period}</span>
                </div>
                
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-paper/70">
                      <Check size={16} className="text-gold flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <Link
                  to="/signup"
                  className={`btn w-full justify-center ${plan.popular ? 'btn-primary' : 'btn-secondary'}`}
                >
                  Start Free Trial
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA */}
      <section className="py-32 px-6 md:px-12 relative">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="w-20 h-20 mx-auto mb-8 rounded-full glass flex items-center justify-center animate-glow">
              <Heart size={32} className="text-gold" />
            </div>
            <h2 className="text-4xl md:text-5xl font-light mb-6">
              Your stories matter. Preserve them.
            </h2>
            <p className="text-xl text-paper/50 mb-12">
              Join thousands of families who trust Heirloom with their most precious memories.
            </p>
            <Link to="/signup" className="btn btn-primary text-lg px-10 py-5 group">
              Start Your Legacy Today
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-12 px-6 md:px-12 border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="text-xl text-gold">∞</span>
            <span className="tracking-[0.15em] text-paper/60">HEIRLOOM</span>
          </div>
          <div className="flex gap-8 text-sm text-paper/40">
            <Link to="/privacy" className="hover:text-gold transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-gold transition-colors">Terms</Link>
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
