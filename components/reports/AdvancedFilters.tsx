"use client"

import { useState, useCallback, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import { Checkbox } from "@/components/ui/checkbox"
// import { Calendar } from "@/components/ui/calendar"
import { 
  Filter, 
  X, 
  CalendarIcon, 
  Search,
  Save,
  RotateCcw,
  Settings2,
  Plus,
  Check,
  ChevronsUpDown
} from "lucide-react"
import { cn } from "@/lib/utils"
// import { format, startOfMonth, endOfMonth, subMonths, addMonths } from "date-fns"
// import { tr } from "date-fns/locale"

export interface AdvancedFilterState {
  searchTerm: string
  dateRange: {
    from?: Date
    to?: Date
    preset?: string
  }
  banks: string[]
  statuses: string[]
  creditTypes: string[]
  amountRange: {
    min: string
    max: string
  }
  customFilters: Record<string, any>
}

interface AdvancedFiltersProps {
  filters: AdvancedFilterState
  onFiltersChange: (filters: AdvancedFilterState) => void
  availableBanks: string[]
  availableStatuses: { value: string; label: string }[]
  availableCreditTypes: string[]
  onSavePreset?: (name: string, filters: AdvancedFilterState) => void
  savedPresets?: { name: string; filters: AdvancedFilterState }[]
}

const datePresets = [
  { label: "Bu Ay", value: "thisMonth" },
  { label: "Geçen Ay", value: "lastMonth" },
  { label: "Son 3 Ay", value: "last3Months" },
  { label: "Son 6 Ay", value: "last6Months" },
  { label: "Bu Yıl", value: "thisYear" },
  { label: "Geçen Yıl", value: "lastYear" },
  { label: "Tüm Zamanlar", value: "all" },
]

export function AdvancedFilters({
  filters,
  onFiltersChange,
  availableBanks,
  availableStatuses,
  availableCreditTypes,
  onSavePreset,
  savedPresets = []
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [bankSearchOpen, setBankSearchOpen] = useState(false)
  const [presetName, setPresetName] = useState("")
  const [showSavePreset, setShowSavePreset] = useState(false)

  // Active filter count
  const activeFilterCount = [
    filters.searchTerm && 1,
    filters.dateRange.preset !== 'all' && 1,
    filters.banks.length > 0 && 1,
    filters.statuses.length > 0 && 1,
    filters.creditTypes.length > 0 && 1,
    (filters.amountRange.min || filters.amountRange.max) && 1,
  ].filter(Boolean).length

  const updateFilters = useCallback((updates: Partial<AdvancedFilterState>) => {
    onFiltersChange({ ...filters, ...updates })
  }, [filters, onFiltersChange])

  const handleDatePresetChange = (preset: string) => {
    const now = new Date()
    let from: Date | undefined
    let to: Date | undefined

    switch (preset) {
      case 'thisMonth':
        from = new Date(now.getFullYear(), now.getMonth(), 1)
        to = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        break
      case 'lastMonth':
        from = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        to = new Date(now.getFullYear(), now.getMonth(), 0)
        break
      case 'last3Months':
        from = new Date(now.getFullYear(), now.getMonth() - 2, 1)
        to = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        break
      case 'last6Months':
        from = new Date(now.getFullYear(), now.getMonth() - 5, 1)
        to = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        break
      case 'thisYear':
        from = new Date(now.getFullYear(), 0, 1)
        to = new Date(now.getFullYear(), 11, 31)
        break
      case 'lastYear':
        from = new Date(now.getFullYear() - 1, 0, 1)
        to = new Date(now.getFullYear() - 1, 11, 31)
        break
      case 'all':
      default:
        from = undefined
        to = undefined
        break
    }

    updateFilters({
      dateRange: { from, to, preset }
    })
  }

  const handleBankToggle = (bank: string, checked: boolean) => {
    const newBanks = checked 
      ? [...filters.banks, bank]
      : filters.banks.filter(b => b !== bank)
    
    updateFilters({ banks: newBanks })
  }

  const handleStatusToggle = (status: string, checked: boolean) => {
    const newStatuses = checked 
      ? [...filters.statuses, status]
      : filters.statuses.filter(s => s !== status)
    
    updateFilters({ statuses: newStatuses })
  }

  const clearAllFilters = () => {
    updateFilters({
      searchTerm: "",
      dateRange: { preset: "all" },
      banks: [],
      statuses: [],
      creditTypes: [],
      amountRange: { min: "", max: "" },
      customFilters: {}
    })
  }

  const savePreset = () => {
    if (presetName.trim() && onSavePreset) {
      onSavePreset(presetName.trim(), filters)
      setPresetName("")
      setShowSavePreset(false)
    }
  }

  const loadPreset = (preset: { name: string; filters: AdvancedFilterState }) => {
    updateFilters(preset.filters)
  }

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={activeFilterCount > 0 ? "default" : "outline"}
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="relative"
          >
            <Filter className="h-4 w-4 mr-2" />
            Gelişmiş Filtreler
            {activeFilterCount > 0 && (
              <Badge 
                variant="secondary" 
                className="ml-2 bg-emerald-100 text-emerald-700 text-xs px-1.5 py-0.5"
              >
                {activeFilterCount}
              </Badge>
            )}
          </Button>

          {/* Quick Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Hızlı arama..."
              value={filters.searchTerm}
              onChange={(e) => updateFilters({ searchTerm: e.target.value })}
              className="pl-10 w-64"
            />
          </div>

          {/* Active Filters Display */}
          {activeFilterCount > 0 && (
            <div className="flex items-center gap-2">
              {filters.banks.map(bank => (
                <Badge 
                  key={bank} 
                  variant="secondary" 
                  className="flex items-center gap-1"
                >
                  {bank}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleBankToggle(bank, false)}
                  />
                </Badge>
              ))}
              {filters.statuses.map(status => {
                const statusLabel = availableStatuses.find(s => s.value === status)?.label || status
                return (
                  <Badge 
                    key={status} 
                    variant="secondary" 
                    className="flex items-center gap-1"
                  >
                    {statusLabel}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => handleStatusToggle(status, false)}
                    />
                  </Badge>
                )
              })}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-6 px-2 text-xs"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Temizle
              </Button>
            </div>
          )}
        </div>

        {/* Preset Management */}
        <div className="flex items-center gap-2">
          {savedPresets.length > 0 && (
            <Select onValueChange={(value) => {
              const preset = savedPresets.find(p => p.name === value)
              if (preset) loadPreset(preset)
            }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Kayıtlı Filtre..." />
              </SelectTrigger>
              <SelectContent>
                {savedPresets.map(preset => (
                  <SelectItem key={preset.name} value={preset.name}>
                    {preset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSavePreset(!showSavePreset)}
          >
            <Save className="h-4 w-4 mr-2" />
            Kaydet
          </Button>
        </div>
      </div>

      {/* Save Preset Input */}
      {showSavePreset && (
        <Card className="border-emerald-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Filtre seti adı..."
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                className="flex-1"
              />
              <Button onClick={savePreset} disabled={!presetName.trim()}>
                Kaydet
              </Button>
              <Button variant="ghost" onClick={() => setShowSavePreset(false)}>
                İptal
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Advanced Filter Panel */}
      {isOpen && (
        <Card className="border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings2 className="h-5 w-5 text-emerald-600" />
              Gelişmiş Filtreler
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Date Range Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Tarih Aralığı</Label>
                <Select 
                  value={filters.dateRange.preset || "all"} 
                  onValueChange={handleDatePresetChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {datePresets.map(preset => (
                      <SelectItem key={preset.value} value={preset.value}>
                        {preset.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Custom Date Range */}
                {filters.dateRange.preset === 'custom' && (
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm">
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          {filters.dateRange.from ? filters.dateRange.from.toLocaleDateString('tr-TR') : "Başlangıç"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <div className="p-4">
                          <Input
                            type="date"
                            value={filters.dateRange.from ? filters.dateRange.from.toISOString().split('T')[0] : ''}
                            onChange={(e) => updateFilters({ 
                              dateRange: { ...filters.dateRange, from: e.target.value ? new Date(e.target.value) : undefined } 
                            })}
                          />
                        </div>
                      </PopoverContent>
                    </Popover>
                    
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm">
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          {filters.dateRange.to ? filters.dateRange.to.toLocaleDateString('tr-TR') : "Bitiş"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <div className="p-4">
                          <Input
                            type="date"
                            value={filters.dateRange.to ? filters.dateRange.to.toISOString().split('T')[0] : ''}
                            onChange={(e) => updateFilters({ 
                              dateRange: { ...filters.dateRange, to: e.target.value ? new Date(e.target.value) : undefined } 
                            })}
                          />
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>

              {/* Bank Multi-Select */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Bankalar</Label>
                <Popover open={bankSearchOpen} onOpenChange={setBankSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={bankSearchOpen}
                      className="w-full justify-between"
                    >
                      {filters.banks.length > 0 
                        ? `${filters.banks.length} banka seçili`
                        : "Banka seç..."
                      }
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Banka ara..." />
                      <CommandEmpty>Banka bulunamadı.</CommandEmpty>
                      <CommandGroup className="max-h-64 overflow-auto">
                        {availableBanks.map((bank) => (
                          <CommandItem
                            key={bank}
                            onSelect={() => {
                              handleBankToggle(bank, !filters.banks.includes(bank))
                            }}
                          >
                            <Checkbox
                              checked={filters.banks.includes(bank)}
                              className="mr-2"
                            />
                            {bank}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Status Multi-Select */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Durum</Label>
                <div className="space-y-2">
                  {availableStatuses.map((status) => (
                    <div key={status.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={status.value}
                        checked={filters.statuses.includes(status.value)}
                        onCheckedChange={(checked) => 
                          handleStatusToggle(status.value, checked as boolean)
                        }
                      />
                      <Label 
                        htmlFor={status.value} 
                        className="text-sm font-normal cursor-pointer"
                      >
                        {status.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Amount Range */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Tutar Aralığı</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.amountRange.min}
                    onChange={(e) => updateFilters({
                      amountRange: { ...filters.amountRange, min: e.target.value }
                    })}
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.amountRange.max}
                    onChange={(e) => updateFilters({
                      amountRange: { ...filters.amountRange, max: e.target.value }
                    })}
                  />
                </div>
              </div>

              {/* Credit Types */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Kredi Türleri</Label>
                <Select 
                  value={filters.creditTypes[0] || ""} 
                  onValueChange={(value) => updateFilters({ creditTypes: value ? [value] : [] })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Kredi türü seç..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tümü</SelectItem>
                    {availableCreditTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Filter Actions */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {activeFilterCount > 0 && `${activeFilterCount} filtre aktif`}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={clearAllFilters}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Tümünü Temizle
                </Button>
                <Button onClick={() => setIsOpen(false)}>
                  Uygula
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}