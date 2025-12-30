"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Upload, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface InvoiceUploadButtonProps {
  invoiceId: string
  onSuccess?: () => void
}

export function InvoiceUploadButton({
  invoiceId,
  onSuccess,
}: InvoiceUploadButtonProps) {
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate PDF
    if (file.type !== "application/pdf") {
      toast.error("Lütfen sadece PDF dosyası yükleyin")
      return
    }

    setLoading(true)

    try {
      // Upload PDF
      const formData = new FormData()
      formData.append("file", file)
      formData.append("invoiceId", invoiceId)

      const uploadResponse = await fetch("/api/admin/invoices/upload", {
        method: "POST",
        body: formData,
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json()
        throw new Error(errorData.error || "PDF yüklenirken hata oluştu")
      }

      toast.success("Fatura başarıyla yüklendi!")

      // Force reload with cache bypass after a short delay
      setTimeout(() => {
        window.location.href = `/admin/faturalar?t=${Date.now()}`
      }, 500)

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Bir hata oluştu")
    } finally {
      setLoading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFileSelect}
        className="hidden"
      />
      <Button
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
        className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
        size="sm"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
            Yükleniyor...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-3 w-3" />
            Fatura Ekle
          </>
        )}
      </Button>
    </>
  )
}
