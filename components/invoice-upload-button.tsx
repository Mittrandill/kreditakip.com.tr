"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Upload, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface InvoiceUploadButtonProps {
  userId: string
  subscriptionId: string
  amount: number
  currency: string
  userEmail: string
  onSuccess?: () => void
}

export function InvoiceUploadButton({
  userId,
  subscriptionId,
  amount,
  currency,
  userEmail,
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
      console.log("[invoice-upload] Finding existing pending invoice:", {
        userId,
        subscriptionId,
      })

      // 1. Find existing pending invoice for this subscription
      const findResponse = await fetch(`/api/admin/invoices?subscriptionId=${subscriptionId}`)

      if (!findResponse.ok) {
        throw new Error("Fatura kaydı bulunamadı")
      }

      const { invoices } = await findResponse.json()

      // Find pending invoice without PDF
      let pendingInvoice = invoices?.find((inv: any) =>
        inv.subscription_id === subscriptionId && !inv.file_url
      )

      // If no pending invoice found in first query, try searching by invoice_number
      if (!pendingInvoice) {
        console.log("[invoice-upload] No pending invoice found in initial search")

        // Try to find by invoice_number (from filename)
        const invoiceNumber = file.name.replace(/\.pdf$/i, "")
        const searchByNumberResponse = await fetch(`/api/admin/invoices?invoiceNumber=${invoiceNumber}`)

        if (searchByNumberResponse.ok) {
          const { invoices: invoicesByNumber } = await searchByNumberResponse.json()
          pendingInvoice = invoicesByNumber?.find((inv: any) =>
            inv.subscription_id === subscriptionId && !inv.file_url
          )
        }

        // If still not found, invoice doesn't exist at all - this shouldn't happen
        if (!pendingInvoice) {
          throw new Error("Bu abonelik için fatura bulunamadı. Lütfen sayfayı yenileyin ve tekrar deneyin.")
        }

        console.log("[invoice-upload] Found invoice by number:", pendingInvoice.id)
      } else {
        console.log("[invoice-upload] Found pending invoice:", pendingInvoice.id)
      }

      // 2. Update invoice number from filename if needed
      const invoiceNumber = file.name.replace(/\.pdf$/i, "")

      const updateResponse = await fetch(`/api/admin/invoices/${pendingInvoice.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invoice_number: invoiceNumber,
        }),
      })

      if (!updateResponse.ok) {
        console.warn("[invoice-upload] Failed to update invoice number, continuing with upload")
      }

      // 3. Upload PDF
      const formData = new FormData()
      formData.append("file", file)
      formData.append("invoiceId", pendingInvoice.id)

      const uploadResponse = await fetch("/api/admin/invoices/upload", {
        method: "POST",
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error("PDF yüklenirken hata oluştu")
      }

      const uploadResult = await uploadResponse.json()
      console.log("[invoice-upload] Upload successful:", uploadResult)

      // Wait 300ms to ensure database commit completes
      await new Promise(resolve => setTimeout(resolve, 300))

      // Verify the invoice was updated correctly by re-fetching
      const verifyResponse = await fetch(`/api/admin/invoices?subscriptionId=${subscriptionId}`)
      if (verifyResponse.ok) {
        const { invoices: verifiedInvoices } = await verifyResponse.json()
        const updatedInvoice = verifiedInvoices?.find((inv: any) => inv.id === pendingInvoice.id)

        if (updatedInvoice?.file_url) {
          console.log("[invoice-upload] Verification successful, file_url confirmed:", updatedInvoice.file_url)
        } else {
          console.warn("[invoice-upload] Warning: file_url not found in verification, but proceeding")
        }
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
      console.error("[invoice-upload] Error:", error)
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
