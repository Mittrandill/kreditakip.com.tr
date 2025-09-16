"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, Key, CheckCircle, XCircle, Eye, EyeOff, ArrowLeft, Mail, KeyRound } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import Header from "@/components/layout/header"
import Footer from "@/components/footer"

function NewPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [isLoading, setIsLoading] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [resetStatus, setResetStatus] = useState<"form" | "success" | "error" | "invalid">("form")
  const [hasValidSession, setHasValidSession] = useState(false)

  useEffect(() => {
    // Check if we have a valid session for password reset
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session) {
        setHasValidSession(true)
      } else {
        // Check if we have access_token and refresh_token in URL
        const accessToken = searchParams.get("access_token")
        const refreshToken = searchParams.get("refresh_token")

        if (accessToken && refreshToken) {
          try {
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })

            if (error) {
              console.error("Session error:", error)
              setResetStatus("invalid")
            } else {
              setHasValidSession(true)
            }
          } catch (error) {
            console.error("Session setup error:", error)
            setResetStatus("invalid")
          }
        } else {
          setResetStatus("invalid")
        }
      }
    }

    checkSession()
  }, [searchParams])

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newPassword || !confirmPassword) {
      toast({
        title: "Hata",
        description: "Lütfen tüm alanları doldurun.",
        variant: "destructive",
      })
      return
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Hata",
        description: "Şifreler eşleşmiyor.",
        variant: "destructive",
      })
      return
    }

    if (newPassword.length < 6) {
      toast({
        title: "Hata",
        description: "Şifre en az 6 karakter olmalıdır.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) {
        throw error
      }

      setResetStatus("success")
      toast({
        title: "Başarılı",
        description: "Şifreniz başarıyla güncellendi!",
      })

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/giris")
      }, 3000)
    } catch (error: any) {
      console.error("Password reset error:", error)
      setResetStatus("error")
      toast({
        title: "Hata",
        description: error.message || "Şifre güncellenirken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (resetStatus === "invalid") {
    return (
      <div className="min-h-screen w-full bg-[#151515] text-white font-sans flex flex-col">
        <div className="absolute inset-0 -z-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vh] bg-emerald-500/20 blur-[150px] rounded-full" />
        </div>

        <Header />

        <main className="flex-1 flex items-center justify-center p-4 relative z-10">
          <div className="w-full max-w-md">
            <Card className="bg-black/20 border border-white/10 backdrop-blur-xl shadow-2xl shadow-emerald-400/5">
              <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                    <XCircle className="h-8 w-8 text-red-400" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold text-white">Geçersiz Bağlantı</CardTitle>
                <CardDescription className="text-white/60 mt-2">
                  Şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <Alert className="bg-red-500/10 border-red-500/20">
                  <XCircle className="h-4 w-4 text-red-400" />
                  <AlertTitle className="text-red-400">Bağlantı Sorunu</AlertTitle>
                  <AlertDescription className="text-white/80">
                    Bu şifre sıfırlama bağlantısı artık geçerli değil. Yeni bir şifre sıfırlama talebinde bulunmanız
                    gerekiyor.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Button
                    onClick={() => router.push("/sifremi-unuttum")}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Yeni Şifre Sıfırlama Talebi
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => router.push("/giris")}
                    className="w-full bg-transparent border-white/20 text-white hover:bg-white/10"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Giriş Sayfasına Dön
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>

        <Footer />
      </div>
    )
  }

  if (resetStatus === "success") {
    return (
      <div className="min-h-screen w-full bg-[#151515] text-white font-sans flex flex-col">
        <div className="absolute inset-0 -z-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vh] bg-emerald-500/20 blur-[150px] rounded-full" />
        </div>

        <Header />

        <main className="flex-1 flex items-center justify-center p-4 relative z-10">
          <div className="w-full max-w-md">
            <Card className="bg-black/20 border border-white/10 backdrop-blur-xl shadow-2xl shadow-emerald-400/5">
              <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-emerald-400" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold text-white">Şifre Güncellendi!</CardTitle>
                <CardDescription className="text-white/60 mt-2">
                  Şifreniz başarıyla güncellendi. Giriş sayfasına yönlendiriliyorsunuz...
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <Alert className="bg-emerald-500/10 border-emerald-500/20">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  <AlertTitle className="text-emerald-400">Başarılı</AlertTitle>
                  <AlertDescription className="text-white/80">
                    Artık yeni şifrenizle giriş yapabilirsiniz.
                  </AlertDescription>
                </Alert>

                <Button
                  onClick={() => router.push("/giris")}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Giriş Sayfasına Git
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>

        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-[#151515] text-white font-sans flex flex-col">
      <div className="absolute inset-0 -z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vh] bg-emerald-500/20 blur-[150px] rounded-full" />
      </div>

      <Header />

      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md">
          <Card className="bg-black/20 border border-white/10 backdrop-blur-xl shadow-2xl shadow-emerald-400/5">
            <CardHeader className="text-center pb-2">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center">
                  <KeyRound className="h-8 w-8 text-emerald-400" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-white">Yeni Şifre Belirleyin</CardTitle>
              <CardDescription className="text-white/60 mt-2">
                Hesabınız için yeni bir şifre belirleyin.
              </CardDescription>
            </CardHeader>

            <CardContent>
              {hasValidSession ? (
                <form onSubmit={handlePasswordReset} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password" className="text-white/80">
                      Yeni Şifre
                    </Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Yeni şifrenizi girin"
                        className="bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-emerald-500 focus:ring-emerald-500/20 pr-10"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-white/60 hover:text-white"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-white/60">En az 6 karakter olmalıdır</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-white/80">
                      Yeni Şifre (Tekrar)
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Yeni şifrenizi tekrar girin"
                        className="bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-emerald-500 focus:ring-emerald-500/20 pr-10"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-white/60 hover:text-white"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Güncelleniyor...
                      </>
                    ) : (
                      <>
                        <Key className="mr-2 h-4 w-4" />
                        Şifreyi Güncelle
                      </>
                    )}
                  </Button>

                  <div className="pt-4 border-t border-white/10">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push("/giris")}
                      className="w-full bg-transparent border-white/20 text-white hover:bg-white/10"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Giriş Sayfasına Dön
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="flex justify-center items-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
                  <p className="ml-2 text-white/80">Oturum kontrol ediliyor...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function NewPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#151515] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
        </div>
      }
    >
      <NewPasswordContent />
    </Suspense>
  )
}
