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
  blue: "bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600",
  green: "bg-gradient-to-br from-green-600 to-green-700 dark:from-green-500 dark:to-green-600",
  orange: "bg-gradient-to-br from-orange-600 to-orange-700 dark:from-orange-500 dark:to-orange-600",
  purple: "bg-gradient-to-br from-purple-600 to-purple-700 dark:from-purple-500 dark:to-purple-600",
  teal: "bg-gradient-to-br from-teal-600 to-teal-700 dark:from-teal-500 dark:to-teal-600",
  red: "bg-gradient-to-br from-red-600 to-red-700 dark:from-red-500 dark:to-red-600",
  emerald: "bg-gradient-to-br from-emerald-600 to-emerald-700 dark:from-emerald-500 dark:to-emerald-600",
}

export function MetricCard({ title, value, subtitle, color, icon, change, changeType }: MetricCardProps) {
  return (
    <Card
      className={`${colorVariants[color]} text-white shadow-lg hover:shadow-xl dark:shadow-2xl transition-all duration-300 hover:scale-105 rounded-xl animate-fade-in-up border-0`}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-white/90">{title}</CardTitle>
        <div className="bg-white/20 dark:bg-white/30 p-2 rounded-lg backdrop-blur-sm">
          <div className="h-5 w-5 text-white [&>svg]:h-5 [&>svg]:w-5">{icon}</div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl md:text-3xl font-bold mb-1 text-white">{value}</div>
        <div className="flex items-center text-xs text-white/80">
          {change && (
            <span
              className={`mr-2 flex items-center gap-1 px-2 py-1 rounded-full ${
                changeType === "positive"
                  ? "bg-white/20 dark:bg-white/30 text-white"
                  : "bg-red-500/20 dark:bg-red-400/30 text-red-100 dark:text-red-200"
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
