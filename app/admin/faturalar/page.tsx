import { checkAdminAccess } from "@/lib/admin-check"
import { createSupabaseServer } from "@/lib/supabase-server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, DollarSign, CheckCircle, Clock, XCircle } from "lucide-react"
import Link from "next/link"
import { AdminLayoutWrapper } from "@/components/admin-layout-wrapper"

export default async function InvoicesManagement() {
  const { session } = await checkAdminAccess()
  const supabase = createSupabaseServer()

  // Get all invoices with user info
  const { data: invoices } = await supabase
    .from("invoices")
    .select(`
      *,
      profiles!invoices_user_id_fkey (
        first_name,
        last_name,
        email
      )
    `)
    .order("invoice_date", { ascending: false })

  // Get invoice statistics
  const { count: totalInvoices } = await supabase
    .from("invoices")
    .select("*", { count: "exact", head: true })

  const { count: paidInvoices } = await supabase
    .from("invoices")
    .select("*", { count: "exact", head: true })
    .eq("status", "paid")

  const { count: pendingInvoices } = await supabase
    .from("invoices")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending")

  const { count: overdueInvoices } = await supabase
    .from("invoices")
    .select("*", { count: "exact", head: true })
    .eq("status", "overdue")

  // Calculate total revenue
  const { data: revenueData } = await supabase
    .from("invoices")
    .select("amount")
    .eq("status", "paid")

  const totalRevenue = revenueData?.reduce((sum, inv) => sum + Number(inv.amount), 0) || 0

  return (
    <AdminLayoutWrapper userEmail={session.user.email || ""}>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Fatura Yönetimi</h1>
            <p className="text-white/60">Tüm faturaları görüntüleyin ve yönetin</p>
          </div>
        <Link href="/admin/faturalar/yeni">
          <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
            <FileText className="mr-2 h-4 w-4" />
            Yeni Fatura Oluştur
          </Button>
        </Link>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/80">Toplam Fatura</CardTitle>
            <FileText className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{totalInvoices || 0}</div>
            <p className="text-xs text-white/60 mt-1">Tüm faturalar</p>
          </CardContent>
        </Card>

        <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/80">Ödendi</CardTitle>
            <CheckCircle className="h-4 w-4 text-teal-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{paidInvoices || 0}</div>
            <p className="text-xs text-white/60 mt-1">Ödenen faturalar</p>
          </CardContent>
        </Card>

        <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/80">Bekliyor</CardTitle>
            <Clock className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{pendingInvoices || 0}</div>
            <p className="text-xs text-white/60 mt-1">Bekleyen ödemeler</p>
          </CardContent>
        </Card>

        <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/80">Gecikmiş</CardTitle>
            <XCircle className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{overdueInvoices || 0}</div>
            <p className="text-xs text-white/60 mt-1">Gecikmiş ödemeler</p>
          </CardContent>
        </Card>

        <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/80">Toplam Gelir</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{totalRevenue.toLocaleString("tr-TR")} ₺</div>
            <p className="text-xs text-white/60 mt-1">Tahsil edilen</p>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white">Tüm Faturalar</CardTitle>
        </CardHeader>
        <CardContent>
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
                {invoices?.map((invoice) => (
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
                            className="text-teal-400 hover:text-teal-300 transition-colors"
                          >
                            Görüntüle
                          </a>
                        ) : (
                          <span className="text-white/40">-</span>
                        )}
                        <Link
                          href={`/admin/kullanicilar/${invoice.user_id}`}
                          className="text-emerald-400 hover:text-emerald-300 transition-colors"
                        >
                          Kullanıcı
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
                {!invoices || invoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-white/60">
                      Henüz fatura bulunmuyor
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      </div>
    </AdminLayoutWrapper>
  )
}
