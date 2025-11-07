"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, User, Mail, Phone, MapPin, Save, Building2, CreditCard } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface BillingInfo {
  user_id: string
  full_name: string
  email: string
  phone: string
  address: string
  city: string
  district: string | null
  postal_code: string | null
  country: string
  tax_number: string | null
  tax_office: string | null
  identity_number: string | null
}

export function UserInvoices() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null)
  const [savingBilling, setSavingBilling] = useState(false)
  const [billingForm, setBillingForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    district: "",
    postalCode: "",
    country: "Turkey",
    taxNumber: "",
    taxOffice: "",
    identityNumber: "",
  })

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await fetchBillingInfo()
      setLoading(false)
    }
    loadData()
  }, [])

  const fetchBillingInfo = async () => {
    try {
      const response = await fetch("/api/user/billing-info")

      if (!response.ok) {
        throw new Error("Fatura bilgileri yüklenirken hata oluştu")
      }

      const data = await response.json()
      if (data.billingInfo) {
        setBillingInfo(data.billingInfo)
        setBillingForm({
          fullName: data.billingInfo.full_name || "",
          email: data.billingInfo.email || "",
          phone: data.billingInfo.phone || "",
          address: data.billingInfo.address || "",
          city: data.billingInfo.city || "",
          district: data.billingInfo.district || "",
          postalCode: data.billingInfo.postal_code || "",
          country: data.billingInfo.country || "Turkey",
          taxNumber: data.billingInfo.tax_number || "",
          taxOffice: data.billingInfo.tax_office || "",
          identityNumber: data.billingInfo.identity_number || "",
        })
      }
    } catch (err) {
      console.error("Error fetching billing info:", err)
    }
  }

  const saveBillingInfo = async () => {
    try {
      setSavingBilling(true)
      const response = await fetch("/api/user/billing-info", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(billingForm),
      })

      if (!response.ok) {
        throw new Error("Fatura bilgileri kaydedilirken hata oluştu")
      }

      const data = await response.json()
      setBillingInfo(data.billingInfo)

      toast({
        title: "Başarılı!",
        description: "Fatura bilgileriniz güncellendi.",
      })
    } catch (err) {
      console.error("Error saving billing info:", err)
      toast({
        title: "Hata",
        description: err instanceof Error ? err.message : "Bir hata oluştu",
        variant: "destructive",
      })
    } finally {
      setSavingBilling(false)
    }
  }

  const handleBillingFormChange = (field: string, value: string) => {
    setBillingForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-emerald-600 dark:text-emerald-400" />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="dark:bg-black/20 dark:border-white/10">
        <CardContent className="py-12">
          <div className="text-center text-red-600 dark:text-red-400">{error}</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Billing Information Form */}
      <Card className="dark:bg-black/20 dark:border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-white">
            <User className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            Fatura Bilgileri
          </CardTitle>
          <CardDescription className="dark:text-white/60">
            Faturalarınızda görünecek bilgilerinizi güncelleyin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="dark:text-white">
                    Ad Soyad *
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-white/40" />
                    <Input
                      id="fullName"
                      value={billingForm.fullName}
                      onChange={(e) => handleBillingFormChange("fullName", e.target.value)}
                      className="pl-10 dark:bg-black/10 dark:border-white/10 dark:text-white"
                      placeholder="Adınız ve soyadınız"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="dark:text-white">
                    E-posta *
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-white/40" />
                    <Input
                      id="email"
                      type="email"
                      value={billingForm.email}
                      onChange={(e) => handleBillingFormChange("email", e.target.value)}
                      className="pl-10 dark:bg-black/10 dark:border-white/10 dark:text-white"
                      placeholder="ornek@email.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="dark:text-white">
                    Telefon *
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-white/40" />
                    <Input
                      id="phone"
                      value={billingForm.phone}
                      onChange={(e) => handleBillingFormChange("phone", e.target.value)}
                      className="pl-10 dark:bg-black/10 dark:border-white/10 dark:text-white"
                      placeholder="+90 5XX XXX XX XX"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city" className="dark:text-white">
                    Şehir *
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-white/40" />
                    <Input
                      id="city"
                      value={billingForm.city}
                      onChange={(e) => handleBillingFormChange("city", e.target.value)}
                      className="pl-10 dark:bg-black/10 dark:border-white/10 dark:text-white"
                      placeholder="İstanbul"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="district" className="dark:text-white">
                    İlçe
                  </Label>
                  <Input
                    id="district"
                    value={billingForm.district}
                    onChange={(e) => handleBillingFormChange("district", e.target.value)}
                    className="dark:bg-black/10 dark:border-white/10 dark:text-white"
                    placeholder="Kadıköy"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postalCode" className="dark:text-white">
                    Posta Kodu
                  </Label>
                  <Input
                    id="postalCode"
                    value={billingForm.postalCode}
                    onChange={(e) => handleBillingFormChange("postalCode", e.target.value)}
                    className="dark:bg-black/10 dark:border-white/10 dark:text-white"
                    placeholder="34000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="dark:text-white">
                  Adres *
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-white/40" />
                  <Textarea
                    id="address"
                    value={billingForm.address}
                    onChange={(e) => handleBillingFormChange("address", e.target.value)}
                    className="pl-10 dark:bg-black/10 dark:border-white/10 dark:text-white min-h-[80px]"
                    placeholder="Tam adresinizi girin"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="identityNumber" className="dark:text-white">
                    T.C. Kimlik No
                  </Label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-white/40" />
                    <Input
                      id="identityNumber"
                      value={billingForm.identityNumber}
                      onChange={(e) => handleBillingFormChange("identityNumber", e.target.value)}
                      className="pl-10 dark:bg-black/10 dark:border-white/10 dark:text-white"
                      placeholder="XXXXXXXXXXX"
                      maxLength={11}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taxNumber" className="dark:text-white">
                    Vergi No (Kurumsal)
                  </Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-white/40" />
                    <Input
                      id="taxNumber"
                      value={billingForm.taxNumber}
                      onChange={(e) => handleBillingFormChange("taxNumber", e.target.value)}
                      className="pl-10 dark:bg-black/10 dark:border-white/10 dark:text-white"
                      placeholder="XXXXXXXXXX"
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="taxOffice" className="dark:text-white">
                    Vergi Dairesi (Kurumsal)
                  </Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-white/40" />
                    <Input
                      id="taxOffice"
                      value={billingForm.taxOffice}
                      onChange={(e) => handleBillingFormChange("taxOffice", e.target.value)}
                      className="pl-10 dark:bg-black/10 dark:border-white/10 dark:text-white"
                      placeholder="Kadıköy Vergi Dairesi"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={saveBillingInfo}
                  disabled={savingBilling}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 dark:from-emerald-500 dark:to-teal-600 dark:hover:from-emerald-600 dark:hover:to-teal-700 text-white"
                >
                  {savingBilling ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Kaydediliyor...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Kaydet
                    </>
                  )}
                </Button>
              </div>
            </div>
        </CardContent>
      </Card>
    </div>
  )
}
