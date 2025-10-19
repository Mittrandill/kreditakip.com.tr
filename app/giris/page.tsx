"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FileText, Scan, ArrowRight, TrendingUp, Shield, Eye, EyeOff, AlertCircle } from "lucide-react"
import { signIn, signUp, signInWithGoogle } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import Header from "@/components/layout/header"
import Footer from "@/components/footer"

const getErrorMessage = (error: any): string => {
  if (!error?.message) return "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin."

  const message = error.message.toLowerCase()

  // Supabase hata mesajlarını Türkçeye çevir
  if (message.includes("invalid login credentials") || message.includes("invalid credentials")) {
    return "E-posta adresi veya şifre hatalı. Lütfen bilgilerinizi kontrol edin."
  }

  if (message.includes("email not confirmed") || message.includes("email_not_confirmed")) {
    return "E-posta adresiniz henüz doğrulanmamış. Lütfen e-postanızı kontrol ederek doğrulama linkine tıklayın."
  }

  if (message.includes("user not found")) {
    return "Bu e-posta adresi ile kayıtlı bir hesap bulunamadı. Lütfen kayıt olmayı deneyin."
  }

  if (message.includes("user already registered") || message.includes("email already registered")) {
    return "Bu e-posta adresi ile zaten bir hesap mevcut. Giriş yapmayı deneyin."
  }

  if (message.includes("password") && message.includes("weak")) {
    return "Şifreniz çok zayıf. Lütfen en az 8 karakter, büyük-küçük harf ve rakam içeren bir şifre seçin."
  }

  if (message.includes("password") && message.includes("short")) {
    return "Şifre en az 6 karakter olmalıdır."
  }

  if (message.includes("email") && message.includes("invalid")) {
    return "Geçersiz e-posta adresi formatı. Lütfen doğru bir e-posta adresi girin."
  }

  if (message.includes("network") || message.includes("fetch")) {
    return "İnternet bağlantınızı kontrol edin ve tekrar deneyin."
  }

  if (message.includes("rate limit") || message.includes("too many")) {
    return "Çok fazla deneme yaptınız. Lütfen birkaç dakika bekleyip tekrar deneyin."
  }

  if (message.includes("signup disabled")) {
    return "Yeni kayıtlar şu anda kapalı. Lütfen daha sonra tekrar deneyin."
  }

  // Eğer bilinen bir hata değilse, orijinal mesajı döndür
  return error.message
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  // Login form state
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")

  // Register form state
  const [registerFirstName, setRegisterFirstName] = useState("")
  const [registerLastName, setRegisterLastName] = useState("")
  const [registerEmail, setRegisterEmail] = useState("")
  const [registerPassword, setRegisterPassword] = useState("")
  const [termsAccepted, setTermsAccepted] = useState(false)

  // Active tab state for programmatic switching
  const [activeTab, setActiveTab] = useState("login")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const data = await signIn(loginEmail, loginPassword)

      if (data?.user && data?.session) {
        toast({
          title: "Giriş Başarılı",
          description: "Ana sayfaya yönlendiriliyorsunuz...",
        })
        router.push("/uygulama/ana-sayfa")
      } else if (data?.user && !data?.session) {
        const errorMsg =
          "E-posta adresiniz henüz doğrulanmamış. Lütfen e-postanızı kontrol ederek doğrulama linkine tıklayın."
        setError(errorMsg)
        toast({
          variant: "destructive",
          title: "E-posta Doğrulaması Gerekli",
          description: "Giriş yapmadan önce lütfen e-postanızı doğrulayın.",
          duration: 8000,
        })
      } else {
        const errorMsg = "E-posta adresi veya şifre hatalı. Lütfen bilgilerinizi kontrol edin."
        setError(errorMsg)
        toast({
          variant: "destructive",
          title: "Giriş Başarısız",
          description: errorMsg,
        })
      }
    } catch (err: any) {
      console.error("Login error:", err)
      const errorMessage = getErrorMessage(err)
      setError(errorMessage)

      toast({
        variant: "destructive",
        title: "Giriş Hatası",
        description: errorMessage,
        duration: 6000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!termsAccepted) {
      const errorMsg = "Lütfen kullanım şartlarını ve gizlilik politikasını kabul edin."
      setError(errorMsg)
      toast({
        variant: "destructive",
        title: "Kayıt Hatası",
        description: errorMsg,
      })
      return
    }

    if (registerPassword.length < 6) {
      const errorMsg = "Şifre en az 6 karakter olmalıdır."
      setError(errorMsg)
      toast({
        variant: "destructive",
        title: "Şifre Hatası",
        description: errorMsg,
      })
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await signUp(registerEmail, registerPassword, {
        first_name: registerFirstName,
        last_name: registerLastName,
      })

      if (data?.user) {
        toast({
          title: "Kayıt Başarılı!",
          description: "Lütfen e-postanızı kontrol ederek hesabınızı doğrulayın. Doğrulama e-postası gönderildi.",
          duration: 8000,
        })
        setRegisterFirstName("")
        setRegisterLastName("")
        setRegisterEmail("")
        setRegisterPassword("")
        setTermsAccepted(false)
        setError(null)
        setActiveTab("login")
      } else {
        const errorMsg = "Kayıt işlemi tamamlanamadı. Lütfen bilgilerinizi kontrol edin ve tekrar deneyin."
        setError(errorMsg)
        toast({
          variant: "destructive",
          title: "Kayıt Başarısız",
          description: errorMsg,
        })
      }
    } catch (err: any) {
      console.error("Register error:", err)
      const errorMessage = getErrorMessage(err)
      setError(errorMessage)

      toast({
        variant: "destructive",
        title: "Kayıt Hatası",
        description: errorMessage,
        duration: 6000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError(null)

    try {
      await signInWithGoogle()
      // OAuth akışı callback sayfasında işlenecek
      toast({
        title: "Yönlendiriliyor...",
        description: "Google ile giriş için yönlendiriliyorsunuz.",
      })
    } catch (err: any) {
      console.error("Google sign-in error:", err)
      const errorMessage = err?.message || "Google ile giriş yapılırken bir hata oluştu. Lütfen tekrar deneyin."
      setError(errorMessage)
      toast({
        variant: "destructive",
        title: "Google Giriş Hatası",
        description: errorMessage,
        duration: 6000,
      })
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#151515] text-white font-sans flex flex-col">
      <div className="absolute inset-0 -z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vh] bg-emerald-500/20 blur-[150px] rounded-full" />
      </div>

      <Header />

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-7xl mx-auto">
          <div className="bg-black/20 border border-white/10 rounded-3xl backdrop-blur-xl shadow-2xl shadow-emerald-400/5 overflow-hidden">
            <div className="grid lg:grid-cols-2 min-h-[600px]">
              {/* Left Column - Login Form */}
              <div className="p-8 md:p-12 flex flex-col justify-center">
                <div className="max-w-md mx-auto w-full">
                  <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white">Hoş Geldiniz</h1>
                    <p className="text-white/60 mt-2">Kredi takip yolculuğunuza başlayın</p>
                  </div>

                  {error && (
                    <Alert variant="destructive" className="mb-4 bg-red-500/10 border-red-500/20">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Hata</AlertTitle>
                      <AlertDescription className="text-sm leading-relaxed">{error}</AlertDescription>
                    </Alert>
                  )}

                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/10">
                      <TabsTrigger
                        value="login"
                        className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white"
                      >
                        Giriş Yap
                      </TabsTrigger>
                      <TabsTrigger
                        value="register"
                        className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white"
                      >
                        Kayıt Ol
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="login" className="space-y-6 mt-6">
                      <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-white/80">
                            E-posta
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="ornek@mail.com"
                            required
                            className="bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-emerald-500 focus:ring-emerald-500/20"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="password" className="text-white/80">
                              Şifre
                            </Label>
                            <Link
                              href="/sifremi-unuttum"
                              className="text-sm text-teal-400 hover:text-emerald-400 transition-colors"
                            >
                              Şifremi Unuttum?
                            </Link>
                          </div>
                          <div className="relative">
                            <Input
                              id="password"
                              type={showPassword ? "text" : "password"}
                              placeholder="••••••••"
                              required
                              className="bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-emerald-500 focus:ring-emerald-500/20 pr-10"
                              value={loginPassword}
                              onChange={(e) => setLoginPassword(e.target.value)}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-white/40 hover:text-white/60"
                              onClick={() => setShowPassword(!showPassword)}
                              aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox id="remember" />
                          <Label htmlFor="remember" className="text-sm font-normal text-white/60">
                            Beni hatırla
                          </Label>
                        </div>

                        <Button
                          type="submit"
                          disabled={isLoading}
                          className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold h-12 text-base hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isLoading ? "Giriş yapılıyor..." : "Giriş Yap"}
                        </Button>
                      </form>
                    </TabsContent>

                    <TabsContent value="register" className="space-y-4 mt-6">
                      <form onSubmit={handleRegister} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="firstName" className="text-white/80">
                              Ad
                            </Label>
                            <Input
                              id="firstName"
                              placeholder="Adınız"
                              required
                              className="bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-emerald-500 focus:ring-emerald-500/20"
                              value={registerFirstName}
                              onChange={(e) => setRegisterFirstName(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="lastName" className="text-white/80">
                              Soyad
                            </Label>
                            <Input
                              id="lastName"
                              placeholder="Soyadınız"
                              required
                              className="bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-emerald-500 focus:ring-emerald-500/20"
                              value={registerLastName}
                              onChange={(e) => setRegisterLastName(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="registerEmail" className="text-white/80">
                            E-posta
                          </Label>
                          <Input
                            id="registerEmail"
                            type="email"
                            placeholder="ornek@mail.com"
                            required
                            className="bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-emerald-500 focus:ring-emerald-500/20"
                            value={registerEmail}
                            onChange={(e) => setRegisterEmail(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="registerPassword" className="text-white/80">
                            Şifre
                          </Label>
                          <div className="relative">
                            <Input
                              id="registerPassword"
                              type={showPassword ? "text" : "password"}
                              placeholder="En az 6 karakter"
                              required
                              minLength={6}
                              className="bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-emerald-500 focus:ring-emerald-500/20 pr-10"
                              value={registerPassword}
                              onChange={(e) => setRegisterPassword(e.target.value)}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-white/40 hover:text-white/60"
                              onClick={() => setShowPassword(!showPassword)}
                              aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                          <p className="text-xs text-white/50">En az 6 karakter içermelidir</p>
                        </div>
                        <div className="flex items-start space-x-2">
                          <Checkbox
                            id="terms"
                            checked={termsAccepted}
                            onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                            aria-labelledby="terms-label"
                          />
                          <Label
                            htmlFor="terms"
                            id="terms-label"
                            className="text-sm font-normal leading-snug text-white/60"
                          >
                            <Link
                              href="/kullanim-sartlari"
                              target="_blank"
                              className="text-emerald-400 hover:text-emerald-300 underline"
                            >
                              Kullanım şartlarını
                            </Link>{" "}
                            ve{" "}
                            <Link
                              href="/gizlilik-politikasi"
                              target="_blank"
                              className="text-emerald-400 hover:text-emerald-300 underline"
                            >
                              gizlilik politikasını
                            </Link>{" "}
                            okudum ve kabul ediyorum.
                          </Label>
                        </div>
                        <Button
                          type="submit"
                          className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold h-12 text-base hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={isLoading || !termsAccepted}
                        >
                          {isLoading ? "Hesap oluşturuluyor..." : "Hesap Oluştur"}
                        </Button>
                      </form>
                    </TabsContent>
                  </Tabs>

                  <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-[#151515] px-2 text-white/50 rounded-full">VEYA</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Button
                      onClick={handleGoogleSignIn}
                      disabled={isLoading}
                      variant="outline"
                      size="lg"
                      className="w-full bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-transparent hover:text-white dark:bg-transparent dark:border-white/20 dark:text-white dark:hover:bg-white/10 dark:hover:border-transparent dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      {isLoading ? "Yönlendiriliyor..." : "Google ile Giriş Yap"}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Right Column - OCR Process Visualization */}
              <div className="relative hidden lg:flex items-center justify-center bg-gradient-to-br from-emerald-500/5 to-teal-500/5 p-8 md:p-12 overflow-hidden">
                {/* Background Elements */}
                <div className="absolute inset-0">
                  <div className="absolute top-10 left-10 w-32 h-32 border border-white/5 rounded-full" />
                  <div className="absolute bottom-10 right-10 w-48 h-48 border border-white/5 rounded-full" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-white/5 rounded-full" />
                </div>

                {/* Main Process Flow */}
                <div className="relative w-full max-w-md">
                  {/* Step 1: Document Upload */}
                  <div className="relative mb-16">
                    <div className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm p-6 flex items-center justify-center group hover:bg-white/10 transition-all duration-300">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-emerald-500/30 transition-colors">
                          <FileText className="w-8 h-8 text-emerald-400" />
                        </div>
                        <p className="text-white/80 text-sm font-medium">Kredi Dökümü Yükle</p>
                      </div>
                    </div>
                    <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center">
                      <ArrowRight className="w-4 h-4 text-emerald-400" />
                    </div>
                  </div>

                  {/* Step 2: OCR Processing */}
                  <div className="relative mb-16">
                    <div className="w-full h-32 bg-gradient-to-r from-teal-500/10 to-emerald-500/10 border border-white/20 rounded-2xl backdrop-blur-sm p-6 flex items-center justify-center group hover:from-teal-500/20 hover:to-emerald-500/20 transition-all duration-300">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-teal-500/30 transition-colors relative">
                          <Scan className="w-8 h-8 text-teal-400" />
                          <div className="absolute inset-0 border-2 border-teal-500/30 rounded-full animate-ping" />
                        </div>
                        <p className="text-white/80 text-sm font-medium">OCR Analizi</p>
                      </div>
                    </div>
                    <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-teal-500/20 rounded-full flex items-center justify-center">
                      <ArrowRight className="w-4 h-4 text-teal-400" />
                    </div>
                  </div>

                  {/* Step 3: Smart Payment Plan */}
                  <div className="relative">
                    <div className="w-full h-32 bg-gradient-to-r from-emerald-500/20 to-emerald-500/10 border border-emerald-500/30 rounded-2xl backdrop-blur-sm p-6 flex items-center justify-center group hover:from-emerald-500/30 hover:to-emerald-500/20 transition-all duration-300">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-emerald-500/40 transition-colors">
                          <TrendingUp className="w-8 h-8 text-emerald-400" />
                        </div>
                        <p className="text-white/80 text-sm font-medium">Akıllı Ödeme Planı</p>
                      </div>
                    </div>
                  </div>

                  {/* Floating Stats */}
                  <div className="absolute -left-8 top-1/4 bg-black/30 border border-white/10 rounded-xl p-3 backdrop-blur-sm">
                    <div className="text-emerald-400 text-lg font-bold">99.8%</div>
                    <div className="text-white/60 text-xs">Doğruluk</div>
                  </div>

                  <div className="absolute -right-8 bottom-1/4 bg-black/30 border border-white/10 rounded-xl p-3 backdrop-blur-sm">
                    <div className="text-teal-400 text-lg font-bold">{"<3s"}</div>
                    <div className="text-white/60 text-xs">İşlem Süresi</div>
                  </div>

                  {/* Security Badge */}
                  <div className="absolute top-0 right-0 bg-black/40 border border-white/10 rounded-full p-2 backdrop-blur-sm">
                    <Shield className="w-5 h-5 text-emerald-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
