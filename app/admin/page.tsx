import { checkAdminAccess } from "@/lib/admin-check"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, FolderOpen, Eye, TrendingUp, Users, Receipt, CreditCard, DollarSign } from "lucide-react"
import { createSupabaseServer } from "@/lib/supabase-server"
import Link from "next/link"
import { AdminLayoutWrapper } from "@/components/admin-layout-wrapper"

export default async function AdminDashboard() {
  const { session } = await checkAdminAccess()

  const supabase = createSupabaseServer()

  // Get user statistics from profiles
  const { count: totalUsers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })

  const { count: activeSubscriptions } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("status", "active")

  // Get invoice statistics
  const { count: totalInvoices } = await supabase
    .from("invoices")
    .select("*", { count: "exact", head: true })

  const { count: paidInvoices } = await supabase
    .from("invoices")
    .select("*", { count: "exact", head: true })
    .eq("status", "paid")

  const { data: revenueData } = await supabase
    .from("invoices")
    .select("amount")
    .eq("status", "paid")

  const totalRevenue = revenueData?.reduce((sum, inv) => sum + Number(inv.amount), 0) || 0

  // Get blog statistics
  const { count: totalPosts } = await supabase
    .from("blog_posts")
    .select("*", { count: "exact", head: true })

  const { count: publishedPosts } = await supabase
    .from("blog_posts")
    .select("*", { count: "exact", head: true })
    .eq("status", "published")

  const { count: draftPosts } = await supabase
    .from("blog_posts")
    .select("*", { count: "exact", head: true })
    .eq("status", "draft")

  const { count: totalCategories } = await supabase
    .from("blog_categories")
    .select("*", { count: "exact", head: true })

  // Get total views
  const { data: viewsData } = await supabase
    .from("blog_posts")
    .select("views")

  const totalViews = viewsData?.reduce((sum, post) => sum + (post.views || 0), 0) || 0

  return (
    <AdminLayoutWrapper userEmail={session.user.email || ""}>
      <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-white/60">Platform yönetimi ve istatistikler</p>
      </div>

      {/* User & Subscription Statistics */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Kullanıcı ve Abonelikler</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Toplam Kullanıcı</CardTitle>
              <Users className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{totalUsers || 0}</div>
              <p className="text-xs text-white/60 mt-1">Kayıtlı Kullanıcı</p>
            </CardContent>
          </Card>

          <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Aktif Abonelik</CardTitle>
              <CreditCard className="h-4 w-4 text-teal-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{activeSubscriptions || 0}</div>
              <p className="text-xs text-white/60 mt-1">Ödeme yapan kullanıcı</p>
            </CardContent>
          </Card>

          <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Toplam Gelir</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{totalRevenue.toLocaleString("tr-TR")} ₺</div>
              <p className="text-xs text-white/60 mt-1">Tahsil edilen</p>
            </CardContent>
          </Card>

          <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Faturalar</CardTitle>
              <Receipt className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{totalInvoices || 0}</div>
              <p className="text-xs text-white/60 mt-1">{paidInvoices || 0} ödendi</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Blog Statistics */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Blog İstatistikleri</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Toplam Yazı</CardTitle>
              <FileText className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{totalPosts || 0}</div>
              <p className="text-xs text-white/60 mt-1">Tüm blog yazıları</p>
            </CardContent>
          </Card>

          <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Yayında</CardTitle>
              <TrendingUp className="h-4 w-4 text-teal-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{publishedPosts || 0}</div>
              <p className="text-xs text-white/60 mt-1">Yayınlanmış yazılar</p>
            </CardContent>
          </Card>

          <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Taslak</CardTitle>
              <FileText className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{draftPosts || 0}</div>
              <p className="text-xs text-white/60 mt-1">Taslak yazılar</p>
            </CardContent>
          </Card>

          <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Toplam Görüntüleme</CardTitle>
              <Eye className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{totalViews.toLocaleString()}</div>
              <p className="text-xs text-white/60 mt-1">Tüm yazıların görüntülenme sayısı</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white">Hızlı İşlemler</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/admin/kullanicilar"
              className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg hover:border-purple-500/40 transition-all"
            >
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Kullanıcılar</h3>
                <p className="text-sm text-white/60">Kullanıcıları görüntüle</p>
              </div>
            </Link>

            <Link
              href="/admin/faturalar/yeni"
              className="flex items-center gap-4 p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-lg hover:border-yellow-500/40 transition-all"
            >
              <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                <Receipt className="h-6 w-6 text-yellow-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Fatura Oluştur</h3>
                <p className="text-sm text-white/60">Yeni fatura ekle</p>
              </div>
            </Link>

            <Link
              href="/admin/blog/posts/new"
              className="flex items-center gap-4 p-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-lg hover:border-emerald-500/40 transition-all"
            >
              <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <FileText className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Yeni Blog Yazısı</h3>
                <p className="text-sm text-white/60">Blog yazısı oluştur</p>
              </div>
            </Link>

            <Link
              href="/admin/blog/categories"
              className="flex items-center gap-4 p-4 bg-gradient-to-r from-teal-500/10 to-emerald-500/10 border border-teal-500/20 rounded-lg hover:border-teal-500/40 transition-all"
            >
              <div className="w-12 h-12 bg-teal-500/20 rounded-full flex items-center justify-center">
                <FolderOpen className="h-6 w-6 text-teal-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Kategoriler</h3>
                <p className="text-sm text-white/60">Kategori yönet</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Category Stats */}
      <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white">Kategoriler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-white">{totalCategories || 0}</p>
              <p className="text-sm text-white/60">Toplam kategori</p>
            </div>
            <FolderOpen className="h-8 w-8 text-emerald-400" />
          </div>
        </CardContent>
      </Card>
      </div>
    </AdminLayoutWrapper>
  )
}
