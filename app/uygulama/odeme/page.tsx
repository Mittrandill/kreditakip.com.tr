"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Lock, ArrowLeft, Shield, Zap, Clock, Building2, CheckCircle2, CreditCard } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { useSubscription } from "@/hooks/use-subscription"
import Link from "next/link"
import { turkishCities, cityDistricts } from "@/lib/turkish-cities"

export default function PaymentPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { refresh: refreshSubscription } = useSubscription()
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedCityCode, setSelectedCityCode] = useState("")
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([])

  const [cardDetails, setCardDetails] = useState({
    cardHolderName: "",
    cardNumber: "",
    expireMonth: "",
    expireYear: "",
    cvc: "",
  })

  const [billingInfo, setBillingInfo] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    district: "",
    zipCode: "",
    taxNumber: "",
    taxOffice: "",
  })

  useEffect(() => {
    if (selectedCityCode && cityDistricts[selectedCityCode]) {
      setAvailableDistricts(cityDistricts[selectedCityCode])
    } else {
      setAvailableDistricts([])
    }
  }, [selectedCityCode])

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    if (name === "cardNumber") {
      // Format card number with spaces
      const formatted = value
        .replace(/\s/g, "")
        .replace(/(\d{4})/g, "$1 ")
        .trim()
        .slice(0, 19)
      setCardDetails((prev) => ({ ...prev, [name]: formatted }))
    } else if (name === "expireMonth" || name === "expireYear") {
      // Only allow numbers
      const formatted = value.replace(/\D/g, "")
      if (name === "expireMonth") {
        setCardDetails((prev) => ({ ...prev, [name]: formatted.slice(0, 2) }))
      } else {
        setCardDetails((prev) => ({ ...prev, [name]: formatted.slice(0, 4) }))
      }
    } else if (name === "cvc") {
      // Only allow numbers, max 3-4 digits
      const formatted = value.replace(/\D/g, "").slice(0, 4)
      setCardDetails((prev) => ({ ...prev, [name]: formatted }))
    } else {
      setCardDetails((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleBillingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (name === "taxNumber") {
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
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("Oturum açmanız gerekiyor")
      }

      console.log("[v0] Processing direct payment with card details")

      // Send payment request with card details
      const response = await fetch("/api/payment/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          price: 199,
          cardDetails: {
            cardHolderName: cardDetails.cardHolderName,
            cardNumber: cardDetails.cardNumber.replace(/\s/g, ""),
            expireMonth: cardDetails.expireMonth,
            expireYear: cardDetails.expireYear,
            cvc: cardDetails.cvc,
          },
          billingInfo: {
            fullName: billingInfo.fullName,
            email: billingInfo.email,
            phone: billingInfo.phone,
            address: billingInfo.address,
            city: billingInfo.city,
            district: billingInfo.district,
            zipCode: billingInfo.zipCode,
            taxNumber: billingInfo.taxNumber,
            taxOffice: billingInfo.taxOffice,
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Ödeme işlemi başarısız oldu")
      }

      if (data.status === "success") {
        toast({
          title: "Ödeme Başarılı!",
          description: "Premium üyeliğiniz aktif edildi.",
        })

        await refreshSubscription()

        setTimeout(() => {
          router.push("/uygulama/premium")
        }, 1500)
      } else {
        throw new Error(data.message || "Ödeme başarısız")
      }
    } catch (error) {
      console.error("[v0] Payment error:", error)
      toast({
        title: "Ödeme Hatası",
        description: error instanceof Error ? error.message : "Ödeme işlemi başarısız oldu",
        variant: "destructive",
      })
      setIsProcessing(false)
    }
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
                <p className="text-emerald-100 text-lg">Güvenli ödeme ile premium üyeliğe geçin</p>
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

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-emerald-600" />
                  Kart Bilgileri
                </CardTitle>
                <CardDescription>Ödeme için kart bilgilerinizi girin</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cardHolderName">Kart Üzerindeki İsim *</Label>
                  <Input
                    id="cardHolderName"
                    name="cardHolderName"
                    placeholder="AKIN KAYA"
                    value={cardDetails.cardHolderName}
                    onChange={handleCardChange}
                    required
                    disabled={isProcessing}
                    className="uppercase"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Kart Numarası *</Label>
                  <Input
                    id="cardNumber"
                    name="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={cardDetails.cardNumber}
                    onChange={handleCardChange}
                    required
                    disabled={isProcessing}
                    maxLength={19}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expireMonth">Ay *</Label>
                    <Input
                      id="expireMonth"
                      name="expireMonth"
                      placeholder="MM"
                      value={cardDetails.expireMonth}
                      onChange={handleCardChange}
                      required
                      disabled={isProcessing}
                      maxLength={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expireYear">Yıl *</Label>
                    <Input
                      id="expireYear"
                      name="expireYear"
                      placeholder="YYYY"
                      value={cardDetails.expireYear}
                      onChange={handleCardChange}
                      required
                      disabled={isProcessing}
                      maxLength={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cvc">CVV *</Label>
                    <Input
                      id="cvc"
                      name="cvc"
                      type="password"
                      placeholder="123"
                      value={cardDetails.cvc}
                      onChange={handleCardChange}
                      required
                      disabled={isProcessing}
                      maxLength={4}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-emerald-600" />
                  Fatura Bilgileri
                </CardTitle>
                <CardDescription>Fatura için gerekli bilgilerinizi girin</CardDescription>
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
                      placeholder="0555 123 4567"
                      value={billingInfo.phone}
                      onChange={handleBillingChange}
                      required
                      disabled={isProcessing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="taxNumber">Vergi Kimlik No *</Label>
                    <Input
                      id="taxNumber"
                      name="taxNumber"
                      placeholder="12345678901"
                      value={billingInfo.taxNumber}
                      onChange={handleBillingChange}
                      maxLength={11}
                      required
                      disabled={isProcessing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="taxOffice">Vergi Dairesi *</Label>
                    <Input
                      id="taxOffice"
                      name="taxOffice"
                      placeholder="Kadıköy Vergi Dairesi"
                      value={billingInfo.taxOffice}
                      onChange={handleBillingChange}
                      required
                      disabled={isProcessing}
                    />
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

                  <div className="space-y-2">
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
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Ödeme Özeti</CardTitle>
                <CardDescription>Girilen bilgilerin özeti</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Premium Üyelik:</span>
                    <span className="font-medium">199₺</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Periyot:</span>
                    <span className="font-medium">Aylık</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-sm font-semibold">
                      <span>Toplam:</span>
                      <span className="text-emerald-600 dark:text-emerald-400">199₺</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 space-y-3">
                  <Button type="submit" className="w-full" disabled={isProcessing}>
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        İşleniyor...
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 mr-2" />
                        Ödemeyi Tamamla
                      </>
                    )}
                  </Button>

                  <Link href="/uygulama/premium" className="block">
                    <Button type="button" variant="outline" className="w-full bg-transparent">
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
                    <p className="font-medium text-blue-900 dark:text-blue-100">256-bit SSL Şifreleme</p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">Tüm verileriniz şifrelenir</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-100">iyzico Güvencesi</p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">Güvenli ödeme altyapısı</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
