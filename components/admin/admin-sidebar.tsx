"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, FileText, FolderOpen, Users, Receipt, Home,
  CreditCard, Activity, Bell, Settings, ShieldCheck, ChevronRight,
} from "lucide-react"
import { AdminLogoutButton } from "@/components/admin-logout-button"
import { cn } from "@/lib/utils"

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  exact?: boolean
}

interface NavGroup {
  title: string | null
  items: NavItem[]
}

const NAV: NavGroup[] = [
  {
    title: null,
    items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true }],
  },
  {
    title: "Yönetim",
    items: [
      { href: "/admin/kullanicilar", label: "Kullanıcılar", icon: Users },
      { href: "/admin/faturalar", label: "Faturalar", icon: Receipt },
      { href: "/admin/abonelikler", label: "Abonelikler", icon: CreditCard },
      { href: "/admin/abonelik-islemleri", label: "Abonelik İşlemleri", icon: Settings },
      { href: "/admin/odeme-risk-takip", label: "Ödeme İzleme", icon: ShieldCheck },
      { href: "/admin/loglar", label: "İşlem Logları", icon: Activity },
      { href: "/admin/bildirimler", label: "Bildirimler", icon: Bell },
    ],
  },
  {
    title: "İçerik",
    items: [
      { href: "/admin/blog/posts", label: "Blog Yazıları", icon: FileText },
      { href: "/admin/blog/categories", label: "Kategoriler", icon: FolderOpen },
    ],
  },
]

export function AdminSidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname()

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/")

  return (
    <aside className="w-64 shrink-0 sticky top-0 h-screen flex flex-col bg-gradient-to-b from-[#101513] to-[#0c0f0e] border-r border-white/[0.06]">
      {/* Brand */}
      <div className="px-5 pt-6 pb-5">
        <Link href="/admin" className="flex items-center gap-3 group">
          <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <ShieldCheck className="h-5 w-5 text-white" />
            <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20" />
          </div>
          <div>
            <p className="text-[15px] font-bold tracking-tight text-white leading-none">Kredi Takip</p>
            <p className="text-[11px] font-medium text-emerald-400/80 mt-1 tracking-wide uppercase">Yönetim Paneli</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-6 scrollbar-thin">
        {NAV.map((group, gi) => (
          <div key={gi} className="space-y-1">
            {group.title && (
              <p className="px-3 pt-2 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/30">
                {group.title}
              </p>
            )}
            {group.items.map((item) => {
              const active = isActive(item)
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    active
                      ? "bg-gradient-to-r from-emerald-500/15 to-teal-500/[0.06] text-white"
                      : "text-white/55 hover:text-white hover:bg-white/[0.04]",
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-gradient-to-b from-emerald-400 to-teal-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                  )}
                  <Icon className={cn("h-[18px] w-[18px] shrink-0 transition-colors", active ? "text-emerald-400" : "text-white/40 group-hover:text-white/70")} />
                  <span className="flex-1">{item.label}</span>
                  {active && <ChevronRight className="h-3.5 w-3.5 text-emerald-400/60" />}
                </Link>
              )
            })}
          </div>
        ))}

        {/* Back to site */}
        <div className="pt-2 border-t border-white/[0.06]">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/45 hover:text-white hover:bg-white/[0.04] transition-all"
          >
            <Home className="h-[18px] w-[18px] text-white/40" />
            Siteye Dön
          </Link>
        </div>
      </nav>

      {/* User + logout */}
      <div className="border-t border-white/[0.06] p-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 mb-1">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500/30 to-teal-500/20 ring-1 ring-white/10 flex items-center justify-center text-xs font-bold text-emerald-300 uppercase">
            {userEmail?.[0] ?? "A"}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-white/80 truncate">{userEmail}</p>
            <p className="text-[10px] text-emerald-400/70">Admin</p>
          </div>
        </div>
        <AdminLogoutButton />
      </div>
    </aside>
  )
}
