import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, X, ArrowRight, Mic, Clock, Lock } from '../components/Icons';
import { Logo } from '../components/Logo';

const features = [
  { name: 'Voice Recording', heirloom: true, storyworth: false },
  { name: 'Photo & Video Storage', heirloom: true, storyworth: true },
  { name: 'Written Letters', heirloom: true, storyworth: true },
  { name: 'Zero-Knowledge Encryption', heirloom: true, storyworth: false },
  { name: 'Dead Man\'s Switch', heirloom: true, storyworth: false },
  { name: 'Time Capsules', heirloom: true, storyworth: false },
  { name: 'Interview Mode (AI)', heirloom: true, storyworth: false },
  { name: 'Family Activity Feed', heirloom: true, storyworth: false },
  { name: 'Printed Memory Book', heirloom: true, storyworth: true },
  { name: 'Weekly Prompts', heirloom: true, storyworth: true },
  { name: 'Memory Map', heirloom: true, storyworth: false },
  { name: 'Gift Subscriptions', heirloom: true, storyworth: true },
  { name: 'Legacy Score', heirloom: true, storyworth: false },
  { name: 'Posthumous Delivery', heirloom: true, storyworth: false },
  { name: 'Multi-Currency Pricing', heirloom: true, storyworth: false },
];

const testimonials = [
  {
    quote: 'Heirloom gives me peace of mind knowing my stories will reach my grandchildren even after I\'m gone.',
    author: 'Sarah M.',
    role: 'Mother of 3',
  },
  {
    quote: 'The encryption means my private letters stay private. No other platform offers this level of security.',
    author: 'James K.',
    role: 'Privacy Advocate',
  },
  {
    quote: 'Interview Mode helped my father tell stories he\'d never shared before. The AI follow-ups were magical.',
    author: 'Priya R.',
    role: 'Daughter & Storyteller',
  },
];

export function StoryWorthAlternative() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-void text-paper">
      {/* Header */}
      <header className="px-6 md:px-12 py-6 flex items-center justify-between max-w-7xl mx-auto">
        <Logo size="md" />
        <motion.button
          onClick={() => navigate('/signup')}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-gold to-gold-dim text-void font-medium text-sm"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Start Free Trial
        </motion.button>
      </header>

      {/* Hero */}
      <section className="px-6 md:px-12 py-16 md:py-24 max-w-4xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-serif text-4xl md:text-6xl text-paper mb-6 leading-tight">
            The Best StoryWorth Alternative<br />
            <span className="text-gold">for Families Who Want More</span>
          </h1>
          <p className="text-paper/70 text-lg md:text-xl max-w-2xl mx-auto mb-10 font-serif">
            StoryWorth captures stories. Heirloom preserves your entire legacy &mdash; 
            with voice recordings, zero-knowledge encryption, and posthumous delivery 
            that ensures your memories reach the right people at the right time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              onClick={() => navigate('/signup')}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-gold to-gold-dim text-void font-medium"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Start Your Free 14-Day Trial
              <ArrowRight size={18} />
            </motion.button>
            <button
              onClick={() => navigate('/')}
              className="px-8 py-4 rounded-xl border border-paper/20 text-paper/70 hover:text-paper hover:border-paper/40 transition-all"
            >
              Learn More
            </button>
          </div>
        </motion.div>
      </section>

      {/* Key differentiators */}
      <section className="px-6 md:px-12 py-16 max-w-5xl mx-auto">
        <h2 className="font-serif text-3xl text-center text-paper mb-12">
          Why Families Choose Heirloom Over StoryWorth
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Mic, title: 'Voice Recordings', desc: 'Preserve the sound of your voice, not just your words. Future generations deserve to hear you.' },
            { icon: Lock, title: 'Zero-Knowledge Encryption', desc: 'Your memories are encrypted on your device. Not even Heirloom can read them.' },
            { icon: Clock, title: 'Posthumous Delivery', desc: 'The Dead Man\'s Switch ensures your legacy reaches your loved ones when it matters most.' },
          ].map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-2xl border border-paper/10 p-6 text-center"
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-gold/10 flex items-center justify-center">
                <Icon size={28} className="text-gold" />
              </div>
              <h3 className="font-serif text-xl text-paper mb-2">{title}</h3>
              <p className="text-paper/70 text-sm">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Comparison table */}
      <section className="px-6 md:px-12 py-16 max-w-3xl mx-auto">
        <h2 className="font-serif text-3xl text-center text-paper mb-10">
          Feature-by-Feature Comparison
        </h2>
        <div className="glass rounded-2xl border border-paper/10 overflow-hidden">
          <div className="grid grid-cols-3 gap-4 p-4 border-b border-paper/10 text-sm font-medium">
            <span className="text-paper/65">Feature</span>
            <span className="text-center text-gold">Heirloom</span>
            <span className="text-center text-paper/65">StoryWorth</span>
          </div>
          {features.map(({ name, heirloom, storyworth }) => (
            <div key={name} className="grid grid-cols-3 gap-4 p-4 border-b border-paper/5 text-sm">
              <span className="text-paper/70">{name}</span>
              <span className="flex justify-center">
                {heirloom ? <Check size={18} className="text-green-400" /> : <X size={18} className="text-paper/20" />}
              </span>
              <span className="flex justify-center">
                {storyworth ? <Check size={18} className="text-paper/70" /> : <X size={18} className="text-paper/20" />}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-6 md:px-12 py-16 max-w-5xl mx-auto">
        <h2 className="font-serif text-3xl text-center text-paper mb-10">
          What Families Are Saying
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map(({ quote, author, role }, i) => (
            <motion.div
              key={author}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-2xl border border-paper/10 p-6"
            >
              <p className="text-paper/70 font-serif text-sm mb-4 italic">&ldquo;{quote}&rdquo;</p>
              <div>
                <p className="text-paper text-sm font-medium">{author}</p>
                <p className="text-paper/70 text-xs">{role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 md:px-12 py-20 max-w-3xl mx-auto text-center">
        <h2 className="font-serif text-3xl text-paper mb-4">
          Start Preserving Your Legacy Today
        </h2>
        <p className="text-paper/65 text-lg font-serif mb-8">
          14-day free trial. No credit card required.
        </p>
        <motion.button
          onClick={() => navigate('/signup')}
          className="inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-gradient-to-r from-gold to-gold-dim text-void font-medium text-lg"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Create Your Free Account
          <ArrowRight size={20} />
        </motion.button>
      </section>

      {/* Footer */}
      <footer className="px-6 md:px-12 py-8 border-t border-paper/10 text-center text-paper/65 text-sm">
        <p>&copy; {new Date().getFullYear()} Heirloom. Preserve what matters most.</p>
      </footer>
    </div>
  );
}

export default StoryWorthAlternative;
