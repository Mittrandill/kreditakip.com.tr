"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, Mail, CheckCircle, ArrowLeft, KeyRound } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import Header from "@/components/layout/header"
import Footer from "@/components/footer"

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
                <CardTitle className="text-2xl font-bold text-white">E-posta Gönderildi!</CardTitle>
                <CardDescription className="text-white/60 mt-2">
                  Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <Alert className="bg-emerald-500/10 border-emerald-500/20">
                  <Mail className="h-4 w-4 text-emerald-400" />
                  <AlertTitle className="text-emerald-400">E-posta Gönderildi</AlertTitle>
                  <AlertDescription className="text-white/80">
                    <strong className="text-emerald-400">{email}</strong> adresine şifre sıfırlama bağlantısı
                    gönderildi. E-postanızı kontrol edin ve bağlantıya tıklayarak şifrenizi sıfırlayın.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Button
                    onClick={() => router.push("/giris")}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Giriş Sayfasına Dön
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setEmailSent(false)}
                    className="w-full bg-transparent border-white/20 text-white hover:bg-white/10"
                  >
                    Başka E-posta Adresi Dene
                  </Button>
                </div>

                <div className="text-center text-sm text-white/60">
                  <p>E-posta gelmedi mi? Spam klasörünüzü kontrol edin.</p>
                </div>
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
              <CardTitle className="text-2xl font-bold text-white">Şifremi Unuttum</CardTitle>
              <CardDescription className="text-white/60 mt-2">
                E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white/80">
                    E-posta Adresi
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@email.com"
                    required
                    className="bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-emerald-500 focus:ring-emerald-500/20"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                >
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
            </CardContent>
          </Card>

          <div className="text-center mt-6 text-sm text-white/60">
            <p>
              Hesabınız yok mu?{" "}
              <button
                onClick={() => router.push("/giris")}
                className="text-emerald-400 hover:text-emerald-300 font-medium underline"
              >
                Kayıt olun
              </button>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
