import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ReactNode } from "react"

interface MetricCardProps {
  title: string
  value: string | number
  subtitle: string
  color: "blue" | "green" | "orange" | "purple" | "teal" | "red" | "emerald"
  icon: ReactNode
  change?: string
  changeType?: "positive" | "negative"
}

const colorVariants = {
  blue: "bg-gradient-to-br from-blue-600 to-blue-700",
  green: "bg-gradient-to-br from-green-600 to-green-700",
  orange: "bg-gradient-to-br from-orange-600 to-orange-700",
  purple: "bg-gradient-to-br from-purple-600 to-purple-700",
  teal: "bg-gradient-to-br from-teal-600 to-teal-700",
  red: "bg-gradient-to-br from-red-600 to-red-700",
  emerald: "bg-gradient-to-br from-emerald-600 to-emerald-700",
}

const iconBackgroundVariants = {
  blue: "bg-white/20 dark:bg-blue-600/30",
  green: "bg-white/20 dark:bg-green-600/30",
  orange: "bg-white/20 dark:bg-orange-600/30",
  purple: "bg-white/20 dark:bg-purple-600/30",
  teal: "bg-white/20 dark:bg-teal-600/30",
  red: "bg-white/20 dark:bg-red-600/30",
  emerald: "bg-white/20 dark:bg-emerald-600/30",
}

export function MetricCard({ title, value, subtitle, color, icon, change, changeType }: MetricCardProps) {
  return (
    <Card
      className={`${colorVariants[color]} text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 rounded-xl animate-fade-in-up border-gray-200 dark:border-white/10 dark:bg-black/20 dark:text-white relative overflow-hidden`}
    >
      {/* Background effects - very subtle in dark mode */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 dark:bg-white/[0.02] rounded-full -translate-y-16 translate-x-16 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 dark:bg-white/[0.02] rounded-full translate-y-12 -translate-x-12 pointer-events-none"></div>

      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
        <CardTitle className="text-sm font-medium text-white/90 dark:text-white/90 drop-shadow-sm">{title}</CardTitle>
        <div className={`${iconBackgroundVariants[color]} p-2 rounded-lg backdrop-blur-sm`}>
          <div className="h-5 w-5 text-white dark:text-white/90 [&>svg]:h-5 [&>svg]:w-5">{icon}</div>
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="text-2xl md:text-3xl font-bold mb-1 text-white dark:text-white drop-shadow-md">{value}</div>
        <div className="flex items-center text-xs text-white/80 dark:text-white/60 drop-shadow-sm">
          {change && (
            <span
              className={`mr-2 flex items-center gap-1 px-2 py-1 rounded-full ${
                changeType === "positive"
                  ? "bg-white/20 dark:bg-white/10 text-white backdrop-blur-sm"
                  : "bg-red-500/20 dark:bg-red-400/20 text-red-100 dark:text-red-200 backdrop-blur-sm"
              }`}
            >
              {change}
            </span>
          )}
          <span>{subtitle}</span>
        </div>
      </CardContent>
    </Card>
  )
}
