'use client';

import { motion } from 'framer-motion';
import { Upload, Users, Clock, Image, MessageCircle, Shield, Cloud, Sparkles } from 'lucide-react';
import { LuxuryCard } from '@/components/ui/luxury-components';

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface FeaturesProps {
  onOpenModal?: (modalType: string) => void;
}

const features: Feature[] = [
  {
    id: 'upload',
    title: 'Memory Upload',
    description: 'Easily upload photos, videos, documents, and stories to preserve your family memories forever.',
    icon: Upload,
  },
  {
    id: 'family-tree',
    title: 'Interactive Family Tree',
    description: 'Build and explore your family connections with our intuitive, visual family tree interface.',
    icon: Users,
  },
  {
    id: 'timeline',
    title: 'Timeline View',
    description: 'Navigate through decades of family history with our chronological timeline experience.',
    icon: Clock,
  },
  {
    id: 'gallery',
    title: 'Memory Gallery',
    description: 'Browse through beautifully organized photo galleries and relive precious family moments.',
    icon: Image,
  },
  {
    id: 'social',
    title: 'Family Social Hub',
    description: 'Connect with family members, share stories, and collaborate on preserving your heritage.',
    icon: MessageCircle,
  },
  {
    id: 'security',
    title: 'Secure & Private',
    description: 'Your family memories are protected with enterprise-grade security and privacy controls.',
    icon: Shield,
  },
  {
    id: 'cloud',
    title: 'Cloud Storage',
    description: 'Access your memories from anywhere with reliable cloud storage and automatic backups.',
    icon: Cloud,
  },
  {
    id: 'ai',
    title: 'AI-Powered Insights',
    description: 'Discover connections and patterns in your family history with intelligent recommendations.',
    icon: Sparkles,
  }
];

export default function Features({ onOpenModal }: FeaturesProps) {
  return (
    <section className="relative z-10 py-20 bg-gradient-to-b from-transparent to-black/30">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-serif font-light text-pearl mb-6 tracking-wide">
            Powerful Features for
            <span className="block text-gold-400/80 mt-2">
              Your Family Legacy
            </span>
          </h2>
          <p className="text-pearl/60 text-xl max-w-3xl mx-auto leading-relaxed font-light">
            Everything you need to preserve, organize, and share your family's most precious memories
            with future generations.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <LuxuryCard
                hover
                onClick={() => onOpenModal?.(feature.id === 'gallery' ? 'memory-details' : feature.id)}
                className="h-full group"
              >
                {/* Feature Icon - Gold only, no rainbow gradients */}
                <motion.div 
                  className="w-16 h-16 rounded-full border border-gold-500/30 bg-gold-500/5 flex items-center justify-center mb-6 group-hover:border-gold-500/50 group-hover:bg-gold-500/10 transition-all duration-300"
                  whileHover={{ scale: 1.1 }}
                >
                  <feature.icon className="w-8 h-8 text-gold-400" />
                </motion.div>

                {/* Feature Content */}
                <h3 className="text-xl font-serif font-light text-pearl mb-3 tracking-wide group-hover:text-gold-400/90 transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-pearl/60 leading-relaxed font-light group-hover:text-pearl/80 transition-colors duration-300">
                  {feature.description}
                </p>
              </LuxuryCard>
            </motion.div>
          ))}
        </div>

        {/* Stats Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-20"
        >
          <LuxuryCard hover={false}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-serif text-gold-400 mb-2">1,247</div>
                <div className="text-pearl/50 text-sm uppercase tracking-[0.2em] font-light">Total Memories</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-serif text-gold-400 mb-2">23</div>
                <div className="text-pearl/50 text-sm uppercase tracking-[0.2em] font-light">Family Members</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-serif text-gold-400 mb-2">72</div>
                <div className="text-pearl/50 text-sm uppercase tracking-[0.2em] font-light">Years Covered</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-serif text-gold-400 mb-2">5.2k</div>
                <div className="text-pearl/50 text-sm uppercase tracking-[0.2em] font-light">Interactions</div>
              </div>
            </div>
          </LuxuryCard>
        </motion.div>
      </div>
    </section>
  );
}
