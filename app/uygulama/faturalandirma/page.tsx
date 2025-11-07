"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PaginationModern } from "@/components/ui/pagination-modern"
import { CreditCard, Download, CheckCircle2, XCircle, Clock, Receipt, Wallet, DollarSign, ArrowUpDown, Search } from "lucide-react"
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

  // Search and sorting states
  const [searchTerm, setSearchTerm] = useState("")
  const [transactionsSortBy, setTransactionsSortBy] = useState("tarih")
  const [transactionsSortOrder, setTransactionsSortOrder] = useState<"asc" | "desc">("desc")
  const [invoicesSortBy, setInvoicesSortBy] = useState("tarih")
  const [invoicesSortOrder, setInvoicesSortOrder] = useState<"asc" | "desc">("desc")

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

  // Filtered and sorted transactions
  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = transactions.filter((transaction) => {
      const searchLower = searchTerm.toLowerCase()
      return (
        transaction.amount.toString().toLowerCase().includes(searchLower) ||
        transaction.currency.toLowerCase().includes(searchLower) ||
        transaction.payment_method.toLowerCase().includes(searchLower) ||
        transaction.status.toLowerCase().includes(searchLower)
      )
    })

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0
      if (transactionsSortBy === "tarih") {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      } else if (transactionsSortBy === "tutar") {
        comparison = Number.parseFloat(a.amount) - Number.parseFloat(b.amount)
      } else if (transactionsSortBy === "durum") {
        comparison = a.status.localeCompare(b.status)
      }
      return transactionsSortOrder === "asc" ? comparison : -comparison
    })

    return filtered
  }, [transactions, searchTerm, transactionsSortBy, transactionsSortOrder])

  // Filtered and sorted invoices
  const filteredAndSortedInvoices = useMemo(() => {
    let filtered = invoices.filter((invoice) => {
      const searchLower = searchTerm.toLowerCase()
      return (
        invoice.invoice_number.toLowerCase().includes(searchLower) ||
        invoice.amount.toString().toLowerCase().includes(searchLower) ||
        invoice.currency.toLowerCase().includes(searchLower) ||
        invoice.status.toLowerCase().includes(searchLower)
      )
    })

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0
      if (invoicesSortBy === "tarih") {
        comparison = new Date(a.invoice_date).getTime() - new Date(b.invoice_date).getTime()
      } else if (invoicesSortBy === "tutar") {
        comparison = a.amount - b.amount
      } else if (invoicesSortBy === "faturaNo") {
        comparison = a.invoice_number.localeCompare(b.invoice_number)
      } else if (invoicesSortBy === "durum") {
        comparison = a.status.localeCompare(b.status)
      }
      return invoicesSortOrder === "asc" ? comparison : -comparison
    })

    return filtered
  }, [invoices, searchTerm, invoicesSortBy, invoicesSortOrder])

  // Pagination calculations
  const totalTransactionsPages = Math.ceil(filteredAndSortedTransactions.length / itemsPerPage)
  const startTransactionsIndex = (transactionsPage - 1) * itemsPerPage
  const endTransactionsIndex = startTransactionsIndex + itemsPerPage
  const currentTransactions = filteredAndSortedTransactions.slice(startTransactionsIndex, endTransactionsIndex)

  const totalInvoicesPages = Math.ceil(filteredAndSortedInvoices.length / itemsPerPage)
  const startInvoicesIndex = (invoicesPage - 1) * itemsPerPage
  const endInvoicesIndex = startInvoicesIndex + itemsPerPage
  const currentInvoices = filteredAndSortedInvoices.slice(startInvoicesIndex, endInvoicesIndex)

  const handleTransactionsSort = (column: string) => {
    if (transactionsSortBy === column) {
      setTransactionsSortOrder(transactionsSortOrder === "asc" ? "desc" : "asc")
    } else {
      setTransactionsSortBy(column)
      setTransactionsSortOrder("asc")
    }
  }

  const handleInvoicesSort = (column: string) => {
    if (invoicesSortBy === column) {
      setInvoicesSortOrder(invoicesSortOrder === "asc" ? "desc" : "asc")
    } else {
      setInvoicesSortBy(column)
      setInvoicesSortOrder("asc")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
      case "paid":
        return (
          <Badge className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-transparent hover:from-emerald-700 hover:to-teal-800 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            {status === "completed" ? "Tamamlandı" : "Ödendi"}
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-gradient-to-r from-orange-600 to-amber-700 text-white border-transparent hover:from-orange-700 hover:to-amber-800 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Beklemede
          </Badge>
        )
      case "failed":
        return (
          <Badge className="bg-gradient-to-r from-red-600 to-rose-700 text-white border-transparent hover:from-red-700 hover:to-rose-800 flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Başarısız
          </Badge>
        )
      default:
        return (
          <Badge className="bg-gradient-to-r from-gray-600 to-slate-700 text-white border-transparent flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Hazırlanıyor
          </Badge>
        )
    }
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {/* Hero Section */}
      <Card className="bg-gradient-to-r from-emerald-600 to-teal-700 dark:from-emerald-700 dark:to-teal-800 text-white border-transparent shadow-xl rounded-xl">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <Wallet className="h-8 w-8" />
                Faturalandırma
              </h2>
              <p className="text-emerald-100 text-lg">Ödeme geçmişinizi ve faturalarınızı görüntüleyin ve yönetin</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Bar */}
      <Card className="shadow-lg">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-white/60" />
            <Input
              placeholder="Ödeme veya fatura ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white dark:bg-black/10 border border-gray-200 dark:border-white/10 focus-visible:border-emerald-500 dark:focus-visible:border-emerald-400 focus-visible:shadow-[0_0_0_0.5px_rgb(16,185,129)] dark:focus-visible:shadow-[0_0_0_0.5px_rgb(52,211,153)] transition-all duration-200 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-white/50"
              autoComplete="off"
              spellCheck="false"
            />
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Ödeme Geçmişi
          </CardTitle>
          <CardDescription>Geçmiş ödemelerinizi görüntüleyin</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-gray-500 dark:text-white/60 text-center py-8">Yükleniyor...</p>
          ) : filteredAndSortedTransactions.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="mx-auto h-12 w-12 text-gray-400 dark:text-white/40 mb-4" />
              <p className="text-gray-500 dark:text-white/60">
                {searchTerm ? "Arama kriterlerine uygun ödeme bulunamadı" : "Henüz ödeme kaydı bulunmuyor"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-white dark:bg-black/20">
                      <TableHead
                        className="font-semibold text-gray-700 dark:text-white/70 cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400"
                        onClick={() => handleTransactionsSort("tarih")}
                      >
                        <div className="flex items-center gap-1">
                          Tarih
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead
                        className="font-semibold text-gray-700 dark:text-white/70 cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400"
                        onClick={() => handleTransactionsSort("tutar")}
                      >
                        <div className="flex items-center gap-1">
                          Tutar
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-white/70">Ödeme Yöntemi</TableHead>
                      <TableHead
                        className="font-semibold text-gray-700 dark:text-white/70 cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400"
                        onClick={() => handleTransactionsSort("durum")}
                      >
                        <div className="flex items-center gap-1">
                          Durum
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>
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
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            {new Date(transaction.created_at).toLocaleDateString("tr-TR", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </div>
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
              {filteredAndSortedTransactions.length > itemsPerPage && (
                <PaginationModern
                  currentPage={transactionsPage}
                  totalPages={totalTransactionsPages}
                  totalItems={filteredAndSortedTransactions.length}
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
            Faturalarım
          </CardTitle>
          <CardDescription>Faturalarınızı görüntüleyin ve indirin</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-gray-500 dark:text-white/60 text-center py-8">Yükleniyor...</p>
          ) : filteredAndSortedInvoices.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="mx-auto h-12 w-12 text-gray-400 dark:text-white/40 mb-4" />
              <p className="text-gray-500 dark:text-white/60">
                {searchTerm ? "Arama kriterlerine uygun fatura bulunamadı" : "Henüz fatura bulunmuyor"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-white dark:bg-black/20">
                      <TableHead
                        className="font-semibold text-gray-700 dark:text-white/70 cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400"
                        onClick={() => handleInvoicesSort("faturaNo")}
                      >
                        <div className="flex items-center gap-1">
                          Fatura No
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead
                        className="font-semibold text-gray-700 dark:text-white/70 cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400"
                        onClick={() => handleInvoicesSort("tarih")}
                      >
                        <div className="flex items-center gap-1">
                          Tarih
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead
                        className="font-semibold text-gray-700 dark:text-white/70 cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400"
                        onClick={() => handleInvoicesSort("tutar")}
                      >
                        <div className="flex items-center gap-1">
                          Tutar
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead
                        className="font-semibold text-gray-700 dark:text-white/70 cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400"
                        onClick={() => handleInvoicesSort("durum")}
                      >
                        <div className="flex items-center gap-1">
                          Durum
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead className="text-right font-semibold text-gray-700 dark:text-white/70">İşlemler</TableHead>
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
                        <TableCell className="font-mono font-semibold text-gray-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            <Receipt className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            {invoice.invoice_number}
                          </div>
                        </TableCell>
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
                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
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
                            <Button variant="ghost" size="sm" disabled className="dark:text-white/60">
                              <Clock className="h-4 w-4 mr-2" />
                              Hazırlanıyor
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {filteredAndSortedInvoices.length > itemsPerPage && (
                <PaginationModern
                  currentPage={invoicesPage}
                  totalPages={totalInvoicesPages}
                  totalItems={filteredAndSortedInvoices.length}
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
