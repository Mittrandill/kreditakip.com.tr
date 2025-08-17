import { supabase } from "@/lib/supabase"
import type { FinancialProfile, Credit } from "@/lib/types"

export async function saveRiskAnalysis(
  userId: string,
  analysisData: any,
  financialProfile: FinancialProfile,
  credits: Credit[],
) {
  // Process the credits data here
  // Example: Save credits data to the database
  // await saveCreditsToDatabase(userId, credits);
  // Further processing logic can be added here
}

export async function getRiskAnalyses(userId: string) {
  try {
    const { data, error } = await supabase
      .from("risk_analyses")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching risk analyses:", error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error("Error in getRiskAnalyses:", error)
    throw error
  }
}

export async function getRiskAnalysisById(analysisId: string, userId: string) {
  try {
    const { data, error } = await supabase
      .from("risk_analyses")
      .select("*")
      .eq("id", analysisId)
      .eq("user_id", userId)
      .single()

    if (error) {
      console.error("Error fetching risk analysis:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Error in getRiskAnalysisById:", error)
    throw error
  }
}

export async function deleteRiskAnalysis(analysisId: string, userId: string) {
  try {
    const { error } = await supabase.from("risk_analyses").delete().eq("id", analysisId).eq("user_id", userId)

    if (error) {
      console.error("Error deleting risk analysis:", error)
      throw error
    }

    return { success: true }
  } catch (error) {
    console.error("Error in deleteRiskAnalysis:", error)
    throw error
  }
}
