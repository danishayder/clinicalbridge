import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import type { Profile, UserRole } from '@/types'

interface AuthState {
  user: Profile | null
  session: any | null
  isAuthenticated: boolean
  isLoading: boolean
  orgId: string | null
  setUser: (user: Profile | null) => void
  setSession: (session: any | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void
  hasRole: (roles: UserRole[]) => boolean
  isAdmin: () => boolean
  isProgramAdmin: () => boolean
  isStudent: () => boolean
  isCI: () => boolean
  isSiteAdmin: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: true,
      orgId: null,
      setUser: (user) => set({ user, isAuthenticated: !!user, orgId: user?.org_id || null }),
      setSession: (session) => set({ session }),
      setLoading: (isLoading) => set({ isLoading }),
      logout: async () => {
        await supabase.auth.signOut()
        set({ user: null, session: null, isAuthenticated: false, orgId: null })
      },
      hasRole: (roles) => {
        const user = get().user
        return user ? roles.includes(user.role) : false
      },
      isAdmin: () => {
        const user = get().user
        return user ? ['system_admin', 'program_admin'].includes(user.role) : false
      },
      isProgramAdmin: () => {
        const user = get().user
        return user ? user.role === 'program_admin' || user.role === 'system_admin' : false
      },
      isStudent: () => {
        const user = get().user
        return user ? user.role === 'student' : false
      },
      isCI: () => {
        const user = get().user
        return user ? user.role === 'clinical_instructor' : false
      },
      isSiteAdmin: () => {
        const user = get().user
        return user ? user.role === 'site_admin' : false
      },
    }),
    {
      name: 'clinical-bridge-auth',
      partialize: (state) => ({ user: state.user, session: state.session, isAuthenticated: state.isAuthenticated, orgId: state.orgId }),
    }
  )
)

export function useAuth() {
  const { user, isAuthenticated, isLoading, logout, hasRole, isAdmin, isProgramAdmin, isStudent, isCI, isSiteAdmin } = useAuthStore()
  return { user, isAuthenticated, isLoading, logout, hasRole, isAdmin, isProgramAdmin, isStudent, isCI, isSiteAdmin }
}

// Auth initialization hook
export function useAuthInit() {
  const { setUser, setSession, setLoading } = useAuthStore()

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true)

      // Get current session
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)

      if (session?.user) {
        // Fetch profile with org info
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single()

        if (profile) {
          setUser(profile as Profile)
        }
      }

      setLoading(false)

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          setSession(session)
          if (session?.user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', session.user.id)
              .single()
            setUser(profile as Profile)
          } else {
            setUser(null)
          }
        }
      )

      return () => subscription.unsubscribe()
    }

    initAuth()
  }, [])
}

import { useEffect } from 'react'
