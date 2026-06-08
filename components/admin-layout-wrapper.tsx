import { Toaster } from "sonner"
import { AdminSidebar } from "@/components/admin/admin-sidebar"

interface AdminLayoutWrapperProps {
  children: React.ReactNode
  userEmail: string
}

export function AdminLayoutWrapper({ children, userEmail }: AdminLayoutWrapperProps) {
  return (
    <div className="min-h-screen bg-[#0a0c0b] text-white">
      <Toaster position="top-right" theme="dark" richColors />

      {/* Ambient gradient atmosphere */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-20 h-[40rem] w-[40rem] rounded-full bg-emerald-600/[0.07] blur-[120px]" />
        <div className="absolute top-1/3 right-0 h-[32rem] w-[32rem] rounded-full bg-teal-500/[0.05] blur-[120px]" />
      </div>

      <div className="relative flex">
        <AdminSidebar userEmail={userEmail} />
        <main className="flex-1 min-w-0 p-6 lg:p-10">{children}</main>
      </div>
    </div>
  )
}
