import { checkAdminAccess } from "@/lib/admin-check"
import { createSupabaseAdmin } from "@/lib/supabase-server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, User, Mail, Phone, MapPin, Building2, FileText, CreditCard, Calendar } from "lucide-react"
import Link from "next/link"
import { AdminLayoutWrapper } from "@/components/admin-layout-wrapper"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface PageProps {
  params: {
    id: string
  }
}

export default async function UserDetailPage({ params }: PageProps) {
  const { session } = await checkAdminAccess()
  const supabase = createSupabaseAdmin()
  const userId = params.id

  // Get user profile
  const { data: user } = await supabase
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
    .eq("id", userId)
    .single()

  // Get billing info
  const { data: billingInfo } = await supabase
    .from("billing_info")
    .select("*")
    .eq("user_id", userId)
    .single()

  // Get payment transactions
  const { data: transactions } = await supabase
    .from("payment_transactions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  // Get invoices
  const { data: invoices } = await supabase
    .from("invoices")
    .select("*")
    .eq("user_id", userId)
    .order("invoice_date", { ascending: false })

  if (!user) {
    return (
      <AdminLayoutWrapper userEmail={session.user.email || ""}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Kullanıcı Bulunamadı</h2>
            <p className="text-white/60 mb-4">Bu kullanıcı sistemde mevcut değil</p>
            <Link href="/admin/kullanicilar">
              <Button className="bg-gradient-to-r from-emerald-500 to-teal-600">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kullanıcılara Dön
              </Button>
            </Link>
          </div>
        </div>
      </AdminLayoutWrapper>
    )
  }

  // Find active subscription
  const subscriptions = user.subscriptions || []
  const activeSubscription = subscriptions.find((s: any) => s.status === "active")
  const subscription = activeSubscription || subscriptions.sort((a: any, b: any) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )[0]

  const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ") || "-"

  return (
    <AdminLayoutWrapper userEmail={session.user.email || ""}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin/kullanicilar">
            <Button variant="outline" size="icon" className="bg-black/20 border-white/10">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-bold mb-2">Kullanıcı Detayı</h1>
            <p className="text-white/60">{fullName}</p>
          </div>
        </div>

        {/* User Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Abonelik Durumu</CardTitle>
              <CreditCard className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              {subscription ? (
                <>
                  <div className="text-2xl font-bold text-white mb-2">
                    {subscription.plan_type === "premium" ? "Premium" : "Ücretsiz"}
                  </div>
                  {subscription.status === "active" ? (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/20">
                      Aktif
                    </Badge>
                  ) : subscription.status === "cancelled" ? (
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/20">
                      İptal Edildi
                    </Badge>
                  ) : (
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/20">
                      Süresi Doldu
                    </Badge>
                  )}
                </>
              ) : (
                <div className="text-white/60">Abonelik Yok</div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Toplam Ödeme</CardTitle>
              <FileText className="h-4 w-4 text-teal-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {transactions?.reduce((sum, tx) => sum + Number(tx.amount), 0).toFixed(2) || "0.00"} ₺
              </div>
              <p className="text-xs text-white/60 mt-1">{transactions?.length || 0} ödeme</p>
            </CardContent>
          </Card>

          <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Kayıt Tarihi</CardTitle>
              <Calendar className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {new Date(user.created_at).toLocaleDateString("tr-TR")}
              </div>
              <p className="text-xs text-white/60 mt-1">
                {Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))} gün önce
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="billing" className="space-y-6">
          <TabsList className="bg-black/20 border border-white/10">
            <TabsTrigger value="billing" className="data-[state=active]:bg-emerald-500/20">
              Fatura Bilgileri
            </TabsTrigger>
            <TabsTrigger value="transactions" className="data-[state=active]:bg-emerald-500/20">
              İşlemler
            </TabsTrigger>
          </TabsList>

          {/* Billing Info Tab */}
          <TabsContent value="billing" className="space-y-6">
            <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-emerald-400" />
                  Fatura Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent>
                {billingInfo ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-white/60">
                        <User className="h-4 w-4" />
                        <span className="text-sm">Ad Soyad</span>
                      </div>
                      <p className="text-white font-medium">{billingInfo.full_name}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-white/60">
                        <Mail className="h-4 w-4" />
                        <span className="text-sm">E-posta</span>
                      </div>
                      <p className="text-white font-medium">{billingInfo.email}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-white/60">
                        <Phone className="h-4 w-4" />
                        <span className="text-sm">Telefon</span>
                      </div>
                      <p className="text-white font-medium">{billingInfo.phone}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-white/60">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm">Şehir</span>
                      </div>
                      <p className="text-white font-medium">{billingInfo.city}</p>
                    </div>

                    {billingInfo.district && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-white/60">
                          <MapPin className="h-4 w-4" />
                          <span className="text-sm">İlçe</span>
                        </div>
                        <p className="text-white font-medium">{billingInfo.district}</p>
                      </div>
                    )}

                    <div className="space-y-2 md:col-span-2">
                      <div className="flex items-center gap-2 text-white/60">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm">Adres</span>
                      </div>
                      <p className="text-white font-medium">{billingInfo.address}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-white/60">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm">Posta Kodu</span>
                      </div>
                      <p className="text-white font-medium">{billingInfo.postal_code || "-"}</p>
                    </div>

                    {billingInfo.tax_office && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-white/60">
                          <Building2 className="h-4 w-4" />
                          <span className="text-sm">Vergi Dairesi</span>
                        </div>
                        <p className="text-white font-medium">{billingInfo.tax_office}</p>
                      </div>
                    )}

                    {billingInfo.tax_number && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-white/60">
                          <Building2 className="h-4 w-4" />
                          <span className="text-sm">Vergi Numarası</span>
                        </div>
                        <p className="text-white font-medium">{billingInfo.tax_number}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Building2 className="h-12 w-12 text-white/20 mx-auto mb-4" />
                    <p className="text-white/60">Fatura bilgisi girilmemiş</p>
                    <p className="text-white/40 text-sm mt-2">
                      Kullanıcı henüz ödeme yapmamış
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-6">
            {/* Payment Transactions */}
            <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-emerald-400" />
                  Ödeme Geçmişi ({transactions?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {transactions && transactions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left py-3 px-4 text-white/80 font-semibold">İşlem ID</th>
                          <th className="text-left py-3 px-4 text-white/80 font-semibold">Tutar</th>
                          <th className="text-left py-3 px-4 text-white/80 font-semibold">Durum</th>
                          <th className="text-left py-3 px-4 text-white/80 font-semibold">Tarih</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((tx) => (
                          <tr key={tx.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="py-4 px-4 text-white/80 font-mono text-sm">
                              {tx.transaction_id || tx.id.slice(0, 8)}
                            </td>
                            <td className="py-4 px-4 text-white font-semibold">
                              {Number(tx.amount).toFixed(2)} {tx.currency}
                            </td>
                            <td className="py-4 px-4">
                              {tx.status === "success" || tx.status === "completed" ? (
                                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/20">
                                  Başarılı
                                </Badge>
                              ) : tx.status === "pending" ? (
                                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/20">
                                  Bekliyor
                                </Badge>
                              ) : (
                                <Badge className="bg-red-500/20 text-red-400 border-red-500/20">
                                  Başarısız
                                </Badge>
                              )}
                            </td>
                            <td className="py-4 px-4 text-white/80">
                              {new Date(tx.created_at).toLocaleString("tr-TR")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CreditCard className="h-12 w-12 text-white/20 mx-auto mb-4" />
                    <p className="text-white/60">Henüz ödeme kaydı yok</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Invoices */}
            <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="h-5 w-5 text-teal-400" />
                  Faturalar ({invoices?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {invoices && invoices.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left py-3 px-4 text-white/80 font-semibold">Fatura No</th>
                          <th className="text-left py-3 px-4 text-white/80 font-semibold">Tutar</th>
                          <th className="text-left py-3 px-4 text-white/80 font-semibold">Durum</th>
                          <th className="text-left py-3 px-4 text-white/80 font-semibold">Tarih</th>
                          <th className="text-left py-3 px-4 text-white/80 font-semibold">PDF</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.map((invoice) => (
                          <tr key={invoice.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="py-4 px-4 text-white font-mono text-sm">
                              {invoice.invoice_number}
                            </td>
                            <td className="py-4 px-4 text-white font-semibold">
                              {Number(invoice.amount).toFixed(2)} {invoice.currency}
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
                            <td className="py-4 px-4 text-white/80">
                              {new Date(invoice.invoice_date).toLocaleDateString("tr-TR")}
                            </td>
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
                                <span className="text-yellow-400 text-sm">PDF Yok</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-white/20 mx-auto mb-4" />
                    <p className="text-white/60">Henüz fatura kaydı yok</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayoutWrapper>
  )
}
