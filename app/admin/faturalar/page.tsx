import { checkAdminAccess } from "@/lib/admin-check"
import { createSupabaseAdmin } from "@/lib/supabase-server"
import { FileText, DollarSign, CheckCircle, Clock, XCircle } from "lucide-react"
import { AdminLayoutWrapper } from "@/components/admin-layout-wrapper"
import { InvoicesTabs } from "@/components/admin/invoices-tabs"
import { StatCard } from "@/components/admin/stat-card"

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
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400/80">Finans</p>
          <h1 className="mt-2 text-3xl lg:text-4xl font-bold tracking-tight text-white">Fatura Yönetimi</h1>
          <p className="mt-2 text-sm text-white/50">Tüm faturaları görüntüleyin, PDF yükleyin ve durumlarını yönetin.</p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard label="Toplam Fatura" value={totalInvoices || 0} hint="Tüm faturalar" icon={FileText} accent="emerald" />
          <StatCard label="Hazır" value={paidInvoices || 0} hint="PDF yüklendi" icon={CheckCircle} accent="teal" />
          <StatCard label="Hazırlanıyor" value={pendingInvoices || 0} hint="PDF bekleniyor" icon={Clock} accent="amber" />
          <StatCard label="Gecikmiş" value={overdueInvoices || 0} hint="Gecikmiş ödemeler" icon={XCircle} accent="rose" />
          <StatCard label="Toplam Gelir" value={`${totalRevenue.toLocaleString("tr-TR")} ₺`} hint="Tamamlanan ödemeler" icon={DollarSign} accent="purple" />
        </div>

        {/* Invoices Tabs */}
        <InvoicesTabs invoices={safeInvoices} />
      </div>
    </AdminLayoutWrapper>
  )
}
