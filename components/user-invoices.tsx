"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FileText, Download, Loader2, Calendar, DollarSign, User, Mail, Phone, MapPin, Save, Building2, CreditCard } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Invoice {
  id: string
  invoice_number: string
  invoice_date: string
  due_date: string | null
  amount: number
  currency: string
  status: string
  description: string | null
  file_url: string | null
  file_name: string | null
  payment_date: string | null
}

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
  const [invoices, setInvoices] = useState<Invoice[]>([])
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
      await Promise.all([fetchInvoices(), fetchBillingInfo()])
      setLoading(false)
    }
    loadData()
  }, [])

  const fetchInvoices = async () => {
    try {
      const response = await fetch("/api/user/invoices")

      if (!response.ok) {
        throw new Error("Faturalar yüklenirken hata oluştu")
      }

      const data = await response.json()
      setInvoices(data.invoices || [])
    } catch (err) {
      console.error("Error fetching invoices:", err)
      setError(err instanceof Error ? err.message : "Bir hata oluştu")
    }
  }

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/20">
            Ödendi
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/20">
            Bekliyor
          </Badge>
        )
      case "overdue":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/20">
            Gecikmiş
          </Badge>
        )
      case "cancelled":
        return (
          <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/20">
            İptal
          </Badge>
        )
      default:
        return (
          <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/20">
            {status}
          </Badge>
        )
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatAmount = (amount: number, currency: string) => {
    return `${amount.toFixed(2)} ${currency}`
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
      <Card className="dark:bg-gray-900 dark:border-gray-800">
        <CardContent className="py-12">
          <div className="text-center text-red-600 dark:text-red-400">{error}</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Billing Information Form */}
      <Card className="dark:bg-gray-900 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-white">
            <User className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            Fatura Bilgileri
          </CardTitle>
          <CardDescription className="dark:text-gray-400">
            Faturalarınızda görünecek bilgilerinizi güncelleyin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="dark:text-gray-200">
                    Ad Soyad *
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <Input
                      id="fullName"
                      value={billingForm.fullName}
                      onChange={(e) => handleBillingFormChange("fullName", e.target.value)}
                      className="pl-10 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                      placeholder="Adınız ve soyadınız"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="dark:text-gray-200">
                    E-posta *
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <Input
                      id="email"
                      type="email"
                      value={billingForm.email}
                      onChange={(e) => handleBillingFormChange("email", e.target.value)}
                      className="pl-10 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                      placeholder="ornek@email.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="dark:text-gray-200">
                    Telefon *
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <Input
                      id="phone"
                      value={billingForm.phone}
                      onChange={(e) => handleBillingFormChange("phone", e.target.value)}
                      className="pl-10 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                      placeholder="+90 5XX XXX XX XX"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city" className="dark:text-gray-200">
                    Şehir *
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <Input
                      id="city"
                      value={billingForm.city}
                      onChange={(e) => handleBillingFormChange("city", e.target.value)}
                      className="pl-10 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                      placeholder="İstanbul"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="district" className="dark:text-gray-200">
                    İlçe
                  </Label>
                  <Input
                    id="district"
                    value={billingForm.district}
                    onChange={(e) => handleBillingFormChange("district", e.target.value)}
                    className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    placeholder="Kadıköy"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postalCode" className="dark:text-gray-200">
                    Posta Kodu
                  </Label>
                  <Input
                    id="postalCode"
                    value={billingForm.postalCode}
                    onChange={(e) => handleBillingFormChange("postalCode", e.target.value)}
                    className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    placeholder="34000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="dark:text-gray-200">
                  Adres *
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <Textarea
                    id="address"
                    value={billingForm.address}
                    onChange={(e) => handleBillingFormChange("address", e.target.value)}
                    className="pl-10 dark:bg-gray-800 dark:border-gray-700 dark:text-white min-h-[80px]"
                    placeholder="Tam adresinizi girin"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="identityNumber" className="dark:text-gray-200">
                    T.C. Kimlik No
                  </Label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <Input
                      id="identityNumber"
                      value={billingForm.identityNumber}
                      onChange={(e) => handleBillingFormChange("identityNumber", e.target.value)}
                      className="pl-10 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                      placeholder="XXXXXXXXXXX"
                      maxLength={11}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taxNumber" className="dark:text-gray-200">
                    Vergi No (Kurumsal)
                  </Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <Input
                      id="taxNumber"
                      value={billingForm.taxNumber}
                      onChange={(e) => handleBillingFormChange("taxNumber", e.target.value)}
                      className="pl-10 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                      placeholder="XXXXXXXXXX"
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="taxOffice" className="dark:text-gray-200">
                    Vergi Dairesi (Kurumsal)
                  </Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <Input
                      id="taxOffice"
                      value={billingForm.taxOffice}
                      onChange={(e) => handleBillingFormChange("taxOffice", e.target.value)}
                      className="pl-10 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
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

      {/* Invoices List */}
      <Card className="dark:bg-gray-900 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-white">
            <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            Faturalarım
          </CardTitle>
          <CardDescription className="dark:text-gray-400">
            Abonelik ve ödemelerinize ait faturalar
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">Henüz faturanız bulunmuyor</p>
              <p className="text-gray-500 dark:text-gray-500 text-sm">
                Abonelik ve ödemelerinize ait faturalar burada görüntülenecektir
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <Card
                  key={invoice.id}
                  className="bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      {/* Invoice Info */}
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-emerald-500/20 dark:bg-emerald-500/30 rounded-lg flex items-center justify-center">
                            <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div>
                            <h3 className="text-gray-900 dark:text-white font-semibold">{invoice.invoice_number}</h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                              {invoice.description || "Abonelik Faturası"}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Calendar className="h-4 w-4" />
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-500">Fatura Tarihi</p>
                              <p className="text-sm text-gray-900 dark:text-white">{formatDate(invoice.invoice_date)}</p>
                            </div>
                          </div>

                          {invoice.due_date && (
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                              <Calendar className="h-4 w-4" />
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-500">Vade Tarihi</p>
                                <p className="text-sm text-gray-900 dark:text-white">{formatDate(invoice.due_date)}</p>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <DollarSign className="h-4 w-4" />
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-500">Tutar</p>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                {formatAmount(invoice.amount, invoice.currency)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Status and Actions */}
                      <div className="flex flex-col items-start md:items-end gap-3">
                        {getStatusBadge(invoice.status)}

                        {invoice.file_url && (
                          <Button
                            asChild
                            size="sm"
                            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                          >
                            <a href={invoice.file_url} target="_blank" rel="noopener noreferrer">
                              <Download className="mr-2 h-4 w-4" />
                              Faturayı İndir
                            </a>
                          </Button>
                        )}

                        {invoice.payment_date && (
                          <div className="text-right">
                            <p className="text-xs text-gray-500 dark:text-gray-500">Ödeme Tarihi</p>
                            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                              {formatDate(invoice.payment_date)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Summary */}
      {invoices.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="dark:bg-gray-900 dark:border-gray-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Toplam Fatura</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{invoices.length}</p>
                </div>
                <FileText className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-900 dark:border-gray-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Ödenen</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {invoices.filter((inv) => inv.status === "paid").length}
                  </p>
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-lg px-3 py-1">
                  ✓
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-900 dark:border-gray-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Toplam Tutar</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {invoices
                      .filter((inv) => inv.status === "paid")
                      .reduce((sum, inv) => sum + inv.amount, 0)
                      .toFixed(2)}{" "}
                    TRY
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-teal-600 dark:text-teal-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
