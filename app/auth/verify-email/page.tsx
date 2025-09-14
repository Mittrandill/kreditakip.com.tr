"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, Mail, CheckCircle, XCircle, RefreshCw, ArrowLeft } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<"pending" | "success" | "error" | "expired">("pending")
  const [isResending, setIsResending] = useState(false)
  const [email, setEmail] = useState<string>("")

  useEffect(() => {
    const token = searchParams.get("token")
    const type = searchParams.get("type")
    const emailParam = searchParams.get("email")

    if (emailParam) {
      setEmail(emailParam)
    }

    if (token && type === "email") {
      verifyEmail(token)
    }
  }, [searchParams])

  const verifyEmail = async (token: string) => {
    setIsVerifying(true)
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: "email",
      })

      if (error) {
        console.error("Email verification error:", error)
        if (error.message.includes("expired")) {
          setVerificationStatus("expired")
        } else {
          setVerificationStatus("error")
        }
        toast({
          title: "Doğrulama Hatası",
          description: error.message,
          variant: "destructive",
        })
      } else {
        setVerificationStatus("success")
        toast({
          title: "Başarılı",
          description: "E-posta adresiniz başarıyla doğrulandı!",
        })

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push("/uygulama/ana-sayfa")
        }, 2000)
      }
    } catch (error: any) {
      console.error("Verification error:", error)
      setVerificationStatus("error")
      toast({
        title: "Hata",
        description: "Doğrulama sırasında bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setIsVerifying(false)
    }
  }

  const resendVerificationEmail = async () => {
    if (!email) {
      toast({
        title: "Hata",
        description: "E-posta adresi bulunamadı.",
        variant: "destructive",
      })
      return
    }

    setIsResending(true)
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/verify-email`,
        },
      })

      if (error) {
        throw error
      }

      toast({
        title: "Başarılı",
        description: "Doğrulama e-postası tekrar gönderildi.",
      })
    } catch (error: any) {
      console.error("Resend error:", error)
      toast({
        title: "Hata",
        description: error.message || "E-posta gönderilirken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setIsResending(false)
    }
  }

  const getStatusIcon = () => {
    switch (verificationStatus) {
      case "success":
        return <CheckCircle className="h-16 w-16 text-green-500" />
      case "error":
      case "expired":
        return <XCircle className="h-16 w-16 text-red-500" />
      default:
        return <Mail className="h-16 w-16 text-blue-500" />
    }
  }

  const getStatusTitle = () => {
    switch (verificationStatus) {
      case "success":
        return "E-posta Doğrulandı!"
      case "error":
        return "Doğrulama Hatası"
      case "expired":
        return "Doğrulama Süresi Doldu"
      default:
        return "E-posta Doğrulanıyor..."
    }
  }

  const getStatusDescription = () => {
    switch (verificationStatus) {
      case "success":
        return "E-posta adresiniz başarıyla doğrulandı. Ana sayfaya yönlendiriliyorsunuz..."
      case "error":
        return "E-posta doğrulaması sırasında bir hata oluştu. Lütfen tekrar deneyin."
      case "expired":
        return "Doğrulama bağlantısının süresi dolmuş. Yeni bir doğrulama e-postası göndermek için aşağıdaki butona tıklayın."
      default:
        return "E-posta adresiniz doğrulanıyor. Lütfen bekleyin..."
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              {isVerifying ? <Loader2 className="h-16 w-16 text-emerald-600 animate-spin" /> : getStatusIcon()}
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">{getStatusTitle()}</CardTitle>
            <CardDescription className="text-gray-600 mt-2">{getStatusDescription()}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {email && (
              <Alert className="bg-blue-50 border-blue-200">
                <Mail className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-800">E-posta Adresi</AlertTitle>
                <AlertDescription className="text-blue-700">{email}</AlertDescription>
              </Alert>
            )}

            {verificationStatus === "expired" && (
              <Button
                onClick={resendVerificationEmail}
                disabled={isResending}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                {isResending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gönderiliyor...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Yeni Doğrulama E-postası Gönder
                  </>
                )}
              </Button>
            )}

            {verificationStatus === "error" && (
              <div className="space-y-2">
                <Button
                  onClick={resendVerificationEmail}
                  disabled={isResending}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  {isResending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Gönderiliyor...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Tekrar Gönder
                    </>
                  )}
                </Button>
              </div>
            )}

            <div className="pt-4 border-t">
              <Button variant="outline" onClick={() => router.push("/giris")} className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Giriş Sayfasına Dön
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-sm text-gray-500">
          <p>
            E-posta gelmedi mi?{" "}
            <button
              onClick={resendVerificationEmail}
              disabled={isResending}
              className="text-emerald-600 hover:text-emerald-700 font-medium underline"
            >
              Tekrar gönder
            </button>
          </p>
          <p className="mt-2">Spam klasörünüzü kontrol etmeyi unutmayın.</p>
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  )
}
