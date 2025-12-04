'use client'

import React from 'react'

interface GoldCardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
}

export function GoldCard({ children, className = '', hover = false, onClick }: GoldCardProps) {
  return (
    <div
      className={`
        relative
        bg-charcoal/85
        backdrop-blur-xl
        border border-gold-primary/30
        rounded-2xl
        p-8
        shadow-[0_10px_40px_rgba(0,0,0,0.3),inset_0_0_20px_rgba(212,175,55,0.1)]
        transition-all duration-300
        ${hover ? 'hover:border-gold-primary/60 hover:shadow-[0_20px_60px_rgba(212,175,55,0.2),inset_0_0_30px_rgba(212,175,55,0.15)] hover:-translate-y-1' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

interface GoldCardHeaderProps {
  children: React.ReactNode
  className?: string
}

export function GoldCardHeader({ children, className = '' }: GoldCardHeaderProps) {
  return (
    <div className={`border-b border-gold-primary/20 pb-6 mb-6 ${className}`}>
      {children}
    </div>
  )
}

interface GoldCardTitleProps {
  children: React.ReactNode
  className?: string
}

export function GoldCardTitle({ children, className = '' }: GoldCardTitleProps) {
  return (
    <h3 className={`font-serif text-3xl font-light text-gold-primary tracking-wide ${className}`}>
      {children}
    </h3>
  )
}

interface GoldCardSubtitleProps {
  children: React.ReactNode
  className?: string
}

export function GoldCardSubtitle({ children, className = '' }: GoldCardSubtitleProps) {
  return (
    <p className={`text-sm uppercase tracking-[0.15em] text-gold-light/70 mt-2 ${className}`}>
      {children}
    </p>
  )
}

interface GoldCardContentProps {
  children: React.ReactNode
  className?: string
}

export function GoldCardContent({ children, className = '' }: GoldCardContentProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {children}
    </div>
  )
}

interface GoldButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'outline'
  className?: string
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}

export function GoldButton({ 
  children, 
  onClick, 
  variant = 'primary', 
  className = '', 
  disabled = false,
  type = 'button'
}: GoldButtonProps) {
  const baseStyles = 'px-8 py-4 rounded-lg font-medium tracking-wide transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variants = {
    primary: 'bg-gradient-to-r from-gold-dark to-gold-primary text-obsidian hover:shadow-[0_10px_40px_rgba(212,175,55,0.4)] hover:-translate-y-0.5',
    secondary: 'bg-charcoal/90 border border-gold-primary/30 text-gold-primary hover:border-gold-primary/60 hover:bg-charcoal',
    outline: 'border border-gold-primary/50 text-gold-primary hover:bg-gold-primary/10 hover:border-gold-primary'
  }
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

interface GoldInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
  className?: string
  disabled?: boolean
}

export function GoldInput({ 
  value, 
  onChange, 
  placeholder = '', 
  type = 'text', 
  className = '',
  disabled = false
}: GoldInputProps) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={`
        w-full
        px-6 py-4
        bg-charcoal/50
        border border-gold-primary/30
        rounded-lg
        text-pearl
        placeholder:text-gold-light/40
        focus:outline-none
        focus:border-gold-primary/60
        focus:shadow-[0_0_20px_rgba(212,175,55,0.2)]
        transition-all duration-300
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    />
  )
}

interface GoldTextareaProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  className?: string
  disabled?: boolean
}

export function GoldTextarea({ 
  value, 
  onChange, 
  placeholder = '', 
  rows = 4, 
  className = '',
  disabled = false
}: GoldTextareaProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      disabled={disabled}
      className={`
        w-full
        px-6 py-4
        bg-charcoal/50
        border border-gold-primary/30
        rounded-lg
        text-pearl
        placeholder:text-gold-light/40
        focus:outline-none
        focus:border-gold-primary/60
        focus:shadow-[0_0_20px_rgba(212,175,55,0.2)]
        transition-all duration-300
        resize-none
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    />
  )
}
