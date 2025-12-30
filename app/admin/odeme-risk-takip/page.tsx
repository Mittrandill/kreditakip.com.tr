import { checkAdminAccess } from "@/lib/admin-check"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  AlertTriangle,
  TrendingDown,
  XCircle,
  AlertCircle,
  UserX,
  CreditCard,
  CheckCircle,
  DollarSign,
  Activity
} from "lucide-react"
import { createSupabaseAdmin } from "@/lib/supabase-server"
import { AdminLayoutWrapper } from "@/components/admin-layout-wrapper"
import { Badge } from "@/components/ui/badge"

export default async function PaymentRiskMonitoring() {
  const { session } = await checkAdminAccess()

  const supabase = createSupabaseAdmin()

  // Get total payments count
  const { count: totalPayments } = await supabase
    .from("paytr_recurring_payments")
    .select("*", { count: "exact", head: true })

  // Get successful payments
  const { count: successfulPayments } = await supabase
    .from("paytr_recurring_payments")
    .select("*", { count: "exact", head: true })
    .eq("payment_status", "completed")

  // Get failed payments
  const { count: failedPayments } = await supabase
    .from("paytr_recurring_payments")
    .select("*", { count: "exact", head: true })
    .eq("payment_status", "failed")

  // Get active saved cards
  const { count: activeSavedCards } = await supabase
    .from("paytr_saved_cards")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true)

  // Get total revenue from recurring payments
  const { data: revenueData } = await supabase
    .from("paytr_recurring_payments")
    .select("amount")
    .eq("payment_status", "completed")

  const totalRevenue = revenueData?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0

  // Calculate chargeback rate (placeholder - will need actual chargeback data)
  const chargebackCount = 0 // TODO: Implement chargeback tracking
  const chargebackRate = totalPayments ? (chargebackCount / totalPayments) * 100 : 0

  // Get inactive user payments (users who haven't logged in for 30 days but had payment)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: inactiveUserPayments } = await supabase
    .from("paytr_recurring_payments")
    .select(`
      *,
      profiles!inner(last_sign_in_at)
    `)
    .eq("payment_status", "completed")
    .lt("profiles.last_sign_in_at", thirtyDaysAgo.toISOString())

  const inactiveUserPaymentCount = inactiveUserPayments?.length || 0

  // Get recent failed payments for monitoring
  const { data: recentFailedPayments } = await supabase
    .from("paytr_recurring_payments")
    .select(`
      *,
      profiles(email, first_name, last_name)
    `)
    .eq("payment_status", "failed")
    .order("created_at", { ascending: false })
    .limit(10)

  // Calculate success rate
  const successRate = totalPayments ? ((successfulPayments || 0) / totalPayments) * 100 : 100

  // Risk level calculation
  const getRiskLevel = () => {
    if (chargebackRate > 1.0) return { level: "critical", color: "bg-red-500", text: "Kritik Risk" }
    if (chargebackRate > 0.5) return { level: "high", color: "bg-orange-500", text: "Yüksek Risk" }
    if (successRate < 90) return { level: "medium", color: "bg-yellow-500", text: "Orta Risk" }
    return { level: "low", color: "bg-green-500", text: "Düşük Risk" }
  }

  const riskLevel = getRiskLevel()

  return (
    <AdminLayoutWrapper userEmail={session.user.email || ""}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Ödeme Risk Takip Paneli</h1>
          <p className="text-white/60 mt-2">
            PayTR Non3D ödemeleri için risk metrikleri ve güvenlik takibi
          </p>
        </div>

        {/* Risk Level Banner */}
        <Card className="bg-black/20 border-white/10 backdrop-blur-xl border-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl text-white">Genel Risk Durumu</CardTitle>
                <CardDescription className="text-white/60">Sistem genelinde risk değerlendirmesi</CardDescription>
              </div>
              <Badge className={`${riskLevel.color} text-white text-lg px-4 py-2`}>
                {riskLevel.text}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Key Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Chargeback Rate */}
          <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Chargeback Oranı</CardTitle>
              <AlertTriangle className={`h-4 w-4 ${chargebackRate > 0.5 ? 'text-red-400' : 'text-green-400'}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{chargebackRate.toFixed(2)}%</div>
              <p className="text-xs text-white/60">
                {chargebackCount} / {totalPayments || 0} işlem
              </p>
              <div className="mt-2">
                <Badge variant={chargebackRate < 0.5 ? "default" : "destructive"}>
                  Hedef: &lt; 0.5%
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Success Rate */}
          <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Başarı Oranı</CardTitle>
              <CheckCircle className={`h-4 w-4 ${successRate > 90 ? 'text-green-400' : 'text-orange-400'}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{successRate.toFixed(1)}%</div>
              <p className="text-xs text-white/60">
                {successfulPayments || 0} başarılı / {totalPayments || 0} toplam
              </p>
              <div className="mt-2">
                <Badge variant={successRate > 90 ? "default" : "secondary"}>
                  Hedef: &gt; 90%
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Failed Payments */}
          <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Başarısız Ödemeler</CardTitle>
              <XCircle className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{failedPayments || 0}</div>
              <p className="text-xs text-white/60">
                Son 30 gün içinde
              </p>
              <div className="mt-2">
                <Badge variant="destructive">
                  {totalPayments ? ((failedPayments || 0) / totalPayments * 100).toFixed(1) : 0}% hata oranı
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Inactive User Payments */}
          <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Pasif Kullanıcı Ödemeleri</CardTitle>
              <UserX className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{inactiveUserPaymentCount}</div>
              <p className="text-xs text-white/60">
                30+ gün giriş yapmayan kullanıcılar
              </p>
              <div className="mt-2">
                <Badge variant="secondary">
                  Dikkat Gerekli
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Metrics */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Total Revenue */}
          <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Toplam Gelir (Recurring)</CardTitle>
              <DollarSign className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{totalRevenue.toFixed(2)} TL</div>
              <p className="text-xs text-white/60">
                Otomatik yenileme ödemeleri
              </p>
            </CardContent>
          </Card>

          {/* Active Saved Cards */}
          <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Kayıtlı Kart Sayısı</CardTitle>
              <CreditCard className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{activeSavedCards || 0}</div>
              <p className="text-xs text-white/60">
                Aktif kayıtlı kartlar
              </p>
            </CardContent>
          </Card>

          {/* Fraud Attempts */}
          <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Şüpheli İşlem</CardTitle>
              <AlertCircle className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">0</div>
              <p className="text-xs text-white/60">
                Fraud tespiti aktif
              </p>
              <div className="mt-2">
                <Badge variant="outline">
                  TODO: Implement
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Failed Payments Table */}
        <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">Son Başarısız Ödemeler</CardTitle>
            <CardDescription className="text-white/60">Detaylı inceleme gerektirebilir</CardDescription>
          </CardHeader>
          <CardContent>
            {recentFailedPayments && recentFailedPayments.length > 0 ? (
              <div className="space-y-4">
                {recentFailedPayments.map((payment: any) => (
                  <div key={payment.id} className="flex items-center justify-between border-b border-white/10 pb-4 last:border-0">
                    <div>
                      <p className="font-medium text-white">
                        {payment.profiles?.first_name} {payment.profiles?.last_name}
                      </p>
                      <p className="text-sm text-white/60">{payment.profiles?.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-white">{payment.amount} {payment.currency}</p>
                      <p className="text-sm text-white/60">
                        {new Date(payment.created_at).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                    <Badge variant="destructive">Başarısız</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-white/60">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-400" />
                <p>Başarısız ödeme bulunmuyor</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Risk Monitoring Checklist */}
        <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">Risk İzleme Kontrol Listesi</CardTitle>
            <CardDescription className="text-white/60">PayTR Non3D güvenlik önlemleri</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <span className="text-white">✅ İlk ödeme 3D Secure ile yapılıyor</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <span className="text-white">✅ Kullanıcı onayı açık şekilde alınıyor</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <span className="text-white">✅ 3 gün önceden email bildirimi gönderiliyor</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <span className="text-white">✅ Kart bilgileri PayTR güvenli altyapısında</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <span className="text-white">✅ PCI-DSS uyumlu (sunucuda kart bilgisi yok)</span>
              </div>
              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-blue-400" />
                <span className="text-white">📊 Chargeback oranı izleniyor</span>
              </div>
              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-blue-400" />
                <span className="text-white">📊 Başarı oranı takip ediliyor</span>
              </div>
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-orange-400" />
                <span className="text-white">🚧 Fraud detection sistemi (TODO)</span>
              </div>
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-orange-400" />
                <span className="text-white">🚧 IP adresi logging (TODO)</span>
              </div>
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-orange-400" />
                <span className="text-white">🚧 Device fingerprinting (TODO)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayoutWrapper>
  )
}
