import type React from "react"
import { AuthGuard } from "@/components/auth-guard"
import { SidebarProvider, Sidebar, SidebarContent } from "@/components/ui/sidebar"
import AppSidebar from "@/components/app-sidebar"
import Header from "@/components/header"
import FloatingActionMenu from "@/components/floating-action-menu"
import { ErrorBoundary } from "@/components/error-boundary"

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
              <ErrorBoundary
                fallback={<div className="p-4 text-center text-sm text-gray-500">Sidebar yüklenemedi</div>}
              >
                <AppSidebar />
              </ErrorBoundary>
            </SidebarContent>
          </Sidebar>

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-w-0">
            <ErrorBoundary
              fallback={
                <div className="h-16 bg-white border-b flex items-center px-6">
                  <div className="text-sm text-gray-500">Header yüklenemedi</div>
                </div>
              }
            >
              <Header />
            </ErrorBoundary>

            <ErrorBoundary>
              <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">{children}</main>
            </ErrorBoundary>
          </div>

          {/* Floating Action Menu */}
          <ErrorBoundary
            fallback={null} // Hide floating menu if it fails
          >
            <FloatingActionMenu />
          </ErrorBoundary>
        </div>
      </SidebarProvider>
    </AuthGuard>
  )
}
