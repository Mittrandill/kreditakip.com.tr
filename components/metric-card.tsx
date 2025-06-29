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
  blue: "bg-blue-600",
  green: "bg-green-600",
  orange: "bg-orange-600",
  purple: "bg-purple-600",
  teal: "bg-teal-600",
  red: "bg-red-600",
  emerald: "bg-emerald-600",
}

export function MetricCard({ title, value, subtitle, color, icon, change, changeType }: MetricCardProps) {
  return (
    <Card
      className={`${colorVariants[color]} text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 rounded-xl animate-fade-in-up border-0`}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-white/90">{title}</CardTitle>
        <div className="bg-white/20 p-2 rounded-lg">
          <div className="h-5 w-5 text-white [&>svg]:h-5 [&>svg]:w-5">{icon}</div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl md:text-3xl font-bold mb-1">{value}</div>
        <div className="flex items-center text-xs text-white/80">
          {change && (
            <span
              className={`mr-2 flex items-center gap-1 px-2 py-1 rounded-full ${
                changeType === "positive" ? "bg-white/20 text-white" : "bg-red-500/20 text-red-100"
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
