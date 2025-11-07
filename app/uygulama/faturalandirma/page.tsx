"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PaginationModern } from "@/components/ui/pagination-modern"
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

  // Pagination states
  const [transactionsPage, setTransactionsPage] = useState(1)
  const [invoicesPage, setInvoicesPage] = useState(1)
  const itemsPerPage = 8

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

  // Pagination calculations
  const totalTransactionsPages = Math.ceil(transactions.length / itemsPerPage)
  const startTransactionsIndex = (transactionsPage - 1) * itemsPerPage
  const endTransactionsIndex = startTransactionsIndex + itemsPerPage
  const currentTransactions = transactions.slice(startTransactionsIndex, endTransactionsIndex)

  const totalInvoicesPages = Math.ceil(invoices.length / itemsPerPage)
  const startInvoicesIndex = (invoicesPage - 1) * itemsPerPage
  const endInvoicesIndex = startInvoicesIndex + itemsPerPage
  const currentInvoices = invoices.slice(startInvoicesIndex, endInvoicesIndex)

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
      <Card className="bg-gradient-to-r from-emerald-600 to-teal-700 dark:from-emerald-700 dark:to-teal-800 text-white border-transparent shadow-xl rounded-xl">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <Wallet className="h-8 w-8" />
                Faturalandırma
              </h2>
              <p className="text-emerald-100 text-lg">Abonelik durumunuzu ve ödeme geçmişinizi görüntüleyin ve yönetin</p>
            </div>
          </div>
        </CardContent>
      </Card>

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
            <p className="text-gray-500 dark:text-white/60 text-center py-8">Yükleniyor...</p>
          ) : transactions.length === 0 ? (
            <p className="text-gray-500 dark:text-white/60 text-center py-8">Henüz ödeme kaydı bulunmuyor</p>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-white dark:bg-black/20">
                      <TableHead className="font-semibold text-gray-700 dark:text-white/70">Tarih</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-white/70">Tutar</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-white/70">Ödeme Yöntemi</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-white/70">Durum</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentTransactions.map((transaction, index) => (
                      <TableRow
                        key={transaction.id}
                        className={`hover:bg-emerald-50 dark:hover:bg-white/10 transition-colors duration-150 ease-in-out ${
                          index % 2 === 0 ? "bg-white dark:bg-black/20" : "bg-gray-50/50 dark:bg-black/10"
                        }`}
                      >
                        <TableCell className="text-gray-900 dark:text-white">
                          {new Date(transaction.created_at).toLocaleDateString("tr-TR", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </TableCell>
                        <TableCell className="font-semibold text-gray-900 dark:text-white">
                          {Number.parseFloat(transaction.amount).toFixed(2)} {transaction.currency}
                        </TableCell>
                        <TableCell className="text-gray-600 dark:text-white/70">
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
              {transactions.length > itemsPerPage && (
                <PaginationModern
                  currentPage={transactionsPage}
                  totalPages={totalTransactionsPages}
                  totalItems={transactions.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setTransactionsPage}
                  itemName="ödeme"
                />
              )}
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
            <p className="text-gray-500 dark:text-white/60 text-center py-8">Yükleniyor...</p>
          ) : invoices.length === 0 ? (
            <p className="text-gray-500 dark:text-white/60 text-center py-8">Henüz fatura bulunmuyor</p>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-white dark:bg-black/20">
                      <TableHead className="font-semibold text-gray-700 dark:text-white/70">Fatura No</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-white/70">Tarih</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-white/70">Tutar</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-white/70">Durum</TableHead>
                      <TableHead className="text-right font-semibold text-gray-700 dark:text-white/70">Fatura</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentInvoices.map((invoice, index) => (
                      <TableRow
                        key={invoice.id}
                        className={`hover:bg-emerald-50 dark:hover:bg-white/10 transition-colors duration-150 ease-in-out ${
                          index % 2 === 0 ? "bg-white dark:bg-black/20" : "bg-gray-50/50 dark:bg-black/10"
                        }`}
                      >
                        <TableCell className="font-mono font-semibold text-gray-900 dark:text-white">{invoice.invoice_number}</TableCell>
                        <TableCell className="text-gray-900 dark:text-white">
                          {new Date(invoice.invoice_date).toLocaleDateString("tr-TR", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </TableCell>
                        <TableCell className="font-semibold text-gray-900 dark:text-white">
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
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(invoice.file_url!, "_blank")}
                              className="dark:bg-black/20 dark:text-white dark:border-white/10 dark:hover:bg-white/10"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              PDF İndir
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled
                              className="dark:text-white/60"
                            >
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
              {invoices.length > itemsPerPage && (
                <PaginationModern
                  currentPage={invoicesPage}
                  totalPages={totalInvoicesPages}
                  totalItems={invoices.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setInvoicesPage}
                  itemName="fatura"
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
