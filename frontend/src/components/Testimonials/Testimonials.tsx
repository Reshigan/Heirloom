'use client';

import { useState, useEffect } from 'react';
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
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-gold mb-6">
            Trusted by Families
            <span className="block bg-gradient-to-r from-gold via-yellow-400 to-gold bg-clip-text text-transparent">
              Worldwide
            </span>
          </h2>
          <p className="text-gold/80 text-xl max-w-3xl mx-auto leading-relaxed">
            See how families are using Heirloom to preserve their most precious memories
            and strengthen their connections across generations.
          </p>
        </div>

        {/* Testimonials Carousel */}
        <div className="relative max-w-4xl mx-auto">
          <div className="bg-glass-bg backdrop-blur-lg border border-glass-border rounded-2xl p-8 md:p-12 relative overflow-hidden">
            {/* Quote Icon */}
            <div className="absolute top-6 left-6 text-gold/20">
              <Quote className="w-12 h-12" />
            </div>

            {/* Testimonial Content */}
            <div className="relative z-10">
              <div className="mb-8">
                <p className="text-gold/90 text-lg md:text-xl leading-relaxed italic">
                  "{testimonials[currentIndex].content}"
                </p>
              </div>

              {/* Rating */}
              <div className="flex items-center mb-6">
                {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>

              {/* Author Info */}
              <div className="flex items-center">
                <div className="w-12 h-12 bg-secondary-gradient rounded-full flex items-center justify-center text-black font-bold text-lg mr-4">
                  {testimonials[currentIndex].avatar}
                </div>
                <div>
                  <div className="text-gold font-semibold text-lg">
                    {testimonials[currentIndex].name}
                  </div>
                  <div className="text-gold/60 text-sm">
                    {testimonials[currentIndex].role} • {testimonials[currentIndex].location}
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Arrows */}
            <button
              onClick={prevTestimonial}
              className="absolute left-4 top-1/2 -trangold-y-1/2 p-2 text-gold/60 hover:text-gold transition-colors duration-300"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextTestimonial}
              className="absolute right-4 top-1/2 -trangold-y-1/2 p-2 text-gold/60 hover:text-gold transition-colors duration-300"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center mt-8 space-x-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => goToTestimonial(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'bg-gold scale-125'
                    : 'bg-gold/30 hover:bg-gold/50'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-gold mb-2">10,000+</div>
            <div className="text-gold/60 text-sm uppercase tracking-wide">Active Families</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gold mb-2">500K+</div>
            <div className="text-gold/60 text-sm uppercase tracking-wide">Memories Preserved</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gold mb-2">99.9%</div>
            <div className="text-gold/60 text-sm uppercase tracking-wide">Uptime</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gold mb-2">4.9★</div>
            <div className="text-gold/60 text-sm uppercase tracking-wide">User Rating</div>
          </div>
        </div>
      </div>
    </section>
  );
}