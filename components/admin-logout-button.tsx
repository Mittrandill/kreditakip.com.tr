"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useState } from "react"

export function AdminLogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    router.push("/admin/giris")
    router.refresh()
  }

  return (
    <Button
      variant="ghost"
      className="w-full justify-start text-white/80 hover:text-white hover:bg-white/10"
      onClick={handleLogout}
      disabled={loading}
    >
      <LogOut className="mr-2 h-4 w-4" />
      {loading ? "Çıkış Yapılıyor..." : "Çıkış Yap"}
    </Button>
  )
}
