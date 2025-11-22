'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface GlassNavBarProps {
  logo?: string
  items?: { label: string; href: string; onClick?: () => void }[]
  onLogoClick?: () => void
}

export function GlassNavBar({ logo = 'HEIRLOOM', items = [], onLogoClick }: GlassNavBarProps) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-[1000] px-6 md:px-16 py-6 md:py-10 flex justify-between items-center transition-all duration-500 ${
        scrolled
          ? 'bg-obsidian/90 backdrop-blur-[30px] border-b border-gold/20'
          : 'bg-gradient-to-b from-obsidian/90 to-transparent backdrop-blur-[20px]'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
    >
      <motion.div
        className="flex items-center gap-4 cursor-pointer"
        onClick={onLogoClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="w-10 h-[1px] bg-gradient-to-r from-transparent via-gold to-transparent" />
        <span className="font-serif text-2xl md:text-3xl font-light tracking-[0.3em] text-gold">
          {logo}
        </span>
      </motion.div>

      <ul className="hidden md:flex gap-12 list-none">
        {items.map((item, index) => (
          <motion.li
            key={index}
            className="relative text-xs tracking-[0.2em] uppercase text-gold-light/70 cursor-pointer group"
            onClick={item.onClick}
            whileHover={{ opacity: 1, color: 'rgb(212, 175, 55)' }}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 0.7, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
          >
            {item.label}
            <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-gold transition-all duration-300 group-hover:w-full" />
          </motion.li>
        ))}
      </ul>
    </motion.nav>
  )
}
