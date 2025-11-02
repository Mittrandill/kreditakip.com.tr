"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Lock, ArrowLeft, Shield, Zap, Clock, Building2, CheckCircle2, CreditCard, AlertCircle } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useSubscription } from "@/hooks/use-subscription"
import { useAuth } from "@/hooks/use-auth"
import Link from "next/link"
import { turkishCities, cityDistricts } from "@/lib/turkish-cities"
import { getPlanById } from "@/lib/subscription-plans"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function PaymentPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { refresh: refreshSubscription } = useSubscription()
  const { user, loading: authLoading } = useAuth()
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedCityCode, setSelectedCityCode] = useState("")
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([])
  const searchParams = useSearchParams()

  // Plan bilgisini al
  const planId = searchParams.get("plan")

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

  const selectedPlan = planId ? getPlanById(planId) : null

  if (!selectedPlan) {
    return null
  }

  useEffect(() => {
    if (selectedCityCode && cityDistricts[selectedCityCode]) {
      setAvailableDistricts(cityDistricts[selectedCityCode])
    } else {
      setAvailableDistricts([])
    }
  }, [selectedCityCode])

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

  // Pre-fill email from user
  useEffect(() => {
    if (user?.email && !billingInfo.email) {
      setBillingInfo((prev) => ({ ...prev, email: user.email! }))
    }
  }, [user, billingInfo.email])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)

    try {

      if (!user) {
        throw new Error("Kullanıcı oturumu bulunamadı. Lütfen tekrar giriş yapın.")
      }

      // Validations
      if (billingInfo.identityNumber.length !== 11) {
        throw new Error("TC Kimlik No 11 haneli olmalıdır")
      }

      if (billingInfo.phone.length < 10) {
        throw new Error("Geçerli bir telefon numarası giriniz")
      }

      if (!billingInfo.city || !billingInfo.district) {
        throw new Error("Lütfen il ve ilçe seçiniz")
      }

      // Initialize PCI-DSS compliant checkout
      const response = await fetch("/api/payment/checkout/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          planId: selectedPlan.id,
          billingInfo: {
            fullName: billingInfo.fullName,
            email: billingInfo.email,
            phone: billingInfo.phone,
            identityNumber: billingInfo.identityNumber,
            address: billingInfo.address,
            city: billingInfo.city,
            district: billingInfo.district,
            zipCode: billingInfo.zipCode,
            taxOffice: billingInfo.taxOffice,
            taxNumber: billingInfo.taxNumber,
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Ödeme işlemi başlatılamadı")
      }

      if (data.success && data.paymentPageUrl) {
        // Redirect to Iyzico's secure payment page
        window.location.href = data.paymentPageUrl
      } else if (data.success && data.checkoutFormContent) {
        // Inject iyzico checkout form JavaScript into the page
        const checkoutContainer = document.getElementById("iyzipay-checkout-form")
        if (checkoutContainer) {
          checkoutContainer.innerHTML = data.checkoutFormContent

          // Execute the scripts
          const scripts = checkoutContainer.getElementsByTagName("script")
          for (let i = 0; i < scripts.length; i++) {
            const script = scripts[i]
            const newScript = document.createElement("script")
            if (script.src) {
              newScript.src = script.src
            } else {
              newScript.textContent = script.textContent
            }
            document.body.appendChild(newScript)
          }

          // Hide the form, show the checkout container
          const formElement = document.querySelector("form")
          if (formElement) {
            formElement.style.display = "none"
          }
        }
        setIsProcessing(false)
      } else {
        throw new Error(data.error || "Ödeme başlatılamadı")
      }
    } catch (error) {
      console.error("[checkout] Payment initialization error:", error)
      toast({
        title: "Ödeme Hatası",
        description: error instanceof Error ? error.message : "Ödeme işlemi başarısız oldu",
        variant: "destructive",
      })
      setIsProcessing(false)
    }
    // Don't set isProcessing to false here - we're redirecting
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
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
                  className="bg-white/20 border-white/30 text-white hover:bg-white/30"
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

      {/* PCI-DSS Information Alert */}
      <Alert className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20">
        <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        <AlertTitle className="text-blue-900 dark:text-blue-100">Güvenli Ödeme</AlertTitle>
        <AlertDescription className="text-blue-700 dark:text-blue-300">
          Kart bilgileriniz Iyzico'nun PCI-DSS sertifikalı güvenli sayfasında işlenecektir.
          Kart bilgileriniz hiçbir zaman sunucularımıza gelmez ve saklanmaz.
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-emerald-600" />
                  Fatura Bilgileri
                </CardTitle>
                <CardDescription>
                  Fatura bilgilerinizi girin. Sonraki sayfada kart bilgilerinizi güvenli bir şekilde gireceksiniz.
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
                    <p className="text-xs text-gray-500 dark:text-gray-400">
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
                    <p className="text-xs text-gray-500 dark:text-gray-400">
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
                    <p className="text-xs text-gray-500 dark:text-gray-400">
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
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Kurumsal fatura için gereklidir
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Ödeme Özeti</CardTitle>
                <CardDescription>Seçtiğiniz plan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{selectedPlan.name}:</span>
                    <span className="font-medium">{selectedPlan.price}₺</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Periyot:</span>
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
                        Yönlendiriliyor...
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 mr-2" />
                        Güvenli Ödemeye Geç
                      </>
                    )}
                  </Button>

                  <Link href="/uygulama/premium" className="block">
                    <Button type="button" variant="outline" className="w-full bg-transparent" disabled={isProcessing}>
                      İptal
                    </Button>
                  </Link>
                </div>

                <Alert className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Sonraki sayfada Iyzico'nun güvenli ödeme sayfasına yönlendirileceksiniz.
                    Kart bilgilerinizi orada gireceksiniz.
                  </AlertDescription>
                </Alert>
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
                    <p className="font-medium text-blue-900 dark:text-blue-100">iyzico Güvencesi</p>
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

      {/* Iyzico Subscription Checkout Form Container - Popup Mode */}
      <div id="iyzipay-checkout-form" className="popup"></div>
    </div>
  )
}
