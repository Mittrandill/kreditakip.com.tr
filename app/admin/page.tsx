import { checkAdminAccess } from "@/lib/admin-check"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, FolderOpen, Eye, TrendingUp, Users, Receipt, CreditCard, DollarSign, ShieldAlert, Scan, Activity, Zap, Save } from "lucide-react"
import { createSupabaseAdmin } from "@/lib/supabase-server"
import Link from "next/link"
import { AdminLayoutWrapper } from "@/components/admin-layout-wrapper"

export default async function AdminDashboard() {
  const { session } = await checkAdminAccess()

  // Use admin client to bypass RLS and see all data
  const supabase = createSupabaseAdmin()

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

  const { count: readyInvoices } = await supabase
    .from("invoices")
    .select("*", { count: "exact", head: true })
    .eq("status", "ready")

  const { count: preparingInvoices } = await supabase
    .from("invoices")
    .select("*", { count: "exact", head: true })
    .eq("status", "preparing")

  const { data: revenueData } = await supabase
    .from("invoices")
    .select("amount")
    .in("status", ["ready", "paid"])

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

  // Get usage statistics
  const { data: usageStats, error: usageError } = await supabase
    .from("subscription_usage")
    .select("feature_type, usage_count, saved_credits_count")

  if (usageError) {
    console.error("[admin/dashboard] Error fetching usage stats:", usageError)
  }

  const totalOcrAnalyses = usageStats
    ?.filter(u => u.feature_type === 'ocr_analysis')
    .reduce((sum, u) => sum + (u.usage_count || 0), 0) || 0

  const totalSavedCredits = usageStats
    ?.filter(u => u.feature_type === 'ocr_analysis')
    .reduce((sum, u) => sum + (u.saved_credits_count || 0), 0) || 0

  const totalRiskAnalyses = usageStats
    ?.filter(u => u.feature_type === 'risk_analysis')
    .reduce((sum, u) => sum + (u.usage_count || 0), 0) || 0

  // Get plan type breakdown
  const { count: premiumUsers } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("status", "active")
    .eq("plan_type", "premium")

  const { count: proUsers } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("status", "active")
    .eq("plan_type", "pro")

  const { count: freeUsers } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("status", "active")
    .eq("plan_type", "free")

  // Get total credits count
  const { count: totalCreditsCount } = await supabase
    .from("credits")
    .select("*", { count: "exact", head: true })
    .is("deleted_at", null)

  // Get payment plans count
  const { count: totalPaymentPlans } = await supabase
    .from("payment_plans")
    .select("*", { count: "exact", head: true })
    .is("deleted_at", null)

  const { count: pendingPaymentPlans } = await supabase
    .from("payment_plans")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending")
    .is("deleted_at", null)

  // Get notifications count
  const { count: totalNotifications } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .is("deleted_at", null)

  const { count: unreadNotifications } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("is_read", false)
    .is("deleted_at", null)

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
              <p className="text-xs text-white/60 mt-1">{readyInvoices || 0} hazır, {preparingInvoices || 0} bekliyor</p>
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

      {/* Credit & Payment Statistics */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Kredi ve Ödeme Takibi</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Toplam Kredi</CardTitle>
              <CreditCard className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{totalCreditsCount?.toLocaleString() || 0}</div>
              <p className="text-xs text-white/60 mt-1">Sisteme kayıtlı</p>
            </CardContent>
          </Card>

          <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Ödeme Planları</CardTitle>
              <Receipt className="h-4 w-4 text-teal-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{totalPaymentPlans?.toLocaleString() || 0}</div>
              <p className="text-xs text-white/60 mt-1">{pendingPaymentPlans || 0} beklemede</p>
            </CardContent>
          </Card>

          <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Bildirimler</CardTitle>
              <Activity className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{totalNotifications?.toLocaleString() || 0}</div>
              <p className="text-xs text-white/60 mt-1">{unreadNotifications || 0} okunmadı</p>
            </CardContent>
          </Card>

          <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Bankalar</CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">55</div>
              <p className="text-xs text-white/60 mt-1">Entegre edilmiş</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Usage Statistics */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Kullanım İstatistikleri</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white/80">OCR Analizi</CardTitle>
              <Scan className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{totalOcrAnalyses.toLocaleString()}</div>
              <p className="text-xs text-white/60 mt-1">Toplam PDF analizi</p>
            </CardContent>
          </Card>

          <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white/80">OCR'dan Kaydedilen</CardTitle>
              <Save className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{totalSavedCredits.toLocaleString()}</div>
              <p className="text-xs text-white/60 mt-1">PDF'den otomatik</p>
            </CardContent>
          </Card>

          <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Risk Analizi</CardTitle>
              <ShieldAlert className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{totalRiskAnalyses.toLocaleString()}</div>
              <p className="text-xs text-white/60 mt-1">Finansal sağlık raporu</p>
            </CardContent>
          </Card>

          <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Plan Dağılımı</CardTitle>
              <Zap className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{freeUsers || 0} / {proUsers || 0} / {premiumUsers || 0}</div>
              <p className="text-xs text-white/60 mt-1">Free / Pro / Premium</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
              href="/admin/faturalar"
              className="flex items-center gap-4 p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-lg hover:border-yellow-500/40 transition-all"
            >
              <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                <Receipt className="h-6 w-6 text-yellow-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Faturalar</h3>
                <p className="text-sm text-white/60">Faturaları yönet</p>
              </div>
            </Link>

            <Link
              href="/admin/odeme-risk-takip"
              className="flex items-center gap-4 p-4 bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-lg hover:border-red-500/40 transition-all"
            >
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                <ShieldAlert className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Risk Takip</h3>
                <p className="text-sm text-white/60">Ödeme güvenliği</p>
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
