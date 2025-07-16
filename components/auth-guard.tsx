"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/router"
import { useSession } from "next-auth/react"

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { data: session, status } = useSession()
  const router = useRouter()
  const isAuth = status === "authenticated"
  const isUnauthenticated = status === "unauthenticated"

  useEffect(() => {
    if (isUnauthenticated) {
      router.push("/login")
    }
  }, [isUnauthenticated, router])

  if (isAuth) {
    return <>{children}</>
  }

  return null
}

export default AuthGuard
