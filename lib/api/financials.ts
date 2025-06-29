import { supabase } from "@/lib/supabase"
import type { FinancialProfile } from "@/lib/types"

export async function getFinancialProfile(userId: string): Promise<FinancialProfile | null> {
  const { data, error } = await supabase.from("financial_profiles").select("*").eq("user_id", userId).single()

  if (error && error.code !== "PGRST116") {
    // PGRST116: single row not found, bu bir hata değil
    console.error("Finansal profil çekilirken hata:", error)
    throw error
  }
  return data
}

export async function upsertFinancialProfile(
  userId: string,
  profileData: Partial<Omit<FinancialProfile, "user_id" | "created_at" | "updated_at">>,
): Promise<FinancialProfile | null> {
  const { data, error } = await supabase
    .from("financial_profiles")
    .upsert({ user_id: userId, ...profileData }, { onConflict: "user_id" })
    .select()
    .single()

  if (error) {
    console.error("Finansal profil güncellenirken/eklenirken hata:", error)
    throw error
  }
  return data
}
