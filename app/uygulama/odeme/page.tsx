"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Lock, ArrowLeft, Shield, Zap, Clock, Building2, CheckCircle2, CreditCard, AlertCircle, ChevronRight, Check } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useSubscription } from "@/hooks/use-subscription"
import { useAuth } from "@/hooks/use-auth"
import Link from "next/link"
import { turkishCities, cityDistricts } from "@/lib/turkish-cities"
import { getPlanById } from "@/lib/subscription-plans"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { LoadingSpinner } from "@/components/loading-screen"
import { cn } from "@/lib/utils"
import { PaymentForm } from "@/components/payment/payment-form"

export default function PaymentPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { refresh: refreshSubscription } = useSubscription()
  const { user, loading: authLoading } = useAuth()
  const searchParams = useSearchParams()

  // Step management
  const [currentStep, setCurrentStep] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedCityCode, setSelectedCityCode] = useState("")
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([])
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
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : isActive
                          ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-600 text-emerald-600"
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
                    Fatura bilgilerinizi girin. Bir sonraki adımda kart bilgilerinizi güvenli bir şekilde gireceksiniz.
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
                      <span className="font-medium">{selectedPlan.periodLabel}</span>
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

              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
                <CardContent className="pt-6 space-y-3">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900 dark:text-blue-100">PCI-DSS Uyumlu</p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Kart bilgileriniz sunucularımıza gelmez
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900 dark:text-blue-100">PayTR Güvencesi</p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Sertifikalı güvenli ödeme altyapısı
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Lock className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900 dark:text-blue-100">256-bit SSL</p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
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
              <PaymentForm
                planId={selectedPlan.id}
                planName={selectedPlan.name}
                amount={selectedPlan.price}
                billingInfo={{
                  fullName: billingInfo.fullName,
                  email: billingInfo.email,
                  phone: billingInfo.phone,
                  address: `${billingInfo.address}, ${billingInfo.district}`,
                  city: billingInfo.city,
                  district: billingInfo.district,
                  country: "Türkiye",
                  zipCode: billingInfo.zipCode,
                  identityNumber: billingInfo.identityNumber,
                  taxNumber: billingInfo.taxNumber || undefined,
                  taxOffice: billingInfo.taxOffice || undefined,
                }}
                onSuccess={() => {
                  toast({
                    title: "Yönlendiriliyor",
                    description: "PayTR ödeme sayfasına yönlendiriliyorsunuz...",
                  })
                }}
                onError={(error) => {
                  toast({
                    title: "Ödeme Hatası",
                    description: error,
                    variant: "destructive",
                  })
                }}
              />

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
                      <span className="font-medium">{selectedPlan.periodLabel}</span>
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

              <Alert className="border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20">
                <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <AlertTitle className="text-emerald-900 dark:text-emerald-100">Güvenli Ödeme</AlertTitle>
                <AlertDescription className="text-emerald-700 dark:text-emerald-300">
                  Kart bilgileriniz PayTR'nin PCI-DSS sertifikalı altyapısında işlenir.
                  Bilgileriniz hiçbir zaman sunucularımıza gelmez.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
