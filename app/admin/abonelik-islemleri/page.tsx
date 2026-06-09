import { checkAdminAccess } from "@/lib/admin-check"
import { createSupabaseAdmin } from "@/lib/supabase-server"
import { AdminLayoutWrapper } from "@/components/admin-layout-wrapper"
import { SubscriptionOperations } from "@/components/admin/subscription-operations"
import { StatCard } from "@/components/admin/stat-card"
import { Users, Crown, Zap, UserCircle } from "lucide-react"

export default async function SubscriptionOperationsPage() {
  const { session } = await checkAdminAccess()
  const supabase = createSupabaseAdmin()

  const { data: users } = await supabase
    .from("profiles")
    .select(`
      id, first_name, last_name, email, created_at,
      subscriptions!subscriptions_user_id_fkey (
        id, plan_type, status, expires_at, start_date, payment_provider
      )
    `)
    .order("created_at", { ascending: false })

  const rows = (users as any[]) || []
  // Active = status active AND expiry not passed (unlimited grants use year >= 2070).
  const activeOf = (u: any) =>
    (u.subscriptions || []).find(
      (s: any) =>
        s.status === "active" &&
        (!s.expires_at ||
          new Date(s.expires_at).getFullYear() >= 2070 ||
          new Date(s.expires_at) >= new Date())
    )
  const premiumCount = rows.filter((u) => activeOf(u)?.plan_type === "premium").length
  const proCount = rows.filter((u) => activeOf(u)?.plan_type === "pro").length
  const freeCount = rows.length - premiumCount - proCount

  return (
    <AdminLayoutWrapper userEmail={session.user.email || ""}>
      <div className="space-y-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400/80">Abonelik</p>
          <h1 className="mt-2 text-3xl lg:text-4xl font-bold tracking-tight text-white">Abonelik İşlemleri</h1>
          <p className="mt-2 text-sm text-white/50">Kullanıcı aboneliklerini görüntüleyin, plan atayın veya iptal edin.</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Toplam Kullanıcı" value={rows.length} hint="Kayıtlı" icon={Users} accent="emerald" />
          <StatCard label="Premium" value={premiumCount} hint="Aktif premium" icon={Crown} accent="purple" />
          <StatCard label="Pro" value={proCount} hint="Aktif pro" icon={Zap} accent="blue" />
          <StatCard label="Ücretsiz" value={freeCount} hint="Free / trial" icon={UserCircle} accent="slate" />
        </div>

        <SubscriptionOperations users={rows} />
      </div>
    </AdminLayoutWrapper>
  )
}
