'use client';

import { Upload, Users, Clock, Image, MessageCircle, Shield, Cloud, Sparkles } from 'lucide-react';

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
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
    gradient: 'from-blue-500 to-purple-600'
  },
  {
    id: 'family-tree',
    title: 'Interactive Family Tree',
    description: 'Build and explore your family connections with our intuitive, visual family tree interface.',
    icon: Users,
    gradient: 'from-green-500 to-teal-600'
  },
  {
    id: 'timeline',
    title: 'Timeline View',
    description: 'Navigate through decades of family history with our chronological timeline experience.',
    icon: Clock,
    gradient: 'from-orange-500 to-red-600'
  },
  {
    id: 'gallery',
    title: 'Memory Gallery',
    description: 'Browse through beautifully organized photo galleries and relive precious family moments.',
    icon: Image,
    gradient: 'from-pink-500 to-rose-600'
  },
  {
    id: 'social',
    title: 'Family Social Hub',
    description: 'Connect with family members, share stories, and collaborate on preserving your heritage.',
    icon: MessageCircle,
    gradient: 'from-indigo-500 to-blue-600'
  },
  {
    id: 'security',
    title: 'Secure & Private',
    description: 'Your family memories are protected with enterprise-grade security and privacy controls.',
    icon: Shield,
    gradient: 'from-emerald-500 to-green-600'
  },
  {
    id: 'cloud',
    title: 'Cloud Storage',
    description: 'Access your memories from anywhere with reliable cloud storage and automatic backups.',
    icon: Cloud,
    gradient: 'from-cyan-500 to-blue-600'
  },
  {
    id: 'ai',
    title: 'AI-Powered Insights',
    description: 'Discover connections and patterns in your family history with intelligent recommendations.',
    icon: Sparkles,
    gradient: 'from-violet-500 to-purple-600'
  }
];

export default function Features({ onOpenModal }: FeaturesProps) {
  return (
    <section className="relative z-10 py-20 bg-gradient-to-b from-transparent to-black/30">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-gold mb-6">
            Powerful Features for
            <span className="block bg-gradient-to-r from-gold via-yellow-400 to-gold bg-clip-text text-transparent">
              Your Family Legacy
            </span>
          </h2>
          <p className="text-gold/80 text-xl max-w-3xl mx-auto leading-relaxed">
            Everything you need to preserve, organize, and share your family's most precious memories
            with future generations.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.id}
              className="group relative bg-glass-bg backdrop-blur-lg border border-glass-border rounded-2xl p-6 hover:border-gold/30 transition-all duration-300 hover:scale-105 cursor-pointer"
              onClick={() => onOpenModal?.(feature.id === 'gallery' ? 'memory-details' : feature.id)}
            >
              {/* Feature Icon */}
              <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-8 h-8 text-white" />
              </div>

              {/* Feature Content */}
              <h3 className="text-xl font-display font-bold text-gold mb-3 group-hover:text-yellow-400 transition-colors duration-300">
                {feature.title}
              </h3>
              <p className="text-gold/70 leading-relaxed group-hover:text-gold/90 transition-colors duration-300">
                {feature.description}
              </p>

              {/* Hover Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="mt-20 bg-glass-bg backdrop-blur-lg border border-glass-border rounded-2xl p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-gold mb-2">1,247</div>
              <div className="text-gold/60 text-sm uppercase tracking-wide">Total Memories</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-gold mb-2">23</div>
              <div className="text-gold/60 text-sm uppercase tracking-wide">Family Members</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-gold mb-2">72</div>
              <div className="text-gold/60 text-sm uppercase tracking-wide">Years Covered</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-gold mb-2">5.2k</div>
              <div className="text-gold/60 text-sm uppercase tracking-wide">Interactions</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}