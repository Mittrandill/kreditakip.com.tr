import { supabase } from "@/lib/supabase"
import { encryptSensitiveData, decryptSensitiveData } from "@/lib/utils/encryption"

export interface BankingCredential {
  id: string
  user_id: string
  bank_id: string
  credential_name: string
  username: string | null
  encrypted_password: string | null
  credential_type: "internet_banking" | "mobile_banking" | "phone_banking" | "other"
  notes: string | null
  last_used_date: string | null
  password_change_frequency_days: number | null
  last_password_change_date: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  // Join fields
  bank_name?: string
  bank_logo_url?: string | null
}

export interface BankingCredentialInput {
  bank_id: string
  credential_name: string
  username?: string
  password?: string
  credential_type: "internet_banking" | "mobile_banking" | "phone_banking" | "other"
  notes?: string
  password_change_frequency_days?: number
}

export async function getBankingCredentials(
  userId: string,
  page = 1,
  limit = 10,
): Promise<{ data: BankingCredential[]; total: number }> {
  const offset = (page - 1) * limit

  // Toplam sayıyı al
  const { count, error: countError } = await supabase
    .from("banking_credentials")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_active", true)

  if (countError) {
    console.error("Banking credentials count error:", countError)
    throw countError
  }

  // Verileri al
  const { data, error } = await supabase
    .from("banking_credentials")
    .select(`
      *,
      banks (
        name,
        logo_url
      )
    `)
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error("Banking credentials fetch error:", error)
    throw error
  }

  const mappedData = data.map((item) => ({
    ...item,
    bank_name: item.banks?.name,
    bank_logo_url: item.banks?.logo_url,
    banks: undefined, // Remove the nested object
  }))

  return {
    data: mappedData,
    total: count || 0,
  }
}

export async function getBankingCredential(userId: string, credentialId: string): Promise<BankingCredential | null> {
  const { data, error } = await supabase
    .from("banking_credentials")
    .select(`
      *,
      banks (
        name,
        logo_url
      )
    `)
    .eq("user_id", userId)
    .eq("id", credentialId)
    .single()

  if (error) {
    if (error.code === "PGRST116") return null
    console.error("Banking credential fetch error:", error)
    throw error
  }

  return {
    ...data,
    bank_name: data.banks?.name,
    bank_logo_url: data.banks?.logo_url,
    banks: undefined,
  }
}

export async function createBankingCredential(
  userId: string,
  credentialData: BankingCredentialInput,
): Promise<BankingCredential> {
  // Şifreyi şifrele
  const encryptedPassword = credentialData.password ? encryptSensitiveData(credentialData.password) : null

  const { data, error } = await supabase
    .from("banking_credentials")
    .insert({
      user_id: userId,
      bank_id: credentialData.bank_id,
      credential_name: credentialData.credential_name,
      username: credentialData.username || null,
      encrypted_password: encryptedPassword,
      credential_type: credentialData.credential_type,
      notes: credentialData.notes || null,
      password_change_frequency_days: credentialData.password_change_frequency_days || null,
      last_password_change_date: credentialData.password ? new Date().toISOString() : null,
    })
    .select(`
      *,
      banks (
        name,
        logo_url
      )
    `)
    .single()

  if (error) {
    console.error("Banking credential creation error:", error)
    throw error
  }

  return {
    ...data,
    bank_name: data.banks?.name,
    bank_logo_url: data.banks?.logo_url,
    banks: undefined,
  }
}

export async function updateBankingCredential(
  userId: string,
  credentialId: string,
  credentialData: Partial<BankingCredentialInput>,
): Promise<BankingCredential> {
  const updateData: any = {
    updated_at: new Date().toISOString(),
  }

  if (credentialData.credential_name) updateData.credential_name = credentialData.credential_name
  if (credentialData.username !== undefined) updateData.username = credentialData.username || null
  if (credentialData.credential_type) updateData.credential_type = credentialData.credential_type
  if (credentialData.notes !== undefined) updateData.notes = credentialData.notes || null
  if (credentialData.bank_id) updateData.bank_id = credentialData.bank_id
  if (credentialData.password_change_frequency_days !== undefined) {
    updateData.password_change_frequency_days = credentialData.password_change_frequency_days || null
  }

  // Şifre güncelleniyorsa şifrele ve son değiştirme tarihini güncelle
  if (credentialData.password !== undefined) {
    updateData.encrypted_password = credentialData.password ? encryptSensitiveData(credentialData.password) : null
    if (credentialData.password) {
      updateData.last_password_change_date = new Date().toISOString()
    }
  }

  const { data, error } = await supabase
    .from("banking_credentials")
    .update(updateData)
    .eq("user_id", userId)
    .eq("id", credentialId)
    .select(`
      *,
      banks (
        name,
        logo_url
      )
    `)
    .single()

  if (error) {
    console.error("Banking credential update error:", error)
    throw error
  }

  return {
    ...data,
    bank_name: data.banks?.name,
    bank_logo_url: data.banks?.logo_url,
    banks: undefined,
  }
}

export async function deleteBankingCredential(userId: string, credentialId: string): Promise<void> {
  const { error } = await supabase.from("banking_credentials").delete().eq("user_id", userId).eq("id", credentialId)

  if (error) {
    console.error("Banking credential deletion error:", error)
    throw error
  }
}

export async function updateLastUsedDate(userId: string, credentialId: string): Promise<void> {
  const { error } = await supabase
    .from("banking_credentials")
    .update({
      last_used_date: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("id", credentialId)

  if (error) {
    console.error("Last used date update error:", error)
    throw error
  }
}

export function decryptPassword(encryptedPassword: string | null): string | null {
  if (!encryptedPassword) return null

  try {
    return decryptSensitiveData(encryptedPassword)
  } catch (error) {
    console.error("Password decryption error:", error)
    return null
  }
}

export function maskPassword(password: string | null): string {
  if (!password) return ""
  return "•".repeat(Math.min(password.length, 12))
}

export async function getBankingCredentialsStats(userId: string) {
  const { data, error } = await supabase
    .from("banking_credentials")
    .select("credential_type, last_used_date, last_password_change_date, password_change_frequency_days")
    .eq("user_id", userId)
    .eq("is_active", true)

  if (error) {
    console.error("Banking credentials stats error:", error)
    throw error
  }

  const total = data.length
  const internetBanking = data.filter((c) => c.credential_type === "internet_banking").length
  const mobileBanking = data.filter((c) => c.credential_type === "mobile_banking").length
  const used = data.filter((c) => c.last_used_date).length

  // Şifre değiştirme uyarısı gereken şifreler
  const now = new Date()
  const needsPasswordChange = data.filter((c) => {
    if (!c.password_change_frequency_days || !c.last_password_change_date) return false
    const lastChange = new Date(c.last_password_change_date)
    const daysSinceChange = Math.floor((now.getTime() - lastChange.getTime()) / (1000 * 60 * 60 * 24))
    return daysSinceChange >= c.password_change_frequency_days
  }).length

  return {
    total,
    internetBanking,
    mobileBanking,
    used,
    needsPasswordChange,
  }
}
