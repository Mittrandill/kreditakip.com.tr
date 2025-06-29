import type React from "react"
import { AuthGuard } from "@/components/auth-guard"
import { SidebarProvider, Sidebar, SidebarContent } from "@/components/ui/sidebar"
import AppSidebar from "@/components/app-sidebar"
import Header from "@/components/header"
import FloatingActionMenu from "@/components/floating-action-menu"

export default function UygulamaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard requireAuth={true}>
      <SidebarProvider defaultOpen={true}>
        <div className="min-h-screen flex w-full bg-gray-50/50 relative">
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
        </div>
      </SidebarProvider>
    </AuthGuard>
  )
}
