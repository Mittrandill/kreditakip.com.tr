"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, Filter, ChevronLeft, ChevronRight, Download } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { tr } from "date-fns/locale"

interface SubscriptionsTableClientProps {
  subscriptions: any[]
}

// Unlimited manual grants use a far-future date (year >= 2070).
const isUnlimited = (value: string | null | undefined) =>
  !!value && new Date(value).getFullYear() >= 2070

// An "active" row whose expiry date has already passed is effectively expired —
// the downgrade cron just hasn't processed it yet (or the user hasn't re-fetched).
const isExpiredByDate = (sub: any) =>
  sub.status === "active" &&
  sub.expires_at &&
  !isUnlimited(sub.expires_at) &&
  new Date(sub.expires_at) < new Date()

export function SubscriptionsTableClient({
  subscriptions,
}: SubscriptionsTableClientProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [planFilter, setPlanFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)

  // Filter subscriptions
  const filteredSubscriptions = useMemo(() => {
    let filtered = subscriptions || []

    // Search filter (user name or email)
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((sub) => {
        const fullName = [
          sub.profiles?.first_name,
          sub.profiles?.last_name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
        const email = (sub.profiles?.email || "").toLowerCase()

        return fullName.includes(query) || email.includes(query)
      })
    }

    // Plan filter
    if (planFilter !== "all") {
      filtered = filtered.filter((sub) => sub.plan_type === planFilter)
    }

    // Status filter (date-expired "active" rows count as expired, not active)
    if (statusFilter === "active") {
      filtered = filtered.filter((sub) => sub.status === "active" && !isExpiredByDate(sub))
    } else if (statusFilter === "expired") {
      filtered = filtered.filter((sub) => sub.status === "expired" || isExpiredByDate(sub))
    } else if (statusFilter !== "all") {
      filtered = filtered.filter((sub) => sub.status === statusFilter)
    }

    // Type filter (manual vs paid)
    if (typeFilter === "manual") {
      filtered = filtered.filter((sub) => !sub.payment_provider || sub.payment_provider === null)
    } else if (typeFilter === "paid") {
      filtered = filtered.filter((sub) => sub.payment_provider && sub.payment_provider !== null)
    }

    return filtered
  }, [subscriptions, searchQuery, planFilter, statusFilter, typeFilter])

  // Pagination
  const totalPages = Math.ceil(filteredSubscriptions.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedSubscriptions = filteredSubscriptions.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1)
  }, [searchQuery, planFilter, statusFilter, typeFilter])

  const planNames: Record<string, string> = {
    free: "Ücretsiz",
    pro: "Pro",
    premium: "Premium",
  }

  const fmtDate = (value: string | null | undefined) =>
    value ? format(new Date(value), "dd MMM yyyy", { locale: tr }) : "—"

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      "Kullanıcı",
      "E-posta",
      "Plan",
      "Durum",
      "Tip",
      "Başlangıç",
      "Bitiş",
      "Ödeme Sağlayıcı",
    ]
    const rows = filteredSubscriptions.map((sub) => {
      const fullName =
        [sub.profiles?.first_name, sub.profiles?.last_name]
          .filter(Boolean)
          .join(" ") || "-"
      const status =
        isExpiredByDate(sub)
          ? "Süresi Doldu"
          : sub.status === "active"
          ? "Aktif"
          : sub.status === "cancelled"
          ? "İptal"
          : sub.status === "expired"
          ? "Süresi Doldu"
          : sub.status === "free"
          ? "Ücretsiz"
          : sub.status
      const type = !sub.payment_provider || sub.payment_provider === null ? "Manuel" : "Ödeme"
      const plan = planNames[sub.plan_type] || sub.plan_type

      return [
        fullName,
        sub.profiles?.email || "-",
        plan,
        status,
        type,
        sub.start_date ? format(new Date(sub.start_date), "dd.MM.yyyy", { locale: tr }) : "-",
        sub.expires_at ? format(new Date(sub.expires_at), "dd.MM.yyyy", { locale: tr }) : "-",
        sub.payment_provider || "Manuel",
      ]
    })

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n")

    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute(
      "download",
      `abonelikler_${new Date().toISOString().split("T")[0]}.csv`
    )
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span>Tüm Kullanıcılar</span>
            <span className="text-sm font-normal text-white/60">
              {filteredSubscriptions.length === subscriptions.length
                ? `${filteredSubscriptions.length} kullanıcı`
                : `${filteredSubscriptions.length} / ${subscriptions.length} kullanıcı`}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            disabled={filteredSubscriptions.length === 0}
            className="bg-black/20 border-white/10 text-white hover:bg-white/10"
          >
            <Download className="mr-2 h-4 w-4" />
            CSV İndir
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input
              placeholder="Kullanıcı ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-black/20 border-white/10 text-white placeholder:text-white/40"
            />
          </div>

          {/* Plan Filter */}
          <Select value={planFilter} onValueChange={setPlanFilter}>
            <SelectTrigger className="bg-black/20 border-white/10 text-white">
              <Filter className="mr-2 h-4 w-4 text-white/40" />
              <SelectValue placeholder="Plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Planlar</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
              <SelectItem value="free">Ücretsiz</SelectItem>
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-black/20 border-white/10 text-white">
              <Filter className="mr-2 h-4 w-4 text-white/40" />
              <SelectValue placeholder="Durum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Durumlar</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="cancelled">İptal Edildi</SelectItem>
              <SelectItem value="expired">Süresi Doldu</SelectItem>
              <SelectItem value="free">Ücretsiz</SelectItem>
            </SelectContent>
          </Select>

          {/* Type Filter */}
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="bg-black/20 border-white/10 text-white">
              <Filter className="mr-2 h-4 w-4 text-white/40" />
              <SelectValue placeholder="Tip" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Tipler</SelectItem>
              <SelectItem value="manual">Manuel</SelectItem>
              <SelectItem value="paid">Ödeme</SelectItem>
            </SelectContent>
          </Select>

          {/* Items Per Page */}
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => {
              setItemsPerPage(Number(value))
              setCurrentPage(1)
            }}
          >
            <SelectTrigger className="bg-black/20 border-white/10 text-white">
              <SelectValue placeholder="Sayfa başına" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 sonuç</SelectItem>
              <SelectItem value="20">20 sonuç</SelectItem>
              <SelectItem value="50">50 sonuç</SelectItem>
              <SelectItem value="100">100 sonuç</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Subscriptions Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-white/80 font-semibold">
                  Kullanıcı
                </th>
                <th className="text-left py-3 px-4 text-white/80 font-semibold">
                  Plan
                </th>
                <th className="text-left py-3 px-4 text-white/80 font-semibold">
                  Durum
                </th>
                <th className="text-left py-3 px-4 text-white/80 font-semibold">
                  Tip
                </th>
                <th className="text-left py-3 px-4 text-white/80 font-semibold">
                  Başlangıç
                </th>
                <th className="text-left py-3 px-4 text-white/80 font-semibold">
                  Bitiş
                </th>
                <th className="text-left py-3 px-4 text-white/80 font-semibold">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedSubscriptions.map((sub) => {
                const fullName =
                  [sub.profiles?.first_name, sub.profiles?.last_name]
                    .filter(Boolean)
                    .join(" ") || "-"
                const isManual = !sub.payment_provider || sub.payment_provider === null

                return (
                  <tr
                    key={sub.id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div>
                        <p className="text-white font-medium">{fullName}</p>
                        <p className="text-white/60 text-sm">
                          {sub.profiles?.email || "-"}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-white/80">
                      {planNames[sub.plan_type] || sub.plan_type}
                    </td>
                    <td className="py-4 px-4">
                      {isExpiredByDate(sub) ? (
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/20">
                          Süresi Doldu
                        </Badge>
                      ) : sub.status === "active" ? (
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/20">
                          Aktif
                        </Badge>
                      ) : sub.status === "cancelled" ? (
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/20">
                          İptal Edildi
                        </Badge>
                      ) : sub.status === "expired" ? (
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/20">
                          Süresi Doldu
                        </Badge>
                      ) : sub.status === "free" ? (
                        <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/20">
                          Ücretsiz
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/20">
                          {sub.status}
                        </Badge>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      {sub.status === "free" ? (
                        <span className="text-white/40 text-sm">—</span>
                      ) : isManual ? (
                        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/20">
                          Manuel
                        </Badge>
                      ) : (
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/20">
                          Ödeme
                        </Badge>
                      )}
                    </td>
                    <td className="py-4 px-4 text-white/80 text-sm">
                      {fmtDate(sub.start_date)}
                    </td>
                    <td className="py-4 px-4 text-white/80 text-sm">
                      {fmtDate(sub.expires_at)}
                    </td>
                    <td className="py-4 px-4">
                      <Link
                        href={`/admin/kullanicilar/${sub.user_id}`}
                        className="text-teal-400 hover:text-teal-300 transition-colors text-sm"
                      >
                        Kullanıcı Detay
                      </Link>
                    </td>
                  </tr>
                )
              })}
              {paginatedSubscriptions.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-white/60">
                    {searchQuery ||
                    planFilter !== "all" ||
                    statusFilter !== "all" ||
                    typeFilter !== "all"
                      ? "Filtreye uygun abonelik bulunamadı"
                      : "Henüz abonelik bulunmuyor"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div className="text-sm text-white/60">
              {startIndex + 1}-{Math.min(endIndex, filteredSubscriptions.length)}{" "}
              arası, toplam {filteredSubscriptions.length} kullanıcı
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="bg-black/20 border-white/10 text-white hover:bg-white/10 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-white/80">
                Sayfa {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                className="bg-black/20 border-white/10 text-white hover:bg-white/10 disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
