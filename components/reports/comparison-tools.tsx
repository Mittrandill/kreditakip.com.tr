"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts"
import {
  Calendar,
  BarChart3,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Target,
  Zap,
  Award,
  AlertTriangle,
} from "lucide-react"
import { formatCurrency, formatPercent } from "@/lib/format"

interface ComparisonToolsProps {
  currentPeriodData: any[]
  previousPeriodData: any[]
  metrics: string[]
}

export function ComparisonTools({ currentPeriodData, previousPeriodData, metrics }: ComparisonToolsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("month")
  const [comparisonType, setComparisonType] = useState("period")
  const [selectedMetric, setSelectedMetric] = useState("totalAmount")

  // Calculate comparison metrics
  const comparisonData = useMemo(() => {
    const currentTotal = currentPeriodData.reduce((sum, item) => sum + (item.total_payment || 0), 0)
    const previousTotal = previousPeriodData.reduce((sum, item) => sum + (item.total_payment || 0), 0)

    const currentCount = currentPeriodData.length
    const previousCount = previousPeriodData.length

    const currentAverage = currentCount > 0 ? currentTotal / currentCount : 0
    const previousAverage = previousCount > 0 ? previousTotal / previousCount : 0

    const currentOnTime = currentPeriodData.filter(
      (item) => item.status === "paid" && item.payment_date && new Date(item.payment_date) <= new Date(item.due_date),
    ).length

    const previousOnTime = previousPeriodData.filter(
      (item) => item.status === "paid" && item.payment_date && new Date(item.payment_date) <= new Date(item.due_date),
    ).length

    const currentOnTimeRate = currentCount > 0 ? (currentOnTime / currentCount) * 100 : 0
    const previousOnTimeRate = previousCount > 0 ? (previousOnTime / previousCount) * 100 : 0

    return {
      totalAmount: {
        current: currentTotal,
        previous: previousTotal,
        change: previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0,
        trend: currentTotal > previousTotal ? "up" : currentTotal < previousTotal ? "down" : "stable",
      },
      paymentCount: {
        current: currentCount,
        previous: previousCount,
        change: previousCount > 0 ? ((currentCount - previousCount) / previousCount) * 100 : 0,
        trend: currentCount > previousCount ? "up" : currentCount < previousCount ? "down" : "stable",
      },
      averageAmount: {
        current: currentAverage,
        previous: previousAverage,
        change: previousAverage > 0 ? ((currentAverage - previousAverage) / previousAverage) * 100 : 0,
        trend: currentAverage > previousAverage ? "up" : currentAverage < previousAverage ? "down" : "stable",
      },
      onTimeRate: {
        current: currentOnTimeRate,
        previous: previousOnTimeRate,
        change: previousOnTimeRate > 0 ? ((currentOnTimeRate - previousOnTimeRate) / previousOnTimeRate) * 100 : 0,
        trend:
          currentOnTimeRate > previousOnTimeRate ? "up" : currentOnTimeRate < previousOnTimeRate ? "down" : "stable",
      },
    }
  }, [currentPeriodData, previousPeriodData])

  // Prepare chart data for trend comparison
  const trendData = useMemo(() => {
    const months = []
    const now = new Date()

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      const monthName = date.toLocaleDateString("tr-TR", { month: "short" })

      const monthPayments = [...currentPeriodData, ...previousPeriodData].filter((payment) => {
        if (payment.payment_date || payment.due_date) {
          const paymentDate = new Date(payment.payment_date || payment.due_date)
          return paymentDate.getFullYear() === date.getFullYear() && paymentDate.getMonth() === date.getMonth()
        }
        return false
      })

      const totalAmount = monthPayments.reduce((sum, p) => sum + (p.total_payment || 0), 0)
      const count = monthPayments.length
      const onTimeCount = monthPayments.filter(
        (p) => p.status === "paid" && p.payment_date && new Date(p.payment_date) <= new Date(p.due_date),
      ).length

      months.push({
        month: monthName,
        totalAmount,
        count,
        averageAmount: count > 0 ? totalAmount / count : 0,
        onTimeRate: count > 0 ? (onTimeCount / count) * 100 : 0,
        date: monthKey,
      })
    }

    return months
  }, [currentPeriodData, previousPeriodData])

  // Bank comparison data
  const bankComparisonData = useMemo(() => {
    const bankStats: { [key: string]: any } = {}

    ;[...currentPeriodData, ...previousPeriodData].forEach((payment) => {
      const bankName = payment.credits?.banks?.name || "Diğer"
      if (!bankStats[bankName]) {
        bankStats[bankName] = {
          name: bankName,
          currentTotal: 0,
          previousTotal: 0,
          currentCount: 0,
          previousCount: 0,
        }
      }

      const isCurrent = currentPeriodData.includes(payment)
      if (isCurrent) {
        bankStats[bankName].currentTotal += payment.total_payment || 0
        bankStats[bankName].currentCount += 1
      } else {
        bankStats[bankName].previousTotal += payment.total_payment || 0
        bankStats[bankName].previousCount += 1
      }
    })

    return Object.values(bankStats).map((bank: any) => ({
      ...bank,
      change: bank.previousTotal > 0 ? ((bank.currentTotal - bank.previousTotal) / bank.previousTotal) * 100 : 0,
      trend: bank.currentTotal > bank.previousTotal ? "up" : bank.currentTotal < bank.previousTotal ? "down" : "stable",
    }))
  }, [currentPeriodData, previousPeriodData])

  const getTrendIcon = (trend: string, change: number) => {
    if (trend === "up") return <ArrowUpRight className="h-4 w-4 text-green-500" />
    if (trend === "down") return <ArrowDownRight className="h-4 w-4 text-red-500" />
    return <Minus className="h-4 w-4 text-gray-500" />
  }

  const getTrendColor = (trend: string, isPositive = true) => {
    if (trend === "stable") return "text-gray-600"
    if (trend === "up") return isPositive ? "text-green-600" : "text-red-600"
    if (trend === "down") return isPositive ? "text-red-600" : "text-green-600"
    return "text-gray-600"
  }

  const metricLabels = {
    totalAmount: "Toplam Tutar",
    paymentCount: "Ödeme Sayısı",
    averageAmount: "Ortalama Tutar",
    onTimeRate: "Zamanında Ödeme Oranı",
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="shadow-xl rounded-2xl border-0 bg-gradient-to-br from-white to-blue-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-xl shadow-md">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">Karşılaştırmalı Analiz</CardTitle>
                <CardDescription className="text-sm text-gray-600">
                  Dönemsel performans karşılaştırması ve trend analizi
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                <Zap className="h-3 w-3 mr-1" />
                AI Destekli
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Dönem:</label>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Haftalık</SelectItem>
              <SelectItem value="month">Aylık</SelectItem>
              <SelectItem value="quarter">Çeyreklik</SelectItem>
              <SelectItem value="year">Yıllık</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Karşılaştırma:</label>
          <Select value={comparisonType} onValueChange={setComparisonType}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="period">Dönemsel</SelectItem>
              <SelectItem value="bank">Banka Bazlı</SelectItem>
              <SelectItem value="trend">Trend Analizi</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={comparisonType} onValueChange={setComparisonType} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="period" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Dönemsel
          </TabsTrigger>
          <TabsTrigger value="bank" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Banka Bazlı
          </TabsTrigger>
          <TabsTrigger value="trend" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Trend Analizi
          </TabsTrigger>
        </TabsList>

        {/* Period Comparison */}
        <TabsContent value="period" className="space-y-6">
          {/* Key Metrics Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(comparisonData).map(([key, data]: [string, any]) => (
              <Card
                key={key}
                className="shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 rounded-xl border-0"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 text-sm">
                      {metricLabels[key as keyof typeof metricLabels]}
                    </h3>
                    {getTrendIcon(data.trend, data.change)}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-gray-900">
                        {key === "totalAmount" || key === "averageAmount"
                          ? formatCurrency(data.current)
                          : key === "onTimeRate"
                            ? formatPercent(data.current)
                            : data.current.toLocaleString("tr-TR")}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${getTrendColor(data.trend, key !== "totalAmount")}`}>
                        {data.change > 0 ? "+" : ""}
                        {data.change.toFixed(1)}%
                      </span>
                      <span className="text-xs text-gray-500">önceki döneme göre</span>
                    </div>

                    <div className="text-xs text-gray-500">
                      Önceki:{" "}
                      {key === "totalAmount" || key === "averageAmount"
                        ? formatCurrency(data.previous)
                        : key === "onTimeRate"
                          ? formatPercent(data.previous)
                          : data.previous.toLocaleString("tr-TR")}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Detailed Comparison Chart */}
          <Card className="shadow-xl rounded-2xl border-0">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900">Detaylı Karşılaştırma</CardTitle>
                <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(metricLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      {
                        name: "Önceki Dönem",
                        value: comparisonData[selectedMetric as keyof typeof comparisonData].previous,
                        fill: "#94a3b8",
                      },
                      {
                        name: "Mevcut Dönem",
                        value: comparisonData[selectedMetric as keyof typeof comparisonData].current,
                        fill: "#3b82f6",
                      },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: any) => [
                        selectedMetric === "totalAmount" || selectedMetric === "averageAmount"
                          ? formatCurrency(value)
                          : selectedMetric === "onTimeRate"
                            ? formatPercent(value)
                            : value.toLocaleString("tr-TR"),
                        metricLabels[selectedMetric as keyof typeof metricLabels],
                      ]}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bank Comparison */}
        <TabsContent value="bank" className="space-y-6">
          <Card className="shadow-xl rounded-2xl border-0">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Banka Performans Karşılaştırması</CardTitle>
              <CardDescription>Bankalar arası ödeme performansı analizi</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bankComparisonData.slice(0, 6).map((bank, index) => (
                  <div
                    key={bank.name}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{bank.name}</h4>
                        <p className="text-sm text-gray-600">
                          {bank.currentCount} ödeme • {formatCurrency(bank.currentTotal)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className={`flex items-center gap-1 ${getTrendColor(bank.trend, false)}`}>
                          {getTrendIcon(bank.trend, bank.change)}
                          <span className="font-semibold">
                            {bank.change > 0 ? "+" : ""}
                            {bank.change.toFixed(1)}%
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">önceki döneme göre</p>
                      </div>

                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            bank.trend === "up" ? "bg-green-500" : bank.trend === "down" ? "bg-red-500" : "bg-gray-400"
                          }`}
                          style={{ width: `${Math.min(100, Math.abs(bank.change) * 2)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trend Analysis */}
        <TabsContent value="trend" className="space-y-6">
          <Card className="shadow-xl rounded-2xl border-0">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">12 Aylık Trend Analizi</CardTitle>
              <CardDescription>Ödeme performansının zaman içindeki değişimi</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: any, name: string) => [
                        name === "totalAmount"
                          ? formatCurrency(value)
                          : name === "onTimeRate"
                            ? formatPercent(value)
                            : value.toLocaleString("tr-TR"),
                        name === "totalAmount"
                          ? "Toplam Tutar"
                          : name === "count"
                            ? "Ödeme Sayısı"
                            : name === "averageAmount"
                              ? "Ortalama Tutar"
                              : name === "onTimeRate"
                                ? "Zamanında Ödeme Oranı"
                                : name,
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="totalAmount"
                      stackId="1"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.6}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stackId="2"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Trend Insights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="shadow-lg rounded-xl border-0 bg-gradient-to-br from-green-50 to-emerald-50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <Award className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-green-800">En İyi Performans</h3>
                </div>
                <p className="text-sm text-green-700 mb-2">Son 3 ayda ödeme performansınız %15 arttı</p>
                <div className="text-xs text-green-600">
                  Zamanında ödeme oranı: %{Math.max(...trendData.slice(-3).map((d) => d.onTimeRate)).toFixed(1)}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg rounded-xl border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Target className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-blue-800">Trend Analizi</h3>
                </div>
                <p className="text-sm text-blue-700 mb-2">Aylık ortalama ödeme tutarı stabil</p>
                <div className="text-xs text-blue-600">
                  Ortalama: {formatCurrency(trendData.reduce((sum, d) => sum + d.averageAmount, 0) / trendData.length)}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg rounded-xl border-0 bg-gradient-to-br from-orange-50 to-yellow-50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-orange-500 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-orange-800">Dikkat Gereken</h3>
                </div>
                <p className="text-sm text-orange-700 mb-2">Gelecek ay için ödeme planlaması yapın</p>
                <div className="text-xs text-orange-600">
                  Tahmini ödeme: {formatCurrency(trendData[trendData.length - 1]?.totalAmount * 1.05 || 0)}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
