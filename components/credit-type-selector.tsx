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
  CreditCard,
  Target,
  Heart,
  GraduationCap,
  Home,
  Car,
  Briefcase,
  ShoppingBag,
  Banknote,
  Building,
  Zap,
  Search,
  X,
  Loader2,
} from "lucide-react"

interface CreditTypeSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (creditType: any) => void
  selectedCreditType?: CreditType | null
  creditTypes?: CreditType[]
}

interface CreditType {
  id: string
  name: string
  category: string
  description: string
}

const categoryIcons: Record<string, any> = {
  konut: Home,
  tasit: Car,
  ticari: Briefcase,
  egitim: GraduationCap,
  saglik: Heart,
  tuketici: ShoppingBag,
  nakit: Banknote,
  yatirim: Building,
  enerji: Zap,
  diger: CreditCard,
}

const categoryColors: Record<string, string> = {
  konut: "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100",
  tasit: "bg-green-50 border-green-200 text-green-700 hover:bg-green-100",
  ticari: "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100",
  egitim: "bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100",
  saglik: "bg-pink-50 border-pink-200 text-pink-700 hover:bg-pink-100",
  tuketici: "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100",
  nakit: "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100",
  yatirim: "bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100",
  enerji: "bg-cyan-50 border-cyan-200 text-cyan-700 hover:bg-cyan-100",
  diger: "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100",
}

const categoryNames: Record<string, string> = {
  konut: "Konut Kredileri",
  tasit: "Taşıt Kredileri",
  ticari: "Ticari Krediler",
  egitim: "Eğitim Kredileri",
  saglik: "Sağlık Kredileri",
  tuketici: "Tüketici Kredileri",
  nakit: "Nakit Krediler",
  yatirim: "Yatırım Kredileri",
  enerji: "Enerji Kredileri",
  diger: "Diğer Krediler",
}

// Yedek kredi türleri
const fallbackCreditTypes: CreditType[] = [
  {
    id: "fb-1",
    name: "Konut Kredisi",
    category: "konut",
    description: "Ev satın alma, inşaat veya tadilat için kullanılabilen uzun vadeli kredi türü.",
  },
  {
    id: "fb-2",
    name: "Taşıt Kredisi",
    category: "tasit",
    description: "Sıfır veya ikinci el araç satın almak için kullanılan teminatlı kredi türü.",
  },
  {
    id: "fb-3",
    name: "İhtiyaç Kredisi",
    category: "tuketici",
    description: "Kişisel ihtiyaçlar için kullanılabilen genel amaçlı tüketici kredisi.",
  },
  {
    id: "fb-4",
    name: "Ticari Kredi",
    category: "ticari",
    description: "İşletmelerin finansman ihtiyaçları için tasarlanmış kredi türü.",
  },
  {
    id: "fb-5",
    name: "Eğitim Kredisi",
    category: "egitim",
    description: "Eğitim masrafları için özel olarak tasarlanmış avantajlı kredi türü.",
  },
  {
    id: "fb-6",
    name: "Sağlık Kredisi",
    category: "saglik",
    description: "Sağlık harcamaları ve tedavi masrafları için özel kredi türü.",
  },
]

export function CreditTypeSelector({
  open,
  onOpenChange,
  onSelect,
  selectedCreditType,
  creditTypes: propCreditTypes,
}: CreditTypeSelectorProps) {
  const [selectedCreditTypeState, setSelectedCreditTypeState] = useState<CreditType | null>(selectedCreditType || null)
  const [selectedCategory, setSelectedCategory] = useState<string>("konut")
  const [searchTerm, setSearchTerm] = useState("")
  const [creditTypes, setCreditTypes] = useState<CreditType[]>([])
  const [loading, setLoading] = useState(true)
  const [errorLoading, setErrorLoading] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      if (propCreditTypes && propCreditTypes.length > 0) {
        setCreditTypes(propCreditTypes)
        setLoading(false)
      } else {
        fetchCreditTypes()
      }
    }
  }, [open, propCreditTypes])

  async function fetchCreditTypes() {
    try {
      setLoading(true)
      setErrorLoading(null)

      const { data, error } = await supabase
        .from("credit_types")
        .select("id, name, category, description")
        .order("category, name")

      if (error) {
        console.error("Supabase error fetching credit types:", error)
        setErrorLoading("Kredi türleri yüklenirken bir sorun oluştu.")
        setCreditTypes(fallbackCreditTypes)
      } else {
        setCreditTypes(data || fallbackCreditTypes)
        if (data && data.length === 0) {
          setErrorLoading("Veritabanında kayıtlı kredi türü bulunamadı.")
          setCreditTypes(fallbackCreditTypes)
        }
      }
    } catch (error) {
      console.error("Error fetching credit types:", error)
      setErrorLoading("Kredi türleri yüklenemedi.")
      setCreditTypes(fallbackCreditTypes)
    } finally {
      setLoading(false)
    }
  }

  // Arama yapıldığında tüm kategorilerde ara ve eşleşme varsa o kategoriye geç
  useEffect(() => {
    if (searchTerm.trim()) {
      const matchingCreditType = creditTypes.find(
        (ct) =>
          ct.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (ct.description && ct.description.toLowerCase().includes(searchTerm.toLowerCase())),
      )
      if (matchingCreditType && matchingCreditType.category !== selectedCategory) {
        setSelectedCategory(matchingCreditType.category)
      }
    }
  }, [searchTerm, creditTypes, selectedCategory])

  const handleConfirm = () => {
    if (selectedCreditTypeState) {
      console.log(`🎯 Kredi türü seçildi:`, selectedCreditTypeState)
      onSelect(selectedCreditTypeState)
      onOpenChange(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    setSearchTerm("")
    setSelectedCategory("konut")
  }

  const categories = Array.from(new Set(creditTypes.map((ct) => ct.category))).sort()
  if (!categories.includes(selectedCategory) && categories.length > 0) {
    setSelectedCategory(categories[0])
  }

  const filteredCreditTypes = creditTypes.filter((creditType) => {
    if (searchTerm.trim()) {
      const matchesSearch =
        creditType.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (creditType.description && creditType.description.toLowerCase().includes(searchTerm.toLowerCase()))
      return matchesSearch
    } else {
      return creditType.category === selectedCategory
    }
  })

  if (!open) return null

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-md shadow-2xl">
          <CardContent className="flex items-center justify-center p-8">
            <Loader2 className="animate-spin h-8 w-8 text-emerald-600 mr-3" />
            <span className="text-gray-700">Kredi türleri yükleniyor...</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-5xl max-h-[85vh] flex flex-col shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
        {/* Header */}
        <CardHeader className="flex-shrink-0 border-b bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">Kredi Türü Seçin</CardTitle>
              <CardDescription className="text-emerald-100 mt-1">Kredi türünüzü seçerek devam edin</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClose} className="text-white hover:bg-white/20">
              <X className="h-5 w-5" />
            </Button>
          </div>
          {errorLoading && (
            <div className="bg-yellow-500/20 border border-yellow-300/30 rounded-lg p-3 text-sm text-yellow-100 mt-4">
              {errorLoading} Varsayılan kredi türleri gösteriliyor.
            </div>
          )}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 h-4 w-4" />
            <Input
              placeholder="Kredi türü ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white/20"
            />
          </div>
        </CardHeader>

        <div className="flex flex-1 min-h-0">
          {/* Kategori Listesi */}
          {!searchTerm.trim() && (
            <div className="w-72 border-r bg-gray-50/80 backdrop-blur-sm flex-shrink-0">
              <div className="p-4 border-b bg-white/50">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Kategoriler
                </h3>
              </div>
              <ScrollArea className="h-full">
                <div className="p-2 space-y-1">
                  {categories.map((category) => {
                    const Icon = categoryIcons[category] || CreditCard
                    const count = creditTypes.filter((ct) => ct.category === category).length
                    const categoryName = categoryNames[category] || category
                    return (
                      <Button
                        key={category}
                        variant={selectedCategory === category ? "default" : "ghost"}
                        className={`w-full justify-start text-left h-auto p-3 ${
                          selectedCategory === category
                            ? "bg-emerald-600 text-white hover:bg-emerald-700"
                            : "hover:bg-white/60"
                        }`}
                        onClick={() => setSelectedCategory(category)}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <Icon className="h-4 w-4 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{categoryName}</div>
                            <div
                              className={`text-xs ${
                                selectedCategory === category ? "text-emerald-100" : "text-gray-500"
                              }`}
                            >
                              {count} kredi türü
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

          {/* Kredi Türleri Listesi */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="p-4 border-b bg-white/50 flex-shrink-0">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                {searchTerm.trim()
                  ? `Arama Sonuçları (${filteredCreditTypes.length})`
                  : categoryNames[selectedCategory] || selectedCategory}
              </h3>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                {filteredCreditTypes.length === 0 ? (
                  <div className="text-center py-12">
                    <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg font-medium">
                      {searchTerm.trim()
                        ? "Arama kriterinize uygun kredi türü bulunamadı"
                        : "Bu kategoride kredi türü bulunamadı"}
                    </p>
                    <p className="text-gray-400 text-sm mt-2">
                      {searchTerm.trim() ? "Farklı anahtar kelimeler deneyin" : "Başka bir kategori seçin"}
                    </p>
                  </div>
                ) : (
                  filteredCreditTypes.map((creditType) => {
                    const isSelected = selectedCreditTypeState?.id === creditType.id
                    const Icon = categoryIcons[creditType.category] || CreditCard
                    const categoryName = categoryNames[creditType.category] || creditType.category

                    return (
                      <Card
                        key={creditType.id}
                        className={`cursor-pointer transition-all duration-200 hover:shadow-md border-2 ${
                          isSelected
                            ? "border-emerald-500 bg-emerald-50/50 shadow-md"
                            : "border-gray-200 hover:border-emerald-300 bg-white/60"
                        }`}
                        onClick={() => setSelectedCreditTypeState(creditType)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <Icon className="h-5 w-5 text-gray-500" />
                                <Badge
                                  variant="secondary"
                                  className={categoryColors[creditType.category] || "bg-gray-100"}
                                >
                                  {categoryName}
                                </Badge>
                              </div>

                              <h4 className="font-bold text-lg text-gray-900 mb-2">{creditType.name}</h4>
                              <p className="text-gray-600 text-sm leading-relaxed">{creditType.description}</p>
                            </div>
                            <div className="flex-shrink-0">
                              {isSelected && (
                                <div className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center">
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
              {selectedCreditTypeState ? (
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <strong>{selectedCreditTypeState.name}</strong> seçildi
                </span>
              ) : (
                "Bir kredi türü seçin"
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleClose} className="px-6 bg-transparent">
                İptal
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={!selectedCreditTypeState}
                className="px-6 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800"
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
