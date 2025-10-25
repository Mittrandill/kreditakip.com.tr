"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Upload, Loader2 } from "lucide-react"
import Link from "next/link"
import { AdminClientLayoutWrapper } from "@/components/admin-client-layout-wrapper"

interface User {
  id: string
  first_name: string
  last_name: string
  email: string
}

export default function NewInvoice() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedUserId = searchParams.get("userId")

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  const [formData, setFormData] = useState({
    userId: preselectedUserId || "",
    invoiceNumber: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    amount: "",
    currency: "TRY",
    status: "pending",
    description: "",
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (selectedFile.type === "application/pdf") {
        setFile(selectedFile)
      } else {
        alert("Lütfen sadece PDF dosyası yükleyin")
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.userId || !formData.invoiceNumber || !formData.amount) {
      alert("Lütfen zorunlu alanları doldurun")
      return
    }

    setLoading(true)

    try {
      let fileUrl = ""

      // Upload file if exists
      if (file) {
        setUploading(true)
        const formDataFile = new FormData()
        formDataFile.append("file", file)
        formDataFile.append("userId", formData.userId)

        const uploadResponse = await fetch("/api/admin/invoices/upload", {
          method: "POST",
          body: formDataFile,
        })

        if (!uploadResponse.ok) {
          throw new Error("Dosya yüklenirken hata oluştu")
        }

        const uploadData = await uploadResponse.json()
        fileUrl = uploadData.url
        setUploading(false)
      }

      // Create invoice
      const response = await fetch("/api/admin/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          fileUrl,
          fileName: file?.name,
        }),
      })

      if (!response.ok) {
        throw new Error("Fatura oluşturulurken hata oluştu")
      }

      alert("Fatura başarıyla oluşturuldu!")
      router.push("/admin/faturalar")
    } catch (error) {
      console.error("Error creating invoice:", error)
      alert(error instanceof Error ? error.message : "Bir hata oluştu")
    } finally {
      setLoading(false)
      setUploading(false)
    }
  }

  return (
    <AdminClientLayoutWrapper>
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/faturalar">
          <Button variant="outline" size="icon" className="bg-black/20 border-white/10">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-4xl font-bold mb-2">Yeni Fatura Oluştur</h1>
          <p className="text-white/60">Kullanıcı için fatura oluşturun ve yükleyin</p>
        </div>
      </div>

      <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white">Fatura Bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="userId" className="text-white">
                  Kullanıcı *
                </Label>
                <select
                  id="userId"
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  <option value="">Kullanıcı seçin</option>
                  {users.map((user) => {
                    const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email
                    return (
                      <option key={user.id} value={user.id}>
                        {fullName} ({user.email})
                      </option>
                    )
                  })}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoiceNumber" className="text-white">
                  Fatura No *
                </Label>
                <Input
                  id="invoiceNumber"
                  type="text"
                  value={formData.invoiceNumber}
                  onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                  placeholder="ör: INV-2025-001"
                  className="bg-black/20 border-white/10 text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoiceDate" className="text-white">
                  Fatura Tarihi *
                </Label>
                <Input
                  id="invoiceDate"
                  type="date"
                  value={formData.invoiceDate}
                  onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                  className="bg-black/20 border-white/10 text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate" className="text-white">
                  Vade Tarihi
                </Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="bg-black/20 border-white/10 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount" className="text-white">
                  Tutar *
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  className="bg-black/20 border-white/10 text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency" className="text-white">
                  Para Birimi
                </Label>
                <select
                  id="currency"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="TRY">TRY</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="text-white">
                  Durum
                </Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="pending">Bekliyor</option>
                  <option value="paid">Ödendi</option>
                  <option value="overdue">Gecikmiş</option>
                  <option value="cancelled">İptal</option>
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description" className="text-white">
                  Açıklama
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Fatura hakkında not ekleyin..."
                  className="bg-black/20 border-white/10 text-white min-h-[100px]"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="file" className="text-white">
                  Fatura Dosyası (PDF)
                </Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="file"
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="bg-black/20 border-white/10 text-white"
                  />
                  {file && (
                    <span className="text-emerald-400 text-sm flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      {file.name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-4 pt-4 border-t border-white/10">
              <Link href="/admin/faturalar">
                <Button type="button" variant="outline" className="bg-black/20 border-white/10">
                  İptal
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={loading || uploading}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {uploading ? "Dosya Yükleniyor..." : "Fatura Oluşturuluyor..."}
                  </>
                ) : (
                  "Fatura Oluştur"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      </div>
    </AdminClientLayoutWrapper>
  )
}
