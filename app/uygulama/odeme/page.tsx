"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Lock, ArrowLeft, Shield, Zap, Clock, Building2, CheckCircle2, CreditCard, AlertCircle, ChevronRight, Check, CheckCircle, ExternalLink } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { useSubscriptionV2 } from "@/hooks/use-subscription-v2"
import { useAuth } from "@/hooks/use-auth"
import { turkishCities, cityDistricts } from "@/lib/turkish-cities"
import { getPlanById } from "@/lib/subscription-plans"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { LoadingSpinner } from "@/components/loading-screen"
import { cn } from "@/lib/utils"
import PaddleCheckout from "@/components/paddle-checkout-button"

export default function PaymentPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { refresh: refreshSubscription } = useSubscriptionV2()
  const { user, loading: authLoading } = useAuth()
  const searchParams = useSearchParams()

  // Step management
  const [currentStep, setCurrentStep] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedCityCode, setSelectedCityCode] = useState("")
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([])
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [kvkkAccepted, setKvkkAccepted] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [showTermsDialog, setShowTermsDialog] = useState(false)
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false)
  const [showKvkkDialog, setShowKvkkDialog] = useState(false)
  const [billingInfo, setBillingInfo] = useState({
    fullName: "",
    email: user?.email || "",
    phone: "",
    address: "",
    city: "",
    district: "",
    zipCode: "",
    identityNumber: "",
    taxOffice: "",
    taxNumber: "",
  })

  // Plan bilgisini al
  const planId = searchParams.get("plan")
  const selectedPlan = planId ? getPlanById(planId) : null

  // Plan seçilmeden ödeme sayfasına erişimi engelle
  useEffect(() => {
    if (!planId && !authLoading) {
      toast({
        title: "Plan Seçilmedi",
        description: "Lütfen önce bir plan seçin.",
        variant: "destructive",
      })
      router.push("/uygulama/premium")
    }
  }, [planId, authLoading, router, toast])

  // City districts effect
  useEffect(() => {
    if (selectedCityCode && cityDistricts[selectedCityCode]) {
      setAvailableDistricts(cityDistricts[selectedCityCode])
    } else {
      setAvailableDistricts([])
    }
  }, [selectedCityCode])

  // Pre-fill email from user
  useEffect(() => {
    if (user?.email && !billingInfo.email) {
      setBillingInfo((prev) => ({ ...prev, email: user.email! }))
    }
  }, [user, billingInfo.email])

  // Early return after all hooks
  if (!selectedPlan) {
    return null
  }

  const handleBillingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (name === "identityNumber" || name === "phone") {
      const formatted = value.replace(/\D/g, "").slice(0, 11)
      setBillingInfo((prev) => ({ ...prev, [name]: formatted }))
    } else {
      setBillingInfo((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleCityChange = (value: string) => {
    const city = turkishCities.find((c) => c.code === value)
    if (city) {
      setSelectedCityCode(value)
      setBillingInfo((prev) => ({ ...prev, city: city.name, district: "" }))
    }
  }

  const handleDistrictChange = (value: string) => {
    setBillingInfo((prev) => ({ ...prev, district: value }))
  }

  const validateBillingInfo = () => {
    if (billingInfo.identityNumber.length !== 11) {
      toast({
        title: "Geçersiz TC Kimlik No",
        description: "TC Kimlik No 11 haneli olmalıdır",
        variant: "destructive",
      })
      return false
    }

    if (billingInfo.phone.length < 10) {
      toast({
        title: "Geçersiz Telefon",
        description: "Geçerli bir telefon numarası giriniz",
        variant: "destructive",
      })
      return false
    }

    if (!billingInfo.city || !billingInfo.district) {
      toast({
        title: "Eksik Bilgi",
        description: "Lütfen il ve ilçe seçiniz",
        variant: "destructive",
      })
      return false
    }

    return true
  }

  const handleNextStep = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateBillingInfo()) {
      return
    }

    if (!user) {
      toast({
        title: "Oturum Hatası",
        description: "Kullanıcı oturumu bulunamadı. Lütfen tekrar giriş yapın.",
        variant: "destructive",
      })
      return
    }

    // Move to payment step (step 2)
    setCurrentStep(2)
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const steps = [
    { number: 1, title: "Fatura Bilgileri", icon: Building2 },
    { number: 2, title: "Ödeme", icon: CreditCard },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="overflow-hidden border-0 shadow-xl rounded-2xl">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-8 text-white relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mt-32 -mr-32"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-white opacity-5 rounded-full -mb-20 -ml-20"></div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <Link href="/uygulama/premium">
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-transparent hover:text-white dark:bg-transparent dark:border-white/20 dark:text-white dark:hover:bg-white/10 dark:hover:border-transparent dark:hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">Premium Ödeme</h1>
                <p className="text-emerald-100 text-lg">PCI-DSS uyumlu güvenli ödeme</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                <div className="flex items-center gap-2 text-emerald-100">
                  <Shield className="h-5 w-5" />
                  <span>Güvenli Ödeme</span>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                <div className="flex items-center gap-2 text-emerald-100">
                  <Zap className="h-5 w-5" />
                  <span>Hızlı İşlem</span>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                <div className="flex items-center gap-2 text-emerald-100">
                  <Clock className="h-5 w-5" />
                  <span>Anında Aktivasyon</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Step Indicator */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = currentStep === step.number
              const isCompleted = currentStep > step.number

              return (
                <React.Fragment key={step.number}>
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all",
                        isCompleted
                          ? "bg-gradient-to-br from-emerald-600 to-teal-600 border-emerald-600 text-white"
                          : isActive
                          ? "bg-gradient-to-br from-emerald-600 to-teal-600 border-emerald-600 text-white"
                          : "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-400"
                      )}
                    >
                      {isCompleted ? (
                        <Check className="h-6 w-6" />
                      ) : (
                        <Icon className="h-6 w-6" />
                      )}
                    </div>
                    <div className="hidden md:block">
                      <p
                        className={cn(
                          "font-medium",
                          isActive || isCompleted
                            ? "text-gray-900 dark:text-white"
                            : "text-gray-500 dark:text-gray-400"
                        )}
                      >
                        {step.title}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Adım {step.number}/2
                      </p>
                    </div>
                  </div>

                  {index < steps.length - 1 && (
                    <div className="flex-1 mx-4">
                      <div
                        className={cn(
                          "h-0.5 w-full transition-all",
                          isCompleted
                            ? "bg-emerald-600"
                            : "bg-gray-200 dark:bg-gray-700"
                        )}
                      />
                    </div>
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Step 1: Billing Information */}
      {currentStep === 1 && (
        <form onSubmit={handleNextStep} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-emerald-600" />
                    Fatura Bilgileri
                  </CardTitle>
                  <CardDescription>
                    Fatura bilgilerinizi girin. Bir sonraki adımda Paddle üzerinden güvenli ödeme yapacaksınız.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Ad Soyad *</Label>
                      <Input
                        id="fullName"
                        name="fullName"
                        placeholder="Akın Kaya"
                        value={billingInfo.fullName}
                        onChange={handleBillingChange}
                        required
                        disabled={isProcessing}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">E-posta *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="akin@example.com"
                        value={billingInfo.email}
                        onChange={handleBillingChange}
                        required
                        disabled={isProcessing}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefon *</Label>
                      <Input
                        id="phone"
                        name="phone"
                        placeholder="05551234567"
                        value={billingInfo.phone}
                        onChange={handleBillingChange}
                        required
                        disabled={isProcessing}
                        maxLength={11}
                      />
                      <p className="text-xs text-gray-500 dark:text-white/60">
                        Başında 0 ile birlikte 11 hane
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="identityNumber">TC Kimlik No *</Label>
                      <Input
                        id="identityNumber"
                        name="identityNumber"
                        placeholder="12345678901"
                        value={billingInfo.identityNumber}
                        onChange={handleBillingChange}
                        maxLength={11}
                        required
                        disabled={isProcessing}
                      />
                      <p className="text-xs text-gray-500 dark:text-white/60">
                        Ödeme sağlayıcısı tarafından zorunludur
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="city">İl *</Label>
                      <Select value={selectedCityCode} onValueChange={handleCityChange} disabled={isProcessing} required>
                        <SelectTrigger>
                          <SelectValue placeholder="İl seçiniz" />
                        </SelectTrigger>
                        <SelectContent>
                          {turkishCities.map((city) => (
                            <SelectItem key={city.code} value={city.code}>
                              {city.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="district">İlçe *</Label>
                      <Select
                        value={billingInfo.district}
                        onValueChange={handleDistrictChange}
                        disabled={isProcessing || !selectedCityCode || availableDistricts.length === 0}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={selectedCityCode ? "İlçe seçiniz" : "Önce il seçiniz"} />
                        </SelectTrigger>
                        <SelectContent>
                          {availableDistricts.map((district) => (
                            <SelectItem key={district} value={district}>
                              {district}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="address">Adres *</Label>
                      <Input
                        id="address"
                        name="address"
                        placeholder="Mahalle, Sokak, No"
                        value={billingInfo.address}
                        onChange={handleBillingChange}
                        required
                        disabled={isProcessing}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="zipCode">Posta Kodu *</Label>
                      <Input
                        id="zipCode"
                        name="zipCode"
                        placeholder="34000"
                        value={billingInfo.zipCode}
                        onChange={handleBillingChange}
                        required
                        disabled={isProcessing}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="taxOffice">Vergi Dairesi (Opsiyonel)</Label>
                      <Input
                        id="taxOffice"
                        name="taxOffice"
                        placeholder="Kadıköy Vergi Dairesi"
                        value={billingInfo.taxOffice}
                        onChange={handleBillingChange}
                        disabled={isProcessing}
                      />
                      <p className="text-xs text-gray-500 dark:text-white/60">
                        Kurumsal fatura için gereklidir
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="taxNumber">Vergi Numarası (Opsiyonel)</Label>
                      <Input
                        id="taxNumber"
                        name="taxNumber"
                        placeholder="1234567890"
                        value={billingInfo.taxNumber}
                        onChange={handleBillingChange}
                        maxLength={10}
                        disabled={isProcessing}
                      />
                      <p className="text-xs text-gray-500 dark:text-white/60">
                        Kurumsal fatura için gereklidir
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="sticky top-6 dark:bg-black/20">
                <CardHeader>
                  <CardTitle>Ödeme Özeti</CardTitle>
                  <CardDescription>Seçtiğiniz plan</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-white/60">{selectedPlan.name}:</span>
                      <span className="font-medium">{selectedPlan.price}₺</span>
                    </div>
                    <div className="flex justify-between text-sm">
                       <span className="text-gray-600 dark:text-white/60">Periyot:</span>
                      <span className="font-medium">
                        {selectedPlan.period === "monthly"
                          ? "Aylık"
                          : selectedPlan.period === "yearly"
                            ? "Yıllık"
                            : selectedPlan.periodLabel}
                      </span>
                    </div>
                    {selectedPlan.originalPrice && (
                      <div className="flex justify-between text-sm text-emerald-600 dark:text-emerald-400">
                        <span>Tasarruf:</span>
                        <span className="font-medium">
                          {selectedPlan.originalPrice - selectedPlan.price}₺
                        </span>
                      </div>
                    )}
                    <div className="border-t pt-3">
                      <div className="flex justify-between text-sm font-semibold">
                        <span>Toplam:</span>
                        <span className="text-emerald-600 dark:text-emerald-400">{selectedPlan.price}₺</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 space-y-3">
                    <Button type="submit" className="w-full" disabled={isProcessing}>
                      {isProcessing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Hazırlanıyor...
                        </>
                      ) : (
                        <>
                          Ödemeye Geç
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>

                    <Link href="/uygulama/premium" className="block">
                      <Button type="button" variant="outline" className="w-full bg-transparent" disabled={isProcessing}>
                        İptal
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <Card className="dark:bg-black/20">
                <CardHeader>
                  <CardTitle>Güvenlik Özellikleri</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">PCI-DSS Uyumlu</p>
                      <p className="text-sm text-gray-600 dark:text-white/60">
                        Kart bilgileriniz sunucularımıza gelmez
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Paddle Güvencesi</p>
                      <p className="text-sm text-gray-600 dark:text-white/60">
                        Sertifikalı güvenli ödeme altyapısı
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Lock className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">256-bit SSL</p>
                      <p className="text-sm text-gray-600 dark:text-white/60">
                        Tüm iletişim şifrelenir
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      )}

      {/* Step 2: Payment */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="dark:bg-black/20">
                <CardHeader>
                  <CardTitle>Güvenli Ödeme</CardTitle>
                  <CardDescription>
                    Ödemeleriniz Paddle'ın PCI-DSS sertifikalı altyapısında güvenli bir şekilde işlenir.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Paddle Logo and Info */}
                  <div className="flex flex-col items-center justify-center py-6 border-b">
                    <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-8 py-3 rounded-lg font-bold text-2xl mb-4">
                      Paddle
                    </div>
                    <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                      Paddle ile güvenli ödemeye geçmek için aşağıdaki koşulları kabul edin ve "Ödemeye Geç" butonuna tıklayın.
                    </p>
                  </div>

                  {/* Terms and Conditions Checkboxes */}
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3 p-3 rounded-lg border hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors">
                      <Checkbox
                        id="terms-check"
                        checked={termsAccepted}
                        onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                        className="mt-0.5"
                      />
                      <label
                        htmlFor="terms-check"
                        className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed cursor-pointer flex-1"
                      >
                        <button
                          type="button"
                          onClick={() => setShowTermsDialog(true)}
                          className="text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center font-medium"
                        >
                          Kullanım Koşulları
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </button>
                        'nı okudum ve kabul ediyorum.
                      </label>
                    </div>

                    <div className="flex items-start space-x-3 p-3 rounded-lg border hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors">
                      <Checkbox
                        id="privacy-check"
                        checked={privacyAccepted}
                        onCheckedChange={(checked) => setPrivacyAccepted(checked as boolean)}
                        className="mt-0.5"
                      />
                      <label
                        htmlFor="privacy-check"
                        className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed cursor-pointer flex-1"
                      >
                        <button
                          type="button"
                          onClick={() => setShowPrivacyDialog(true)}
                          className="text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center font-medium"
                        >
                          İptal-İade Politikası
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </button>
                        'nı okudum ve kabul ediyorum.
                      </label>
                    </div>

                    <div className="flex items-start space-x-3 p-3 rounded-lg border hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors">
                      <Checkbox
                        id="kvkk-check"
                        checked={kvkkAccepted}
                        onCheckedChange={(checked) => setKvkkAccepted(checked as boolean)}
                        className="mt-0.5"
                      />
                      <label
                        htmlFor="kvkk-check"
                        className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed cursor-pointer flex-1"
                      >
                        <button
                          type="button"
                          onClick={() => setShowKvkkDialog(true)}
                          className="text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center font-medium"
                        >
                          KVKK Aydınlatma Metni
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </button>
                        'ni okudum ve kabul ediyorum.
                      </label>
                    </div>
                  </div>

                  {/* Payment Button */}
                  {showCheckout ? (
                    <PaddleCheckout
                      planId={selectedPlan.id}
                      planName={selectedPlan.name}
                      priceId={selectedPlan.paddlePriceId || ''}
                      userEmail={billingInfo.email}
                      userId={user?.id}
                      onSuccess={() => {
                        toast({
                          title: "Ödeme Başarılı!",
                          description: "Aboneliğiniz başarıyla oluşturuldu.",
                        })
                        refreshSubscription()
                        setTimeout(() => {
                          router.push('/uygulama/abonelik')
                        }, 1000)
                      }}
                      onClose={() => {
                        setShowCheckout(false)
                      }}
                    />
                  ) : (
                    <Button
                      onClick={() => {
                        if (!termsAccepted || !privacyAccepted || !kvkkAccepted) {
                          toast({
                            title: "Dikkat",
                            description: "Lütfen tüm koşulları okuyup kabul edin.",
                            variant: "destructive",
                          })
                          return
                        }
                        setShowCheckout(true)
                      }}
                      disabled={!termsAccepted || !privacyAccepted || !kvkkAccepted}
                      className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 h-12 text-base font-semibold"
                    >
                      <CreditCard className="mr-2 h-5 w-5" />
                      Ödemeye Geç
                    </Button>
                  )}

                  <div className="flex items-center justify-center text-xs text-gray-500 dark:text-gray-400 gap-2 pt-2">
                    <Shield className="h-4 w-4" />
                    <span>256-bit SSL</span>
                    <span>•</span>
                    <Lock className="h-4 w-4" />
                    <span>PCI-DSS Sertifikalı</span>
                  </div>
                </CardContent>
              </Card>

              <div className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                  className="w-full sm:w-auto"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Fatura Bilgilerine Dön
                </Button>
              </div>
            </div>

            <div className="space-y-6">
              <Card className="sticky top-6 dark:bg-black/20">
                <CardHeader>
                  <CardTitle>Ödeme Özeti</CardTitle>
                  <CardDescription>Seçtiğiniz plan</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-white/60">{selectedPlan.name}:</span>
                      <span className="font-medium">{selectedPlan.price}₺</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-white/60">Periyot:</span>
                      <span className="font-medium">
                        {selectedPlan.period === "monthly"
                          ? "Aylık"
                          : selectedPlan.period === "yearly"
                            ? "Yıllık"
                            : selectedPlan.periodLabel}
                      </span>
                    </div>
                    {selectedPlan.originalPrice && (
                      <div className="flex justify-between text-sm text-emerald-600 dark:text-emerald-400">
                        <span>Tasarruf:</span>
                        <span className="font-medium">
                          {selectedPlan.originalPrice - selectedPlan.price}₺
                        </span>
                      </div>
                    )}
                    <div className="border-t pt-3">
                      <div className="flex justify-between text-sm font-semibold">
                        <span>Toplam:</span>
                        <span className="text-emerald-600 dark:text-emerald-400">{selectedPlan.price}₺</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="dark:bg-black/20">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CardTitle>Güvenli Ödeme</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Ödemeleriniz Paddle'ın PCI-DSS sertifikalı altyapısında güvenli bir şekilde işlenir.
                    Kart bilgileriniz hiçbir zaman sunucularımıza gelmez.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Terms Dialog */}
      <Dialog open={showTermsDialog} onOpenChange={setShowTermsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Kullanım Koşulları</DialogTitle>
            <DialogDescription>
              Lütfen kullanım koşullarını okuyun ve kabul edin
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4 text-sm">
              <h3 className="font-semibold text-base">1. Genel Hükümler</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Bu kullanım koşulları, kreditakip.com.tr platformunu kullanırken uymanız gereken kuralları belirler.
                Platformu kullanarak bu koşulları kabul etmiş olursunuz.
              </p>

              <h3 className="font-semibold text-base">2. Hizmet Tanımı</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Kredi Takip, kredi ve finansal yönetim hizmetleri sunan bir SaaS platformudur. Platform üzerinden
                kredilerinizi takip edebilir, ödeme planlarınızı yönetebilir ve finansal sağlığınızı analiz edebilirsiniz.
              </p>

              <h3 className="font-semibold text-base">3. Kullanıcı Sorumlulukları</h3>
              <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
                <li>Hesap bilgilerinizi güvenli tutmak</li>
                <li>Doğru ve güncel bilgiler sağlamak</li>
                <li>Platformu yasal amaçlarla kullanmak</li>
                <li>Üçüncü şahısların haklarını ihlal etmemek</li>
              </ul>

              <h3 className="font-semibold text-base">4. Abonelik ve Ödeme</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Premium planlar için ödeme yaparak abonelik oluşturabilirsiniz. Abonelikler otomatik olarak yenilenir.
                İptal işlemini hesap ayarlarınızdan yapabilirsiniz.
              </p>

              <h3 className="font-semibold text-base">5. Gizlilik</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Kişisel verileriniz KVKK ve GDPR kapsamında korunmaktadır. Detaylı bilgi için gizlilik politikamızı inceleyebilirsiniz.
              </p>

              <h3 className="font-semibold text-base">6. Hizmet Değişiklikleri</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Platform özelliklerini ve fiyatlandırmayı değiştirme hakkımız saklıdır. Önemli değişiklikler için
                kullanıcılarımızı önceden bilgilendiririz.
              </p>

              <h3 className="font-semibold text-base">7. Sorumluluk Sınırlaması</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Platform "olduğu gibi" sunulmaktadır. Finansal kararlarınızın sorumluluğu size aittir.
                Platform üzerinden sağlanan bilgiler tavsiye niteliğinde değildir.
              </p>

              <h3 className="font-semibold text-base">8. İletişim</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Sorularınız için destek@kreditakip.com.tr adresinden bize ulaşabilirsiniz.
              </p>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button
              onClick={() => {
                setTermsAccepted(true)
                setShowTermsDialog(false)
                toast({
                  title: "Onaylandı",
                  description: "Kullanım koşullarını kabul ettiniz.",
                })
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              Onaylıyorum
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Privacy Policy Dialog */}
      <Dialog open={showPrivacyDialog} onOpenChange={setShowPrivacyDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>İptal ve İade Politikası</DialogTitle>
            <DialogDescription>
              Lütfen iptal ve iade koşullarını okuyun ve kabul edin
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4 text-sm">
              <h3 className="font-semibold text-base">1. İptal Hakkı</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Aboneliğinizi istediğiniz zaman iptal edebilirsiniz. İptal işlemi için hesap ayarlarından
                "Aboneliği İptal Et" seçeneğini kullanabilirsiniz.
              </p>

              <h3 className="font-semibold text-base">2. İptal Sonrası Süreç</h3>
              <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
                <li>İptal ettiğinizde, mevcut dönem sonuna kadar premium özelliklerden yararlanmaya devam edersiniz</li>
                <li>Dönem bitiminde aboneliğiniz otomatik olarak sona erer</li>
                <li>Verileriniz korunur ve ücretsiz plana dönebilirsiniz</li>
              </ul>

              <h3 className="font-semibold text-base">3. İade Koşulları</h3>
              <p className="text-gray-700 dark:text-gray-300">
                İlk 14 gün içinde hiçbir gerekçe göstermeden aboneliğinizi iptal edip ödeme yaptığınız tutarın
                tamamını geri alabilirsiniz.
              </p>

              <h3 className="font-semibold text-base">4. İade Süreci</h3>
              <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
                <li>İade talebi için destek@kreditakip.com.tr adresine e-posta gönderin</li>
                <li>İade işlemi 5-7 iş günü içinde tamamlanır</li>
                <li>İade, ödeme yaptığınız kartınıza yapılır</li>
              </ul>

              <h3 className="font-semibold text-base">5. İade Hariç Durumlar</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Aşağıdaki durumlarda iade yapılmaz:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
                <li>14 günlük süre geçtikten sonra</li>
                <li>Platformu kullanım kurallarını ihlal ettiyseniz</li>
                <li>Sahte veya hileli işlemler tespit edildiyse</li>
              </ul>

              <h3 className="font-semibold text-base">6. Yıllık Abonelikler</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Yıllık aboneliklerde, ilk 14 gün sonrası iptal durumunda kullanılmayan ay sayısı için
                kısmi iade yapılabilir (aylık plan fiyatı üzerinden hesaplanır).
              </p>

              <h3 className="font-semibold text-base">7. İletişim</h3>
              <p className="text-gray-700 dark:text-gray-300">
                İptal ve iade ile ilgili sorularınız için destek@kreditakip.com.tr adresinden bize ulaşabilirsiniz.
              </p>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button
              onClick={() => {
                setPrivacyAccepted(true)
                setShowPrivacyDialog(false)
                toast({
                  title: "Onaylandı",
                  description: "İptal-İade politikasını kabul ettiniz.",
                })
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              Onaylıyorum
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* KVKK Dialog */}
      <Dialog open={showKvkkDialog} onOpenChange={setShowKvkkDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>KVKK Aydınlatma Metni</DialogTitle>
            <DialogDescription>
              Kişisel verilerinizin korunması hakkında bilgilendirme
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4 text-sm">
              <h3 className="font-semibold text-base">1. Veri Sorumlusu</h3>
              <p className="text-gray-700 dark:text-gray-300">
                6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, kişisel verileriniz veri sorumlusu
                olarak Kredi Takip tarafından aşağıda açıklanan kapsamda işlenecektir.
              </p>

              <h3 className="font-semibold text-base">2. Toplanan Kişisel Veriler</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Platform üzerinde aşağıdaki kişisel verileriniz toplanabilir:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
                <li>Kimlik bilgileri (ad, soyad, T.C. kimlik numarası)</li>
                <li>İletişim bilgileri (e-posta, telefon, adres)</li>
                <li>Finansal bilgiler (kredi bilgileri, ödeme planları)</li>
                <li>İşlem güvenliği bilgileri (IP adresi, çerez bilgileri)</li>
              </ul>

              <h3 className="font-semibold text-base">3. Kişisel Verilerin İşlenme Amaçları</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
                <li>Üyelik işlemlerinin gerçekleştirilmesi</li>
                <li>Hizmetlerin sunulması ve geliştirilmesi</li>
                <li>Ödeme işlemlerinin yürütülmesi</li>
                <li>Yasal yükümlülüklerin yerine getirilmesi</li>
                <li>Güvenlik ve fraud önleme</li>
              </ul>

              <h3 className="font-semibold text-base">4. Verilerin Aktarımı</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Kişisel verileriniz, yukarıda belirtilen amaçların gerçekleştirilmesi doğrultusunda:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
                <li>Ödeme hizmet sağlayıcılarına (Paddle)</li>
                <li>Hukuki yükümlülükler gereği kamu kurum ve kuruluşlarına</li>
                <li>Teknik altyapı sağlayıcılarına</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300">
                aktarılabilecektir.
              </p>

              <h3 className="font-semibold text-base">5. Kişisel Veri Toplamanın Yöntemi</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Kişisel verileriniz, web sitesi, mobil uygulama, e-posta, telefon ve diğer dijital
                kanallar aracılığıyla toplanmaktadır.
              </p>

              <h3 className="font-semibold text-base">6. Haklarınız</h3>
              <p className="text-gray-700 dark:text-gray-300">
                KVKK'nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
                <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
                <li>İşlenmişse buna ilişkin bilgi talep etme</li>
                <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</li>
                <li>Yurt içinde veya yurt dışında aktarıldığı 3. kişileri bilme</li>
                <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme</li>
                <li>KVKK'nın 7. maddesinde öngörülen şartlar çerçevesinde silinmesini isteme</li>
                <li>Aktarıldığı 3. kişilere yukarıdaki değişikliklerin bildirilmesini isteme</li>
                <li>Münhasıran otomatik sistemler ile analiz edilmesine itiraz etme</li>
                <li>Kanuna aykırı işlenmesi sebebiyle zarara uğramanız halinde zararın giderilmesini talep etme</li>
              </ul>

              <h3 className="font-semibold text-base">7. İletişim</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Kişisel verileriniz ile ilgili taleplerinizi destek@kreditakip.com.tr adresine
                yazılı olarak iletebilirsiniz.
              </p>

              <h3 className="font-semibold text-base">8. Veri Saklama Süresi</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Kişisel verileriniz, işleme amacının gerektirdiği süre boyunca ve yasal saklama
                yükümlülükleri doğrultusunda saklanmaktadır.
              </p>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button
              onClick={() => {
                setKvkkAccepted(true)
                setShowKvkkDialog(false)
                toast({
                  title: "Onaylandı",
                  description: "KVKK Aydınlatma metnini kabul ettiniz.",
                })
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              Onaylıyorum
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
