"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, User, Mail, Calendar, CreditCard, Loader2 } from "lucide-react"
import { SubscriptionManager } from "./subscription-manager"
import { toast } from "sonner"

interface UserSearchResult {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  created_at: string
}

interface Subscription {
  id: string
  user_id: string
  plan_id: string
  plan_type: string
  status: string
  expires_at: string
  created_at: string
  subscription_plans?: {
    id: string
    name: string
    billing_period: string
    price: number
  }
}

interface Usage {
  id: string
  user_id: string
  subscription_id: string
  feature_type: string
  usage_count: number
  usage_limit: number
  reset_at: string
}

interface Plan {
  id: string
  name: string
  plan_type: string
  billing_period: string
  price: number
  is_active: boolean
  sort_order: number
}

export function SubscriptionOperations() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([])
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [usage, setUsage] = useState<Usage[]>([])
  const [availablePlans, setAvailablePlans] = useState<Plan[]>([])
  const [isLoadingUser, setIsLoadingUser] = useState(false)

  // Search users
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Lütfen arama terimi girin")
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(
        `/api/admin/users/search?q=${encodeURIComponent(searchQuery)}`
      )
      const data = await response.json()

      if (response.ok) {
        setSearchResults(data.users || [])
        if (data.users.length === 0) {
          toast.info("Kullanıcı bulunamadı")
        }
      } else {
        toast.error(data.error || "Arama başarısız")
      }
    } catch (error) {
      console.error("Search error:", error)
      toast.error("Arama sırasında hata oluştu")
    } finally {
      setIsSearching(false)
    }
  }

  // Load user subscription data
  const handleSelectUser = async (user: UserSearchResult) => {
    setSelectedUser(user)
    setSearchResults([])
    setSearchQuery("")
    setIsLoadingUser(true)

    try {
      // Fetch user's subscription data
      const response = await fetch(`/api/admin/users/${user.id}/subscription`)
      const data = await response.json()

      if (response.ok) {
        setSubscription(data.subscription)
        setUsage(data.usage || [])
        setAvailablePlans(data.availablePlans || [])
      } else {
        toast.error("Kullanıcı verileri yüklenemedi")
      }
    } catch (error) {
      console.error("Error loading user data:", error)
      toast.error("Kullanıcı verileri yüklenirken hata oluştu")
    } finally {
      setIsLoadingUser(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  const fullName = selectedUser
    ? [selectedUser.first_name, selectedUser.last_name].filter(Boolean).join(" ") || "İsimsiz Kullanıcı"
    : ""

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Search className="h-5 w-5 text-emerald-400" />
            Kullanıcı Ara
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="İsim, soyisim veya e-posta ile arayın..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="bg-black/20 border-white/10 text-white placeholder:text-white/40"
              disabled={isSearching}
            />
            <Button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
            >
              {isSearching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Aranıyor...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Ara
                </>
              )}
            </Button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              <p className="text-sm text-white/60">{searchResults.length} kullanıcı bulundu</p>
              {searchResults.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  className="w-full p-4 bg-black/20 hover:bg-black/40 border border-white/10 rounded-lg transition-all text-left group"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-emerald-400" />
                        <span className="text-white font-medium">
                          {[user.first_name, user.last_name].filter(Boolean).join(" ") ||
                            "İsimsiz Kullanıcı"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-white/60">
                        <Mail className="h-3 w-3" />
                        {user.email || "E-posta yok"}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-white/40">
                        <Calendar className="h-3 w-3" />
                        Kayıt: {new Date(user.created_at).toLocaleDateString("tr-TR")}
                      </div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-sm">
                        Seç
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected User Info */}
      {selectedUser && (
        <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <User className="h-5 w-5 text-teal-400" />
              Seçili Kullanıcı
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-xl font-bold text-white">{fullName}</span>
                  {subscription?.status === "active" ? (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/20">
                      Aktif Abonelik
                    </Badge>
                  ) : subscription?.status === "cancelled" ? (
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/20">
                      İptal Edilmiş
                    </Badge>
                  ) : subscription?.status === "expired" ? (
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/20">
                      Süresi Dolmuş
                    </Badge>
                  ) : (
                    <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/20">
                      Abonelik Yok
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-white/60">
                  <Mail className="h-4 w-4" />
                  {selectedUser.email || "E-posta yok"}
                </div>
                {subscription && (
                  <div className="flex items-center gap-2 text-white/60">
                    <CreditCard className="h-4 w-4" />
                    Mevcut Plan:{" "}
                    <span className="text-white font-medium">
                      {subscription.plan_type === "premium"
                        ? "Premium"
                        : subscription.plan_type === "pro"
                        ? "Pro"
                        : "Ücretsiz"}
                    </span>
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedUser(null)
                  setSubscription(null)
                  setUsage([])
                  setAvailablePlans([])
                }}
                className="bg-black/20 border-white/10 text-white/80 hover:bg-black/40 hover:text-white"
              >
                Değiştir
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscription Manager */}
      {selectedUser && !isLoadingUser && (
        <SubscriptionManager
          userId={selectedUser.id}
          currentSubscription={subscription}
          usage={usage}
          availablePlans={availablePlans}
        />
      )}

      {selectedUser && isLoadingUser && (
        <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-12 w-12 text-emerald-400 animate-spin" />
              <p className="text-white/60">Kullanıcı verileri yükleniyor...</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
