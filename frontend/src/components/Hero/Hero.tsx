'use client';

import { motion } from 'framer-motion';
import SearchFilter from '@/components/search-filter';
import { LuxuryButton } from '@/components/ui/luxury-components';

interface HeroProps {
  onOpenModal?: (modalType: string) => void;
}

export default function Hero({ onOpenModal }: HeroProps) {
  return (
    <section className="relative z-10 bg-gradient-to-b from-black/50 to-transparent">
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Hero Content */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            className="text-center mb-12"
          >
            {/* Decorative line */}
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: '100px' }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="h-px bg-gradient-to-r from-transparent via-gold-500/40 to-transparent mx-auto mb-8"
            />
            
            <h2 className="text-4xl md:text-6xl font-serif font-light text-pearl mb-6 leading-tight tracking-wide">
              Preserve Your Family
              <span className="block text-gold-400/80 mt-2">
                Legacy Forever
              </span>
            </h2>
            <p className="text-pearl/60 text-xl md:text-2xl mb-8 max-w-3xl mx-auto leading-relaxed font-light">
              Discover your family stories, explore your heritage, and create lasting memories 
              for future generations with our revolutionary digital heirloom platform.
            </p>
            
            {/* Call to Action Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
            >
              <LuxuryButton
                variant="primary"
                size="lg"
                onClick={() => onOpenModal?.('upload')}
              >
                Start Your Journey
              </LuxuryButton>
              <LuxuryButton
                variant="secondary"
                size="lg"
                onClick={() => onOpenModal?.('family-tree')}
              >
                Explore Family Tree
              </LuxuryButton>
            </motion.div>
            
            {/* Decorative line */}
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: '100px' }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="h-px bg-gradient-to-r from-transparent via-gold-500/40 to-transparent mx-auto"
            />
          </motion.div>

          {/* Search Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="bg-charcoal/60 backdrop-blur-xl border border-gold-500/15 rounded-2xl p-8"
          >
            <div className="text-center mb-6">
              <h3 className="text-2xl font-serif font-light text-pearl mb-3 tracking-wide">
                Discover Your Family Stories
              </h3>
              <p className="text-pearl/60 text-lg font-light">
                Search through memories, explore your family tree, and relive precious moments
              </p>
            </div>
            <SearchFilter />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
