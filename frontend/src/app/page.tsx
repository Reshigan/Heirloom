'use client';

import { useState, useEffect } from 'react';
import Homepage from '@/components/Homepage';
import LuxuryHeirloomInterface from '@/components/luxury-heirloom-interface';
import FuturisticHeirloomInterface from '@/components/futuristic-heirloom-interface';
import MobileConstellation from '@/components/mobile-constellation';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'classic' | 'revolutionary' | 'futuristic' | 'mobile'>('classic');
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
        setViewMode('classic');
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, [viewMode]);

  const handleRevolutionaryNavigate = (section: string) => {
    setActiveModal(section);
  };

  if (!mounted) {
    return null;
  }

  // Futuristic Interface Mode
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

  // Classic Homepage Mode (New Separated UI)
  return <Homepage />;
}