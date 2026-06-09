import { checkAdminAccess } from "@/lib/admin-check"
import { createSupabaseAdmin } from "@/lib/supabase-server"
import { Activity, ShieldCheck, Clock } from "lucide-react"
import { AdminLayoutWrapper } from "@/components/admin-layout-wrapper"
import { ActivityLogsTableClient } from "@/components/admin/activity-logs-table-client"
import { StatCard } from "@/components/admin/stat-card"

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
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400/80">Güvenlik</p>
          <h1 className="mt-2 text-3xl lg:text-4xl font-bold tracking-tight text-white">Admin İşlem Logları</h1>
          <p className="mt-2 text-sm text-white/50">Tüm admin işlemlerini görüntüleyin ve denetleyin.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Toplam İşlem" value={totalLogs || 0} hint="Tüm zamanlar" icon={Activity} accent="emerald" />
          <StatCard label="Son 24 Saat" value={recentLogs || 0} hint="Yeni işlemler" icon={Clock} accent="amber" />
          <StatCard label="Aktif Admin" value={uniqueAdminCount} hint="İşlem yapan" icon={ShieldCheck} accent="blue" />
        </div>

        <ActivityLogsTableClient logs={logs || []} />
      </div>
    </AdminLayoutWrapper>
  )
}
