import { checkAdminAccess } from "@/lib/admin-check"
import { createSupabaseAdmin } from "@/lib/supabase-server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, Users, CheckCircle } from "lucide-react"
import { AdminLayoutWrapper } from "@/components/admin-layout-wrapper"
import { NotificationSendForm } from "@/components/admin/notification-send-form"

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
          <h1 className="text-4xl font-bold mb-2">Bildirim Yönetimi</h1>
          <p className="text-white/60">
            Kullanıcılara toplu bildirim gönderin
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white/80">
                Toplam Bildirim
              </CardTitle>
              <Bell className="h-4 w-4 text-white/60" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {totalNotifications || 0}
              </div>
              <p className="text-xs text-white/60 mt-1">Tüm zamanlar</p>
            </CardContent>
          </Card>

          <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white/80">
                Okunmamış
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-white/60" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {unreadNotifications || 0}
              </div>
              <p className="text-xs text-white/60 mt-1">Henüz okunmadı</p>
            </CardContent>
          </Card>

          <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white/80">
                Toplam Kullanıcı
              </CardTitle>
              <Users className="h-4 w-4 text-white/60" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {totalUsers || 0}
              </div>
              <p className="text-xs text-white/60 mt-1">Kayıtlı kullanıcı</p>
            </CardContent>
          </Card>
        </div>

        {/* Send Notification Form */}
        <NotificationSendForm planCounts={planCounts} />
      </div>
    </AdminLayoutWrapper>
  )
}
