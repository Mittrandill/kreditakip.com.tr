import { supabase } from "@/lib/supabase"
import { cacheManager, requestBatcher } from "@/lib/utils/performance"

// Optimized credits fetching with caching
export async function getCreditsOptimized(userId: string, useCache = true) {
  if (!userId) throw new Error("User ID is required")

  const cacheKey = `credits-${userId}`

  if (useCache) {
    const cached = cacheManager.get(cacheKey)
    if (cached) return cached
  }

  return requestBatcher.batch(cacheKey, async () => {
    const { data, error } = await supabase
      .from("credits")
      .select(`
        *,
        banks (
          id,
          name,
          logo_url,
          contact_phone,
          contact_email
        ),
        credit_types (
          id,
          name,
          description
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching credits:", error)
      throw error
    }

    const result = data || []
    if (useCache) {
      cacheManager.set(cacheKey, result, 300000) // 5 minutes cache
    }

    return result
  })
}

// Batch update credit statuses
export async function batchUpdateCreditStatuses(creditIds: string[]) {
  const batchKey = `batch-update-${creditIds.join("-")}`

  return requestBatcher.batch(batchKey, async () => {
    // Get all payment plans for all credits in one query
    const { data: paymentPlans, error: planErr } = await supabase
      .from("payment_plans")
      .select("*")
      .in("credit_id", creditIds)

    if (planErr) throw planErr

    // Group by credit_id
    const plansByCredit =
      paymentPlans?.reduce(
        (acc, plan) => {
          if (!acc[plan.credit_id]) acc[plan.credit_id] = []
          acc[plan.credit_id].push(plan)
          return acc
        },
        {} as Record<string, any[]>,
      ) || {}

    // Calculate updates for each credit
    const updates = creditIds.map((creditId) => {
      const plans = plansByCredit[creditId] || []
      const totalInstallments = plans.length
      const paidPlans = plans.filter((p) => p.status === "paid")
      const pendingPlans = plans.filter((p) => p.status === "pending")

      const remainingInstallments = pendingPlans.length
      const paymentProgress = totalInstallments > 0 ? (paidPlans.length / totalInstallments) * 100 : 0
      const remainingDebt = pendingPlans.reduce((sum, p) => sum + p.total_payment, 0)

      let status: "active" | "closed" | "overdue" = "active"
      if (remainingInstallments === 0) status = "closed"
      else if (pendingPlans.some((p) => new Date(p.due_date) < new Date())) status = "overdue"

      return {
        id: creditId,
        remaining_debt: remainingDebt,
        remaining_installments: remainingInstallments,
        payment_progress: paymentProgress,
        status,
        updated_at: new Date().toISOString(),
      }
    })

    // Batch update all credits
    const { data: updated, error: updErr } = await supabase.from("credits").upsert(updates).select()

    if (updErr) throw updErr

    // Clear cache for affected users
    updates.forEach((update) => {
      cacheManager.delete(`credits-${update.id}`)
    })

    return updated
  })
}

// Optimized dashboard data fetching
export async function getDashboardDataOptimized(userId: string) {
  const cacheKey = `dashboard-${userId}`
  const cached = cacheManager.get(cacheKey)
  if (cached) return cached

  return requestBatcher.batch(cacheKey, async () => {
    // Single query to get all necessary data
    const [creditsData, upcomingPaymentsData] = await Promise.all([
      getCreditsOptimized(userId),
      supabase
        .from("payment_plans")
        .select(`
          *,
          credits!inner (
            id,
            credit_code,
            user_id,
            banks (name, logo_url)
          )
        `)
        .eq("credits.user_id", userId)
        .eq("status", "pending")
        .lte("due_date", new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])
        .order("due_date")
        .then(({ data, error }) => {
          if (error) throw error
          return data || []
        }),
    ])

    const result = {
      credits: creditsData,
      upcomingPayments: upcomingPaymentsData,
      timestamp: Date.now(),
    }

    cacheManager.set(cacheKey, result, 180000) // 3 minutes cache for dashboard
    return result
  })
}
