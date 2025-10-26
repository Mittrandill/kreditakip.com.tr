import { checkAdminAccess } from "@/lib/admin-check"
import { createSupabaseAdmin } from "@/lib/supabase-server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, DollarSign, CheckCircle, Clock, XCircle } from "lucide-react"
import Link from "next/link"
import { AdminLayoutWrapper } from "@/components/admin-layout-wrapper"
import { InvoiceUploadButton } from "@/components/invoice-upload-button"

// Disable caching for this page
export const revalidate = 0

export default async function InvoicesManagement() {
  const { session } = await checkAdminAccess()
  const supabase = createSupabaseAdmin()

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

  // Get users with active/completed subscriptions but no invoices with file_url
  // This includes both: 1) No invoice at all, 2) Invoice exists but no PDF uploaded
  const { data: subscriptionsData } = await supabase
    .from("subscriptions")
    .select(`
      id,
      user_id,
      plan_type,
      status,
      created_at,
      profiles!subscriptions_user_id_fkey (
        first_name,
        last_name,
        email
      )
    `)
    .in("status", ["active", "cancelled", "expired"])
    .order("created_at", { ascending: false })

  // Get payment transactions to show amounts
  const { data: allTransactions } = await supabase
    .from("payment_transactions")
    .select("subscription_id, amount, currency")

  // Create a map of subscription_id to transaction
  const transactionMap = new Map()
  allTransactions?.forEach((tx) => {
    transactionMap.set(tx.subscription_id, tx)
  })

  // Filter subscriptions that need invoices (no invoice OR invoice without PDF)
  const subscriptionIdsWithPDF = new Set(
    invoices?.filter((inv) => inv.file_url).map((inv) => inv.subscription_id) || []
  )

  console.log("[admin/faturalar] Total invoices:", invoices?.length)
  console.log("[admin/faturalar] Invoices with PDF:", subscriptionIdsWithPDF.size)
  console.log("[admin/faturalar] Subscription IDs with PDF:", Array.from(subscriptionIdsWithPDF))

  const pendingInvoiceUsers = subscriptionsData?.filter((sub) => {
    const hasPDF = subscriptionIdsWithPDF.has(sub.id)
    console.log(`[admin/faturalar] Subscription ${sub.id}: hasPDF=${hasPDF}`)
    return !hasPDF
  }).map((sub) => ({
    ...sub,
    transaction: transactionMap.get(sub.id)
  })) || []

  console.log("[admin/faturalar] Pending invoice users count:", pendingInvoiceUsers.length)

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
        <div>
          <h1 className="text-4xl font-bold mb-2">Fatura Yönetimi</h1>
          <p className="text-white/60">Tüm faturaları görüntüleyin ve yönetin</p>
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

      {/* Pending Invoice Users */}
      {pendingInvoiceUsers.length > 0 && (
        <Card className="bg-black/20 border-white/10 backdrop-blur-xl border-2 border-yellow-500/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-400" />
              Faturası Eksik Kullanıcılar ({pendingInvoiceUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-white/80 font-semibold">Kullanıcı</th>
                    <th className="text-left py-3 px-4 text-white/80 font-semibold">Plan</th>
                    <th className="text-left py-3 px-4 text-white/80 font-semibold">Tutar</th>
                    <th className="text-left py-3 px-4 text-white/80 font-semibold">Abonelik Durumu</th>
                    <th className="text-left py-3 px-4 text-white/80 font-semibold">Abonelik Tarihi</th>
                    <th className="text-left py-3 px-4 text-white/80 font-semibold">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingInvoiceUsers.map((sub: any) => (
                    <tr key={sub.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-4 px-4">
                        <div>
                          <p className="text-white font-medium">
                            {[sub.profiles?.first_name, sub.profiles?.last_name].filter(Boolean).join(" ") || "-"}
                          </p>
                          <p className="text-white/60 text-sm">{sub.profiles?.email}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/20">
                          {sub.plan_type === "premium" ? "Premium" : "Ücretsiz"}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        {sub.transaction ? (
                          <div className="text-white font-semibold">
                            {Number(sub.transaction.amount).toFixed(2)} {sub.transaction.currency}
                          </div>
                        ) : (
                          <span className="text-white/40 text-sm">-</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        {sub.status === "active" ? (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/20">
                            Aktif
                          </Badge>
                        ) : sub.status === "cancelled" ? (
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/20">
                            İptal Edildi
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/20">
                            Süresi Doldu
                          </Badge>
                        )}
                      </td>
                      <td className="py-4 px-4 text-white/80">
                        {new Date(sub.created_at).toLocaleDateString("tr-TR")}
                      </td>
                      <td className="py-4 px-4">
                        <InvoiceUploadButton
                          userId={sub.user_id}
                          subscriptionId={sub.id}
                          amount={sub.transaction?.amount || 0}
                          currency={sub.transaction?.currency || "TRY"}
                          userEmail={sub.profiles?.email || ""}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

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
                        <Link
                          href={`/admin/faturalar/${invoice.id}`}
                          className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
                        >
                          Düzenle
                        </Link>
                        {invoice.file_url ? (
                          <a
                            href={invoice.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-teal-400 hover:text-teal-300 transition-colors"
                          >
                            PDF
                          </a>
                        ) : (
                          <span className="text-yellow-400 text-sm">PDF Yok</span>
                        )}
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
