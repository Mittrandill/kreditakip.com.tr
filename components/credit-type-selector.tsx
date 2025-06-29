"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Check,
  Search,
  CreditCard,
  Building2,
  Sprout,
  ChurchIcon as Mosque,
  Banknote,
  Globe,
  Hammer,
  Settings,
  AlertTriangle,
  Sparkles,
  Target,
  Home,
  Car,
  Truck,
  Store,
  Factory,
  Landmark,
  PiggyBank,
  Wallet,
  TrendingUp,
  Shield,
  Users,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"

interface CreditTypeSelectorProps {
  onCreditTypeSelect: (creditType: any) => void
  onSkip: () => void
  initialSelectedCategory?: string
}

interface CreditType {
  id: string
  name: string
  description: string
  category: string
}

const categoryIcons: Record<string, any> = {
  "Bireysel Krediler": CreditCard,
  "Ticari Krediler": Building2,
  "Tarım Kredileri": Sprout,
  "Katılım Kredileri": Mosque,
  "Kredi Kartı Kredileri": Banknote,
  "Dövizli Krediler": Globe,
  "Proje Kredileri": Hammer,
  "Alternatif Finansman": Settings,
  Diğer: Settings,
}

// Kredi türleri için ikonlar
const creditTypeIcons: Record<string, any> = {
  "Genel İhtiyaç Kredisi": CreditCard,
  "Taşıt Kredisi (Bireysel)": Car,
  "Konut Kredisi (Mortgage)": Home,
  "İşletme Sermayesi Kredisi": Building2,
  "Ticari Taşıt Kredisi": Truck,
  "Esnaf Kredisi": Store,
  "Tarım Kredisi": Sprout,
  "Katılım Kredisi": Mosque,
  "Kredi Kartı Kredisi": Banknote,
  "Döviz Kredisi": Globe,
  "Proje Kredisi": Hammer,
  "Yatırım Kredisi": TrendingUp,
  "İhracat Kredisi": Globe,
  "İthalat Kredisi": Globe,
  "Tüketici Kredisi": Wallet,
  "Bireysel Finansman": PiggyBank,
  "KOBİ Kredisi": Factory,
  "Kamu Kredisi": Landmark,
  "Sigortalı Kredi": Shield,
  "Grup Kredisi": Users,
  "Diğer Kredi": Settings,
}

const categoryBadgeColors: Record<string, string> = {
  "Bireysel Krediler": "bg-blue-100 border-blue-300 text-blue-700",
  "Ticari Krediler": "bg-emerald-100 border-emerald-300 text-emerald-700",
  "Tarım Kredileri": "bg-yellow-100 border-yellow-300 text-yellow-700",
  "Katılım Kredileri": "bg-purple-100 border-purple-300 text-purple-700",
  "Kredi Kartı Kredileri": "bg-pink-100 border-pink-300 text-pink-700",
  "Dövizli Krediler": "bg-indigo-100 border-indigo-300 text-indigo-700",
  "Proje Kredileri": "bg-orange-100 border-orange-300 text-orange-700",
  "Alternatif Finansman": "bg-gray-100 border-gray-300 text-gray-700",
  Diğer: "bg-teal-100 border-teal-300 text-teal-700",
}

// Daha kapsamlı bir yedek liste
const fallbackCreditTypes: CreditType[] = [
  {
    id: "fb-1",
    name: "Genel İhtiyaç Kredisi",
    description: "Acil nakit ihtiyaçları için bireysel kredi.",
    category: "Bireysel Krediler",
  },
  {
    id: "fb-2",
    name: "Taşıt Kredisi (Bireysel)",
    description: "Bireysel araç alımları için finansman.",
    category: "Bireysel Krediler",
  },
  {
    id: "fb-3",
    name: "Konut Kredisi (Mortgage)",
    description: "Ev sahibi olmak için uzun vadeli kredi.",
    category: "Bireysel Krediler",
  },
  {
    id: "fb-4",
    name: "İşletme Sermayesi Kredisi",
    description: "Ticari faaliyetlerin devamlılığı için.",
    category: "Ticari Krediler",
  },
  {
    id: "fb-5",
    name: "Ticari Taşıt Kredisi",
    description: "İşletmeler için araç alım kredisi.",
    category: "Ticari Krediler",
  },
  {
    id: "fb-6",
    name: "Esnaf Kredisi",
    description: "Küçük ve orta ölçekli esnaflar için.",
    category: "Ticari Krediler",
  },
  {
    id: "fb-7",
    name: "Tarım Kredisi",
    description: "Tarımsal faaliyetler için finansman.",
    category: "Tarım Kredileri",
  },
  { id: "fb-8", name: "Diğer Kredi", description: "Listede bulunmayan diğer kredi türleri.", category: "Diğer" },
]

export default function CreditTypeSelector({
  onCreditTypeSelect,
  onSkip,
  initialSelectedCategory,
}: CreditTypeSelectorProps) {
  const [selectedCreditType, setSelectedCreditType] = useState<CreditType | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>(initialSelectedCategory || "Bireysel Krediler")
  const [searchTerm, setSearchTerm] = useState("")
  const [creditTypes, setCreditTypes] = useState<CreditType[]>([])
  const [loading, setLoading] = useState(true)
  const [errorLoading, setErrorLoading] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCreditTypes() {
      try {
        setLoading(true)
        setErrorLoading(null)
        const { data, error } = await supabase
          .from("credit_types")
          .select("id, name, description, category")
          .order("category, name")

        if (error) {
          console.error("Supabase error fetching credit types:", error)
          setErrorLoading(
            "Kredi türleri yüklenirken bir sorun oluştu. Lütfen daha sonra tekrar deneyin veya yaygın türlerden birini seçin.",
          )
          setCreditTypes(fallbackCreditTypes)
        } else {
          setCreditTypes(data || fallbackCreditTypes)
          if (data && data.length === 0) {
            setErrorLoading(
              "Veritabanında kayıtlı kredi türü bulunamadı. Lütfen yöneticinizle iletişime geçin veya yaygın türlerden seçin.",
            )
          }
        }
      } catch (error) {
        console.error("Error fetching credit types:", error)
        setErrorLoading(
          "Kredi türleri yüklenemedi. İnternet bağlantınızı kontrol edin veya yaygın türlerden birini seçin.",
        )
        setCreditTypes(fallbackCreditTypes)
      } finally {
        setLoading(false)
      }
    }

    fetchCreditTypes()
  }, [])

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
    if (selectedCreditType) {
      onCreditTypeSelect(selectedCreditType)
    }
  }

  // Kredi türü için ikon bulma fonksiyonu
  const getCreditTypeIcon = (creditTypeName: string) => {
    // Tam eşleşme ara
    if (creditTypeIcons[creditTypeName]) {
      return creditTypeIcons[creditTypeName]
    }

    // Kısmi eşleşme ara
    const lowerName = creditTypeName.toLowerCase()
    if (lowerName.includes("konut") || lowerName.includes("ev") || lowerName.includes("mortgage")) return Home
    if (lowerName.includes("taşıt") || lowerName.includes("araç") || lowerName.includes("otomobil")) return Car
    if (lowerName.includes("ticari taşıt") || lowerName.includes("kamyon")) return Truck
    if (lowerName.includes("esnaf") || lowerName.includes("dükkan")) return Store
    if (lowerName.includes("tarım") || lowerName.includes("çiftçi")) return Sprout
    if (lowerName.includes("katılım") || lowerName.includes("faizsiz")) return Mosque
    if (lowerName.includes("kredi kartı") || lowerName.includes("kart")) return Banknote
    if (lowerName.includes("döviz") || lowerName.includes("foreign")) return Globe
    if (lowerName.includes("proje") || lowerName.includes("inşaat")) return Hammer
    if (lowerName.includes("yatırım") || lowerName.includes("investment")) return TrendingUp
    if (lowerName.includes("işletme") || lowerName.includes("sermaye")) return Building2
    if (lowerName.includes("tüketici") || lowerName.includes("consumer")) return Wallet
    if (lowerName.includes("kobi") || lowerName.includes("sme")) return Factory
    if (lowerName.includes("kamu") || lowerName.includes("devlet")) return Landmark
    if (lowerName.includes("sigorta") || lowerName.includes("insurance")) return Shield
    if (lowerName.includes("grup") || lowerName.includes("group")) return Users

    // Varsayılan ikon
    return CreditCard
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

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3">Kredi türleri yükleniyor...</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        <CardHeader className="text-center border-b bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-indigo-500/20 to-purple-600/20"></div>
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-4 left-8 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
            <div className="absolute bottom-6 right-12 w-20 h-20 bg-white/5 rounded-full blur-2xl"></div>
            <div className="absolute top-1/2 left-1/4 w-8 h-8 bg-white/15 rounded-full blur-lg"></div>
            <div className="absolute top-1/3 right-1/3 w-12 h-12 bg-white/8 rounded-full blur-xl"></div>
          </div>
          <div className="relative z-10 py-2">
            <CardTitle className="flex items-center justify-center gap-3 text-2xl font-bold text-white mb-2">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
              Kredi Türü Seçimi
              <Sparkles className="h-5 w-5 text-blue-200 animate-pulse" />
            </CardTitle>
            <CardDescription className="text-blue-50 text-base font-medium">
              Kredinizin türünü seçin. Bu, daha doğru analiz ve raporlama için önemlidir.
            </CardDescription>
            <div className="mt-3 flex items-center justify-center gap-2 text-sm text-blue-100">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse"></div>
                <span>{creditTypes.length} Kredi Türü</span>
              </div>
              <div className="w-1 h-1 bg-blue-300 rounded-full"></div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-indigo-300 rounded-full animate-pulse delay-150"></div>
                <span>{categories.length} Kategori</span>
              </div>
              <div className="w-1 h-1 bg-blue-300 rounded-full"></div>
              <div className="flex items-center gap-1">
                <Target className="w-3 h-3 text-purple-300" />
                <span>Akıllı Analiz</span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col h-full max-h-[calc(85vh-200px)] pt-6">
          {errorLoading && (
            <div className="mb-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-300 text-yellow-800 rounded-xl flex items-center gap-3 shadow-sm">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <span className="font-medium">{errorLoading}</span>
            </div>
          )}

          <div className="space-y-4 pb-4 pt-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Kredi türü ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-blue-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={
                    selectedCategory === category
                      ? "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                      : "hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                  }
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 pb-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-1">
              {filteredCreditTypes.map((creditType) => {
                const isSelected = selectedCreditType?.id === creditType.id
                const categoryBadgeColor =
                  categoryBadgeColors[creditType.category] || "bg-gray-100 border-gray-300 text-gray-700"
                const CreditIcon = getCreditTypeIcon(creditType.name)

                return (
                  <button
                    key={creditType.id}
                    onClick={() => setSelectedCreditType(creditType)}
                    className={`p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-xl ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 shadow-xl ring-2 ring-blue-200 scale-105"
                        : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative">
                        <div
                          className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 ${
                            isSelected
                              ? "bg-gradient-to-br from-blue-500 to-indigo-600 ring-4 ring-blue-200 shadow-blue-200/50"
                              : "bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 hover:border-blue-300 hover:shadow-xl"
                          }`}
                        >
                          <CreditIcon className={`h-8 w-8 ${isSelected ? "text-white" : "text-blue-600"}`} />
                        </div>
                        {isSelected && (
                          <div className="absolute -top-2 -right-2 flex items-center justify-center w-7 h-7 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full shadow-lg ring-2 ring-white">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-center leading-tight text-gray-800 px-2">
                        {creditType.name}
                      </span>
                      <div className={`text-xs px-2 py-0.5 rounded-full border font-medium ${categoryBadgeColor}`}>
                        {creditType.category}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {filteredCreditTypes.length === 0 && searchTerm && (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium mb-2">"{searchTerm}" ile eşleşen kredi türü bulunamadı.</p>
                <p className="text-sm text-gray-400">
                  Farklı bir anahtar kelime deneyin veya kategori seçiminizi değiştirin.
                </p>
              </div>
            )}

            {filteredCreditTypes.length === 0 && !searchTerm && categories.length > 0 && (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="h-8 w-8 text-blue-500" />
                </div>
                <p className="text-gray-500 font-medium mb-2">Seçili kategoride kredi türü bulunamadı.</p>
                {creditTypes.length > 0 && (
                  <p className="text-sm text-gray-400">Farklı bir kategori seçmeyi deneyin.</p>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100 bg-white">
            <Button
              onClick={handleConfirm}
              disabled={!selectedCreditType}
              className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-lg text-white font-medium"
            >
              <Check className="mr-2 h-4 w-4" />
              Seçimi Onayla
            </Button>
            <Button onClick={onSkip} variant="outline" className="hover:bg-gray-50 border-gray-300 font-medium">
              Atla
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
