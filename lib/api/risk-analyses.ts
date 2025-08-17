import { supabase } from "@/lib/supabase"
import type { RiskAnalysis } from "@/lib/types"

export async function getRiskAnalyses(userId: string): Promise<RiskAnalysis[]> {
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

export async function getRiskAnalysis(userId: string, analysisId: string): Promise<RiskAnalysis | null> {
  try {
    const { data, error } = await supabase
      .from("risk_analyses")
      .select("*")
      .eq("user_id", userId)
      .eq("id", analysisId)
      .single()

    if (error) {
      console.error("Error fetching risk analysis:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Error in getRiskAnalysis:", error)
    throw error
  }
}

export async function saveRiskAnalysis(userId: string, analysisData: Partial<RiskAnalysis>): Promise<RiskAnalysis> {
  try {
    const { data, error } = await supabase
      .from("risk_analyses")
      .insert({
        user_id: userId,
        ...analysisData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error saving risk analysis:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Error in saveRiskAnalysis:", error)
    throw error
  }
}

export async function deleteRiskAnalysis(userId: string, analysisId: string): Promise<void> {
  try {
    const { error } = await supabase.from("risk_analyses").delete().eq("user_id", userId).eq("id", analysisId)

    if (error) {
      console.error("Error deleting risk analysis:", error)
      throw error
    }
  } catch (error) {
    console.error("Error in deleteRiskAnalysis:", error)
    throw error
  }
}

export async function updateRiskAnalysis(
  userId: string,
  analysisId: string,
  updates: Partial<RiskAnalysis>,
): Promise<RiskAnalysis> {
  try {
    const { data, error } = await supabase
      .from("risk_analyses")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("id", analysisId)
      .select()
      .single()

    if (error) {
      console.error("Error updating risk analysis:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Error in updateRiskAnalysis:", error)
    throw error
  }
}
