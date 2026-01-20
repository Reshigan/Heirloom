/**
 * CreateFAB Component
 * Mobile floating action button with radial menu for quick creation
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface FABAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
  onClick?: () => void;
  color?: string;
}

interface CreateFABProps {
  actions?: FABAction[];
}

// Default icons as SVG components
const PlusIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const XIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const ImageIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <path d="M21 15l-5-5L5 21" />
  </svg>
);

const PenIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M12 19l7-7 3 3-7 7-3-3z" />
    <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
    <path d="M2 2l7.586 7.586" />
    <circle cx="11" cy="11" r="2" />
  </svg>
);

const MicIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const UsersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const defaultActions: FABAction[] = [
  { id: 'memory', label: 'Add Memory', icon: <ImageIcon />, path: '/memories?action=create', color: 'bg-gold' },
  { id: 'letter', label: 'Write Letter', icon: <PenIcon />, path: '/letters?action=create', color: 'bg-blood' },
  { id: 'voice', label: 'Record Voice', icon: <MicIcon />, path: '/record', color: 'bg-sanctuary-teal' },
  { id: 'family', label: 'Add Family', icon: <UsersIcon />, path: '/family?action=add', color: 'bg-sanctuary-blue' },
];

export const CreateFAB: React.FC<CreateFABProps> = ({ actions = defaultActions }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleActionClick = (action: FABAction) => {
    setIsOpen(false);
    if (action.onClick) {
      action.onClick();
    } else if (action.path) {
      navigate(action.path);
    }
  };

  // Calculate positions for radial menu (arc from -135 to -45 degrees)
  const getPosition = (index: number, total: number) => {
    const startAngle = -135;
    const endAngle = -45;
    const angleStep = (endAngle - startAngle) / (total - 1);
    const angle = startAngle + index * angleStep;
    const radius = 80;
    const x = Math.cos((angle * Math.PI) / 180) * radius;
    const y = Math.sin((angle * Math.PI) / 180) * radius;
    return { x, y };
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-void/80 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* FAB Container - only visible on mobile */}
      <div className="fixed bottom-6 right-6 z-50 md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {/* Action buttons */}
        <AnimatePresence>
          {isOpen && actions.map((action, index) => {
            const pos = getPosition(index, actions.length);
            return (
              <motion.button
                key={action.id}
                initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
                animate={{ opacity: 1, x: pos.x, y: pos.y, scale: 1 }}
                exit={{ opacity: 0, x: 0, y: 0, scale: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: index * 0.05 }}
                onClick={() => handleActionClick(action)}
                className={`absolute bottom-0 right-0 w-12 h-12 rounded-full ${action.color || 'bg-gold'} text-void shadow-lg flex items-center justify-center touch-manipulation`}
                aria-label={action.label}
              >
                {action.icon}
                {/* Label tooltip */}
                <span className="absolute right-14 whitespace-nowrap bg-void-light text-paper text-sm px-3 py-1.5 rounded-lg shadow-lg">
                  {action.label}
                </span>
              </motion.button>
            );
          })}
        </AnimatePresence>

        {/* Main FAB button */}
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-14 h-14 rounded-full bg-gold text-void shadow-xl flex items-center justify-center touch-manipulation"
          whileTap={{ scale: 0.95 }}
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          aria-label={isOpen ? 'Close menu' : 'Create new'}
          aria-expanded={isOpen}
        >
          {isOpen ? <XIcon /> : <PlusIcon />}
          
          {/* Pulse animation when closed */}
          {!isOpen && (
            <motion.span
              className="absolute inset-0 rounded-full bg-gold"
              animate={{ scale: [1, 1.2], opacity: [0.5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </motion.button>
      </div>
    </>
  );
};

export default CreateFAB;
