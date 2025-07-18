import { supabase } from "@/lib/supabase"
import type { RiskAnalysis, RiskAnalysisData, FinancialProfile, Credit, Account, CreditCard } from "@/lib/types"

export async function saveRiskAnalysis(
  userId: string,
  analysisData: RiskAnalysisData,
  financialProfile: FinancialProfile,
  credits: Credit[],
  accounts: Account[] = [],
  creditCards: CreditCard[] = [],
): Promise<RiskAnalysis> {
  // Toplam borç miktarını hesapla (krediler + kredi kartları + kredili mevduat)
  const totalDebtFromCredits = credits.reduce((sum, credit) => sum + credit.remaining_debt, 0)
  const totalCreditCardDebt = creditCards.reduce((sum, card) => sum + (card.current_debt || 0), 0)
  const totalOverdraftUsed = accounts.reduce((sum, account) => {
    return sum + (account.current_balance < 0 ? Math.abs(account.current_balance) : 0)
  }, 0)
  const totalDebtAmount = totalDebtFromCredits + totalCreditCardDebt + totalOverdraftUsed

  // Toplam hesap bakiyesi
  const totalAccountBalance = accounts.reduce((sum, account) => sum + (account.current_balance || 0), 0)

  const { data, error } = await supabase
    .from("risk_analyses")
    .insert({
      user_id: userId,
      analysis_data: analysisData,
      overall_risk_score: analysisData.overallRiskScore.value,
      overall_risk_color: analysisData.overallRiskScore.color,
      debt_to_income_ratio: analysisData.debtToIncomeRatio.value,
      monthly_income: financialProfile.monthly_income,
      monthly_expenses: financialProfile.monthly_expenses,
      total_assets: (financialProfile.total_assets || 0) + totalAccountBalance,
      total_credits_count: credits.length,
      total_debt_amount: totalDebtAmount,
      // Yeni alanlar ekleyebiliriz
      total_accounts_count: accounts.length,
      total_credit_cards_count: creditCards.length,
      total_account_balance: totalAccountBalance,
      credit_card_utilization_rate: analysisData.creditUtilization?.overallUtilizationRate || null,
    })
    .select()
    .single()

  if (error) {
    console.error("Risk analizi kaydedilirken hata:", error)
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
    console.error("Risk analizleri getirilirken hata:", error)
    throw new Error("Risk analizleri getirilemedi")
  }

  return data || []
}

export async function getRiskAnalysisById(userId: string, analysisId: string): Promise<RiskAnalysis | null> {
  const { data, error } = await supabase
    .from("risk_analyses")
    .select("*")
    .eq("user_id", userId)
    .eq("id", analysisId)
    .single()

  if (error) {
    if (error.code === "PGRST116") {
      return null // Kayıt bulunamadı
    }
    console.error("Risk analizi getirilirken hata:", error)
    throw new Error("Risk analizi getirilemedi")
  }

  return data
}

export async function deleteRiskAnalysis(userId: string, analysisId: string): Promise<void> {
  const { error } = await supabase.from("risk_analyses").delete().eq("user_id", userId).eq("id", analysisId)

  if (error) {
    console.error("Risk analizi silinirken hata:", error)
    throw new Error("Risk analizi silinemedi")
  }
}
