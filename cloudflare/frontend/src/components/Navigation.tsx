import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Image, Pen, Mic, Users, Settings, LogOut } from 'lucide-react';
import clsx from 'clsx';
import { Logo } from './Logo';
import { useAuthStore } from '../stores/authStore';

const navItems = [
  { path: '/dashboard', icon: Home, label: 'Vault' },
  { path: '/memories', icon: Image, label: 'Memories' },
  { path: '/compose', icon: Pen, label: 'Write' },
  { path: '/record', icon: Mic, label: 'Record' },
  { path: '/family', icon: Users, label: 'Family' },
];

export function Navigation() {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  
  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
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
        
        {/* User menu */}
        <div className="flex items-center gap-4">
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
      </div>
    </nav>
  );
}
