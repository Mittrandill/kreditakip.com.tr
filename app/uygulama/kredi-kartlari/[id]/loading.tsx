import { Loader2 } from "lucide-react"

export default function KrediKartiDetayLoading() {
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {/* Hero Section Skeleton */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-pink-600 to-purple-700 p-8 text-white shadow-2xl animate-pulse">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/20 rounded-lg"></div>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-full"></div>
                <div className="space-y-2">
                  <div className="h-8 w-64 bg-white/20 rounded"></div>
                  <div className="h-4 w-48 bg-white/20 rounded"></div>
                  <div className="h-3 w-32 bg-white/20 rounded"></div>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="h-8 w-24 bg-white/20 rounded"></div>
            </div>
          </div>

          {/* Stats Grid Skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="text-center">
                <div className="h-4 w-20 bg-white/20 rounded mx-auto mb-1"></div>
                <div className="h-8 w-24 bg-white/20 rounded mx-auto"></div>
              </div>
            ))}
          </div>

          {/* Progress Bar Skeleton */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <div className="h-4 w-32 bg-white/20 rounded"></div>
              <div className="h-4 w-24 bg-white/20 rounded"></div>
            </div>
            <div className="h-3 w-full bg-white/20 rounded"></div>
            <div className="h-3 w-16 bg-white/20 rounded mt-1"></div>
          </div>

          {/* Bottom Section Skeleton */}
          <div className="flex items-center justify-between">
            <div className="h-8 w-20 bg-white/20 rounded"></div>
            <div className="space-y-1">
              <div className="h-3 w-32 bg-white/20 rounded"></div>
              <div className="h-3 w-28 bg-white/20 rounded"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs and Content Skeleton */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Tabs Skeleton */}
        <div className="border-b border-gray-100 bg-gray-100 p-2">
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded-xl animate-pulse"></div>
            ))}
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Card Visual Skeleton */}
            <div className="space-y-4">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-56 bg-gray-200 rounded-2xl animate-pulse"></div>
            </div>

            {/* Card Info Skeleton */}
            <div className="space-y-4">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>

      {/* Loading Indicator */}
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        <span className="ml-2 text-gray-600">Kredi kartı detayları yükleniyor...</span>
      </div>
    </div>
  )
}
