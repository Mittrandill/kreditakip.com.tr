import { supabase } from "@/lib/supabase"
import type { Credit } from "@/lib/types"
import { createPaymentPlansForCredit } from "./payment-plans"
import { createError, ErrorType, ErrorSeverity, errorLogger } from "@/lib/utils/error-handling"

/* ------------------------------------------------------------------ */
/*  CRUD UTILS                                                        */
/* ------------------------------------------------------------------ */

export async function getCredits(userId: string) {
  if (!userId) {
    const error = createError(
      ErrorType.VALIDATION,
      "User ID is required",
      "Kullanıcı kimliği gerekli",
      ErrorSeverity.HIGH,
      { function: "getCredits" },
    )
    errorLogger.log(error)
    throw new Error(error.message)
  }

  try {
    const { data, error } = await supabase
      .from("credits")
      .select(
        `
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
      `,
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      const appError = createError(
        ErrorType.SERVER,
        `Database error: ${error.message}`,
        "Krediler yüklenirken hata oluştu",
        ErrorSeverity.HIGH,
        { function: "getCredits", userId, supabaseError: error },
      )
      errorLogger.log(appError)
      throw new Error(appError.message)
    }

    return data || []
  } catch (error: any) {
    if (error.message.includes("Database error")) {
      throw error // Re-throw our custom error
    }

    const appError = createError(
      ErrorType.UNKNOWN,
      error.message || "Unknown error in getCredits",
      "Krediler yüklenirken beklenmeyen hata oluştu",
      ErrorSeverity.MEDIUM,
      { function: "getCredits", userId, originalError: error },
    )
    errorLogger.log(appError)
    throw new Error(appError.message)
  }
}

export async function getCreditById(creditId: string, userId: string) {
  try {
    const { data, error } = await supabase
      .from("credits")
      .select(
        `
        *,
        banks (
          id,
          name,
          logo_url,
          contact_phone,
          contact_email,
          website
        ),
        credit_types (
          id,
          name,
          description
        )
      `,
      )
      .eq("id", creditId)
      .eq("user_id", userId)
      .single()

    if (error) {
      const appError = createError(
        ErrorType.SERVER,
        `Database error: ${error.message}`,
        "Kredi detayları yüklenirken hata oluştu",
        ErrorSeverity.HIGH,
        { function: "getCreditById", creditId, userId, supabaseError: error },
      )
      errorLogger.log(appError)
      throw new Error(appError.message)
    }

    return data
  } catch (error: any) {
    if (error.message.includes("Database error")) {
      throw error
    }

    const appError = createError(
      ErrorType.UNKNOWN,
      error.message || "Unknown error in getCreditById",
      "Kredi detayları yüklenirken beklenmeyen hata oluştu",
      ErrorSeverity.MEDIUM,
      { function: "getCreditById", creditId, userId, originalError: error },
    )
    errorLogger.log(appError)
    throw new Error(appError.message)
  }
}

export async function createCredit(creditData: Omit<Credit, "id" | "created_at" | "updated_at">) {
  try {
    const { data, error } = await supabase.from("credits").insert(creditData).select().single()

    if (error) {
      const appError = createError(
        ErrorType.SERVER,
        `Database error: ${error.message}`,
        "Kredi oluşturulurken hata oluştu",
        ErrorSeverity.HIGH,
        { function: "createCredit", creditData, supabaseError: error },
      )
      errorLogger.log(appError)
      throw new Error(appError.message)
    }

    return data
  } catch (error: any) {
    if (error.message.includes("Database error")) {
      throw error
    }

    const appError = createError(
      ErrorType.UNKNOWN,
      error.message || "Unknown error in createCredit",
      "Kredi oluşturulurken beklenmeyen hata oluştu",
      ErrorSeverity.MEDIUM,
      { function: "createCredit", creditData, originalError: error },
    )
    errorLogger.log(appError)
    throw new Error(appError.message)
  }
}

// New function to create credit with payment plans
export async function createCreditWithPaymentPlans(
  creditData: Omit<Credit, "id" | "created_at" | "updated_at">,
  createPaymentPlans = true,
) {
  const { data: credit, error } = await supabase.from("credits").insert(creditData).select().single()

  if (error) {
    console.error("Error creating credit:", error)
    throw error
  }

  if (createPaymentPlans) {
    try {
      const paymentPlansData = {
        initial_amount: creditData.initial_amount,
        monthly_payment: creditData.monthly_payment,
        interest_rate: creditData.interest_rate,
        start_date: creditData.start_date,
        total_installments: creditData.total_installments,
      }

      await createPaymentPlansForCredit(credit.id, paymentPlansData)
    } catch (paymentPlanError) {
      console.error("Error creating payment plans for credit:", paymentPlanError)
      // Don't throw here, let the credit creation succeed
    }
  }

  return credit
}

export async function updateCredit(creditId: string, updates: Partial<Credit>) {
  try {
    const { data, error } = await supabase
      .from("credits")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", creditId)
      .select()
      .single()

    if (error) {
      const appError = createError(
        ErrorType.SERVER,
        `Database error: ${error.message}`,
        "Kredi güncellenirken hata oluştu",
        ErrorSeverity.HIGH,
        { function: "updateCredit", creditId, updates, supabaseError: error },
      )
      errorLogger.log(appError)
      throw new Error(appError.message)
    }

    return data
  } catch (error: any) {
    if (error.message.includes("Database error")) {
      throw error
    }

    const appError = createError(
      ErrorType.UNKNOWN,
      error.message || "Unknown error in updateCredit",
      "Kredi güncellenirken beklenmeyen hata oluştu",
      ErrorSeverity.MEDIUM,
      { function: "updateCredit", creditId, updates, originalError: error },
    )
    errorLogger.log(appError)
    throw new Error(appError.message)
  }
}

export async function deleteCredit(creditId: string) {
  const { error } = await supabase.from("credits").delete().eq("id", creditId)

  if (error) {
    console.error("Error deleting credit:", error)
    throw error
  }
}

export async function getBanks() {
  const { data, error } = await supabase.from("banks").select("*").order("name")

  if (error) {
    console.error("Error fetching banks:", error)
    throw error
  }

  return data
}

export async function getCreditTypes() {
  const { data, error } = await supabase.from("credit_types").select("*").order("name")

  if (error) {
    console.error("Error fetching credit types:", error)
    throw error
  }

  return data
}

/* ------------- helper alias (legacy calls expect this) ------------ */
export { getCredits as getUserCredits }

/* ------------------------------------------------------------------ */
/*  STATUS SYNC UTILITY (new)                                          */
/* ------------------------------------------------------------------ */

export async function updateCreditStatus(creditId: string) {
  // Pull every payment plan for the credit
  const { data: paymentPlans, error: planErr } = await supabase
    .from("payment_plans")
    .select("*")
    .eq("credit_id", creditId)

  if (planErr) throw planErr
  if (!paymentPlans || paymentPlans.length === 0) return null

  const totalInstallments = paymentPlans.length
  const paidPlans = paymentPlans.filter((p) => p.status === "paid")
  const pendingPlans = paymentPlans.filter((p) => p.status === "pending")

  const remainingInstallments = pendingPlans.length
  const paymentProgress = totalInstallments > 0 ? (paidPlans.length / totalInstallments) * 100 : 0

  const remainingDebt = pendingPlans.reduce((sum, p) => sum + p.total_payment, 0)

  let status: "active" | "closed" | "overdue" = "active"
  if (remainingInstallments === 0) status = "closed"
  else if (pendingPlans.some((p) => new Date(p.due_date) < new Date())) status = "overdue"

  const { data: updated, error: updErr } = await supabase
    .from("credits")
    .update({
      remaining_debt: remainingDebt,
      remaining_installments: remainingInstallments,
      payment_progress: paymentProgress,
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", creditId)
    .select()
    .single()

  if (updErr) throw updErr
  return updated
}
