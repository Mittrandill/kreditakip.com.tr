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
  const { data: invoices, error: invoicesError } = await supabase
    .from("invoices")
    .select(`
      *,
      profiles (
        first_name,
        last_name,
        email
      )
    `)
    .order("invoice_date", { ascending: false })

  if (invoicesError) {
    console.error("[admin/faturalar] Error fetching invoices:", invoicesError)
  } else {
    console.log("[admin/faturalar] Successfully fetched invoices, count:", invoices?.length || 0)
  }

  // Get successful payment transactions (without joins to avoid FK errors)
  const { data: rawTransactions, error: transactionsError } = await supabase
    .from("payment_transactions")
    .select("id, payment_id, subscription_id, amount, currency, status, user_id")
    .eq("status", "completed")
    .order("created_at", { ascending: false })

  if (transactionsError) {
    console.error("[admin/faturalar] Error fetching transactions:", transactionsError)
  } else {
    console.log("[admin/faturalar] Raw transactions:", rawTransactions?.length || 0)
  }

  // Get subscriptions separately
  const subscriptionIds = [...new Set(rawTransactions?.map(t => t.subscription_id).filter(Boolean) || [])]
  let subscriptionsData = []
  if (subscriptionIds.length > 0) {
    const { data, error: subsError } = await supabase
      .from("subscriptions")
      .select("id, user_id, plan_type, status")
      .in("id", subscriptionIds)

    if (subsError) {
      console.error("[admin/faturalar] Error fetching subscriptions:", subsError)
    } else {
      subscriptionsData = data || []
    }
  }

  // Get profiles separately
  const userIds = [...new Set([
    ...(rawTransactions?.map(t => t.user_id).filter(Boolean) || []),
    ...(subscriptionsData?.map((s: any) => s.user_id).filter(Boolean) || [])
  ])]
  let profilesData = []
  if (userIds.length > 0) {
    const { data, error: profilesError } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email")
      .in("id", userIds)

    if (profilesError) {
      console.error("[admin/faturalar] Error fetching profiles:", profilesError)
    } else {
      profilesData = data || []
    }
  }

  // Create maps for manual join
  const subscriptionsMap = new Map(subscriptionsData?.map((s: any) => [s.id, s]) || [])
  const profilesMap = new Map(profilesData?.map((p: any) => [p.id, p]) || [])

  // Manually join the data
  const allTransactions = rawTransactions?.map(tx => {
    const subscription = subscriptionsMap.get(tx.subscription_id)
    const profile = profilesMap.get(subscription?.user_id || tx.user_id)
    return {
      ...tx,
      subscriptions: subscription ? {
        ...subscription,
        profiles: profile
      } : null
    }
  })

  console.log("[admin/faturalar] Total successful payments:", allTransactions?.length || 0)

  // Create a map of payment_id to invoice
  const safeInvoices = invoices || []
  const invoicesByPaymentId = new Map()
  safeInvoices.forEach((inv) => {
    if (inv.payment_id) {
      invoicesByPaymentId.set(inv.payment_id, inv)
    }
  })

  console.log("[admin/faturalar] Total invoices:", safeInvoices.length)
  console.log("[admin/faturalar] Invoices with payment_id:", invoicesByPaymentId.size)

  // Filter payments that need invoice PDFs
  const pendingInvoiceUsers = (allTransactions || [])
    .filter((tx) => {
      const invoice = invoicesByPaymentId.get(tx.payment_id)
      const hasValidPDF = invoice?.file_url && invoice.file_url.trim().length > 0

      const userEmail = tx.subscriptions?.profiles?.email || 'unknown'
      console.log(`[admin/faturalar] Payment ${tx.payment_id} (${userEmail}): hasInvoice=${!!invoice}, hasValidPDF=${hasValidPDF}`)

      return !hasValidPDF // Show if no invoice or no PDF
    })
    .map((tx) => ({
      id: tx.subscription_id,
      user_id: tx.subscriptions?.user_id,
      plan_type: tx.subscriptions?.plan_type,
      status: tx.subscriptions?.status,
      created_at: tx.subscriptions?.created_at,
      profiles: tx.subscriptions?.profiles,
      transaction: {
        payment_id: tx.payment_id,
        amount: tx.amount,
        currency: tx.currency,
      },
    }))

  console.log("[admin/faturalar] Pending invoice users count:", pendingInvoiceUsers.length)
  console.log("[admin/faturalar] Pending payment IDs:", pendingInvoiceUsers.map(u => u.transaction.payment_id))

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
                          paymentId={sub.transaction?.payment_id || ""}
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
                {safeInvoices.map((invoice) => (
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
                {safeInvoices.length === 0 ? (
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
