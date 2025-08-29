import { supabase } from "@/lib/supabase"
import type { PaymentPlan, PaymentHistory } from "@/lib/types"

export async function getPaymentPlans(creditId: string) {
  const { data, error } = await supabase
    .from("payment_plans")
    .select("*")
    .eq("credit_id", creditId)
    .order("installment_number")

  if (error) {
    throw error
  }

  return data
}

export async function updatePaymentPlan(planId: string, updates: Partial<PaymentPlan>) {
  const { data, error } = await supabase
    .from("payment_plans")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", planId)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function getPaymentHistory(creditId: string) {
  const { data, error } = await supabase
    .from("payment_history")
    .select("*")
    .eq("credit_id", creditId)
    .order("payment_date", { ascending: false })

  if (error) {
    throw error
  }

  return data
}

export async function createPaymentHistory(paymentData: Omit<PaymentHistory, "id" | "created_at">) {
  const { data, error } = await supabase.from("payment_history").insert(paymentData).select().single()

  if (error) {
    throw error
  }

  return data
}

export async function getUpcomingPayments(userId: string, days = 30) {
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + days)

  const { data, error } = await supabase
    .from("payment_plans")
    .select(`
      *,
      credits!inner (
        id,
        credit_code,
        user_id,
        banks (
          name,
          logo_url
        )
      )
    `)
    .eq("credits.user_id", userId)
    .eq("status", "pending")
    .lte("due_date", futureDate.toISOString().split("T")[0])
    .order("due_date")

  if (error) {
    throw error
  }

  return data
}

// Yeni fonksiyon: Tüm ödemeleri çek (geçmiş + gelecek)
export async function getAllPayments(userId: string, monthsBack = 12, monthsForward = 12) {
  const pastDate = new Date()
  pastDate.setMonth(pastDate.getMonth() - monthsBack)

  const futureDate = new Date()
  futureDate.setMonth(futureDate.getMonth() + monthsForward)

  const { data, error } = await supabase
    .from("payment_plans")
    .select(`
      *,
      credits!inner (
        id,
        credit_code,
        user_id,
        banks (
          name,
          logo_url
        )
      )
    `)
    .eq("credits.user_id", userId)
    .gte("due_date", pastDate.toISOString().split("T")[0])
    .lte("due_date", futureDate.toISOString().split("T")[0])
    .order("due_date")

  if (error) {
    throw error
  }

  return data
}

export async function deletePaymentHistory(paymentId: string) {
  const { data, error } = await supabase.from("payment_history").delete().eq("id", paymentId).select().maybeSingle()

  if (error) {
    throw error
  }

  return data
}

export async function getPaymentHistoryById(paymentId: string) {
  const { data, error } = await supabase
    .from("payment_history")
    .select(`
      *,
      credits!inner (
        id,
        credit_code,
        user_id,
        banks (
          name,
          logo_url
        ),
        credit_types (
          name
        )
      )
    `)
    .eq("id", paymentId)
    .single()

  if (error) {
    throw error
  }

  return data
}
