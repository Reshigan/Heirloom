import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { Logo } from './Logo';
import { useAuthStore } from '../stores/authStore';
import { Home, Image, Pen, Mic, Users, Settings, LogOut, Sparkles, Menu, X, ChevronDown, LegacyPlaybook, RecipientJourney, StoryArtifact, LifeEventTrigger } from './Icons';
import { MobileBottomNav } from './MobileBottomNav';

const navItems = [
  { path: '/dashboard', icon: Home, label: 'Vault' },
  { path: '/memories', icon: Image, label: 'Memories' },
  { path: '/compose', icon: Pen, label: 'Write' },
  { path: '/record', icon: Mic, label: 'Record' },
  { path: '/family', icon: Users, label: 'Family' },
  { path: '/wrapped', icon: Sparkles, label: 'Wrapped' },
];

const advancedFeatures = [
  { path: '/legacy-plan', icon: LegacyPlaybook, label: 'Legacy Playbook', description: 'Guided checklist for your legacy' },
  { path: '/recipient-experience', icon: RecipientJourney, label: 'Recipient Experience', description: 'Staged releases & memory room' },
  { path: '/story-artifacts', icon: StoryArtifact, label: 'Story Artifacts', description: 'Create micro-documentaries' },
  { path: '/life-events', icon: LifeEventTrigger, label: 'Life Events', description: 'Milestone-based triggers' },
];

export function Navigation() {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [advancedDropdownOpen, setAdvancedDropdownOpen] = useState(false);
  const advancedDropdownRef = useRef<HTMLDivElement>(null);
  
  // Check if current path is an advanced feature
  const isAdvancedFeatureActive = advancedFeatures.some(f => location.pathname === f.path);
  
  // Close advanced dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (advancedDropdownRef.current && !advancedDropdownRef.current.contains(event.target as Node)) {
        setAdvancedDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);
  
  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Fix bug #21: Handle empty firstName/lastName safely
  const initials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || '??'
    : '??';
  
  return (
    <>
      {/* Skip Navigation Link (BUG-019 fix) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[1001] focus:px-4 focus:py-2 focus:bg-gold focus:text-void focus:rounded-lg focus:outline-none"
      >
        Skip to main content
      </a>
      
    <nav className="fixed top-0 left-0 right-0 z-[1000] px-6 md:px-12 py-4 md:py-6" role="navigation" aria-label="Main navigation">
      {/* Gradient background with glass effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-void-abyss/95 via-void-abyss/80 to-transparent backdrop-blur-sm pointer-events-none" />
      
      <div className="relative flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo */}
        <Logo size="md" />
        
        {/* Nav links - desktop */}
        <div className="hidden md:flex items-center gap-6 lg:gap-8">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path;
            
            return (
              <Link
                key={path}
                to={path}
                className={clsx(
                  'relative flex items-center gap-2 py-2 font-display text-xs tracking-[0.15em] uppercase transition-all duration-300',
                  isActive 
                    ? 'text-gold' 
                    : 'text-paper-50 hover:text-paper-90'
                )}
              >
                <Icon size={16} strokeWidth={1.5} />
                <span>{label}</span>
                
                {isActive && (
                  <motion.div
                    className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent"
                    layoutId="nav-underline"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
          
          {/* Advanced Features Dropdown */}
          <div className="relative" ref={advancedDropdownRef}>
            <button
              onClick={() => setAdvancedDropdownOpen(!advancedDropdownOpen)}
              className={clsx(
                'relative flex items-center gap-2 py-2 font-display text-xs tracking-[0.15em] uppercase transition-all duration-300',
                isAdvancedFeatureActive 
                  ? 'text-gold' 
                  : 'text-paper-50 hover:text-paper-90'
              )}
            >
              <Sparkles size={16} strokeWidth={1.5} />
              <span>Advanced</span>
              <ChevronDown 
                size={14} 
                className={clsx('transition-transform duration-200', advancedDropdownOpen && 'rotate-180')} 
              />
              
              {isAdvancedFeatureActive && (
                <motion.div
                  className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent"
                  layoutId="nav-underline-advanced"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </button>
            
            <AnimatePresence>
              {advancedDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full left-0 mt-2 w-64 bg-void-deep/95 backdrop-blur-xl border border-gold-20 rounded-xl shadow-2xl shadow-void-abyss/50 overflow-hidden z-50"
                >
                  {advancedFeatures.map(({ path, icon: Icon, label, description }) => {
                    const isActive = location.pathname === path;
                    return (
                      <Link
                        key={path}
                        to={path}
                        onClick={() => setAdvancedDropdownOpen(false)}
                        className={clsx(
                          'flex items-start gap-3 px-4 py-3 transition-all duration-200',
                          isActive 
                            ? 'bg-gold-10 text-gold' 
                            : 'text-paper-70 hover:bg-paper-04 hover:text-paper'
                        )}
                      >
                        <div className={clsx(
                          'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5',
                          isActive ? 'bg-gold/20 text-gold' : 'bg-paper-08 text-paper-50'
                        )}>
                          <Icon size={18} strokeWidth={1.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-display text-xs tracking-[0.1em] uppercase">{label}</div>
                          <div className="text-xs text-paper-40 mt-0.5">{description}</div>
                        </div>
                      </Link>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        
        {/* User menu - desktop */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/settings"
            className={clsx(
              'p-2 rounded-lg transition-all duration-300',
              location.pathname === '/settings' 
                ? 'text-gold bg-gold-10' 
                : 'text-paper-50 hover:text-paper-90 hover:bg-paper-04'
            )}
            aria-label="Settings"
          >
            <Settings size={18} strokeWidth={1.5} aria-hidden="true" />
          </Link>
          
          {/* Avatar */}
          <Link
            to="/settings"
            className="w-9 h-9 rounded-full bg-gradient-to-br from-gold to-gold-dim flex items-center justify-center text-void-abyss text-xs font-display font-medium tracking-wide shadow-lg shadow-gold/20"
          >
            {initials}
          </Link>
          
          <button
            onClick={logout}
            className="p-2 rounded-lg text-paper-50 hover:text-blood hover:bg-blood/10 transition-all duration-300"
            aria-label="Sign out"
          >
            <LogOut size={18} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>
        
        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 rounded-lg text-paper-70 hover:text-gold hover:bg-gold-10 transition-all duration-300"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      
      {/* Mobile menu drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop - z-[9998] to be below drawer but above everything else */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-void-abyss/90 backdrop-blur-md z-[9998] md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            
            {/* Drawer - z-[9999] to be above backdrop */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-void-deep/95 backdrop-blur-xl border-l border-gold-20 z-[9999] md:hidden flex flex-col shadow-2xl shadow-void-abyss/50"
            >
              {/* Close button */}
              <div className="flex justify-end p-4">
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg text-paper-50 hover:text-gold hover:bg-gold-10 transition-all duration-300"
                  aria-label="Close menu"
                >
                  <X size={24} />
                </button>
              </div>
              
              {/* User info */}
              <div className="px-6 pb-6 border-b border-paper-08">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gold to-gold-dim flex items-center justify-center text-void-abyss font-display font-medium text-lg shadow-lg shadow-gold/30">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-paper font-display text-lg tracking-wide truncate">{user?.firstName} {user?.lastName}</div>
                    <div className="text-paper-50 text-sm truncate">{user?.email}</div>
                  </div>
                </div>
              </div>
              
              {/* Nav links */}
              <nav className="flex-1 py-6 overflow-y-auto">
                {navItems.map(({ path, icon: Icon, label }) => {
                  const isActive = location.pathname === path;
                  return (
                    <Link
                      key={path}
                      to={path}
                      className={clsx(
                        'flex items-center gap-4 px-6 py-4 font-display text-sm tracking-[0.1em] uppercase transition-all duration-300',
                        isActive 
                          ? 'text-gold bg-gold-10 border-r-2 border-gold' 
                          : 'text-paper-70 hover:text-paper hover:bg-paper-04'
                      )}
                    >
                      <Icon size={20} strokeWidth={1.5} />
                      <span>{label}</span>
                    </Link>
                  );
                })}
                
                {/* Advanced Features Section */}
                <div className="px-6 py-3 mt-2 border-t border-paper-08">
                  <p className="text-xs tracking-[0.15em] text-paper-40 uppercase mb-2">Advanced Features</p>
                </div>
                {advancedFeatures.map(({ path, icon: Icon, label }) => {
                  const isActive = location.pathname === path;
                  return (
                    <Link
                      key={path}
                      to={path}
                      className={clsx(
                        'flex items-center gap-4 px-6 py-4 font-display text-sm tracking-[0.1em] uppercase transition-all duration-300',
                        isActive 
                          ? 'text-gold bg-gold-10 border-r-2 border-gold' 
                          : 'text-paper-70 hover:text-paper hover:bg-paper-04'
                      )}
                    >
                      <Icon size={20} strokeWidth={1.5} />
                      <span>{label}</span>
                    </Link>
                  );
                })}
                
                {/* Settings link */}
                <div className="px-6 py-3 mt-2 border-t border-paper-08">
                  <p className="text-xs tracking-[0.15em] text-paper-40 uppercase mb-2">Account</p>
                </div>
                <Link
                  to="/settings"
                  className={clsx(
                    'flex items-center gap-4 px-6 py-4 font-display text-sm tracking-[0.1em] uppercase transition-all duration-300',
                    location.pathname === '/settings' 
                      ? 'text-gold bg-gold-10 border-r-2 border-gold' 
                      : 'text-paper-70 hover:text-paper hover:bg-paper-04'
                  )}
                >
                  <Settings size={20} strokeWidth={1.5} />
                  <span>Settings</span>
                </Link>
              </nav>
              
              {/* Logout button */}
              <div className="p-6 border-t border-paper-08">
                <button
                  onClick={logout}
                  className="flex items-center justify-center gap-3 w-full px-4 py-3 text-blood font-display text-sm tracking-[0.1em] uppercase hover:bg-blood/10 rounded-lg transition-all duration-300 border border-blood/30"
                >
                  <LogOut size={18} strokeWidth={1.5} />
                  <span>Sign out</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
    
    {/* Mobile Bottom Navigation */}
    <MobileBottomNav onMenuClick={() => setMobileMenuOpen(true)} />
    </>
  );
}
