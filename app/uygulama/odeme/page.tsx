"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CreditCard, Lock, Sparkles, Shield, CheckCircle2, Building2, User, Mail, Phone, Wallet } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { useSubscription } from "@/hooks/use-subscription"

export default function PaymentPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { refresh: refreshSubscription } = useSubscription()
  const [isProcessing, setIsProcessing] = useState(false)
  const [formData, setFormData] = useState({
    cardHolderName: "",
    cardNumber: "",
    expireMonth: "",
    expireYear: "",
  })
  const [billingInfo, setBillingInfo] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    zipCode: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    if (name === "cardNumber") {
      const formatted = value
        .replace(/\s/g, "")
        .replace(/(\d{4})/g, "$1 ")
        .trim()
      setFormData((prev) => ({ ...prev, [name]: formatted }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleBillingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setBillingInfo((prev) => ({ ...prev, [name]: value }))
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

      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      if (!profile) {
        throw new Error("Kullanıcı profili bulunamadı")
      }

      const response = await fetch("/api/payment/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          email: profile.email,
          name: profile.full_name || "Kullanıcı",
          card: {
            cardHolderName: formData.cardHolderName,
            cardNumber: formData.cardNumber.replace(/\s/g, ""),
            expireMonth: formData.expireMonth,
            expireYear: formData.expireYear,
            cvc: "123",
          },
          billingInfo,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Ödeme işlemi başarısız")
      }

      await refreshSubscription()

      toast({
        title: "Ödeme Başarılı",
        description: "Premium üyeliğiniz aktif edildi!",
      })

      router.push("/uygulama/ana-sayfa")
    } catch (error) {
      console.error("Payment error:", error)
      toast({
        title: "Ödeme Hatası",
        description: error instanceof Error ? error.message : "Ödeme işlemi başarısız oldu",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <Card className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white border-transparent shadow-xl rounded-xl">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <Wallet className="h-8 w-8" />
                Ödeme
              </h2>
              <p className="text-blue-100 text-lg">
                Güvenli ödeme ile premium üyeliğe geçin ve tüm özelliklerin keyfini çıkarın
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Card Preview & Summary */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 text-white shadow-2xl h-56 transform transition-transform hover:scale-105">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl"></div>
            <CardContent className="relative p-8 h-full flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg shadow-lg"></div>
                <CreditCard className="h-10 w-10 text-white/80" />
              </div>
              <div className="space-y-4">
                <div className="text-2xl font-mono tracking-wider">{formData.cardNumber || "•••• •••• •••• ••••"}</div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white/60 mb-1">Kart Sahibi</p>
                    <p className="font-medium">{formData.cardHolderName || "AD SOYAD"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/60 mb-1">Son Kullanma</p>
                    <p className="font-medium">
                      {formData.expireMonth && formData.expireYear
                        ? `${formData.expireMonth}/${formData.expireYear}`
                        : "MM/YYYY"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Summary */}
          <Card className="border-2 border-emerald-500 dark:border-emerald-600 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-600" />
                Ödeme Özeti
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-gray-600 dark:text-gray-400">Premium Üyelik</span>
                <span className="font-semibold text-lg">199₺</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-gray-600 dark:text-gray-400">Periyot</span>
                <span className="font-semibold">Aylık</span>
              </div>
              <div className="flex items-center justify-between py-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-lg px-4">
                <span className="text-lg font-bold">Toplam</span>
                <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">199₺</span>
              </div>
            </CardContent>
          </Card>

          {/* Security Features */}
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

        {/* Right Column - Forms */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Building2 className="h-6 w-6 text-emerald-600" />
                  Fatura Bilgileri
                </CardTitle>
                <CardDescription>Fatura için gerekli bilgilerinizi girin</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-base flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Ad Soyad
                    </Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      placeholder="Akın Kaya"
                      value={billingInfo.fullName}
                      onChange={handleBillingChange}
                      required
                      disabled={isProcessing}
                      className="h-12 text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-base flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      E-posta
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="akin@example.com"
                      value={billingInfo.email}
                      onChange={handleBillingChange}
                      required
                      disabled={isProcessing}
                      className="h-12 text-base"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-base flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Telefon
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      placeholder="0555 123 4567"
                      value={billingInfo.phone}
                      onChange={handleBillingChange}
                      required
                      disabled={isProcessing}
                      className="h-12 text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-base">
                      Şehir
                    </Label>
                    <Input
                      id="city"
                      name="city"
                      placeholder="İstanbul"
                      value={billingInfo.city}
                      onChange={handleBillingChange}
                      required
                      disabled={isProcessing}
                      className="h-12 text-base"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-base">
                      Adres
                    </Label>
                    <Input
                      id="address"
                      name="address"
                      placeholder="Mahalle, Sokak, No"
                      value={billingInfo.address}
                      onChange={handleBillingChange}
                      required
                      disabled={isProcessing}
                      className="h-12 text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zipCode" className="text-base">
                      Posta Kodu
                    </Label>
                    <Input
                      id="zipCode"
                      name="zipCode"
                      placeholder="34000"
                      value={billingInfo.zipCode}
                      onChange={handleBillingChange}
                      required
                      disabled={isProcessing}
                      className="h-12 text-base"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <CreditCard className="h-6 w-6 text-emerald-600" />
                  Kart Bilgileri
                </CardTitle>
                <CardDescription>Ödeme bilgilerinizi güvenle girin</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="cardHolderName" className="text-base">
                    Kart Üzerindeki İsim
                  </Label>
                  <Input
                    id="cardHolderName"
                    name="cardHolderName"
                    placeholder="AKIN KAYA"
                    value={formData.cardHolderName}
                    onChange={handleInputChange}
                    required
                    disabled={isProcessing}
                    className="h-12 text-base uppercase"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cardNumber" className="text-base">
                    Kart Numarası
                  </Label>
                  <Input
                    id="cardNumber"
                    name="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={formData.cardNumber}
                    onChange={handleInputChange}
                    maxLength={19}
                    required
                    disabled={isProcessing}
                    className="h-12 text-base font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expireMonth" className="text-base">
                      Son Kullanma Ayı
                    </Label>
                    <Input
                      id="expireMonth"
                      name="expireMonth"
                      placeholder="12"
                      value={formData.expireMonth}
                      onChange={handleInputChange}
                      maxLength={2}
                      required
                      disabled={isProcessing}
                      className="h-12 text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expireYear" className="text-base">
                      Son Kullanma Yılı
                    </Label>
                    <Input
                      id="expireYear"
                      name="expireYear"
                      placeholder="2025"
                      value={formData.expireYear}
                      onChange={handleInputChange}
                      maxLength={4}
                      required
                      disabled={isProcessing}
                      className="h-12 text-base"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border">
                  <Lock className="h-4 w-4 flex-shrink-0" />
                  <span>Ödeme bilgileriniz SSL ile şifrelenir ve güvenli şekilde işlenir</span>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg hover:shadow-xl transition-all h-14 text-lg"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      İşleniyor...
                    </>
                  ) : (
                    <>
                      <Lock className="h-5 w-5 mr-2" />
                      199₺ Öde ve Aktifleştir
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </form>
        </div>
      </div>
    </div>
  )
}
