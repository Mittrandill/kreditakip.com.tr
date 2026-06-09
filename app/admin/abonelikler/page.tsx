import { checkAdminAccess } from "@/lib/admin-check"
import { createSupabaseAdmin } from "@/lib/supabase-server"
import { CreditCard, Layers, UserCog } from "lucide-react"
import { AdminLayoutWrapper } from "@/components/admin-layout-wrapper"
import { SubscriptionsTableClient } from "@/components/admin/subscriptions-table-client"
import { StatCard } from "@/components/admin/stat-card"

export default async function SubscriptionsManagement() {
  const { session } = await checkAdminAccess()
  const supabase = createSupabaseAdmin()

  // Get all subscriptions with user and plan info
  const { data: subscriptions, error: subsError } = await supabase
    .from("subscriptions")
    .select(`
      *,
      profiles:user_id (
        first_name,
        last_name,
        email
      ),
      subscription_plans (
        name,
        billing_period,
        price
      )
    `)
    .in("status", ["active", "cancelled", "expired"])
    .order("created_at", { ascending: false })

  if (subsError) {
    console.error("Error fetching subscriptions:", subsError)
  }

  // Get statistics
  const { count: totalSubscriptions } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .in("status", ["active", "cancelled", "expired"])

  const { count: activeSubscriptions } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("status", "active")

  const { count: manualSubscriptions } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("status", "active")
    .is("payment_provider", null)

  return (
    <AdminLayoutWrapper userEmail={session.user.email || ""}>
      <div className="space-y-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400/80">Abonelik</p>
          <h1 className="mt-2 text-3xl lg:text-4xl font-bold tracking-tight text-white">Abonelik Yönetimi</h1>
          <p className="mt-2 text-sm text-white/50">Tüm abonelikleri görüntüleyin, filtreleyin ve durumlarını izleyin.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Toplam Abonelik" value={totalSubscriptions || 0} hint="Tüm abonelikler" icon={Layers} accent="emerald" />
          <StatCard label="Aktif" value={activeSubscriptions || 0} hint="Aktif kullanıcı" icon={CreditCard} accent="teal" />
          <StatCard label="Manuel" value={manualSubscriptions || 0} hint="Admin tarafından verildi" icon={UserCog} accent="purple" />
        </div>

        <SubscriptionsTableClient subscriptions={subscriptions || []} />
      </div>
    </AdminLayoutWrapper>
  )
}
