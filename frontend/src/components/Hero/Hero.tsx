'use client';

import { Search } from 'lucide-react';
import SearchFilter from '@/components/search-filter';

interface HeroProps {
  onOpenModal?: (modalType: string) => void;
}

export default function Hero({ onOpenModal }: HeroProps) {
  return (
    <section className="relative z-10 bg-gradient-to-b from-black/50 to-transparent">
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Hero Content */}
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-6xl font-display font-bold text-gold mb-6 leading-tight">
              Preserve Your Family
              <span className="block bg-gradient-to-r from-gold via-yellow-400 to-gold bg-clip-text text-transparent">
                Legacy Forever
              </span>
            </h2>
            <p className="text-gold/80 text-xl md:text-2xl mb-8 max-w-3xl mx-auto leading-relaxed">
              Discover your family stories, explore your heritage, and create lasting memories 
              for future generations with our revolutionary digital heirloom platform.
            </p>
            
            {/* Call to Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <button
                onClick={() => onOpenModal?.('upload')}
                className="bg-secondary-gradient text-black px-8 py-4 rounded-xl font-semibold text-lg hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-gold/25"
              >
                Start Your Journey
              </button>
              <button
                onClick={() => onOpenModal?.('family-tree')}
                className="border border-gold-500/30 text-gold px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gold-500/10 transition-all duration-300"
              >
                Explore Family Tree
              </button>
            </div>
          </div>

          {/* Search Section */}
          <div className="bg-glass-bg backdrop-blur-lg border border-glass-border rounded-2xl p-8">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-display font-bold text-gold mb-3">
                Discover Your Family Stories
              </h3>
              <p className="text-gold/80 text-lg">
                Search through memories, explore your family tree, and relive precious moments
              </p>
            </div>
            <SearchFilter />
          </div>
        </div>
      </div>
    </section>
  );
}