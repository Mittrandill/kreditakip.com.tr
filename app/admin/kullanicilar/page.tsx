import { checkAdminAccess } from "@/lib/admin-check"
import { createSupabaseAdmin } from "@/lib/supabase-server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, CreditCard, DollarSign } from "lucide-react"
import { AdminLayoutWrapper } from "@/components/admin-layout-wrapper"
import { UserTableClient } from "@/components/admin/user-table-client"

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
          <h1 className="text-4xl font-bold mb-2">Kullanıcı Yönetimi</h1>
          <p className="text-white/60">Tüm kullanıcıları görüntüleyin ve yönetin</p>
        </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/80">Toplam Kullanıcı</CardTitle>
            <Users className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{totalUsers || 0}</div>
            <p className="text-xs text-white/60 mt-1">Kayıtlı kullanıcılar</p>
          </CardContent>
        </Card>

        <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/80">Aktif Abonelikler</CardTitle>
            <CreditCard className="h-4 w-4 text-teal-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{activeSubscriptions || 0}</div>
            <p className="text-xs text-white/60 mt-1">Ödeme yapan kullanıcılar</p>
          </CardContent>
        </Card>

        <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/80">İptal Edilenler</CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{cancelledSubscriptions || 0}</div>
            <p className="text-xs text-white/60 mt-1">İptal edilen abonelikler</p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table with Search and Filters */}
      <UserTableClient users={users || []} />
      </div>
    </AdminLayoutWrapper>
  )
}
