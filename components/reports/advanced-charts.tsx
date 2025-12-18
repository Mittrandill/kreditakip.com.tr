"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, PieChart, TrendingUp, Building2 } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart as RechartsLineChart,
  Line,
} from "recharts"
import { formatCurrency } from "@/lib/format"
import type { ReportFilters } from "./filters"

interface AdvancedChartsProps {
  credits: any[]
  payments: any[]
  filters: ReportFilters
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"]

export default function AdvancedCharts({ credits, payments, filters }: AdvancedChartsProps) {
  // Filter data based on selected banks
  const filteredCredits =
    filters.bankFilter.length > 0
      ? credits.filter((credit) => credit.banks?.name && filters.bankFilter.includes(credit.banks.name))
      : credits

  // Bank distribution data with short names
  const bankDistributionData = filteredCredits
    .reduce((acc: any[], credit) => {
      const fullBankName = credit.banks?.name || "Bilinmeyen"
      const bankName =
        fullBankName.replace("Bankasi", "").replace("Bank", "").replace("BBVA", "").trim() || fullBankName
      const existing = acc.find((item) => item.name === bankName)

      if (existing) {
        existing.value += credit.amount || 0
      } else {
        acc.push({
          name: bankName,
          value: credit.amount || 0,
        })
      }
      return acc
    }, [])
    .sort((a, b) => b.value - a.value)

  // Credit type distribution with better names
  const creditTypeData = filteredCredits.reduce((acc: any[], credit) => {
    const typeName = credit.credit_types?.name || "Diger Krediler"
    const existing = acc.find((item) => item.name === typeName)

    if (existing) {
      existing.value += credit.amount || 0
    } else {
      acc.push({
        name: typeName.replace("Kredisi", "").replace("Kredi", "").trim() || typeName,
        value: credit.amount || 0,
      })
    }
    return acc
  }, [])

  // Monthly payment trends
  const monthlyTrendData = (() => {
    const monthlyData: { [key: string]: number } = {}
    const last12Months = []

    for (let i = 11; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthKey = date.toISOString().slice(0, 7)
      const monthName = date.toLocaleDateString("tr-TR", { month: "short", year: "2-digit" })

      // Calculate payments for this month
      const monthPayments = payments.filter((payment) => {
        if (payment.due_date) {
          const paymentDate = new Date(payment.due_date)
          return paymentDate.getFullYear() === date.getFullYear() && paymentDate.getMonth() === date.getMonth()
        }
        return false
      })

      const totalAmount = monthPayments.reduce((sum, p) => sum + (p.total_payment || 0), 0)
      last12Months.push({
        name: monthName,
        amount: totalAmount,
        date: monthKey,
      })
    }

    return last12Months
  })()

  // Interest rate comparison with short bank names
  const interestRateData = filteredCredits
    .filter((credit) => credit.interest_rate > 0)
    .map((credit) => {
      const fullBankName = credit.banks?.name || "Bilinmeyen"
      const shortName =
        fullBankName.replace("Bankasi", "").replace("Bank", "").replace("BBVA", "").trim() || fullBankName
      return {
        name: shortName,
        rate: credit.interest_rate,
        amount: credit.amount,
      }
    })
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 6)

  return (
    <div className="space-y-6">
      {/* Bank Distribution Chart */}
      <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            Bankalar Bazinda Kredi Dagilimi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <RechartsPieChart>
              <Pie
                data={bankDistributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {bankDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => formatCurrency(value || 0)} />
            </RechartsPieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Monthly Payment Trend */}
      <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Son 12 Ay Odeme Trendi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <RechartsLineChart data={monthlyTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip formatter={(value: any) => formatCurrency(value || 0)} />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#8884d8"
                strokeWidth={2}
                dot={{ fill: "#8884d8", strokeWidth: 2, r: 4 }}
              />
            </RechartsLineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Credit Type Distribution */}
      <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5 text-purple-600" />
            Kredi Turlerine Gore Dagilim
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={creditTypeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip formatter={(value: any) => formatCurrency(value || 0)} />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Interest Rate Comparison */}
      {interestRateData.length > 0 && (
        <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-orange-600" />
              Bankalar Arasi Faiz Orani Analizi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={interestRateData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => `%${value}`} />
                <Tooltip formatter={(value: any) => `%${value || 0}`} />
                <Bar dataKey="rate" fill="#ff7300" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
