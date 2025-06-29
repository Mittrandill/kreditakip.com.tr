import { supabase } from "@/lib/supabase"
import type { CreditCard } from "@/lib/types"

export async function getCreditCards(userId: string): Promise<CreditCard[]> {
  const { data, error } = await supabase
    .from("credit_cards")
    .select(`
      *,
      banks (
        id,
        name,
        logo_url
      )
    `)
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching credit cards:", error)
    throw error
  }

  return data || []
}

export async function getCreditCard(cardId: string): Promise<CreditCard | null> {
  const { data, error } = await supabase
    .from("credit_cards")
    .select(`
      *,
      banks (
        id,
        name,
        logo_url
      )
    `)
    .eq("id", cardId)
    .single()

  if (error) {
    console.error("Error fetching credit card:", error)
    throw error
  }

  return data
}

export async function getCreditCardSummary(userId: string) {
  const { data: cards, error } = await supabase
    .from("credit_cards")
    .select("credit_limit, current_debt, available_limit")
    .eq("user_id", userId)
    .eq("is_active", true)

  if (error) {
    console.error("Error fetching credit card summary:", error)
    throw error
  }

  if (!cards || cards.length === 0) {
    return {
      totalCards: 0,
      totalCreditLimit: 0,
      totalCurrentDebt: 0,
      totalAvailableLimit: 0,
      averageUtilization: 0,
    }
  }

  const summary = cards.reduce(
    (acc, card) => {
      acc.totalCreditLimit += card.credit_limit || 0
      acc.totalCurrentDebt += card.current_debt || 0
      acc.totalAvailableLimit += card.available_limit || 0
      return acc
    },
    {
      totalCreditLimit: 0,
      totalCurrentDebt: 0,
      totalAvailableLimit: 0,
    },
  )

  const averageUtilization =
    summary.totalCreditLimit > 0 ? (summary.totalCurrentDebt / summary.totalCreditLimit) * 100 : 0

  return {
    totalCards: cards.length,
    ...summary,
    averageUtilization,
  }
}

export async function getUpcomingDueDates(userId: string, daysAhead = 30) {
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + daysAhead)

  const { data, error } = await supabase
    .from("credit_cards")
    .select(`
      *,
      banks (
        id,
        name,
        logo_url
      )
    `)
    .eq("user_id", userId)
    .eq("is_active", true)
    .not("next_due_date", "is", null)
    .lte("next_due_date", futureDate.toISOString().split("T")[0])
    .order("next_due_date", { ascending: true })

  if (error) {
    console.error("Error fetching upcoming due dates:", error)
    throw error
  }

  return (data || []).map((card) => ({
    ...card,
    minimumPayment: Math.max((card.current_debt * card.minimum_payment_rate) / 100, 50),
  }))
}

export async function createCreditCard(userId: string, cardData: any) {
  const { data, error } = await supabase
    .from("credit_cards")
    .insert([
      {
        user_id: userId,
        card_name: cardData.card_name,
        bank_name: cardData.bank_name,
        card_type: cardData.card_type,
        credit_limit: cardData.credit_limit,
        current_debt: cardData.current_balance || 0,
        minimum_payment_rate: 2.5,
        due_date: cardData.due_date,
        annual_fee: cardData.annual_fee,
        interest_rate: cardData.interest_rate,
        status: cardData.status,
        description: cardData.description,
        is_active: true,
      },
    ])
    .select()
    .single()

  if (error) {
    console.error("Error creating credit card:", error)
    throw error
  }

  return data
}

export async function updateCreditCard(userId: string, cardId: string, updates: any) {
  const { data, error } = await supabase
    .from("credit_cards")
    .update({
      card_name: updates.card_name,
      bank_name: updates.bank_name,
      card_type: updates.card_type,
      credit_limit: updates.credit_limit,
      current_debt: updates.current_balance || 0,
      due_date: updates.due_date,
      annual_fee: updates.annual_fee,
      interest_rate: updates.interest_rate,
      status: updates.status,
      description: updates.description,
      updated_at: new Date().toISOString(),
    })
    .eq("id", cardId)
    .eq("user_id", userId)
    .select()
    .single()

  if (error) {
    console.error("Error updating credit card:", error)
    throw error
  }

  return data
}

export async function deleteCreditCard(userId: string, cardId: string) {
  const { error } = await supabase
    .from("credit_cards")
    .update({ is_active: false })
    .eq("id", cardId)
    .eq("user_id", userId)

  if (error) {
    console.error("Error deleting credit card:", error)
    throw error
  }
}
