export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatPercent(value: number): string {
  return `%${value.toFixed(1)}`
}

export function formatNumber(value: number): string {
  return value.toLocaleString("tr-TR")
}

export function formatDate(date: string | Date): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    if (isNaN(dateObj.getTime())) {
      return "-"
    }
    return dateObj.toLocaleDateString("tr-TR")
  } catch {
    return "-"
  }
}
