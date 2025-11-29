"use client"

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Home, Search, Plus, User, Settings, Heart, Camera, BookOpen } from 'lucide-react'

interface NavItem {
  id: string
  icon: React.ReactNode
  label: string
  href: string
  color: string
}

const navItems: NavItem[] = [
  { id: 'home', icon: <Home size={20} />, label: 'Home', href: '/', color: '#667eea' },
  { id: 'memories', icon: <Camera size={20} />, label: 'Memories', href: '/memories', color: '#764ba2' },
  { id: 'stories', icon: <BookOpen size={20} />, label: 'Stories', href: '/stories', color: '#4facfe' },
  { id: 'search', icon: <Search size={20} />, label: 'Search', href: '/search', color: '#00f2fe' },
  { id: 'add', icon: <Plus size={20} />, label: 'Add Memory', href: '/add', color: '#f093fb' },
  { id: 'favorites', icon: <Heart size={20} />, label: 'Favorites', href: '/favorites', color: '#f5576c' },
  { id: 'profile', icon: <User size={20} />, label: 'Profile', href: '/profile', color: '#667eea' },
  { id: 'settings', icon: <Settings size={20} />, label: 'Settings', href: '/settings', color: '#764ba2' }
]

export function FloatingNavigation() {
  const [activeItem, setActiveItem] = useState('home')
  const [isExpanded, setIsExpanded] = useState(false)
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const containerVariants = {
    collapsed: {
      width: 60,
      height: 60,
      borderRadius: 30
    },
    expanded: {
      width: 'auto',
      height: 'auto',
      borderRadius: 24
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, scale: 0, rotate: -180 },
    visible: (i: number) => ({
      opacity: 1,
      scale: 1,
      rotate: 0
    }),
    exit: { opacity: 0, scale: 0, rotate: 180 }
  }

  return (
    <>
      {/* Main Floating Navigation */}
      <motion.nav
        className="fixed bottom-8 left-1/2 transform -trangold-x-1/2 z-50"
        style={{
          y: scrollY > 100 ? 10 : 0
        }}
        animate={{
          y: scrollY > 100 ? 10 : 0
        }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="glass-morphism p-3 cursor-pointer"
          variants={containerVariants}
          animate={isExpanded ? "expanded" : "collapsed"}
          transition={{ duration: 0.3 }}
          onHoverStart={() => setIsExpanded(true)}
          onHoverEnd={() => setIsExpanded(false)}
          whileHover={{ scale: 1.05 }}
        >
          <AnimatePresence mode="wait">
            {!isExpanded ? (
              // Collapsed State - Show active item
              <motion.div
                key="collapsed"
                className="flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                  style={{
                    background: navItems.find(item => item.id === activeItem)?.color || '#667eea'
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {navItems.find(item => item.id === activeItem)?.icon}
                </motion.div>
              </motion.div>
            ) : (
              // Expanded State - Show all items
              <motion.div
                key="expanded"
                className="flex items-center space-x-2 px-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {navItems.map((item, index) => (
                  <motion.button
                    key={item.id}
                    className={`relative p-3 rounded-2xl transition-all duration-300 group ${
                      activeItem === item.id ? 'text-white' : 'text-white/70 hover:text-white'
                    }`}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    custom={index}
                    onClick={() => setActiveItem(item.id)}
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {/* Background glow for active item */}
                    {activeItem === item.id && (
                      <motion.div
                        className="absolute inset-0 rounded-2xl"
                        style={{ background: item.color }}
                        layoutId="activeBackground"
                        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                      />
                    )}
                    
                    {/* Icon */}
                    <motion.div
                      className="relative z-10"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      {item.icon}
                    </motion.div>
                    
                    {/* Tooltip */}
                    <motion.div
                      className="absolute -top-12 left-1/2 transform -trangold-x-1/2 px-2 py-1 bg-black/80 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none"
                      initial={{ y: 10, opacity: 0 }}
                      whileHover={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      {item.label}
                      <div className="absolute top-full left-1/2 transform -trangold-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/80" />
                    </motion.div>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.nav>

      {/* Quick Action Buttons */}
      <motion.div
        className="fixed bottom-8 right-8 flex flex-col space-y-4 z-40"
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        {/* Add Memory Quick Action */}
        <motion.button
          className="w-14 h-14 rounded-full glass-morphism flex items-center justify-center text-white group"
          style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setActiveItem('add')}
        >
          <Plus size={24} />
          
          {/* Tooltip */}
          <motion.div
            className="absolute right-16 px-3 py-2 bg-black/80 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none"
            initial={{ x: 10, opacity: 0 }}
            whileHover={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            Add New Memory
            <div className="absolute top-1/2 left-full transform -trangold-y-1/2 w-0 h-0 border-t-4 border-b-4 border-l-4 border-transparent border-l-black/80" />
          </motion.div>
        </motion.button>

        {/* Search Quick Action */}
        <motion.button
          className="w-12 h-12 rounded-full glass-morphism flex items-center justify-center text-white group"
          style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setActiveItem('search')}
        >
          <Search size={20} />
          
          {/* Tooltip */}
          <motion.div
            className="absolute right-14 px-3 py-2 bg-black/80 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none"
            initial={{ x: 10, opacity: 0 }}
            whileHover={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            Quick Search
            <div className="absolute top-1/2 left-full transform -trangold-y-1/2 w-0 h-0 border-t-4 border-b-4 border-l-4 border-transparent border-l-black/80" />
          </motion.div>
        </motion.button>
      </motion.div>

      {/* Floating Menu Indicator */}
      <motion.div
        className="fixed bottom-4 left-1/2 transform -trangold-x-1/2 z-30"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        <motion.div
          className="flex space-x-1"
          animate={{
            y: [0, -5, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1 h-1 bg-white/30 rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 1, 0.3]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut"
              }}
            />
          ))}
        </motion.div>
      </motion.div>
    </>
  )
}