"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, Mail, CheckCircle, ArrowLeft } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      toast({
        title: "Hata",
        description: "Lütfen e-posta adresinizi girin.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        throw error
      }

      setEmailSent(true)
      toast({
        title: "Başarılı",
        description: "Şifre sıfırlama e-postası gönderildi!",
      })
    } catch (error: any) {
      console.error("Password reset request error:", error)
      toast({
        title: "Hata",
        description: error.message || "E-posta gönderilirken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-xl border-0">
            <CardHeader className="text-center pb-2">
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">E-posta Gönderildi!</CardTitle>
              <CardDescription className="text-gray-600 mt-2">
                Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <Alert className="bg-green-50 border-green-200">
                <Mail className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">E-posta Gönderildi</AlertTitle>
                <AlertDescription className="text-green-700">
                  <strong>{email}</strong> adresine şifre sıfırlama bağlantısı gönderildi. E-postanızı kontrol edin ve
                  bağlantıya tıklayarak şifrenizi sıfırlayın.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Button onClick={() => router.push("/giris")} className="w-full bg-emerald-600 hover:bg-emerald-700">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Giriş Sayfasına Dön
                </Button>

                <Button variant="outline" onClick={() => setEmailSent(false)} className="w-full">
                  Başka E-posta Adresi Dene
                </Button>
              </div>

              <div className="text-center text-sm text-gray-500">
                <p>E-posta gelmedi mi? Spam klasörünüzü kontrol edin.</p>
              </div>
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
            <div className="flex justify-center mb-4">
              <Mail className="h-16 w-16 text-emerald-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Şifremi Unuttum</CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-posta Adresi</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@email.com"
                  required
                />
              </div>

              <Button type="submit" disabled={isLoading} className="w-full bg-emerald-600 hover:bg-emerald-700">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gönderiliyor...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Şifre Sıfırlama E-postası Gönder
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
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-sm text-gray-500">
          <p>
            Hesabınız yok mu?{" "}
            <button
              onClick={() => router.push("/kayit-ol")}
              className="text-emerald-600 hover:text-emerald-700 font-medium underline"
            >
              Kayıt olun
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
