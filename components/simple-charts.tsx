import { formatCurrency } from "@/lib/format"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts"

/* ---------- helpers ---------- */
const safeNumber = (value: unknown): number => (typeof value === "number" && Number.isFinite(value) ? value : 0)

/* ---------- types ---------- */
interface LineChartData {
  month: string
  anaParaBorcu: number
  toplamOdenen: number
}

interface BarChartData {
  name: string
  odeme: number
  faiz: number
  anaPara: number
}

interface DonutChartData {
  banka: string
  tutar: number
  fill: string
}

interface MiniDonutChartProps {
  data: DonutChartData[]
  centerText?: string
  centerSubtext?: string
}

interface PaymentTimelineData {
  date: string
  amount: number
  bank: string
}

interface InterestRateData {
  bank: string
  rate: number
  amount: number
}

/* ---------- charts ---------- */
export function SimpleLineChart({ data }: { data: LineChartData[] }) {
  if (!data?.length)
    return <div className="flex items-center justify-center h-24 text-xs text-gray-400">Grafik verisi bulunamadı</div>

  return (
    <ChartContainer
      config={{
        anaParaBorcu: { label: "Ana Para Borcu", color: "hsl(174 72% 40%)" },
        toplamOdenen: { label: "Toplam Ödenen", color: "hsl(174 65% 56%)" },
      }}
      className="h-[300px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
          <XAxis dataKey="month" className="text-xs" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={(v) => formatCurrency(v)} className="text-xs" tick={{ fontSize: 12 }} />
          <ChartTooltip content={<ChartTooltipContent />} formatter={(v, n) => [formatCurrency(Number(v)), n]} />
          <Legend />
          <Line
            type="monotone"
            dataKey="anaParaBorcu"
            stroke="var(--color-anaParaBorcu)"
            strokeWidth={3}
            dot={{ fill: "var(--color-anaParaBorcu)", strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: "var(--color-anaParaBorcu)", strokeWidth: 2 }}
            name="Ana Para Borcu"
          />
          <Line
            type="monotone"
            dataKey="toplamOdenen"
            stroke="var(--color-toplamOdenen)"
            strokeWidth={3}
            dot={{ fill: "var(--color-toplamOdenen)", strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: "var(--color-toplamOdenen)", strokeWidth: 2 }}
            name="Toplam Ödenen"
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

export function SimpleBarChart({ data }: { data: BarChartData[] }) {
  if (!data?.length)
    return <div className="flex items-center justify-center h-24 text-xs text-gray-400">Grafik verisi bulunamadı</div>

  return (
    <ChartContainer
      config={{
        anaPara: { label: "Ana Para", color: "hsl(174 72% 40%)" },
        faiz: { label: "Faiz", color: "hsl(174 65% 56%)" },
      }}
      className="h-[300px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
          <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={(v) => formatCurrency(v)} className="text-xs" tick={{ fontSize: 12 }} />
          <ChartTooltip content={<ChartTooltipContent />} formatter={(v, n) => [formatCurrency(Number(v)), n]} />
          <Legend />
          <Bar dataKey="anaPara" stackId="a" fill="var(--color-anaPara)" name="Ana Para" radius={[0, 0, 4, 4]} />
          <Bar dataKey="faiz" stackId="a" fill="var(--color-faiz)" name="Faiz" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

export function SimpleDonutChart({ data }: { data: DonutChartData[] }) {
  if (!data?.length) return null

  return (
    <ChartContainer config={{}} className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={5}
            dataKey="tutar"
            stroke="#fff"
            strokeWidth={2}
          >
            {data.map((entry, idx) => (
              <Cell key={`cell-${idx}`} fill={entry.fill} />
            ))}
          </Pie>
          <ChartTooltip content={<ChartTooltipContent />} formatter={(v, n) => [formatCurrency(Number(v)), n]} />
          <Legend verticalAlign="bottom" height={36} formatter={(v) => v} />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

export function MiniDonutChart({ data, centerText, centerSubtext }: MiniDonutChartProps) {
  if (!data?.length) return null

  const total = data.reduce((sum, d) => sum + safeNumber(d.tutar), 0)

  return (
    <div className="w-full h-[160px] flex items-center justify-center">
      <div className="relative">
        <ChartContainer config={{}} className="h-[160px] w-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={60}
                paddingAngle={5}
                dataKey="tutar"
                stroke="#fff"
                strokeWidth={2}
              >
                {data.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} formatter={(v, n) => [formatCurrency(Number(v)), n]} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-2">
            <div className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
              {centerText || formatCurrency(total)}
            </div>
            {centerSubtext && <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{centerSubtext}</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

export function PaymentTimeline({ data }: { data: PaymentTimelineData[] }) {
  if (!data?.length)
    return <div className="flex items-center justify-center h-24 text-xs text-gray-400">Yaklaşan ödeme yok</div>

  const max = Math.max(...data.map((d) => safeNumber(d.amount))) || 1

  return (
    <div className="w-full h-[120px] p-2">
      <div className="space-y-2">
        {data.slice(0, 3).map((p, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium text-gray-900 truncate">{p.bank}</div>
                <div className="text-xs font-semibold text-emerald-600">{formatCurrency(p.amount)}</div>
              </div>
              <div className="text-xs text-gray-500">{p.date}</div>
              <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 h-1 rounded-full"
                  style={{ width: `${(p.amount / max) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function InterestRateChart({ data }: { data: InterestRateData[] }) {
  if (!data?.length)
    return <div className="flex items-center justify-center h-24 text-xs text-gray-400">Faiz verisi yok</div>

  const max = Math.max(...data.map((d) => safeNumber(d.rate))) || 1

  return (
    <div className="w-full h-[120px] p-2">
      <div className="space-y-2">
        {data.slice(0, 3).map((d, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-2 h-2 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium text-gray-900 truncate">{d.bank}</div>
                <div className="text-xs font-semibold text-orange-600">%{d.rate.toFixed(1)}</div>
              </div>
              <div className="text-xs text-gray-500">{formatCurrency(d.amount)}</div>
              <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                <div
                  className="bg-gradient-to-r from-orange-500 to-red-600 h-1 rounded-full"
                  style={{ width: `${(d.rate / max) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
