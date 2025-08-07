"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Search,
  Filter,
  X,
  CalendarIcon,
  DollarSign,
  Building2,
  TrendingUp,
  RotateCcw,
  Save,
  Sparkles,
  Zap,
  Target,
  Settings,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface SmartFiltersProps {
  tabId: string
  filters: any
  onFiltersChange: (filters: any) => void
  availableBanks: string[]
  availableStatuses?: { value: string; label: string }[]
  showAmountFilter?: boolean
  showDateFilter?: boolean
  showAdvancedOptions?: boolean
}

export function SmartFilters({
  tabId,
  filters,
  onFiltersChange,
  availableBanks,
  availableStatuses = [
    { value: "all", label: "Tüm Durumlar" },
    { value: "active", label: "Aktif" },
    { value: "inactive", label: "Pasif" },
  ],
  showAmountFilter = true,
  showDateFilter = true,
  showAdvancedOptions = false,
}: SmartFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({})
  const [amountRange, setAmountRange] = useState([0, 1000000])
  const [savedFilters, setSavedFilters] = useState<any[]>([])
  const [aiSuggestions, setAiSuggestions] = useState(true)

  // Smart filter presets
  const filterPresets = [
    {
      id: "high-risk",
      name: "Yüksek Risk",
      icon: <Target className="h-4 w-4" />,
      description: "Geciken ödemeler ve yüksek kullanım",
      filters: {
        statusFilter: "overdue",
        amountRange: { min: "5000", max: "" },
        sortBy: "amount",
        sortOrder: "desc",
      },
    },
    {
      id: "recent-activity",
      name: "Son Aktivite",
      icon: <TrendingUp className="h-4 w-4" />,
      description: "Son 30 gündeki işlemler",
      filters: {
        dateRange: { preset: "last30days" },
        sortBy: "date",
        sortOrder: "desc",
      },
    },
    {
      id: "large-amounts",
      name: "Büyük Tutarlar",
      icon: <DollarSign className="h-4 w-4" />,
      description: "10.000 TL üzeri işlemler",
      filters: {
        amountRange: { min: "10000", max: "" },
        sortBy: "amount",
        sortOrder: "desc",
      },
    },
    {
      id: "performance-focus",
      name: "Performans Odaklı",
      icon: <Sparkles className="h-4 w-4" />,
      description: "En iyi performans gösteren hesaplar",
      filters: {
        statusFilter: "active",
        sortBy: "performance",
        sortOrder: "desc",
      },
    },
  ]

  // AI-powered filter suggestions
  const aiFilterSuggestions = [
    {
      type: "optimization",
      title: "Optimizasyon Fırsatı",
      description: "Yüksek faizli kredileri göster",
      action: () => {
        onFiltersChange({
          ...filters,
          sortBy: "interestRate",
          sortOrder: "desc",
          amountRange: { min: "1000", max: "" },
        })
      },
    },
    {
      type: "attention",
      title: "Dikkat Gereken",
      description: "Yaklaşan vade tarihleri",
      action: () => {
        onFiltersChange({
          ...filters,
          dateRange: { preset: "next7days" },
          statusFilter: "pending",
        })
      },
    },
    {
      type: "opportunity",
      title: "Fırsat Analizi",
      description: "Düşük kullanımlı kartlar",
      action: () => {
        onFiltersChange({
          ...filters,
          statusFilter: "low",
          sortBy: "utilization",
          sortOrder: "asc",
        })
      },
    },
  ]

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value }
    onFiltersChange(newFilters)
  }

  const handlePresetApply = (preset: any) => {
    const newFilters = { ...filters, ...preset.filters }
    onFiltersChange(newFilters)
  }

  const handleResetFilters = () => {
    const resetFilters = {
      searchTerm: "",
      bankFilter: "all",
      statusFilter: "all",
      dateRange: {},
      amountRange: { min: "", max: "" },
      sortBy: "date",
      sortOrder: "desc",
    }
    onFiltersChange(resetFilters)
    setDateRange({})
    setAmountRange([0, 1000000])
  }

  const handleSaveFilter = () => {
    const filterName = `Filtre ${savedFilters.length + 1}`
    const newSavedFilter = {
      id: Date.now().toString(),
      name: filterName,
      filters: { ...filters },
      createdAt: new Date(),
    }
    setSavedFilters([...savedFilters, newSavedFilter])
  }

  const getActiveFilterCount = () => {
    let count = 0
    if (filters.searchTerm) count++
    if (filters.bankFilter !== "all") count++
    if (filters.statusFilter !== "all") count++
    if (filters.dateRange && Object.keys(filters.dateRange).length > 0) count++
    if (filters.amountRange && (filters.amountRange.min || filters.amountRange.max)) count++
    return count
  }

  const activeFilterCount = getActiveFilterCount()

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-r from-white to-gray-50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Filter className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">Akıllı Filtreler</CardTitle>
              <p className="text-sm text-gray-600">Verilerinizi özelleştirin ve analiz edin</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                {activeFilterCount} aktif filtre
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="h-8">
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {isExpanded ? "Daralt" : "Genişlet"}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Quick Filter Presets */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-700">Hızlı Filtreler</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {filterPresets.map((preset) => (
              <Button
                key={preset.id}
                variant="outline"
                size="sm"
                onClick={() => handlePresetApply(preset)}
                className="h-auto p-3 flex flex-col items-start gap-1 hover:bg-emerald-50 hover:border-emerald-200 transition-all duration-200"
              >
                <div className="flex items-center gap-2 w-full">
                  {preset.icon}
                  <span className="font-medium text-xs">{preset.name}</span>
                </div>
                <span className="text-xs text-gray-500 text-left">{preset.description}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* AI Suggestions */}
        {aiSuggestions && showAdvancedOptions && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Zap className="h-4 w-4 text-purple-500" />
                AI Önerileri
              </Label>
              <Switch checked={aiSuggestions} onCheckedChange={setAiSuggestions} size="sm" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {aiFilterSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="p-3 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-lg cursor-pointer hover:shadow-md transition-all duration-200"
                  onClick={suggestion.action}
                >
                  <div className="flex items-start gap-2">
                    <div className="p-1 bg-purple-500 rounded text-white">
                      <Sparkles className="h-3 w-3" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm text-purple-900">{suggestion.title}</h4>
                      <p className="text-xs text-purple-700 mt-1">{suggestion.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Basic Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search" className="text-sm font-medium text-gray-700">
              Arama
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                placeholder="Banka, kod veya açıklama..."
                value={filters.searchTerm || ""}
                onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Bank Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Banka
            </Label>
            <Select
              value={filters.bankFilter || "all"}
              onValueChange={(value) => handleFilterChange("bankFilter", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Banka seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Bankalar</SelectItem>
                {availableBanks.map((bank) => (
                  <SelectItem key={bank} value={bank}>
                    {bank}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Durum</Label>
            <Select
              value={filters.statusFilter || "all"}
              onValueChange={(value) => handleFilterChange("statusFilter", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Durum seçin" />
              </SelectTrigger>
              <SelectContent>
                {availableStatuses.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Advanced Filters */}
        {isExpanded && (
          <div className="space-y-6 pt-4 border-t border-gray-200">
            {/* Date Range Filter */}
            {showDateFilter && (
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Tarih Aralığı
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { value: "today", label: "Bugün" },
                    { value: "thisWeek", label: "Bu Hafta" },
                    { value: "thisMonth", label: "Bu Ay" },
                    { value: "last3Months", label: "Son 3 Ay" },
                    { value: "last6Months", label: "Son 6 Ay" },
                    { value: "thisYear", label: "Bu Yıl" },
                    { value: "lastYear", label: "Geçen Yıl" },
                    { value: "custom", label: "Özel Aralık" },
                  ].map((option) => (
                    <Button
                      key={option.value}
                      variant={filters.dateRange?.preset === option.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleFilterChange("dateRange", { preset: option.value })}
                      className="justify-start"
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>

                {filters.dateRange?.preset === "custom" && (
                  <div className="grid grid-cols-2 gap-3">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "justify-start text-left font-normal",
                            !dateRange.from && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange.from ? format(dateRange.from, "PPP", { locale: tr }) : "Başlangıç tarihi"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={dateRange.from}
                          onSelect={(date) => setDateRange({ ...dateRange, from: date })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "justify-start text-left font-normal",
                            !dateRange.to && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange.to ? format(dateRange.to, "PPP", { locale: tr }) : "Bitiş tarihi"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={dateRange.to}
                          onSelect={(date) => setDateRange({ ...dateRange, to: date })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>
            )}

            {/* Amount Range Filter */}
            {showAmountFilter && (
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Tutar Aralığı
                </Label>
                <div className="space-y-4">
                  <div className="px-3">
                    <Slider
                      value={amountRange}
                      onValueChange={setAmountRange}
                      max={1000000}
                      min={0}
                      step={1000}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{amountRange[0].toLocaleString("tr-TR")} ₺</span>
                      <span>{amountRange[1].toLocaleString("tr-TR")} ₺</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-gray-600">Min Tutar</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={filters.amountRange?.min || ""}
                        onChange={(e) =>
                          handleFilterChange("amountRange", {
                            ...filters.amountRange,
                            min: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Max Tutar</Label>
                      <Input
                        type="number"
                        placeholder="Sınırsız"
                        value={filters.amountRange?.max || ""}
                        onChange={(e) =>
                          handleFilterChange("amountRange", {
                            ...filters.amountRange,
                            max: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sorting Options */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Sıralama
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <Select value={filters.sortBy || "date"} onValueChange={(value) => handleFilterChange("sortBy", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sırala" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Tarihe Göre</SelectItem>
                    <SelectItem value="amount">Tutara Göre</SelectItem>
                    <SelectItem value="bank">Bankaya Göre</SelectItem>
                    <SelectItem value="status">Duruma Göre</SelectItem>
                    {showAdvancedOptions && (
                      <>
                        <SelectItem value="performance">Performansa Göre</SelectItem>
                        <SelectItem value="risk">Risk Seviyesine Göre</SelectItem>
                        <SelectItem value="utilization">Kullanım Oranına Göre</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>

                <Select
                  value={filters.sortOrder || "desc"}
                  onValueChange={(value) => handleFilterChange("sortOrder", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sıra" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Artan</SelectItem>
                    <SelectItem value="desc">Azalan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Advanced Options */}
            {showAdvancedOptions && (
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Gelişmiş Seçenekler
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-gray-600">AI Önerilerini Göster</Label>
                    <Switch checked={aiSuggestions} onCheckedChange={setAiSuggestions} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-gray-600">Trend Analizini Dahil Et</Label>
                    <Switch checked={true} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-gray-600">Risk Skorunu Göster</Label>
                    <Switch checked={true} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-gray-600">Performans Metriklerini Dahil Et</Label>
                    <Switch checked={true} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="text-gray-600 hover:text-gray-800 bg-transparent"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Sıfırla
            </Button>
            {showAdvancedOptions && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveFilter}
                className="text-blue-600 hover:text-blue-800 bg-transparent"
              >
                <Save className="h-4 w-4 mr-1" />
                Kaydet
              </Button>
            )}
          </div>

          {activeFilterCount > 0 && (
            <Badge className="bg-emerald-500 text-white">{activeFilterCount} filtre aktif</Badge>
          )}
        </div>

        {/* Saved Filters */}
        {savedFilters.length > 0 && showAdvancedOptions && (
          <div className="space-y-3 pt-4 border-t border-gray-200">
            <Label className="text-sm font-medium text-gray-700">Kayıtlı Filtreler</Label>
            <div className="flex flex-wrap gap-2">
              {savedFilters.map((savedFilter) => (
                <Button
                  key={savedFilter.id}
                  variant="outline"
                  size="sm"
                  onClick={() => onFiltersChange(savedFilter.filters)}
                  className="h-8 text-xs"
                >
                  {savedFilter.name}
                  <X
                    className="h-3 w-3 ml-1 hover:text-red-500"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSavedFilters(savedFilters.filter((f) => f.id !== savedFilter.id))
                    }}
                  />
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
