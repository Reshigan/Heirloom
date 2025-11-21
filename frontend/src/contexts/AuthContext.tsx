'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { apiClient, User } from '@/lib/api'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string, familyName: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('heirloom:auth:token') : null
        if (token) {
          apiClient.setToken(token)
          const currentUser = await apiClient.getMe()
          setUser(currentUser)
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error)
        apiClient.clearToken()
        if (typeof window !== 'undefined') {
          localStorage.removeItem('heirloom:auth:token')
        }
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.login(email.trim().toLowerCase(), password)
      if (typeof window !== 'undefined') {
        localStorage.setItem('heirloom:auth:token', response.access_token)
      }
      setUser(response.user)
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  const register = async (email: string, password: string, name: string, familyName: string) => {
    try {
      const user = await apiClient.register(email, password, name, familyName)
      await login(email, password)
    } catch (error) {
      console.error('Registration failed:', error)
      throw error
    }
  }

  const logout = () => {
    apiClient.clearToken()
    if (typeof window !== 'undefined') {
      localStorage.removeItem('heirloom:auth:token')
    }
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
