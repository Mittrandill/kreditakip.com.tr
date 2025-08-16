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
  Shield,
  Users,
  Heart,
  GraduationCap,
  Plane,
  Crown,
  Smartphone,
  Gift,
  Search,
  X,
  Loader2,
  Building2,
  Star,
  Zap,
} from "lucide-react"

interface CreditCardType {
  id: string
  name: string
  bank_name: string
  card_network: string
  program?: string
  segment: string
  category: string
  card_type: string
  description?: string
  annual_fee_info?: string
  special_features?: string[]
  is_active: boolean
  matched_bank_name?: string
  original_bank_name?: string
}

interface CreditCardTypeSelectorProps {
  onCreditCardTypeSelect: (creditCardType: CreditCardType) => void
  onSkip: () => void
  registeredBanks: Array<{ id: string; name: string; logo_url?: string }>
}

const categoryIcons: Record<string, any> = {
  "Klasik Kredi Kartları": CreditCard,
  "Premium Kredi Kartları": Crown,
  "Seyahat Kartları": Plane,
  "Öğrenci Kartları": GraduationCap,
  "Kadın Kartları": Heart,
  "Aidatsız Kartlar": Gift,
  "Katılım Kartları": Shield,
  "Ortak Markalı Kartlar": Users,
  "Dijital Kartlar": Smartphone,
  "Özel Segment Kartları": Target,
  "Gold Kartlar": Star,
  "Platinum Kartlar": Shield,
  "World Kartlar": Zap,
}

const categoryColors: Record<string, string> = {
  "Klasik Kredi Kartları": "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100",
  "Premium Kredi Kartları": "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100",
  "Seyahat Kartları": "bg-green-50 border-green-200 text-green-700 hover:bg-green-100",
  "Öğrenci Kartları": "bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100",
  "Kadın Kartları": "bg-pink-50 border-pink-200 text-pink-700 hover:bg-pink-100",
  "Aidatsız Kartlar": "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100",
  "Katılım Kartları": "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100",
  "Ortak Markalı Kartlar": "bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100",
  "Dijital Kartlar": "bg-cyan-50 border-cyan-200 text-cyan-700 hover:bg-cyan-100",
  "Özel Segment Kartları": "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100",
  "Gold Kartlar": "bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100",
  "Platinum Kartlar": "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100",
  "World Kartlar": "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100",
}

// Yedek kredi kartı türleri
const fallbackCreditCardTypes: CreditCardType[] = [
  {
    id: "fb-1",
    name: "Bonus Card",
    bank_name: "Garanti BBVA",
    card_network: "Visa/Mastercard",
    segment: "Classic",
    category: "Klasik Kredi Kartları",
    card_type: "Classic",
    description: "Türkiye'de ilk çok markalı kart olan Bonus Card.",
    is_active: true,
  },
  {
    id: "fb-2",
    name: "Worldcard",
    bank_name: "Yapı Kredi",
    card_network: "Visa/Mastercard",
    segment: "Classic",
    category: "Klasik Kredi Kartları",
    card_type: "Classic",
    description: "Türkiye'nin en yaygın kredi kartı programlarından World'ün kartları.",
    is_active: true,
  },
  {
    id: "fb-3",
    name: "Sağlam Kart",
    bank_name: "Kuveyt Türk",
    card_network: "Visa/Mastercard/Troy",
    segment: "Classic",
    category: "Katılım Kartları",
    card_type: "Classic",
    description: "Kuveyt Türk'ün faizsiz kredi kartıdır.",
    is_active: true,
  },
  {
    id: "fb-4",
    name: "Axess",
    bank_name: "Akbank",
    card_network: "Visa/Mastercard",
    segment: "Classic",
    category: "Klasik Kredi Kartları",
    card_type: "Classic",
    description: "Akbank'ın ana kredi kartı programı.",
    is_active: true,
  },
  {
    id: "fb-5",
    name: "Paraf",
    bank_name: "Halkbank",
    card_network: "Visa/Mastercard",
    segment: "Classic",
    category: "Klasik Kredi Kartları",
    card_type: "Classic",
    description: "Halkbank'ın Paraf kart ailesinin temel ürünleri.",
    is_active: true,
  },
]

// Banka adı eşleştirme fonksiyonu
function findMatchingBank(
  cardBankName: string,
  registeredBanks: Array<{ id: string; name: string; logo_url?: string }>,
): string {
  if (!cardBankName || !registeredBanks || registeredBanks.length === 0) {
    return cardBankName
  }

  // Önce tam eşleşme ara
  const exactMatch = registeredBanks.find((bank) => bank.name.toLowerCase() === cardBankName.toLowerCase())
  if (exactMatch) {
    return exactMatch.name
  }

  // Kısmi eşleşme ara
  const partialMatch = registeredBanks.find(
    (bank) =>
      bank.name.toLowerCase().includes(cardBankName.toLowerCase()) ||
      cardBankName.toLowerCase().includes(bank.name.toLowerCase()),
  )
  if (partialMatch) {
    return partialMatch.name
  }

  return cardBankName
}

export function CreditCardTypeSelector({
  onCreditCardTypeSelect,
  onSkip,
  registeredBanks = [],
}: CreditCardTypeSelectorProps) {
  const [selectedCreditCardType, setSelectedCreditCardType] = useState<CreditCardType | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("Klasik Kredi Kartları")
  const [searchTerm, setSearchTerm] = useState("")
  const [creditCardTypes, setCreditCardTypes] = useState<CreditCardType[]>([])
  const [loading, setLoading] = useState(true)
  const [errorLoading, setErrorLoading] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCreditCardTypes() {
      try {
        setLoading(true)
        setErrorLoading(null)
        const { data, error } = await supabase
          .from("credit_card_types")
          .select("*")
          .eq("is_active", true)
          .order("category, bank_name, name")

        if (error) {
          console.error("Supabase error fetching credit card types:", error)
          setErrorLoading("Kredi kartı türleri yüklenirken bir sorun oluştu.")
          setCreditCardTypes(fallbackCreditCardTypes)
        } else {
          setCreditCardTypes(data || fallbackCreditCardTypes)
          if (data && data.length === 0) {
            setErrorLoading("Veritabanında kayıtlı kredi kartı türü bulunamadı.")
            setCreditCardTypes(fallbackCreditCardTypes)
          }
        }
      } catch (error) {
        console.error("Error fetching credit card types:", error)
        setErrorLoading("Kredi kartı türleri yüklenemedi.")
        setCreditCardTypes(fallbackCreditCardTypes)
      } finally {
        setLoading(false)
      }
    }

    fetchCreditCardTypes()
  }, [])

  // Arama yapıldığında tüm kategorilerde ara ve eşleşme varsa o kategoriye geç
  useEffect(() => {
    if (searchTerm.trim()) {
      const matchingCreditCardType = creditCardTypes.find(
        (ct) =>
          ct.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ct.bank_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (ct.description && ct.description.toLowerCase().includes(searchTerm.toLowerCase())),
      )
      if (matchingCreditCardType && matchingCreditCardType.category !== selectedCategory) {
        setSelectedCategory(matchingCreditCardType.category)
      }
    }
  }, [searchTerm, creditCardTypes, selectedCategory])

  const handleConfirm = () => {
    if (selectedCreditCardType) {
      const matchedBankName = findMatchingBank(selectedCreditCardType.bank_name, registeredBanks)
      const updatedCreditCardType = {
        ...selectedCreditCardType,
        matched_bank_name: matchedBankName,
        original_bank_name: selectedCreditCardType.bank_name,
      }

      console.log("🎯 Kart türü seçildi:", {
        name: updatedCreditCardType.name,
        segment: updatedCreditCardType.segment,
        bank: matchedBankName,
      })

      onCreditCardTypeSelect(updatedCreditCardType)
    }
  }

  const categories = Array.from(new Set(creditCardTypes.map((ct) => ct.category))).sort()
  if (!categories.includes(selectedCategory) && categories.length > 0) {
    setSelectedCategory(categories[0])
  }

  const filteredCreditCardTypes = creditCardTypes.filter((creditCardType) => {
    if (searchTerm.trim()) {
      const matchesSearch =
        creditCardType.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        creditCardType.bank_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (creditCardType.description && creditCardType.description.toLowerCase().includes(searchTerm.toLowerCase()))
      return matchesSearch
    } else {
      return creditCardType.category === selectedCategory
    }
  })

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-md shadow-2xl">
          <CardContent className="flex items-center justify-center p-8">
            <Loader2 className="animate-spin h-8 w-8 text-purple-600 mr-3" />
            <span className="text-gray-700">Kredi kartı türleri yükleniyor...</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-5xl max-h-[85vh] flex flex-col shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
        {/* Header */}
        <CardHeader className="flex-shrink-0 border-b bg-gradient-to-r from-purple-600 via-purple-700 to-pink-700 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">Kredi Kartı Türü Seçin</CardTitle>
              <CardDescription className="text-purple-100 mt-1">
                Kredi kartınızın türünü seçerek devam edin
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onSkip} className="text-white hover:bg-white/20">
              <X className="h-5 w-5" />
            </Button>
          </div>
          {errorLoading && (
            <div className="bg-yellow-500/20 border border-yellow-300/30 rounded-lg p-3 text-sm text-yellow-100 mt-4">
              {errorLoading} Varsayılan kartlar gösteriliyor.
            </div>
          )}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 h-4 w-4" />
            <Input
              placeholder="Kart adı veya banka adı ile arayın..."
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
                    const count = creditCardTypes.filter((ct) => ct.category === category).length
                    return (
                      <Button
                        key={category}
                        variant={selectedCategory === category ? "default" : "ghost"}
                        className={`w-full justify-start text-left h-auto p-3 ${
                          selectedCategory === category
                            ? "bg-purple-600 text-white hover:bg-purple-700"
                            : "hover:bg-white/60"
                        }`}
                        onClick={() => setSelectedCategory(category)}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <Icon className="h-4 w-4 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{category}</div>
                            <div
                              className={`text-xs ${
                                selectedCategory === category ? "text-purple-100" : "text-gray-500"
                              }`}
                            >
                              {count} kart türü
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

          {/* Kredi Kartı Türleri Listesi */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="p-4 border-b bg-white/50 flex-shrink-0">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                {searchTerm.trim() ? `Arama Sonuçları (${filteredCreditCardTypes.length})` : selectedCategory}
              </h3>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                {filteredCreditCardTypes.length === 0 ? (
                  <div className="text-center py-12">
                    <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg font-medium">
                      {searchTerm.trim() ? "Arama kriterinize uygun kart bulunamadı" : "Bu kategoride kart bulunamadı"}
                    </p>
                    <p className="text-gray-400 text-sm mt-2">
                      {searchTerm.trim() ? "Farklı anahtar kelimeler deneyin" : "Başka bir kategori seçin"}
                    </p>
                  </div>
                ) : (
                  filteredCreditCardTypes.map((creditCardType) => {
                    const isSelected = selectedCreditCardType?.id === creditCardType.id
                    const matchedBankName = findMatchingBank(creditCardType.bank_name, registeredBanks)
                    const isBankMatched = matchedBankName !== creditCardType.bank_name

                    return (
                      <Card
                        key={creditCardType.id}
                        className={`cursor-pointer transition-all duration-200 hover:shadow-md border-2 ${
                          isSelected
                            ? "border-purple-500 bg-purple-50/50 shadow-md"
                            : "border-gray-200 hover:border-purple-300 bg-white/60"
                        }`}
                        onClick={() => setSelectedCreditCardType(creditCardType)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-4 w-4 text-gray-500" />
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium text-gray-600">
                                      {isBankMatched ? matchedBankName : creditCardType.bank_name}
                                    </span>
                                    {isBankMatched && (
                                      <span className="text-xs text-gray-400">
                                        (Orijinal: {creditCardType.bank_name})
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <Badge
                                  variant="secondary"
                                  className={categoryColors[creditCardType.category] || "bg-gray-100"}
                                >
                                  {creditCardType.category}
                                </Badge>
                                {isBankMatched && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs bg-green-50 text-green-700 border-green-200"
                                  >
                                    Eşleştirildi
                                  </Badge>
                                )}
                              </div>
                              <h4 className="font-bold text-lg text-gray-900 mb-1">{creditCardType.name}</h4>
                              <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                                <span className="flex items-center gap-1">
                                  <CreditCard className="h-3 w-3" />
                                  {creditCardType.card_network}
                                </span>
                                {creditCardType.segment && (
                                  <Badge variant="outline" className="text-xs">
                                    {creditCardType.segment}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-gray-600 text-sm leading-relaxed">
                                {creditCardType.description || "Kart açıklaması mevcut değil."}
                              </p>
                              {creditCardType.special_features && creditCardType.special_features.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {creditCardType.special_features.slice(0, 3).map((feature, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
                                      {feature}
                                    </Badge>
                                  ))}
                                  {creditCardType.special_features.length > 3 && (
                                    <Badge variant="secondary" className="text-xs">
                                      +{creditCardType.special_features.length - 3} daha
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="flex-shrink-0">
                              {isSelected && (
                                <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
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
              {selectedCreditCardType ? (
                <div className="flex flex-col gap-1">
                  <span className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <strong>{selectedCreditCardType.name}</strong> seçildi
                  </span>
                  {findMatchingBank(selectedCreditCardType.bank_name, registeredBanks) !==
                    selectedCreditCardType.bank_name && (
                    <span className="text-xs text-green-600">
                      Banka: {findMatchingBank(selectedCreditCardType.bank_name, registeredBanks)} olarak eşleştirildi
                    </span>
                  )}
                </div>
              ) : (
                "Bir kredi kartı türü seçin"
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onSkip} className="px-6 bg-transparent">
                Atla
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={!selectedCreditCardType}
                className="px-6 bg-gradient-to-r from-purple-600 to-pink-700 hover:from-purple-700 hover:to-pink-800"
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

export default CreditCardTypeSelector
