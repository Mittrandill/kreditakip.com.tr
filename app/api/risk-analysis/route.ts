import { type NextRequest, NextResponse } from "next/server"
import type { FinancialProfile, RiskAnalysisData } from "@/lib/types"
import { getFinancialProfile } from "@/lib/api/financials"
import { supabase } from "@/lib/supabase"
import { createServerClient } from "@/lib/supabase/server"

const CHART_COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#F97316", "#84CC16"]

export async function POST(request: NextRequest) {
  try {
    const supabaseServer = await createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabaseServer.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 })
    }

    const { data: canUse, error: checkError } = await supabaseServer.rpc("can_use_feature", {
      p_user_id: user.id,
      p_feature_type: "risk_analysis",
    })

    if (checkError) {
      console.error("[v0] Feature check error:", checkError)
      return NextResponse.json({ error: "Özellik kontrolü başarısız oldu" }, { status: 500 })
    }

    if (!canUse) {
      const { data: subscription } = await supabaseServer
        .from("subscriptions")
        .select("plan_type")
        .eq("user_id", user.id)
        .eq("status", "active")
        .single()

      return NextResponse.json(
        {
          error: "Risk analizi sadece Premium üyeler için kullanılabilir",
          limitExceeded: true,
          planType: subscription?.plan_type || "free",
          upgradeMessage:
            "Premium üyelik ile risk analizi ve tüm özelliklere sınırsız erişim sağlayabilirsiniz. Sadece 199₺/ay!",
        },
        { status: 403 },
      )
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "Kullanıcı ID gereklidir" }, { status: 400 })
    }

    if (userId !== user.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
    }

    const financialProfile = await getFinancialProfile(userId)

    if (!financialProfile) {
      return NextResponse.json(
        {
          error: "Finansal profil bulunamadı. Lütfen önce ayarlar sayfasından finansal bilgilerinizi girin.",
        },
        { status: 400 },
      )
    }

    const analysisData = await performComprehensiveRiskAnalysis(userId, financialProfile)

    const { error: incrementError } = await supabaseServer.rpc("increment_usage", {
      p_user_id: user.id,
      p_feature_type: "risk_analysis",
    })

    if (incrementError) {
      console.error("[v0] Usage increment error:", incrementError)
    }

    return NextResponse.json(analysisData)
  } catch (error) {
    console.error("Risk analysis error:", error)
    return NextResponse.json(
      {
        error: "Risk analizi sırasında bir hata oluştu. Lütfen tekrar deneyin.",
      },
      { status: 500 },
    )
  }
}

async function performComprehensiveRiskAnalysis(
  userId: string,
  financialProfile: FinancialProfile,
): Promise<RiskAnalysisData> {
  const { data: credits } = await supabase
    .from("credits")
    .select(`
      *,
      banks (
        name,
        logo_url
      )
    `)
    .eq("user_id", userId)

  const creditsArray = credits || []

  const monthlyIncome = financialProfile.monthly_income || 0
  const monthlyExpenses = financialProfile.monthly_expenses || 0
  const emergencyFund = financialProfile.emergency_fund || 0
  const realEstateValue = financialProfile.real_estate_value || 0
  const vehicleValue = financialProfile.vehicle_value || 0
  const creditCardDebt = financialProfile.credit_card_debt || 0
  const otherDebts = financialProfile.other_debts || 0

  const totalAssets = realEstateValue + vehicleValue + emergencyFund
  const totalLiabilities =
    creditCardDebt + otherDebts + creditsArray.reduce((sum, credit) => sum + (credit.remaining_debt || 0), 0)
  const netWorth = totalAssets - totalLiabilities

  const totalMonthlyDebtPayments = creditsArray.reduce((sum, credit) => {
    return sum + (credit.monthly_payment || 0)
  }, 0)

  const creditUtilizationRatio = creditCardDebt > 0 ? 0.7 : 0

  const debtToIncomeRatio = monthlyIncome > 0 ? totalMonthlyDebtPayments / monthlyIncome : 0
  const dtiPercentage = Math.round(debtToIncomeRatio * 100)

  const totalDebtAmount =
    creditsArray.reduce((sum, credit) => sum + (credit.remaining_debt || 0), 0) + creditCardDebt + otherDebts

  let overallRiskScore: string
  let overallRiskColor: "emerald" | "yellow" | "red"
  let numericScore: number

  let riskFactors = 0
  if (dtiPercentage > 40) riskFactors += 30
  else if (dtiPercentage > 30) riskFactors += 15

  if (creditCardDebt > monthlyIncome * 2) riskFactors += 25
  else if (creditCardDebt > monthlyIncome) riskFactors += 15

  if (emergencyFund < monthlyExpenses * 3) riskFactors += 20
  if (netWorth < 0) riskFactors += 25

  numericScore = Math.min(riskFactors, 100)

  if (numericScore <= 30) {
    overallRiskScore = "Düşük Risk"
    overallRiskColor = "emerald"
  } else if (numericScore <= 60) {
    overallRiskScore = "Orta Risk"
    overallRiskColor = "yellow"
  } else {
    overallRiskScore = "Yüksek Risk"
    overallRiskColor = "red"
  }

  const disposableIncome = monthlyIncome - monthlyExpenses - totalMonthlyDebtPayments
  const cashFlowAssessment = disposableIncome > 0 ? "Pozitif" : disposableIncome < 0 ? "Negatif" : "Dengede"

  const keyRiskFactors = []
  if (dtiPercentage > 40) {
    keyRiskFactors.push({
      factor: "Yüksek Borç/Gelir Oranı",
      impact: "Finansal stres ve ödeme güçlüğü riski",
      severity: "Yüksek" as const,
      detailedExplanation: `%${dtiPercentage} borç/gelir oranınız ideal seviye olan %30'un üzerinde. Bu durum finansal esnekliğinizi kısıtlayabilir.`,
      mitigationTips: [
        "Mümkünse ek gelir kaynakları yaratın",
        "Gereksiz harcamaları azaltın",
        "Borç konsolidasyonu değerlendirin",
      ],
    })
  }

  if (creditCardDebt > monthlyIncome) {
    keyRiskFactors.push({
      factor: "Yüksek Kredi Kartı Borcu",
      impact: "Finansal yükü artırır ve kredi skorunu olumsuz etkiler",
      severity: "Orta" as const,
      detailedExplanation: `${creditCardDebt.toLocaleString("tr-TR")} TL kredi kartı borcunuz aylık gelirinizin üzerinde.`,
      mitigationTips: [
        "Kredi kartı borçlarınızı öncelikli olarak ödeyin",
        "Minimum ödeme yerine daha fazla ödeme yapın",
        "Borçları taksitlendirin",
      ],
    })
  }

  if (emergencyFund < monthlyExpenses * 3) {
    keyRiskFactors.push({
      factor: "Yetersiz Acil Durum Fonu",
      impact: "Beklenmedik durumlar karşısında savunmasızlık",
      severity: "Orta" as const,
      detailedExplanation: `${emergencyFund.toLocaleString("tr-TR")} TL acil durum fonunuz 3 aylık giderinizi karşılamıyor.`,
      mitigationTips: ["Aylık tasarruf planı oluşturun", "Otomatik transfer ayarlayın", "Gereksiz harcamaları azaltın"],
    })
  }

  const positiveFactors = []
  if (dtiPercentage <= 30) {
    positiveFactors.push({
      factor: "Sağlıklı Borç/Gelir Oranı",
      benefit: "Finansal esneklik ve güvenlik",
      detailedExplanation: `%${dtiPercentage} borç/gelir oranınız ideal seviyede. Bu durum finansal istikrarınızı gösteriyor.`,
      enhancementTips: [
        "Bu oranı korumaya devam edin",
        "Acil durum fonu oluşturun",
        "Yatırım fırsatlarını değerlendirin",
      ],
    })
  }

  if (netWorth > 0) {
    positiveFactors.push({
      factor: "Pozitif Net Varlık",
      benefit: "Finansal güvenlik ve büyüme potansiyeli",
      detailedExplanation: `${netWorth.toLocaleString("tr-TR")} TL net varlığınız finansal istikrarınızı gösteriyor.`,
      enhancementTips: [
        "Varlık portföyünüzü çeşitlendirin",
        "Yatırım araçlarını araştırın",
        "Emeklilik planlaması yapın",
      ],
    })
  }

  if (disposableIncome > monthlyIncome * 0.2) {
    positiveFactors.push({
      factor: "Yüksek Tasarruf Potansiyeli",
      benefit: "Güçlü finansal rezerv oluşturma kapasitesi",
      detailedExplanation: "Aylık gelirinizin %20'sinden fazlasını tasarruf edebiliyorsunuz.",
      enhancementTips: [
        "Otomatik tasarruf planı oluşturun",
        "Yatırım araçlarını araştırın",
        "Emeklilik planlaması yapın",
      ],
    })
  }

  const recommendations = []
  if (dtiPercentage > 40) {
    recommendations.push({
      recommendation: "Borç Konsolidasyonu Değerlendirin",
      priority: "Yüksek" as const,
      details:
        "Mevcut borçlarınızı daha düşük faizli tek bir kredide birleştirerek aylık ödeme yükünüzü azaltabilirsiniz.",
      actionSteps: [
        "Mevcut kredi faiz oranlarınızı listeleyin",
        "Bankaların konsolidasyon kredisi tekliflerini karşılaştırın",
        "Toplam maliyet analizini yapın",
      ],
      potentialImpact: "Aylık ödeme yükünde %10-30 azalma sağlayabilir",
    })
  }

  if (emergencyFund < monthlyExpenses * 3) {
    recommendations.push({
      recommendation: "Acil Durum Fonu Oluşturun",
      priority: "Yüksek" as const,
      details: "En az 3-6 aylık giderinizi karşılayacak bir acil durum fonu oluşturmanız kritik önemde.",
      actionSteps: [
        "Aylık giderlerinizi hesaplayın",
        "Hedef tutarı belirleyin (3-6 aylık gider)",
        "Otomatik transfer ile tasarruf başlatın",
      ],
      potentialImpact: "Beklenmedik durumlar karşısında finansal güvenlik",
    })
  }

  const bankDebtMap = new Map<string, { name: string; amount: number; logo?: string }>()

  creditsArray.forEach((credit) => {
    const bankName = credit.banks?.name || "Diğer Bankalar"
    const existing = bankDebtMap.get(bankName) || { name: bankName, amount: 0, logo: credit.banks?.logo_url }
    existing.amount += credit.remaining_debt || 0
    bankDebtMap.set(bankName, existing)
  })

  if (creditCardDebt > 0) {
    bankDebtMap.set("Kredi Kartı Borçları", {
      name: "Kredi Kartı Borçları",
      amount: creditCardDebt,
    })
  }

  const debtBreakdown = Array.from(bankDebtMap.values())
    .filter((bank) => bank.amount > 0)
    .map((bank, index) => ({
      name: bank.name,
      amount: bank.amount,
      color: CHART_COLORS[index % CHART_COLORS.length],
      logo: bank.logo,
    }))

  const analysisData: RiskAnalysisData = {
    overallRiskScore: {
      value: overallRiskScore,
      color: overallRiskColor,
      numericScore,
      scoreMax: 100,
      detailedExplanation: `Finansal durumunuz ${overallRiskScore.toLowerCase()} kategorisinde değerlendirildi. Bu değerlendirme borç/gelir oranınız (%${dtiPercentage}), kredi kartı borcunuz (${creditCardDebt.toLocaleString("tr-TR")} TL), acil durum fonunuz (${emergencyFund.toLocaleString("tr-TR")} TL) ve net varlığınız (${netWorth.toLocaleString("tr-TR")} TL) baz alınarak yapıldı.`,
    },
    overallRiskSummary: `Toplam ${creditsArray.length} krediniz bulunuyor. Aylık ${totalMonthlyDebtPayments.toLocaleString("tr-TR")} TL kredi ödemesi yapıyorsunuz. Toplam borcunuz ${totalDebtAmount.toLocaleString("tr-TR")} TL, net varlığınız ${netWorth >= 0 ? netWorth.toLocaleString("tr-TR") + " TL" : "negatif " + Math.abs(netWorth).toLocaleString("tr-TR") + " TL"}.`,
    debtToIncomeRatio: {
      value: `%${dtiPercentage}`,
      assessment:
        dtiPercentage <= 30 ? "İyi" : dtiPercentage <= 40 ? "Orta" : dtiPercentage <= 50 ? "İyileştirilmeli" : "Yüksek",
      explanation: `Borç/gelir oranınız %${dtiPercentage}. İdeal oran %30'un altındadır. Mevcut oranınız ${dtiPercentage <= 30 ? "sağlıklı bir seviyede" : dtiPercentage <= 50 ? "dikkat gerektiren bir seviyede" : "acil müdahale gerektiren bir seviyede"}.`,
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
      assessment: cashFlowAssessment,
      explanation: `Aylık geliriniz ${monthlyIncome.toLocaleString("tr-TR")} TL, giderleriniz ${monthlyExpenses.toLocaleString("tr-TR")} TL. Borç ödemeleriniz dahil edildiğinde ${cashFlowAssessment.toLowerCase()} nakit akışınız var.`,
      suggestions:
        disposableIncome < 0
          ? [
              "Acil olarak harcamalarınızı gözden geçirin",
              "Gereksiz abonelikleri iptal edin",
              "Ek gelir kaynakları arayın",
            ]
          : [
              "Mevcut pozitif durumunuzu koruyun",
              "Tasarruf planınızı güçlendirin",
              "Yatırım fırsatlarını değerlendirin",
            ],
    },
    keyRiskFactors,
    positiveFactors,
    recommendations,
    savingsAnalysis: {
      assessment:
        disposableIncome > monthlyIncome * 0.2 ? "Yeterli" : disposableIncome > 0 ? "İyileştirilmeli" : "Yetersiz",
      emergencyFundStatus:
        disposableIncome > 0
          ? `${Math.floor(disposableIncome / monthlyExpenses)} aylık gider karşılığı tasarruf potansiyeli`
          : "Tasarruf yapamıyor",
      emergencyFundTarget: "6 aylık gider hedeflenmeli",
      suggestions:
        disposableIncome > 0
          ? "Mevcut tasarruf potansiyelinizi değerlendirerek acil durum fonu oluşturun ve yatırım planları yapın."
          : "Öncelikle harcamalarınızı optimize ederek tasarruf yapabilir duruma gelmelisiniz.",
    },
    creditHealthSummary: `${creditsArray.length} adet krediniz var. Toplam borç tutarınız ${totalDebtAmount.toLocaleString("tr-TR")} TL. ${creditsArray.filter((c) => c.status === "overdue").length > 0 ? "Gecikmiş ödemeleriniz bulunuyor." : "Ödemeleriniz düzenli görünüyor."}`,
    futureOutlook: {
      shortTerm:
        dtiPercentage > 50
          ? "Kısa vadede borç yükünüzü azaltmaya odaklanmalısınız"
          : "Mevcut durumunuz kısa vadede sürdürülebilir görünüyor",
      longTerm:
        disposableIncome > 0
          ? "Uzun vadede tasarruf ve yatırım planları yapabilirsiniz"
          : "Uzun vadeli finansal hedefler için önce borç yükünü azaltmalısınız",
      potentialChallenges: [
        dtiPercentage > 40 ? "Yüksek borç yükü" : null,
        disposableIncome < 0 ? "Negatif nakit akışı" : null,
        creditsArray.some((c) => c.status === "overdue") ? "Gecikmiş ödemeler" : null,
      ].filter(Boolean) as string[],
      opportunities: [
        disposableIncome > 0 ? "Tasarruf potansiyeli" : null,
        dtiPercentage < 30 ? "Ek kredi kapasitesi" : null,
        "Refinansman fırsatları",
      ].filter(Boolean) as string[],
    },
    chartsData: {
      debtBreakdown: debtBreakdown.length > 0 ? debtBreakdown : undefined,
    },
  }

  return analysisData
}
