import { supabase } from "@/lib/supabase"
import type { FinancialProfile, Credit, RiskAnalysisData } from "@/lib/types"

export async function performComprehensiveRiskAnalysis(
  userId: string,
  financialProfile: FinancialProfile,
): Promise<RiskAnalysisData> {
  try {
    // Fetch user's actual credits
    const { data: credits, error: creditsError } = await supabase
      .from("credits")
      .select(`
        *,
        banks:bank_id (name, logo_url),
        credit_types:credit_type_id (name)
      `)
      .eq("user_id", userId)
      .eq("status", "active")

    if (creditsError) {
      console.error("Error fetching credits:", creditsError)
      throw creditsError
    }

    // Fetch user's credit cards
    const { data: creditCards, error: cardsError } = await supabase
      .from("credit_cards")
      .select(`
        *,
        banks:bank_id (name, logo_url)
      `)
      .eq("user_id", userId)
      .eq("is_active", true)

    if (cardsError) {
      console.error("Error fetching credit cards:", cardsError)
      throw cardsError
    }

    // Fetch user's accounts for asset calculation
    const { data: accounts, error: accountsError } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)

    if (accountsError) {
      console.error("Error fetching accounts:", accountsError)
      throw accountsError
    }

    return await generateDetailedRiskAnalysis(financialProfile, credits || [], creditCards || [], accounts || [])
  } catch (error) {
    console.error("Error in performComprehensiveRiskAnalysis:", error)
    throw error
  }
}

async function generateDetailedRiskAnalysis(
  financialProfile: any,
  credits: any[],
  creditCards: any[],
  accounts: any[],
): Promise<RiskAnalysisData> {
  // Enhanced financial calculations
  const monthlyIncome = financialProfile.monthly_income || 0
  const monthlyExpenses = financialProfile.monthly_expenses || 0
  const emergencyFund = financialProfile.emergency_fund || 0
  const investmentPortfolio = financialProfile.investment_portfolio || 0
  const realEstateValue = financialProfile.real_estate_value || 0
  const vehicleValue = financialProfile.vehicle_value || 0
  const creditCardDebt = financialProfile.credit_card_debt || 0
  const otherMonthlyObligations = financialProfile.other_monthly_obligations || 0

  // Calculate total assets
  const totalBankBalance = accounts.reduce((sum, account) => sum + (account.current_balance || 0), 0)
  const totalAssets = totalBankBalance + emergencyFund + investmentPortfolio + realEstateValue + vehicleValue

  // Calculate total monthly debt payments
  const totalCreditPayments = credits.reduce((sum, credit) => sum + (credit.monthly_payment || 0), 0)
  const totalCreditCardMinPayments = creditCards.reduce((sum, card) => {
    const minPayment = (card.current_debt || 0) * (card.minimum_payment_rate || 0.03)
    return sum + minPayment
  }, 0)
  const totalMonthlyDebtPayments = totalCreditPayments + totalCreditCardMinPayments + otherMonthlyObligations

  // Calculate debt-to-income ratio
  const debtToIncomeRatio = monthlyIncome > 0 ? totalMonthlyDebtPayments / monthlyIncome : 0
  const dtiPercentage = Math.round(debtToIncomeRatio * 100)

  // Calculate total debt amount
  const totalCreditDebt = credits.reduce((sum, credit) => sum + (credit.remaining_debt || 0), 0)
  const totalCreditCardDebt = creditCards.reduce((sum, card) => sum + (card.current_debt || 0), 0)
  const totalDebtAmount = totalCreditDebt + totalCreditCardDebt + creditCardDebt

  // Calculate credit utilization ratio
  const totalCreditLimit = creditCards.reduce((sum, card) => sum + (card.credit_limit || 0), 0)
  const creditUtilizationRatio = totalCreditLimit > 0 ? (totalCreditCardDebt / totalCreditLimit) * 100 : 0

  // Calculate net worth
  const netWorth = totalAssets - totalDebtAmount

  // Calculate disposable income
  const disposableIncome = monthlyIncome - monthlyExpenses - totalMonthlyDebtPayments

  // Enhanced risk scoring algorithm
  let riskScore = 0
  const riskFactors: string[] = []

  // DTI Risk (40% weight)
  if (dtiPercentage > 50) {
    riskScore += 40
    riskFactors.push("Çok yüksek borç/gelir oranı")
  } else if (dtiPercentage > 40) {
    riskScore += 30
    riskFactors.push("Yüksek borç/gelir oranı")
  } else if (dtiPercentage > 30) {
    riskScore += 15
  }

  // Credit Utilization Risk (25% weight)
  if (creditUtilizationRatio > 80) {
    riskScore += 25
    riskFactors.push("Çok yüksek kredi kartı kullanım oranı")
  } else if (creditUtilizationRatio > 50) {
    riskScore += 15
    riskFactors.push("Yüksek kredi kartı kullanım oranı")
  } else if (creditUtilizationRatio > 30) {
    riskScore += 8
  }

  // Cash Flow Risk (20% weight)
  if (disposableIncome < 0) {
    riskScore += 20
    riskFactors.push("Negatif nakit akışı")
  } else if (disposableIncome < monthlyIncome * 0.1) {
    riskScore += 10
    riskFactors.push("Düşük nakit akışı")
  }

  // Emergency Fund Risk (15% weight)
  const emergencyFundMonths = monthlyExpenses > 0 ? emergencyFund / monthlyExpenses : 0
  if (emergencyFundMonths < 1) {
    riskScore += 15
    riskFactors.push("Yetersiz acil durum fonu")
  } else if (emergencyFundMonths < 3) {
    riskScore += 8
  }

  // Determine overall risk level
  let overallRiskScore: string
  let overallRiskColor: "emerald" | "yellow" | "red"

  if (riskScore <= 25) {
    overallRiskScore = "Düşük Risk"
    overallRiskColor = "emerald"
  } else if (riskScore <= 60) {
    overallRiskScore = "Orta Risk"
    overallRiskColor = "yellow"
  } else {
    overallRiskScore = "Yüksek Risk"
    overallRiskColor = "red"
  }

  // Generate detailed analysis
  const analysisData: RiskAnalysisData = {
    overallRiskScore: {
      value: overallRiskScore,
      color: overallRiskColor,
      numericScore: riskScore,
      scoreMax: 100,
      detailedExplanation: `Finansal risk skorunuz ${riskScore}/100. Bu skor borç/gelir oranı (%${dtiPercentage}), kredi kartı kullanım oranı (%${Math.round(creditUtilizationRatio)}), nakit akışı ve acil durum fonu durumunuz baz alınarak hesaplandı.`,
    },
    overallRiskSummary: `${credits.length} kredi ve ${creditCards.length} kredi kartınız bulunuyor. Toplam aylık borç ödemeniz ${totalMonthlyDebtPayments.toLocaleString("tr-TR")} TL. Net varlığınız ${netWorth.toLocaleString("tr-TR")} TL.`,
    debtToIncomeRatio: {
      value: `%${dtiPercentage}`,
      assessment:
        dtiPercentage <= 30 ? "İyi" : dtiPercentage <= 40 ? "Orta" : dtiPercentage <= 50 ? "İyileştirilmeli" : "Yüksek",
      explanation: `Toplam aylık borç ödemeniz ${totalMonthlyDebtPayments.toLocaleString("tr-TR")} TL, aylık geliriniz ${monthlyIncome.toLocaleString("tr-TR")} TL. Borç/gelir oranınız %${dtiPercentage}.`,
      benchmark: {
        idealRange: "< %30",
        warningRange: "%30 - %40",
        criticalRange: "> %40",
      },
      incomeForDTI: monthlyIncome,
      debtPaymentsForDTI: totalMonthlyDebtPayments,
    },
    cashFlowAnalysis: {
      monthlyIncome,
      monthlyExpenses,
      disposableIncome,
      assessment: disposableIncome > 0 ? "Pozitif" : disposableIncome < 0 ? "Negatif" : "Dengede",
      explanation: `Aylık geliriniz ${monthlyIncome.toLocaleString("tr-TR")} TL, toplam gider ve borç ödemeleriniz ${(monthlyExpenses + totalMonthlyDebtPayments).toLocaleString("tr-TR")} TL. ${disposableIncome >= 0 ? "Pozitif" : "Negatif"} nakit akışınız ${Math.abs(disposableIncome).toLocaleString("tr-TR")} TL.`,
      suggestions:
        disposableIncome < 0
          ? ["Acil harcama planı yapın", "Gereksiz giderleri kesin", "Ek gelir kaynakları arayın"]
          : ["Tasarruf planı oluşturun", "Yatırım fırsatlarını değerlendirin", "Acil durum fonunu güçlendirin"],
    },
    assetLiabilityAnalysis: {
      totalAssets,
      totalLiabilities: totalDebtAmount,
      netWorth,
      assessment: netWorth > 0 ? (netWorth > monthlyIncome * 12 ? "Sağlıklı" : "İyileştirilmeli") : "Zayıf",
      explanation: `Toplam varlığınız ${totalAssets.toLocaleString("tr-TR")} TL, toplam borcunuz ${totalDebtAmount.toLocaleString("tr-TR")} TL. Net varlığınız ${netWorth.toLocaleString("tr-TR")} TL.`,
    },
    keyRiskFactors: riskFactors.map((factor) => ({
      factor,
      impact: "Finansal istikrarı tehdit ediyor",
      severity: riskScore > 60 ? "Yüksek" : riskScore > 30 ? "Orta" : "Düşük",
      detailedExplanation: `${factor} durumu finansal riskinizi artırıyor.`,
    })),
    positiveFactors: [
      ...(dtiPercentage <= 30
        ? [
            {
              factor: "Sağlıklı Borç/Gelir Oranı",
              benefit: "Finansal esneklik",
              detailedExplanation: "Borç yükünüz kontrol altında.",
            },
          ]
        : []),
      ...(disposableIncome > monthlyIncome * 0.2
        ? [
            {
              factor: "Yüksek Tasarruf Kapasitesi",
              benefit: "Güçlü finansal rezerv",
              detailedExplanation: "Aylık gelirinizin önemli bir kısmını tasarruf edebiliyorsunuz.",
            },
          ]
        : []),
    ],
    recommendations: [
      ...(dtiPercentage > 40
        ? [
            {
              recommendation: "Borç Konsolidasyonu",
              priority: "Yüksek" as const,
              details: "Yüksek faizli borçlarınızı tek kredide toplayarak faiz yükünüzü azaltın.",
              potentialImpact: "Aylık ödeme yükünde %15-25 azalma",
            },
          ]
        : []),
      ...(creditUtilizationRatio > 50
        ? [
            {
              recommendation: "Kredi Kartı Borcunu Azaltın",
              priority: "Yüksek" as const,
              details: "Kredi kartı kullanım oranınızı %30'un altına indirin.",
              potentialImpact: "Kredi skorunda iyileşme",
            },
          ]
        : []),
      ...(emergencyFundMonths < 3
        ? [
            {
              recommendation: "Acil Durum Fonu Oluşturun",
              priority: "Orta" as const,
              details: "En az 3-6 aylık giderinizi karşılayacak fon oluşturun.",
              potentialImpact: "Finansal güvenlik artışı",
            },
          ]
        : []),
    ],
    savingsAnalysis: {
      assessment: emergencyFundMonths >= 6 ? "Yeterli" : emergencyFundMonths >= 3 ? "İyileştirilmeli" : "Yetersiz",
      emergencyFundStatus: `${emergencyFundMonths.toFixed(1)} aylık gider karşılığı`,
      emergencyFundTarget: "6 aylık gider hedeflenmeli",
      suggestions:
        emergencyFundMonths < 3
          ? "Acil durum fonu oluşturmaya öncelik verin."
          : "Mevcut fonunuzu koruyun ve yatırım planları yapın.",
    },
    creditHealthSummary: `${credits.length} kredi, ${creditCards.length} kredi kartı. Toplam borç: ${totalDebtAmount.toLocaleString("tr-TR")} TL. Kredi kartı kullanım oranı: %${Math.round(creditUtilizationRatio)}.`,
    creditUtilization: {
      overallUtilizationRate: `%${Math.round(creditUtilizationRatio)}`,
      assessment: creditUtilizationRatio <= 30 ? "İyi" : creditUtilizationRatio <= 50 ? "Orta" : "Yüksek",
      explanation: `Toplam kredi limitinizin %${Math.round(creditUtilizationRatio)}'ini kullanıyorsunuz. İdeal oran %30'un altındadır.`,
    },
    futureOutlook: {
      shortTerm: riskScore > 60 ? "Acil finansal düzenleme gerekli" : "Mevcut durum sürdürülebilir",
      longTerm: netWorth > 0 ? "Uzun vadeli büyüme potansiyeli var" : "Varlık birikimi odaklı plan gerekli",
      potentialChallenges: riskFactors,
      opportunities: [
        ...(disposableIncome > 0 ? ["Tasarruf ve yatırım fırsatları"] : []),
        ...(dtiPercentage < 40 ? ["Ek kredi kapasitesi"] : []),
      ],
    },
    chartsData: {
      debtBreakdown: [
        ...credits.map((credit) => ({
          name: credit.banks?.name || "Bilinmeyen Banka",
          amount: credit.remaining_debt || 0,
          color: "#3b82f6",
        })),
        ...creditCards.map((card) => ({
          name: `${card.banks?.name || "Bilinmeyen"} Kredi Kartı`,
          amount: card.current_debt || 0,
          color: "#ef4444",
        })),
      ],
    },
  }

  return analysisData
}

export async function saveRiskAnalysis(
  userId: string,
  analysisData: RiskAnalysisData,
  financialProfile: FinancialProfile,
  credits: Credit[],
) {
  try {
    const { data, error } = await supabase
      .from("risk_analyses")
      .insert({
        user_id: userId,
        analysis_data: analysisData,
        overall_risk_score: analysisData.overallRiskScore.value,
        overall_risk_color: analysisData.overallRiskScore.color,
        debt_to_income_ratio: analysisData.debtToIncomeRatio.value,
        monthly_income: analysisData.cashFlowAnalysis?.monthlyIncome || null,
        monthly_expenses: analysisData.cashFlowAnalysis?.monthlyExpenses || null,
        total_assets: financialProfile.total_assets || null,
        total_credits_count: credits.length,
        total_debt_amount: credits.reduce((sum, credit) => sum + (credit.remaining_debt || 0), 0),
      })
      .select()

    if (error) {
      console.error("Error saving risk analysis:", error)
      throw error
    }

    if (!data || data.length === 0) {
      throw new Error("No data returned from insert operation")
    }

    return data[0]
  } catch (error) {
    console.error("Error in saveRiskAnalysis:", error)
    throw error
  }
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
      .limit(1)

    if (error) {
      console.error("Error fetching risk analysis:", error)
      throw error
    }

    return data && data.length > 0 ? data[0] : null
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
