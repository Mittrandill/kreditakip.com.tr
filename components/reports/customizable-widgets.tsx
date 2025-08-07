"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Grid,
  List,
  Download,
  Search,
  ChevronDown,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Columns,
  SortAsc,
  SortDesc,
} from "lucide-react"
import { formatCurrency, formatPercent, formatDate } from "@/lib/format"

interface Column {
  key: string
  label: string
  sortable?: boolean
  format?: "currency" | "percentage" | "date" | "status" | "number"
  width?: string
  visible?: boolean
}

interface CustomizableWidgetsProps {
  type: "credits-table" | "payments-table" | "credit-cards-table" | "custom-grid"
  data: any[]
  columns: Column[]
  pageSize?: number
  showFilters?: boolean
  showExport?: boolean
  showPagination?: boolean
  title?: string
  description?: string
}

export function CustomizableWidgets({
  type,
  data,
  columns: initialColumns,
  pageSize = 10,
  showFilters = true,
  showExport = true,
  showPagination = true,
  title,
  description,
}: CustomizableWidgetsProps) {
  const [viewMode, setViewMode] = useState<"table" | "grid">("table")
  const [columns, setColumns] = useState(initialColumns.map((col) => ({ ...col, visible: col.visible !== false })))
  const [sortBy, setSortBy] = useState<string>("")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [filters, setFilters] = useState<{ [key: string]: any }>({})

  // Filter and sort data
  const processedData = useMemo(() => {
    let filtered = data

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((item) =>
        Object.values(item).some((value) => String(value).toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    // Apply column filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== "all") {
        filtered = filtered.filter((item) => {
          if (typeof value === "object" && value.min !== undefined && value.max !== undefined) {
            const itemValue = Number(item[key]) || 0
            return itemValue >= (value.min || 0) && itemValue <= (value.max || Number.POSITIVE_INFINITY)
          }
          return String(item[key]).toLowerCase().includes(String(value).toLowerCase())
        })
      }
    })

    // Apply sorting
    if (sortBy) {
      filtered.sort((a, b) => {
        let aValue = (a as any)[sortBy]
        let bValue = (b as any)[sortBy]

        // Handle different data types
        if (typeof aValue === "string") {
          aValue = aValue.toLowerCase()
          bValue = bValue.toLowerCase()
        }

        if (typeof aValue === "number") {
          return sortOrder === "asc" ? aValue - bValue : bValue - aValue
        }

        if (aValue < bValue) return sortOrder === "asc" ? -1 : 1
        if (aValue > bValue) return sortOrder === "asc" ? 1 : -1
        return 0
      })
    }

    return filtered
  }, [data, searchTerm, filters, sortBy, sortOrder])

  // Pagination
  const totalPages = Math.ceil(processedData.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const paginatedData = processedData.slice(startIndex, startIndex + pageSize)

  const handleSort = (columnKey: string) => {
    if (sortBy === columnKey) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(columnKey)
      setSortOrder("asc")
    }
  }

  const handleColumnVisibilityChange = (columnKey: string, visible: boolean) => {
    setColumns((prev) => prev.map((col) => (col.key === columnKey ? { ...col, visible } : col)))
  }

  const handleSelectRow = (rowId: string) => {
    setSelectedRows((prev) => (prev.includes(rowId) ? prev.filter((id) => id !== rowId) : [...prev, rowId]))
  }

  const handleSelectAll = () => {
    if (selectedRows.length === paginatedData.length) {
      setSelectedRows([])
    } else {
      setSelectedRows(paginatedData.map((item) => item.id || item.key))
    }
  }

  const formatCellValue = (value: any, format?: string) => {
    if (value === null || value === undefined) return "-"

    switch (format) {
      case "currency":
        return formatCurrency(Number(value))
      case "percentage":
        return formatPercent(Number(value))
      case "date":
        return formatDate(new Date(value))
      case "status":
        return <Badge className={getStatusBadgeClass(value)}>{getStatusText(value)}</Badge>
      case "number":
        return Number(value).toLocaleString("tr-TR")
      default:
        return String(value)
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
      case "paid":
      case "completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "pending":
      case "processing":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "overdue":
      case "failed":
        return "bg-red-100 text-red-800 border-red-200"
      case "inactive":
      case "cancelled":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "Aktif"
      case "inactive":
        return "Pasif"
      case "paid":
        return "Ödendi"
      case "pending":
        return "Beklemede"
      case "overdue":
        return "Gecikmiş"
      case "completed":
        return "Tamamlandı"
      case "cancelled":
        return "İptal"
      case "failed":
        return "Başarısız"
      default:
        return status
    }
  }

  const visibleColumns = columns.filter((col) => col.visible)

  const exportData = () => {
    const csvContent = [
      visibleColumns.map((col) => col.label).join(","),
      ...processedData.map((row) =>
        visibleColumns
          .map((col) => {
            const value = (row as any)[col.key]
            if (col.format === "currency") return Number(value)
            if (col.format === "percentage") return Number(value)
            return String(value).replace(/,/g, ";")
          })
          .join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `${type}-${new Date().toISOString().split("T")[0]}.csv`
    link.click()
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      {(title || description) && (
        <div className="flex items-center justify-between">
          <div>
            {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
            {description && <p className="text-sm text-gray-600">{description}</p>}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{processedData.length} kayıt</Badge>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {/* Search */}
          {showFilters && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          )}

          {/* Column Visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns className="h-4 w-4 mr-2" />
                Sütunlar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel>Görünür Sütunlar</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {columns.map((column) => (
                <DropdownMenuItem key={column.key} className="flex items-center gap-2">
                  <Checkbox
                    checked={column.visible}
                    onCheckedChange={(checked) => handleColumnVisibilityChange(column.key, checked as boolean)}
                  />
                  <span>{column.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className="h-8 w-8 p-0"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="h-8 w-8 p-0"
            >
              <Grid className="h-4 w-4" />
            </Button>
          </div>

          {/* Export */}
          {showExport && (
            <Button variant="outline" size="sm" onClick={exportData}>
              <Download className="h-4 w-4 mr-2" />
              Dışa Aktar
            </Button>
          )}

          {/* Bulk Actions */}
          {selectedRows.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {selectedRows.length} seçili
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Edit className="h-4 w-4 mr-2" />
                  Toplu Düzenle
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Download className="h-4 w-4 mr-2" />
                  Seçilenleri Dışa Aktar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Seçilenleri Sil
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Data Display */}
      {viewMode === "table" ? (
        <Card className="shadow-lg rounded-xl border-0">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedRows.length === paginatedData.length && paginatedData.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    {visibleColumns.map((column) => (
                      <TableHead key={column.key} style={{ width: column.width }}>
                        {column.sortable ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort(column.key)}
                            className="h-auto p-0 font-semibold hover:bg-transparent"
                          >
                            {column.label}
                            {sortBy === column.key &&
                              (sortOrder === "asc" ? (
                                <SortAsc className="h-4 w-4 ml-1" />
                              ) : (
                                <SortDesc className="h-4 w-4 ml-1" />
                              ))}
                          </Button>
                        ) : (
                          <span className="font-semibold">{column.label}</span>
                        )}
                      </TableHead>
                    ))}
                    <TableHead className="w-12">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((row, index) => (
                    <TableRow
                      key={row.id || index}
                      className={`hover:bg-gray-50 ${selectedRows.includes(row.id || index) ? "bg-blue-50" : ""}`}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedRows.includes(row.id || index)}
                          onCheckedChange={() => handleSelectRow(row.id || index)}
                        />
                      </TableCell>
                      {visibleColumns.map((column) => (
                        <TableCell key={column.key}>{formatCellValue(row[column.key], column.format)}</TableCell>
                      ))}
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              Görüntüle
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Düzenle
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Sil
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedData.map((row, index) => (
            <Card
              key={row.id || index}
              className="shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl border-0"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <Checkbox
                    checked={selectedRows.includes(row.id || index)}
                    onCheckedChange={() => handleSelectRow(row.id || index)}
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="h-4 w-4 mr-2" />
                        Görüntüle
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" />
                        Düzenle
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="space-y-2">
                  {visibleColumns.slice(0, 4).map((column) => (
                    <div key={column.key} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{column.label}:</span>
                      <span className="text-sm font-medium">{formatCellValue(row[column.key], column.format)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {startIndex + 1}-{Math.min(startIndex + pageSize, processedData.length)} / {processedData.length} kayıt
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Önceki
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="w-8 h-8 p-0"
                  >
                    {page}
                  </Button>
                )
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Sonraki
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
