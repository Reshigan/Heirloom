import { Link, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { Home, Image, Pen, Mic, Users, Menu } from './Icons';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { path: '/dashboard', icon: Home, label: 'Vault' },
  { path: '/memories', icon: Image, label: 'Memories' },
  { path: '/compose', icon: Pen, label: 'Write' },
  { path: '/record', icon: Mic, label: 'Record' },
  { path: '/family', icon: Users, label: 'Family' },
];

interface MobileBottomNavProps {
  onMenuClick: () => void;
}

export function MobileBottomNav({ onMenuClick }: MobileBottomNavProps) {
  const location = useLocation();
  const [ripple, setRipple] = useState<{ path: string; x: number; y: number } | null>(null);

  const handleClick = (path: string, e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setRipple({ path, x, y });
    setTimeout(() => setRipple(null), 400);
  };

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-[1000] md:hidden"
      role="navigation"
      aria-label="Mobile navigation"
    >
      <div className="absolute inset-0 bg-void-deep/95 backdrop-blur-xl border-t border-paper-08" />
      
      <div 
        className="relative flex items-stretch justify-around"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          
          return (
            <Link
              key={path}
              to={path}
              onClick={(e) => handleClick(path, e)}
              className={clsx(
                'relative flex flex-col items-center justify-center flex-1 py-3 min-h-[56px] transition-colors duration-200 overflow-hidden',
                isActive ? 'text-gold' : 'text-paper-50 active:text-paper-70'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <AnimatePresence>
                {ripple?.path === path && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0.5 }}
                    animate={{ scale: 4, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="absolute w-8 h-8 rounded-full bg-gold/20"
                    style={{ left: ripple.x - 16, top: ripple.y - 16 }}
                  />
                )}
              </AnimatePresence>
              
              <div className="relative">
                <Icon size={22} strokeWidth={isActive ? 2 : 1.5} />
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-indicator"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-gold"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </div>
              <span className={clsx(
                'text-[10px] mt-1 font-display tracking-wider uppercase',
                isActive ? 'font-medium' : 'font-normal'
              )}>
                {label}
              </span>
            </Link>
          );
        })}
        
        <button
          onClick={onMenuClick}
          className="relative flex flex-col items-center justify-center flex-1 py-3 min-h-[56px] text-paper-50 active:text-paper-70 transition-colors duration-200"
          aria-label="Open menu"
        >
          <Menu size={22} strokeWidth={1.5} />
          <span className="text-[10px] mt-1 font-display tracking-wider uppercase">More</span>
        </button>
      </div>
    </nav>
  );
}
