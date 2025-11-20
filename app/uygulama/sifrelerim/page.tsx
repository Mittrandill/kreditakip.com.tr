"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function PasswordsRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to main application page
    router.replace("/uygulama/ana-sayfa")
  }, [router])

  return null
}
