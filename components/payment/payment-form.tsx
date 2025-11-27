"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import Image from "next/image"
import { CreditCard, Lock, AlertCircle, FileText, Shield } from "lucide-react"
import FingerprintJS from "@fingerprintjs/fingerprintjs"

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

  // Modal states
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)

  // Form state
  const [cardHolder, setCardHolder] = useState("")
  const [cardNumber, setCardNumber] = useState("")
  const [expiryMonth, setExpiryMonth] = useState("")
  const [expiryYear, setExpiryYear] = useState("")
  const [cvv, setCvv] = useState("")
  const [cardType, setCardType] = useState<string>("unknown")

  // Security: Device fingerprinting
  const [deviceFingerprint, setDeviceFingerprint] = useState<string>("")

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Initialize device fingerprinting on mount
  useEffect(() => {
    const initFingerprint = async () => {
      try {
        const fp = await FingerprintJS.load()
        const result = await fp.get()
        setDeviceFingerprint(result.visitorId)
        console.log("[Security] Device fingerprint initialized:", result.visitorId)
      } catch (error) {
        console.error("[Security] Failed to initialize fingerprint:", error)
      }
    }
    initFingerprint()
  }, [])

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

      // Validate card form
      if (!validateForm()) {
        setIsLoading(false)
        return
      }

      // Collect browser/device information for security
      const browserInfo = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        platform: navigator.platform,
      }

      // Get Direct API token from backend
      const response = await fetch("/api/subscription/checkout/direct", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId,
          billingInfo,
          installmentCount: 0,
          storeCard: saveCard,
          securityContext: {
            deviceFingerprint,
            browserInfo,
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Ödeme başlatılamadı")
      }

      const { formData, paytrUrl } = await response.json()

      // Add card info to form data
      formData.cc_owner = cardHolder.toUpperCase()
      formData.card_number = cardNumber.replace(/\s/g, "")
      formData.expiry_month = expiryMonth.padStart(2, "0")
      formData.expiry_year = expiryYear
      formData.cvv = cvv

      // Create form and submit to PayTR
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
    <>
      {/* Kullanım Koşulları Modal */}
      <Dialog open={showTermsModal} onOpenChange={setShowTermsModal}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-600" />
              <DialogTitle>Kullanım Koşulları</DialogTitle>
            </div>
            <DialogDescription>
              Lütfen kullanım koşullarını okuyup onaylayın
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[50vh] pr-4">
            <div className="space-y-4 text-sm">
              <section>
                <h3 className="font-semibold text-base mb-2">1. Genel Hükümler</h3>
                <p className="text-muted-foreground">
                  Bu kullanım koşulları, kreditakip.com.tr platformunu kullanan tüm kullanıcılar için geçerlidir.
                  Platformu kullanarak bu koşulları kabul etmiş sayılırsınız.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">2. Hizmet Tanımı</h3>
                <p className="text-muted-foreground">
                  KrediTakip, kredi kartı ve kredi takibi yapmak için geliştirilmiş bir platformdur. Platform,
                  kullanıcıların kredi kartlarını takip etmesini, ödeme planlarını oluşturmasını ve finansal
                  durumlarını analiz etmesini sağlar.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">3. Kullanıcı Sorumlulukları</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Hesap güvenliğinden kullanıcı sorumludur</li>
                  <li>Doğru ve güncel bilgi sağlanmalıdır</li>
                  <li>Platform kötüye kullanılmamalıdır</li>
                  <li>Ödeme yükümlülükleri zamanında yerine getirilmelidir</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">4. Abonelik ve Ödeme</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Premium planlar aylık veya yıllık olarak sunulur</li>
                  <li>Ödemeler güvenli PayTR altyapısı üzerinden yapılır</li>
                  <li>Otomatik yenileme seçilirse, süre bitiminden 3 gün önce bildirim gönderilir</li>
                  <li>İptal işlemi her zaman yapılabilir ancak ödenen tutar iade edilmez</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">5. Gizlilik ve Veri Güvenliği</h3>
                <p className="text-muted-foreground">
                  Kullanıcı verileri Gizlilik Politikası kapsamında korunur. Kart bilgileri PayTR'nin güvenli
                  altyapısında saklanır ve hiçbir zaman sunucularımıza gelmez.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">6. Otomatik Yenileme Hatırlatmaları</h3>
                <p className="text-muted-foreground">
                  Kart saklama seçeneğini tercih ederseniz:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground mt-2">
                  <li>Kartınız PayTR güvenli token sistemi ile saklanır</li>
                  <li>Aboneliğiniz bitmeden 3 gün önce email ile hatırlatılır</li>
                  <li>İstediğiniz zaman ayarlardan yenileme tercihlerinizi değiştirebilirsiniz</li>
                  <li>Kart bilgileriniz hiçbir zaman sunucularımızda saklanmaz</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">7. Hizmet Değişiklikleri</h3>
                <p className="text-muted-foreground">
                  Platform, hizmet kapsamını ve fiyatlandırmayı değiştirme hakkını saklı tutar. Değişiklikler
                  kullanıcılara bildirilir.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">8. Sorumluluk Reddi</h3>
                <p className="text-muted-foreground">
                  Platform, kullanıcıların finansal kararlarından sorumlu değildir. Tüm kararlar kullanıcı
                  sorumluluğundadır.
                </p>
              </section>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowTermsModal(false)}
            >
              İptal
            </Button>
            <Button
              onClick={() => {
                setTermsAccepted(true)
                setShowTermsModal(false)
              }}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Okudum ve Kabul Ediyorum
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Gizlilik Politikası Modal */}
      <Dialog open={showPrivacyModal} onOpenChange={setShowPrivacyModal}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-600" />
              <DialogTitle>Gizlilik Politikası</DialogTitle>
            </div>
            <DialogDescription>
              Kişisel verilerinizin nasıl korunduğunu öğrenin
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[50vh] pr-4">
            <div className="space-y-4 text-sm">
              <section>
                <h3 className="font-semibold text-base mb-2">1. Toplanan Veriler</h3>
                <p className="text-muted-foreground mb-2">
                  Hizmetlerimizi sağlamak için aşağıdaki verileri topluyoruz:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Kimlik bilgileri (ad, soyad, TC kimlik no)</li>
                  <li>İletişim bilgileri (email, telefon)</li>
                  <li>Fatura bilgileri (adres, vergi bilgileri)</li>
                  <li>Kredi kartı bilgileri (tokenize edilmiş, PayTR tarafından saklanır)</li>
                  <li>Kullanım verileri (platform kullanımı, tercihler)</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">2. Verilerin Kullanımı</h3>
                <p className="text-muted-foreground mb-2">Verilerinizi şu amaçlarla kullanırız:</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Hizmet sağlamak ve geliştirmek</li>
                  <li>Ödeme işlemlerini gerçekleştirmek</li>
                  <li>Müşteri desteği sağlamak</li>
                  <li>Yasal yükümlülükleri yerine getirmek</li>
                  <li>Kullanıcı deneyimini iyileştirmek</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">3. Veri Güvenliği</h3>
                <p className="text-muted-foreground">
                  Verilerinizin güvenliği bizim önceliğimizdir:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground mt-2">
                  <li>256-bit SSL şifreleme kullanılır</li>
                  <li>Kart bilgileri hiçbir zaman sunucularımıza gelmez</li>
                  <li>PayTR PCI-DSS sertifikalı altyapı kullanılır</li>
                  <li>Düzenli güvenlik denetimleri yapılır</li>
                  <li>Erişim kontrolleri ve yetkilendirme sistemleri uygulanır</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">4. Üçüncü Taraf Paylaşımı</h3>
                <p className="text-muted-foreground mb-2">Verileriniz sadece şu durumlarda paylaşılır:</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Ödeme işlemleri için PayTR ile (zorunlu)</li>
                  <li>Yasal yükümlülükler gereği (mahkeme kararı, vb.)</li>
                  <li>Açık rızanız ile</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">5. Çerezler ve Takip</h3>
                <p className="text-muted-foreground">
                  Kullanıcı deneyimini iyileştirmek için çerezler kullanırız. Çerez tercihlerinizi
                  tarayıcınızdan yönetebilirsiniz.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">6. Kullanıcı Hakları (KVKK)</h3>
                <p className="text-muted-foreground mb-2">
                  6698 sayılı KVKK kapsamında haklarınız:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
                  <li>İşlenmişse bilgi talep etme</li>
                  <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</li>
                  <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme</li>
                  <li>Eksik veya yanlış işlenmiş olması halinde düzeltilmesini isteme</li>
                  <li>Silinmesini veya yok edilmesini isteme</li>
                  <li>Düzeltme, silme ve yok edilme işlemlerinin paylaşıldığı üçüncü kişilere bildirilmesini isteme</li>
                  <li>Otomatik sistemlerle analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme</li>
                  <li>Kanuna aykırı olarak işlenmesi sebebiyle zarara uğramanız halinde zararın giderilmesini talep etme</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">7. Veri Saklama Süresi</h3>
                <p className="text-muted-foreground">
                  Verileriniz, hizmet sağlamak için gerekli süre boyunca ve yasal yükümlülükler gereği
                  saklanır. Hesabınızı kapatmanız durumunda verileriniz 1 yıl içinde silinir.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">8. İletişim</h3>
                <p className="text-muted-foreground">
                  Gizlilik politikası ile ilgili sorularınız için:{" "}
                  <a href="mailto:info@kreditakip.com.tr" className="text-emerald-600 underline">
                    info@kreditakip.com.tr
                  </a>
                </p>
              </section>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPrivacyModal(false)}
            >
              Kapat
            </Button>
            <Button
              onClick={() => {
                setTermsAccepted(true)
                setShowPrivacyModal(false)
              }}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Okudum ve Kabul Ediyorum
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Ödeme Bilgileri</CardTitle>
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

          {/* Kart Bilgileri Formu */}
          <div className="space-y-4">
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
          </div>

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
                    Otomatik yenileme hatırlatması
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Aboneliğiniz bitmeden 3 gün önce otomatik olarak yenilenir.
                    İsterseniz ayarlardan kolayca iptal edebilirsiniz.
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
                  <button
                    type="button"
                    onClick={() => setShowTermsModal(true)}
                    className="underline hover:text-emerald-600 font-medium"
                  >
                    Kullanım Koşulları
                  </button>
                  {" ve "}
                  <button
                    type="button"
                    onClick={() => setShowPrivacyModal(true)}
                    className="underline hover:text-emerald-600 font-medium"
                  >
                    Gizlilik Politikası
                  </button>
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
    </>
  )
}
