"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type { User, Session } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import { getProfile } from "@/lib/auth"
import type { Profile } from "@/lib/types"

interface AuthState {
  user: User | null
  profile: Profile | null
  loading: boolean
  isAuthenticated: boolean
  session: Session | null
}

const initialState: AuthState = {
  user: null,
  profile: null,
  loading: true,
  isAuthenticated: false,
  session: null,
}

export function useAuth() {
  const [state, setState] = useState<AuthState>(initialState)
  const mountedRef = useRef(true)
  const profileCacheRef = useRef<Map<string, Profile>>(new Map())
  const loadingProfileRef = useRef<Set<string>>(new Set())

  // Optimized profile loader with caching
  const loadProfile = useCallback(async (userId: string) => {
    if (!mountedRef.current) return null

    // Check cache first
    const cachedProfile = profileCacheRef.current.get(userId)
    if (cachedProfile) {
      return cachedProfile
    }

    // Prevent duplicate requests
    if (loadingProfileRef.current.has(userId)) {
      return null
    }

    loadingProfileRef.current.add(userId)

    try {
      const profileData = await getProfile(userId)

      if (profileData && mountedRef.current) {
        // Cache the profile
        profileCacheRef.current.set(userId, profileData)
        return profileData
      }
    } catch (error) {
      console.error("Error loading profile:", error)
    } finally {
      loadingProfileRef.current.delete(userId)
    }

    return null
  }, [])

  // Optimized state updater
  const updateAuthState = useCallback((updates: Partial<AuthState>) => {
    if (!mountedRef.current) return

    setState((prevState) => {
      const newState = { ...prevState, ...updates }

      // Only update if state actually changed
      if (JSON.stringify(prevState) === JSON.stringify(newState)) {
        return prevState
      }

      return newState
    })
  }, [])

  // Handle auth state change
  const handleAuthStateChange = useCallback(
    async (event: string, session: Session | null) => {
      if (!mountedRef.current) return

      const user = session?.user ?? null
      const isAuthenticated = !!user

      // Update basic auth state immediately
      updateAuthState({
        user,
        session,
        isAuthenticated,
        loading: user ? state.loading : false, // Keep loading true if we need to fetch profile
      })

      if (user) {
        // Load profile asynchronously
        const profile = await loadProfile(user.id)
        if (mountedRef.current) {
          updateAuthState({
            profile,
            loading: false,
          })
        }
      } else {
        // Clear profile when user logs out
        updateAuthState({
          profile: null,
          loading: false,
        })
        // Clear cache
        profileCacheRef.current.clear()
      }
    },
    [loadProfile, updateAuthState, state.loading],
  )

  useEffect(() => {
    mountedRef.current = true
    let subscription: any = null

    const initializeAuth = async () => {
      try {
        // Get initial session
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("Error getting session:", error)
          updateAuthState({ loading: false })
          return
        }

        // Handle initial session
        await handleAuthStateChange("INITIAL_SESSION", session)

        // Set up auth state listener
        const {
          data: { subscription: authSubscription },
        } = supabase.auth.onAuthStateChange(handleAuthStateChange)

        subscription = authSubscription
      } catch (error) {
        console.error("Error initializing auth:", error)
        updateAuthState({ loading: false })
      }
    }

    initializeAuth()

    // Cleanup function
    return () => {
      mountedRef.current = false
      if (subscription) {
        subscription.unsubscribe()
      }
      // Clear any pending profile loads
      loadingProfileRef.current.clear()
    }
  }, [handleAuthStateChange, updateAuthState])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  // Refresh profile function
  const refreshProfile = useCallback(async () => {
    if (!state.user?.id || !mountedRef.current) return null

    // Clear cache for this user
    profileCacheRef.current.delete(state.user.id)

    const profile = await loadProfile(state.user.id)
    return profile
  }, [state.user?.id, loadProfile])

  // Clear auth cache function
  const clearAuthCache = useCallback(() => {
    profileCacheRef.current.clear()
    loadingProfileRef.current.clear()
  }, [])

  return {
    ...state,
    refreshProfile,
    clearAuthCache,
  }
}
