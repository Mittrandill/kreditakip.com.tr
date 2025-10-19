"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { getUserProfile, updateUserTheme, type ThemePreference } from "@/lib/api/profiles"
import { usePathname } from "next/navigation"

interface ThemeContextType {
  theme: ThemePreference
  setTheme: (theme: ThemePreference) => Promise<void>
  isLoading: boolean
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  setTheme: async () => {},
  isLoading: true,
})

export function UserThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const pathname = usePathname()
  const [theme, setThemeState] = useState<ThemePreference>("light")
  const [isLoading, setIsLoading] = useState(true)
  const isUygulamaRoute = pathname?.startsWith("/uygulama")

  // Load theme from Supabase when user logs in
  useEffect(() => {
    const loadTheme = async () => {
      // Always remove dark class if not in uygulama routes
      if (!isUygulamaRoute) {
        document.documentElement.classList.remove("dark")
        setThemeState("light")
        setIsLoading(false)
        return
      }

      // If no user, set to light and stop loading
      if (!user?.id) {
        setThemeState("light")
        document.documentElement.classList.remove("dark")
        setIsLoading(false)
        return
      }

      // Load user's theme from Supabase
      try {
        const profile = await getUserProfile(user.id)
        const userTheme = profile?.theme || "light"
        setThemeState(userTheme)

        // Apply theme to DOM only in uygulama routes
        if (userTheme === "dark") {
          document.documentElement.classList.add("dark")
        } else {
          document.documentElement.classList.remove("dark")
        }
      } catch (error) {
        // Silent error handling in production
        setThemeState("light")
        document.documentElement.classList.remove("dark")
      } finally {
        setIsLoading(false)
      }
    }

    loadTheme()
  }, [user?.id, isUygulamaRoute])

  // Cleanup effect - remove dark class when leaving uygulama routes
  useEffect(() => {
    return () => {
      if (!pathname?.startsWith("/uygulama")) {
        document.documentElement.classList.remove("dark")
      }
    }
  }, [pathname])

  // Update theme
  const setTheme = async (newTheme: ThemePreference) => {
    if (!user?.id || !isUygulamaRoute) {
      return
    }

    try {
      // Update state immediately
      setThemeState(newTheme)

      // Apply to DOM immediately
      if (newTheme === "dark") {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }

      // Save to Supabase
      await updateUserTheme(user.id, newTheme)
    } catch (error) {
      // Revert on error
      const profile = await getUserProfile(user.id)
      const originalTheme = profile?.theme || "light"
      setThemeState(originalTheme)

      if (originalTheme === "dark") {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useUserTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useUserTheme must be used within UserThemeProvider")
  }
  return context
}
