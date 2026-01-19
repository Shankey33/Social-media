'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import api from './api'

interface User {
  id: string
  email: string
  username: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      // Verify token and get user info
      api.get('/users/me')
        .then((response) => {
          // Only set user if we got valid data
          if (response.data && response.data.id) {
            setUser({
              id: response.data.id,
              email: response.data.email,
              username: response.data.username,
            })
          } else {
            // If response is null or invalid, token might be invalid
            localStorage.removeItem('token')
            setUser(null)
          }
        })
        .catch((error) => {
          // Only handle 401 (unauthorized) errors
          // The API interceptor already removes the token, we just clear local state
          if (error.response?.status === 401) {
            setUser(null)
          } else {
            // For other errors (network, 500, etc.), log but don't clear user
            // This prevents logout on temporary server issues
            console.error('Failed to fetch user data:', error)
            // Keep existing user state if available, or set to null if first load
            // This way temporary errors don't log out the user
          }
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password })
    localStorage.setItem('token', response.data.access_token)
    setUser(response.data.user)
  }

  const signup = async (email: string, username: string, password: string) => {
    const response = await api.post('/auth/signup', { email, username, password })
    localStorage.setItem('token', response.data.access_token)
    setUser(response.data.user)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    // Force full page reload to clear all state
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
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
