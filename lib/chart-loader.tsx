import React from 'react'

// Single comprehensive Recharts loader
// Re-exports all Recharts components from one place
// This consolidates 11+ separate imports into a single module
// Next.js will bundle these together, reducing network requests

export {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'

// Loading skeleton component for charts
export const ChartSkeleton = () => (
  <div className="space-y-3 animate-pulse">
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
    <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg" />
  </div>
)
