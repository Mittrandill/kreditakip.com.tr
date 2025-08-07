"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  ComposedChart,
  ReferenceLine,
} from "recharts"
import { TrendingUp, BarChart3, PieChartIcon, Activity, Zap, Eye, Download, Maximize2, RefreshCw } from "lucide-react"
import { formatCurrency } from "@/lib/format"
import { useState } from "react"

interface InteractiveChartsProps {
  paymentTrendData: any[]
  debtDistributionData: any[]
  bankPerformanceData: any[]
  cardUtilizationData: any[]
}

export function InteractiveCharts({
  paymentTrendData,
  debtDistributionData,
  bankPerformanceData,
  cardUtilizationData,
}: InteractiveChartsProps) {
  const [activeChart, setActiveChart] = useState("trends")
  const [chartView, setChartView] = useState("detailed")

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === "number" ? formatCurrency(entry.value) : entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  // Custom legend component
  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {payload?.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-sm text-gray-600">{entry.value}</span>
          </div>
        ))}
      </div>
    )
  }

  const COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#6b7280", "#14b8a6", "#f97316"]

  return (
    <div className="space-y-6">
      {/* Chart Navigation */}
      <Card className="shadow-lg border-0 bg-gradient-to-r from-white to-blue-50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">İnteraktif Grafikler</CardTitle>
                <p className="text-sm text-gray-600">Detaylı finansal analiz ve görselleştirme</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                <Activity className="h-3 w-3 mr-1" />
                Canlı Veri
              </Badge>
              <Button variant="outline" size="sm" className="h-8 bg-transparent">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeChart} onValueChange={setActiveChart}>
            <TabsList className="grid w-full grid-cols-4 bg-gray-100">
              <TabsTrigger value="trends" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Trendler
              </TabsTrigger>
              <TabsTrigger value="distribution" className="flex items-center gap-2">
                <PieChartIcon className="h-4 w-4" />
                Dağılım
              </TabsTrigger>
              <TabsTrigger value="performance" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Performans
              </TabsTrigger>
              <TabsTrigger value="utilization" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Kullanım
              </TabsTrigger>
            </TabsList>

            {/* Payment Trends Chart */}
            <TabsContent value="trends" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Ödeme Trend Analizi</h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant={chartView === "simple" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setChartView("simple")}
                  >
                    Basit
                  </Button>
                  <Button
                    variant={chartView === "detailed" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setChartView("detailed")}
                  >
                    Detaylı
                  </Button>
                </div>
              </div>

              <div className="h-96 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {chartView === "simple" ? (
                    <LineChart data={paymentTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                      <YAxis
                        stroke="#6b7280"
                        fontSize={12}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend content={<CustomLegend />} />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: "#3b82f6", strokeWidth: 2 }}
                        name="Ödeme Tutarı"
                      />
                    </LineChart>
                  ) : (
                    <ComposedChart data={paymentTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                      <YAxis
                        stroke="#6b7280"
                        fontSize={12}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend content={<CustomLegend />} />
                      <Area
                        type="monotone"
                        dataKey="value"
                        fill="url(#colorGradient)"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        name="Ödeme Tutarı"
                      />
                      <Line
                        type="monotone"
                        dataKey="average"
                        stroke="#10b981"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                        name="Ortalama"
                      />
                      <ReferenceLine y={50000} stroke="#ef4444" strokeDasharray="3 3" label="Hedef" />
                      <defs>
                        <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                    </ComposedChart>
                  )}
                </ResponsiveContainer>
              </div>

              {/* Trend Insights */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-800">En Yüksek Ödeme</span>
                  </div>
                  <p className="text-lg font-bold text-emerald-900">
                    {formatCurrency(Math.max(...paymentTrendData.map((d) => d.value || 0)))}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Ortalama Ödeme</span>
                  </div>
                  <p className="text-lg font-bold text-blue-900">
                    {formatCurrency(
                      paymentTrendData.reduce((sum, d) => sum + (d.value || 0), 0) / paymentTrendData.length,
                    )}
                  </p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-800">Trend Yönü</span>
                  </div>
                  <p className="text-lg font-bold text-purple-900">
                    {paymentTrendData.length > 1 &&
                    paymentTrendData[paymentTrendData.length - 1]?.value > paymentTrendData[0]?.value
                      ? "Yükseliş"
                      : "Düşüş"}
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Debt Distribution Chart */}
            <TabsContent value="distribution" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Borç Dağılım Analizi</h3>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Grafik İndir
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pie Chart */}
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={debtDistributionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name} (${percentage?.toFixed(1)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {debtDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Distribution Details */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Detaylı Dağılım</h4>
                  {debtDistributionData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="font-medium text-gray-900">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{formatCurrency(item.value)}</p>
                        <p className="text-sm text-gray-600">{item.percentage?.toFixed(1)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Bank Performance Chart */}
            <TabsContent value="performance" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Banka Performans Karşılaştırması</h3>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-1" />
                  Detay Görünümü
                </Button>
              </div>

              <div className="h-96 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bankPerformanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={12} angle={-45} textAnchor="end" height={80} />
                    <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend content={<CustomLegend />} />
                    <Bar dataKey="value" name="Borç Tutarı" radius={[4, 4, 0, 0]}>
                      {bankPerformanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {bankPerformanceData.slice(0, 4).map((bank, index) => (
                  <div key={index} className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">{bank.name}</span>
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: bank.color || COLORS[index] }} />
                    </div>
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(bank.value)}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-xs text-gray-600">Risk:</span>
                      <Badge
                        className={`text-xs ${
                          bank.riskLevel === "low"
                            ? "bg-emerald-100 text-emerald-700"
                            : bank.riskLevel === "medium"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {bank.riskLevel === "low" ? "Düşük" : bank.riskLevel === "medium" ? "Orta" : "Yüksek"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Credit Card Utilization Chart */}
            <TabsContent value="utilization" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Kredi Kartı Kullanım Analizi</h3>
                <Button variant="outline" size="sm">
                  <Maximize2 className="h-4 w-4 mr-1" />
                  Tam Ekran
                </Button>
              </div>

              <div className="h-96 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={cardUtilizationData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={12} angle={-45} textAnchor="end" height={80} />
                    <YAxis yAxisId="left" stroke="#6b7280" fontSize={12} tickFormatter={(value) => `${value}%`} />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#6b7280"
                      fontSize={12}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend content={<CustomLegend />} />
                    <Bar yAxisId="right" dataKey="limit" name="Kredi Limiti" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="right" dataKey="debt" name="Mevcut Borç" radius={[4, 4, 0, 0]}>
                      {cardUtilizationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="value"
                      stroke="#8b5cf6"
                      strokeWidth={3}
                      dot={{ fill: "#8b5cf6", strokeWidth: 2, r: 4 }}
                      name="Kullanım Oranı (%)"
                    />
                    <ReferenceLine yAxisId="left" y={30} stroke="#10b981" strokeDasharray="3 3" label="İdeal (%30)" />
                    <ReferenceLine yAxisId="left" y={70} stroke="#f59e0b" strokeDasharray="3 3" label="Dikkat (%70)" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Utilization Insights */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                  <h4 className="font-semibold text-emerald-800 mb-2">Optimal Kartlar</h4>
                  <p className="text-2xl font-bold text-emerald-900">
                    {cardUtilizationData.filter((card) => card.value <= 30).length}
                  </p>
                  <p className="text-sm text-emerald-700">%30 altında kullanım</p>
                </div>
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <h4 className="font-semibold text-amber-800 mb-2">Dikkat Gereken</h4>
                  <p className="text-2xl font-bold text-amber-900">
                    {cardUtilizationData.filter((card) => card.value > 30 && card.value <= 70).length}
                  </p>
                  <p className="text-sm text-amber-700">%30-70 arası kullanım</p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <h4 className="font-semibold text-red-800 mb-2">Yüksek Risk</h4>
                  <p className="text-2xl font-bold text-red-900">
                    {cardUtilizationData.filter((card) => card.value > 70).length}
                  </p>
                  <p className="text-sm text-red-700">%70 üzeri kullanım</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
