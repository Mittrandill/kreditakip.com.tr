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

interface UserTableClientProps {
  users: any[]
}

export function UserTableClient({ users }: UserTableClientProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [planFilter, setPlanFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)

  // Filter and search users
  const filteredUsers = useMemo(() => {
    let filtered = users || []

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((user) => {
        const fullName = [user.first_name, user.last_name]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
        const email = (user.email || "").toLowerCase()
        const phone = (user.phone || "").toLowerCase()

        return (
          fullName.includes(query) ||
          email.includes(query) ||
          phone.includes(query)
        )
      })
    }

    // Plan filter
    if (planFilter !== "all") {
      filtered = filtered.filter((user) => {
        const subscriptions = user.subscriptions || []
        const activeSubscription = subscriptions.find(
          (s: any) => s.status === "active"
        )
        const subscription =
          activeSubscription ||
          subscriptions.sort(
            (a: any, b: any) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0]

        if (planFilter === "none") {
          return !subscription
        }

        return subscription?.plan_type === planFilter
      })
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((user) => {
        const subscriptions = user.subscriptions || []
        const activeSubscription = subscriptions.find(
          (s: any) => s.status === "active"
        )
        const subscription =
          activeSubscription ||
          subscriptions.sort(
            (a: any, b: any) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0]

        if (statusFilter === "none") {
          return !subscription
        }

        return subscription?.status === statusFilter
      })
    }

    return filtered
  }, [users, searchQuery, planFilter, statusFilter])

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1)
  }, [searchQuery, planFilter, statusFilter])

  const planNames: Record<string, string> = {
    free: "Ücretsiz",
    pro: "Pro",
    premium: "Premium",
  }

  // Export to CSV
  const exportToCSV = () => {
    // Prepare CSV data
    const headers = ["Ad Soyad", "E-posta", "Telefon", "Abonelik", "Plan", "OCR Analiz", "OCR Kayıt", "Kayıt Tarihi"]
    const rows = filteredUsers.map((user) => {
      const subscriptions = user.subscriptions || []
      const activeSubscription = subscriptions.find((s: any) => s.status === "active")
      const subscription =
        activeSubscription ||
        subscriptions.sort(
          (a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0]

      const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ") || "-"
      const status = subscription?.status
        ? subscription.status === "active"
          ? "Aktif"
          : subscription.status === "cancelled"
          ? "İptal Edildi"
          : subscription.status === "expired"
          ? "Süresi Doldu"
          : subscription.status
        : "Abonelik Yok"
      const plan = subscription?.plan_type
        ? planNames[subscription.plan_type] || subscription.plan_type
        : "-"

      return [
        fullName,
        user.email || "-",
        user.phone || "-",
        status,
        plan,
        user.ocrUsage?.analyses ?? 0,
        user.ocrUsage?.saved ?? 0,
        new Date(user.created_at).toLocaleDateString("tr-TR"),
      ]
    })

    // Create CSV content
    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n")

    // Create blob and download
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute(
      "download",
      `kullanicilar_${new Date().toISOString().split("T")[0]}.csv`
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
              {filteredUsers.length === users.length
                ? `${filteredUsers.length} kullanıcı`
                : `${filteredUsers.length} / ${users.length} kullanıcı`}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            disabled={filteredUsers.length === 0}
            className="bg-black/20 border-white/10 text-white hover:bg-white/10"
          >
            <Download className="mr-2 h-4 w-4" />
            CSV İndir
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input
              placeholder="Ad, email veya telefon ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-black/20 border-white/10 text-white placeholder:text-white/40"
            />
          </div>

          {/* Plan Filter */}
          <Select value={planFilter} onValueChange={setPlanFilter}>
            <SelectTrigger className="bg-black/20 border-white/10 text-white">
              <Filter className="mr-2 h-4 w-4 text-white/40" />
              <SelectValue placeholder="Plan Tipi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Planlar</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
              <SelectItem value="free">Ücretsiz</SelectItem>
              <SelectItem value="none">Abonelik Yok</SelectItem>
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
              <SelectItem value="none">Abonelik Yok</SelectItem>
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

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-white/80 font-semibold">
                  Ad Soyad
                </th>
                <th className="text-left py-3 px-4 text-white/80 font-semibold">
                  E-posta
                </th>
                <th className="text-left py-3 px-4 text-white/80 font-semibold">
                  Telefon
                </th>
                <th className="text-left py-3 px-4 text-white/80 font-semibold">
                  Abonelik
                </th>
                <th className="text-left py-3 px-4 text-white/80 font-semibold">
                  Plan
                </th>
                <th className="text-left py-3 px-4 text-white/80 font-semibold">
                  OCR (Analiz / Kayıt)
                </th>
                <th className="text-left py-3 px-4 text-white/80 font-semibold">
                  Kayıt Tarihi
                </th>
                <th className="text-left py-3 px-4 text-white/80 font-semibold">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((user) => {
                // Find active subscription, or the most recent one
                const subscriptions = user.subscriptions || []
                const activeSubscription = subscriptions.find(
                  (s: any) => s.status === "active"
                )
                const subscription =
                  activeSubscription ||
                  subscriptions.sort(
                    (a: any, b: any) =>
                      new Date(b.created_at).getTime() -
                      new Date(a.created_at).getTime()
                  )[0]

                // Create full name from first_name and last_name
                const fullName =
                  [user.first_name, user.last_name].filter(Boolean).join(" ") ||
                  "-"

                return (
                  <tr
                    key={user.id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="py-4 px-4 text-white">
                      {fullName}
                      {user.is_admin && (
                        <Badge className="ml-2 bg-purple-500/20 text-purple-400 border-purple-500/20">
                          Admin
                        </Badge>
                      )}
                    </td>
                    <td className="py-4 px-4 text-white/80">
                      {user.email || "-"}
                    </td>
                    <td className="py-4 px-4 text-white/80">
                      {user.phone || "-"}
                    </td>
                    <td className="py-4 px-4">
                      {subscription ? (
                        subscription.status === "active" ? (
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
                        )
                      ) : (
                        <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/20">
                          Abonelik Yok
                        </Badge>
                      )}
                    </td>
                    <td className="py-4 px-4 text-white/80">
                      {subscription?.plan_type
                        ? planNames[subscription.plan_type] ||
                          subscription.plan_type
                        : "-"}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-500/15 text-blue-300 border-blue-500/20 tabular-nums">
                          {user.ocrUsage?.analyses ?? 0} analiz
                        </Badge>
                        <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/20 tabular-nums">
                          {user.ocrUsage?.saved ?? 0} kayıt
                        </Badge>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-white/80">
                      {new Date(user.created_at).toLocaleDateString("tr-TR")}
                    </td>
                    <td className="py-4 px-4">
                      <Link
                        href={`/admin/kullanicilar/${user.id}`}
                        className="text-teal-400 hover:text-teal-300 transition-colors"
                      >
                        Detay
                      </Link>
                    </td>
                  </tr>
                )
              })}
              {paginatedUsers.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-white/60">
                    {searchQuery || planFilter !== "all" || statusFilter !== "all"
                      ? "Filtreye uygun kullanıcı bulunamadı"
                      : "Henüz kullanıcı bulunmuyor"}
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
              {startIndex + 1}-{Math.min(endIndex, filteredUsers.length)} arası,
              toplam {filteredUsers.length} kullanıcı
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
