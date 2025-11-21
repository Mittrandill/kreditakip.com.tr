/**
 * PayTR Direct API - Client-Side Implementation Example
 *
 * Bu dosya PayTR Direct API'nin nasıl kullanılacağına dair örnek bir implementasyondur.
 * Gerçek projenizde bu kodu ihtiyaçlarınıza göre uyarlayın.
 *
 * GÜVENLIK ÖNEMLİ:
 * - Kart bilgileri ASLA state'e kaydedilmez
 * - Kart bilgileri ASLA sunucuya gönderilmez
 * - Kart bilgileri DOĞRUDAN PayTR'ye POST edilir
 */

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface BillingInfo {
  fullName: string
  email: string
  phone: string
  address: string
  city: string
}

export function PayTRDirectPaymentForm({ planId, billingInfo }: { planId: string; billingInfo: BillingInfo }) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form ref - kart bilgileri için
  const formRef = useState<HTMLFormElement | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const form = e.currentTarget
      const formData = new FormData(form)

      // Kart bilgilerini al
      const cardHolder = formData.get("cardHolder") as string
      const cardNumber = (formData.get("cardNumber") as string).replace(/\s/g, "")
      const expiryMonth = formData.get("expiryMonth") as string
      const expiryYear = formData.get("expiryYear") as string
      const cvv = formData.get("cvv") as string

      // Client-side validation
      if (!validateCardNumber(cardNumber)) {
        setError("Geçersiz kart numarası")
        setIsLoading(false)
        return
      }

      if (!validateCVV(cvv)) {
        setError("Geçersiz CVV kodu")
        setIsLoading(false)
        return
      }

      if (!validateExpiryDate(expiryMonth, expiryYear)) {
        setError("Geçersiz son kullanma tarihi")
        setIsLoading(false)
        return
      }

      // Step 1: Get token from our backend
      const response = await fetch("/api/subscription/checkout/direct", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId,
          billingInfo,
          installmentCount: 0, // Taksitsiz
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Ödeme başlatılamadı")
      }

      const { formData: paytrFormData, paytrUrl } = await response.json()

      // Step 2: Add card info to form data
      paytrFormData.cc_owner = cardHolder
      paytrFormData.card_number = cardNumber
      paytrFormData.expiry_month = expiryMonth
      paytrFormData.expiry_year = expiryYear
      paytrFormData.cvv = cvv

      // Step 3: Submit to PayTR (DOĞRUDAN PayTR'ye POST)
      submitToPayTR(paytrFormData, paytrUrl)
    } catch (err: any) {
      console.error("Payment error:", err)
      setError(err.message || "Bir hata oluştu")
      setIsLoading(false)
    }
  }

  /**
   * PayTR'ye form POST et
   * Kart bilgileri DOĞRUDAN PayTR'ye gönderilir
   */
  const submitToPayTR = (formData: Record<string, string>, paytrUrl: string) => {
    const form = document.createElement("form")
    form.method = "POST"
    form.action = paytrUrl

    // Add all form fields
    for (const [key, value] of Object.entries(formData)) {
      const input = document.createElement("input")
      input.type = "hidden"
      input.name = key
      input.value = value
      form.appendChild(input)
    }

    document.body.appendChild(form)
    form.submit()
  }

  /**
   * Kart numarası validasyonu (Luhn algoritması)
   */
  const validateCardNumber = (cardNumber: string): boolean => {
    const cleaned = cardNumber.replace(/[\s-]/g, "")

    if (!/^\d+$/.test(cleaned)) {
      return false
    }

    if (cleaned.length < 13 || cleaned.length > 19) {
      return false
    }

    // Luhn algoritması
    let sum = 0
    let isEven = false

    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned.charAt(i), 10)

      if (isEven) {
        digit *= 2
        if (digit > 9) {
          digit -= 9
        }
      }

      sum += digit
      isEven = !isEven
    }

    return sum % 10 === 0
  }

  /**
   * CVV validasyonu
   */
  const validateCVV = (cvv: string): boolean => {
    return /^\d{3}$/.test(cvv)
  }

  /**
   * Son kullanma tarihi validasyonu
   */
  const validateExpiryDate = (month: string, year: string): boolean => {
    const monthNum = parseInt(month, 10)
    const yearNum = parseInt(year, 10)

    if (monthNum < 1 || monthNum > 12) {
      return false
    }

    if (year.length !== 2) {
      return false
    }

    const currentYear = new Date().getFullYear() % 100
    const currentMonth = new Date().getMonth() + 1

    if (yearNum < currentYear) {
      return false
    }

    if (yearNum === currentYear && monthNum < currentMonth) {
      return false
    }

    return true
  }

  /**
   * Kart numarasını formatla (4 haneli gruplar)
   */
  const formatCardNumber = (value: string): string => {
    const cleaned = value.replace(/\s/g, "")
    const formatted = cleaned.match(/.{1,4}/g)?.join(" ") || cleaned
    return formatted
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="cardHolder">Kart Sahibi</Label>
        <Input
          id="cardHolder"
          name="cardHolder"
          placeholder="AD SOYAD"
          required
          autoComplete="cc-name"
          maxLength={50}
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="cardNumber">Kart Numarası</Label>
        <Input
          id="cardNumber"
          name="cardNumber"
          placeholder="0000 0000 0000 0000"
          required
          autoComplete="cc-number"
          maxLength={19}
          disabled={isLoading}
          onChange={(e) => {
            e.target.value = formatCardNumber(e.target.value)
          }}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="expiryMonth">Ay</Label>
          <Input
            id="expiryMonth"
            name="expiryMonth"
            placeholder="MM"
            required
            autoComplete="cc-exp-month"
            maxLength={2}
            disabled={isLoading}
            pattern="[0-9]{1,2}"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="expiryYear">Yıl</Label>
          <Input
            id="expiryYear"
            name="expiryYear"
            placeholder="YY"
            required
            autoComplete="cc-exp-year"
            maxLength={2}
            disabled={isLoading}
            pattern="[0-9]{2}"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cvv">CVV</Label>
          <Input
            id="cvv"
            name="cvv"
            placeholder="000"
            required
            autoComplete="cc-csc"
            maxLength={3}
            disabled={isLoading}
            pattern="[0-9]{3}"
            type="password"
          />
        </div>
      </div>

      <div className="pt-4">
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "İşleniyor..." : "Ödemeyi Tamamla"}
        </Button>
      </div>

      <div className="text-xs text-muted-foreground text-center">
        <p>Ödemeniz 3D Secure ile güvenli bir şekilde işlenir.</p>
        <p>Kart bilgileriniz PayTR güvenli ödeme altyapısı tarafından korunur.</p>
      </div>
    </form>
  )
}

/**
 * Test Modu İçin Kart Bilgileri
 */
export function TestCardInfo() {
  return (
    <Alert>
      <AlertDescription>
        <div className="space-y-2">
          <p className="font-semibold">Test Kartları (Test Modu)</p>
          <div className="text-xs space-y-1">
            <p>
              <strong>Visa:</strong> 4355 0843 5508 4358
            </p>
            <p>
              <strong>Mastercard:</strong> 5406 6754 0667 5403
            </p>
            <p>
              <strong>Troy:</strong> 9792 0303 9444 0796
            </p>
            <p>
              <strong>Ad Soyad:</strong> PAYTR TEST
            </p>
            <p>
              <strong>Son Kullanma:</strong> 12/24
            </p>
            <p>
              <strong>CVV:</strong> 000
            </p>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  )
}
