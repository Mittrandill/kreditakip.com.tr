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
        <div className="min-h-screen flex w-full bg-gray-50 dark:bg-gray-950 relative">
          {/* Desktop Sidebar */}
          <Sidebar collapsible="icon" className="border-r hidden md:flex z-30">
            <SidebarContent>
              <AppSidebar />
            </SidebarContent>
          </Sidebar>

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-w-0">
            <Header />
            <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto bg-transparent">{children}</main>
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
