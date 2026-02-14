import { checkAdminAccess } from "@/lib/admin-check"
import { createSupabaseAdmin } from "@/lib/supabase-server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Users, AlertCircle } from "lucide-react"
import { AdminLayoutWrapper } from "@/components/admin-layout-wrapper"
import { ActivityLogsTableClient } from "@/components/admin/activity-logs-table-client"

export default async function ActivityLogs() {
  const { session } = await checkAdminAccess()
  const supabase = createSupabaseAdmin()

  // Get all activity logs with admin and user info
  const { data: logs, error: logsError } = await supabase
    .from("admin_action_logs")
    .select(`
      *,
      admin:admin_id (
        first_name,
        last_name,
        email
      ),
      target_user:target_user_id (
        first_name,
        last_name,
        email
      )
    `)
    .order("created_at", { ascending: false })
    .limit(500)

  if (logsError) {
    console.error("Error fetching activity logs:", logsError)
  }

  // Get statistics
  const { count: totalLogs } = await supabase
    .from("admin_action_logs")
    .select("*", { count: "exact", head: true })

  // Get logs from last 24 hours
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  const { count: recentLogs } = await supabase
    .from("admin_action_logs")
    .select("*", { count: "exact", head: true })
    .gte("created_at", yesterday.toISOString())

  // Get unique admins count
  const { data: uniqueAdmins } = await supabase
    .from("admin_action_logs")
    .select("admin_id")

  const uniqueAdminCount = new Set(uniqueAdmins?.map((log) => log.admin_id)).size

  return (
    <AdminLayoutWrapper userEmail={session.user.email || ""}>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Admin İşlem Logları</h1>
          <p className="text-white/60">
            Tüm admin işlemlerini görüntüleyin ve takip edin
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white/80">
                Toplam İşlem
              </CardTitle>
              <Activity className="h-4 w-4 text-white/60" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {totalLogs || 0}
              </div>
              <p className="text-xs text-white/60 mt-1">Tüm zamanlar</p>
            </CardContent>
          </Card>

          <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white/80">
                Son 24 Saat
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-white/60" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {recentLogs || 0}
              </div>
              <p className="text-xs text-white/60 mt-1">Yeni işlemler</p>
            </CardContent>
          </Card>

          <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white/80">
                Aktif Adminler
              </CardTitle>
              <Users className="h-4 w-4 text-white/60" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {uniqueAdminCount}
              </div>
              <p className="text-xs text-white/60 mt-1">İşlem yapan adminler</p>
            </CardContent>
          </Card>
        </div>

        {/* Activity Logs Table with Search and Filters */}
        <ActivityLogsTableClient logs={logs || []} />
      </div>
    </AdminLayoutWrapper>
  )
}
