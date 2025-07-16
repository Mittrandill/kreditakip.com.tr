import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="flex flex-col gap-4 md:gap-6 items-center justify-center min-h-[calc(100vh-150px)]">
      <Loader2 className="h-12 w-12 animate-spin text-emerald-600" />
      <p className="text-lg text-gray-600">Sayfa yükleniyor...</p>
    </div>
  )
}
