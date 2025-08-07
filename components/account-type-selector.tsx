"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import {
  Check,
  Wallet,
  Target,
  DollarSign,
  PiggyBank,
  Building,
  TrendingUp,
  Shield,
  Smartphone,
  Users,
  Search,
  X,
  Loader2,
} from "lucide-react"

interface AccountTypeSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (accountType: any) => void
  selectedAccountType?: AccountType | null
  accountTypes?: AccountType[]
}

interface AccountType {
  id: string
  name: string
  category: string
  description: string
}

const categoryIcons: Record<string, any> = {
  "Bireysel Mevduat": Wallet,
  "Döviz & Altın": DollarSign,
  "Birikim & Günlük Kazanç": PiggyBank,
  "Ticari & Kurumsal": Building,
  Yatırım: TrendingUp,
  "Katılım Bankacılığı": Shield,
  "Dijital & E-Para": Smartphone,
  "Özel Amaçlı / Segment": Users,
}

const categoryColors: Record<string, string> = {
  "Bireysel Mevduat": "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100",
  "Döviz & Altın": "bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100",
  "Birikim & Günlük Kazanç": "bg-green-50 border-green-200 text-green-700 hover:bg-green-100",
  "Ticari & Kurumsal": "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100",
  Yatırım: "bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100",
  "Katılım Bankacılığı": "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100",
  "Dijital & E-Para": "bg-cyan-50 border-cyan-200 text-cyan-700 hover:bg-cyan-100",
  "Özel Amaçlı / Segment": "bg-pink-50 border-pink-200 text-pink-700 hover:bg-pink-100",
}

// Yedek hesap türleri - güncellenmiş
const fallbackAccountTypes: AccountType[] = [
  {
    id: "fb-1",
    name: "Vadesiz Mevduat Hesabı",
    category: "Bireysel Mevduat",
    description: "Günlük bankacılık işlemleri için temel vadesiz hesap",
  },
  {
    id: "fb-2",
    name: "Vadeli Mevduat Hesabı",
    category: "Bireysel Mevduat",
    description: "Belirli vade ile yüksek faiz getirisi sağlayan hesap",
  },
  {
    id: "fb-3",
    name: "Vadesiz Döviz Hesabı",
    category: "Döviz & Altın",
    description: "Döviz cinsinden vadesiz hesap (USD, EUR, GBP)",
  },
  {
    id: "fb-4",
    name: "Menkul Kıymet Yatırım Hesabı",
    category: "Yatırım",
    description: "Hisse senedi ve menkul kıymet işlemleri hesabı",
  },
  {
    id: "fb-5",
    name: "Ticari Vadesiz (Cari) Hesap",
    category: "Ticari & Kurumsal",
    description: "İşletmeler için cari hesap",
  },
  {
    id: "fb-6",
    name: "Katılma Hesabı",
    category: "Katılım Bankacılığı",
    description: "Faizsiz vadeli hesap",
  },
  {
    id: "fb-7",
    name: "Dijital Vadesiz Hesap",
    category: "Dijital & E-Para",
    description: "Dijital bankacılık vadesiz hesap",
  },
  {
    id: "fb-8",
    name: "Çocuk Vadesiz Hesabı",
    category: "Özel Amaçlı / Segment",
    description: "Çocuklar için özel vadesiz hesap",
  },
]

export function AccountTypeSelector({
  open,
  onOpenChange,
  onSelect,
  selectedAccountType,
  accountTypes: propAccountTypes,
}: AccountTypeSelectorProps) {
  const [selectedAccountTypeState, setSelectedAccountTypeState] = useState<AccountType | null>(
    selectedAccountType || null,
  )
  const [selectedCategory, setSelectedCategory] = useState<string>("Bireysel Mevduat")
  const [searchTerm, setSearchTerm] = useState("")
  const [accountTypes, setAccountTypes] = useState<AccountType[]>([])
  const [loading, setLoading] = useState(true)
  const [errorLoading, setErrorLoading] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      if (propAccountTypes && propAccountTypes.length > 0) {
        setAccountTypes(propAccountTypes)
        setLoading(false)
      } else {
        fetchAccountTypes()
      }
    }
  }, [open, propAccountTypes])

  async function fetchAccountTypes() {
    try {
      setLoading(true)
      setErrorLoading(null)

      const { data, error } = await supabase
        .from("account_types")
        .select("id, name, category, description")
        .order("category, name")

      if (error) {
        setErrorLoading("Hesap türleri yüklenirken bir sorun oluştu.")
        setAccountTypes(fallbackAccountTypes)
      } else {
        setAccountTypes(data || fallbackAccountTypes)
        if (data && data.length === 0) {
          setErrorLoading("Veritabanında kayıtlı hesap türü bulunamadı.")
          setAccountTypes(fallbackAccountTypes)
        }
      }
    } catch (error) {
      setErrorLoading("Hesap türleri yüklenemedi.")
      setAccountTypes(fallbackAccountTypes)
    } finally {
      setLoading(false)
    }
  }

  // Arama yapıldığında tüm kategorilerde ara ve eşleşme varsa o kategoriye geç
  useEffect(() => {
    if (searchTerm.trim()) {
      const matchingAccountType = accountTypes.find(
        (at) =>
          at.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (at.description && at.description.toLowerCase().includes(searchTerm.toLowerCase())),
      )
      if (matchingAccountType && matchingAccountType.category !== selectedCategory) {
        setSelectedCategory(matchingAccountType.category)
      }
    }
  }, [searchTerm, accountTypes, selectedCategory])

  const handleConfirm = () => {
    if (selectedAccountTypeState) {
      onSelect(selectedAccountTypeState)
      onOpenChange(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    setSearchTerm("")
    setSelectedCategory("Bireysel Mevduat")
  }

  const categories = Array.from(new Set(accountTypes.map((at) => at.category))).sort()
  if (!categories.includes(selectedCategory) && categories.length > 0) {
    setSelectedCategory(categories[0])
  }

  const filteredAccountTypes = accountTypes.filter((accountType) => {
    if (searchTerm.trim()) {
      const matchesSearch =
        accountType.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (accountType.description && accountType.description.toLowerCase().includes(searchTerm.toLowerCase()))
      return matchesSearch
    } else {
      return accountType.category === selectedCategory
    }
  })

  if (!open) return null

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-md shadow-2xl">
          <CardContent className="flex items-center justify-center p-8">
            <Loader2 className="animate-spin h-8 w-8 text-blue-600 mr-3" />
            <span className="text-gray-700">Hesap türleri yükleniyor...</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-5xl max-h-[85vh] flex flex-col shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
        {/* Header */}
        <CardHeader className="flex-shrink-0 border-b bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">Hesap Türü Seçin</CardTitle>
              <CardDescription className="text-blue-100 mt-1">Hesap türünüzü seçerek devam edin</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClose} className="text-white hover:bg-white/20">
              <X className="h-5 w-5" />
            </Button>
          </div>
          {errorLoading && (
            <div className="bg-yellow-500/20 border border-yellow-300/30 rounded-lg p-3 text-sm text-yellow-100 mt-4">
              {errorLoading} Varsayılan hesap türleri gösteriliyor.
            </div>
          )}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 h-4 w-4" />
            <Input
              placeholder="Hesap türü ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white/20"
            />
          </div>
        </CardHeader>

        <div className="flex flex-1 min-h-0 max-h-[calc(85vh-200px)]">
          {/* Kategori Listesi */}
          {!searchTerm.trim() && (
            <div className="w-72 border-r bg-gray-50/80 backdrop-blur-sm flex-shrink-0 flex flex-col">
              <div className="p-4 border-b bg-white/50 flex-shrink-0">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Kategoriler
                </h3>
              </div>
              <ScrollArea className="flex-1 h-0">
                <div className="p-2 space-y-1">
                  {categories.map((category) => {
                    const Icon = categoryIcons[category] || Wallet
                    const count = accountTypes.filter((at) => at.category === category).length
                    return (
                      <Button
                        key={category}
                        variant={selectedCategory === category ? "default" : "ghost"}
                        className={`w-full justify-start text-left h-auto p-3 ${
                          selectedCategory === category
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : "hover:bg-white/60"
                        }`}
                        onClick={() => setSelectedCategory(category)}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <Icon className="h-4 w-4 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{category}</div>
                            <div
                              className={`text-xs ${selectedCategory === category ? "text-blue-100" : "text-gray-500"}`}
                            >
                              {count} hesap türü
                            </div>
                          </div>
                        </div>
                      </Button>
                    )
                  })}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Hesap Türleri Listesi */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="p-4 border-b bg-white/50 flex-shrink-0">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                {searchTerm.trim() ? `Arama Sonuçları (${filteredAccountTypes.length})` : selectedCategory}
              </h3>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                {filteredAccountTypes.length === 0 ? (
                  <div className="text-center py-12">
                    <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg font-medium">
                      {searchTerm.trim()
                        ? "Arama kriterinize uygun hesap türü bulunamadı"
                        : "Bu kategoride hesap türü bulunamadı"}
                    </p>
                    <p className="text-gray-400 text-sm mt-2">
                      {searchTerm.trim() ? "Farklı anahtar kelimeler deneyin" : "Başka bir kategori seçin"}
                    </p>
                  </div>
                ) : (
                  filteredAccountTypes.map((accountType) => {
                    const isSelected = selectedAccountTypeState?.id === accountType.id
                    const Icon = categoryIcons[accountType.category] || Wallet

                    return (
                      <Card
                        key={accountType.id}
                        className={`cursor-pointer transition-all duration-200 hover:shadow-md border-2 ${
                          isSelected
                            ? "border-blue-500 bg-blue-50/50 shadow-md"
                            : "border-gray-200 hover:border-blue-300 bg-white/60"
                        }`}
                        onClick={() => setSelectedAccountTypeState(accountType)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <Icon className="h-5 w-5 text-gray-500" />
                                <Badge
                                  variant="secondary"
                                  className={categoryColors[accountType.category] || "bg-gray-100"}
                                >
                                  {accountType.category}
                                </Badge>
                              </div>

                              <h4 className="font-bold text-lg text-gray-900 mb-2">{accountType.name}</h4>
                              <p className="text-gray-600 text-sm leading-relaxed">{accountType.description}</p>
                            </div>
                            <div className="flex-shrink-0">
                              {isSelected && (
                                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                                  <Check className="h-4 w-4 text-white" />
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t bg-white/80 backdrop-blur-sm p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {selectedAccountTypeState ? (
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <strong>{selectedAccountTypeState.name}</strong> seçildi
                </span>
              ) : (
                "Bir hesap türü seçin"
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleClose} className="px-6 bg-transparent">
                İptal
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={!selectedAccountTypeState}
                className="px-6 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800"
              >
                Seç ve Devam Et
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
