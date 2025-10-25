import { checkAdminAccess } from "@/lib/admin-check"
import { createSupabaseServer } from "@/lib/supabase-server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, User, Mail, Phone, Calendar, CreditCard, FileText, ShieldCheck } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function UserDetail({ params }: { params: { id: string } }) {
  await checkAdminAccess()
  const supabase = createSupabaseServer()

  // Get user details
  const { data: user } = await supabase
    .from("profiles")
    .select(`
      *,
      subscriptions (
        id,
        plan_type,
        status,
        started_at,
        expires_at,
        created_at,
        updated_at
      )
    `)
    .eq("id", params.id)
    .single()

  if (!user) {
    notFound()
  }

  // Get user's invoices
  const { data: invoices } = await supabase
    .from("invoices")
    .select("*")
    .eq("user_id", params.id)
    .order("invoice_date", { ascending: false })

  // Get user's credits
  const { data: credits } = await supabase
    .from("credits")
    .select("*")
    .eq("user_id", params.id)
    .order("created_at", { ascending: false })
    .limit(10)

  const subscription = user.subscriptions?.[0]

  const planNames: Record<string, string> = {
    free: "Ücretsiz",
    premium: "Premium",
  }

  const planPrices: Record<string, string> = {
    free: "0 TL/ay",
    premium: "299 TL/ay",
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/kullanicilar">
            <Button variant="outline" size="icon" className="bg-black/20 border-white/10">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-bold mb-2">Kullanıcı Detayı</h1>
            <p className="text-white/60">Kullanıcı bilgileri ve işlem geçmişi</p>
          </div>
        </div>
        <Link href={`/admin/faturalar/yeni?userId=${params.id}`}>
          <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
            <FileText className="mr-2 h-4 w-4" />
            Fatura Oluştur
          </Button>
        </Link>
      </div>

      {/* User Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <User className="h-5 w-5" />
              Kişisel Bilgiler
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-white/60 text-sm mb-1">Ad Soyad</p>
              <p className="text-white font-medium">
                {[user.first_name, user.last_name].filter(Boolean).join(" ") || "-"}
              </p>
            </div>
            <div>
              <p className="text-white/60 text-sm mb-1 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                E-posta
              </p>
              <p className="text-white font-medium">{user.email || "-"}</p>
            </div>
            <div>
              <p className="text-white/60 text-sm mb-1 flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Telefon
              </p>
              <p className="text-white font-medium">{user.phone || "-"}</p>
            </div>
            <div>
              <p className="text-white/60 text-sm mb-1 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Kayıt Tarihi
              </p>
              <p className="text-white font-medium">
                {new Date(user.created_at).toLocaleDateString("tr-TR")}
              </p>
            </div>
            {user.is_admin && (
              <div className="pt-2 border-t border-white/10">
                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/20">
                  <ShieldCheck className="mr-1 h-3 w-3" />
                  Admin Kullanıcı
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-black/20 border-white/10 backdrop-blur-xl lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Abonelik Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {subscription ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-white/60 text-sm mb-1">Plan</p>
                    <p className="text-white font-medium text-lg">
                      {planNames[subscription.plan_type] || subscription.plan_type}
                    </p>
                    <p className="text-white/60 text-sm">
                      {planPrices[subscription.plan_type] || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm mb-1">Durum</p>
                    {subscription.status === "active" ? (
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
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <p className="text-white/60 text-sm mb-1">Başlangıç Tarihi</p>
                    <p className="text-white">
                      {subscription.started_at ? new Date(subscription.started_at).toLocaleDateString("tr-TR") : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm mb-1">Bitiş Tarihi</p>
                    <p className="text-white">
                      {subscription.expires_at ? new Date(subscription.expires_at).toLocaleDateString("tr-TR") : "-"}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-white/60 mb-4">Kullanıcının aktif aboneliği bulunmuyor</p>
                <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/20">
                  Ücretsiz Kullanıcı
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Invoices */}
      <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Faturalar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-white/80 font-semibold">Fatura No</th>
                  <th className="text-left py-3 px-4 text-white/80 font-semibold">Tarih</th>
                  <th className="text-left py-3 px-4 text-white/80 font-semibold">Tutar</th>
                  <th className="text-left py-3 px-4 text-white/80 font-semibold">Durum</th>
                  <th className="text-left py-3 px-4 text-white/80 font-semibold">Açıklama</th>
                  <th className="text-left py-3 px-4 text-white/80 font-semibold">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {invoices?.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 px-4 text-white font-mono">{invoice.invoice_number}</td>
                    <td className="py-4 px-4 text-white/80">
                      {new Date(invoice.invoice_date).toLocaleDateString("tr-TR")}
                    </td>
                    <td className="py-4 px-4 text-white font-semibold">
                      {invoice.amount.toFixed(2)} {invoice.currency}
                    </td>
                    <td className="py-4 px-4">
                      {invoice.status === "paid" ? (
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/20">
                          Ödendi
                        </Badge>
                      ) : invoice.status === "pending" ? (
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/20">
                          Bekliyor
                        </Badge>
                      ) : invoice.status === "overdue" ? (
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/20">
                          Gecikmiş
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/20">
                          İptal
                        </Badge>
                      )}
                    </td>
                    <td className="py-4 px-4 text-white/80">{invoice.description || "-"}</td>
                    <td className="py-4 px-4">
                      {invoice.file_url ? (
                        <a
                          href={invoice.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-teal-400 hover:text-teal-300 transition-colors"
                        >
                          İndir
                        </a>
                      ) : (
                        <span className="text-white/40">-</span>
                      )}
                    </td>
                  </tr>
                ))}
                {!invoices || invoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-white/60">
                      Henüz fatura bulunmuyor
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Credits */}
      <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white">Son Krediler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {credits?.slice(0, 5).map((credit) => (
              <div
                key={credit.id}
                className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
              >
                <div>
                  <p className="text-white font-medium">{credit.name}</p>
                  <p className="text-white/60 text-sm">
                    {new Date(credit.created_at).toLocaleDateString("tr-TR")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-white font-semibold">{credit.amount?.toLocaleString("tr-TR")} TL</p>
                  <p className="text-white/60 text-sm">{credit.credit_type}</p>
                </div>
              </div>
            ))}
            {!credits || credits.length === 0 ? (
              <p className="text-center text-white/60 py-4">Henüz kredi kaydı bulunmuyor</p>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
