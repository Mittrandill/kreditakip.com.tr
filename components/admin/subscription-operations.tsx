"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Search, User, Mail, ChevronDown, ChevronUp,
  Infinity, Ban, Loader2, CreditCard, TrendingUp,
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { tr } from "date-fns/locale"

const ADMIN_PACKAGES = [
  {
    id: "pro-1m",
    label: "1 Ay Pro",
    planId: "pro-monthly",
    planType: "pro",
    durationLabel: "1 ay",
    color: "bg-blue-500/20 hover:bg-blue-500/30 border-blue-500/30 text-blue-300",
    selectedColor: "bg-blue-500/40 border-blue-400/60 text-blue-200 ring-2 ring-blue-400/30",
    getExpiresAt: () => { const d = new Date(); d.setMonth(d.getMonth() + 1); return d },
  },
  {
    id: "premium-1m",
    label: "1 Ay Premium",
    planId: "premium-monthly",
    planType: "premium",
    durationLabel: "1 ay",
    color: "bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/30 text-emerald-300",
    selectedColor: "bg-emerald-500/40 border-emerald-400/60 text-emerald-200 ring-2 ring-emerald-400/30",
    getExpiresAt: () => { const d = new Date(); d.setMonth(d.getMonth() + 1); return d },
  },
  {
    id: "pro-1y",
    label: "1 Yıl Pro",
    planId: "pro-yearly",
    planType: "pro",
    durationLabel: "1 yıl",
    color: "bg-blue-500/20 hover:bg-blue-500/30 border-blue-500/30 text-blue-300",
    selectedColor: "bg-blue-500/40 border-blue-400/60 text-blue-200 ring-2 ring-blue-400/30",
    getExpiresAt: () => { const d = new Date(); d.setFullYear(d.getFullYear() + 1); return d },
  },
  {
    id: "premium-1y",
    label: "1 Yıl Premium",
    planId: "premium-yearly",
    planType: "premium",
    durationLabel: "1 yıl",
    color: "bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/30 text-emerald-300",
    selectedColor: "bg-emerald-500/40 border-emerald-400/60 text-emerald-200 ring-2 ring-emerald-400/30",
    getExpiresAt: () => { const d = new Date(); d.setFullYear(d.getFullYear() + 1); return d },
  },
  {
    id: "premium-unlimited",
    label: "Sınırsız Premium",
    planId: "premium-yearly",
    planType: "premium",
    durationLabel: "sınırsız",
    color: "bg-purple-500/20 hover:bg-purple-500/30 border-purple-500/30 text-purple-300",
    selectedColor: "bg-purple-500/40 border-purple-400/60 text-purple-200 ring-2 ring-purple-400/30",
    getExpiresAt: () => { const d = new Date(); d.setFullYear(d.getFullYear() + 50); return d },
  },
]

interface UserSubscription {
  id: string
  plan_type: string
  status: string
  expires_at: string
  start_date?: string
  payment_provider?: string | null
}

interface UserRow {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  created_at: string
  subscriptions: UserSubscription[]
}

interface ExpandedData {
  subscription: any | null
  usage: any[]
}

type PlanFilter = "all" | "free" | "pro" | "premium"

const getActiveSub = (subs: UserSubscription[]): UserSubscription | null => {
  if (!subs?.length) return null
  return subs.find((s) => s.status === "active") || null
}

const isUnlimited = (expiresAt: string) => new Date(expiresAt).getFullYear() >= 2070

const getDaysRemaining = (expiresAt: string) =>
  Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))

const displayName = (u: UserRow) =>
  [u.first_name, u.last_name].filter(Boolean).join(" ") || "İsimsiz Kullanıcı"

function SubBadge({ sub }: { sub: UserSubscription | null }) {
  if (!sub) return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/20 text-xs">Ücretsiz</Badge>
  if (sub.status === "active" && sub.plan_type === "premium")
    return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/20 text-xs">Premium</Badge>
  if (sub.status === "active" && sub.plan_type === "pro")
    return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/20 text-xs">Pro</Badge>
  if (sub.status === "cancelled")
    return <Badge className="bg-red-500/20 text-red-400 border-red-500/20 text-xs">İptal</Badge>
  if (sub.status === "expired")
    return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/20 text-xs">Süresi Doldu</Badge>
  return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/20 text-xs">Ücretsiz</Badge>
}

export function SubscriptionOperations({ users: initialUsers }: { users: UserRow[] }) {
  const [users, setUsers] = useState<UserRow[]>(initialUsers)
  const [search, setSearch] = useState("")
  const [planFilter, setPlanFilter] = useState<PlanFilter>("all")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [expandedData, setExpandedData] = useState<Record<string, ExpandedData>>({})
  const [loadingExpand, setLoadingExpand] = useState<string | null>(null)
  const [selectedPackage, setSelectedPackage] = useState<Record<string, string>>({})
  const [applyingFor, setApplyingFor] = useState<string | null>(null)
  const [cancelingFor, setCancelingFor] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (search) {
        const name = displayName(u).toLowerCase()
        const email = (u.email || "").toLowerCase()
        const q = search.toLowerCase()
        if (!name.includes(q) && !email.includes(q)) return false
      }
      const activeSub = getActiveSub(u.subscriptions)
      if (planFilter === "free" && activeSub) return false
      if (planFilter === "pro" && activeSub?.plan_type !== "pro") return false
      if (planFilter === "premium" && activeSub?.plan_type !== "premium") return false
      return true
    })
  }, [users, search, planFilter])

  const handleExpand = async (userId: string) => {
    if (expandedId === userId) {
      setExpandedId(null)
      return
    }
    setExpandedId(userId)
    if (!expandedData[userId]) {
      setLoadingExpand(userId)
      try {
        const res = await fetch(`/api/admin/users/${userId}/subscription`)
        const data = await res.json()
        setExpandedData((prev) => ({
          ...prev,
          [userId]: { subscription: data.subscription, usage: data.usage || [] },
        }))
      } catch {
        toast.error("Kullanıcı verileri yüklenemedi")
      } finally {
        setLoadingExpand(null)
      }
    }
  }

  const refreshExpandedData = async (userId: string) => {
    const res = await fetch(`/api/admin/users/${userId}/subscription`)
    const data = await res.json()
    setExpandedData((prev) => ({
      ...prev,
      [userId]: { subscription: data.subscription, usage: data.usage || [] },
    }))
    return data
  }

  const handleApply = async (user: UserRow) => {
    const pkgId = selectedPackage[user.id]
    const pkg = ADMIN_PACKAGES.find((p) => p.id === pkgId)
    if (!pkg) { toast.error("Lütfen bir paket seçin"); return }

    const currentSub = expandedData[user.id]?.subscription
    const expiresAt = pkg.getExpiresAt().toISOString()

    setApplyingFor(user.id)
    try {
      if (currentSub) {
        const r1 = await fetch("/api/admin/subscriptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "update", userId: user.id, subscriptionId: currentSub.id, planId: pkg.planId }),
        })
        if (!r1.ok) throw new Error((await r1.json()).error || "Plan güncellenemedi")

        const r2 = await fetch("/api/admin/subscriptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "extend", userId: user.id, subscriptionId: currentSub.id, expiresAt }),
        })
        if (!r2.ok) throw new Error((await r2.json()).error || "Süre güncellenemedi")
      } else {
        const r = await fetch("/api/admin/subscriptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "create", userId: user.id, planId: pkg.planId, expiresAt }),
        })
        if (!r.ok) throw new Error((await r.json()).error || "Abonelik oluşturulamadı")
      }

      toast.success(`${pkg.label} başarıyla uygulandı`)
      setSelectedPackage((prev) => ({ ...prev, [user.id]: "" }))

      const data = await refreshExpandedData(user.id)

      setUsers((prev) =>
        prev.map((u) =>
          u.id !== user.id
            ? u
            : {
                ...u,
                subscriptions: [
                  {
                    id: data.subscription?.id || "",
                    plan_type: pkg.planType,
                    status: "active",
                    expires_at: expiresAt,
                  },
                ],
              }
        )
      )
    } catch (e: any) {
      toast.error(e.message || "Hata oluştu")
    } finally {
      setApplyingFor(null)
    }
  }

  const handleCancel = async (user: UserRow) => {
    const currentSub = expandedData[user.id]?.subscription
    if (!currentSub) return

    setCancelingFor(user.id)
    try {
      const r = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", userId: user.id, subscriptionId: currentSub.id }),
      })
      if (!r.ok) throw new Error((await r.json()).error || "İptal edilemedi")

      toast.success("Abonelik iptal edildi")
      setExpandedData((prev) => ({
        ...prev,
        [user.id]: {
          subscription: { ...currentSub, status: "cancelled" },
          usage: prev[user.id]?.usage || [],
        },
      }))
      setUsers((prev) =>
        prev.map((u) =>
          u.id !== user.id
            ? u
            : {
                ...u,
                subscriptions: u.subscriptions.map((s) =>
                  s.id === currentSub.id ? { ...s, status: "cancelled" } : s
                ),
              }
        )
      )
    } catch (e: any) {
      toast.error(e.message || "Hata oluştu")
    } finally {
      setCancelingFor(null)
    }
  }

  const planFilters: { value: PlanFilter; label: string }[] = [
    { value: "all", label: "Tümü" },
    { value: "premium", label: "Premium" },
    { value: "pro", label: "Pro" },
    { value: "free", label: "Ücretsiz" },
  ]

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            placeholder="İsim veya e-posta ile filtrele..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-black/20 border-white/10 text-white placeholder:text-white/40"
          />
        </div>
        <div className="flex gap-1">
          {planFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setPlanFilter(f.value)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                planFilter === f.value
                  ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                  : "bg-black/20 border-white/10 text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Result count */}
      <p className="text-white/40 text-sm">
        {filtered.length} / {users.length} kullanıcı
      </p>

      {/* User List */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <Card className="bg-black/20 border-white/10">
            <CardContent className="py-12 text-center text-white/40">
              Kullanıcı bulunamadı
            </CardContent>
          </Card>
        )}

        {filtered.map((user) => {
          const activeSub = getActiveSub(user.subscriptions)
          const isExpanded = expandedId === user.id
          const isLoading = loadingExpand === user.id
          const data = expandedData[user.id]
          const exSub = data?.subscription
          const exUsage = data?.usage || []
          const ocrUsage = exUsage.find((u: any) => u.feature_type === "ocr_analysis")
          const riskUsage = exUsage.find((u: any) => u.feature_type === "risk_analysis")
          const pkgId = selectedPackage[user.id] || ""
          const isApplying = applyingFor === user.id
          const isCanceling = cancelingFor === user.id

          return (
            <Card
              key={user.id}
              className={`border transition-all ${
                isExpanded
                  ? "bg-black/30 border-emerald-500/30"
                  : "bg-black/20 border-white/10 hover:border-white/20"
              }`}
            >
              {/* Row header — always visible */}
              <button
                onClick={() => handleExpand(user.id)}
                className="w-full px-4 py-3 flex items-center gap-3 text-left"
              >
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-white/60" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-medium text-sm truncate">
                      {displayName(user)}
                    </span>
                    <SubBadge sub={activeSub} />
                    {activeSub && activeSub.status === "active" && (
                      <span className="text-white/40 text-xs">
                        {isUnlimited(activeSub.expires_at) ? (
                          <span className="flex items-center gap-1 text-purple-400">
                            <Infinity className="h-3 w-3" /> Sınırsız
                          </span>
                        ) : getDaysRemaining(activeSub.expires_at) > 0 ? (
                          `${getDaysRemaining(activeSub.expires_at)} gün kaldı`
                        ) : (
                          <span className="text-red-400">Süresi doldu</span>
                        )}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-white/40 text-xs mt-0.5">
                    <Mail className="h-3 w-3" />
                    {user.email || "—"}
                  </div>
                </div>

                <div className="flex-shrink-0 text-white/40">
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-white/10 pt-4 space-y-4">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-6 gap-2 text-white/40">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="text-sm">Yükleniyor...</span>
                    </div>
                  ) : (
                    <>
                      {/* Current subscription details */}
                      {exSub ? (
                        <div className="bg-black/20 rounded-lg p-3 border border-white/10">
                          <div className="flex items-center gap-2 mb-3">
                            <CreditCard className="h-4 w-4 text-white/40" />
                            <span className="text-white/60 text-xs font-medium uppercase tracking-wide">
                              Mevcut Abonelik
                            </span>
                            {exSub.payment_provider ? (
                              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/20 text-xs ml-auto">
                                💳 {exSub.payment_provider}
                              </Badge>
                            ) : (
                              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/20 text-xs ml-auto">
                                ⚡ Manuel
                              </Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                            <div>
                              <p className="text-white/40 text-xs mb-0.5">Plan</p>
                              <p className="text-white font-medium capitalize">
                                {exSub.plan_type === "premium" ? "Premium" : exSub.plan_type === "pro" ? "Pro" : "Ücretsiz"}
                              </p>
                            </div>
                            <div>
                              <p className="text-white/40 text-xs mb-0.5">Durum</p>
                              <SubBadge sub={exSub} />
                            </div>
                            {exSub.start_date && (
                              <div>
                                <p className="text-white/40 text-xs mb-0.5">Başlangıç</p>
                                <p className="text-white/80 text-xs">
                                  {format(new Date(exSub.start_date), "dd MMM yyyy", { locale: tr })}
                                </p>
                              </div>
                            )}
                            <div>
                              <p className="text-white/40 text-xs mb-0.5">Bitiş</p>
                              {isUnlimited(exSub.expires_at) ? (
                                <span className="flex items-center gap-1 text-purple-400 text-xs">
                                  <Infinity className="h-3 w-3" /> Sınırsız
                                </span>
                              ) : (
                                <p className="text-white/80 text-xs">
                                  {format(new Date(exSub.expires_at), "dd MMM yyyy", { locale: tr })}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Usage stats */}
                          {exUsage.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-white/10">
                              <div className="flex items-center gap-1 mb-2">
                                <TrendingUp className="h-3 w-3 text-white/40" />
                                <span className="text-white/40 text-xs">Kullanım</span>
                              </div>
                              <div className="flex gap-4">
                                <span className="text-xs text-white/60">
                                  OCR:{" "}
                                  <span className="text-white font-medium">
                                    {ocrUsage?.usage_count || 0}
                                    <span className="text-white/40">
                                      /{ocrUsage?.limit_count === -1 ? "∞" : ocrUsage?.limit_count || 0}
                                    </span>
                                  </span>
                                </span>
                                <span className="text-xs text-white/60">
                                  Risk:{" "}
                                  <span className="text-white font-medium">
                                    {riskUsage?.usage_count || 0}
                                    <span className="text-white/40">/{riskUsage?.limit_count || 0}</span>
                                  </span>
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-black/20 rounded-lg p-3 border border-white/10 text-center">
                          <p className="text-white/40 text-sm">Aktif abonelik yok</p>
                        </div>
                      )}

                      {/* Package selector */}
                      <div>
                        <p className="text-white/60 text-xs mb-2">
                          {exSub ? "Paket değiştir veya uzat:" : "Abonelik ver:"}
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {ADMIN_PACKAGES.map((pkg) => (
                            <button
                              key={pkg.id}
                              onClick={() =>
                                setSelectedPackage((prev) => ({
                                  ...prev,
                                  [user.id]: prev[user.id] === pkg.id ? "" : pkg.id,
                                }))
                              }
                              className={`flex items-center justify-between px-3 py-2 rounded-lg border transition-all text-xs font-medium ${
                                pkgId === pkg.id ? pkg.selectedColor : pkg.color
                              }`}
                            >
                              <span>{pkg.label}</span>
                              {pkg.id === "premium-unlimited" && <Infinity className="h-3 w-3 ml-1 opacity-70" />}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleApply(user)}
                          disabled={!pkgId || isApplying || isCanceling}
                          size="sm"
                          className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 disabled:opacity-40"
                        >
                          {isApplying ? (
                            <><Loader2 className="mr-2 h-3 w-3 animate-spin" /> Uygulanıyor...</>
                          ) : (
                            "Paketi Uygula"
                          )}
                        </Button>

                        {exSub && exSub.status === "active" && (
                          <Button
                            onClick={() => handleCancel(user)}
                            disabled={isApplying || isCanceling}
                            size="sm"
                            variant="destructive"
                            className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30"
                          >
                            {isCanceling ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Ban className="h-3 w-3" />
                            )}
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
