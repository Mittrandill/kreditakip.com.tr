"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CreditCard, Lock, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"

export default function PaymentPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)
  const [formData, setFormData] = useState({
    cardHolderName: "",
    cardNumber: "",
    expireMonth: "",
    expireYear: "",
    cvc: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    // Format card number with spaces
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)
    console.log("[v0] Starting payment process...")

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("Oturum açmanız gerekiyor")
      }

      // Get user profile
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      if (!profile) {
        throw new Error("Kullanıcı profili bulunamadı")
      }

      console.log("[v0] Sending payment request...")

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
            cvc: formData.cvc,
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Ödeme işlemi başarısız")
      }

      console.log("[v0] Payment successful!")

      toast({
        title: "Ödeme Başarılı",
        description: "Premium üyeliğiniz aktif edildi!",
      })

      router.push("/uygulama/premium?success=true")
    } catch (error) {
      console.error("[v0] Payment error:", error)
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
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Ödeme</h1>
          <p className="text-gray-600 dark:text-gray-400">Premium üyelik için ödeme bilgilerinizi girin</p>
        </div>
      </div>

      {/* Payment Summary */}
      <Card className="border-2 border-emerald-600 dark:border-emerald-500">
        <CardHeader>
          <CardTitle>Ödeme Özeti</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">Premium Üyelik</span>
            <span className="font-semibold">199₺</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">Periyot</span>
            <span className="font-semibold">Aylık</span>
          </div>
          <div className="border-t pt-4 flex items-center justify-between">
            <span className="text-lg font-bold">Toplam</span>
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">199₺</span>
          </div>
        </CardContent>
      </Card>

      {/* Payment Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Kart Bilgileri
          </CardTitle>
          <CardDescription>Ödeme bilgileriniz güvenli şekilde işlenir</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cardHolderName">Kart Üzerindeki İsim</Label>
              <Input
                id="cardHolderName"
                name="cardHolderName"
                placeholder="AKIN KAYA"
                value={formData.cardHolderName}
                onChange={handleInputChange}
                required
                disabled={isProcessing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cardNumber">Kart Numarası</Label>
              <Input
                id="cardNumber"
                name="cardNumber"
                placeholder="1234 5678 9012 3456"
                value={formData.cardNumber}
                onChange={handleInputChange}
                maxLength={19}
                required
                disabled={isProcessing}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expireMonth">Ay</Label>
                <Input
                  id="expireMonth"
                  name="expireMonth"
                  placeholder="12"
                  value={formData.expireMonth}
                  onChange={handleInputChange}
                  maxLength={2}
                  required
                  disabled={isProcessing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expireYear">Yıl</Label>
                <Input
                  id="expireYear"
                  name="expireYear"
                  placeholder="2025"
                  value={formData.expireYear}
                  onChange={handleInputChange}
                  maxLength={4}
                  required
                  disabled={isProcessing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cvc">CVC</Label>
                <Input
                  id="cvc"
                  name="cvc"
                  placeholder="123"
                  value={formData.cvc}
                  onChange={handleInputChange}
                  maxLength={3}
                  required
                  disabled={isProcessing}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <Lock className="h-4 w-4" />
              <span>Ödeme bilgileriniz SSL ile şifrelenir ve güvenli şekilde işlenir</span>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
              size="lg"
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
          </form>
        </CardContent>
      </Card>

      {/* Security Info */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-blue-900 dark:text-blue-100">Güvenli Ödeme</p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Tüm ödemeler iyzico güvencesi altında işlenir. Kart bilgileriniz saklanmaz.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
