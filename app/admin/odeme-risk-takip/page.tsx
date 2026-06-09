import { checkAdminAccess } from "@/lib/admin-check"
import { createSupabaseAdmin } from "@/lib/supabase-server"
import { AdminLayoutWrapper } from "@/components/admin-layout-wrapper"
import { StatCard, SectionTitle } from "@/components/admin/stat-card"
import { Badge } from "@/components/ui/badge"
import { DollarSign, CheckCircle, AlertTriangle, TrendingUp, Receipt, Inbox } from "lucide-react"

export const revalidate = 0

export default async function PaymentMonitoring() {
  const { session } = await checkAdminAccess()
  const supabase = createSupabaseAdmin()

  // Completed payments → revenue
  const { data: completed } = await supabase
    .from("payment_transactions")
    .select("amount, created_at")
    .eq("status", "completed")

  const totalRevenue = completed?.reduce((s, t) => s + Number(t.amount), 0) || 0
  const completedCount = completed?.length || 0

  const since30 = new Date()
  since30.setDate(since30.getDate() - 30)
  const last30 = completed?.filter((t) => new Date(t.created_at) >= since30) || []
  const last30Revenue = last30.reduce((s, t) => s + Number(t.amount), 0)

  // Recent payments (with buyer)
  const { data: recentPayments } = await supabase
    .from("payment_transactions")
    .select("id, amount, currency, status, payment_provider, plan_id, created_at, profiles:user_id(first_name,last_name,email)")
    .order("created_at", { ascending: false })
    .limit(10)

  // Unmatched Shopier orders (need manual attention)
  const { data: unmatched } = await supabase
    .from("shopier_unmatched_orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20)

  const unmatchedOpen = (unmatched || []).filter((o: any) => !o.resolved)

  const reasonLabel: Record<string, string> = {
    user_not_found: "Kullanıcı yok",
    user_creation_failed: "Hesap açılamadı",
    unknown_product: "Bilinmeyen ürün",
    invalid_signature: "Geçersiz imza",
  }

  return (
    <AdminLayoutWrapper userEmail={session.user.email || ""}>
      <div className="space-y-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400/80">Finans</p>
          <h1 className="mt-2 text-3xl lg:text-4xl font-bold tracking-tight text-white">Ödeme İzleme</h1>
          <p className="mt-2 text-sm text-white/50">Shopier ödemeleri, gelir ve elle müdahale gereken siparişler.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Toplam Gelir" value={`${totalRevenue.toLocaleString("tr-TR")} ₺`} hint="Tamamlanan ödemeler" icon={DollarSign} accent="emerald" />
          <StatCard label="Son 30 Gün" value={`${last30Revenue.toLocaleString("tr-TR")} ₺`} hint={`${last30.length} ödeme`} icon={TrendingUp} accent="teal" />
          <StatCard label="Tamamlanan İşlem" value={completedCount} hint="Başarılı ödeme" icon={CheckCircle} accent="blue" />
          <StatCard label="Eşleşmeyen Sipariş" value={unmatchedOpen.length} hint="Elle müdahale gerekli" icon={AlertTriangle} accent={unmatchedOpen.length > 0 ? "rose" : "slate"} />
        </div>

        {/* Unmatched orders — only show if any */}
        {unmatchedOpen.length > 0 && (
          <section>
            <SectionTitle hint="elle çözülmeli">Eşleşmeyen Siparişler</SectionTitle>
            <div className="overflow-hidden rounded-2xl border border-rose-500/20 bg-rose-500/[0.03]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.07] text-left text-white/50">
                    <th className="py-3 px-4 font-medium">Sipariş No</th>
                    <th className="py-3 px-4 font-medium">E-posta</th>
                    <th className="py-3 px-4 font-medium">Plan</th>
                    <th className="py-3 px-4 font-medium">Tutar</th>
                    <th className="py-3 px-4 font-medium">Sebep</th>
                    <th className="py-3 px-4 font-medium">Tarih</th>
                  </tr>
                </thead>
                <tbody>
                  {unmatchedOpen.map((o: any) => (
                    <tr key={o.id} className="border-b border-white/[0.04] last:border-0">
                      <td className="py-3 px-4 font-mono text-white/80">{o.order_id}</td>
                      <td className="py-3 px-4 text-white/80">{o.buyer_email}</td>
                      <td className="py-3 px-4 text-white/60">{o.plan_id || "—"}</td>
                      <td className="py-3 px-4 text-white font-medium">{o.amount ? `${Number(o.amount).toFixed(2)} ₺` : "—"}</td>
                      <td className="py-3 px-4">
                        <Badge className="bg-rose-500/15 text-rose-300 border-rose-500/20 text-xs">
                          {reasonLabel[o.reason] || o.reason || "Bilinmiyor"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-white/50">{new Date(o.created_at).toLocaleDateString("tr-TR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Recent payments */}
        <section>
          <SectionTitle hint="son 10 ödeme">Son Ödemeler</SectionTitle>
          <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02]">
            {recentPayments && recentPayments.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.07] text-left text-white/50">
                    <th className="py-3 px-4 font-medium">Kullanıcı</th>
                    <th className="py-3 px-4 font-medium">Plan</th>
                    <th className="py-3 px-4 font-medium">Tutar</th>
                    <th className="py-3 px-4 font-medium">Sağlayıcı</th>
                    <th className="py-3 px-4 font-medium">Durum</th>
                    <th className="py-3 px-4 font-medium">Tarih</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPayments.map((p: any) => (
                    <tr key={p.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]">
                      <td className="py-3 px-4">
                        <p className="text-white font-medium">{[p.profiles?.first_name, p.profiles?.last_name].filter(Boolean).join(" ") || "—"}</p>
                        <p className="text-white/45 text-xs">{p.profiles?.email}</p>
                      </td>
                      <td className="py-3 px-4 text-white/60">{p.plan_id || "—"}</td>
                      <td className="py-3 px-4 text-white font-medium">{Number(p.amount).toFixed(2)} {p.currency || "TRY"}</td>
                      <td className="py-3 px-4">
                        <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/20 text-xs capitalize">{p.payment_provider || "—"}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        {p.status === "completed" ? (
                          <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/20 text-xs">Tamamlandı</Badge>
                        ) : (
                          <Badge className="bg-white/10 text-white/60 border-white/10 text-xs capitalize">{p.status}</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-white/50">{new Date(p.created_at).toLocaleDateString("tr-TR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-12 text-center text-white/40">
                <Inbox className="mx-auto mb-3 h-10 w-10 text-white/20" />
                <p>Henüz ödeme kaydı yok</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </AdminLayoutWrapper>
  )
}
