"use server"

import { createClient } from "@/lib/supabase/server"
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

export async function getBankingCredentials(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("banking_credentials")
    .select("*, bank_name:banks(name), bank_logo_url:banks(logo_url)")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  if (error) throw error

  return data?.map((item: any) => ({
    ...item,
    bank_name: item.bank_name?.name,
    bank_logo_url: item.bank_logo_url?.logo_url,
  })) as BankingCredential[]
}

export async function getBankingCredential(userId: string, credentialId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("banking_credentials")
    .select("*, bank_name:banks(name), bank_logo_url:banks(logo_url)")
    .eq("user_id", userId)
    .eq("id", credentialId)
    .eq("is_active", true)
    .single()

  if (error) throw error

  return {
    ...data,
    bank_name: data.bank_name?.name,
    bank_logo_url: data.bank_logo_url?.logo_url,
  } as BankingCredential
}

export async function createBankingCredential(userId: string, input: BankingCredentialInput) {
  const supabase = await createClient()

  // Check if credential already exists for this bank and type
  const { data: existing } = await supabase
    .from("banking_credentials")
    .select("id, credential_name")
    .eq("user_id", userId)
    .eq("bank_id", input.bank_id)
    .eq("credential_type", input.credential_type)
    .eq("is_active", true)
    .single()

  if (existing) {
    throw new Error(
      `Bu banka için ${input.credential_type === "internet_banking" ? "İnternet Bankacılığı" : input.credential_type === "mobile_banking" ? "Mobil Bankacılık" : input.credential_type === "phone_banking" ? "Telefon Bankacılığı" : "Bu tip"} şifresi zaten kayıtlı: "${existing.credential_name}"`
    )
  }

  const encryptedPassword = input.password ? await encryptSensitiveData(input.password) : null

  const { data, error } = await supabase
    .from("banking_credentials")
    .insert({
      user_id: userId,
      bank_id: input.bank_id,
      credential_name: input.credential_name,
      username: input.username || null,
      encrypted_password: encryptedPassword,
      credential_type: input.credential_type,
      notes: input.notes || null,
      password_change_frequency_days: input.password_change_frequency_days || null,
      last_password_change_date: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    // Handle duplicate key error with user-friendly message
    if (error.code === "23505") {
      throw new Error(
        `Bu banka için ${input.credential_type === "internet_banking" ? "İnternet Bankacılığı" : input.credential_type === "mobile_banking" ? "Mobil Bankacılık" : input.credential_type === "phone_banking" ? "Telefon Bankacılığı" : "Bu tip"} şifresi zaten kayıtlı.`
      )
    }
    throw error
  }

  return data
}

export async function updateBankingCredential(
  userId: string,
  credentialId: string,
  input: Partial<BankingCredentialInput>
) {
  const supabase = await createClient()

  // If updating bank_id or credential_type, check for duplicates
  if (input.bank_id || input.credential_type) {
    const { data: current } = await supabase
      .from("banking_credentials")
      .select("bank_id, credential_type")
      .eq("id", credentialId)
      .eq("user_id", userId)
      .single()

    if (current) {
      const newBankId = input.bank_id || current.bank_id
      const newType = input.credential_type || current.credential_type

      const { data: existing } = await supabase
        .from("banking_credentials")
        .select("id")
        .eq("user_id", userId)
        .eq("bank_id", newBankId)
        .eq("credential_type", newType)
        .eq("is_active", true)
        .neq("id", credentialId)
        .single()

      if (existing) {
        throw new Error(
          `Bu banka için ${newType === "internet_banking" ? "İnternet Bankacılığı" : newType === "mobile_banking" ? "Mobil Bankacılık" : newType === "phone_banking" ? "Telefon Bankacılığı" : "Bu tip"} şifresi zaten kayıtlı.`
        )
      }
    }
  }

  const updateData: any = {
    ...input,
    updated_at: new Date().toISOString(),
  }

  if (input.password) {
    updateData.encrypted_password = await encryptSensitiveData(input.password)
    updateData.last_password_change_date = new Date().toISOString()
    delete updateData.password
  }

  const { data, error } = await supabase
    .from("banking_credentials")
    .update(updateData)
    .eq("user_id", userId)
    .eq("id", credentialId)
    .select()
    .single()

  if (error) {
    // Handle duplicate key error
    if (error.code === "23505") {
      throw new Error("Bu banka için bu tip şifre zaten kayıtlı.")
    }
    throw error
  }

  return data
}

export async function deleteBankingCredential(userId: string, credentialId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("banking_credentials")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("id", credentialId)

  if (error) throw error
}

export async function decryptCredentialPassword(userId: string, credentialId: string): Promise<string> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("banking_credentials")
    .select("encrypted_password")
    .eq("user_id", userId)
    .eq("id", credentialId)
    .eq("is_active", true)
    .single()

  if (error) throw error
  if (!data.encrypted_password) return ""

  return await decryptSensitiveData(data.encrypted_password)
}

export async function updateLastUsedDate(userId: string, credentialId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("banking_credentials")
    .update({
      last_used_date: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("id", credentialId)

  if (error) throw error
}
