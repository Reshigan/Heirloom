'use client';

import { useState } from 'react';
import { Upload, Users, User, Clock, Image, MessageCircle, Menu, X, Sparkles, Zap } from 'lucide-react';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  primary?: boolean;
}

interface HeaderProps {
  onOpenModal: (modalType: string) => void;
  viewMode: 'classic' | 'revolutionary' | 'futuristic' | 'mobile';
  onViewModeChange: (mode: 'classic' | 'revolutionary' | 'futuristic' | 'mobile') => void;
}

const navigationItems: NavigationItem[] = [
  { id: 'upload', label: 'Upload Memory', icon: Upload, primary: true },
  { id: 'timeline', label: 'Timeline', icon: Clock },
  { id: 'family-tree', label: 'Family Tree', icon: Users },
  { id: 'memory-details', label: 'Memory Gallery', icon: Image },
  { id: 'social', label: 'Social Hub', icon: MessageCircle },
  { id: 'profile', label: 'Profile', icon: User }
];

export default function Header({ onOpenModal, viewMode, onViewModeChange }: HeaderProps) {
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const openModal = (modalType: string) => {
    onOpenModal(modalType);
    setShowMobileMenu(false);
  };

  return (
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
                onClick={() => onViewModeChange('classic')}
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
                onClick={() => onViewModeChange('futuristic')}
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
                onClick={() => onViewModeChange('revolutionary')}
                className="p-2 rounded transition-all duration-300 text-gold/60 hover:text-gold"
                title="Revolutionary Interface"
              >
                <Zap className="w-4 h-4" />
              </button>
              <button
                onClick={() => onViewModeChange('mobile')}
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
  );
}