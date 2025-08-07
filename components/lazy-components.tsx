import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"

const LoadingFallback = () => (
  <div className="flex items-center justify-center p-4">
    <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
  </div>
)

// Lazy load heavy components
export const LazyLineChart = dynamic(
  () => import("@/components/charts/OptimizedLineChart"),
  {
    loading: () => <LoadingFallback />,
    ssr: false,
  }
)

export const LazyBarChart = dynamic(
  () => import("@/components/charts/OptimizedBarChart"),
  {
    loading: () => <LoadingFallback />,
    ssr: false,
  }
)

export const LazyMetricCard = dynamic(
  () => import("@/components/metric-card").then(mod => ({ default: mod.MetricCard })),
  {
    loading: () => <LoadingFallback />,
  }
)

export const LazyTabs = dynamic(
  () => import("@/components/ui/tabs").then(mod => ({ default: mod.Tabs })),
  {
    loading: () => <LoadingFallback />,
  }
)

export const LazyTabsContent = dynamic(
  () => import("@/components/ui/tabs").then(mod => ({ default: mod.TabsContent })),
  {
    loading: () => <LoadingFallback />,
  }
)

export const LazyTabsList = dynamic(
  () => import("@/components/ui/tabs").then(mod => ({ default: mod.TabsList })),
  {
    loading: () => <LoadingFallback />,
  }
)

export const LazyTabsTrigger = dynamic(
  () => import("@/components/ui/tabs").then(mod => ({ default: mod.TabsTrigger })),
  {
    loading: () => <LoadingFallback />,
  }
)