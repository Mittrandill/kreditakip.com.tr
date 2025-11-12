"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false })

interface RadialBarChartProps {
  data: {
    labels: string[]
    series: number[]
    colors?: string[]
  }
  height?: number
  showLegend?: boolean
}

const DEFAULT_COLORS = ["#10B981", "#14B8A6", "#06B6D4", "#059669"]

export default function RadialBarChart({ data, height = 350, showLegend = true }: RadialBarChartProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="animate-pulse text-gray-400">Yükleniyor...</div>
      </div>
    )
  }

  const options: any = {
    chart: {
      type: "radialBar",
      toolbar: {
        show: false,
      },
      animations: {
        enabled: true,
        easing: "easeinout",
        speed: 800,
      },
    },
    plotOptions: {
      radialBar: {
        offsetY: 0,
        startAngle: 0,
        endAngle: 270,
        hollow: {
          margin: 5,
          size: "30%",
          background: "transparent",
        },
        dataLabels: {
          name: {
            show: true,
            fontSize: "14px",
            fontFamily: "inherit",
            fontWeight: 600,
            color: "#6b7280",
            offsetY: -10,
          },
          value: {
            show: true,
            fontSize: "24px",
            fontFamily: "inherit",
            fontWeight: 700,
            color: "#111827",
            offsetY: 5,
            formatter: function (val: number) {
              return val.toFixed(0) + "%"
            },
          },
          total: {
            show: true,
            label: "Ortalama",
            fontSize: "14px",
            fontFamily: "inherit",
            fontWeight: 600,
            color: "#6b7280",
            formatter: function (w: any) {
              const avg = w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0) / w.globals.series.length
              return avg.toFixed(0) + "%"
            },
          },
        },
        track: {
          background: "#f3f4f6",
          strokeWidth: "97%",
          margin: 5,
        },
      },
    },
    colors: data.colors || DEFAULT_COLORS,
    labels: data.labels,
    legend: {
      show: showLegend,
      position: "bottom" as const,
      horizontalAlign: "center" as const,
      fontSize: "14px",
      fontFamily: "inherit",
      markers: {
        width: 12,
        height: 12,
        radius: 3,
      },
      itemMargin: {
        horizontal: 10,
        vertical: 5,
      },
      formatter: function (seriesName: string, opts: any) {
        return seriesName + ": " + opts.w.globals.series[opts.seriesIndex] + "%"
      },
    },
    stroke: {
      lineCap: "round" as const,
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          legend: {
            show: true,
            position: "bottom",
          },
        },
      },
    ],
  }

  return (
    <div className="w-full">
      <Chart options={options} series={data.series} type="radialBar" height={height} />
    </div>
  )
}
