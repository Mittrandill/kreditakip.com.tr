import Link from "next/link"
import { LayoutDashboard, FileText, FolderOpen, Users, Receipt, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AdminLogoutButton } from "@/components/admin-logout-button"
import { Toaster } from "sonner"

interface AdminLayoutWrapperProps {
  children: React.ReactNode
  userEmail: string
}

export function AdminLayoutWrapper({ children, userEmail }: AdminLayoutWrapperProps) {
  return (
    <div className="min-h-screen bg-[#151515] text-white">
      <Toaster
        position="top-right"
        theme="dark"
        richColors
      />
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-screen bg-black/20 border-r border-white/10 p-6 flex flex-col">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-emerald-400">Admin Panel</h1>
            <p className="text-sm text-white/60 mt-1">Kredi Takip Yönetimi</p>
            <p className="text-xs text-white/40 mt-2">{userEmail}</p>
          </div>

          <nav className="space-y-2">
            <Link href="/admin">
              <Button
                variant="ghost"
                className="w-full justify-start text-white/80 hover:text-white hover:bg-white/10"
              >
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </Link>

            <div className="pt-2 mt-2 border-t border-white/10">
              <p className="text-xs text-white/40 px-3 py-2 font-semibold uppercase tracking-wider">
                Yönetim
              </p>

              <Link href="/admin/kullanicilar">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-white/80 hover:text-white hover:bg-white/10"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Kullanıcılar
                </Button>
              </Link>

              <Link href="/admin/faturalar">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-white/80 hover:text-white hover:bg-white/10"
                >
                  <Receipt className="mr-2 h-4 w-4" />
                  Faturalar
                </Button>
              </Link>
            </div>

            <div className="pt-2 mt-2 border-t border-white/10">
              <p className="text-xs text-white/40 px-3 py-2 font-semibold uppercase tracking-wider">
                İçerik
              </p>

              <Link href="/admin/blog/posts">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-white/80 hover:text-white hover:bg-white/10"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Blog Yazıları
                </Button>
              </Link>

              <Link href="/admin/blog/categories">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-white/80 hover:text-white hover:bg-white/10"
                >
                  <FolderOpen className="mr-2 h-4 w-4" />
                  Kategoriler
                </Button>
              </Link>
            </div>

            <div className="pt-4 mt-4 border-t border-white/10">
              <Link href="/">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-white/80 hover:text-white hover:bg-white/10"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Ana Sayfaya Dön
                </Button>
              </Link>
            </div>
          </nav>

          {/* Logout Button - At bottom */}
          <div className="mt-auto pt-4 border-t border-white/10">
            <AdminLogoutButton />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  )
}
