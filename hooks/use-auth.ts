"use client"

import type React from "react"

import { useState, useEffect, createContext, useContext } from "react"
import { useRouter } from "next/router"
import { Magic } from "magic-sdk"

const AuthContext = createContext<{
  user: any | null
  isLoading: boolean
  login: (email: string) => Promise<void>
  logout: () => Promise<void>
}>({
  user: null,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const magic = new Magic(process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY!)

    const checkUser = async () => {
      try {
        const isLoggedIn = await magic.user.isLoggedIn()
        if (isLoggedIn) {
          const userData = await magic.user.getMetadata()
          setUser(userData)
        }
      } catch (error) {
        // Handle error appropriately, maybe set user to null or display an error message
      } finally {
        setIsLoading(false)
      }
    }

    checkUser()

    // Log out user if they navigate to /logout
    if (router.pathname === "/logout") {
      logout()
    }
  }, [router])

  const login = async (email: string) => {
    try {
      const magic = new Magic(process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY!)
      await magic.auth.loginWithMagicLink({ email })
      const userData = await magic.user.getMetadata()
      setUser(userData)
      router.push("/profile")
    } catch (error) {
      // Handle error appropriately
    }
  }

  const logout = async () => {
    try {
      const magic = new Magic(process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY!)
      await magic.user.logout()
      setUser(null)
      router.push("/")
    } catch (error) {
      // Handle error appropriately
    }
  }

  return <AuthContext.Provider value={{ user, isLoading, login, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
