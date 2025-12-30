"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { InvoiceUploadButton } from "@/components/invoice-upload-button"

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
  payment_id: string | null
  subscription_id: string | null
  user_id: string
  profiles?: {
    first_name: string | null
    last_name: string | null
    email: string | null
  }
}

interface InvoicesTabsProps {
  invoices: Invoice[]
}

export function InvoicesTabs({ invoices }: InvoicesTabsProps) {
  const [activeTab, setActiveTab] = useState("pending")

  // Bekleyen faturalar (PDF'i olmayanlar)
  const pendingInvoices = invoices.filter(inv => !inv.file_url || inv.file_url.trim() === "")

  // Tamamlanan faturalar (PDF'i olanlar)
  const completedInvoices = invoices.filter(inv => inv.file_url && inv.file_url.trim() !== "")

  const renderInvoiceRow = (invoice: Invoice) => (
    <tr key={invoice.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
      <td className="py-4 px-4 text-white font-mono">{invoice.invoice_number}</td>
      <td className="py-4 px-4">
        <div>
          <p className="text-white font-medium">
            {[invoice.profiles?.first_name, invoice.profiles?.last_name].filter(Boolean).join(" ") || "-"}
          </p>
          <p className="text-white/60 text-sm">{invoice.profiles?.email}</p>
        </div>
      </td>
      <td className="py-4 px-4 text-white/80">
        {new Date(invoice.invoice_date).toLocaleDateString("tr-TR")}
      </td>
      <td className="py-4 px-4 text-white/80">
        {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString("tr-TR") : "-"}
      </td>
      <td className="py-4 px-4 text-white font-semibold">
        {Number(invoice.amount).toFixed(2)} {invoice.currency}
      </td>
      <td className="py-4 px-4">
        {invoice.status === "paid" ? (
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/20">
            Ödendi
          </Badge>
        ) : invoice.status === "pending" ? (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/20">
            Bekliyor
          </Badge>
        ) : invoice.status === "overdue" ? (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/20">
            Gecikmiş
          </Badge>
        ) : invoice.status === "ready" ? (
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/20">
            Hazır
          </Badge>
        ) : invoice.status === "preparing" ? (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/20">
            Hazırlanıyor
          </Badge>
        ) : (
          <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/20">
            İptal
          </Badge>
        )}
      </td>
      <td className="py-4 px-4 text-white/80">{invoice.description || "-"}</td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-2">
          {invoice.file_url ? (
            <a
              href={invoice.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-400 hover:text-teal-300 transition-colors font-medium"
            >
              PDF İndir
            </a>
          ) : (
            <InvoiceUploadButton invoiceId={invoice.id} />
          )}
        </div>
      </td>
    </tr>
  )

  return (
    <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-white">Faturalar</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/5 mb-4">
            <TabsTrigger
              value="pending"
              className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400"
            >
              Bekleyen ({pendingInvoices.length})
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400"
            >
              Tamamlanan ({completedInvoices.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-white/80 font-semibold">Fatura No</th>
                    <th className="text-left py-3 px-4 text-white/80 font-semibold">Kullanıcı</th>
                    <th className="text-left py-3 px-4 text-white/80 font-semibold">Tarih</th>
                    <th className="text-left py-3 px-4 text-white/80 font-semibold">Vade</th>
                    <th className="text-left py-3 px-4 text-white/80 font-semibold">Tutar</th>
                    <th className="text-left py-3 px-4 text-white/80 font-semibold">Durum</th>
                    <th className="text-left py-3 px-4 text-white/80 font-semibold">Açıklama</th>
                    <th className="text-left py-3 px-4 text-white/80 font-semibold">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingInvoices.map(renderInvoiceRow)}
                  {pendingInvoices.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-white/60">
                        Bekleyen fatura bulunmuyor
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="completed" className="mt-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-white/80 font-semibold">Fatura No</th>
                    <th className="text-left py-3 px-4 text-white/80 font-semibold">Kullanıcı</th>
                    <th className="text-left py-3 px-4 text-white/80 font-semibold">Tarih</th>
                    <th className="text-left py-3 px-4 text-white/80 font-semibold">Vade</th>
                    <th className="text-left py-3 px-4 text-white/80 font-semibold">Tutar</th>
                    <th className="text-left py-3 px-4 text-white/80 font-semibold">Durum</th>
                    <th className="text-left py-3 px-4 text-white/80 font-semibold">Açıklama</th>
                    <th className="text-left py-3 px-4 text-white/80 font-semibold">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {completedInvoices.map(renderInvoiceRow)}
                  {completedInvoices.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-white/60">
                        Tamamlanan fatura bulunmuyor
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
