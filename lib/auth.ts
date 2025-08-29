import { supabase } from "@/lib/supabase"
import type { Profile } from "@/lib/types"

// Profile cache for better performance
const profileCache = new Map<string, { profile: Profile; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

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
      throw error
    }

    return data
  } catch (error) {
    throw error
  }
}

export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    throw error
  }
}

export async function signInWithGoogle() {
  try {
    // Development için local URL kullan, production için origin
    const isDev = window.location.hostname === "localhost"
    const redirectUrl = isDev ? `http://localhost:3001/auth/callback` : `${window.location.origin}/auth/callback`

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    })

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    throw error
  }
}

export async function signOut() {
  try {
    // Clear profile cache
    profileCache.clear()

    const { error } = await supabase.auth.signOut()

    if (error) {
      throw error
    }
  } catch (error) {
    throw error
  }
}

export async function getCurrentUser() {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      return null
    }

    return user
  } catch (error) {
    return null
  }
}

export async function getProfile(userId: string): Promise<Profile | null> {
  try {
    // Check cache first
    const cached = profileCache.get(userId)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.profile
    }

    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle()

    if (error) {
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
    throw error
  }
}

export async function updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", userId)
      .select()
      .single()

    if (error) {
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
    throw error
  }
}

export function clearProfileCache(userId?: string) {
  if (userId) {
    profileCache.delete(userId)
  } else {
    profileCache.clear()
  }
}

export async function preloadProfile(userId: string) {
  try {
    await getProfile(userId)
  } catch (error) {
    // Silent fail for preloading
  }
}
