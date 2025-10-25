"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Download, Loader2, Calendar, DollarSign } from "lucide-react"

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

export function UserInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchInvoices()
  }, [])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/user/invoices")

      if (!response.ok) {
        throw new Error("Faturalar yüklenirken hata oluştu")
      }

      const data = await response.json()
      setInvoices(data.invoices || [])
    } catch (err) {
      console.error("Error fetching invoices:", err)
      setError(err instanceof Error ? err.message : "Bir hata oluştu")
    } finally {
      setLoading(false)
    }
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
      <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
        <CardContent className="py-12">
          <div className="text-center text-red-400">{error}</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Faturalarım
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 mx-auto mb-4 text-white/20" />
              <p className="text-white/60 text-lg mb-2">Henüz faturanız bulunmuyor</p>
              <p className="text-white/40 text-sm">
                Abonelik ve ödemelerinize ait faturalar burada görüntülenecektir
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <Card
                  key={invoice.id}
                  className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors"
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      {/* Invoice Info */}
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                            <FileText className="h-5 w-5 text-emerald-400" />
                          </div>
                          <div>
                            <h3 className="text-white font-semibold">{invoice.invoice_number}</h3>
                            <p className="text-white/60 text-sm">
                              {invoice.description || "Abonelik Faturası"}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div className="flex items-center gap-2 text-white/60">
                            <Calendar className="h-4 w-4" />
                            <div>
                              <p className="text-xs text-white/40">Fatura Tarihi</p>
                              <p className="text-sm text-white">{formatDate(invoice.invoice_date)}</p>
                            </div>
                          </div>

                          {invoice.due_date && (
                            <div className="flex items-center gap-2 text-white/60">
                              <Calendar className="h-4 w-4" />
                              <div>
                                <p className="text-xs text-white/40">Vade Tarihi</p>
                                <p className="text-sm text-white">{formatDate(invoice.due_date)}</p>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-white/60">
                            <DollarSign className="h-4 w-4" />
                            <div>
                              <p className="text-xs text-white/40">Tutar</p>
                              <p className="text-sm font-semibold text-white">
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
                            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                          >
                            <a href={invoice.file_url} target="_blank" rel="noopener noreferrer">
                              <Download className="mr-2 h-4 w-4" />
                              Faturayı İndir
                            </a>
                          </Button>
                        )}

                        {invoice.payment_date && (
                          <div className="text-right">
                            <p className="text-xs text-white/40">Ödeme Tarihi</p>
                            <p className="text-sm text-emerald-400">
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
          <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Toplam Fatura</p>
                  <p className="text-2xl font-bold text-white">{invoices.length}</p>
                </div>
                <FileText className="h-8 w-8 text-emerald-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Ödenen</p>
                  <p className="text-2xl font-bold text-white">
                    {invoices.filter((inv) => inv.status === "paid").length}
                  </p>
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/20 text-lg px-3 py-1">
                  ✓
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Toplam Tutar</p>
                  <p className="text-2xl font-bold text-white">
                    {invoices
                      .filter((inv) => inv.status === "paid")
                      .reduce((sum, inv) => sum + inv.amount, 0)
                      .toFixed(2)}{" "}
                    TRY
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-teal-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
