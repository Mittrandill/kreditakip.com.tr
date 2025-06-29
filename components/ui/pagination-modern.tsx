"use client"

import * as React from "react"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationEllipsis,
} from "@/components/ui/pagination"
import { ChevronLeft, ChevronRight } from "lucide-react"

/**
 * Reusable modern pagination component.
 *
 * Props:
 *  - currentPage: aktif sayfa (1-based)
 *  - totalPages: toplam sayfa
 *  - totalItems: toplam kayıt
 *  - itemsPerPage: sayfa başına kayıt
 *  - onPageChange: (page) => void
 *  - itemName?: "kredi" | "taksit" | "analiz" | string (bilgi metninde kullanılır)
 */
export interface PaginationModernProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  itemName?: string
}

export function PaginationModern({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  itemName = "kayıt",
}: PaginationModernProps) {
  // Gösterilecek aralık bilgisi
  const startIdx = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1
  const endIdx = Math.min(currentPage * itemsPerPage, totalItems)

  // Akıllı sayfa numarası hesaplama (maks. 5 göster)
  const getVisiblePages = React.useCallback((): number[] => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1)

    if (currentPage <= 3) return [1, 2, 3, 4, 5]
    if (currentPage >= totalPages - 2)
      return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    return [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2]
  }, [currentPage, totalPages])

  const visiblePages = getVisiblePages()

  const gotoPage = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return
    onPageChange(page)
  }

  return (
    <div className="flex items-center justify-between mt-6">
      {/* Bilgi Metni */}
      <div className="text-sm text-gray-500">
        {startIdx}-{endIdx} arası, toplam {totalItems} {itemName}
      </div>

      {/* Sayfalandırma - Sağa Hizalı */}
      <div className="flex items-center">
        <Pagination>
          <PaginationContent className="gap-1">
            {/* Önceki */}
            <PaginationItem>
              <button
                onClick={() => gotoPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  currentPage === 1
                    ? "text-gray-400 cursor-not-allowed opacity-50"
                    : "text-gray-700 hover:text-white hover:bg-gradient-to-r hover:from-emerald-600 hover:to-teal-700 hover:shadow-lg transform hover:scale-105"
                }`}
              >
                <ChevronLeft className="h-4 w-4" />
                Önceki
              </button>
            </PaginationItem>

            {/* Sayfa Numaraları */}
            {visiblePages.map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  isActive={page === currentPage}
                  onClick={() => gotoPage(page)}
                  className={`cursor-pointer ${
                    page === currentPage
                      ? "bg-gradient-to-r from-emerald-600 to-teal-700 text-white hover:from-emerald-700 hover:to-teal-800"
                      : "hover:bg-emerald-100 hover:text-emerald-700"
                  }`}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}

            {/* … ellipsis */}
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}

            {/* Sonraki */}
            <PaginationItem>
              <button
                onClick={() => gotoPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  currentPage === totalPages
                    ? "text-gray-400 cursor-not-allowed opacity-50"
                    : "text-gray-700 hover:text-white hover:bg-gradient-to-r hover:from-emerald-600 hover:to-teal-700 hover:shadow-lg transform hover:scale-105"
                }`}
              >
                Sonraki
                <ChevronRight className="h-4 w-4" />
              </button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}
