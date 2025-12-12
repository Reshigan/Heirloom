import { useEffect, useState, useRef } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

interface CustomCursorProps {
  variant?: 'default' | 'nib' | 'ring' | 'ink';
}

export function CustomCursor({ variant = 'default' }: CustomCursorProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  
  const springConfig = { damping: 25, stiffness: 300 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);
  
  useEffect(() => {
    // Only show on devices with fine pointer (mouse)
    const hasFineMouse = window.matchMedia('(pointer: fine)').matches;
    if (!hasFineMouse) return;
    
    setIsVisible(true);
    
    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };
    
    const handleMouseEnter = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.matches('a, button, [role="button"], input, select, textarea, .cursor-hover')) {
        setIsHovering(true);
      }
    };
    
    const handleMouseLeave = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.matches('a, button, [role="button"], input, select, textarea, .cursor-hover')) {
        setIsHovering(false);
      }
    };
    
    window.addEventListener('mousemove', moveCursor);
    document.addEventListener('mouseenter', handleMouseEnter, true);
    document.addEventListener('mouseleave', handleMouseLeave, true);
    
    return () => {
      window.removeEventListener('mousemove', moveCursor);
      document.removeEventListener('mouseenter', handleMouseEnter, true);
      document.removeEventListener('mouseleave', handleMouseLeave, true);
    };
  }, [cursorX, cursorY]);
  
  if (!isVisible) return null;
  
  return (
    <motion.div
      className="fixed top-0 left-0 pointer-events-none z-[10000]"
      style={{ x: cursorXSpring, y: cursorYSpring }}
    >
      {variant === 'default' && (
        <>
          <motion.div
            className="absolute border border-gold/40 rounded-full"
            style={{ x: '-50%', y: '-50%' }}
            animate={{
              width: isHovering ? 80 : 40,
              height: isHovering ? 80 : 40,
              borderColor: isHovering ? 'rgba(201, 169, 89, 0.2)' : 'rgba(201, 169, 89, 0.4)',
            }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          />
          <motion.div
            className="absolute w-1 h-1 bg-gold rounded-full"
            style={{ x: '-50%', y: '-50%' }}
          />
        </>
      )}
      
      {variant === 'nib' && (
        <div
          className="absolute"
          style={{ 
            transform: 'translate(-50%, -100%)',
            filter: 'drop-shadow(0 0 8px rgba(201, 169, 89, 0.5))'
          }}
        >
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '16px solid var(--gold)',
            }}
          />
          <div
            className="absolute w-1 h-1 bg-ink rounded-full"
            style={{ bottom: -4, left: '50%', transform: 'translateX(-50%)' }}
          />
        </div>
      )}
      
      {variant === 'ink' && (
        <motion.div
          className="absolute w-3 h-3 bg-gold rounded-full"
          style={{ x: '-50%', y: '-50%', filter: 'blur(1px)' }}
          animate={{ scale: isHovering ? 1.5 : 1 }}
        />
      )}
    </motion.div>
  );
}
