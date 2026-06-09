import { checkAdminAccess } from "@/lib/admin-check"
import { createSupabaseAdmin } from "@/lib/supabase-server"
import { Bell, Users, MailOpen } from "lucide-react"
import { AdminLayoutWrapper } from "@/components/admin-layout-wrapper"
import { NotificationSendForm } from "@/components/admin/notification-send-form"
import { StatCard } from "@/components/admin/stat-card"

export default async function NotificationsManagement() {
  const { session } = await checkAdminAccess()
  const supabase = createSupabaseAdmin()

  // Get statistics
  const { count: totalNotifications } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .is("deleted_at", null)

  const { count: unreadNotifications } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("is_read", false)
    .is("deleted_at", null)

  const { count: totalUsers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })

  // Get user counts by plan
  const { count: freeUsers } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("status", "active")
    .eq("plan_type", "free")

  const { count: proUsers } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("status", "active")
    .eq("plan_type", "pro")

  const { count: premiumUsers } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("status", "active")
    .eq("plan_type", "premium")

  const planCounts = {
    free: freeUsers || 0,
    pro: proUsers || 0,
    premium: premiumUsers || 0,
    all: totalUsers || 0,
  }

  return (
    <AdminLayoutWrapper userEmail={session.user.email || ""}>
      <div className="space-y-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400/80">İletişim</p>
          <h1 className="mt-2 text-3xl lg:text-4xl font-bold tracking-tight text-white">Bildirim Yönetimi</h1>
          <p className="mt-2 text-sm text-white/50">Kullanıcılara toplu bildirim gönderin ve geçmişi izleyin.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Toplam Bildirim" value={totalNotifications || 0} hint="Tüm zamanlar" icon={Bell} accent="emerald" />
          <StatCard label="Okunmamış" value={unreadNotifications || 0} hint="Henüz okunmadı" icon={MailOpen} accent="amber" />
          <StatCard label="Toplam Kullanıcı" value={totalUsers || 0} hint="Alıcı havuzu" icon={Users} accent="teal" />
        </div>

        <NotificationSendForm planCounts={planCounts} />
      </div>
    </AdminLayoutWrapper>
  )
}
