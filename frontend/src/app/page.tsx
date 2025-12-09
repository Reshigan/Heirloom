'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LandingPage from '@/components/landing/landing-page';
import ConstellationInterface from '@/components/constellation-interface';

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [showLanding, setShowLanding] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        setShowLanding(false);
      } else {
        setShowLanding(true);
      }
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <div className="loading-overlay">
        <div className="loading-content">
          <div className="loading-ring"></div>
          <div className="loading-text">HEIRLOOM</div>
        </div>
      </div>
    );
  }

  if (showLanding) {
    return <LandingPage />;
  }

  return (
    <div className="relative">
      <ConstellationInterface />
    </div>
  );
}
