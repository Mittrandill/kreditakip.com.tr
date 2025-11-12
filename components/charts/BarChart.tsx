"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false })

interface BarChartProps {
  data: {
    categories: string[]
    series: {
      name: string
      data: number[]
    }[]
    colors?: string[]
  }
  height?: number
  horizontal?: boolean
  stacked?: boolean
  showGrid?: boolean
  showLegend?: boolean
}

const DEFAULT_COLORS = ["#10B981", "#14B8A6", "#06B6D4", "#059669"]

export default function BarChart({
  data,
  height = 350,
  horizontal = false,
  stacked = false,
  showGrid = true,
  showLegend = true,
}: BarChartProps) {
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
      type: "bar",
      toolbar: {
        show: false,
      },
      stacked: stacked,
      animations: {
        enabled: true,
        easing: "easeinout",
        speed: 800,
      },
    },
    colors: data.colors || DEFAULT_COLORS,
    plotOptions: {
      bar: {
        horizontal: horizontal,
        borderRadius: 8,
        borderRadiusApplication: "end" as const,
        columnWidth: "60%",
        dataLabels: {
          position: "top",
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 2,
      colors: ["transparent"],
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
          show: horizontal ? showGrid : false,
        },
      },
      yaxis: {
        lines: {
          show: horizontal ? false : showGrid,
        },
      },
      padding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: horizontal ? 0 : 10,
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
      shared: !stacked,
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
          plotOptions: {
            bar: {
              columnWidth: "80%",
            },
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
      <Chart options={options} series={data.series} type="bar" height={height} />
    </div>
  )
}
