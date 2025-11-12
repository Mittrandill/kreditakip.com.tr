"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"

// Dynamic import for ApexCharts to avoid SSR issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false })

interface DonutChartProps {
  data: {
    labels: string[]
    series: number[]
    colors?: string[]
  }
  title?: string
  height?: number
  showLegend?: boolean
  showLabels?: boolean
}

const DEFAULT_COLORS = [
  "#10B981", // emerald-500
  "#14B8A6", // teal-500
  "#06B6D4", // cyan-500
  "#059669", // emerald-600
  "#0D9488", // teal-600
  "#0891B2", // cyan-600
  "#34D399", // emerald-400
  "#2DD4BF", // teal-400
]

export default function DonutChart({
  data,
  title,
  height = 300,
  showLegend = true,
  showLabels = true,
}: DonutChartProps) {
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
      type: "donut",
      toolbar: {
        show: false,
      },
      animations: {
        enabled: true,
        easing: "easeinout",
        speed: 800,
      },
    },
    labels: data.labels,
    colors: data.colors || DEFAULT_COLORS,
    legend: {
      show: showLegend,
      position: "bottom" as const,
      horizontalAlign: "center" as const,
      fontSize: "14px",
      fontFamily: "inherit",
      labels: {
        colors: undefined,
        useSeriesColors: false,
      },
      markers: {
        width: 12,
        height: 12,
        radius: 3,
      },
      itemMargin: {
        horizontal: 10,
        vertical: 5,
      },
    },
    dataLabels: {
      enabled: showLabels,
      formatter: function (val: number) {
        return val.toFixed(1) + "%"
      },
      style: {
        fontSize: "12px",
        fontFamily: "inherit",
        fontWeight: 500,
      },
      dropShadow: {
        enabled: false,
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: "70%",
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: "16px",
              fontFamily: "inherit",
              fontWeight: 600,
              offsetY: -10,
            },
            value: {
              show: true,
              fontSize: "24px",
              fontFamily: "inherit",
              fontWeight: 700,
              offsetY: 10,
              formatter: function (val: string) {
                return val
              },
            },
            total: {
              show: title ? true : false,
              label: title || "Toplam",
              fontSize: "14px",
              fontFamily: "inherit",
              fontWeight: 600,
              color: "#6b7280",
              formatter: function (w: any) {
                return w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0).toLocaleString("tr-TR")
              },
            },
          },
        },
      },
    },
    stroke: {
      show: true,
      width: 2,
      colors: ["#fff"],
    },
    tooltip: {
      enabled: true,
      y: {
        formatter: function (val: number) {
          return val.toLocaleString("tr-TR")
        },
      },
      style: {
        fontSize: "12px",
        fontFamily: "inherit",
      },
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            width: "100%",
          },
          legend: {
            position: "bottom",
          },
        },
      },
    ],
  }

  return (
    <div className="w-full">
      <Chart options={options} series={data.series} type="donut" height={height} />
    </div>
  )
}
