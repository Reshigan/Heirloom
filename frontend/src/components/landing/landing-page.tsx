'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen">
      <header className="fixed top-0 left-0 right-0 z-50 bg-black-900/80 backdrop-blur-xl border-b border-black-500">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center border-2 border-gold-500 rounded-full">
              <span className="font-display text-xl text-gold-500">H</span>
            </div>
            <span className="font-display text-2xl text-gold-500">Heirloom</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-cream-300 hover:text-gold-500 transition-colors">Features</a>
            <a href="#pricing" className="text-sm text-cream-300 hover:text-gold-500 transition-colors">Pricing</a>
            <a href="#how-it-works" className="text-sm text-cream-300 hover:text-gold-500 transition-colors">How It Works</a>
          </nav>
          
          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden md:inline-flex btn btn-ghost">Log In</Link>
            <Link href="/signup" className="btn btn-primary">Get Started</Link>
          </div>
        </div>
      </header>

      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-gold-500/15 via-transparent to-transparent opacity-50" />
        
        <div className="relative z-10 max-w-4xl mx-auto animate-fade-in">
          <div className="w-24 h-24 mx-auto mb-8 flex items-center justify-center border-2 border-gold-500 rounded-full animate-pulse-gold">
            <span className="font-display text-5xl text-gold-500">H</span>
          </div>
          
          <h1 className="font-display text-6xl md:text-8xl font-light text-gold-500 mb-6 tracking-tight">
            Heirloom
          </h1>
          
          <p className="font-display text-2xl md:text-3xl text-cream-300 mb-4 italic">
            "One memory a week. A lifetime of legacy."
          </p>
          
          <p className="text-lg text-black-100 mb-10 max-w-2xl mx-auto">
            The private vault where you preserve what matters most —<br className="hidden md:inline" />
            and deliver it to loved ones when the time is right.
          </p>
          
          <div className="flex flex-col items-center gap-4">
            <Link href="/signup" className="btn btn-primary btn-xl">
              Reserve Your Vault
            </Link>
            <p className="text-sm text-black-100">
              Starting at <strong className="text-gold-500">$2.99/month</strong>
            </p>
          </div>
        </div>
        
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-black-200 text-sm animate-bounce">
          <span>Scroll to explore</span>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12l7 7 7-7"/>
          </svg>
        </div>
      </section>

      <section id="features" className="py-24 px-6 bg-black-850">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl text-cream-100 mb-4">
              Preserved While You Live.<br />Delivered When You're Gone.
            </h2>
            <p className="text-lg text-black-100 max-w-2xl mx-auto">
              The anti-Facebook for what truly matters. Private, intentional, and built for legacy.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card card-accent hover:transform hover:-translate-y-1 transition-all">
              <div className="text-5xl mb-4">🔐</div>
              <h3 className="font-display text-xl text-gold-500 mb-3">Private Vault</h3>
              <p className="text-base text-black-100 leading-relaxed">
                Photos, stories, and documents protected with end-to-end encryption. No algorithms, no feeds, no data mining.
              </p>
            </div>
            
            <div className="card card-accent hover:transform hover:-translate-y-1 transition-all">
              <div className="text-5xl mb-4">🎙️</div>
              <h3 className="font-display text-xl text-gold-500 mb-3">Voice Recordings</h3>
              <p className="text-base text-black-100 leading-relaxed">
                Record stories in your own voice. 5 minutes per week builds 21+ hours over 5 years. Automatic transcription included.
              </p>
            </div>
            
            <div className="card card-accent hover:transform hover:-translate-y-1 transition-all">
              <div className="text-5xl mb-4">💌</div>
              <h3 className="font-display text-xl text-gold-500 mb-3">After-I'm-Gone Letters</h3>
              <p className="text-base text-black-100 leading-relaxed">
                Write sealed letters delivered at life milestones — weddings, graduations, first child — or after verified death.
              </p>
            </div>
            
            <div className="card card-accent hover:transform hover:-translate-y-1 transition-all">
              <div className="text-5xl mb-4">👨‍👩‍👧‍👦</div>
              <h3 className="font-display text-xl text-gold-500 mb-3">Recipient Control</h3>
              <p className="text-base text-black-100 leading-relaxed">
                Designate exactly who receives what, and when. Legacy contact verification ensures your wishes are honored.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl text-cream-100 mb-4">Choose Your Legacy</h2>
            <p className="text-lg text-black-100 max-w-2xl mx-auto">
              Frequency-based pricing that grows with your story. Start free, upgrade anytime.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
            <div className="card text-center">
              <div className="text-sm font-medium text-black-100 uppercase tracking-wider mb-2">Free</div>
              <div className="font-display text-4xl text-cream-100 mb-1">$0</div>
              <div className="text-sm text-black-200 mb-6">forever</div>
              <ul className="text-left space-y-2 mb-6 text-sm">
                <li className="flex items-center gap-2 text-cream-300 border-b border-black-500 pb-2">
                  <span className="text-gold-500 font-bold">✓</span> 1 memory per month
                </li>
                <li className="flex items-center gap-2 text-cream-300 border-b border-black-500 pb-2">
                  <span className="text-gold-500 font-bold">✓</span> 2 min voice per month
                </li>
                <li className="flex items-center gap-2 text-cream-300 border-b border-black-500 pb-2">
                  <span className="text-gold-500 font-bold">✓</span> 1 after-I'm-gone letter
                </li>
                <li className="flex items-center gap-2 text-cream-300">
                  <span className="text-gold-500 font-bold">✓</span> 1 recipient
                </li>
              </ul>
              <Link href="/signup" className="btn btn-secondary w-full">Start Free</Link>
            </div>
            
            <div className="card card-featured text-center transform lg:scale-105">
              <div className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wide text-black-900 bg-gold-500 rounded-full mb-4">
                Most Popular
              </div>
              <div className="text-sm font-medium text-gold-500 uppercase tracking-wider mb-2">Essential</div>
              <div className="font-display text-4xl text-gold-500 mb-1">$2.99</div>
              <div className="text-sm text-black-200 mb-6">per month</div>
              <ul className="text-left space-y-2 mb-6 text-sm">
                <li className="flex items-center gap-2 text-cream-300 border-b border-black-500 pb-2">
                  <span className="text-gold-500 font-bold">✓</span> 1 memory per week
                </li>
                <li className="flex items-center gap-2 text-cream-300 border-b border-black-500 pb-2">
                  <span className="text-gold-500 font-bold">✓</span> 5 min voice per week
                </li>
                <li className="flex items-center gap-2 text-cream-300 border-b border-black-500 pb-2">
                  <span className="text-gold-500 font-bold">✓</span> 3 after-I'm-gone letters
                </li>
                <li className="flex items-center gap-2 text-cream-300">
                  <span className="text-gold-500 font-bold">✓</span> 5 recipients
                </li>
              </ul>
              <Link href="/signup" className="btn btn-primary w-full">Get Started</Link>
            </div>
            
            <div className="card text-center">
              <div className="text-sm font-medium text-black-100 uppercase tracking-wider mb-2">Plus</div>
              <div className="font-display text-4xl text-cream-100 mb-1">$5.99</div>
              <div className="text-sm text-black-200 mb-6">per month</div>
              <ul className="text-left space-y-2 mb-6 text-sm">
                <li className="flex items-center gap-2 text-cream-300 border-b border-black-500 pb-2">
                  <span className="text-gold-500 font-bold">✓</span> 3 memories per week
                </li>
                <li className="flex items-center gap-2 text-cream-300 border-b border-black-500 pb-2">
                  <span className="text-gold-500 font-bold">✓</span> 15 min voice per week
                </li>
                <li className="flex items-center gap-2 text-cream-300 border-b border-black-500 pb-2">
                  <span className="text-gold-500 font-bold">✓</span> 10 after-I'm-gone letters
                </li>
                <li className="flex items-center gap-2 text-cream-300">
                  <span className="text-gold-500 font-bold">✓</span> 15 recipients
                </li>
              </ul>
              <Link href="/signup" className="btn btn-secondary w-full">Get Started</Link>
            </div>
            
            <div className="card text-center">
              <div className="text-sm font-medium text-black-100 uppercase tracking-wider mb-2">Family</div>
              <div className="font-display text-4xl text-cream-100 mb-1">$11.99</div>
              <div className="text-sm text-black-200 mb-6">per month</div>
              <ul className="text-left space-y-2 mb-6 text-sm">
                <li className="flex items-center gap-2 text-cream-300 border-b border-black-500 pb-2">
                  <span className="text-gold-500 font-bold">✓</span> Daily memories
                </li>
                <li className="flex items-center gap-2 text-cream-300 border-b border-black-500 pb-2">
                  <span className="text-gold-500 font-bold">✓</span> 30 min voice per week
                </li>
                <li className="flex items-center gap-2 text-cream-300 border-b border-black-500 pb-2">
                  <span className="text-gold-500 font-bold">✓</span> Unlimited letters
                </li>
                <li className="flex items-center gap-2 text-cream-300">
                  <span className="text-gold-500 font-bold">✓</span> Unlimited recipients
                </li>
              </ul>
              <Link href="/signup" className="btn btn-secondary w-full">Get Started</Link>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-24 px-6 bg-black-850">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl text-cream-100 mb-4">How It Works</h2>
            <p className="text-lg text-black-100 max-w-2xl mx-auto">
              Building your legacy is as simple as one memory per week.
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-shrink-0 w-20 h-20 flex items-center justify-center font-display text-4xl font-semibold text-gold-500 border-2 border-gold-500 rounded-full">
                1
              </div>
              <div>
                <h3 className="font-display text-2xl text-cream-100 mb-3">Create Your Vault</h3>
                <p className="text-base text-black-100 leading-relaxed">
                  Sign up in 60 seconds. Your private, encrypted space is ready immediately. No credit card required to start.
                </p>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row-reverse items-center gap-8">
              <div className="flex-shrink-0 w-20 h-20 flex items-center justify-center font-display text-4xl font-semibold text-gold-500 border-2 border-gold-500 rounded-full">
                2
              </div>
              <div className="md:text-right">
                <h3 className="font-display text-2xl text-cream-100 mb-3">Add Memories Weekly</h3>
                <p className="text-base text-black-100 leading-relaxed">
                  Upload photos, write stories, or record your voice. The weekly rhythm builds a habit — and a treasure trove.
                </p>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-shrink-0 w-20 h-20 flex items-center justify-center font-display text-4xl font-semibold text-gold-500 border-2 border-gold-500 rounded-full">
                3
              </div>
              <div>
                <h3 className="font-display text-2xl text-cream-100 mb-3">Write Your Letters</h3>
                <p className="text-base text-black-100 leading-relaxed">
                  Craft messages for future milestones. Set delivery triggers: a wedding, a graduation, or after you're gone.
                </p>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row-reverse items-center gap-8">
              <div className="flex-shrink-0 w-20 h-20 flex items-center justify-center font-display text-4xl font-semibold text-gold-500 border-2 border-gold-500 rounded-full">
                4
              </div>
              <div className="md:text-right">
                <h3 className="font-display text-2xl text-cream-100 mb-3">Designate Recipients</h3>
                <p className="text-base text-black-100 leading-relaxed">
                  Choose who receives what, and when. Verify their contact information so your legacy reaches the right hands.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 text-center bg-gradient-to-b from-black-900 to-black-850">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display text-4xl md:text-5xl text-cream-100 mb-4">Your Legacy Starts Today</h2>
          <p className="text-lg text-black-100 mb-8">
            Don't let another memory fade. Start preserving what matters — for those who matter most.
          </p>
          <Link href="/signup" className="btn btn-primary btn-xl">
            Create Your Vault — Free
          </Link>
        </div>
      </section>

      <footer className="bg-black-950 border-t border-black-500 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 flex items-center justify-center border border-gold-500 rounded-full">
              <span className="font-display text-lg text-gold-500">H</span>
            </div>
            <span className="font-display text-xl text-gold-500">Heirloom</span>
          </div>
          
          <div className="flex items-center gap-6 text-sm">
            <Link href="/privacy" className="text-black-100 hover:text-gold-500 transition-colors">Privacy</Link>
            <Link href="/terms" className="text-black-100 hover:text-gold-500 transition-colors">Terms</Link>
            <Link href="/support" className="text-black-100 hover:text-gold-500 transition-colors">Security</Link>
            <Link href="/support" className="text-black-100 hover:text-gold-500 transition-colors">Contact</Link>
          </div>
          
          <div className="text-sm text-black-200">
            © 2025 Heirloom. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
