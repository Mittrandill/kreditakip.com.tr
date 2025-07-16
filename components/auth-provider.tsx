"use client"

import type React from "react"

export interface AuthProviderProps {
  children: React.ReactNode
}

/**
 * A very light wrapper that can later be replaced with
 * Supabase, NextAuth, or any other auth provider.
 *
 * For now it simply renders its children so that the
 * named export `AuthProvider` is available alongside the
 * default export.
 */
function AuthProvider({ children }: AuthProviderProps) {
  return <>{children}</>
}

export default AuthProvider
export { AuthProvider }
