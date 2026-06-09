import { checkAdminAccess } from "@/lib/admin-check"
import { FileText, FolderOpen, Eye, TrendingUp, Users, Receipt, CreditCard, DollarSign, ShieldAlert, Scan, Activity, Zap, Save, ArrowUpRight } from "lucide-react"
import { createSupabaseAdmin } from "@/lib/supabase-server"
import Link from "next/link"
import { AdminLayoutWrapper } from "@/components/admin-layout-wrapper"
import { AnalyticsCharts } from "@/components/admin/analytics-charts"
import { StatCard, SectionTitle } from "@/components/admin/stat-card"

export default async function AdminDashboard() {
  const { session } = await checkAdminAccess()

  // Use admin client to bypass RLS and see all data
  const supabase = createSupabaseAdmin()

  // Get user statistics from profiles
  const { count: totalUsers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })

  // A subscription is only "truly active" if its status is active AND its expiry
  // date hasn't passed (unlimited grants use a far-future date, null = no expiry).
  // This keeps the dashboard consistent with the date-based access cutoff.
  const nowIso = new Date().toISOString()
  const notExpiredFilter = `expires_at.gte.${nowIso},expires_at.is.null`

  const { count: activeSubscriptions } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("status", "active")
    .or(notExpiredFilter)

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

  // Revenue is computed from ACTUAL completed payments (payment_transactions),
  // not invoice PDF status. Shopier/PayTR payments land here as 'completed'
  // regardless of whether an invoice PDF has been uploaded yet.
  const { data: revenueData } = await supabase
    .from("payment_transactions")
    .select("amount")
    .eq("status", "completed")

  const totalRevenue = revenueData?.reduce((sum, t) => sum + Number(t.amount), 0) || 0

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
    .or(notExpiredFilter)

  const { count: proUsers } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("status", "active")
    .eq("plan_type", "pro")
    .or(notExpiredFilter)

  const { count: freeUsers } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("status", "active")
    .eq("plan_type", "free")
    .or(notExpiredFilter)

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

  // Prepare chart data - Last 12 months
  const months = []
  const monthNames = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"]

  for (let i = 11; i >= 0; i--) {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    months.push({
      month: monthNames[date.getMonth()],
      year: date.getFullYear(),
      startDate: new Date(date.getFullYear(), date.getMonth(), 1).toISOString(),
      endDate: new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59).toISOString(),
    })
  }

  // Monthly revenue from completed payments
  const { data: allPayments } = await supabase
    .from("payment_transactions")
    .select("amount, created_at")
    .eq("status", "completed")

  const revenueChartData = months.map((m) => {
    const monthRevenue = allPayments
      ?.filter((t) => {
        const tDate = new Date(t.created_at)
        return tDate >= new Date(m.startDate) && tDate <= new Date(m.endDate)
      })
      .reduce((sum, t) => sum + Number(t.amount), 0) || 0

    return {
      month: m.month,
      revenue: monthRevenue,
    }
  })

  // User growth data by month
  const { data: allProfiles } = await supabase
    .from("profiles")
    .select("created_at")
    .order("created_at", { ascending: true })

  const userGrowthData = months.map((m) => {
    const usersUntilMonth = allProfiles
      ?.filter((profile) => new Date(profile.created_at) <= new Date(m.endDate))
      .length || 0

    return {
      month: m.month,
      users: usersUntilMonth,
    }
  })

  // Plan distribution
  const planDistribution = [
    { name: "Premium", value: premiumUsers || 0, color: "#a855f7" },
    { name: "Pro", value: proUsers || 0, color: "#3b82f6" },
    { name: "Free", value: freeUsers || 0, color: "#6b7280" },
  ].filter((item) => item.value > 0)

  const quickActions = [
    { href: "/admin/kullanicilar", label: "Kullanıcılar", desc: "Kullanıcıları görüntüle", icon: Users },
    { href: "/admin/faturalar", label: "Faturalar", desc: "Faturaları yönet", icon: Receipt },
    { href: "/admin/odeme-risk-takip", label: "Risk Takip", desc: "Ödeme güvenliği", icon: ShieldAlert },
    { href: "/admin/blog/posts/new", label: "Yeni Yazı", desc: "Blog yazısı oluştur", icon: FileText },
    { href: "/admin/blog/categories", label: "Kategoriler", desc: "Kategori yönet", icon: FolderOpen },
  ]

  return (
    <AdminLayoutWrapper userEmail={session.user.email || ""}>
      <div className="space-y-10">
        {/* Hero header */}
        <div className="relative overflow-hidden rounded-3xl border border-white/[0.07] bg-gradient-to-br from-emerald-950/40 via-[#0d1210] to-[#0a0c0b] p-7 lg:p-9">
          <div className="pointer-events-none absolute -right-10 -top-16 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400/80">Genel Bakış</p>
              <h1 className="mt-2 text-3xl lg:text-4xl font-bold tracking-tight text-white">Yönetim Paneli</h1>
              <p className="mt-2 text-sm text-white/50">Platform metrikleri, gelir ve içerik durumu tek bakışta.</p>
            </div>
            <div className="flex items-center gap-8">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-white/40">Toplam Gelir</p>
                <p className="mt-1 text-2xl font-bold text-emerald-400 tabular-nums">{totalRevenue.toLocaleString("tr-TR")} ₺</p>
              </div>
              <div className="h-10 w-px bg-white/10" />
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-white/40">Aktif Üye</p>
                <p className="mt-1 text-2xl font-bold text-white tabular-nums">{activeSubscriptions || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* User & Subscription */}
        <section>
          <SectionTitle hint="kullanıcı & abonelik">Kullanıcılar ve Abonelikler</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Toplam Kullanıcı" value={totalUsers || 0} hint="Kayıtlı kullanıcı" icon={Users} accent="emerald" />
            <StatCard label="Aktif Abonelik" value={activeSubscriptions || 0} hint="Ödeme yapan kullanıcı" icon={CreditCard} accent="teal" />
            <StatCard label="Toplam Gelir" value={`${totalRevenue.toLocaleString("tr-TR")} ₺`} hint="Tamamlanan ödemeler" icon={DollarSign} accent="emerald" />
            <StatCard label="Faturalar" value={totalInvoices || 0} hint={`${readyInvoices || 0} hazır · ${preparingInvoices || 0} bekliyor`} icon={Receipt} accent="amber" />
          </div>
        </section>

        {/* Plan distribution */}
        <section>
          <SectionTitle hint="plan dağılımı">Planlar</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Free Üye" value={freeUsers || 0} hint="Ücretsiz plan" icon={Users} accent="slate" />
            <StatCard label="Pro Üye" value={proUsers || 0} hint="Pro abonelik" icon={Zap} accent="blue" />
            <StatCard label="Premium Üye" value={premiumUsers || 0} hint="Premium abonelik" icon={TrendingUp} accent="purple" />
          </div>
        </section>

        {/* Usage */}
        <section>
          <SectionTitle hint="özellik kullanımı">Kullanım İstatistikleri</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="OCR Analizi" value={totalOcrAnalyses.toLocaleString()} hint="Toplam PDF analizi" icon={Scan} accent="blue" />
            <StatCard label="Kaydedilen Kredi" value={totalSavedCredits.toLocaleString()} hint="OCR'dan kaydedilen" icon={Save} accent="emerald" />
            <StatCard label="Risk Analizi" value={totalRiskAnalyses.toLocaleString()} hint="Finansal sağlık raporu" icon={ShieldAlert} accent="rose" />
            <StatCard label="Toplam Kredi" value={totalCreditsCount?.toLocaleString() || 0} hint="Sisteme kayıtlı" icon={CreditCard} accent="purple" />
          </div>
        </section>

        {/* Content */}
        <section>
          <SectionTitle hint="blog & bildirim">İçerik</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Blog Yazıları" value={totalPosts || 0} hint={`${publishedPosts || 0} yayında · ${draftPosts || 0} taslak`} icon={FileText} accent="emerald" />
            <StatCard label="Görüntüleme" value={totalViews.toLocaleString()} hint="Tüm yazılar" icon={Eye} accent="teal" />
            <StatCard label="Kategoriler" value={totalCategories || 0} hint="Toplam kategori" icon={FolderOpen} accent="amber" />
            <StatCard label="Bildirimler" value={totalNotifications?.toLocaleString() || 0} hint={`${unreadNotifications || 0} okunmadı`} icon={Activity} accent="blue" />
          </div>
        </section>

        {/* Charts */}
        <AnalyticsCharts
          revenueData={revenueChartData}
          userGrowthData={userGrowthData}
          planDistribution={planDistribution}
        />

        {/* Quick actions */}
        <section>
          <SectionTitle hint="kısayollar">Hızlı İşlemler</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 transition-all duration-300 hover:bg-white/[0.04] hover:-translate-y-0.5"
                >
                  <ArrowUpRight className="absolute right-4 top-4 h-4 w-4 text-white/20 transition-all group-hover:text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 transition-colors group-hover:bg-emerald-500/20">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-semibold text-white">{action.label}</h3>
                  <p className="mt-0.5 text-xs text-white/45">{action.desc}</p>
                </Link>
              )
            })}
          </div>
        </section>
      </div>
    </AdminLayoutWrapper>
  )
}
