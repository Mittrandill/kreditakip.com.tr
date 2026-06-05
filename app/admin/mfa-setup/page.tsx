"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ShieldCheck, Loader2, AlertCircle, Copy, Check } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function AdminMfaSetupPage() {
  const router = useRouter()
  const [initializing, setInitializing] = useState(true)
  const [factorId, setFactorId] = useState<string | null>(null)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [code, setCode] = useState("")
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

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

        // Verify admin role
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

        // Already fully verified this session -> nothing to set up
        const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
        if (aal?.currentLevel === "aal2") {
          router.replace("/admin")
          return
        }

        // Already has a verified factor -> go enter the code instead
        const { data: factors } = await supabase.auth.mfa.listFactors()
        if (factors?.totp && factors.totp.length > 0) {
          router.replace("/admin/mfa")
          return
        }

        // Clean up any leftover unverified factors before enrolling a fresh one
        const stale = (factors?.all || []).filter((f) => f.status === "unverified")
        for (const f of stale) {
          await supabase.auth.mfa.unenroll({ factorId: f.id })
        }

        // Enroll a new TOTP factor
        const { data, error: enrollError } = await supabase.auth.mfa.enroll({
          factorType: "totp",
          friendlyName: `Admin TOTP ${Date.now()}`,
        })

        if (!active) return

        if (enrollError || !data) {
          setError(enrollError?.message || "MFA kaydı başlatılamadı")
          return
        }

        setFactorId(data.id)
        setQrCode(data.totp.qr_code)
        setSecret(data.totp.secret)
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Bir hata oluştu")
        }
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

  const copySecret = async () => {
    if (!secret) return
    await navigator.clipboard.writeText(secret)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl mb-4">
            <ShieldCheck className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">İki Adımlı Doğrulama Kurulumu</h1>
          <p className="text-white/60">Admin paneli için Google Authenticator gerekli</p>
        </div>

        <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white text-center">Authenticator Bağla</CardTitle>
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
            ) : qrCode ? (
              <div className="space-y-5">
                <ol className="text-sm text-white/70 list-decimal list-inside space-y-1">
                  <li>Google Authenticator uygulamasını aç</li>
                  <li>Aşağıdaki QR kodunu tara</li>
                  <li>Uygulamadaki 6 haneli kodu gir</li>
                </ol>

                <div className="flex justify-center bg-white rounded-xl p-4">
                  {/* Supabase returns the QR as an inline SVG string */}
                  <div
                    className="[&>svg]:w-44 [&>svg]:h-44"
                    dangerouslySetInnerHTML={{ __html: qrCode }}
                  />
                </div>

                {secret && (
                  <div className="space-y-2">
                    <Label className="text-white/70 text-xs">
                      QR çalışmazsa bu anahtarı elle gir:
                    </Label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs text-emerald-300 bg-black/30 rounded-lg px-3 py-2 break-all">
                        {secret}
                      </code>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={copySecret}
                        className="border-white/10 bg-black/20 text-white shrink-0"
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                )}

                <form onSubmit={handleVerify} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="code" className="text-white">
                      Doğrulama Kodu
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
                      "Doğrula ve Tamamla"
                    )}
                  </Button>
                </form>
              </div>
            ) : (
              <p className="text-center text-white/60 py-8">
                Kurulum başlatılamadı. Sayfayı yenileyin.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
