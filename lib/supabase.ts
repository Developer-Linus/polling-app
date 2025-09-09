import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Validate environment variables at startup
if (!supabaseUrl || supabaseUrl === 'your-project-url-here') {
  throw new Error(
    'Missing or invalid NEXT_PUBLIC_SUPABASE_URL. Please set your Supabase project URL in .env.local'
  )
}

if (!supabaseAnonKey || supabaseAnonKey === 'your-anon-key-here') {
  throw new Error(
    'Missing or invalid NEXT_PUBLIC_SUPABASE_ANON_KEY. Please set your Supabase anon key in .env.local'
  )
}

// Validate URL format
if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
  throw new Error(
    'Invalid NEXT_PUBLIC_SUPABASE_URL format. Expected: https://your-project-ref.supabase.co'
  )
}

// For client-side usage
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

// For server-side usage (if needed later)
export const createSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey)
}

// Auth helper functions
export const auth = {
  signUp: async (email: string, password: string, options?: { data?: Record<string, any> }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options,
    })
    return { data, error }
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },

  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback)
  }
}