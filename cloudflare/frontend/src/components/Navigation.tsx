import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Image, Pen, Mic, Users, Settings, LogOut, Sparkles, Menu, X } from 'lucide-react';
import clsx from 'clsx';
import { Logo } from './Logo';
import { useAuthStore } from '../stores/authStore';

const navItems = [
  { path: '/dashboard', icon: Home, label: 'Vault' },
  { path: '/memories', icon: Image, label: 'Memories' },
  { path: '/compose', icon: Pen, label: 'Write' },
  { path: '/record', icon: Mic, label: 'Record' },
  { path: '/family', icon: Users, label: 'Family' },
  { path: '/wrapped', icon: Sparkles, label: 'Wrapped' },
];

export function Navigation() {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
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
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 md:px-12 py-6">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-void/95 to-transparent pointer-events-none" />
      
      <div className="relative flex items-center justify-between">
        {/* Logo */}
        <Logo size="md" />
        
        {/* Nav links - desktop */}
        <div className="hidden md:flex items-center gap-8">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path;
            
            return (
              <Link
                key={path}
                to={path}
                className={clsx(
                  'flex items-center gap-2 text-sm tracking-wide transition-smooth',
                  isActive ? 'text-gold' : 'text-paper/40 hover:text-gold'
                )}
              >
                <Icon size={18} strokeWidth={1.5} />
                <span>{label}</span>
                
                {isActive && (
                  <motion.div
                    className="absolute -bottom-1 left-0 right-0 h-px bg-gold"
                    layoutId="nav-underline"
                  />
                )}
              </Link>
            );
          })}
        </div>
        
        {/* User menu - desktop */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            to="/settings"
            className={clsx(
              'p-2 transition-smooth',
              location.pathname === '/settings' ? 'text-gold' : 'text-paper/40 hover:text-gold'
            )}
          >
            <Settings size={20} strokeWidth={1.5} />
          </Link>
          
          {/* Avatar */}
          <Link
            to="/settings"
            className="w-10 h-10 rounded-full bg-gradient-to-br from-gold to-gold-dim flex items-center justify-center text-void text-sm font-medium"
          >
            {initials}
          </Link>
          
          <button
            onClick={logout}
            className="p-2 text-paper/40 hover:text-blood transition-smooth"
            title="Sign out"
          >
            <LogOut size={20} strokeWidth={1.5} />
          </button>
        </div>
        
        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 text-paper/60 hover:text-gold transition-smooth"
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
            {/* Backdrop - z-[60] to cover the nav bar (z-50) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-void/80 backdrop-blur-sm z-[60] md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            
            {/* Drawer - z-[70] to be above backdrop */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-72 bg-void-deep border-l border-gold/20 z-[70] md:hidden flex flex-col"
            >
              {/* Close button */}
              <div className="flex justify-end p-4">
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-paper/60 hover:text-gold transition-smooth"
                  aria-label="Close menu"
                >
                  <X size={24} />
                </button>
              </div>
              
              {/* User info */}
              <div className="px-6 pb-6 border-b border-gold/10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold to-gold-dim flex items-center justify-center text-void font-medium">
                    {initials}
                  </div>
                  <div>
                    <div className="text-paper font-medium">{user?.firstName} {user?.lastName}</div>
                    <div className="text-paper/40 text-sm">{user?.email}</div>
                  </div>
                </div>
              </div>
              
              {/* Nav links */}
              <nav className="flex-1 py-4 overflow-y-auto">
                {navItems.map(({ path, icon: Icon, label }) => {
                  const isActive = location.pathname === path;
                  return (
                    <Link
                      key={path}
                      to={path}
                      className={clsx(
                        'flex items-center gap-3 px-6 py-3 text-base transition-smooth',
                        isActive ? 'text-gold bg-gold/10' : 'text-paper/60 hover:text-gold hover:bg-gold/5'
                      )}
                    >
                      <Icon size={20} strokeWidth={1.5} />
                      <span>{label}</span>
                    </Link>
                  );
                })}
                
                {/* Settings link */}
                <Link
                  to="/settings"
                  className={clsx(
                    'flex items-center gap-3 px-6 py-3 text-base transition-smooth',
                    location.pathname === '/settings' ? 'text-gold bg-gold/10' : 'text-paper/60 hover:text-gold hover:bg-gold/5'
                  )}
                >
                  <Settings size={20} strokeWidth={1.5} />
                  <span>Settings</span>
                </Link>
              </nav>
              
              {/* Logout button */}
              <div className="p-4 border-t border-gold/10">
                <button
                  onClick={logout}
                  className="flex items-center gap-3 w-full px-4 py-3 text-blood hover:bg-blood/10 rounded-lg transition-smooth"
                >
                  <LogOut size={20} strokeWidth={1.5} />
                  <span>Sign out</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}
