import { supabase } from "@/lib/supabase"
import type { PaymentPlan } from "@/lib/types"

export async function createPaymentPlansForCredit(
  creditId: string,
  creditData: {
    initial_amount: number
    monthly_payment: number
    interest_rate: number
    start_date: string
    total_installments: number
  },
) {
  const paymentPlans: Omit<PaymentPlan, "id" | "created_at" | "updated_at">[] = []

  const startDate = new Date(creditData.start_date)
  let remainingDebt = creditData.initial_amount

  // Her taksit için ödeme planı oluştur
  for (let i = 1; i <= creditData.total_installments; i++) {
    const dueDate = new Date(startDate)
    dueDate.setMonth(dueDate.getMonth() + i - 1)

    // Faiz tutarını hesapla (aylık faiz oranı * kalan borç)
    const interestAmount = remainingDebt * (creditData.interest_rate / 100)

    // Ana para tutarını hesapla
    const principalAmount = creditData.monthly_payment - interestAmount

    // Kalan borcu güncelle
    remainingDebt = Math.max(0, remainingDebt - principalAmount)

    // Son taksitte kalan borcu sıfırla
    const adjustedPrincipal = i === creditData.total_installments ? principalAmount + remainingDebt : principalAmount

    if (i === creditData.total_installments) {
      remainingDebt = 0
    }

    paymentPlans.push({
      credit_id: creditId,
      installment_number: i,
      due_date: dueDate.toISOString().split("T")[0],
      principal_amount: Math.max(0, adjustedPrincipal),
      interest_amount: Math.max(0, interestAmount),
      total_payment: creditData.monthly_payment,
      remaining_debt: remainingDebt,
      status: "pending",
      payment_date: null,
      payment_channel: null,
    })
  }

  // Tüm ödeme planlarını veritabanına kaydet
  const { data, error } = await supabase.from("payment_plans").insert(paymentPlans).select()

  if (error) {
    console.error("Error creating payment plans:", error)
    throw error
  }

  return data
}

export async function getPaymentPlans(creditId: string) {
  const { data, error } = await supabase
    .from("payment_plans")
    .select("*")
    .eq("credit_id", creditId)
    .order("installment_number")

  if (error) {
    console.error("Error fetching payment plans:", error)
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
    console.error("Error updating payment plan:", error)
    throw error
  }

  return data
}

export async function deletePaymentPlansForCredit(creditId: string) {
  const { error } = await supabase.from("payment_plans").delete().eq("credit_id", creditId)

  if (error) {
    console.error("Error deleting payment plans:", error)
    throw error
  }
}
