import { Card, CardContent } from "@/components/ui/card"
import type { ReactNode } from "react"

interface MetricCardProps {
  title: string
  value: string | number
  subtitle: string
  color: "blue" | "green" | "orange" | "purple" | "teal" | "red" | "emerald"
  icon: ReactNode
  badge?: string
}

const iconBackgroundVariants = {
  blue: "bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700",
  green: "bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700",
  orange: "bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700",
  purple: "bg-gradient-to-br from-teal-500 to-teal-600 dark:from-teal-600 dark:to-teal-700",
  teal: "bg-gradient-to-br from-teal-500 to-teal-600 dark:from-teal-600 dark:to-teal-700",
  red: "bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700",
  emerald: "bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700",
}

export function MetricCard({ title, value, subtitle, color, icon, badge }: MetricCardProps) {
  return (
    <Card className="border-gray-200 dark:border-gray-800 hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">{title}</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{value}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>
            {badge && (
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-2">{badge}</p>
            )}
          </div>
          <div className={`p-3 ${iconBackgroundVariants[color]} rounded-xl shadow-sm`}>
            <div className="h-6 w-6 text-white [&>svg]:h-6 [&>svg]:w-6">{icon}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
