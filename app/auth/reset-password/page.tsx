"use client"

import type React from "react"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, Key, CheckCircle, XCircle, Eye, EyeOff, ArrowLeft, Mail } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

function ResetPasswordContent() {
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

  const getStatusIcon = () => {
    switch (resetStatus) {
      case "success":
        return <CheckCircle className="h-16 w-16 text-green-500" />
      case "error":
        return <XCircle className="h-16 w-16 text-red-500" />
      case "invalid":
        return <XCircle className="h-16 w-16 text-red-500" />
      default:
        return <Key className="h-16 w-16 text-emerald-600" />
    }
  }

  const getStatusTitle = () => {
    switch (resetStatus) {
      case "success":
        return "Şifre Güncellendi!"
      case "error":
        return "Güncelleme Hatası"
      case "invalid":
        return "Geçersiz Bağlantı"
      default:
        return "Yeni Şifre Belirleyin"
    }
  }

  const getStatusDescription = () => {
    switch (resetStatus) {
      case "success":
        return "Şifreniz başarıyla güncellendi. Giriş sayfasına yönlendiriliyorsunuz..."
      case "error":
        return "Şifre güncellenirken bir hata oluştu. Lütfen tekrar deneyin."
      case "invalid":
        return "Şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş. Yeni bir şifre sıfırlama talebinde bulunun."
      default:
        return "Hesabınız için yeni bir şifre belirleyin."
    }
  }

  if (resetStatus === "invalid") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-xl border-0">
            <CardHeader className="text-center pb-2">
              <div className="flex justify-center mb-4">
                <XCircle className="h-16 w-16 text-red-500" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">Geçersiz Bağlantı</CardTitle>
              <CardDescription className="text-gray-600 mt-2">
                Şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <Alert className="bg-red-50 border-red-200">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertTitle className="text-red-800">Bağlantı Sorunu</AlertTitle>
                <AlertDescription className="text-red-700">
                  Bu şifre sıfırlama bağlantısı artık geçerli değil. Yeni bir şifre sıfırlama talebinde bulunmanız
                  gerekiyor.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Button
                  onClick={() => router.push("/auth/forgot-password")}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Yeni Şifre Sıfırlama Talebi
                </Button>

                <Button variant="outline" onClick={() => router.push("/giris")} className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Giriş Sayfasına Dön
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (resetStatus === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-xl border-0">
            <CardHeader className="text-center pb-2">
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">Şifre Güncellendi!</CardTitle>
              <CardDescription className="text-gray-600 mt-2">
                Şifreniz başarıyla güncellendi. Giriş sayfasına yönlendiriliyorsunuz...
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Başarılı</AlertTitle>
                <AlertDescription className="text-green-700">
                  Artık yeni şifrenizle giriş yapabilirsiniz.
                </AlertDescription>
              </Alert>

              <Button onClick={() => router.push("/giris")} className="w-full bg-emerald-600 hover:bg-emerald-700">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Giriş Sayfasına Git
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">{getStatusIcon()}</div>
            <CardTitle className="text-2xl font-bold text-gray-900">{getStatusTitle()}</CardTitle>
            <CardDescription className="text-gray-600 mt-2">{getStatusDescription()}</CardDescription>
          </CardHeader>

          <CardContent>
            {hasValidSession ? (
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">Yeni Şifre</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Yeni şifrenizi girin"
                      className="pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">En az 6 karakter olmalıdır</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Yeni Şifre (Tekrar)</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Yeni şifrenizi tekrar girin"
                      className="pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <Button type="submit" disabled={isLoading} className="w-full bg-emerald-600 hover:bg-emerald-700">
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

                <div className="pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => router.push("/giris")} className="w-full">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Giriş Sayfasına Dön
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex justify-center items-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                <p className="ml-2">Oturum kontrol ediliyor...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  )
}
