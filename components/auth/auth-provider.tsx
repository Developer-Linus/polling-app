"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { User, AuthContextType } from '@/lib/types'
import { auth, supabase } from '@/lib/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'

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
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setUser(convertSupabaseUser(session.user))
        }
      } catch (error) {
        console.error('Failed to get initial session:', error)
      } finally {
        setIsLoading(false)
      }
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
        
        // Map error status codes to user-friendly messages
        let userMessage = 'Login failed. Please try again.'
        const status = error?.status || (error as any)?.code
        
        if (status === 429) {
          userMessage = 'Too many login attempts. Please wait a moment before trying again.'
        } else if (status === 400 || status === 401) {
          userMessage = 'Invalid email or password. Please check your credentials.'
        } else if (status === 403) {
          userMessage = 'Please check your email and confirm your account before signing in.'
        }
        
        return { success: false, error: userMessage }
      }
      
      if (data.user) {
        setUser(convertSupabaseUser(data.user))
      }
      
      return { success: true }
    } catch (error) {
      console.error('Unexpected login error:', error)
      return { success: false, error: 'An unexpected error occurred. Please try again.' }
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (email: string, password: string, name: string) => {
    setIsLoading(true)
    try {
      // Pass metadata directly to signUp
      const { data, error } = await auth.signUp(email, password, { data: { name } })
      
      if (error) {
        console.error('Registration error:', error)
        
        // Provide user-friendly error messages
        let userMessage = 'Registration failed. Please try again.'
        
        // In production, use generic messages to prevent account enumeration
        if (process.env.NODE_ENV === 'production') {
          userMessage = 'Registration failed. Please try again or sign in.'
        } else {
          // Detailed messages only in development
          if (error.message.includes('User already registered')) {
            userMessage = 'An account with this email already exists. Please sign in instead.'
          } else if (error.message.includes('Password should be at least')) {
            userMessage = 'Password must be at least 6 characters long.'
          } else if (error.message.includes('Invalid email')) {
            userMessage = 'Please enter a valid email address.'
          } else if (error.message.includes('Signup is disabled')) {
            userMessage = 'Account registration is currently disabled. Please contact support.'
          }
        }
        
        return { success: false, error: userMessage }
      }
      
      // Set user immediately after successful signUp
      if (data.user) {
        const convertedUser = convertSupabaseUser(data.user)
        // Set name in local state immediately
        setUser({ ...convertedUser, name })
        
        // Try to update user metadata as fallback, but don't block on failure
        try {
          await supabase.auth.updateUser({
            data: { name }
          })
        } catch (updateError) {
          console.warn('Failed to update user metadata, but signup was successful:', updateError)
        }
      }
      
      return { success: true }
    } catch (error) {
      console.error('Unexpected registration error:', error)
      return { success: false, error: 'An unexpected error occurred during registration. Please try again.' }
    } finally {
      setIsLoading(false)
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