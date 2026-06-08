import { checkAdminAccess } from "@/lib/admin-check"
import { createSupabaseAdmin } from "@/lib/supabase-server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, DollarSign, CheckCircle, Clock, XCircle } from "lucide-react"
import Link from "next/link"
import { AdminLayoutWrapper } from "@/components/admin-layout-wrapper"
import { InvoiceUploadButton } from "@/components/invoice-upload-button"
import { InvoicesTabs } from "@/components/admin/invoices-tabs"

// Disable caching for this page
export const revalidate = 0

export default async function InvoicesManagement() {
  const { session } = await checkAdminAccess()
  const supabase = createSupabaseAdmin()

  // Get all invoices (without joins to avoid FK errors)
  const { data: invoices, error: invoicesError } = await supabase
    .from("invoices")
    .select("*")
    .order("invoice_date", { ascending: false })

  if (invoicesError) {
    console.error("[admin/faturalar] Error fetching invoices:", invoicesError)
  } else {
  }

  // Get unique user IDs from invoices
  const userIds = [...new Set(invoices?.map(inv => inv.user_id).filter(Boolean) || [])]

  // Get profiles separately
  let profilesData: Array<{id: string, first_name: string | null, last_name: string | null, email: string | null}> = []
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

  // Create profile map for easy lookup
  const profilesMap = new Map(profilesData?.map((p) => [p.id, p]) || [])

  // Enrich invoices with user info
  const safeInvoices = (invoices || []).map((inv) => ({
    ...inv,
    profiles: profilesMap.get(inv.user_id)
  }))


  // Get invoice statistics
  const { count: totalInvoices } = await supabase
    .from("invoices")
    .select("*", { count: "exact", head: true })

  const { count: paidInvoices } = await supabase
    .from("invoices")
    .select("*", { count: "exact", head: true })
    .eq("status", "ready") // Fatura hazır ve kullanıcı indirdi

  const { count: pendingInvoices } = await supabase
    .from("invoices")
    .select("*", { count: "exact", head: true })
    .eq("status", "preparing") // Paraşüt'ten fatura hazırlanıyor

  const { count: overdueInvoices } = await supabase
    .from("invoices")
    .select("*", { count: "exact", head: true })
    .eq("status", "overdue")

  // Revenue from ACTUAL completed payments, not invoice PDF status
  const { data: revenueData } = await supabase
    .from("payment_transactions")
    .select("amount")
    .eq("status", "completed")

  const totalRevenue = revenueData?.reduce((sum, t) => sum + Number(t.amount), 0) || 0

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
            <CardTitle className="text-sm font-medium text-white/80">Hazır</CardTitle>
            <CheckCircle className="h-4 w-4 text-teal-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{paidInvoices || 0}</div>
            <p className="text-xs text-white/60 mt-1">Fatura hazır (PDF yüklendi)</p>
          </CardContent>
        </Card>

        <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/80">Hazırlanıyor</CardTitle>
            <Clock className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{pendingInvoices || 0}</div>
            <p className="text-xs text-white/60 mt-1">Fatura hazırlanıyor</p>
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

      {/* Invoices Tabs */}
      <InvoicesTabs invoices={safeInvoices} />
      </div>
    </AdminLayoutWrapper>
  )
}
