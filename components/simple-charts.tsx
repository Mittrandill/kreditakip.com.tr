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
  hesapBakiye?: number
}

interface BarChartData {
  name: string
  krediOdeme?: number
  kartOdeme?: number
  gelir?: number
  odeme?: number
  faiz?: number
  anaPara?: number
}

interface DonutChartData {
  name: string
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
  type?: string
}

/* ---------- charts ---------- */
export function SimpleLineChart({ data }: { data: LineChartData[] }) {
  if (!data?.length)
    return <div className="flex items-center justify-center h-24 text-xs text-gray-400">Grafik verisi bulunamadı</div>

  return (
    <ChartContainer
      config={{
        anaParaBorcu: { label: "Ana Para Borcu", color: "hsl(0 84% 60%)" },
        toplamOdenen: { label: "Toplam Ödenen", color: "hsl(174 65% 56%)" },
        hesapBakiye: { label: "Hesap Bakiyesi", color: "hsl(217 91% 60%)" },
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
          {data[0]?.hesapBakiye !== undefined && (
            <Line
              type="monotone"
              dataKey="hesapBakiye"
              stroke="var(--color-hesapBakiye)"
              strokeWidth={3}
              dot={{ fill: "var(--color-hesapBakiye)", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: "var(--color-hesapBakiye)", strokeWidth: 2 }}
              name="Hesap Bakiyesi"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

export function SimpleBarChart({ data }: { data: BarChartData[] }) {
  if (!data?.length)
    return <div className="flex items-center justify-center h-24 text-xs text-gray-400">Grafik verisi bulunamadı</div>

  // Veri tipini kontrol et
  const hasNewFormat = data[0]?.krediOdeme !== undefined

  if (hasNewFormat) {
    return (
      <ChartContainer
        config={{
          krediOdeme: { label: "Kredi Ödemesi", color: "hsl(0 84% 60%)" },
          kartOdeme: { label: "Kart Ödemesi", color: "hsl(25 95% 53%)" },
          gelir: { label: "Gelir", color: "hsl(142 76% 36%)" },
        }}
        className="h-[300px]"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
            <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={(v) => formatCurrency(v)} className="text-xs" tick={{ fontSize: 12 }} />
            <ChartTooltip content={<ChartTooltipContent />} formatter={(v, n) => [formatCurrency(Number(v)), n]} />
            <Legend />
            <Bar dataKey="gelir" fill="var(--color-gelir)" name="Gelir" radius={[4, 4, 0, 0]} />
            <Bar dataKey="krediOdeme" fill="var(--color-krediOdeme)" name="Kredi Ödemesi" radius={[4, 4, 0, 0]} />
            <Bar dataKey="kartOdeme" fill="var(--color-kartOdeme)" name="Kart Ödemesi" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    )
  }

  // Eski format
  return (
    <ChartContainer
      config={{
        odeme: { label: "Ödeme", color: "hsl(0 84% 60%)" },
        faiz: { label: "Faiz", color: "hsl(25 95% 53%)" },
        anaPara: { label: "Ana Para", color: "hsl(142 76% 36%)" },
      }}
      className="h-[300px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
          <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={(v) => formatCurrency(v)} className="text-xs" tick={{ fontSize: 12 }} />
          <ChartTooltip content={<ChartTooltipContent />} formatter={(v, n) => [formatCurrency(Number(v)), n]} />
          <Legend />
          <Bar dataKey="odeme" fill="var(--color-odeme)" name="Ödeme" radius={[4, 4, 0, 0]} />
          <Bar dataKey="faiz" fill="var(--color-faiz)" name="Faiz" radius={[4, 4, 0, 0]} />
          <Bar dataKey="anaPara" fill="var(--color-anaPara)" name="Ana Para" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

export function SimpleDonutChart({ data, centerText, centerSubtext }: MiniDonutChartProps) {
  if (!data?.length)
    return <div className="flex items-center justify-center h-[300px] text-gray-500">Veri bulunamadı</div>

  const total = data.reduce((sum, item) => sum + safeNumber(item.tutar), 0)

  return (
    <div className="relative">
      <div className="h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={100} paddingAngle={2} dataKey="tutar">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <ChartTooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload
                  const percentage = total > 0 ? ((data.tutar / total) * 100).toFixed(1) : "0"
                  return (
                    <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                      <p className="font-medium text-gray-900">{data.name}</p>
                      <p className="text-sm text-gray-600">{formatCurrency(data.tutar)}</p>
                      <p className="text-xs text-gray-500">{percentage}%</p>
                    </div>
                  )
                }
                return null
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Center text */}
      {(centerText || centerSubtext) && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            {centerText && <div className="text-lg font-bold text-gray-900">{centerText}</div>}
            {centerSubtext && <div className="text-sm text-gray-600">{centerSubtext}</div>}
          </div>
        </div>
      )}

      {/* Legend - Card içinde kalacak şekilde */}
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        {data.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.fill }} />
            <span className="text-sm text-gray-600">{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function PaymentTimeline({ data }: { data: PaymentTimelineData[] }) {
  if (!data?.length) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              <div className="h-3 bg-gray-300 rounded w-16"></div>
            </div>
            <div className="h-3 bg-gray-300 rounded w-20"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {data.slice(0, 5).map((payment, index) => (
        <div
          key={index}
          className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <div className="text-sm text-gray-600">{payment.date}</div>
          </div>
          <div className="text-sm font-medium text-gray-900">{formatCurrency(payment.amount)}</div>
        </div>
      ))}
    </div>
  )
}

export function InterestRateChart({ data }: { data: InterestRateData[] }) {
  if (!data?.length) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg animate-pulse">
            <div className="h-3 bg-gray-300 rounded w-20"></div>
            <div className="h-3 bg-gray-300 rounded w-12"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {data.slice(0, 5).map((item, index) => (
        <div
          key={index}
          className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <div className="flex flex-col">
            <div className="text-sm font-medium text-gray-900">{item.bank}</div>
            {item.type && <div className="text-xs text-gray-500">{item.type}</div>}
          </div>
          <div className="text-sm font-medium text-orange-600">{item.rate.toFixed(2)}%</div>
        </div>
      ))}
    </div>
  )
}
