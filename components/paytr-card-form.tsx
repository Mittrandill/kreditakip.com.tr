"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CreditCard, Lock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface BillingInfo {
  fullName: string
  email: string
  phone: string
  address: string
  city: string
  district: string
  zipCode: string
  identityNumber: string
  taxOffice?: string
  taxNumber?: string
}

interface PayTRCardFormProps {
  planId: string
  planName: string
  price: number
  userId: string
  userEmail: string
  billingInfo?: BillingInfo
  termsAccepted?: boolean
  onSuccess?: () => void
  onError?: (error: string) => void
}

export default function PayTRCardForm({
  planId,
  planName,
  price,
  userId,
  userEmail,
  billingInfo,
  termsAccepted = true,
  onSuccess,
  onError,
}: PayTRCardFormProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Card form state
  const [cardNumber, setCardNumber] = useState("")
  const [cardExpiry, setCardExpiry] = useState("")
  const [cardCvv, setCardCvv] = useState("")
  const [cardHolderName, setCardHolderName] = useState("")

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, "")
    const formatted = cleaned.match(/.{1,4}/g)?.join(" ") || cleaned
    return formatted.slice(0, 19) // Max 16 digits + 3 spaces
  }

  // Format expiry date
  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, "")
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + "/" + cleaned.slice(2, 4)
    }
    return cleaned
  }

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardNumber(formatCardNumber(e.target.value))
  }

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardExpiry(formatExpiry(e.target.value))
  }

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 3)
    setCardCvv(value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!userId || !userEmail) {
      toast({
        title: "Hata",
        description: "Lütfen önce giriş yapın",
        variant: "destructive",
      })
      return
    }

    // Validation
    const cleanCardNumber = cardNumber.replace(/\s/g, "")
    if (cleanCardNumber.length !== 16) {
      toast({
        title: "Geçersiz Kart Numarası",
        description: "Kart numarası 16 haneli olmalıdır",
        variant: "destructive",
      })
      return
    }

    if (cardExpiry.length !== 5) {
      toast({
        title: "Geçersiz Son Kullanma Tarihi",
        description: "Format: AA/YY",
        variant: "destructive",
      })
      return
    }

    if (cardCvv.length !== 3) {
      toast({
        title: "Geçersiz CVV",
        description: "CVV 3 haneli olmalıdır",
        variant: "destructive",
      })
      return
    }

    if (!cardHolderName.trim()) {
      toast({
        title: "Kart Sahibi Adı Gerekli",
        description: "Lütfen kart üzerindeki adı girin",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/paytr/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId,
          userId,
          userEmail,
          cardNumber: cleanCardNumber,
          cardExpiry,
          cardCvv,
          cardHolderName,
          billingInfo,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Ödeme oluşturulamadı")
      }

      if (data.redirectUrl) {
        // Redirect to 3D Secure page
        toast({
          title: "3D Secure Doğrulaması",
          description: "Güvenli ödeme sayfasına yönlendiriliyorsunuz...",
        })

        // Redirect after a short delay
        setTimeout(() => {
          window.location.href = data.redirectUrl
        }, 1000)
      }
    } catch (error: any) {
      console.error("PayTR checkout error:", error)
      toast({
        title: "Ödeme Hatası",
        description: error.message || "Bir hata oluştu, lütfen tekrar deneyin",
        variant: "destructive",
      })
      onError?.(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Kart Bilgileri
        </CardTitle>
        <CardDescription>
          {planName} - {price} TL
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Alert className="mb-4">
          <Lock className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>Güvenli Ödeme:</strong> Kart bilgileriniz şifrelenir ve güvenli PayTR altyapısı üzerinden işlenir.
            Bilgileriniz saklanmaz.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="cardHolderName">Kart Sahibi Adı</Label>
            <Input
              id="cardHolderName"
              placeholder="AD SOYAD"
              value={cardHolderName}
              onChange={(e) => setCardHolderName(e.target.value.toUpperCase())}
              disabled={loading}
              required
            />
          </div>

          <div>
            <Label htmlFor="cardNumber">Kart Numarası</Label>
            <Input
              id="cardNumber"
              placeholder="0000 0000 0000 0000"
              value={cardNumber}
              onChange={handleCardNumberChange}
              disabled={loading}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cardExpiry">Son Kullanma</Label>
              <Input
                id="cardExpiry"
                placeholder="AA/YY"
                value={cardExpiry}
                onChange={handleExpiryChange}
                disabled={loading}
                required
              />
            </div>

            <div>
              <Label htmlFor="cardCvv">CVV</Label>
              <Input
                id="cardCvv"
                type="password"
                placeholder="000"
                value={cardCvv}
                onChange={handleCvvChange}
                disabled={loading}
                required
                maxLength={3}
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading || !termsAccepted}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                İşleniyor...
              </>
            ) : !termsAccepted ? (
              <>
                <Lock className="mr-2 h-4 w-4" />
                Koşulları Kabul Edin
              </>
            ) : (
              <>
                <Lock className="mr-2 h-4 w-4" />
                Güvenli Ödeme Yap ({price} TL)
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
