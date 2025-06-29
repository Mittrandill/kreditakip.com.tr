import { supabase } from "@/lib/supabase"
import type { FinancialProfile, Credit } from "@/lib/types"

export interface RefinancingAnalysis {
  id: string
  user_id: string
  analysis_data: any
  total_potential_savings: number | null
  refinancing_potential: string | null
  urgency_level: string | null
  recommended_strategy: string | null
  credits_analyzed: number | null
  market_rates: any | null
  created_at: string
  updated_at: string
}

export async function saveRefinancingAnalysis(
  userId: string,
  analysisData: any,
  financialProfile: FinancialProfile,
  credits: Credit[],
) {
  const { data, error } = await supabase
    .from("refinancing_analyses")
    .insert({
      user_id: userId,
      analysis_data: analysisData,
      total_potential_savings: analysisData.overallAssessment?.totalPotentialSavings || 0,
      refinancing_potential: analysisData.overallAssessment?.refinancingPotential || null,
      urgency_level: analysisData.overallAssessment?.urgencyLevel || null,
      recommended_strategy: analysisData.overallAssessment?.recommendedStrategy || null,
      credits_analyzed: credits.length,
      market_rates: {
        personalLoan: 2.8,
        mortgageLoan: 1.9,
        vehicleLoan: 2.2,
        businessLoan: 3.1,
        analysisDate: new Date().toISOString(),
      },
    })
    .select()
    .single()

  if (error) {
    console.error("Error saving refinancing analysis:", error)
    throw error
  }

  return data
}

export async function getRefinancingAnalyses(userId: string) {
  const { data, error } = await supabase
    .from("refinancing_analyses")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching refinancing analyses:", error)
    throw error
  }

  return data || []
}

export async function getRefinancingAnalysisById(userId: string, analysisId: string) {
  const { data, error } = await supabase
    .from("refinancing_analyses")
    .select("*")
    .eq("user_id", userId)
    .eq("id", analysisId)
    .single()

  if (error) {
    console.error("Error fetching refinancing analysis:", error)
    throw error
  }

  return data
}

export async function deleteRefinancingAnalysis(userId: string, analysisId: string) {
  const { data, error } = await supabase
    .from("refinancing_analyses")
    .delete()
    .eq("user_id", userId)
    .eq("id", analysisId)
    .select()
    .single()

  if (error) {
    console.error("Error deleting refinancing analysis:", error)
    throw error
  }

  return data
}
