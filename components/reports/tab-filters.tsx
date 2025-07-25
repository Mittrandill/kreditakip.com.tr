"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Filter, RotateCcw, Search } from "lucide-react"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { cn } from "@/lib/utils"

export interface TabFilters {
  searchTerm: string
  bankFilter: string
  statusFilter: string
  dateRange: {
    from?: Date
    to?: Date
  }
  amountRange: {
    min: string
    max: string
  }
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

interface TabFiltersProps {
  tabId: string
  filters: TabFilters
  onFiltersChange: (filters: TabFilters) => void
  availableBanks: string[]
  availableStatuses?: { value: string, label: string }[]
  showAmountFilter?: boolean
  showDateFilter?: boolean
  className?: string
}

const DEFAULT_STATUSES = [
  { value: 'all', label: 'Tüm Durumlar' },
  { value: 'active', label: 'Aktif' },
  { value: 'passive', label: 'Pasif' },
  { value: 'completed', label: 'Tamamlanmış' },
  { value: 'pending', label: 'Beklemede' },
  { value: 'overdue', label: 'Gecikmiş' }
]

const SORT_OPTIONS = {
  'genel-bakis': [
    { value: 'date', label: 'Tarihe Göre' },
    { value: 'amount', label: 'Tutara Göre' },
    { value: 'bank', label: 'Bankaya Göre' }
  ],
  'kredi-kartlari': [
    { value: 'limit', label: 'Limite Göre' },
    { value: 'debt', label: 'Borç Tutarına Göre' },
    { value: 'utilization', label: 'Kullanım Oranına Göre' },
    { value: 'bank', label: 'Bankaya Göre' }
  ],
  'kredi-odemeleri': [
    { value: 'date', label: 'Ödeme Tarihine Göre' },
    { value: 'amount', label: 'Tutara Göre' },
    { value: 'status', label: 'Duruma Göre' },
    { value: 'bank', label: 'Bankaya Göre' }
  ],
  'aylik-ozet': [
    { value: 'month', label: 'Aya Göre' },
    { value: 'total', label: 'Toplam Tutara Göre' },
    { value: 'payment', label: 'Ödeme Tutarına Göre' }
  ],
  'banka-dagilim': [
    { value: 'total', label: 'Toplam Tutara Göre' },
    { value: 'count', label: 'Kredi Sayısına Göre' },
    { value: 'bank', label: 'Banka Adına Göre' }
  ]
}

export default function TabFilters({
  tabId,
  filters,
  onFiltersChange,
  availableBanks,
  availableStatuses = DEFAULT_STATUSES,
  showAmountFilter = true,
  showDateFilter = true,
  className
}: TabFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const updateFilter = (key: keyof TabFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const resetFilters = () => {
    onFiltersChange({
      searchTerm: '',
      bankFilter: 'all',
      statusFilter: 'all',
      dateRange: {},
      amountRange: { min: '', max: '' },
      sortBy: 'date',
      sortOrder: 'desc'
    })
  }

  const hasActiveFilters = filters.searchTerm || 
    filters.bankFilter !== 'all' || 
    filters.statusFilter !== 'all' ||
    filters.dateRange.from ||
    filters.dateRange.to ||
    filters.amountRange.min ||
    filters.amountRange.max

  const sortOptions = SORT_OPTIONS[tabId as keyof typeof SORT_OPTIONS] || SORT_OPTIONS['genel-bakis']

  return (
    <Card className={cn("mb-6", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5 text-emerald-600" />
            Filtreler
            {hasActiveFilters && (
              <span className="ml-2 px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full">
                Aktif
              </span>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="h-8 px-2 text-xs"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Temizle
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 px-2 text-xs"
            >
              {isExpanded ? 'Daralt' : 'Genişlet'}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Her zaman görünen temel filtreler */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Arama */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Ara..."
              value={filters.searchTerm}
              onChange={(e) => updateFilter('searchTerm', e.target.value)}
              className="pl-8"
            />
          </div>

          {/* Banka Filtresi */}
          <Select value={filters.bankFilter} onValueChange={(value) => updateFilter('bankFilter', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Banka seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Bankalar</SelectItem>
              {availableBanks.map(bank => (
                <SelectItem key={bank} value={bank}>
                  {bank}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Durum Filtresi */}
          <Select value={filters.statusFilter} onValueChange={(value) => updateFilter('statusFilter', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Durum seçin" />
            </SelectTrigger>
            <SelectContent>
              {availableStatuses.map(status => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sıralama */}
          <div className="flex gap-2">
            <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Sırala" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3"
            >
              {filters.sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
          </div>
        </div>

        {/* Genişletilmiş filtreler */}
        {isExpanded && (
          <div className="border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Tarih Aralığı */}
              {showDateFilter && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tarih Aralığı</Label>
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "flex-1 justify-start text-left font-normal",
                            !filters.dateRange.from && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.dateRange.from ? (
                            format(filters.dateRange.from, "dd/MM/yyyy", { locale: tr })
                          ) : (
                            "Başlangıç"
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={filters.dateRange.from}
                          onSelect={(date) => updateFilter('dateRange', { ...filters.dateRange, from: date })}
                          initialFocus
                          locale={tr}
                        />
                      </PopoverContent>
                    </Popover>
                    
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "flex-1 justify-start text-left font-normal",
                            !filters.dateRange.to && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.dateRange.to ? (
                            format(filters.dateRange.to, "dd/MM/yyyy", { locale: tr })
                          ) : (
                            "Bitiş"
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={filters.dateRange.to}
                          onSelect={(date) => updateFilter('dateRange', { ...filters.dateRange, to: date })}
                          initialFocus
                          locale={tr}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}

              {/* Tutar Aralığı */}
              {showAmountFilter && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tutar Aralığı</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Min tutar"
                      type="number"
                      value={filters.amountRange.min}
                      onChange={(e) => updateFilter('amountRange', { ...filters.amountRange, min: e.target.value })}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Max tutar"
                      type="number"
                      value={filters.amountRange.max}
                      onChange={(e) => updateFilter('amountRange', { ...filters.amountRange, max: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
              )}

              {/* Tab-özel ek filtreler */}
              {tabId === 'kredi-kartlari' && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Kullanım Oranı</Label>
                  <Select value={filters.statusFilter} onValueChange={(value) => updateFilter('statusFilter', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Oran seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Oranlar</SelectItem>
                      <SelectItem value="low">Düşük (0-30%)</SelectItem>
                      <SelectItem value="medium">Orta (30-70%)</SelectItem>
                      <SelectItem value="high">Yüksek (70-100%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}