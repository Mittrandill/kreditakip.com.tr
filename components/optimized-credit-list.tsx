"use client"

import { memo, useMemo, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import BankLogo from "@/components/bank-logo"
import { formatCurrency } from "@/lib/format"
import { useVirtualScroll, useDebounce } from "@/lib/utils/performance"
import type { Credit } from "@/lib/types"

interface OptimizedCreditListProps {
  credits: Credit[]
  onCreditClick?: (credit: Credit) => void
  searchTerm?: string
  sortBy?: string
  sortOrder?: "asc" | "desc"
}

// Memoized credit item component
const CreditItem = memo(
  ({
    credit,
    onClick,
  }: {
    credit: Credit
    onClick?: (credit: Credit) => void
  }) => {
    const handleClick = useCallback(() => {
      onClick?.(credit)
    }, [credit, onClick])

    return (
      <Card className="hover:shadow-md transition-shadow duration-200 cursor-pointer" onClick={handleClick}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BankLogo bankName={credit.banks?.name || "Unknown"} logoUrl={credit.banks?.logo_url} size="sm" />
              <div>
                <h3 className="font-medium">{credit.banks?.name}</h3>
                <p className="text-sm text-gray-500">{credit.credit_code}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold">{formatCurrency(credit.remaining_debt)}</p>
              <Badge variant={credit.status === "active" ? "default" : "secondary"}>{credit.status}</Badge>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span>Progress</span>
                <span>{Math.round(credit.payment_progress || 0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${credit.payment_progress || 0}%` }}
                />
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Monthly</p>
              <p className="font-medium">{formatCurrency(credit.monthly_payment)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  },
)

CreditItem.displayName = "CreditItem"

export const OptimizedCreditList = memo(
  ({
    credits,
    onCreditClick,
    searchTerm = "",
    sortBy = "created_at",
    sortOrder = "desc",
  }: OptimizedCreditListProps) => {
    const debouncedSearchTerm = useDebounce(searchTerm, 300)

    // Memoized filtering and sorting
    const filteredAndSortedCredits = useMemo(() => {
      let filtered = credits

      // Apply search filter
      if (debouncedSearchTerm) {
        const searchLower = debouncedSearchTerm.toLowerCase()
        filtered = credits.filter(
          (credit) =>
            credit.banks?.name?.toLowerCase().includes(searchLower) ||
            credit.credit_code?.toLowerCase().includes(searchLower) ||
            credit.credit_types?.name?.toLowerCase().includes(searchLower),
        )
      }

      // Apply sorting
      return filtered.sort((a, b) => {
        let aValue: any = a[sortBy as keyof Credit]
        let bValue: any = b[sortBy as keyof Credit]

        // Handle nested properties
        if (sortBy === "bank_name") {
          aValue = a.banks?.name || ""
          bValue = b.banks?.name || ""
        } else if (sortBy === "credit_type") {
          aValue = a.credit_types?.name || ""
          bValue = b.credit_types?.name || ""
        }

        if (typeof aValue === "string") {
          aValue = aValue.toLowerCase()
          bValue = bValue.toLowerCase()
        }

        if (sortOrder === "asc") {
          return aValue > bValue ? 1 : -1
        } else {
          return aValue < bValue ? 1 : -1
        }
      })
    }, [credits, debouncedSearchTerm, sortBy, sortOrder])

    // Virtual scrolling for large lists
    const containerHeight = 600
    const itemHeight = 120
    const {
      items: visibleCredits,
      totalHeight,
      offsetY,
      onScroll,
    } = useVirtualScroll(filteredAndSortedCredits, itemHeight, containerHeight)

    if (credits.length === 0) {
      return <div className="text-center py-8 text-gray-500">No credits found</div>
    }

    return (
      <div className="overflow-auto" style={{ height: containerHeight }} onScroll={onScroll}>
        <div style={{ height: totalHeight, position: "relative" }}>
          <div
            style={{
              transform: `translateY(${offsetY}px)`,
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
            }}
          >
            <div className="space-y-4">
              {visibleCredits.map((credit, index) => (
                <div key={credit.id} style={{ height: itemHeight }}>
                  <CreditItem credit={credit} onClick={onCreditClick} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  },
)

OptimizedCreditList.displayName = "OptimizedCreditList"
