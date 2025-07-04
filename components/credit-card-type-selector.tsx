"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Loader2,
  Search,
  Check,
  X,
  CreditCard,
  Star,
  Shield,
  Plane,
  ShoppingBag,
  Fuel,
  Gift,
  Zap,
  Building,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface CreditCardType {
  id: string
  name: string
  category: string
  description?: string
  features?: string[]
}

interface CreditCardTypeSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (cardType: CreditCardType) => void
  selectedCardType?: CreditCardType | null
}

// Kredi kartı türü kategorileri
const cardTypeCategories = [
  { id: "all", name: "Tümü", icon: CreditCard },
  { id: "klasik", name: "Klasik", icon: CreditCard },
  { id: "gold", name: "Gold", icon: Star },
  { id: "platinum", name: "Platinum", icon: Shield },
  { id: "world", name: "World", icon: Plane },
  { id: "alisveris", name: "Alışveriş", icon: ShoppingBag },
  { id: "yakit", name: "Yakıt", icon: Fuel },
  { id: "cashback", name: "Cashback", icon: Gift },
  { id: "dijital", name: "Dijital", icon: Zap },
  { id: "ticari", name: "Ticari", icon: Building },
  { id: "kurumsal", name: "Kurumsal", icon: Users },
]

// Örnek kredi kartı türleri verisi
const sampleCardTypes: CreditCardType[] = [
  {
    id: "1",
    name: "Klasik Kart",
    category: "klasik",
    description: "Temel bankacılık hizmetleri",
    features: ["Temel özellikler", "Düşük yıllık ücret"],
  },
  {
    id: "2",
    name: "Gold Kart",
    category: "gold",
    description: "Gelişmiş avantajlar",
    features: ["Puan kazanma", "Sigorta avantajları", "Havalimanı lounges"],
  },
  {
    id: "3",
    name: "Platinum Kart",
    category: "platinum",
    description: "Premium hizmetler",
    features: ["Yüksek limit", "Concierge hizmeti", "Seyahat sigortası"],
  },
  {
    id: "4",
    name: "World Kart",
    category: "world",
    description: "Dünya çapında avantajlar",
    features: ["Global kabul", "Seyahat avantajları", "Mil kazanma"],
  },
  {
    id: "5",
    name: "Alışveriş Kartı",
    category: "alisveris",
    description: "Alışverişte ekstra avantajlar",
    features: ["Market indirimleri", "Online alışveriş puanları"],
  },
  {
    id: "6",
    name: "Yakıt Kartı",
    category: "yakit",
    description: "Yakıt alımlarında indirim",
    features: ["Yakıt indirimi", "Oto servis avantajları"],
  },
  {
    id: "7",
    name: "Cashback Kart",
    category: "cashback",
    description: "Nakit geri ödeme",
    features: ["Nakit iadesi", "Harcama kategorileri"],
  },
  {
    id: "8",
    name: "Dijital Kart",
    category: "dijital",
    description: "Tamamen dijital deneyim",
    features: ["Anında onay", "Mobil yönetim", "Sanal kart"],
  },
  {
    id: "9",
    name: "Ticari Kart",
    category: "ticari",
    description: "İşletmeler için özel",
    features: ["İşletme avantajları", "Harcama raporları"],
  },
  {
    id: "10",
    name: "Kurumsal Kart",
    category: "kurumsal",
    description: "Büyük şirketler için",
    features: ["Toplu yönetim", "Detaylı raporlama", "Özel limitler"],
  },
]

export function CreditCardTypeSelector({
  open,
  onOpenChange,
  onSelect,
  selectedCardType,
}: CreditCardTypeSelectorProps) {
  const [cardTypes, setCardTypes] = useState<CreditCardType[]>([])
  const [filteredCardTypes, setFilteredCardTypes] = useState<CreditCardType[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  // Kredi kartı türlerini yükle
  useEffect(() => {
    if (open) {
      setLoading(true)
      setError(null)

      // Simüle edilmiş API çağrısı
      setTimeout(() => {
        setCardTypes(sampleCardTypes)
        setFilteredCardTypes(sampleCardTypes)
        setLoading(false)
      }, 500)
    }
  }, [open])

  // Filtreleme
  useEffect(() => {
    let filtered = cardTypes

    // Kategori filtresi
    if (selectedCategory !== "all") {
      filtered = filtered.filter((type) => type.category === selectedCategory)
    }

    // Arama filtresi
    if (searchTerm) {
      filtered = filtered.filter(
        (type) =>
          type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          type.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          type.features?.some((feature) => feature.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    setFilteredCardTypes(filtered)
  }, [cardTypes, selectedCategory, searchTerm])

  const handleSelect = (cardType: CreditCardType) => {
    onSelect(cardType)
    onOpenChange(false)
  }

  const handleClose = () => {
    onOpenChange(false)
    setSearchTerm("")
    setSelectedCategory("all")
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[85vh] p-0 gap-0 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-6 rounded-t-lg">
          <DialogHeader className="space-y-3">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                <CreditCard className="h-7 w-7" />
                Kredi Kartı Türü Seçin
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="text-white hover:bg-white/20 h-8 w-8"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <p className="text-emerald-100 text-base">
              Kredi kartı türünüzü seçerek devam edin. Arama yapabilir veya kategorilere göre filtreleyebilirsiniz.
            </p>
          </DialogHeader>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Kredi kartı türü ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 text-base bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:border-emerald-500 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="flex flex-wrap gap-2">
            {cardTypeCategories.map((category) => {
              const Icon = category.icon
              const isSelected = selectedCategory === category.id
              return (
                <Button
                  key={category.id}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className={cn(
                    "flex items-center gap-2 h-10 px-4 transition-all duration-200",
                    isSelected
                      ? "bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-transparent shadow-md hover:from-emerald-700 hover:to-teal-800"
                      : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-300 dark:hover:border-emerald-600",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{category.name}</span>
                </Button>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              <p className="text-gray-600 dark:text-gray-400">Kredi kartı türleri yükleniyor...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <div className="text-red-500 text-center">
                <p className="font-medium">Hata oluştu</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{error}</p>
              </div>
              <Button onClick={() => window.location.reload()} variant="outline" size="sm">
                Tekrar Dene
              </Button>
            </div>
          ) : (
            <div className="h-[400px] overflow-y-auto p-6">
              {filteredCardTypes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full space-y-4 text-gray-500 dark:text-gray-400">
                  <CreditCard className="h-12 w-12" />
                  <div className="text-center">
                    <p className="font-medium">Kredi kartı türü bulunamadı</p>
                    <p className="text-sm">Arama kriterlerinizi değiştirmeyi deneyin</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredCardTypes.map((cardType) => {
                    const isSelected = selectedCardType?.id === cardType.id
                    const categoryInfo = cardTypeCategories.find((cat) => cat.id === cardType.category)
                    const Icon = categoryInfo?.icon || CreditCard

                    return (
                      <div
                        key={cardType.id}
                        onClick={() => handleSelect(cardType)}
                        className={cn(
                          "relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-lg group",
                          isSelected
                            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-md ring-2 ring-emerald-200 dark:ring-emerald-800"
                            : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-emerald-300 dark:hover:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/10",
                        )}
                      >
                        {/* Selection indicator */}
                        {isSelected && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        )}

                        <div className="flex flex-col items-center text-center space-y-3">
                          {/* Icon */}
                          <div
                            className={cn(
                              "w-12 h-12 rounded-lg flex items-center justify-center transition-colors duration-200",
                              isSelected
                                ? "bg-emerald-500 text-white"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30 group-hover:text-emerald-600 dark:group-hover:text-emerald-400",
                            )}
                          >
                            <Icon className="h-6 w-6" />
                          </div>

                          {/* Content */}
                          <div className="space-y-1">
                            <h3
                              className={cn(
                                "font-semibold text-sm leading-tight",
                                isSelected
                                  ? "text-emerald-900 dark:text-emerald-100"
                                  : "text-gray-900 dark:text-gray-100",
                              )}
                            >
                              {cardType.name}
                            </h3>
                            {cardType.description && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                                {cardType.description}
                              </p>
                            )}
                          </div>

                          {/* Features */}
                          {cardType.features && cardType.features.length > 0 && (
                            <div className="space-y-1">
                              {cardType.features.slice(0, 2).map((feature, index) => (
                                <div key={index} className="text-xs text-gray-500 dark:text-gray-400">
                                  • {feature}
                                </div>
                              ))}
                              {cardType.features.length > 2 && (
                                <div className="text-xs text-gray-400">+{cardType.features.length - 2} daha...</div>
                              )}
                            </div>
                          )}

                          {/* Category badge */}
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-xs px-2 py-1",
                              isSelected
                                ? "bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300",
                            )}
                          >
                            {categoryInfo?.name || cardType.category}
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {filteredCardTypes.length} kredi kartı türü listeleniyor
              {selectedCardType && (
                <span className="ml-2 font-medium text-emerald-600 dark:text-emerald-400">
                  • {selectedCardType.name} seçili
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleClose}
                className="border-gray-300 dark:border-gray-600 bg-transparent"
              >
                İptal
              </Button>
              {selectedCardType && (
                <Button
                  onClick={() => handleSelect(selectedCardType)}
                  className="bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-md"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Seç
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
