"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, ChevronLeft, ChevronRight, Download } from "lucide-react"
import { format } from "date-fns"
import { tr } from "date-fns/locale"

interface ActivityLogsTableClientProps {
  logs: any[]
}

export function ActivityLogsTableClient({ logs }: ActivityLogsTableClientProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [actionFilter, setActionFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)

  const filteredLogs = useMemo(() => {
    let filtered = logs || []

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((log) => {
        const adminName = [log.admin?.first_name, log.admin?.last_name].filter(Boolean).join(" ").toLowerCase()
        const targetName = [log.target_user?.first_name, log.target_user?.last_name].filter(Boolean).join(" ").toLowerCase()
        const description = (log.description || "").toLowerCase()
        return adminName.includes(query) || targetName.includes(query) || description.includes(query)
      })
    }

    if (actionFilter !== "all") {
      filtered = filtered.filter((log) => log.action_type === actionFilter)
    }

    return filtered
  }, [logs, searchQuery, actionFilter])

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex)

  useMemo(() => { setCurrentPage(1) }, [searchQuery, actionFilter])

  const actionTypes = [...new Set(logs.map((log) => log.action_type))].sort()

  const getActionBadge = (actionType: string) => {
    if (actionType.includes("create")) return <Badge className="bg-green-500/20 text-green-400 border-green-500/20">Oluştur</Badge>
    if (actionType.includes("update")) return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/20">Güncelle</Badge>
    if (actionType.includes("cancel") || actionType.includes("delete")) return <Badge className="bg-red-500/20 text-red-400 border-red-500/20">İptal/Sil</Badge>
    if (actionType.includes("extend")) return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/20">Uzat</Badge>
    return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/20">{actionType}</Badge>
  }

  const exportToCSV = () => {
    const headers = ["Tarih", "Admin", "İşlem", "Açıklama", "Hedef Kullanıcı"]
    const rows = filteredLogs.map((log) => {
      const adminName = [log.admin?.first_name, log.admin?.last_name].filter(Boolean).join(" ") || "-"
      const targetName = [log.target_user?.first_name, log.target_user?.last_name].filter(Boolean).join(" ") || "-"
      return [
        format(new Date(log.created_at), "dd.MM.yyyy HH:mm", { locale: tr }),
        adminName,
        log.action_type,
        log.description,
        targetName,
      ]
    })

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n")

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `admin_loglar_${new Date().toISOString().split("T")[0]}.csv`)
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
            <span>İşlem Logları</span>
            <span className="text-sm font-normal text-white/60">
              {filteredLogs.length === logs.length ? `${filteredLogs.length} log` : `${filteredLogs.length} / ${logs.length} log`}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={exportToCSV} disabled={filteredLogs.length === 0} className="bg-black/20 border-white/10 text-white hover:bg-white/10">
            <Download className="mr-2 h-4 w-4" />
            CSV İndir
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input placeholder="Admin, kullanıcı veya açıklama ara..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 bg-black/20 border-white/10 text-white placeholder:text-white/40" />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="bg-black/20 border-white/10 text-white">
              <Filter className="mr-2 h-4 w-4 text-white/40" />
              <SelectValue placeholder="İşlem Tipi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm İşlemler</SelectItem>
              {actionTypes.map((type) => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={itemsPerPage.toString()} onValueChange={(value) => { setItemsPerPage(Number(value)); setCurrentPage(1); }}>
            <SelectTrigger className="bg-black/20 border-white/10 text-white">
              <SelectValue placeholder="Sayfa başına" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 sonuç</SelectItem>
              <SelectItem value="20">20 sonuç</SelectItem>
              <SelectItem value="50">50 sonuç</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-white/80 font-semibold">Tarih</th>
                <th className="text-left py-3 px-4 text-white/80 font-semibold">Admin</th>
                <th className="text-left py-3 px-4 text-white/80 font-semibold">İşlem</th>
                <th className="text-left py-3 px-4 text-white/80 font-semibold">Açıklama</th>
                <th className="text-left py-3 px-4 text-white/80 font-semibold">Hedef Kullanıcı</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLogs.map((log) => {
                const adminName = [log.admin?.first_name, log.admin?.last_name].filter(Boolean).join(" ") || "Bilinmeyen"
                const targetName = [log.target_user?.first_name, log.target_user?.last_name].filter(Boolean).join(" ")
                return (
                  <tr key={log.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 px-4 text-white/80 text-sm">
                      {format(new Date(log.created_at), "dd MMM yyyy HH:mm", { locale: tr })}
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="text-white font-medium">{adminName}</p>
                        <p className="text-white/60 text-xs">{log.admin?.email}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">{getActionBadge(log.action_type)}</td>
                    <td className="py-4 px-4 text-white/80 text-sm">{log.description}</td>
                    <td className="py-4 px-4">
                      {targetName ? (
                        <div>
                          <p className="text-white text-sm">{targetName}</p>
                          <p className="text-white/60 text-xs">{log.target_user?.email}</p>
                        </div>
                      ) : (
                        <span className="text-white/40 text-sm">-</span>
                      )}
                    </td>
                  </tr>
                )
              })}
              {paginatedLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-white/60">
                    {searchQuery || actionFilter !== "all" ? "Filtreye uygun log bulunamadı" : "Henüz log bulunmuyor"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div className="text-sm text-white/60">
              {startIndex + 1}-{Math.min(endIndex, filteredLogs.length)} arası, toplam {filteredLogs.length} log
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))} disabled={currentPage === 1} className="bg-black/20 border-white/10 text-white hover:bg-white/10 disabled:opacity-50">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-white/80">Sayfa {currentPage} / {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="bg-black/20 border-white/10 text-white hover:bg-white/10 disabled:opacity-50">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
