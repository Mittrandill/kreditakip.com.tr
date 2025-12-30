import type React from "react"
import { AuthGuard } from "@/components/auth-guard"
import { AuthProvider } from "@/components/auth-provider"
import { SidebarProvider, Sidebar, SidebarContent } from "@/components/ui/sidebar"
import AppSidebar from "@/components/app-sidebar"
import Header from "@/components/header"
import FloatingActionMenu from "@/components/floating-action-menu"
import { FloatingUpgradeBanner } from "@/components/floating-upgrade-banner"
import { UserThemeProvider } from "@/components/user-theme-provider"

export default function UygulamaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <AuthGuard requireAuth={true}>
        <UserThemeProvider>
          <SidebarProvider defaultOpen={true}>
        <div className="min-h-screen flex w-full bg-gray-50 dark:bg-[#151515] relative">
          {/* Gradient Background Effects for Dark Mode */}
          <div className="absolute inset-0 -z-0 dark:block hidden pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[80vh] bg-emerald-500/20 blur-[150px] rounded-full" />
            <div className="absolute bottom-0 right-1/4 w-[60vw] h-[60vh] bg-teal-500/15 blur-[120px] rounded-full" />
          </div>

          {/* Desktop Sidebar */}
          <Sidebar collapsible="icon" className="border-r hidden md:flex z-30">
            <SidebarContent>
              <AppSidebar />
            </SidebarContent>
          </Sidebar>

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-w-0">
            <Header />
            <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">{children}</main>
          </div>

          {/* Floating Action Menu */}
          <FloatingActionMenu />

          <FloatingUpgradeBanner />
        </div>
        </SidebarProvider>
        </UserThemeProvider>
      </AuthGuard>
    </AuthProvider>
  )
}
