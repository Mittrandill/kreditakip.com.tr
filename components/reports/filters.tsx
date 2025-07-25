"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Filter, RotateCcw } from "lucide-react"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { cn } from "@/lib/utils"

export interface ReportFilters {
  dateRange: {
    from?: Date
    to?: Date
    preset: string
  }
  bankFilter: string[]
  creditTypeFilter: string
  statusFilter: string
  amountRange: {
    min: number
    max: number
  }
}

interface ReportFiltersProps {
  filters: ReportFilters
  onFiltersChange: (filters: ReportFilters) => void
  onReset: () => void
  availableBanks?: string[]
}

export default function ReportFilters({ filters, onFiltersChange, onReset, availableBanks = [] }: ReportFiltersProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  const handleDatePresetChange = (preset: string) => {
    const now = new Date()
    let from: Date | undefined
    let to: Date | undefined

    switch (preset) {
      case "thisMonth":
        from = new Date(now.getFullYear(), now.getMonth(), 1)
        to = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        break
      case "lastMonth":
        from = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        to = new Date(now.getFullYear(), now.getMonth(), 0)
        break
      case "last3Months":
        from = new Date(now.getFullYear(), now.getMonth() - 3, 1)
        to = now
        break
      case "last6Months":
        from = new Date(now.getFullYear(), now.getMonth() - 6, 1)
        to = now
        break
      case "thisYear":
        from = new Date(now.getFullYear(), 0, 1)
        to = now
        break
      case "lastYear":
        from = new Date(now.getFullYear() - 1, 0, 1)
        to = new Date(now.getFullYear() - 1, 11, 31)
        break
      case "custom":
        // Keep current dates
        from = filters.dateRange.from
        to = filters.dateRange.to
        break
      default:
        from = undefined
        to = undefined
    }

    onFiltersChange({
      ...filters,
      dateRange: { from, to, preset }
    })
  }

  const handleDateRangeChange = (from: Date | undefined, to: Date | undefined) => {
    onFiltersChange({
      ...filters,
      dateRange: { ...filters.dateRange, from, to, preset: "custom" }
    })
  }

  const handleFilterChange = (key: keyof ReportFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  return (
    <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Filter className="h-5 w-5 text-emerald-600" />
          Rapor Filtreleri
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Date Range Filter */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Tarih Aralığı</Label>
          
          <Select value={filters.dateRange.preset} onValueChange={handleDatePresetChange}>
            <SelectTrigger>
              <SelectValue placeholder="Zaman dilimi seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Zamanlar</SelectItem>
              <SelectItem value="thisMonth">Bu Ay</SelectItem>
              <SelectItem value="lastMonth">Geçen Ay</SelectItem>
              <SelectItem value="last3Months">Son 3 Ay</SelectItem>
              <SelectItem value="last6Months">Son 6 Ay</SelectItem>
              <SelectItem value="thisYear">Bu Yıl</SelectItem>
              <SelectItem value="lastYear">Geçen Yıl</SelectItem>
              <SelectItem value="custom">Özel Tarih</SelectItem>
            </SelectContent>
          </Select>

          {filters.dateRange.preset === "custom" && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-gray-600">Başlangıç</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !filters.dateRange.from && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateRange.from ? (
                        format(filters.dateRange.from, "dd/MM/yyyy", { locale: tr })
                      ) : (
                        "Tarih seç"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateRange.from}
                      onSelect={(date) => handleDateRangeChange(date, filters.dateRange.to)}
                      initialFocus
                      locale={tr}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div>
                <Label className="text-xs text-gray-600">Bitiş</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !filters.dateRange.to && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateRange.to ? (
                        format(filters.dateRange.to, "dd/MM/yyyy", { locale: tr })
                      ) : (
                        "Tarih seç"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateRange.to}
                      onSelect={(date) => handleDateRangeChange(filters.dateRange.from, date)}
                      initialFocus
                      locale={tr}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}
        </div>

        {/* Bank Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Banka Filtresi</Label>
          <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-3">
            <div className="flex items-center space-x-2 mb-2">
              <input
                type="checkbox"
                id="all-banks"
                checked={filters.bankFilter.length === 0}
                onChange={() => handleFilterChange('bankFilter', [])}
                className="rounded border-gray-300"
              />
              <label htmlFor="all-banks" className="text-sm font-medium cursor-pointer">
                Tüm Bankalar
              </label>
            </div>
            {availableBanks.map((bank) => (
              <div key={bank} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`bank-${bank}`}
                  checked={filters.bankFilter.includes(bank)}
                  onChange={(e) => {
                    const newBanks = e.target.checked
                      ? [...filters.bankFilter, bank]
                      : filters.bankFilter.filter(b => b !== bank)
                    handleFilterChange('bankFilter', newBanks)
                  }}
                  className="rounded border-gray-300"
                />
                <label htmlFor={`bank-${bank}`} className="text-sm cursor-pointer">
                  {bank}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Credit Type Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Kredi Türü</Label>
          <Select value={filters.creditTypeFilter} onValueChange={(value) => handleFilterChange('creditTypeFilter', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Kredi türü seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Kredi Türleri</SelectItem>
              <SelectItem value="ihtiyac">İhtiyaç Kredisi</SelectItem>
              <SelectItem value="konut">Konut Kredisi</SelectItem>
              <SelectItem value="tasit">Taşıt Kredisi</SelectItem>
              <SelectItem value="ticari">Ticari Kredi</SelectItem>
              <SelectItem value="kreditkarti">Kredi Kartı</SelectItem>
              <SelectItem value="diger">Diğer</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Durum</Label>
          <Select value={filters.statusFilter} onValueChange={(value) => handleFilterChange('statusFilter', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Durum seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Durumlar</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="completed">Tamamlanmış</SelectItem>
              <SelectItem value="overdue">Gecikmiş</SelectItem>
              <SelectItem value="restructured">Yeniden Yapılandırılmış</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Amount Range Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Tutar Aralığı</Label>
          <Select 
            value={`${filters.amountRange.min}-${filters.amountRange.max}`} 
            onValueChange={(value) => {
              const [min, max] = value.split('-').map(Number)
              handleFilterChange('amountRange', { min, max })
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tutar aralığı seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0-999999999">Tüm Tutarlar</SelectItem>
              <SelectItem value="0-10000">0 - 10.000 TL</SelectItem>
              <SelectItem value="10000-50000">10.000 - 50.000 TL</SelectItem>
              <SelectItem value="50000-100000">50.000 - 100.000 TL</SelectItem>
              <SelectItem value="100000-250000">100.000 - 250.000 TL</SelectItem>
              <SelectItem value="250000-500000">250.000 - 500.000 TL</SelectItem>
              <SelectItem value="500000-999999999">500.000 TL+</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reset Button */}
        <div className="pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={onReset}
            className="w-full flex items-center gap-2 hover:bg-gray-50"
          >
            <RotateCcw className="h-4 w-4" />
            Filtreleri Sıfırla
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}