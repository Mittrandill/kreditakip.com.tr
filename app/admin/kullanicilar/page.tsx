import { checkAdminAccess } from "@/lib/admin-check"
import { createSupabaseAdmin } from "@/lib/supabase-server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, CreditCard, DollarSign } from "lucide-react"
import Link from "next/link"
import { AdminLayoutWrapper } from "@/components/admin-layout-wrapper"

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

      {/* Users Table */}
      <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white">Tüm Kullanıcılar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-white/80 font-semibold">Ad Soyad</th>
                  <th className="text-left py-3 px-4 text-white/80 font-semibold">E-posta</th>
                  <th className="text-left py-3 px-4 text-white/80 font-semibold">Telefon</th>
                  <th className="text-left py-3 px-4 text-white/80 font-semibold">Abonelik</th>
                  <th className="text-left py-3 px-4 text-white/80 font-semibold">Plan</th>
                  <th className="text-left py-3 px-4 text-white/80 font-semibold">Kayıt Tarihi</th>
                  <th className="text-left py-3 px-4 text-white/80 font-semibold">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {users?.map((user) => {
                  // Find active subscription, or the most recent one
                  const subscriptions = user.subscriptions || []
                  const activeSubscription = subscriptions.find((s: any) => s.status === "active")
                  const subscription = activeSubscription || subscriptions.sort((a: any, b: any) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                  )[0]

                  const planNames: Record<string, string> = {
                    free: "Ücretsiz",
                    premium: "Premium",
                  }

                  // Create full name from first_name and last_name
                  const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ") || "-"

                  return (
                    <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-4 px-4 text-white">
                        {fullName}
                        {user.is_admin && (
                          <Badge className="ml-2 bg-purple-500/20 text-purple-400 border-purple-500/20">
                            Admin
                          </Badge>
                        )}
                      </td>
                      <td className="py-4 px-4 text-white/80">{user.email || "-"}</td>
                      <td className="py-4 px-4 text-white/80">{user.phone || "-"}</td>
                      <td className="py-4 px-4">
                        {subscription ? (
                          subscription.status === "active" ? (
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/20">
                              Aktif
                            </Badge>
                          ) : subscription.status === "cancelled" ? (
                            <Badge className="bg-red-500/20 text-red-400 border-red-500/20">
                              İptal Edildi
                            </Badge>
                          ) : subscription.status === "expired" ? (
                            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/20">
                              Süresi Doldu
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/20">
                              {subscription.status}
                            </Badge>
                          )
                        ) : (
                          <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/20">
                            Abonelik Yok
                          </Badge>
                        )}
                      </td>
                      <td className="py-4 px-4 text-white/80">
                        {subscription?.plan_type ? planNames[subscription.plan_type] || subscription.plan_type : "-"}
                      </td>
                      <td className="py-4 px-4 text-white/80">
                        {new Date(user.created_at).toLocaleDateString("tr-TR")}
                      </td>
                      <td className="py-4 px-4">
                        <Link
                          href={`/admin/kullanicilar/${user.id}`}
                          className="text-teal-400 hover:text-teal-300 transition-colors"
                        >
                          Detay
                        </Link>
                      </td>
                    </tr>
                  )
                })}
                {!users || users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center">
                      <div className="text-white/60 mb-2">
                        Henüz kullanıcı bulunmuyor
                      </div>
                      {usersError && (
                        <div className="text-red-400 text-sm mt-2 bg-red-500/10 border border-red-500/20 rounded p-4 max-w-2xl mx-auto">
                          <p className="font-semibold mb-2">Hata:</p>
                          <pre className="text-xs text-left overflow-auto">
                            {JSON.stringify(usersError, null, 2)}
                          </pre>
                          <p className="text-xs mt-2 text-left">
                            💡 Çözüm: <code className="bg-black/20 px-2 py-1 rounded">scripts/50-fix-profiles-rls-for-admin.sql</code> dosyasını çalıştırın
                          </p>
                        </div>
                      )}
                      {!usersError && (
                        <div className="text-yellow-400 text-sm mt-2">
                          ℹ️ Profiles tablosunda kayıt varsa RLS politikalarını kontrol edin
                        </div>
                      )}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      </div>
    </AdminLayoutWrapper>
  )
}
