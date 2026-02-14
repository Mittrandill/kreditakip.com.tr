import { checkAdminAccess } from "@/lib/admin-check"
import { createSupabaseAdmin } from "@/lib/supabase-server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CreditCard, Users, DollarSign } from "lucide-react"
import { AdminLayoutWrapper } from "@/components/admin-layout-wrapper"
import { SubscriptionsTableClient } from "@/components/admin/subscriptions-table-client"

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
          <h1 className="text-4xl font-bold mb-2">Abonelik Yönetimi</h1>
          <p className="text-white/60">Tüm abonelikleri görüntüleyin ve yönetin</p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white/80">
                Toplam Abonelik
              </CardTitle>
              <Users className="h-4 w-4 text-white/60" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {totalSubscriptions || 0}
              </div>
              <p className="text-xs text-white/60 mt-1">Tüm abonelikler</p>
            </CardContent>
          </Card>

          <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white/80">
                Aktif Abonelikler
              </CardTitle>
              <CreditCard className="h-4 w-4 text-white/60" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {activeSubscriptions || 0}
              </div>
              <p className="text-xs text-white/60 mt-1">Aktif kullanıcılar</p>
            </CardContent>
          </Card>

          <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white/80">
                Manuel Abonelikler
              </CardTitle>
              <DollarSign className="h-4 w-4 text-white/60" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {manualSubscriptions || 0}
              </div>
              <p className="text-xs text-white/60 mt-1">Admin tarafından verildi</p>
            </CardContent>
          </Card>
        </div>

        {/* Subscriptions Table with Search and Filters */}
        <SubscriptionsTableClient subscriptions={subscriptions || []} />
      </div>
    </AdminLayoutWrapper>
  )
}
