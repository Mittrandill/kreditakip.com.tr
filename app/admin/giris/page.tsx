"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, Lock, Mail, Loader2, AlertCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Sign in
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        throw new Error("E-posta veya şifre hatalı")
      }

      if (!authData.user) {
        throw new Error("Giriş yapılamadı")
      }

      // Check if user is admin
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", authData.user.id)
        .single()

      if (profileError) {
        throw new Error("Kullanıcı bilgileri alınamadı")
      }

      if (!profile?.is_admin) {
        // Sign out non-admin user
        await supabase.auth.signOut()
        throw new Error("Bu hesabın admin yetkisi bulunmuyor")
      }

      // SECURITY: Route based on TOTP MFA state (AAL).
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()

      if (aal?.nextLevel !== "aal2") {
        // No verified authenticator yet -> enroll one
        router.push("/admin/mfa-setup")
      } else if (aal.currentLevel !== "aal2") {
        // Has authenticator but needs to enter a code this session
        router.push("/admin/mfa")
      } else {
        router.push("/admin")
      }
      router.refresh()
    } catch (err) {
      console.error("Login error:", err)
      setError(err instanceof Error ? err.message : "Bir hata oluştu")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Admin Panel</h1>
          <p className="text-white/60">Kredi Takip Yönetim Girişi</p>
        </div>

        {/* Login Form */}
        <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white text-center">Admin Girişi</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Alert */}
              {error && (
                <Alert className="bg-red-500/10 border-red-500/20 text-red-400">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">
                  E-posta
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@kreditakip.com.tr"
                    className="pl-10 bg-black/20 border-white/10 text-white placeholder:text-white/40"
                    required
                    autoComplete="email"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">
                  Şifre
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 bg-black/20 border-white/10 text-white placeholder:text-white/40"
                    required
                    autoComplete="current-password"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Giriş Yapılıyor...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Admin Girişi
                  </>
                )}
              </Button>
            </form>

            {/* Info */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="text-center space-y-2">
                <p className="text-xs text-white/40">
                  Admin paneline sadece yetkili kullanıcılar erişebilir
                </p>
                <a
                  href="/"
                  className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors block"
                >
                  Ana Sayfaya Dön
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <p className="text-xs text-white/40">
            🔒 Güvenli bağlantı ile korunmaktadır
          </p>
        </div>
      </div>
    </div>
  )
}
