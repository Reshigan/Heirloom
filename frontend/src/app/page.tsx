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
      
      // Only auto-switch on initial load, not on manual interface changes
      // Auto-switch to mobile constellation on mobile devices only if still on default classic view
      if (mobile && viewMode === 'classic') {
        setViewMode('mobile');
      }
      // Don't auto-switch back from mobile constellation on desktop - let user choose
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
        <FuturisticHeirloomInterface onViewModeChange={setViewMode} />
      </div>
    );
  }

  // Revolutionary Interface Mode
  if (viewMode === 'revolutionary') {
    return (
      <div className="relative">
        <LuxuryHeirloomInterface onViewModeChange={setViewMode} />
      </div>
    );
  }

  // Mobile Constellation Mode
  if (viewMode === 'mobile') {
    return (
      <MobileConstellation 
        onNavigate={handleRevolutionaryNavigate}
        onClose={() => setViewMode('classic')}
        onViewModeChange={setViewMode}
      />
    );
  }

  // Classic Homepage Mode (New Separated UI)
  return <Homepage onViewModeChange={setViewMode} />;
}