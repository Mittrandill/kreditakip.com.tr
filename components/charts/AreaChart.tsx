"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false })

interface AreaChartProps {
  data: {
    categories: string[]
    series: {
      name: string
      data: number[]
    }[]
    colors?: string[]
  }
  height?: number
  showGrid?: boolean
  showLegend?: boolean
  strokeWidth?: number
  fillOpacity?: number
}

const DEFAULT_COLORS = ["#10B981", "#14B8A6", "#06B6D4"]

export default function AreaChart({
  data,
  height = 350,
  showGrid = true,
  showLegend = true,
  strokeWidth = 3,
  fillOpacity = 0.3,
}: AreaChartProps) {
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
      type: "area",
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false,
      },
      animations: {
        enabled: true,
        easing: "easeinout",
        speed: 800,
      },
    },
    colors: data.colors || DEFAULT_COLORS,
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: "smooth" as const,
      width: strokeWidth,
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: fillOpacity,
        opacityTo: 0.1,
        stops: [0, 90, 100],
      },
    },
    xaxis: {
      categories: data.categories,
      labels: {
        style: {
          colors: "#6b7280",
          fontSize: "12px",
          fontFamily: "inherit",
        },
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: "#6b7280",
          fontSize: "12px",
          fontFamily: "inherit",
        },
        formatter: function (val: number) {
          if (val >= 1000000) {
            return (val / 1000000).toFixed(1) + "M"
          } else if (val >= 1000) {
            return (val / 1000).toFixed(0) + "K"
          }
          return val.toFixed(0)
        },
      },
    },
    grid: {
      show: showGrid,
      borderColor: "#f3f4f6",
      strokeDashArray: 4,
      position: "back" as const,
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: showGrid,
        },
      },
      padding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 10,
      },
    },
    legend: {
      show: showLegend,
      position: "top" as const,
      horizontalAlign: "right" as const,
      fontSize: "14px",
      fontFamily: "inherit",
      markers: {
        width: 12,
        height: 12,
        radius: 3,
      },
      itemMargin: {
        horizontal: 10,
        vertical: 0,
      },
    },
    tooltip: {
      enabled: true,
      shared: true,
      intersect: false,
      y: {
        formatter: function (val: number) {
          return "₺" + val.toLocaleString("tr-TR")
        },
      },
      style: {
        fontSize: "12px",
        fontFamily: "inherit",
      },
    },
    responsive: [
      {
        breakpoint: 768,
        options: {
          legend: {
            position: "bottom",
          },
        },
      },
    ],
  }

  return (
    <div className="w-full">
      <Chart options={options} series={data.series} type="area" height={height} />
    </div>
  )
}
