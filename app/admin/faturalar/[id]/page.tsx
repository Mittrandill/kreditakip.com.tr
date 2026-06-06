"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Upload, FileText, Download } from "lucide-react"
import Link from "next/link"
import { AdminClientLayoutWrapper } from "@/components/admin-client-layout-wrapper"

interface Invoice {
  id: string
  user_id: string
  invoice_number: string
  invoice_date: string
  due_date: string
  amount: number
  currency: string
  status: string
  description: string
  file_url: string | null
  file_name: string | null
  payment_id: string | null
  subscription_id: string | null
  notes: string | null
  profiles?: {
    first_name: string
    last_name: string
    email: string
  }
}

export default function InvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const invoiceId = params.id as string

  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [notes, setNotes] = useState("")
  const [status, setStatus] = useState("pending")

  useEffect(() => {
    fetchInvoice()
  }, [invoiceId])

  const fetchInvoice = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/invoices/${invoiceId}`)
      if (!response.ok) throw new Error("Failed to fetch invoice")

      const data = await response.json()
      setInvoice(data.invoice)
      setNotes(data.invoice.notes || "")
      setStatus(data.invoice.status)
    } catch (error) {
      console.error("Error fetching invoice:", error)
      alert("Fatura yüklenirken bir hata oluştu")
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type !== "application/pdf") {
        alert("Sadece PDF dosyaları yükleyebilirsiniz")
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        alert("Dosya boyutu 10MB'dan küçük olmalıdır")
        return
      }
      setPdfFile(file)
    }
  }

  const handleUpload = async () => {
    if (!pdfFile) {
      alert("Lütfen bir PDF dosyası seçin")
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", pdfFile)
      formData.append("invoiceId", invoiceId)

      const response = await fetch("/api/admin/invoices/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Upload failed")
      }

      alert("PDF başarıyla yüklendi!")
      setPdfFile(null)
      fetchInvoice() // Refresh invoice data
    } catch (error: any) {
      console.error("Error uploading PDF:", error)
      alert(error.message || "PDF yüklenirken bir hata oluştu")
    } finally {
      setUploading(false)
    }
  }

  const handleUpdateInvoice = async () => {
    try {
      const response = await fetch(`/api/admin/invoices/${invoiceId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          notes,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update invoice")
      }

      alert("Fatura güncellendi!")
      fetchInvoice()
    } catch (error) {
      console.error("Error updating invoice:", error)
      alert("Fatura güncellenirken bir hata oluştu")
    }
  }

  if (loading) {
    return (
      <AdminClientLayoutWrapper>
        <div className="text-center py-12">
          <p className="text-white/60">Yükleniyor...</p>
        </div>
      </AdminClientLayoutWrapper>
    )
  }

  if (!invoice) {
    return (
      <AdminClientLayoutWrapper>
        <div className="text-center py-12">
          <p className="text-white/60">Fatura bulunamadı</p>
          <Link href="/admin/faturalar">
            <Button className="mt-4">Faturalara Dön</Button>
          </Link>
        </div>
      </AdminClientLayoutWrapper>
    )
  }

  return (
    <AdminClientLayoutWrapper>
      <div className="space-y-8">
        <div>
          <Link href="/admin/faturalar">
            <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 mb-2">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Faturalara Dön
            </Button>
          </Link>
          <h1 className="text-4xl font-bold mb-2">Fatura Detayı</h1>
          <p className="text-white/60">Fatura bilgilerini görüntüle ve PDF yükle</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Invoice Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span>Fatura Bilgileri</span>
                  {invoice.status === "preparing" ? (
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/20">
                      Fatura Hazırlanıyor - PDF Yükle
                    </Badge>
                  ) : invoice.status === "ready" ? (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/20">
                      Hazır
                    </Badge>
                  ) : (
                    <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/20">
                      {invoice.status}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white/60">Fatura No</Label>
                    <p className="text-white font-mono">{invoice.invoice_number}</p>
                  </div>
                  <div>
                    <Label className="text-white/60">Tutar</Label>
                    <p className="text-white font-semibold text-lg">
                      {Number(invoice.amount).toFixed(2)} {invoice.currency}
                    </p>
                  </div>
                  <div>
                    <Label className="text-white/60">Fatura Tarihi</Label>
                    <p className="text-white">
                      {new Date(invoice.invoice_date).toLocaleDateString("tr-TR")}
                    </p>
                  </div>
                  <div>
                    <Label className="text-white/60">Vade Tarihi</Label>
                    <p className="text-white">
                      {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString("tr-TR") : "-"}
                    </p>
                  </div>
                </div>

                <div>
                  <Label className="text-white/60">Açıklama</Label>
                  <p className="text-white">{invoice.description || "-"}</p>
                </div>

                {invoice.payment_id && (
                  <div>
                    <Label className="text-white/60">Ödeme ID</Label>
                    <p className="text-white font-mono text-sm">{invoice.payment_id}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Customer Info */}
            <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white">Müşteri Bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <Label className="text-white/60">Ad Soyad</Label>
                  <p className="text-white">
                    {[invoice.profiles?.first_name, invoice.profiles?.last_name].filter(Boolean).join(" ") || "-"}
                  </p>
                </div>
                <div>
                  <Label className="text-white/60">E-posta</Label>
                  <p className="text-white">{invoice.profiles?.email || "-"}</p>
                </div>
                <Link href={`/admin/kullanicilar/${invoice.user_id}`}>
                  <Button variant="outline" className="mt-4 bg-transparent border-white/20 text-white hover:bg-white/10">
                    Kullanıcı Detayına Git
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* PDF Upload & Actions */}
          <div className="space-y-6">
            {/* PDF Upload */}
            <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white">PDF Fatura</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {invoice.file_url ? (
                  <div>
                    <div className="flex items-center gap-2 text-emerald-400 mb-4">
                      <FileText className="h-5 w-5" />
                      <span className="text-sm">{invoice.file_name || "Fatura.pdf"}</span>
                    </div>
                    <a
                      href={`/api/invoices/${invoice.id}/download`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <Button className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                        <Download className="mr-2 h-4 w-4" />
                        PDF İndir
                      </Button>
                    </a>
                    <p className="text-xs text-white/50 mt-2">Yeni PDF yüklerseniz eski dosya değiştirilecek</p>
                  </div>
                ) : (
                  <p className="text-white/60 text-sm">Henüz PDF yüklenmedi</p>
                )}

                <div>
                  <Label htmlFor="pdf-file" className="text-white">Yeni PDF Yükle</Label>
                  <Input
                    id="pdf-file"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="bg-black/20 border-white/10 text-white"
                  />
                  {pdfFile && (
                    <p className="text-xs text-white/60 mt-1">{pdfFile.name}</p>
                  )}
                </div>

                <Button
                  onClick={handleUpload}
                  disabled={!pdfFile || uploading}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {uploading ? "Yükleniyor..." : "PDF Yükle"}
                </Button>
              </CardContent>
            </Card>

            {/* Update Status & Notes */}
            <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white">Fatura Durumu</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="status" className="text-white">Durum</Label>
                  <select
                    id="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-md text-white"
                  >
                    <option value="pending">Bekliyor</option>
                    <option value="paid">Ödendi</option>
                    <option value="overdue">Gecikmiş</option>
                    <option value="cancelled">İptal</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="notes" className="text-white">Notlar</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="bg-black/20 border-white/10 text-white"
                    placeholder="İç notlar ekleyin..."
                    rows={4}
                  />
                </div>

                <Button
                  onClick={handleUpdateInvoice}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600"
                >
                  Güncelle
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminClientLayoutWrapper>
  )
}
