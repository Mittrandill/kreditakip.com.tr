import { supabase } from "@/lib/supabase"
import type { PaymentPlan } from "@/lib/types"

export interface PaymentPlanPreview {
  installment_number: number
  due_date: string
  principal_amount: number
  interest_amount: number
  total_payment: number
  remaining_debt: number
}

export function generatePaymentPlanPreview(creditData: {
  initial_amount: number
  monthly_payment: number
  interest_rate: number
  start_date: string
  total_installments: number
}): PaymentPlanPreview[] {
  const paymentPlans: PaymentPlanPreview[] = []
  const startDate = new Date(creditData.start_date)
  let remainingDebt = creditData.initial_amount

  // Her taksit için ödeme planı oluştur
  for (let i = 1; i <= creditData.total_installments; i++) {
    const dueDate = new Date(startDate)
    // İlk taksit başlangıç tarihinden 1 ay sonra
    dueDate.setMonth(dueDate.getMonth() + i)

    // Aylık faiz oranını hesapla
    const monthlyInterestRate = creditData.interest_rate / 100 / 12

    // Faiz tutarını hesapla (aylık faiz oranı * kalan borç)
    const interestAmount = remainingDebt * monthlyInterestRate

    // Ana para tutarını hesapla
    const principalAmount = creditData.monthly_payment - interestAmount

    // Kalan borcu güncelle
    const newRemainingDebt = Math.max(0, remainingDebt - principalAmount)

    // Son taksitte kalan borcu sıfırla
    let adjustedPrincipal = principalAmount
    let adjustedTotal = creditData.monthly_payment

    if (i === creditData.total_installments && newRemainingDebt > 0) {
      adjustedPrincipal = principalAmount + newRemainingDebt
      adjustedTotal = interestAmount + adjustedPrincipal
      remainingDebt = 0
    } else {
      remainingDebt = newRemainingDebt
    }

    paymentPlans.push({
      installment_number: i,
      due_date: dueDate.toISOString().split("T")[0],
      principal_amount: Math.max(0, adjustedPrincipal),
      interest_amount: Math.max(0, interestAmount),
      total_payment: adjustedTotal,
      remaining_debt: remainingDebt,
    })
  }

  return paymentPlans
}

export async function createPaymentPlansFromPreview(creditId: string, paymentPlans: PaymentPlanPreview[]) {
  const paymentPlanInserts: Omit<PaymentPlan, "id" | "created_at" | "updated_at">[] = paymentPlans.map((plan) => ({
    credit_id: creditId,
    installment_number: plan.installment_number,
    due_date: plan.due_date,
    principal_amount: plan.principal_amount,
    interest_amount: plan.interest_amount,
    total_payment: plan.total_payment,
    remaining_debt: plan.remaining_debt,
    status: "pending",
    payment_date: null,
    payment_channel: null,
  }))

  // Tüm ödeme planlarını veritabanına kaydet
  const { data, error } = await supabase.from("payment_plans").insert(paymentPlanInserts).select()

  if (error) {
    console.error("Error creating payment plans:", error)
    throw error
  }

  return data
}

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
  const paymentPlans = generatePaymentPlanPreview(creditData)
  return await createPaymentPlansFromPreview(creditId, paymentPlans)
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
