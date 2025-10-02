'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import Testimonials from '@/components/Testimonials';
import Footer from '@/components/Footer';

// Import existing modal components
import MemoryUpload from '@/components/memory-upload';
import SearchFilter from '@/components/search-filter';
import UserProfile from '@/components/user-profile';
import FamilyTree from '@/components/family-tree';
import TimelineView from '@/components/timeline-view';
import MemoryDetails from '@/components/memory-details';
import SocialFeatures from '@/components/social-features';

interface HomepageProps {
  className?: string;
  onViewModeChange?: (mode: 'classic' | 'revolutionary' | 'futuristic' | 'mobile') => void;
}

export default function Homepage({ className = '', onViewModeChange }: HomepageProps) {
  const [mounted, setMounted] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'classic' | 'revolutionary' | 'futuristic' | 'mobile'>('classic');

  useEffect(() => {
    setMounted(true);
  }, []);

  const openModal = (modalType: string) => {
    setActiveModal(modalType);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  const handleViewModeChange = (mode: 'classic' | 'revolutionary' | 'futuristic' | 'mobile') => {
    setViewMode(mode);
    if (onViewModeChange) {
      onViewModeChange(mode);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <main className={`min-h-screen relative overflow-hidden bg-black ${className}`}>
      {/* Header */}
      <Header 
        onOpenModal={openModal}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
      />

      {/* Hero Section */}
      <Hero onOpenModal={openModal} />

      {/* Features Section */}
      <Features onOpenModal={openModal} />

      {/* Testimonials Section */}
      <Testimonials />

      {/* Footer */}
      <Footer />

      {/* Modals */}
      {activeModal === 'upload' && (
        <MemoryUpload 
          onClose={closeModal}
          onUpload={(files) => {
            console.log('Uploaded files:', files);
            closeModal();
          }}
        />
      )}

      {activeModal === 'profile' && (
        <UserProfile onClose={closeModal} />
      )}

      {activeModal === 'family-tree' && (
        <FamilyTree onClose={closeModal} />
      )}

      {activeModal === 'timeline' && (
        <TimelineView onClose={closeModal} />
      )}

      {activeModal === 'memory-details' && (
        <MemoryDetails onClose={closeModal} />
      )}

      {activeModal === 'social' && (
        <SocialFeatures onClose={closeModal} />
      )}

      {/* Handle other modal types that might be triggered from Features */}
      {activeModal === 'gallery' && (
        <MemoryDetails onClose={closeModal} />
      )}

      {activeModal === 'security' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-glass-bg backdrop-blur-lg border border-glass-border rounded-2xl p-8 max-w-2xl w-full">
            <h2 className="text-2xl font-display font-bold text-gold mb-4">Security & Privacy</h2>
            <p className="text-gold/80 mb-6">
              Your family memories are protected with enterprise-grade security, end-to-end encryption, 
              and strict privacy controls. We never share your data with third parties.
            </p>
            <button
              onClick={closeModal}
              className="bg-secondary-gradient text-black px-6 py-2 rounded-lg font-semibold hover:scale-105 transition-all duration-300"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {activeModal === 'cloud' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-glass-bg backdrop-blur-lg border border-glass-border rounded-2xl p-8 max-w-2xl w-full">
            <h2 className="text-2xl font-display font-bold text-gold mb-4">Cloud Storage</h2>
            <p className="text-gold/80 mb-6">
              Access your memories from anywhere with our reliable cloud infrastructure. 
              Automatic backups ensure your family legacy is always safe and accessible.
            </p>
            <button
              onClick={closeModal}
              className="bg-secondary-gradient text-black px-6 py-2 rounded-lg font-semibold hover:scale-105 transition-all duration-300"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {activeModal === 'ai' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-glass-bg backdrop-blur-lg border border-glass-border rounded-2xl p-8 max-w-2xl w-full">
            <h2 className="text-2xl font-display font-bold text-gold mb-4">AI-Powered Insights</h2>
            <p className="text-gold/80 mb-6">
              Our AI analyzes your family data to suggest connections, identify people in photos, 
              and help you discover new stories and relationships within your family tree.
            </p>
            <button
              onClick={closeModal}
              className="bg-secondary-gradient text-black px-6 py-2 rounded-lg font-semibold hover:scale-105 transition-all duration-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}