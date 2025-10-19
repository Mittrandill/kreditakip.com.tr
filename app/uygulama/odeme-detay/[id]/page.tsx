"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Download, Printer, CheckCircle, CreditCard, Hash, FileText, Building2, Receipt } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { getPaymentHistoryById } from "@/lib/api/payments"
import { formatCurrency } from "@/lib/utils"
import type { PaymentHistory, Credit, Bank, CreditType } from "@/lib/types"

interface PaymentDetailData extends PaymentHistory {
  credits: Credit & {
    banks: Bank
    credit_types: CreditType
  }
}

export default function PaymentDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [payment, setPayment] = useState<PaymentDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPaymentDetail() {
      try {
        setLoading(true)
        const data = await getPaymentHistoryById(params.id)
        setPayment(data)
      } catch (err) {
        console.error("Error fetching payment detail:", err)
        setError("Ödeme detayları yüklenirken bir hata oluştu.")
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchPaymentDetail()
    }
  }, [params.id])

  const handlePrint = () => {
    // Header, sidebar ve diğer elementleri gizle
    const elementsToHide = [
      ...document.querySelectorAll('header'),
      ...document.querySelectorAll('nav'),
      ...document.querySelectorAll('[data-sidebar]'),
      ...document.querySelectorAll('.app-sidebar'),
      ...document.querySelectorAll('[role="banner"]'),
      ...document.querySelectorAll('.print\\:hidden'),
      document.querySelector('.floating-action-menu'),
      document.querySelector('.floating-upgrade-banner'),
    ].filter(Boolean) as HTMLElement[]

    // Orijinal display değerlerini sakla
    const originalDisplayValues = elementsToHide.map(el => el.style.display)

    // Elementleri gizle
    elementsToHide.forEach(el => {
      el.style.display = 'none'
    })

    // Gradient background için stil ekle
    const style = document.createElement('style')
    style.id = 'print-styles'
    style.textContent = `
      @media print {
        @page {
          margin: 1cm;
        }
        body {
          margin: 0;
          padding: 0;
        }
        .bg-gradient-to-r {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    `
    document.head.appendChild(style)

    // Yazdır
    setTimeout(() => {
      window.print()

      // Yazdırma bitince elementleri geri getir
      setTimeout(() => {
        elementsToHide.forEach((el, index) => {
          el.style.display = originalDisplayValues[index]
        })
        // Eklenen stili kaldır
        document.getElementById('print-styles')?.remove()
      }, 100)
    }, 100)
  }

  const handleDownload = () => {
    // TODO: Implement PDF download functionality
    console.log("Download payment receipt")
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4 md:gap-6 items-center justify-center min-h-[calc(100vh-150px)]">
        <div className="animate-pulse space-y-6 w-full max-w-4xl">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  if (error || !payment) {
    return (
      <div className="flex flex-col gap-4 md:gap-6">
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="p-6 text-center">
            <div className="text-red-600 dark:text-red-400 mb-4">
              <FileText className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Ödeme Detayı Bulunamadı</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {error || "Aradığınız ödeme detayı bulunamadı veya erişim izniniz bulunmuyor."}
            </p>
            <Button onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Geri Dön
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6 print:bg-white print:p-0">
      {/* Hero Section */}
      <Card className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-transparent shadow-xl rounded-xl print:hidden">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => router.back()}
                  className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-transparent hover:text-white dark:bg-transparent dark:border-white/20 dark:text-white dark:hover:bg-white/10 dark:hover:border-transparent dark:hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Receipt className="h-8 w-8" />
                Ödeme Detayı
              </h2>
              <p className="text-emerald-100 text-lg ml-14">
                Seçilen ödemenin detaylı bilgilerini görebilir ve yazdırabilirsiniz.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                size="lg"
                onClick={handlePrint}
                className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-transparent hover:text-white dark:bg-transparent dark:border-white/20 dark:text-white dark:hover:bg-white/10 dark:hover:border-transparent dark:hover:text-white"
              >
                <Printer className="h-5 w-5 mr-2" />
                Yazdır
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={handleDownload}
                className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-transparent hover:text-white dark:bg-transparent dark:border-white/20 dark:text-white dark:hover:bg-white/10 dark:hover:border-transparent dark:hover:text-white"
              >
                <Download className="h-5 w-5 mr-2" />
                İndir
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Receipt Card */}
      <Card className="border-0 shadow-lg print:shadow-none print:border">
        <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white print:bg-gradient-to-r print:from-emerald-600 print:to-teal-700 print:text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg print:bg-white/20">
                <Receipt className="h-6 w-6 print:text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">Ödeme Makbuzu</CardTitle>
                <p className="text-emerald-100 print:text-emerald-100">kreditakip.com.tr</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{formatCurrency(payment.amount)}</div>
              <Badge
                variant="secondary"
                className="bg-white/20 text-white border-white/30 print:bg-white/20 print:text-white print:border-white/30"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Başarılı
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Payment Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-emerald-600" />
                Ödeme Bilgileri
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Ödeme Tarihi:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {new Date(payment.payment_date).toLocaleDateString("tr-TR", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Ödeme Saati:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {new Date(payment.created_at).toLocaleTimeString("tr-TR", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Ödeme Kanalı:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {payment.payment_channel || "Belirtilmemiş"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Referans No:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100 font-mono">
                    {payment.reference_number || "N/A"}
                  </span>
                </div>
                {payment.transaction_id && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">İşlem ID:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100 font-mono text-sm">
                      {payment.transaction_id}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                Kredi Bilgileri
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Banka:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{payment.credits.banks.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Kredi Türü:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {payment.credits.credit_types.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Kredi Kodu:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100 font-mono">
                    {payment.credits.credit_code}
                  </span>
                </div>
                {payment.credits.account_number && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Hesap No:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100 font-mono">
                      {payment.credits.account_number}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Payment Amount Breakdown */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Hash className="h-5 w-5 text-purple-600" />
              Ödeme Detayı
            </h3>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-900 dark:text-gray-100">Ödenen Tutar:</span>
                <span className="text-2xl font-bold text-emerald-600">{formatCurrency(payment.amount)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {payment.notes && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-orange-600" />
                  Notlar
                </h3>
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                  <p className="text-gray-700 dark:text-gray-300">{payment.notes}</p>
                </div>
              </div>
            </>
          )}

          {/* Footer */}
          <Separator />
          <div className="text-center text-sm text-gray-500 dark:text-gray-400 space-y-1">
            <p>Bu makbuz kreditakip.com.tr sistemi tarafından otomatik olarak oluşturulmuştur.</p>
            <p>
              Makbuz Tarihi: {new Date().toLocaleDateString("tr-TR")} {new Date().toLocaleTimeString("tr-TR")}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Additional Actions */}
      <div className="flex justify-center gap-4 print:hidden">
        <Button onClick={() => router.push(`/uygulama/kredi-detay/${payment.credit_id}`)} className="gap-2">
          <CreditCard className="h-4 w-4" />
          Kredi Detayına Git
        </Button>
        <Button onClick={() => router.push("/uygulama/krediler")} className="gap-2">
          <Building2 className="h-4 w-4" />
          Tüm Krediler
        </Button>
      </div>
    </div>
  )
}
