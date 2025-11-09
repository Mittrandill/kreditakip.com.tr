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
  green: "bg-gradient-to-br from-green-600 to-green-700",
  teal: "bg-gradient-to-br from-teal-600 to-teal-700",
  emerald: "bg-gradient-to-br from-emerald-600 to-emerald-700",
  blue: "bg-gradient-to-br from-blue-600 to-blue-700",
  orange: "bg-gradient-to-br from-orange-600 to-orange-700",
  purple: "bg-gradient-to-br from-purple-600 to-purple-700",
  red: "bg-gradient-to-br from-red-600 to-red-700",

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

      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-2 relative z-10">
        <CardTitle className="text-xs font-medium text-white/90 dark:text-white/90 drop-shadow-sm">{title}</CardTitle>
        <div className={`${iconBackgroundVariants[color]} p-1 rounded-md backdrop-blur-sm`}>
          <div className="h-3 w-3 text-white dark:text-white/90 [&>svg]:h-3 [&>svg]:w-3">{icon}</div>
        </div>
      </CardHeader>
      <CardContent className="relative z-10 pb-2 pt-1">
        <div className="text-lg md:text-xl font-bold mb-0.5 text-white dark:text-white drop-shadow-md">{value}</div>
        <div className="flex items-center text-[10px] text-white/80 dark:text-white/60 drop-shadow-sm">
          {change && (
            <span
              className={`mr-1.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full ${
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
