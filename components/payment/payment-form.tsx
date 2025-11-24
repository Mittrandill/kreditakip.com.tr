"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import { CreditCard, Lock, AlertCircle } from "lucide-react"

interface PaymentFormProps {
  planId: string
  planName: string
  amount: number
  billingInfo: {
    fullName: string
    email: string
    phone: string
    address: string
    city: string
    district?: string
    country?: string
    zipCode?: string
    identityNumber?: string
    taxNumber?: string
    taxOffice?: string
  }
  onSuccess?: () => void
  onError?: (error: string) => void
}

// Kart türü tespiti
const detectCardType = (number: string): string => {
  const cleaned = number.replace(/\s/g, "")

  if (/^4/.test(cleaned)) return "visa"
  if (/^5[1-5]/.test(cleaned)) return "mastercard"
  if (/^3[47]/.test(cleaned)) return "amex"
  if (/^9792/.test(cleaned)) return "troy"
  if (/^6/.test(cleaned)) return "discover"

  return "unknown"
}

// Kart numarasını formatla
const formatCardNumber = (value: string): string => {
  const cleaned = value.replace(/\s/g, "")
  const formatted = cleaned.match(/.{1,4}/g)?.join(" ") || cleaned
  return formatted.substring(0, 19) // Max 16 digit + 3 space
}

// Sadece rakam
const onlyNumbers = (value: string): string => {
  return value.replace(/\D/g, "")
}

export function PaymentForm({ planId, planName, amount, billingInfo, onSuccess, onError }: PaymentFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveCard, setSaveCard] = useState(false)
  const [autoRenewal, setAutoRenewal] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)

  // Form state
  const [cardHolder, setCardHolder] = useState("")
  const [cardNumber, setCardNumber] = useState("")
  const [expiryMonth, setExpiryMonth] = useState("")
  const [expiryYear, setExpiryYear] = useState("")
  const [cvv, setCvv] = useState("")
  const [cardType, setCardType] = useState<string>("unknown")

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Kart türünü tespit et
  useEffect(() => {
    setCardType(detectCardType(cardNumber))
  }, [cardNumber])

  // Client-side validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!cardHolder.trim()) {
      newErrors.cardHolder = "Kart sahibi adı gerekli"
    }

    const cleanedNumber = cardNumber.replace(/\s/g, "")
    if (cleanedNumber.length < 15 || cleanedNumber.length > 16) {
      newErrors.cardNumber = "Geçersiz kart numarası"
    }

    if (!validateLuhn(cleanedNumber)) {
      newErrors.cardNumber = "Kart numarası geçersiz"
    }

    const month = parseInt(expiryMonth, 10)
    if (month < 1 || month > 12) {
      newErrors.expiry = "Geçersiz ay (1-12)"
    }

    const year = parseInt(expiryYear, 10)
    const currentYear = new Date().getFullYear() % 100
    const currentMonth = new Date().getMonth() + 1

    if (expiryYear.length !== 2) {
      newErrors.expiry = "Yıl 2 haneli olmalı (örn: 25)"
    } else if (year < currentYear || (year === currentYear && month < currentMonth)) {
      newErrors.expiry = "Kart süresi geçmiş"
    }

    if (cvv.length !== 3) {
      newErrors.cvv = "CVV 3 haneli olmalı"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Luhn algoritması
  const validateLuhn = (cardNumber: string): boolean => {
    const cleaned = cardNumber.replace(/\s/g, "")

    if (!/^\d+$/.test(cleaned)) return false
    if (cleaned.length < 13 || cleaned.length > 19) return false

    let sum = 0
    let isEven = false

    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned.charAt(i), 10)

      if (isEven) {
        digit *= 2
        if (digit > 9) digit -= 9
      }

      sum += digit
      isEven = !isEven
    }

    return sum % 10 === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      // Validate terms acceptance
      if (!termsAccepted) {
        setError("Lütfen kullanım koşullarını ve gizlilik politikasını kabul edin")
        setIsLoading(false)
        return
      }

      // Validate auto-renewal if card is being saved
      if (saveCard && !autoRenewal) {
        setError("Kart saklama için otomatik yenileme onayı gereklidir")
        setIsLoading(false)
        return
      }

      // Validate
      if (!validateForm()) {
        setIsLoading(false)
        return
      }

      // Step 1: Get token from backend
      const response = await fetch("/api/subscription/checkout/direct", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId,
          billingInfo,
          installmentCount: 0,
          storeCard: saveCard, // Kart saklama tercihi
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Ödeme başlatılamadı")
      }

      const { formData, paytrUrl } = await response.json()

      // Step 2: Add card info to form data
      formData.cc_owner = cardHolder.toUpperCase()
      formData.card_number = cardNumber.replace(/\s/g, "")
      formData.expiry_month = expiryMonth.padStart(2, "0")
      formData.expiry_year = expiryYear
      formData.cvv = cvv

      // Step 3: Create form and submit to PayTR
      const form = document.createElement("form")
      form.method = "POST"
      form.action = paytrUrl

      for (const [key, value] of Object.entries(formData)) {
        const input = document.createElement("input")
        input.type = "hidden"
        input.name = key
        input.value = value as string
        form.appendChild(input)
      }

      document.body.appendChild(form)
      form.submit()

      // Call success callback if provided
      if (onSuccess) {
        onSuccess()
      }
    } catch (err: any) {
      console.error("Payment error:", err)
      const errorMessage = err.message || "Bir hata oluştu"
      setError(errorMessage)
      if (onError) {
        onError(errorMessage)
      }
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Ödeme Bilgileri</CardTitle>
            <CardDescription>
              {planName} - {amount.toFixed(2)} TL
            </CardDescription>
          </div>
          <Image src="/paytr-logo.png" alt="PayTR" width={80} height={30} className="object-contain" />
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Güvenlik Mesajı */}
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Ödemeniz 3D Secure ile güvenli bir şekilde işlenir. Kart bilgileriniz PayTR güvenli ödeme altyapısı
              tarafından korunur.
            </AlertDescription>
          </Alert>

          {/* Kart Sahibi */}
          <div className="space-y-2">
            <Label htmlFor="cardHolder">Kart Üzerindeki İsim</Label>
            <Input
              id="cardHolder"
              placeholder="AD SOYAD"
              value={cardHolder}
              onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
              disabled={isLoading}
              required
              maxLength={50}
              className={errors.cardHolder ? "border-red-500" : ""}
            />
            {errors.cardHolder && <p className="text-sm text-red-500">{errors.cardHolder}</p>}
          </div>

          {/* Kart Numarası */}
          <div className="space-y-2">
            <Label htmlFor="cardNumber">Kart Numarası</Label>
            <div className="relative">
              <Input
                id="cardNumber"
                placeholder="0000 0000 0000 0000"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(onlyNumbers(e.target.value)))}
                disabled={isLoading}
                required
                maxLength={19}
                className={errors.cardNumber ? "border-red-500" : ""}
              />
              {cardType !== "unknown" && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <CreditCard className="h-5 w-5 text-gray-400" />
                </div>
              )}
            </div>
            {errors.cardNumber && <p className="text-sm text-red-500">{errors.cardNumber}</p>}
          </div>

          {/* Son Kullanma ve CVV */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiryMonth">Ay</Label>
              <Input
                id="expiryMonth"
                placeholder="MM"
                value={expiryMonth}
                onChange={(e) => setExpiryMonth(onlyNumbers(e.target.value))}
                disabled={isLoading}
                required
                maxLength={2}
                className={errors.expiry ? "border-red-500" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiryYear">Yıl</Label>
              <Input
                id="expiryYear"
                placeholder="YY"
                value={expiryYear}
                onChange={(e) => setExpiryYear(onlyNumbers(e.target.value))}
                disabled={isLoading}
                required
                maxLength={2}
                className={errors.expiry ? "border-red-500" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cvv">CVV</Label>
              <Input
                id="cvv"
                placeholder="000"
                value={cvv}
                onChange={(e) => setCvv(onlyNumbers(e.target.value))}
                disabled={isLoading}
                required
                maxLength={3}
                type="password"
                className={errors.cvv ? "border-red-500" : ""}
              />
            </div>
          </div>
          {errors.expiry && <p className="text-sm text-red-500">{errors.expiry}</p>}
          {errors.cvv && <p className="text-sm text-red-500">{errors.cvv}</p>}

          {/* Kart Saklama ve Otomatik Yenileme */}
          <div className="space-y-3 pt-2">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="saveCard"
                checked={saveCard}
                onCheckedChange={(checked) => {
                  setSaveCard(checked as boolean)
                  if (!checked) setAutoRenewal(false)
                }}
                disabled={isLoading}
                className="mt-1"
              />
              <div className="flex-1">
                <Label
                  htmlFor="saveCard"
                  className="text-sm font-medium cursor-pointer block"
                >
                  Kartımı güvenli bir şekilde sakla
                </Label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Kart bilgileriniz PayTR güvenli altyapısında saklanır. Sunucularımızda tutulmaz.
                </p>
              </div>
            </div>

            {saveCard && (
              <div className="flex items-start space-x-2 ml-6 pl-4 border-l-2 border-emerald-500 dark:border-emerald-600">
                <Checkbox
                  id="autoRenewal"
                  checked={autoRenewal}
                  onCheckedChange={(checked) => setAutoRenewal(checked as boolean)}
                  disabled={isLoading}
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label
                    htmlFor="autoRenewal"
                    className="text-sm font-medium cursor-pointer block"
                  >
                    Otomatik yenileme onayı (Zorunlu)
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Aboneliğiniz süre dolmadan 3 gün önce email ile bilgilendirilecek ve otomatik yenilenecektir.
                    Yenileme ödemeleri Non3D (3D Secure olmadan) yapılacaktır. İstediğiniz zaman iptal edebilirsiniz.
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start space-x-2">
              <Checkbox
                id="termsAccepted"
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                disabled={isLoading}
                className="mt-1"
              />
              <div className="flex-1">
                <Label
                  htmlFor="termsAccepted"
                  className="text-sm font-medium cursor-pointer block"
                >
                  Kullanım koşullarını kabul ediyorum (Zorunlu)
                </Label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <a href="/kullanim-kosullari" target="_blank" className="underline hover:text-emerald-600">
                    Kullanım Koşulları
                  </a>
                  {" ve "}
                  <a href="/gizlilik-politikasi" target="_blank" className="underline hover:text-emerald-600">
                    Gizlilik Politikası
                  </a>
                  'nı okudum ve kabul ediyorum.
                </p>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isLoading} size="lg">
            {isLoading ? (
              <>
                <span className="mr-2">İşleniyor...</span>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </>
            ) : (
              <>
                <Lock className="mr-2 h-4 w-4" />
                Güvenli Ödeme Yap
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Ödeme yaparak{" "}
            <a href="/kullanim-kosullari" className="underline" target="_blank">
              Kullanım Koşullarını
            </a>{" "}
            ve{" "}
            <a href="/gizlilik-politikasi" className="underline" target="_blank">
              Gizlilik Politikasını
            </a>{" "}
            kabul etmiş olursunuz.
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
