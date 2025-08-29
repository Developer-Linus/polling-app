"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { User } from '@/lib/types'
import { auth, supabase } from '@/lib/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Convert Supabase user to our User type
const convertSupabaseUser = (supabaseUser: SupabaseUser): User => {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
    avatar: supabaseUser.user_metadata?.avatar_url || null,
    createdAt: supabaseUser.created_at
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(convertSupabaseUser(session.user))
      }
      setIsLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(convertSupabaseUser(session.user))
        } else {
          setUser(null)
        }
        setIsLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const { data, error } = await auth.signIn(email, password)
      
      if (error) {
        console.error('Login error:', error)
        setIsLoading(false)
        
        // Provide user-friendly error messages
        let userMessage = 'Login failed. Please try again.'
        if (error.message.includes('Invalid login credentials')) {
          userMessage = 'Invalid email or password. Please check your credentials.'
        } else if (error.message.includes('Email not confirmed')) {
          userMessage = 'Please check your email and confirm your account before signing in.'
        } else if (error.message.includes('Too many requests')) {
          userMessage = 'Too many login attempts. Please wait a moment before trying again.'
        }
        
        return { success: false, error: userMessage }
      }
      
      if (data.user) {
        setUser(convertSupabaseUser(data.user))
      }
      
      setIsLoading(false)
      return { success: true }
    } catch (error) {
      console.error('Unexpected login error:', error)
      setIsLoading(false)
      return { success: false, error: 'An unexpected error occurred. Please try again.' }
    }
  }

  const register = async (email: string, password: string, name: string) => {
    setIsLoading(true)
    try {
      const { data, error } = await auth.signUp(email, password)
      
      if (error) {
        console.error('Registration error:', error)
        setIsLoading(false)
        
        // Provide user-friendly error messages
        let userMessage = 'Registration failed. Please try again.'
        if (error.message.includes('User already registered')) {
          userMessage = 'An account with this email already exists. Please sign in instead.'
        } else if (error.message.includes('Password should be at least')) {
          userMessage = 'Password must be at least 6 characters long.'
        } else if (error.message.includes('Invalid email')) {
          userMessage = 'Please enter a valid email address.'
        } else if (error.message.includes('Signup is disabled')) {
          userMessage = 'Account registration is currently disabled. Please contact support.'
        }
        
        return { success: false, error: userMessage }
      }
      
      // Update user metadata with name
      if (data.user) {
        await supabase.auth.updateUser({
          data: { name }
        })
        setUser(convertSupabaseUser(data.user))
      }
      
      setIsLoading(false)
      return { success: true }
    } catch (error) {
      console.error('Unexpected registration error:', error)
      setIsLoading(false)
      return { success: false, error: 'An unexpected error occurred during registration. Please try again.' }
    }
  }

  const logout = async () => {
    await auth.signOut()
    setUser(null)
  }

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
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