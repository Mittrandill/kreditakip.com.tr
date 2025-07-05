import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function HesapDuzenleLoading() {
  return (
    <div className="space-y-6">
      {/* Hero Section Skeleton */}
      <Card className="overflow-hidden border-0 shadow-xl rounded-2xl">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-8 text-white relative">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-lg bg-white/20" />
              <div className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-lg bg-white/20" />
                <div className="space-y-2">
                  <Skeleton className="h-8 w-64 bg-white/20" />
                  <Skeleton className="h-6 w-48 bg-white/20" />
                  <Skeleton className="h-4 w-32 bg-white/20" />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-32 bg-white/20" />
              ))}
            </div>
          </div>

          {/* Metrics Skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="text-center space-y-2">
                <Skeleton className="h-4 w-20 bg-white/20 mx-auto" />
                <Skeleton className="h-8 w-24 bg-white/20 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Form Skeleton */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Tabs Skeleton */}
        <div className="border-b border-gray-100 bg-gray-100 p-2">
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons Skeleton */}
      <div className="flex gap-4 justify-end">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-40" />
      </div>
    </div>
  )
}
