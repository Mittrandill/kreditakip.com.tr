"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import BankLogo from "@/components/bank-logo"
import {
  CreditCard,
  Plus,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Archive,
  Loader2,
} from "lucide-react"
import Link from "next/link"

import { useAuth } from "@/hooks/use-auth"
import { getCredits, deleteCredit as apiDeleteCredit } from "@/lib/api/credits"
import type { Credit, Bank, CreditType } from "@/lib/types"
import { formatCurrency, formatPercent } from "@/lib/format"
import { useToast } from "@/hooks/use-toast"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface PopulatedCredit extends Credit {
  banks: Pick<Bank, "id" | "name" | "logo_url"> | null
  credit_types: Pick<CreditType, "id" | "name"> | null
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "active":
      return (
        <Badge className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0">
          Aktif
        </Badge>
      )
    case "closed":
      return (
        <Badge className="bg-gray-500 text-white border-0">
          Kapalı
        </Badge>
      )
    case "overdue":
      return (
        <Badge className="bg-gradient-to-r from-red-500 to-rose-600 text-white border-0">
          Gecikmiş
        </Badge>
      )
    default:
      return (
        <Badge className="bg-gray-400 text-white border-0">
          {status}
        </Badge>
      )
  }
}

export default function KredilerPage() {
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const [allCredits, setAllCredits] = useState<PopulatedCredit[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [selectedCredits, setSelectedCredits] = useState<Set<string>>(new Set())
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [creditToDelete, setCreditToDelete] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    async function fetchData() {
      if (user?.id) {
        setLoadingData(true)
        try {
          const creditsData = (await getCredits(user.id)) as PopulatedCredit[]
          setAllCredits(creditsData || [])
        } catch (error) {
          console.error("Error fetching credits:", error)
          toast({
            title: "Hata",
            description: "Krediler yüklenirken bir hata oluştu.",
            variant: "destructive",
          })
        } finally {
          setLoadingData(false)
        }
      }
    }

    fetchData()
  }, [user, toast])

  const handleCheckboxChange = (creditId: string, checked: boolean) => {
    const newSelected = new Set(selectedCredits)
    if (checked) {
      newSelected.add(creditId)
    } else {
      newSelected.delete(creditId)
    }
    setSelectedCredits(newSelected)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCredits(new Set(allCredits.map((c) => c.id)))
    } else {
      setSelectedCredits(new Set())
    }
  }

  const handleDeleteClick = (creditId: string) => {
    setCreditToDelete(creditId)
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (!creditToDelete) return

    try {
      await apiDeleteCredit(creditToDelete)
      setAllCredits((prev) => prev.filter((c) => c.id !== creditToDelete))
      toast({
        title: "Başarılı",
        description: "Kredi silindi.",
      })
    } catch (error) {
      console.error("Error deleting credit:", error)
      toast({
        title: "Hata",
        description: "Kredi silinirken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setShowDeleteDialog(false)
      setCreditToDelete(null)
    }
  }

  // Filter credits by search term
  const filteredCredits = allCredits.filter((credit) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      credit.banks?.name.toLowerCase().includes(searchLower) ||
      credit.credit_code.toLowerCase().includes(searchLower) ||
      credit.credit_types?.name.toLowerCase().includes(searchLower)
    )
  })

  // Pagination
  const totalPages = Math.ceil(filteredCredits.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentCredits = filteredCredits.slice(startIndex, endIndex)

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <>
      {/* Breadcrumb */}
      <div className="mb-6">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <Link
                href="/uygulama"
                className="inline-flex items-center text-sm text-gray-700 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400"
              >
                Krediler
              </Link>
            </li>
            <li aria-current="page">
              <div className="flex items-center">
                <span className="mx-2 text-gray-400">/</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">Kredi Listesi</span>
              </div>
            </li>
          </ol>
        </nav>
      </div>

      {/* Main Card */}
      <Card className="border-gray-200 dark:border-gray-800">
        <CardHeader className="border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Kredi Listesi</CardTitle>
            <Button
              onClick={() => router.push("/uygulama/krediler/kredi-ekle")}
              className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white hover:from-emerald-700 hover:to-teal-800"
            >
              <Plus className="h-4 w-4 mr-2" />
              Kredi Ekle
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Table Controls */}
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-white/5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-2 text-sm">
                <label className="text-gray-600 dark:text-gray-400">Göster</label>
                <select className="bg-transparent border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option>10</option>
                  <option>25</option>
                  <option>50</option>
                  <option>75</option>
                  <option>100</option>
                </select>
                <label className="text-gray-600 dark:text-gray-400">kayıt</label>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 dark:text-gray-400">Ara:</label>
                <input
                  type="search"
                  placeholder=""
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/5">
                  <TableHead className="w-12">
                    <div className="flex items-center">
                      <Checkbox
                        checked={selectedCredits.size === allCredits.length && allCredits.length > 0}
                        onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                      />
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-white/70">Banka</TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-white/70">Kredi Türü</TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-white/70">Kayıt Tarihi</TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-white/70">Faiz Oranı</TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-white/70">Kalan Borç</TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-white/70">Durum</TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-white/70">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentCredits.map((credit) => (
                  <TableRow
                    key={credit.id}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <TableCell>
                      <div className="flex items-center">
                        <Checkbox
                          checked={selectedCredits.has(credit.id)}
                          onCheckedChange={(checked) => handleCheckboxChange(credit.id, checked as boolean)}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link href={`/uygulama/kredi-detay/${credit.id}`}>
                        <div className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                          <BankLogo
                            bankName={credit.banks?.name || "Bilinmeyen Banka"}
                            logoUrl={credit.banks?.logo_url || undefined}
                            size="sm"
                            className="ring-1 ring-emerald-200 dark:ring-emerald-900/30"
                          />
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {credit.banks?.name || "N/A"}
                            </span>
                            <small className="text-xs text-gray-500 dark:text-gray-400">
                              {credit.credit_code}
                            </small>
                          </div>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell className="text-gray-600 dark:text-white/70">
                      {credit.credit_types?.name || "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
                        {credit.start_date ? new Date(credit.start_date).toLocaleDateString("tr-TR") : "N/A"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-orange-600 dark:text-orange-400">
                      {formatPercent(credit.interest_rate)}
                    </TableCell>
                    <TableCell className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(credit.remaining_debt)}
                    </TableCell>
                    <TableCell>{getStatusBadge(credit.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 bg-emerald-500 hover:bg-emerald-600 text-white"
                          asChild
                        >
                          <Link href={`/uygulama/kredi-detay/${credit.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 bg-blue-500 hover:bg-blue-600 text-white"
                          asChild
                        >
                          <Link href={`/uygulama/kredi-duzenle/${credit.id}`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 bg-red-500 hover:bg-red-600 text-white"
                          onClick={() => handleDeleteClick(credit.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {currentCredits.length === 0 && (
              <div className="text-center py-12">
                <CreditCard className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-700" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {searchTerm ? "Arama sonucu bulunamadı." : "Henüz kredi bulunmamaktadır."}
                </p>
                {!searchTerm && (
                  <Button
                    onClick={() => router.push("/uygulama/krediler/kredi-ekle")}
                    className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white hover:from-emerald-700 hover:to-teal-800"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    İlk Kredinizi Ekleyin
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t border-gray-100 dark:border-gray-800 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  {startIndex + 1} - {Math.min(endIndex, filteredCredits.length)} arası gösteriliyor (Toplam {filteredCredits.length} kayıt)
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Önceki
                  </Button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className={
                          currentPage === pageNum
                            ? "bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600"
                            : ""
                        }
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Sonraki
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="dark:bg-gray-900 dark:border-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-white">Krediyi Sil</AlertDialogTitle>
            <AlertDialogDescription className="dark:text-gray-400">
              Bu krediyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700">
              İptal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
