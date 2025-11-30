'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { apiClient, User } from '@/lib/api-client'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  token: string | null
  vmkSalt: string | null
  hasCheckedAuth: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string, familyName: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const getInitialToken = () => typeof window !== 'undefined' ? localStorage.getItem('heirloom:auth:token') : null
  const getInitialSalt = () => typeof window !== 'undefined' ? localStorage.getItem('heirloom:vault:salt') : null
  
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [token, setToken] = useState<string | null>(getInitialToken())
  const [vmkSalt, setVmkSalt] = useState<string | null>(getInitialSalt())
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false)

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = getInitialToken()
        if (storedToken) {
          apiClient.setToken(storedToken)
          setToken(storedToken)
          try {
            const currentUser = await apiClient.getMe()
            setUser(currentUser)
          } catch (error) {
            console.error('Failed to fetch user, but keeping token:', error)
          }
        } else {
          setToken(null)
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error)
      } finally {
        setIsLoading(false)
        setHasCheckedAuth(true)
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
        isAuthenticated: !!user || !!token,
        token,
        vmkSalt,
        hasCheckedAuth,
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
