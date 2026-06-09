import { checkAdminAccess } from "@/lib/admin-check"
import { createSupabaseAdmin } from "@/lib/supabase-server"
import { CreditCard, Layers, UserCog } from "lucide-react"
import { AdminLayoutWrapper } from "@/components/admin-layout-wrapper"
import { SubscriptionsTableClient } from "@/components/admin/subscriptions-table-client"
import { StatCard } from "@/components/admin/stat-card"

export default async function SubscriptionsManagement() {
  const { session } = await checkAdminAccess()
  const supabase = createSupabaseAdmin()

  // User-based view: every registered user appears exactly once, showing their
  // CURRENT subscription (active if present, otherwise the most recent record).
  // This keeps the count consistent with the users/dashboard pages and hides
  // stale historical rows (e.g. an old cancelled plan left over from an upgrade).
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, email, created_at")
    .order("created_at", { ascending: false })

  const { data: allSubs, error: subsError } = await supabase
    .from("subscriptions")
    .select("*")
    .order("created_at", { ascending: false })

  if (profilesError) console.error("Error fetching profiles:", profilesError)
  if (subsError) console.error("Error fetching subscriptions:", subsError)

  // Pick the current subscription per user: prefer active, else latest by created_at.
  const subsByUser = new Map<string, any[]>()
  ;(allSubs || []).forEach((s) => {
    const list = subsByUser.get(s.user_id) || []
    list.push(s)
    subsByUser.set(s.user_id, list)
  })

  const subscriptions = (profiles || []).map((p) => {
    const userSubs = subsByUser.get(p.id) || []
    const current =
      userSubs.find((s) => s.status === "active") || userSubs[0] || null
    const profileRef = {
      first_name: p.first_name,
      last_name: p.last_name,
      email: p.email,
    }
    if (current) {
      return { ...current, profiles: profileRef }
    }
    // No subscription record at all → implicit free user
    return {
      id: `free-${p.id}`,
      user_id: p.id,
      plan_type: "free",
      status: "free",
      payment_provider: null,
      start_date: p.created_at,
      expires_at: null,
      profiles: profileRef,
    }
  })

  // An "active" row whose expiry date has passed isn't truly active anymore
  // (downgrade cron just hasn't processed it yet). Unlimited grants use year >= 2070.
  const isTrulyActive = (s: any) =>
    s.status === "active" &&
    (!s.expires_at ||
      new Date(s.expires_at).getFullYear() >= 2070 ||
      new Date(s.expires_at) >= new Date())

  // User-based statistics (consistent with other admin pages)
  const totalSubscriptions = subscriptions.length
  const activeSubscriptions = subscriptions.filter(isTrulyActive).length
  const manualSubscriptions = subscriptions.filter(
    (s) => isTrulyActive(s) && !s.payment_provider
  ).length

  return (
    <AdminLayoutWrapper userEmail={session.user.email || ""}>
      <div className="space-y-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400/80">Abonelik</p>
          <h1 className="mt-2 text-3xl lg:text-4xl font-bold tracking-tight text-white">Abonelik Yönetimi</h1>
          <p className="mt-2 text-sm text-white/50">Tüm abonelikleri görüntüleyin, filtreleyin ve durumlarını izleyin.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Toplam Kullanıcı" value={totalSubscriptions || 0} hint="Kayıtlı kullanıcı" icon={Layers} accent="emerald" />
          <StatCard label="Aktif Abonelik" value={activeSubscriptions || 0} hint="Ödeme yapan / aktif" icon={CreditCard} accent="teal" />
          <StatCard label="Manuel" value={manualSubscriptions || 0} hint="Admin tarafından verildi" icon={UserCog} accent="purple" />
        </div>

        <SubscriptionsTableClient subscriptions={subscriptions || []} />
      </div>
    </AdminLayoutWrapper>
  )
}
