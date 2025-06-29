import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function HesapDetayLoading() {
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {/* Back Button Skeleton */}
      <Skeleton className="h-10 w-32" />

      {/* Hero Section Skeleton */}
      <Card className="bg-gradient-to-r from-blue-600 to-indigo-700 border-transparent shadow-xl rounded-xl">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-16 w-16 rounded-lg bg-white/20" />
                <Skeleton className="h-16 w-16 rounded-lg bg-white/20" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-8 w-64 bg-white/20" />
                <Skeleton className="h-6 w-48 bg-white/20" />
                <div className="flex items-center gap-4">
                  <Skeleton className="h-4 w-32 bg-white/20" />
                  <Skeleton className="h-6 w-16 bg-white/20" />
                </div>
              </div>
            </div>
            <Skeleton className="h-12 w-32 bg-white/20" />
          </div>

          {/* Metrics Skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white/10 rounded-lg p-4 space-y-2">
                <Skeleton className="h-4 w-20 bg-white/20" />
                <Skeleton className="h-8 w-24 bg-white/20" />
              </div>
            ))}
          </div>

          {/* Progress Skeleton */}
          <div className="mt-6 space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-32 bg-white/20" />
              <Skeleton className="h-4 w-24 bg-white/20" />
            </div>
            <Skeleton className="h-2 w-full bg-white/20" />
          </div>
        </CardContent>
      </Card>

      {/* Tabs Skeleton */}
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-lg rounded-xl">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="shadow-lg rounded-xl">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
