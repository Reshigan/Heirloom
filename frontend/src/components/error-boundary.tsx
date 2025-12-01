'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-obsidian-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-obsidian-800 border border-gold/20 rounded-lg p-8 text-center">
            <div className="text-gold-400 text-xl font-serif mb-4">Something went wrong</div>
            <p className="text-gold-200/70 mb-6">
              We encountered an error while displaying this content. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-gradient-to-r from-gold/20 to-gold/10 border border-gold-500/30 text-gold-400 rounded-lg hover:from-gold/30 hover:to-gold/20 transition-all"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
