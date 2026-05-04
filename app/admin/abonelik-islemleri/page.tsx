import { checkAdminAccess } from "@/lib/admin-check"
import { createSupabaseAdmin } from "@/lib/supabase-server"
import { AdminLayoutWrapper } from "@/components/admin-layout-wrapper"
import { SubscriptionOperations } from "@/components/admin/subscription-operations"

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

  return (
    <AdminLayoutWrapper userEmail={session.user.email || ""}>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Abonelik İşlemleri</h1>
          <p className="text-white/60">
            Kullanıcıların aboneliklerini görüntüleyin ve yönetin
          </p>
        </div>

        <SubscriptionOperations users={(users as any) || []} />
      </div>
    </AdminLayoutWrapper>
  )
}
