import { checkAdminAccess } from "@/lib/admin-check"
import { AdminLayoutWrapper } from "@/components/admin-layout-wrapper"
import { SubscriptionOperations } from "@/components/admin/subscription-operations"

export default async function SubscriptionOperationsPage() {
  const { session } = await checkAdminAccess()

  return (
    <AdminLayoutWrapper userEmail={session.user.email || ""}>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Abonelik İşlemleri</h1>
          <p className="text-white/60">
            Kullanıcı arayın ve abonelik oluşturun, güncelleyin veya iptal edin
          </p>
        </div>

        <SubscriptionOperations />
      </div>
    </AdminLayoutWrapper>
  )
}
