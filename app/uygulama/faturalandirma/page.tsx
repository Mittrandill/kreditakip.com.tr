"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CreditCard, Download, Calendar, CheckCircle2, XCircle, Clock, Crown, Receipt, Wallet } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useSubscription } from "@/hooks/use-subscription"
import { createBrowserClient } from "@supabase/ssr"

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface PaymentTransaction {
  id: string
  amount: string
  currency: string
  status: string
  payment_method: string
  created_at: string
  iyzico_payment_id: string | null
}

interface Invoice {
  id: string
  invoice_number: string
  invoice_date: string
  amount: number
  currency: string
  status: string
  file_url: string | null
  file_name: string | null
  payment_date: string | null
  subscription_id: string | null
}

export default function FaturalandirmaPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { subscription, isPremium, loading: subscriptionLoading } = useSubscription()
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      if (!user) {
        return
      }


      try {
        // Fetch transactions
        const { data: transactionsData, error: transactionsError } = await supabase
          .from("payment_transactions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (transactionsError) {
          console.error("[faturalandirma] Transactions error:", transactionsError)
          throw transactionsError
        }
        setTransactions(transactionsData || [])

        // Fetch invoices
        const { data: invoicesData, error: invoicesError } = await supabase
          .from("invoices")
          .select("*")
          .eq("user_id", user.id)
          .order("invoice_date", { ascending: false })

        if (invoicesError) {
          console.error("[faturalandirma] Invoices error:", invoicesError)
          throw invoicesError
        }
        setInvoices(invoicesData || [])
      } catch (error) {
        console.error("[faturalandirma] Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Tamamlandı
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            <Clock className="h-3 w-3 mr-1" />
            Beklemede
          </Badge>
        )
      case "failed":
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            <XCircle className="h-3 w-3 mr-1" />
            Başarısız
          </Badge>
        )
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <Card className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white border-transparent shadow-xl rounded-xl">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <Wallet className="h-8 w-8" />
                Faturalandırma
              </h2>
              <p className="text-blue-100 text-lg">Abonelik durumunuzu ve ödeme geçmişinizi görüntüleyin ve yönetin</p>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* </CHANGE> */}

      {/* Subscription Status */}
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            Mevcut Abonelik
          </CardTitle>
          <CardDescription>Abonelik durumunuz ve detayları</CardDescription>
        </CardHeader>
        <CardContent>
          {subscriptionLoading ? (
            <p className="text-gray-500">Yükleniyor...</p>
          ) : isPremium ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg border-2 border-amber-200 dark:border-amber-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg">
                    <Crown className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-amber-900 dark:text-amber-100">Premium Üyelik</h3>
                    <p className="text-sm text-amber-700 dark:text-amber-300">Tüm özelliklere sınırsız erişim</p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Aktif</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-white/60 mb-1">Ödeme Yöntemi</p>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    <p className="font-medium">Kredi Kartı</p>
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-white/60 mb-1">Bitiş Tarihi</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <p className="font-medium">
                      {subscription?.expiresAt
                        ? new Date(subscription.expiresAt).toLocaleDateString("tr-TR")
                        : "Süresiz"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">Aktif premium aboneliğiniz bulunmuyor</p>
              <Button onClick={() => router.push("/uygulama/premium")}>
                <Crown className="h-4 w-4 mr-2" />
                Premium'a Geç
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-emerald-600" />
            Ödeme Geçmişi
          </CardTitle>
          <CardDescription>Geçmiş ödemelerinizi görüntüleyin</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-gray-500 text-center py-8">Yükleniyor...</p>
          ) : transactions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Henüz ödeme kaydı bulunmuyor</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Tutar</TableHead>
                    <TableHead>Ödeme Yöntemi</TableHead>
                    <TableHead>Durum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {new Date(transaction.created_at).toLocaleDateString("tr-TR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="font-medium">
                        {Number.parseFloat(transaction.amount).toFixed(2)} {transaction.currency}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          {transaction.payment_method === "credit_card" ? "Kredi Kartı" : transaction.payment_method}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoices */}
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-blue-600" />
            Faturalarım
          </CardTitle>
          <CardDescription>Faturalarınızı görüntüleyin ve indirin</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-gray-500 text-center py-8">Yükleniyor...</p>
          ) : invoices.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Henüz fatura bulunmuyor</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fatura No</TableHead>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Tutar</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="text-right">Fatura</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono font-medium">{invoice.invoice_number}</TableCell>
                      <TableCell>
                        {new Date(invoice.invoice_date).toLocaleDateString("tr-TR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="font-medium">
                        {Number(invoice.amount).toFixed(2)} {invoice.currency}
                      </TableCell>
                      <TableCell>
                        {invoice.status === "paid" ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Ödendi
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                            <Clock className="h-3 w-3 mr-1" />
                            Hazırlanıyor
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {invoice.file_url ? (
                          <Button variant="outline" size="sm" onClick={() => window.open(invoice.file_url!, "_blank")}>
                            <Download className="h-4 w-4 mr-2" />
                            PDF İndir
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm" disabled>
                            <Clock className="h-4 w-4 mr-2" />
                            PDF Hazırlanıyor
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
