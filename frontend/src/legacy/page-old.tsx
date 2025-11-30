'use client';

import { useState, useEffect } from 'react';
import { WelcomeDashboard } from "@/components/features/welcome-dashboard";
import MemoryUpload from '@/components/memory-upload';
import SearchFilter from '@/components/search-filter';
import UserProfile from '@/components/user-profile';
import FamilyTree from '@/components/family-tree';
import TimelineView from '@/components/timeline-view';
import MemoryDetails from '@/components/memory-details';
import SocialFeatures from '@/components/social-features';
import LuxuryHeirloomInterface from '@/components/luxury-heirloom-interface';
import FuturisticHeirloomInterface from '@/components/futuristic-heirloom-interface';
import MobileConstellation from '@/components/mobile-constellation';
import EnhancedParticleSystem from '@/components/ui/enhanced-particle-system';
import { Upload, Users, User, Clock, Image, MessageCircle, Search, Menu, X, Sparkles, Zap } from 'lucide-react';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [viewMode, setViewMode] = useState<'classic' | 'revolutionary' | 'futuristic' | 'mobile'>('futuristic');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Detect mobile device and set appropriate default view
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // Auto-switch to mobile constellation on mobile devices
      if (mobile && (viewMode === 'revolutionary' || viewMode === 'futuristic')) {
        setViewMode('mobile');
      } else if (!mobile && viewMode === 'mobile') {
        setViewMode('futuristic');
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, [viewMode]);

  const openModal = (modalType: string) => {
    setActiveModal(modalType);
    setShowMobileMenu(false);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  const handleViewModeChange = (mode: 'classic' | 'revolutionary' | 'futuristic' | 'mobile') => {
    setViewMode(mode);
  };

  const handleRevolutionaryNavigate = (section: string) => {
    setActiveModal(section);
  };

  if (!mounted) {
    return null;
  }

  const navigationItems = [
    { id: 'upload', label: 'Upload Memory', icon: Upload, primary: true },
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'family-tree', label: 'Family Tree', icon: Users },
    { id: 'memory-details', label: 'Memory Gallery', icon: Image },
    { id: 'social', label: 'Social Hub', icon: MessageCircle },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  // Futuristic Interface Mode (Default)
  if (viewMode === 'futuristic') {
    return (
      <div className="relative">
        <FuturisticHeirloomInterface />
      </div>
    );
  }

  // Revolutionary Interface Mode
  if (viewMode === 'revolutionary') {
    return (
      <div className="relative">
        <LuxuryHeirloomInterface />
      </div>
    );
  }

  // Mobile Constellation Mode
  if (viewMode === 'mobile') {
    return (
      <MobileConstellation 
        onNavigate={handleRevolutionaryNavigate}
        onClose={() => setViewMode('classic')}
      />
    );
  }

  return (
    <main className="min-h-screen relative overflow-hidden bg-black">
      {/* Enhanced Header */}
      <header className="relative z-20 bg-glass-bg backdrop-blur-lg border-b border-glass-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-secondary-gradient rounded-lg flex items-center justify-center">
                <span className="text-black font-bold text-xl">H</span>
              </div>
              <h1 className="text-2xl font-display font-bold text-gold">Heirloom</h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-2">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => openModal(item.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                    item.primary
                      ? 'bg-secondary-gradient text-black hover:scale-105 font-semibold'
                      : 'text-gold/80 hover:text-gold hover:bg-gold/10'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              ))}
              
              {/* Interface Mode Switcher */}
              <div className="flex items-center space-x-1 ml-4 bg-glass-bg backdrop-blur-lg border border-gold/20 rounded-lg p-1">
                <button
                  onClick={() => handleViewModeChange('classic')}
                  className={`p-2 rounded transition-all duration-300 ${
                    viewMode === 'classic' 
                      ? 'bg-secondary-gradient text-black' 
                      : 'text-gold/60 hover:text-gold'
                  }`}
                  title="Classic View"
                >
                  <Menu className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleViewModeChange('futuristic')}
                  className={`p-2 rounded transition-all duration-300 ${
                    viewMode === 'futuristic' 
                      ? 'bg-secondary-gradient text-black' 
                      : 'text-gold/60 hover:text-gold'
                  }`}
                  title="Futuristic Interface"
                >
                  <Sparkles className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleViewModeChange('revolutionary')}
                  className="p-2 rounded transition-all duration-300 text-gold/60 hover:text-gold"
                  title="Revolutionary Interface"
                >
                  <Zap className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleViewModeChange('mobile')}
                  className="p-2 rounded transition-all duration-300 text-gold/60 hover:text-gold"
                  title="Mobile Constellation"
                >
                  <Menu className="w-4 h-4" />
                </button>
              </div>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden p-2 text-gold hover:bg-gold/10 rounded-lg transition-colors"
            >
              {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {showMobileMenu && (
            <nav className="lg:hidden mt-4 pb-4 border-t border-gold/20 pt-4">
              <div className="grid grid-cols-2 gap-2">
                {navigationItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => openModal(item.id)}
                    className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-all duration-300 ${
                      item.primary
                        ? 'bg-secondary-gradient text-black font-semibold col-span-2'
                        : 'text-gold/80 hover:text-gold hover:bg-gold/10'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* Search Section */}
      <section className="relative z-10 bg-gradient-to-b from-black/50 to-transparent">
        <div className="container mx-auto px-6 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-gold mb-4">
                Discover Your Family Stories
              </h2>
              <p className="text-gold/80 text-lg">
                Search through memories, explore your family tree, and relive precious moments
              </p>
            </div>
            <SearchFilter />
          </div>
        </div>
      </section>
      
      {/* Welcome Dashboard */}
      <WelcomeDashboard onOpenModal={openModal} />

      {/* Quick Stats Bar */}
      <section className="relative z-10 bg-glass-bg backdrop-blur-lg border-t border-glass-border">
        <div className="container mx-auto px-6 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gold mb-1">1,247</div>
              <div className="text-gold/60 text-sm">Total Memories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gold mb-1">23</div>
              <div className="text-gold/60 text-sm">Family Members</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gold mb-1">72</div>
              <div className="text-gold/60 text-sm">Years Covered</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gold mb-1">5.2k</div>
              <div className="text-gold/60 text-sm">Interactions</div>
            </div>
          </div>
        </div>
      </section>

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
    </main>
  );
}
