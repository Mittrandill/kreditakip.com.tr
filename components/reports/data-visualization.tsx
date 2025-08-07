"use client"

import { useMemo } from "react"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Brush,
  ComposedChart,
  Scatter,
  ScatterChart,
  RadialBarChart,
  RadialBar,
} from "recharts"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Zap } from "lucide-react"
import { formatCurrency, formatPercent } from "@/lib/format"

interface DataVisualizationProps {
  type:
    | "advanced-line"
    | "risk-matrix"
    | "utilization-gauge"
    | "performance-comparison"
    | "trend-analysis"
    | "debt-composition"
  data: any[]
  height?: number
  showPredictions?: boolean
  showConfidenceInterval?: boolean
  showRiskLevels?: boolean
  showOptimizationTips?: boolean
  title?: string
  description?: string
}

export function DataVisualization({
  type,
  data,
  height = 300,
  showPredictions = false,
  showConfidenceInterval = false,
  showRiskLevels = false,
  showOptimizationTips = false,
  title,
  description,
}: DataVisualizationProps) {
  // Color schemes for different chart types
  const colorSchemes = {
    primary: ["#3b82f6", "#1d4ed8", "#1e40af", "#1e3a8a"],
    success: ["#10b981", "#059669", "#047857", "#065f46"],
    warning: ["#f59e0b", "#d97706", "#b45309", "#92400e"],
    danger: ["#ef4444", "#dc2626", "#b91c1c", "#991b1b"],
    purple: ["#8b5cf6", "#7c3aed", "#6d28d9", "#5b21b6"],
    gradient: ["#3b82f6", "#8b5cf6", "#ef4444", "#10b981", "#f59e0b"],
  }

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}:{" "}
              {entry.name.includes("Tutar") || entry.name.includes("Borç") || entry.name.includes("Limit")
                ? formatCurrency(entry.value)
                : entry.name.includes("Oran") || entry.name.includes("%")
                  ? formatPercent(entry.value)
                  : entry.value?.toLocaleString?.("tr-TR") || entry.value}
            </p>
          ))}
          {showConfidenceInterval && payload[0]?.payload?.confidence && (
            <p className="text-xs text-gray-500 mt-1">Güven: %{payload[0].payload.confidence.toFixed(1)}</p>
          )}
        </div>
      )
    }
    return null
  }

  // Risk level indicator
  const RiskIndicator = ({ level }: { level: string }) => {
    const colors = {
      low: "bg-green-100 text-green-800 border-green-200",
      medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
      high: "bg-red-100 text-red-800 border-red-200",
    }

    const labels = {
      low: "Düşük Risk",
      medium: "Orta Risk",
      high: "Yüksek Risk",
    }

    return (
      <Badge className={(colors as any)[level] || colors.medium}>
        {(labels as any)[level] || level}
      </Badge>
    )
  }

  // Render different chart types
  const renderChart = () => {
    switch (type) {
      case "advanced-line":
        return (
          <ResponsiveContainer width="100%" height={height}>
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#666" />
              <YAxis tick={{ fontSize: 12 }} stroke="#666" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />

              {/* Historical data */}
              <Area
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.1}
                strokeWidth={2}
                name="Gerçek Değer"
              />

              {/* Predictions */}
              {showPredictions && (
                <Line
                  type="monotone"
                  dataKey="predictedValue"
                  stroke="#8b5cf6"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  dot={false}
                  name="Tahmin"
                />
              )}

              {/* Confidence interval */}
              {showConfidenceInterval && (
                <Area
                  type="monotone"
                  dataKey="confidenceUpper"
                  stroke="none"
                  fill="#8b5cf6"
                  fillOpacity={0.1}
                  name="Güven Aralığı"
                />
              )}

              <Brush dataKey="name" height={30} stroke="#3b82f6" />
            </ComposedChart>
          </ResponsiveContainer>
        )

      case "risk-matrix":
        return (
          <ResponsiveContainer width="100%" height={height}>
            <ScatterChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="performance"
                name="Performans"
                tick={{ fontSize: 12 }}
                label={{ value: "Performans Skoru", position: "insideBottom", offset: -10 }}
              />
              <YAxis
                dataKey="debt"
                name="Borç"
                tick={{ fontSize: 12 }}
                label={{ value: "Borç Tutarı", angle: -90, position: "insideLeft" }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                        <p className="font-medium text-gray-900">{data.name}</p>
                        <p className="text-sm text-blue-600">Performans: {data.performance?.toFixed(1)}</p>
                        <p className="text-sm text-red-600">Borç: {formatCurrency(data.debt)}</p>
                        <div className="mt-2">
                          <RiskIndicator level={data.riskLevel} />
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Scatter
                dataKey="debt"
                fill="#8884d8"
              />

              {/* Risk level reference lines */}
              {showRiskLevels && (
                <>
                  <ReferenceLine x={70} stroke="#10b981" strokeDasharray="2 2" />
                  <ReferenceLine x={50} stroke="#f59e0b" strokeDasharray="2 2" />
                  <ReferenceLine x={30} stroke="#ef4444" strokeDasharray="2 2" />
                </>
              )}
            </ScatterChart>
          </ResponsiveContainer>
        )

      case "utilization-gauge":
        const gaugeData = data.map((item, index) => ({
          ...item,
          fill: colorSchemes.gradient[index % colorSchemes.gradient.length],
        }))

        return (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={height}>
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="20%"
                outerRadius="80%"
                data={gaugeData}
                startAngle={90}
                endAngle={-270}
              >
                <RadialBar dataKey="value" cornerRadius={10} fill="#8884d8" />
                <Tooltip content={<CustomTooltip />} />
              </RadialBarChart>
            </ResponsiveContainer>

            {showOptimizationTips && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data.slice(0, 4).map((item, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{item.name}</span>
                      <Badge
                        className={
                          item.riskLevel === "high"
                            ? "bg-red-100 text-red-700"
                            : item.riskLevel === "medium"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-green-100 text-green-700"
                        }
                      >
                        %{item.value?.toFixed(1)}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600">
                      {item.riskLevel === "high"
                        ? "Kullanımı azaltın - kredi puanınız etkilenebilir"
                        : item.riskLevel === "medium"
                          ? "Dikkatli kullanın - optimal seviyeye yakın"
                          : "İyi durumda - kullanımı artırabilirsiniz"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )

      case "performance-comparison":
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="debt" fill="#ef4444" name="Borç" radius={[4, 4, 0, 0]} />
              <Bar dataKey="limit" fill="#3b82f6" name="Limit" radius={[4, 4, 0, 0]} />
              <Bar dataKey="performance" fill="#10b981" name="Performans" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )

      case "trend-analysis":
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorGradient)"
                strokeWidth={3}
              />
              {data.some((d) => d.trend === "predicted") && (
                <ReferenceLine
                  x={data.findIndex((d) => d.trend === "predicted")}
                  stroke="#8b5cf6"
                  strokeDasharray="2 2"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        )

      case "debt-composition":
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                outerRadius={height / 3}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percentage }) => `${name} %${percentage?.toFixed(1)}`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colorSchemes.gradient[index % colorSchemes.gradient.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )

      default:
        return (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <p>Desteklenmeyen grafik türü: {type}</p>
          </div>
        )
    }
  }

  // Calculate insights based on data
  const insights = useMemo(() => {
    if (!data || data.length === 0) return []

    const insights = []

    // Trend analysis
    if (type === "advanced-line" && data.length > 1) {
      const lastValue = data[data.length - 1]?.value || 0
      const previousValue = data[data.length - 2]?.value || 0
      const change = ((lastValue - previousValue) / previousValue) * 100

      if (Math.abs(change) > 5) {
        insights.push({
          type: change > 0 ? "increase" : "decrease",
          message: `Son dönemde %${Math.abs(change).toFixed(1)} ${change > 0 ? "artış" : "azalış"} görülüyor`,
          severity: Math.abs(change) > 20 ? "high" : "medium",
        })
      }
    }

    // Risk analysis
    if (type === "risk-matrix") {
      const highRiskItems = data.filter((item) => item.riskLevel === "high")
      if (highRiskItems.length > 0) {
        insights.push({
          type: "warning",
          message: `${highRiskItems.length} yüksek riskli hesap tespit edildi`,
          severity: "high",
        })
      }
    }

    // Utilization analysis
    if (type === "utilization-gauge") {
      const highUtilization = data.filter((item) => item.value > 80)
      if (highUtilization.length > 0) {
        insights.push({
          type: "warning",
          message: `${highUtilization.length} kartınızda yüksek kullanım oranı`,
          severity: "medium",
        })
      }
    }

    return insights
  }, [data, type])

  return (
    <div className="space-y-4">
      {/* Chart */}
      <div className="relative">{renderChart()}</div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <Zap className="h-4 w-4 text-purple-500" />
            AI İçgörüleri
          </h4>
          <div className="space-y-2">
            {insights.map((insight, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  insight.severity === "high"
                    ? "bg-red-50 border-red-200"
                    : insight.severity === "medium"
                      ? "bg-yellow-50 border-yellow-200"
                      : "bg-blue-50 border-blue-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  {insight.type === "warning" ? (
                    <AlertTriangle
                      className={`h-4 w-4 ${insight.severity === "high" ? "text-red-500" : "text-yellow-500"}`}
                    />
                  ) : insight.type === "increase" ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : insight.type === "decrease" ? (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      insight.severity === "high"
                        ? "text-red-800"
                        : insight.severity === "medium"
                          ? "text-yellow-800"
                          : "text-blue-800"
                    }`}
                  >
                    {insight.message}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
