import { supabase } from "@/lib/supabase"
import type { Account } from "@/lib/types"

export async function getAccounts(userId: string): Promise<Account[]> {
  const { data, error } = await supabase
    .from("accounts")
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
    console.error("Error fetching accounts:", error)
    throw error
  }

  return data || []
}

export async function getAccount(accountId: string): Promise<Account | null> {
  const { data, error } = await supabase
    .from("accounts")
    .select(`
      *,
      banks (
        id,
        name,
        logo_url
      )
    `)
    .eq("id", accountId)
    .single()

  if (error) {
    console.error("Error fetching account:", error)
    throw error
  }

  return data
}

export async function getAccountSummary(userId: string) {
  const { data: accounts, error } = await supabase
    .from("accounts")
    .select("current_balance, currency, overdraft_limit")
    .eq("user_id", userId)
    .eq("is_active", true)

  if (error) {
    console.error("Error fetching account summary:", error)
    throw error
  }

  if (!accounts || accounts.length === 0) {
    return {
      totalAccounts: 0,
      totalBalance: 0,
      totalOverdraftLimit: 0,
      totalOverdraftUsed: 0,
      accountsByCurrency: {},
    }
  }

  const summary = accounts.reduce(
    (acc, account) => {
      // Total balance
      acc.totalBalance += account.current_balance

      // Overdraft calculations
      acc.totalOverdraftLimit += account.overdraft_limit || 0
      if (account.current_balance < 0) {
        acc.totalOverdraftUsed += Math.abs(account.current_balance)
      }

      // Group by currency
      if (!acc.accountsByCurrency[account.currency]) {
        acc.accountsByCurrency[account.currency] = {
          count: 0,
          totalBalance: 0,
        }
      }
      acc.accountsByCurrency[account.currency].count += 1
      acc.accountsByCurrency[account.currency].totalBalance += account.current_balance

      return acc
    },
    {
      totalBalance: 0,
      totalOverdraftLimit: 0,
      totalOverdraftUsed: 0,
      accountsByCurrency: {} as Record<string, { count: number; totalBalance: number }>,
    },
  )

  return {
    totalAccounts: accounts.length,
    ...summary,
  }
}

export async function createAccount(account: Omit<Account, "id" | "created_at" | "updated_at">) {
  const { data, error } = await supabase.from("accounts").insert([account]).select().single()

  if (error) {
    console.error("Error creating account:", error)
    throw error
  }

  return data
}

export async function updateAccount(accountId: string, updates: Partial<Account>) {
  const { data, error } = await supabase.from("accounts").update(updates).eq("id", accountId).select().single()

  if (error) {
    console.error("Error updating account:", error)
    throw error
  }

  return data
}

export async function deleteAccount(accountId: string) {
  const { error } = await supabase.from("accounts").update({ is_active: false }).eq("id", accountId)

  if (error) {
    console.error("Error deleting account:", error)
    throw error
  }
}

// Banka adından banka ID'si bulma fonksiyonu
export async function getBankIdByName(bankName: string): Promise<string | null> {
  const { data, error } = await supabase.from("banks").select("id").ilike("name", `%${bankName}%`).single()

  if (error) {
    console.error("Error finding bank:", error)
    return null
  }

  return data?.id || null
}
