"use client"

import { createContext, useState, useEffect, useContext, type ReactNode } from "react"
import { type Session, type SupabaseClient, useSessionContext, useSupabaseClient } from "@supabase/auth-helpers-react"

interface AuthContextProps {
  supabaseClient: SupabaseClient | null
  session: Session | null
  isLoading: boolean
}

const AuthContext = createContext<AuthContextProps>({
  supabaseClient: null,
  session: null,
  isLoading: true,
})

interface Props {
  children: ReactNode
}

const AuthProvider = ({ children }: Props) => {
  const [isLoading, setIsLoading] = useState(true)
  const { session } = useSessionContext()
  const supabaseClient = useSupabaseClient()

  useEffect(() => {
    setIsLoading(false)
  }, [session])

  const value: AuthContextProps = {
    supabaseClient,
    session,
    isLoading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  return useContext(AuthContext)
}

export { AuthProvider }
