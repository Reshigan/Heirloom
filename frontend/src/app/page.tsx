'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export default function MarketingPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/app');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold/10 rounded-full blur-3xl"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-5xl sm:text-6xl md:text-8xl font-serif font-bold mb-6 bg-gradient-to-r from-gold via-yellow-200 to-gold bg-clip-text text-transparent">
            Heirloom
          </h1>
          <p className="text-xl sm:text-2xl md:text-3xl mb-4 text-gold/90 font-light">
            Where Every Memory Becomes a Legacy
          </p>
          <p className="text-base sm:text-lg md:text-xl mb-12 text-gray-300 max-w-3xl mx-auto px-4">
            Preserve, discover, and share your family's most precious memories with AI-powered storytelling and emotional design.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center px-4">
            <button
              onClick={() => router.push('/app')}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-gold to-yellow-600 text-black font-semibold rounded-lg hover:scale-105 transition-transform duration-300 shadow-lg shadow-gold/50 touch-manipulation"
            >
              Start Your Journey
            </button>
            <button
              onClick={() => router.push('/app')}
              className="w-full sm:w-auto px-8 py-4 border-2 border-gold text-gold font-semibold rounded-lg hover:bg-gold/10 transition-colors duration-300 touch-manipulation"
            >
              View Demo
            </button>
          </div>
        </div>
      </section>

      {/* Why It Matters Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-black/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-center mb-12 sm:mb-16 text-gold">
            Why It Matters
          </h2>
          
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-12">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-gold to-yellow-600 rounded-full flex items-center justify-center text-3xl">
                ❤️
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gold">Emotional Connection</h3>
              <p className="text-sm sm:text-base text-gray-300">
                Every memory tells a story. Connect with your family's past and build bridges to the future through shared experiences.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-gold to-yellow-600 rounded-full flex items-center justify-center text-3xl">
                🔒
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gold">Privacy First</h3>
              <p className="text-sm sm:text-base text-gray-300">
                Your memories are encrypted and protected. Share only what you want, with whom you want, when you want.
              </p>
            </div>
            
            <div className="text-center sm:col-span-2 md:col-span-1">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-gold to-yellow-600 rounded-full flex items-center justify-center text-3xl">
                ✨
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gold">AI-Powered Insights</h3>
              <p className="text-sm sm:text-base text-gray-300">
                Discover emotional patterns, celebrate milestones, and understand your family's journey through intelligent sentiment analysis.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-center mb-12 sm:mb-16 text-gold">
            Choose Your Plan
          </h2>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Free Tier */}
            <div className="border border-gold/30 rounded-lg p-6 sm:p-8 hover:border-gold/60 transition-colors">
              <h3 className="text-xl sm:text-2xl font-semibold mb-4 text-gold">Free</h3>
              <p className="text-3xl sm:text-4xl font-bold mb-6">$0<span className="text-base sm:text-lg font-normal text-gray-400">/month</span></p>
              <ul className="space-y-2 sm:space-y-3 mb-8 text-sm sm:text-base text-gray-300">
                <li>✓ 100 MB storage</li>
                <li>✓ 10 media uploads/month</li>
                <li>✓ Up to 5 family members</li>
                <li>✓ Basic features</li>
              </ul>
              <button
                onClick={() => router.push('/app')}
                className="w-full px-6 py-3 border border-gold text-gold rounded-lg hover:bg-gold/10 transition-colors touch-manipulation"
              >
                Get Started
              </button>
            </div>

            {/* Premium Tier */}
            <div className="border-2 border-gold rounded-lg p-6 sm:p-8 relative sm:transform sm:scale-105 shadow-xl shadow-gold/20">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-gold to-yellow-600 text-black text-xs sm:text-sm font-semibold rounded-full">
                POPULAR
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold mb-4 text-gold">Premium</h3>
              <p className="text-3xl sm:text-4xl font-bold mb-6">$9<span className="text-base sm:text-lg font-normal text-gray-400">/month</span></p>
              <ul className="space-y-2 sm:space-y-3 mb-8 text-sm sm:text-base text-gray-300">
                <li>✓ 5 GB storage</li>
                <li>✓ 100 media uploads/month</li>
                <li>✓ Up to 15 family members</li>
                <li>✓ AI sentiment analysis</li>
                <li>✓ Time capsules</li>
                <li>✓ Export features</li>
              </ul>
              <button
                onClick={() => router.push('/app')}
                className="w-full px-6 py-3 bg-gradient-to-r from-gold to-yellow-600 text-black font-semibold rounded-lg hover:scale-105 transition-transform touch-manipulation"
              >
                Start Premium
              </button>
            </div>

            {/* Family Tier */}
            <div className="border border-gold/30 rounded-lg p-6 sm:p-8 hover:border-gold/60 transition-colors sm:col-span-2 lg:col-span-1">
              <h3 className="text-xl sm:text-2xl font-semibold mb-4 text-gold">Family</h3>
              <p className="text-3xl sm:text-4xl font-bold mb-6">$19<span className="text-base sm:text-lg font-normal text-gray-400">/month</span></p>
              <ul className="space-y-2 sm:space-y-3 mb-8 text-sm sm:text-base text-gray-300">
                <li>✓ 20 GB storage</li>
                <li>✓ Unlimited uploads</li>
                <li>✓ Unlimited family members</li>
                <li>✓ All Premium features</li>
                <li>✓ Priority support</li>
                <li>✓ Advanced AI features</li>
              </ul>
              <button
                onClick={() => router.push('/app')}
                className="w-full px-6 py-3 border border-gold text-gold rounded-lg hover:bg-gold/10 transition-colors touch-manipulation"
              >
                Go Family
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-gradient-to-b from-black to-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold mb-6 text-gold">
            Begin Your Family's Legacy Today
          </h2>
          <p className="text-lg sm:text-xl mb-12 text-gray-300 px-4">
            Join thousands of families preserving their most precious memories.
          </p>
          <button
            onClick={() => router.push('/app')}
            className="w-full sm:w-auto px-12 py-5 bg-gradient-to-r from-gold to-yellow-600 text-black text-base sm:text-lg font-semibold rounded-lg hover:scale-105 transition-transform duration-300 shadow-lg shadow-gold/50 touch-manipulation"
          >
            Start Free Today
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-12 px-4 sm:px-6 border-t border-gold/20">
        <div className="max-w-6xl mx-auto text-center text-sm sm:text-base text-gray-400">
          <p>&copy; 2024 Heirloom. Where Every Memory Becomes a Legacy.</p>
        </div>
      </footer>
    </div>
  );
}
