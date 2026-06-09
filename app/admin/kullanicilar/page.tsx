import { checkAdminAccess } from "@/lib/admin-check"
import { createSupabaseAdmin } from "@/lib/supabase-server"
import { Users, CreditCard, Ban } from "lucide-react"
import { AdminLayoutWrapper } from "@/components/admin-layout-wrapper"
import { UserTableClient } from "@/components/admin/user-table-client"
import { StatCard } from "@/components/admin/stat-card"

export default async function UsersManagement() {
  const { session } = await checkAdminAccess()
  const supabase = createSupabaseAdmin()

  // Get all users with their profiles and subscription info
  const { data: users, error: usersError } = await supabase
    .from("profiles")
    .select(`
      *,
      subscriptions!subscriptions_user_id_fkey (
        id,
        plan_type,
        status,
        expires_at,
        created_at
      )
    `)
    .order("created_at", { ascending: false })

  // Debug: Log error if any
  if (usersError) {
    console.error("Error fetching users:", usersError)
  }

  // OCR usage per user (analyses + saved credits), independent of plan/status
  const { data: usageRows } = await supabase
    .from("subscription_usage")
    .select("user_id, feature_type, usage_count, saved_credits_count")
    .eq("feature_type", "ocr_analysis")

  const usageMap = new Map<string, { analyses: number; saved: number }>()
  usageRows?.forEach((u) => {
    usageMap.set(u.user_id, { analyses: u.usage_count || 0, saved: u.saved_credits_count || 0 })
  })

  const usersWithUsage = (users || []).map((u) => ({
    ...u,
    ocrUsage: usageMap.get(u.id) || { analyses: 0, saved: 0 },
  }))

  // Get subscription counts
  const { count: totalUsers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })

  const { count: activeSubscriptions } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("status", "active")

  const { count: cancelledSubscriptions } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("status", "cancelled")

  return (
    <AdminLayoutWrapper userEmail={session.user.email || ""}>
      <div className="space-y-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400/80">Yönetim</p>
          <h1 className="mt-2 text-3xl lg:text-4xl font-bold tracking-tight text-white">Kullanıcı Yönetimi</h1>
          <p className="mt-2 text-sm text-white/50">Tüm kullanıcıları görüntüleyin, filtreleyin ve yönetin.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Toplam Kullanıcı" value={totalUsers || 0} hint="Kayıtlı kullanıcı" icon={Users} accent="emerald" />
          <StatCard label="Aktif Abonelik" value={activeSubscriptions || 0} hint="Ödeme yapan" icon={CreditCard} accent="teal" />
          <StatCard label="İptal Edilen" value={cancelledSubscriptions || 0} hint="İptal edilen abonelik" icon={Ban} accent="rose" />
        </div>

        <UserTableClient users={usersWithUsage} />
      </div>
    </AdminLayoutWrapper>
  )
}
