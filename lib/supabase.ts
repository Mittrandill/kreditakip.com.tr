import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: "pkce",
    onAuthStateChange: (event, session) => {
      if (event === "TOKEN_REFRESHED" && !session) {
        // Token refresh failed, clear any corrupted session data
        console.warn("[v0] Token refresh failed, clearing session")
        if (typeof window !== "undefined") {
          localStorage.removeItem("sb-" + supabaseUrl.split("//")[1].split(".")[0] + "-auth-token")
        }
      }
    },
  },
  global: {
    headers: {
      "X-Client-Info": "kreditakip-web",
    },
  },
})

if (typeof window !== "undefined") {
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT" && !session) {
      // Clear any cached data when user is signed out
      localStorage.removeItem("sb-" + supabaseUrl.split("//")[1].split(".")[0] + "-auth-token")
    }
  })

  // Handle refresh token errors globally
  const originalGetSession = supabase.auth.getSession
  supabase.auth.getSession = async function () {
    try {
      return await originalGetSession.call(this)
    } catch (error: any) {
      if (error?.message?.includes("refresh") || error?.message?.includes("token")) {
        console.warn("[v0] Session recovery failed, clearing corrupted session:", error.message)
        // Clear corrupted session data
        localStorage.removeItem("sb-" + supabaseUrl.split("//")[1].split(".")[0] + "-auth-token")
        // Return empty session
        return { data: { session: null }, error: null }
      }
      throw error
    }
  }
}
