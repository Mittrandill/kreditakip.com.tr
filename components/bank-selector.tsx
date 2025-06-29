"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building2, Check, Search, Sparkles } from "lucide-react"
import { Input } from "@/components/ui/input"
import BankLogo from "./bank-logo"
import { supabase } from "@/lib/supabase"

interface BankSelectorProps {
  banks?: Bank[]
  onBankSelect: (bankName: string) => void
  onSkip: () => void
}

interface Bank {
  id: string
  name: string
  category: string
  logo_url?: string
}

export function BankSelector({ banks: propBanks, onBankSelect, onSkip }: BankSelectorProps) {
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("Devlet Bankaları")
  const [searchTerm, setSearchTerm] = useState("")
  const [banks, setBanks] = useState<Bank[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchBanks() {
      if (propBanks && propBanks.length > 0) {
        setBanks(propBanks)
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const { data, error } = await supabase.from("banks").select("id, name, category, logo_url").order("name")

        if (error) {
          console.error("Supabase error:", error)
          setBanks(getComprehensiveBankList())
        } else {
          console.log("🏦 Veritabanından", data?.length || 0, "banka yüklendi")
          setBanks(data || getComprehensiveBankList())
        }
      } catch (error) {
        console.error("Error fetching banks:", error)
        setBanks(getComprehensiveBankList())
      } finally {
        setLoading(false)
      }
    }

    fetchBanks()
  }, [propBanks])

  // SÜPER KAPSAMLI 56+ BANKA LİSTESİ - TÜM BANKALAR DAHİL!
  const getComprehensiveBankList = (): Bank[] => [
    // Devlet Bankaları
    {
      id: "1",
      name: "T.C. Ziraat Bankası A.Ş.",
      category: "Devlet Bankaları",
      logo_url: "/bank-icons/ziraat-bankasi.png",
    },
    {
      id: "2",
      name: "Türkiye Halk Bankası A.Ş.",
      category: "Devlet Bankaları",
      logo_url: "/bank-icons/turkiye-halk-bankasi.png",
    },
    {
      id: "3",
      name: "Türkiye Vakıflar Bankası T.A.O.",
      category: "Devlet Bankaları",
      logo_url: "/bank-icons/vakifbank.png",
    },

    // Özel Sermayeli Bankalar
    { id: "4", name: "Akbank T.A.Ş.", category: "Özel Sermayeli Bankalar", logo_url: "/bank-icons/akbank.png" },
    {
      id: "5",
      name: "Türkiye Garanti Bankası A.Ş.",
      category: "Özel Sermayeli Bankalar",
      logo_url: "/bank-icons/turkiye-garanti-bankasi.png",
    },
    {
      id: "6",
      name: "Yapı ve Kredi Bankası A.Ş.",
      category: "Özel Sermayeli Bankalar",
      logo_url: "/bank-icons/yapi-kredi-bankasi.png",
    },
    {
      id: "7",
      name: "QNB Finansbank A.Ş.",
      category: "Özel Sermayeli Bankalar",
      logo_url: "/bank-icons/qnb-finansbank.png",
    },
    {
      id: "8",
      name: "Türkiye İş Bankası A.Ş.",
      category: "Özel Sermayeli Bankalar",
      logo_url: "/bank-icons/turkiye-is-bankasi.png",
    },
    {
      id: "9",
      name: "Türkiye Ekonomi Bankası A.Ş.",
      category: "Özel Sermayeli Bankalar",
      logo_url: "/bank-icons/turkiye-ekonomi-bankasi.png",
    },
    { id: "10", name: "Şekerbank T.A.Ş.", category: "Özel Sermayeli Bankalar", logo_url: "/bank-icons/sekerbank.png" },
    {
      id: "11",
      name: "Anadolubank A.Ş.",
      category: "Özel Sermayeli Bankalar",
      logo_url: "/bank-icons/anadolubank.png",
    },
    { id: "12", name: "Fibabanka A.Ş.", category: "Özel Sermayeli Bankalar", logo_url: "/bank-icons/fibabanka.png" },
    {
      id: "13",
      name: "Turkish Bank A.Ş.",
      category: "Özel Sermayeli Bankalar",
      logo_url: "/bank-icons/turkish-bank.png",
    },
    { id: "14", name: "DenizBank A.Ş.", category: "Özel Sermayeli Bankalar", logo_url: "/bank-icons/denizbank.png" },
    { id: "15", name: "ING Bank A.Ş.", category: "Özel Sermayeli Bankalar", logo_url: "/bank-icons/ing-bank.png" },
    { id: "16", name: "Citibank A.Ş.", category: "Özel Sermayeli Bankalar", logo_url: "/bank-icons/citibank.png" },
    {
      id: "17",
      name: "Deutsche Bank A.Ş.",
      category: "Özel Sermayeli Bankalar",
      logo_url: "/bank-icons/deutsche-bank.png",
    },
    {
      id: "18",
      name: "Alternatif Bank A.Ş.",
      category: "Özel Sermayeli Bankalar",
      logo_url: "/bank-icons/alternatif-bank.png",
    },
    {
      id: "19",
      name: "Burgan Bank A.Ş.",
      category: "Özel Sermayeli Bankalar",
      logo_url: "/bank-icons/burgan-bank.png",
    },
    {
      id: "20",
      name: "ICBC Turkey Bank A.Ş.",
      category: "Özel Sermayeli Bankalar",
      logo_url: "/bank-icons/icbc-turkey-bank.png",
    },
    {
      id: "21",
      name: "MUFG Bank Turkey A.Ş.",
      category: "Özel Sermayeli Bankalar",
      logo_url: "/bank-icons/mufg-bank-turkey.png",
    },
    { id: "22", name: "Odeabank A.Ş.", category: "Özel Sermayeli Bankalar", logo_url: "/bank-icons/odeabank.png" },
    { id: "23", name: "Rabobank A.Ş.", category: "Özel Sermayeli Bankalar", logo_url: "/bank-icons/rabobank.png" },

    // Yabancı Şubeler
    { id: "24", name: "HSBC Bank A.Ş.", category: "Yabancı Şubeler", logo_url: "/bank-icons/hsbc-bank.png" },
    {
      id: "25",
      name: "Intesa Sanpaolo S.p.A.",
      category: "Yabancı Şubeler",
      logo_url: "/bank-icons/intesa-sanpaolo.png",
    },
    {
      id: "26",
      name: "Habib Bank Limited",
      category: "Yabancı Şubeler",
      logo_url: "/bank-icons/habib-bank-limited.png",
    },
    { id: "27", name: "Bank Mellat", category: "Yabancı Şubeler", logo_url: "/bank-icons/bank-mellat.png" },
    {
      id: "28",
      name: "JPMorgan Chase Bank N.A.",
      category: "Yabancı Şubeler",
      logo_url: "/bank-icons/jpmorgan-chase-bank.png",
    },
    {
      id: "29",
      name: "Sociét�� Générale (SA)",
      category: "Yabancı Şubeler",
      logo_url: "/bank-icons/societe-generale.png",
    },

    // Katılım Bankaları
    {
      id: "30",
      name: "Ziraat Katılım Bankası A.Ş.",
      category: "Katılım Bankaları",
      logo_url: "/bank-icons/ziraat-katilim-bankasi.png",
    },
    {
      id: "31",
      name: "Vakıf Katılım Bankası A.Ş.",
      category: "Katılım Bankaları",
      logo_url: "/bank-icons/vakif-katilim-bankasi.png",
    },
    {
      id: "32",
      name: "Türkiye Emlak Katılım Bankası A.Ş.",
      category: "Katılım Bankaları",
      logo_url: "/bank-icons/turkiye-emlak-katilim-bankasi.png",
    },
    {
      id: "33",
      name: "Kuveyt Türk Katılım Bankası A.Ş.",
      category: "Katılım Bankaları",
      logo_url: "/bank-icons/kuveyt-turk-katilim-bankasi.png",
    },
    {
      id: "34",
      name: "Albaraka Türk Katılım Bankası A.Ş.",
      category: "Katılım Bankaları",
      logo_url: "/bank-icons/albaraka-turk-katilim-bankasi.png",
    },
    {
      id: "35",
      name: "Türkiye Finans Katılım Bankası A.Ş.",
      category: "Katılım Bankaları",
      logo_url: "/bank-icons/turkiye-finans-katilim-bankasi.png",
    },
    {
      id: "36",
      name: "Hayat Finans Katılım Bankası A.Ş.",
      category: "Katılım Bankaları",
      logo_url: "/bank-icons/hayat-finans-katilim-bankasi.png",
    },
    {
      id: "37",
      name: "Dünya Katılım Bankası A.Ş.",
      category: "Katılım Bankaları",
      logo_url: "/bank-icons/dunya-katilim-bankasi.png",
    },

    // Kalkınma ve Yatırım Bankaları
    {
      id: "38",
      name: "İller Bankası A.Ş.",
      category: "Kalkınma ve Yatırım Bankaları",
      logo_url: "/bank-icons/iller-bankasi.png",
    },
    {
      id: "39",
      name: "Türk Eximbank",
      category: "Kalkınma ve Yatırım Bankaları",
      logo_url: "/bank-icons/turk-eximbank.png",
    },
    {
      id: "40",
      name: "Türkiye Kalkınma ve Yatırım Bankası A.Ş.",
      category: "Kalkınma ve Yatırım Bankaları",
      logo_url: "/bank-icons/turkiye-kalkinma-ve-yatirim-bankasi.png",
    },
    {
      id: "41",
      name: "Türkiye Sınai Kalkınma Bankası A.Ş.",
      category: "Kalkınma ve Yatırım Bankaları",
      logo_url: "/bank-icons/turkiye-sinai-kalkinma-bankasi.png",
    },
    {
      id: "42",
      name: "Aktif Yatırım Bankası A.Ş.",
      category: "Kalkınma ve Yatırım Bankaları",
      logo_url: "/bank-icons/aktif-yatirim-bankasi.png",
    },
    {
      id: "43",
      name: "Nurol Yatırım Bankası A.Ş.",
      category: "Kalkınma ve Yatırım Bankaları",
      logo_url: "/bank-icons/nurol-yatirim-bankasi.png",
    },
    {
      id: "44",
      name: "Pasha Yatırım Bankası A.Ş.",
      category: "Kalkınma ve Yatırım Bankaları",
      logo_url: "/bank-icons/pasha-yatirim-bankasi.png",
    },
    {
      id: "45",
      name: "BankPozitif Kredi ve Kalkınma Bankası A.Ş.",
      category: "Kalkınma ve Yatırım Bankaları",
      logo_url: "/bank-icons/bankpozitif-kredi-ve-kalkinma-bankasi.png",
    },
    {
      id: "46",
      name: "Merrill Lynch Yatırım Bank A.Ş.",
      category: "Kalkınma ve Yatırım Bankaları",
      logo_url: "/bank-icons/merrill-lynch-yatirim-bank.png",
    },
    {
      id: "47",
      name: "Golden Global Yatırım Bankası A.Ş.",
      category: "Kalkınma ve Yatırım Bankaları",
      logo_url: "/bank-icons/golden-global-yatirim-bankasi.png",
    },
    {
      id: "48",
      name: "GSD Yatırım Bankası A.Ş.",
      category: "Kalkınma ve Yatırım Bankaları",
      logo_url: "/bank-icons/gsd-yatirim-bankasi.png",
    },
    {
      id: "49",
      name: "İstanbul Takas ve Saklama Bankası A.Ş.",
      category: "Kalkınma ve Yatırım Bankaları",
      logo_url: "/bank-icons/istanbul-takas-ve-saklama-bankasi.png",
    },
    {
      id: "50",
      name: "Diler Yatırım Bankası A.Ş.",
      category: "Kalkınma ve Yatırım Bankaları",
      logo_url: "/bank-icons/diler-yatirim-bankasi.png",
    },
    {
      id: "51",
      name: "Standard Chartered Yatırım Bankası Türk A.Ş.",
      category: "Kalkınma ve Yatırım Bankaları",
      logo_url: "/bank-icons/standard-chartered-yatirim-bankasi-turk.png",
    },

    // Dijital Bankalar
    { id: "52", name: "Enpara.com", category: "Dijital Bankalar", logo_url: "/bank-icons/enpara-bank.png" },
    { id: "53", name: "Colendi Bank A.Ş.", category: "Dijital Bankalar", logo_url: "/bank-icons/colendi-bank.png" },

    // TMSF Bankaları
    { id: "54", name: "Adabank A.Ş.", category: "TMSF Bankaları", logo_url: "/bank-icons/adabank.png" },
    {
      id: "55",
      name: "Birleşik Fon Bankası A.Ş.",
      category: "TMSF Bankaları",
      logo_url: "/bank-icons/birlesik-fon-bankasi.png",
    },
    {
      id: "56",
      name: "Türk Ticaret Bankası A.Ş.",
      category: "TMSF Bankaları",
      logo_url: "/bank-icons/turk-ticaret-bankasi.png",
    },
  ]

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn("Bank loading timeout, using comprehensive fallback data")
        setBanks(getComprehensiveBankList())
        setLoading(false)
      }
    }, 5000)

    return () => clearTimeout(timeoutId)
  }, [loading])

  useEffect(() => {
    if (searchTerm.trim()) {
      const matchingBank = banks.find((bank) => bank.name.toLowerCase().includes(searchTerm.toLowerCase()))
      if (matchingBank && matchingBank.category !== selectedCategory) {
        setSelectedCategory(matchingBank.category)
      }
    }
  }, [searchTerm, banks, selectedCategory])

  const handleConfirm = () => {
    if (selectedBank) {
      console.log("🎯 Banka seçildi:", selectedBank.name)
      onBankSelect(selectedBank.name)
    }
  }

  const categories = Array.from(new Set(banks.map((bank) => bank.category))).sort()

  const filteredBanks = banks.filter((bank) => {
    if (searchTerm.trim()) {
      return bank.name.toLowerCase().includes(searchTerm.toLowerCase())
    } else {
      return bank.category === selectedCategory
    }
  })

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            <span className="ml-3">Bankalar yükleniyor...</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        <CardHeader className="text-center border-b bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-cyan-600/20"></div>
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-4 left-8 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
            <div className="absolute bottom-6 right-12 w-20 h-20 bg-white/5 rounded-full blur-2xl"></div>
            <div className="absolute top-1/2 left-1/4 w-8 h-8 bg-white/15 rounded-full blur-lg"></div>
          </div>
          <div className="relative z-10 py-2">
            <CardTitle className="flex items-center justify-center gap-3 text-3xl font-bold text-white mb-2">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <Building2 className="h-7 w-7 text-white" />
              </div>
              Banka Seçimi
              <Sparkles className="h-6 w-6 text-emerald-200 animate-pulse" />
            </CardTitle>
            <CardDescription className="text-emerald-50 text-lg font-medium">
              Kullandığınız krediye ait bankayı aşağıdaki listeden seçin
            </CardDescription>
            <div className="mt-3 flex items-center justify-center gap-2 text-sm text-emerald-100">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-emerald-300 rounded-full animate-pulse"></div>
                <span>{banks.length} Banka</span>
              </div>
              <div className="w-1 h-1 bg-emerald-300 rounded-full"></div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-teal-300 rounded-full animate-pulse delay-150"></div>
                <span>6 Kategori</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col h-full max-h-[calc(85vh-200px)] pt-6">
          <div className="space-y-4 pb-4 pt-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Banka ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
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
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                      : "hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
                  }
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 pb-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-1">
              {filteredBanks.map((bank) => (
                <button
                  key={bank.id}
                  onClick={() => setSelectedBank(bank)}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-xl ${
                    selectedBank?.id === bank.id
                      ? "border-emerald-500 bg-emerald-50 shadow-xl ring-2 ring-emerald-200 scale-105"
                      : "border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50"
                  }`}
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative">
                      <BankLogo
                        bankName={bank.name}
                        logoUrl={bank.logo_url}
                        size="md"
                        className={`${selectedBank?.id === bank.id ? "ring-2 ring-emerald-400" : ""} bg-white`}
                      />
                      {selectedBank?.id === bank.id && (
                        <div className="absolute -top-1 -right-1 flex items-center justify-center w-6 h-6 bg-emerald-500 rounded-full shadow-lg">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-medium text-center leading-tight text-gray-800">{bank.name}</span>
                    <div className="text-xs text-emerald-600 font-medium">{bank.category}</div>
                  </div>
                </button>
              ))}
            </div>

            {filteredBanks.length === 0 && (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Arama kriterinize uygun banka bulunamadı.</p>
                <p className="text-sm text-gray-400 mt-2">Farklı bir arama terimi deneyin.</p>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100 bg-white">
            <Button
              onClick={handleConfirm}
              disabled={!selectedBank}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg"
            >
              <Check className="mr-2 h-4 w-4" />
              Seçimi Onayla
            </Button>
            <Button onClick={onSkip} variant="outline" className="hover:bg-gray-50 border-gray-300">
              Atla
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default BankSelector
