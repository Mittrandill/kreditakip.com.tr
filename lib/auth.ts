import { supabase } from "@/lib/supabase"
import type { Profile } from "@/lib/types"

// Profile cache for better performance
const profileCache = new Map<string, { profile: Profile; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Auth helper functions using optimized Supabase client
 */

/**
 * Register a new user and store first/last name via metadata
 */
export async function signUp(email: string, password: string, userData: Partial<Profile>) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: userData.first_name,
          last_name: userData.last_name,
        },
      },
    })

    if (error) {
      console.error("Error signing up user:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("SignUp error:", error)
    throw error
  }
}

/**
 * Sign in an existing user with email and password
 */
export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error("Error signing in:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("SignIn error:", error)
    throw error
  }
}

/**
 * Sign out the current user
 */
export async function signOut() {
  try {
    // Clear profile cache
    profileCache.clear()

    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error("Error signing out:", error)
      throw error
    }
  } catch (error) {
    console.error("SignOut error:", error)
    throw error
  }
}

/**
 * Get details of the currently authenticated user
 */
export async function getCurrentUser() {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      console.error("Error getting current user:", error)
      return null
    }

    return user
  } catch (error) {
    console.error("GetCurrentUser error:", error)
    return null
  }
}

/**
 * Fetch a user's profile by their ID with caching
 */
export async function getProfile(userId: string): Promise<Profile | null> {
  try {
    // Check cache first
    const cached = profileCache.get(userId)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.profile
    }

    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle()

    if (error) {
      console.error("Error fetching profile:", error)
      throw error
    }

    // Cache the result
    if (data) {
      profileCache.set(userId, {
        profile: data,
        timestamp: Date.now(),
      })
    }

    return data
  } catch (error) {
    console.error("GetProfile error:", error)
    throw error
  }
}

/**
 * Update a user's profile fields
 */
export async function updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", userId)
      .select()
      .single()

    if (error) {
      console.error("Error updating profile:", error)
      throw error
    }

    // Update cache
    if (data) {
      profileCache.set(userId, {
        profile: data,
        timestamp: Date.now(),
      })
    }

    return data
  } catch (error) {
    console.error("UpdateProfile error:", error)
    throw error
  }
}

/**
 * Clear profile cache for a specific user or all users
 */
export function clearProfileCache(userId?: string) {
  if (userId) {
    profileCache.delete(userId)
  } else {
    profileCache.clear()
  }
}

/**
 * Preload profile for better UX
 */
export async function preloadProfile(userId: string) {
  try {
    await getProfile(userId)
  } catch (error) {
    console.error("Error preloading profile:", error)
  }
}
