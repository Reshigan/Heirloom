'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';

interface Testimonial {
  id: string;
  name: string;
  role: string;
  content: string;
  rating: number;
  avatar: string;
  location: string;
}

const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    role: 'Family Historian',
    content: 'Heirloom has transformed how our family preserves memories. The interface is intuitive, and seeing our family tree come to life with photos and stories has been incredible. My grandmother loves browsing through decades of memories.',
    rating: 5,
    avatar: 'SJ',
    location: 'Portland, OR'
  },
  {
    id: '2',
    name: 'Michael Chen',
    role: 'Genealogy Enthusiast',
    content: 'As someone who has been researching family history for years, Heirloom is a game-changer. The AI-powered insights helped me discover connections I never knew existed. The security features give me peace of mind.',
    rating: 5,
    avatar: 'MC',
    location: 'San Francisco, CA'
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    role: 'Mother of Three',
    content: 'I wanted a way to share our family stories with my children that would last forever. Heirloom makes it so easy to upload memories and create beautiful timelines. My kids love exploring their heritage.',
    rating: 5,
    avatar: 'ER',
    location: 'Austin, TX'
  },
  {
    id: '4',
    name: 'David Thompson',
    role: 'Retired Teacher',
    content: 'The collaborative features are fantastic. Our entire extended family can contribute memories and stories. It has brought us closer together, especially during the pandemic when we couldn\'t meet in person.',
    rating: 5,
    avatar: 'DT',
    location: 'Boston, MA'
  },
  {
    id: '5',
    name: 'Lisa Park',
    role: 'Professional Photographer',
    content: 'The quality of photo preservation is outstanding. I can upload high-resolution family photos knowing they\'ll be safe and accessible for generations. The gallery features are beautifully designed.',
    rating: 5,
    avatar: 'LP',
    location: 'Seattle, WA'
  },
  {
    id: '6',
    name: 'Robert Williams',
    role: 'Grandfather',
    content: 'At 78, I thought technology wasn\'t for me. But Heirloom is so user-friendly that I\'ve been able to share stories from my childhood with my grandchildren. They love hearing about the "old days".',
    rating: 5,
    avatar: 'RW',
    location: 'Denver, CO'
  }
];

export default function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    setIsAutoPlaying(false);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    setIsAutoPlaying(false);
  };

  const goToTestimonial = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  };

  return (
    <section className="relative z-10 py-20 bg-gradient-to-b from-black/30 to-transparent">
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
            Trusted by Families
            <span className="block text-gold-400/80 mt-2">
              Worldwide
            </span>
          </h2>
          <p className="text-pearl/60 text-xl max-w-3xl mx-auto leading-relaxed font-light">
            See how families are using Heirloom to preserve their most precious memories
            and strengthen their connections across generations.
          </p>
        </motion.div>

        {/* Testimonials Carousel */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative max-w-4xl mx-auto"
        >
          <div className="bg-charcoal/60 backdrop-blur-xl border border-gold-500/15 rounded-2xl p-8 md:p-12 relative overflow-hidden">
            {/* Quote Icon */}
            <div className="absolute top-6 left-6 text-gold-400/20">
              <Quote className="w-12 h-12" />
            </div>

            {/* Testimonial Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="relative z-10"
              >
                <div className="mb-8">
                  <p className="text-pearl/80 text-lg md:text-xl leading-relaxed italic font-light">
                    "{testimonials[currentIndex].content}"
                  </p>
                </div>

                {/* Rating */}
                <div className="flex items-center mb-6">
                  {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-gold-400 fill-current" />
                  ))}
                </div>

                {/* Author Info with rotating avatar ring */}
                <div className="flex items-center">
                  <div className="relative mr-4">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                      className="absolute inset-0 rounded-full border border-gold-500/30"
                      style={{ width: '56px', height: '56px', margin: '-2px' }}
                    />
                    <div className="w-12 h-12 bg-gradient-to-br from-gold-600 to-gold-500 rounded-full flex items-center justify-center text-obsidian-900 font-semibold text-lg">
                      {testimonials[currentIndex].avatar}
                    </div>
                  </div>
                  <div>
                    <div className="text-pearl font-serif text-lg tracking-wide">
                      {testimonials[currentIndex].name}
                    </div>
                    <div className="text-pearl/50 text-sm font-light">
                      {testimonials[currentIndex].role} • {testimonials[currentIndex].location}
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation Arrows */}
            <motion.button
              onClick={prevTestimonial}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-gold-400/60 hover:text-gold-400 transition-colors duration-300 rounded-full border border-gold-500/20 hover:border-gold-500/40"
            >
              <ChevronLeft className="w-6 h-6" />
            </motion.button>
            <motion.button
              onClick={nextTestimonial}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gold-400/60 hover:text-gold-400 transition-colors duration-300 rounded-full border border-gold-500/20 hover:border-gold-500/40"
            >
              <ChevronRight className="w-6 h-6" />
            </motion.button>
          </div>

          {/* Progress bar and dots indicator */}
          <div className="mt-6">
            <div className="h-1 bg-gold-500/10 rounded-full overflow-hidden mb-4">
              <motion.div
                className="h-full bg-gold-500/40"
                initial={{ width: '0%' }}
                animate={{ width: `${((currentIndex + 1) / testimonials.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="flex justify-center space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToTestimonial(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? 'bg-gold-400 scale-125'
                      : 'bg-gold-400/30 hover:bg-gold-400/50'
                  }`}
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
        >
          <div>
            <div className="text-3xl font-serif text-gold-400 mb-2">10,000+</div>
            <div className="text-pearl/50 text-sm uppercase tracking-[0.2em] font-light">Active Families</div>
          </div>
          <div>
            <div className="text-3xl font-serif text-gold-400 mb-2">500K+</div>
            <div className="text-pearl/50 text-sm uppercase tracking-[0.2em] font-light">Memories Preserved</div>
          </div>
          <div>
            <div className="text-3xl font-serif text-gold-400 mb-2">99.9%</div>
            <div className="text-pearl/50 text-sm uppercase tracking-[0.2em] font-light">Uptime</div>
          </div>
          <div>
            <div className="text-3xl font-serif text-gold-400 mb-2">4.9★</div>
            <div className="text-pearl/50 text-sm uppercase tracking-[0.2em] font-light">User Rating</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
