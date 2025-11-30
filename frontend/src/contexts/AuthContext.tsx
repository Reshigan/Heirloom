'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { apiClient, User } from '@/lib/api-client'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  token: string | null
  vmkSalt: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string, familyName: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const getInitialToken = () => typeof window !== 'undefined' ? localStorage.getItem('heirloom:auth:token') : null
  const getInitialSalt = () => typeof window !== 'undefined' ? localStorage.getItem('heirloom:vault:salt') : null
  
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true) // Start as true to prevent auth modal from opening before we check for token
  const [token, setToken] = useState<string | null>(getInitialToken()) // Initialize token from localStorage to avoid SSR/hydration issues
  const [vmkSalt, setVmkSalt] = useState<string | null>(getInitialSalt())

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = getInitialToken()
        setToken(storedToken) // Set token in state immediately
        if (storedToken) {
          const currentUser = await apiClient.getMe()
          setUser(currentUser)
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error)
        apiClient.clearToken()
        setToken(null)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.login(email, password)
      setUser(response.user)
      setToken(response.token)
      if (typeof window !== 'undefined') {
        const salt = localStorage.getItem('heirloom:vault:salt')
        setVmkSalt(salt)
        sessionStorage.setItem('heirloom:vault:password', password)
      }
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  const register = async (email: string, password: string, name: string, familyName: string) => {
    try {
      const response = await apiClient.register(email, password, name, familyName)
      if (response.vmkSalt && typeof window !== 'undefined') {
        localStorage.setItem('heirloom:vault:salt', response.vmkSalt)
        setVmkSalt(response.vmkSalt)
        sessionStorage.setItem('heirloom:vault:password', password)
      }
      await login(email, password)
    } catch (error) {
      console.error('Registration failed:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await apiClient.logout()
    } catch (error) {
      console.error('Logout API call failed:', error)
    }
    apiClient.clearToken()
    setUser(null)
    setToken(null)
    setVmkSalt(null)
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('heirloom:vault:password')
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user || !!token, // Show as authenticated if we have a token, even before user data loads
        token,
        vmkSalt,
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
