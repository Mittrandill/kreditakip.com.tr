import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="flex flex-col gap-4 items-center justify-center min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      <div className="relative">
        <Loader2 className="h-12 w-12 animate-spin text-emerald-600" />
        <div className="absolute inset-0 h-12 w-12 rounded-full border-2 border-emerald-200 animate-pulse"></div>
      </div>
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold text-gray-900">Kredi Takip</h2>
        <p className="text-sm text-gray-600">Yükleniyor...</p>
      </div>
    </div>
  )
}
