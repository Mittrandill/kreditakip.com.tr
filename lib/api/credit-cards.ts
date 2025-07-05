import { supabase } from "@/lib/supabase"

export interface CreditCardData {
  id?: string
  user_id: string
  bank_id?: string
  card_name: string
  card_type: string
  card_number?: string | null
  credit_limit: number
  current_debt: number
  available_limit?: number
  minimum_payment_rate: number
  interest_rate: number
  late_payment_fee: number
  annual_fee: number
  statement_day?: number | null
  due_day?: number | null
  next_statement_date?: string | null
  next_due_date?: string | null
  is_active: boolean
  notes?: string | null
  bank_name?: string
}

export interface CreateCreditCardData {
  card_name: string
  bank_name: string
  card_type: string
  credit_limit: number
  current_balance: number
  due_date?: number | null
  annual_fee: number
  interest_rate: number
  status: string
  description: string
}

export interface UpdateCreditCardData {
  card_name: string
  bank_name: string
  card_type: string
  credit_limit: number
  current_debt: number
  due_day?: number | null
  annual_fee: number
  interest_rate: number
  minimum_payment_rate: number
  late_payment_fee: number
  is_active: boolean
  notes: string
}

export async function getCreditCards(userId: string) {
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
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching credit cards:", error)
    throw new Error("Kredi kartları yüklenirken hata oluştu")
  }

  return data || []
}

export async function getCreditCard(id: string) {
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
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching credit card:", error)
    throw new Error("Kredi kartı bilgileri yüklenirken hata oluştu")
  }

  return data
}

export async function createCreditCard(userId: string, cardData: CreateCreditCardData) {
  // Find or create bank
  let bankId = null

  if (cardData.bank_name) {
    const { data: existingBank } = await supabase.from("banks").select("id").ilike("name", cardData.bank_name).single()

    if (existingBank) {
      bankId = existingBank.id
    } else {
      const { data: newBank, error: bankError } = await supabase
        .from("banks")
        .insert({
          name: cardData.bank_name,
          is_active: true,
        })
        .select("id")
        .single()

      if (bankError) {
        console.error("Error creating bank:", bankError)
      } else {
        bankId = newBank.id
      }
    }
  }

  const creditCardRecord = {
    user_id: userId,
    bank_id: bankId,
    card_name: cardData.card_name,
    card_type: cardData.card_type,
    credit_limit: cardData.credit_limit,
    current_debt: cardData.current_balance,
    available_limit: cardData.credit_limit - cardData.current_balance,
    minimum_payment_rate: 3, // Default 3%
    interest_rate: cardData.interest_rate,
    late_payment_fee: 0,
    annual_fee: cardData.annual_fee,
    due_day: cardData.due_date,
    is_active: cardData.status === "aktif",
    notes: cardData.description,
    bank_name: cardData.bank_name,
  }

  const { data, error } = await supabase.from("credit_cards").insert(creditCardRecord).select().single()

  if (error) {
    console.error("Error creating credit card:", error)
    throw new Error("Kredi kartı oluşturulurken hata oluştu")
  }

  return data
}

export async function updateCreditCard(id: string, updateData: UpdateCreditCardData) {
  // Find or create bank
  let bankId = null

  if (updateData.bank_name) {
    const { data: existingBank } = await supabase
      .from("banks")
      .select("id")
      .ilike("name", updateData.bank_name)
      .single()

    if (existingBank) {
      bankId = existingBank.id
    } else {
      const { data: newBank, error: bankError } = await supabase
        .from("banks")
        .insert({
          name: updateData.bank_name,
          is_active: true,
        })
        .select("id")
        .single()

      if (bankError) {
        console.error("Error creating bank:", bankError)
      } else {
        bankId = newBank.id
      }
    }
  }

  const creditCardRecord = {
    bank_id: bankId,
    card_name: updateData.card_name,
    card_type: updateData.card_type,
    credit_limit: updateData.credit_limit,
    current_debt: updateData.current_debt,
    available_limit: updateData.credit_limit - updateData.current_debt,
    minimum_payment_rate: updateData.minimum_payment_rate,
    interest_rate: updateData.interest_rate,
    late_payment_fee: updateData.late_payment_fee,
    annual_fee: updateData.annual_fee,
    due_day: updateData.due_day,
    is_active: updateData.is_active,
    notes: updateData.notes,
    bank_name: updateData.bank_name,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase.from("credit_cards").update(creditCardRecord).eq("id", id).select().single()

  if (error) {
    console.error("Error updating credit card:", error)
    throw new Error("Kredi kartı güncellenirken hata oluştu")
  }

  return data
}

export async function deleteCreditCard(id: string) {
  const { error } = await supabase.from("credit_cards").delete().eq("id", id)

  if (error) {
    console.error("Error deleting credit card:", error)
    throw new Error("Kredi kartı silinirken hata oluştu")
  }
}
