"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  BarChart3,
  PieChart as PieChartIcon,
  Download,
  CreditCard,
  TrendingUp,
  Building2,
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useSubscription } from "@/hooks/use-subscription"
import { useRouter } from "next/navigation"
import { getCredits } from "@/lib/api/credits"
import { getAllPayments } from "@/lib/api/payments"
import type { Credit, Bank, CreditType } from "@/lib/types"
import { formatCurrency, formatPercent } from "@/lib/format"
import BankLogo from "@/components/bank-logo"
import dynamic from "next/dynamic"

const RechartsPieChart = dynamic(() => import("recharts").then((mod) => ({ default: mod.PieChart })), { ssr: false })
const Pie = dynamic(() => import("recharts").then((mod) => ({ default: mod.Pie })), { ssr: false })
const Cell = dynamic(() => import("recharts").then((mod) => ({ default: mod.Cell })), { ssr: false })
const ResponsiveContainer = dynamic(() => import("recharts").then((mod) => ({ default: mod.ResponsiveContainer })), { ssr: false })

interface PopulatedCredit extends Credit {
  banks: Pick<Bank, "id" | "name" | "logo_url"> | null
  credit_types: Pick<CreditType, "id" | "name"> | null
}

const COLORS = {
  active: "#10B981", // emerald-500
  closed: "#6B7280", // gray-500
  inactive: "#EF4444", // red-500
  overdue: "#F59E0B", // orange-500
}

export default function RaporlarPage() {
  const { user, loading: authLoading } = useAuth()
  const { isPremium, loading: subscriptionLoading } = useSubscription()
  const router = useRouter()
  const [credits, setCredits] = useState<PopulatedCredit[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!subscriptionLoading && !isPremium && !authLoading) {
      router.push("/uygulama/premium")
    }
  }, [isPremium, subscriptionLoading, authLoading, router])

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return

      try {
        setLoading(true)
        const creditsData = await getCredits(user.id)
        setCredits((creditsData as PopulatedCredit[]) || [])
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  // Calculate statistics
  const activeCredits = credits.filter((c) => c.status === "active")
  const paidCredits = credits.filter((c) => c.status === "closed")

  // Bank distribution
  const bankStats = credits.reduce((acc, credit) => {
    const bankName = credit.banks?.name || "Diğer"
    if (!acc[bankName]) {
      acc[bankName] = { count: 0, total: 0, active: 0 }
    }
    acc[bankName].count++
    acc[bankName].total += credit.remaining_debt || 0
    if (credit.status === "active") acc[bankName].active++
    return acc
  }, {} as Record<string, { count: number; total: number; active: number }>)

  // Credit type distribution
  const typeStats = credits.reduce((acc, credit) => {
    const typeName = credit.credit_types?.name || "Diğer"
    if (!acc[typeName]) {
      acc[typeName] = { count: 0, total: 0 }
    }
    acc[typeName].count++
    acc[typeName].total += credit.remaining_debt || 0
    return acc
  }, {} as Record<string, { count: number; total: number }>)

  // Status distribution for pie chart
  const statusData = [
    { name: "Aktif", value: credits.filter((c) => c.status === "active").length, color: COLORS.active },
    { name: "Tamamlanan", value: credits.filter((c) => c.status === "closed").length, color: COLORS.closed },
    { name: "Gecikmiş", value: credits.filter((c) => c.status === "overdue").length, color: COLORS.overdue },
  ].filter((item) => item.value > 0)

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Raporlar</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Kredileriniz hakkında detaylı istatistikler ve analizler
          </p>
        </div>
        <Button className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white hover:from-emerald-700 hover:to-teal-800">
          <Download className="h-4 w-4 mr-2" />
          PDF İndir
        </Button>
      </div>

      {/* Pie Charts Row -  */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Bank Distribution */}
        <Card className="border-gray-200 dark:border-gray-800">
          <CardHeader className="border-b border-gray-100 dark:border-gray-800 pb-4">
            <CardTitle className="text-base">Banka Dağılımı</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={220}>
              <RechartsPieChart>
                <Pie
                  data={Object.entries(bankStats).map(([name, data]) => ({
                    name,
                    value: data.count,
                  }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {Object.keys(bankStats).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS.active} opacity={1 - index * 0.15} />
                  ))}
                </Pie>
              </RechartsPieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <span className="text-sm text-gray-600 dark:text-gray-400">Aktif</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-gray-400"></span>
                <span className="text-sm text-gray-600 dark:text-gray-400">Tamamlanan</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Credit Type Distribution */}
        <Card className="border-gray-200 dark:border-gray-800">
          <CardHeader className="border-b border-gray-100 dark:border-gray-800 pb-4">
            <CardTitle className="text-base">Kredi Türleri</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={220}>
              <RechartsPieChart>
                <Pie
                  data={Object.entries(typeStats).map(([name, data]) => ({
                    name,
                    value: data.count,
                  }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {Object.keys(typeStats).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS.active} opacity={1 - index * 0.2} />
                  ))}
                </Pie>
              </RechartsPieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-teal-500"></span>
                <span className="text-sm text-gray-600 dark:text-gray-400">Aktif</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-gray-400"></span>
                <span className="text-sm text-gray-600 dark:text-gray-400">Diğer</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card className="border-gray-200 dark:border-gray-800">
          <CardHeader className="border-b border-gray-100 dark:border-gray-800 pb-4">
            <CardTitle className="text-base">Kredi Durumu</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 flex flex-col">
            <ResponsiveContainer width="100%" height={220}>
              <RechartsPieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </RechartsPieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
              {statusData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Credits Table -  */}
      <Card className="border-gray-200 dark:border-gray-800">
        <CardHeader className="border-b border-gray-100 dark:border-gray-800 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-xl">Kredi Raporları</CardTitle>
              <CardDescription className="mt-1">Tüm kredilerinizin detaylı listesi</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm">
                <label className="text-gray-600 dark:text-gray-400">Göster</label>
                <select className="bg-transparent border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option>10</option>
                  <option>25</option>
                  <option>50</option>
                </select>
                <label className="text-gray-600 dark:text-gray-400">kayıt</label>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 dark:text-gray-400">Ara:</label>
                <input
                  type="search"
                  placeholder=""
                  className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/5">
                  <TableHead className="font-semibold text-gray-700 dark:text-white/70">S.No.</TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-white/70">Banka</TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-white/70">Kredi Türü</TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-white/70">Faiz Oranı</TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-white/70">Kalan Borç</TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-white/70">Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {credits.slice(0, 10).map((credit, index) => (
                  <TableRow
                    key={credit.id}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <TableCell className="text-gray-600 dark:text-white/70 font-medium">
                      {String(index + 1).padStart(2, "0")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <BankLogo
                          bankName={credit.banks?.name || "Bilinmeyen Banka"}
                          logoUrl={credit.banks?.logo_url || undefined}
                          size="sm"
                          className="ring-1 ring-emerald-200 dark:ring-emerald-900/30"
                        />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {credit.banks?.name || "N/A"}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{credit.credit_code}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600 dark:text-white/70">
                      {credit.credit_types?.name || "N/A"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className={`h-4 w-4 ${
                              star <= Math.round(credit.interest_rate / 2)
                                ? "text-yellow-400 fill-current"
                                : "text-gray-300 dark:text-gray-600"
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(credit.remaining_debt)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`${
                          credit.status === "active"
                            ? "bg-gradient-to-r from-emerald-500 to-teal-600"
                            : credit.status === "closed"
                            ? "bg-gray-500"
                            : "bg-orange-500"
                        } text-white border-0`}
                      >
                        {credit.status === "active"
                          ? "Aktif"
                          : credit.status === "closed"
                          ? "Tamamlandı"
                          : "Gecikmiş"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {credits.length === 0 && (
              <div className="text-center py-12">
                <CreditCard className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-700" />
                <p className="text-gray-500 dark:text-gray-400">Henüz kredi bulunmamaktadır.</p>
              </div>
            )}
            {credits.length > 10 && (
              <div className="border-t border-gray-100 dark:border-gray-800 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    1 - 10 arası gösteriliyor (Toplam {credits.length} kayıt)
                  </span>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled>
                      Önceki
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600"
                    >
                      1
                    </Button>
                    <Button variant="outline" size="sm">
                      Sonraki
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
