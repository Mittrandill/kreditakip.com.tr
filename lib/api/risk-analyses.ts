import { supabase } from "@/lib/supabase"
import type { FinancialProfile, Credit, RiskAnalysis } from "@/lib/types"

export async function saveRiskAnalysis(
  userId: string,
  analysisData: any,
  financialProfile: FinancialProfile,
  credits: Credit[],
): Promise<RiskAnalysis> {
  const { data, error } = await supabase
    .from("risk_analyses")
    .insert({
      user_id: userId,
      overall_risk_score: analysisData.overall_risk_score,
      overall_risk_color: analysisData.overall_risk_color,
      debt_to_income_ratio: analysisData.debt_to_income_ratio,
      monthly_income: financialProfile.monthly_income,
      total_debt_amount: analysisData.total_debt_amount,
      analysis_data: analysisData,
      financial_profile_snapshot: financialProfile,
      credits_snapshot: credits,
    })
    .select()
    .single()

  if (error) {
    console.error("Risk analizi kaydetme hatası:", error)
    throw new Error("Risk analizi kaydedilemedi")
  }

  return data
}

export async function getRiskAnalyses(userId: string): Promise<RiskAnalysis[]> {
  const { data, error } = await supabase
    .from("risk_analyses")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Risk analizleri getirme hatası:", error)
    throw new Error("Risk analizleri getirilemedi")
  }

  return data || []
}

export async function getRiskAnalysis(userId: string, analysisId: string): Promise<RiskAnalysis | null> {
  const { data, error } = await supabase
    .from("risk_analyses")
    .select("*")
    .eq("user_id", userId)
    .eq("id", analysisId)
    .single()

  if (error) {
    if (error.code === "PGRST116") {
      return null // Not found
    }
    console.error("Risk analizi getirme hatası:", error)
    throw new Error("Risk analizi getirilemedi")
  }

  return data
}

export async function deleteRiskAnalysis(userId: string, analysisId: string): Promise<void> {
  const { error } = await supabase.from("risk_analyses").delete().eq("user_id", userId).eq("id", analysisId)

  if (error) {
    console.error("Risk analizi silme hatası:", error)
    throw new Error("Risk analizi silinemedi")
  }
}
