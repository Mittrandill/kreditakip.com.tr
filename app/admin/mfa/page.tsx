"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ShieldCheck, Loader2, AlertCircle, LogOut } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function AdminMfaChallengePage() {
  const router = useRouter()
  const [initializing, setInitializing] = useState(true)
  const [factorId, setFactorId] = useState<string | null>(null)
  const [code, setCode] = useState("")
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const init = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          router.replace("/admin/giris")
          return
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", session.user.id)
          .single()

        if (!profile?.is_admin) {
          await supabase.auth.signOut()
          router.replace("/admin/giris")
          return
        }

        // Already verified this session
        const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
        if (aal?.currentLevel === "aal2") {
          router.replace("/admin")
          return
        }

        const { data: factors } = await supabase.auth.mfa.listFactors()
        const totp = factors?.totp?.[0]

        if (!totp) {
          // No verified factor -> must enroll first
          router.replace("/admin/mfa-setup")
          return
        }

        if (active) setFactorId(totp.id)
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Bir hata oluştu")
      } finally {
        if (active) setInitializing(false)
      }
    }

    init()
    return () => {
      active = false
    }
  }, [router])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!factorId) return
    setError(null)
    setVerifying(true)

    try {
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      })

      if (challengeError || !challenge) {
        throw new Error(challengeError?.message || "Doğrulama başlatılamadı")
      }

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code: code.trim(),
      })

      if (verifyError) {
        throw new Error("Kod hatalı veya süresi dolmuş. Tekrar deneyin.")
      }

      router.replace("/admin")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Doğrulama başarısız")
      setVerifying(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.replace("/admin/giris")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl mb-4">
            <ShieldCheck className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">İki Adımlı Doğrulama</h1>
          <p className="text-white/60">Authenticator uygulamandaki kodu gir</p>
        </div>

        <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white text-center">Güvenlik Kodu</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="bg-red-500/10 border-red-500/20 text-red-400 mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {initializing ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-white/60" />
              </div>
            ) : (
              <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-white">
                    6 Haneli Kod
                  </Label>
                  <Input
                    id="code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="text-center tracking-[0.5em] text-lg bg-black/20 border-white/10 text-white placeholder:text-white/30"
                    required
                    autoFocus
                    disabled={verifying}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={verifying || code.length !== 6}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                >
                  {verifying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Doğrulanıyor...
                    </>
                  ) : (
                    "Doğrula"
                  )}
                </Button>
              </form>
            )}

            <div className="mt-6 pt-6 border-t border-white/10 text-center">
              <button
                onClick={handleSignOut}
                className="text-sm text-white/50 hover:text-white/80 transition-colors inline-flex items-center gap-1"
              >
                <LogOut className="h-3.5 w-3.5" />
                Çıkış yap
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
