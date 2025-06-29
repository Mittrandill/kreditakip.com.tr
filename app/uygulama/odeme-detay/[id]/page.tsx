"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import BankLogo from "@/components/bank-logo"
import {
  ArrowLeft,
  Download,
  CheckCircle,
  Calendar,
  CreditCard,
  Banknote,
  FileText,
  Clock,
  Loader2,
  AlertCircle,
  Trash2,
  Receipt,
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { getPaymentHistoryById, deletePaymentHistory } from "@/lib/api/payments"
import type { PaymentHistory, Bank, CreditType } from "@/lib/types"
import { formatCurrency } from "@/lib/format"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface PopulatedPaymentHistory extends PaymentHistory {
  credits: {
    id: string
    credit_code: string
    user_id: string
    banks: Pick<Bank, "name" | "logo_url"> | null
    credit_types: Pick<CreditType, "name"> | null
  }
}

export default function OdemeDetayPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()

  const paymentId = params.id as string

  const [odemeDetay, setOdemeDetay] = useState<PopulatedPaymentHistory | null>(null)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function fetchData() {
      if (user && paymentId && isMounted) {
        setLoadingData(true)
        setError(null)
        try {
          const paymentData = (await getPaymentHistoryById(paymentId)) as PopulatedPaymentHistory

          // Kullanıcının kendi ödemesi mi kontrol et
          if (paymentData.credits.user_id !== user.id) {
            setError("Bu ödeme detayına erişim yetkiniz yok.")
            return
          }

          if (isMounted) {
            setOdemeDetay(paymentData)
          }
        } catch (err) {
          console.error("Ödeme detay data fetch error:", err)
          if (isMounted) {
            setError("Ödeme detayları yüklenirken bir hata oluştu.")
          }
        } finally {
          if (isMounted) {
            setLoadingData(false)
          }
        }
      } else if (!authLoading && !user && isMounted) {
        setLoadingData(false)
        setError("Lütfen giriş yapınız.")
      }
    }
    fetchData()

    return () => {
      isMounted = false
    }
  }, [user, paymentId, authLoading])

  const handleDeletePayment = async () => {
    if (!odemeDetay) return

    setDeleteLoading(true)
    try {
      await deletePaymentHistory(odemeDetay.id)

      toast({
        title: "Ödeme Silindi",
        description: "Ödeme kaydı başarıyla silindi.",
      })

      // Kredi detay sayfasına geri dön
      router.push(`/uygulama/kredi-detay/${odemeDetay.credit_id}`)
    } catch (error) {
      console.error("Ödeme silme hatası:", error)
      toast({
        title: "Hata",
        description: "Ödeme silinirken bir sorun oluştu.",
        variant: "destructive",
      })
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleRaporAl = async () => {
    if (!odemeDetay) return

    try {
      const { jsPDF } = await import("jspdf")
      const doc = new jsPDF()

      // Premium header design
      doc.setFillColor(20, 184, 166) // Teal
      doc.rect(0, 0, 210, 40, "F")

      // Logo ve title
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(28)
      doc.text("KrediTakip", 20, 25)

      doc.setFontSize(16)
      doc.text("Odeme Detay Raporu", 20, 35)

      // Ödeme bilgileri section
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(16)
      doc.text("Odeme Bilgileri", 20, 60)

      // Çizgi
      doc.setDrawColor(20, 184, 166)
      doc.setLineWidth(1)
      doc.line(20, 65, 190, 65)

      doc.setFontSize(11)
      let yPos = 75
      const odemeInfo = [
        [`Referans No:`, odemeDetay.reference_number || "N/A"],
        [`Kredi Kodu:`, odemeDetay.credits.credit_code],
        [`Banka:`, odemeDetay.credits.banks?.name || "N/A"],
        [`Kredi Turu:`, odemeDetay.credits.credit_types?.name || "N/A"],
        [`Odeme Tutari:`, formatCurrency(odemeDetay.amount).replace("₺", "TL")],
        [`Odeme Tarihi:`, new Date(odemeDetay.payment_date).toLocaleDateString("tr-TR")],
        [`Odeme Saati:`, new Date(odemeDetay.payment_date).toLocaleTimeString("tr-TR")],
        [`Odeme Kanali:`, odemeDetay.payment_channel || "N/A"],
        [`Durum:`, "Basarili"],
      ]

      odemeInfo.forEach(([label, value]) => {
        doc.setFont(undefined, "bold")
        doc.text(label, 20, yPos)
        doc.setFont(undefined, "normal")
        doc.text(value || "N/A", 80, yPos)
        yPos += 8
      })

      // Notlar section
      if (odemeDetay.notes) {
        yPos += 10
        doc.setFontSize(14)
        doc.text("Notlar:", 20, yPos)
        doc.line(20, yPos + 5, 190, yPos + 5)
        yPos += 15

        doc.setFontSize(11)
        doc.text(odemeDetay.notes, 20, yPos)
      }

      // Footer
      doc.setFontSize(8)
      doc.setTextColor(128, 128, 128)
      doc.text("Bu rapor KrediTakip uygulamasi tarafindan olusturulmustur.", 20, 280)
      doc.text(
        `Rapor Tarihi: ${new Date().toLocaleDateString("tr-TR")} ${new Date().toLocaleTimeString("tr-TR")}`,
        20,
        290,
      )

      doc.save(`odeme-detay-${odemeDetay.reference_number}.pdf`)

      toast({
        title: "Rapor Hazır",
        description: "Ödeme detay raporu başarıyla indirildi.",
      })
    } catch (error) {
      console.error("PDF oluşturma hatası:", error)
      toast({
        title: "Hata",
        description: "Rapor oluşturulurken bir sorun oluştu.",
        variant: "destructive",
      })
    }
  }

  if (authLoading || loadingData) {
    return (
      <div className="flex flex-col gap-4 md:gap-6 items-center justify-center min-h-[calc(100vh-150px)]">
        <Loader2 className="h-12 w-12 animate-spin text-emerald-600" />
        <p className="text-lg text-gray-600">Ödeme detayları yükleniyor...</p>
      </div>
    )
  }

  if (error || !odemeDetay) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)]">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-lg text-red-600">{error || "Ödeme detayı bulunamadı."}</p>
        <Button onClick={() => router.back()} className="mt-4">
          Geri Dön
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => router.back()}
                className="bg-white/20 border-white/30 text-white hover:bg-white/30"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-4 rounded-full border-2 border-white">
                  <Receipt className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-2">Ödeme Detayı</h1>
                  <p className="text-emerald-100 text-lg">{odemeDetay.reference_number || "Referans Yok"}</p>
                  <p className="text-emerald-200 text-sm">
                    {odemeDetay.credits.credit_code} - {odemeDetay.credits.banks?.name || "N/A"}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline-white" size="sm" onClick={handleRaporAl} className="gap-2">
                <Download className="h-4 w-4" />
                Rapor Al
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline-white"
                    size="sm"
                    className="gap-2 border-red-300 text-red-100 hover:bg-red-500/20"
                  >
                    <Trash2 className="h-4 w-4" />
                    Sil
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Ödeme Kaydını Sil</AlertDialogTitle>
                    <AlertDialogDescription>
                      Bu ödeme kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>İptal</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeletePayment}
                      disabled={deleteLoading}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {deleteLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Sil
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {/* Ödeme Bilgileri Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div className="text-center">
              <p className="text-emerald-100 text-sm mb-1">Ödeme Tutarı</p>
              <p className="text-2xl md:text-3xl font-bold">{formatCurrency(odemeDetay.amount)}</p>
            </div>
            <div className="text-center">
              <p className="text-emerald-100 text-sm mb-1">Ödeme Tarihi</p>
              <p className="text-xl md:text-2xl font-bold">
                {new Date(odemeDetay.payment_date).toLocaleDateString("tr-TR")}
              </p>
            </div>
            <div className="text-center">
              <p className="text-emerald-100 text-sm mb-1">Ödeme Saati</p>
              <p className="text-xl md:text-2xl font-bold">
                {new Date(odemeDetay.payment_date).toLocaleTimeString("tr-TR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div className="text-center">
              <p className="text-emerald-100 text-sm mb-1">Durum</p>
              <Badge className="bg-gradient-to-r from-green-600 to-emerald-700 text-white border-transparent hover:from-green-700 hover:to-emerald-800 px-4 py-2 text-sm font-semibold shadow-lg">
                <CheckCircle className="mr-2 h-4 w-4" />
                Başarılı
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Detay Kartları */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Ödeme Bilgileri */}
        <Card className="shadow-sm border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Banknote className="h-5 w-5 text-emerald-600" />
              Ödeme Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <p className="text-sm text-gray-500">Referans Numarası</p>
                <p className="font-medium text-gray-900">{odemeDetay.reference_number || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Ödeme Tutarı</p>
                <p className="font-bold text-2xl text-emerald-600">{formatCurrency(odemeDetay.amount)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Ödeme Kanalı</p>
                <Badge className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white border-transparent hover:from-blue-700 hover:to-indigo-800 capitalize">
                  {odemeDetay.payment_channel?.replace("-", " ") || "N/A"}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500">Ödeme Tarihi</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="font-medium text-gray-900">
                    {new Date(odemeDetay.payment_date).toLocaleDateString("tr-TR", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Ödeme Saati</p>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="font-medium text-gray-900">
                    {new Date(odemeDetay.payment_date).toLocaleTimeString("tr-TR")}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Kredi Bilgileri */}
        <Card className="shadow-sm border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <CreditCard className="h-5 w-5 text-emerald-600" />
              İlgili Kredi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 mb-4">
              <BankLogo bankName={odemeDetay.credits.banks?.name || "Bilinmeyen Banka"} size="md" />
              <div>
                <p className="font-semibold text-gray-900">{odemeDetay.credits.banks?.name || "N/A"}</p>
                <p className="text-sm text-gray-500">{odemeDetay.credits.credit_types?.name || "N/A"}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Kredi Kodu</p>
                <p className="font-medium text-gray-900">{odemeDetay.credits.credit_code}</p>
              </div>
              <div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(`/uygulama/kredi-detay/${odemeDetay.credit_id}`)}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Kredi Detayına Git
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notlar */}
      {odemeDetay.notes && (
        <Card className="shadow-sm border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <FileText className="h-5 w-5 text-emerald-600" />
              Notlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">{odemeDetay.notes}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* İşlem Özeti */}
      <Card className="shadow-sm border-gray-200 bg-gradient-to-r from-emerald-50 to-teal-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-800">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
            İşlem Özeti
          </CardTitle>
          <CardDescription className="text-emerald-700">
            Bu ödeme başarıyla gerçekleştirilmiş ve kaydedilmiştir.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white rounded-lg border border-emerald-200">
              <div className="text-2xl font-bold text-emerald-600">{formatCurrency(odemeDetay.amount)}</div>
              <div className="text-sm text-emerald-700">Ödenen Tutar</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border border-emerald-200">
              <div className="text-2xl font-bold text-emerald-600">
                {new Date(odemeDetay.payment_date).toLocaleDateString("tr-TR")}
              </div>
              <div className="text-sm text-emerald-700">İşlem Tarihi</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border border-emerald-200">
              <div className="text-2xl font-bold text-emerald-600">Başarılı</div>
              <div className="text-sm text-emerald-700">İşlem Durumu</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
