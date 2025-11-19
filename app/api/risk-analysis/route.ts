import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"
import type { FinancialProfile, RiskAnalysisData } from "@/lib/types"
import { createClient } from "@supabase/supabase-js"
import { GoogleGenerativeAI } from "@google/generative-ai"

const CHART_COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#F97316", "#84CC16"]

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "Kullanıcı ID gereklidir" }, { status: 400 })
    }


    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("id", userId)
      .single()

    if (profileError || !profile) {
      console.error("[v0] User verification failed:", profileError)
      return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 })
    }


    const { data: subscription } = await supabaseAdmin
      .from("subscriptions")
      .select("plan_type, status")
      .eq("user_id", userId)
      .maybeSingle()

    const isPremium = subscription?.plan_type === "premium" && subscription?.status === "active"


    if (!isPremium) {
      const { data: canUse, error: checkError } = await supabaseAdmin.rpc("can_use_feature", {
        p_user_id: userId,
        p_feature_type: "risk_analysis",
      })

      if (checkError) {
        console.error("[v0] Feature check error:", checkError)
      }

      if (!canUse) {
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
    }

    // FIXED: Use admin client instead of browser client to bypass RLS
    const { data: financialProfile, error: financialProfileError } = await supabaseAdmin
      .from("financial_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle()

    if (financialProfileError) {
      console.error("[v0] Financial profile fetch error:", financialProfileError)
      return NextResponse.json(
        {
          error: "Finansal profil alınırken bir hata oluştu.",
        },
        { status: 500 },
      )
    }

    if (!financialProfile) {
      return NextResponse.json(
        {
          error: "Finansal profil bulunamadı. Lütfen önce ayarlar sayfasından finansal bilgilerinizi girin.",
        },
        { status: 400 },
      )
    }

    // Validate that monthly_income is present
    if (
      financialProfile.monthly_income === null ||
      financialProfile.monthly_income === undefined ||
      financialProfile.monthly_income === 0
    ) {
      return NextResponse.json(
        {
          error:
            "Risk analizi için aylık gelir bilgisi gereklidir. Lütfen ayarlar sayfasından finansal bilgilerinizi güncelleyin.",
        },
        { status: 400 },
      )
    }

    const analysisData = await performComprehensiveRiskAnalysis(userId, financialProfile)

    if (!isPremium) {
      const { error: incrementError } = await supabaseAdmin.rpc("increment_usage", {
        p_user_id: userId,
        p_feature_type: "risk_analysis",
      })

      if (incrementError) {
        console.error("[v0] Usage increment error:", incrementError)
      }
    }

    return NextResponse.json(analysisData)
  } catch (error) {
    console.error("[v0] Risk analysis error:", error)
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
  // FIXED: Use admin client instead of browser client to bypass RLS
  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const { data: credits } = await supabaseAdmin
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

  // Use Gemini AI for intelligent risk analysis
  const geminiAnalysis = await analyzeRiskWithGemini(financialProfile, creditsArray)

  // Merge Gemini analysis with calculated data
  return mergeGeminiAnalysisWithData(geminiAnalysis, financialProfile, creditsArray)
}

async function analyzeRiskWithGemini(financialProfile: FinancialProfile, credits: any[]): Promise<any> {
  const model = genAI.getGenerativeModel({
    model: "gemini-3-pro-preview",
    generationConfig: {
      temperature: 0.3,
      topK: 10,
      topP: 0.8,
      maxOutputTokens: 8192,
    },
  })

  const profile = financialProfile as any // Cast to any to access all fields

  const prompt = `Sen bir profesyonel finansal danışmansın. Aşağıdaki finansal profil ve kredi bilgilerini analiz ederek KAPSAMLI bir risk değerlendirmesi yap.

FİNANSAL PROFİL:
- Aylık Gelir: ${profile.monthly_income || 0} TL
- Aylık Giderler: ${profile.monthly_expenses || 0} TL
- Toplam Varlıklar: ${profile.total_assets || 0} TL
- Toplam Yükümlülükler: ${profile.total_liabilities || 0} TL
- İstihdam Durumu: ${profile.employment_status || "Belirtilmemiş"}
- İstihdam Süresi: ${profile.employment_duration_months || 0} ay

KREDİLER (${credits.length} adet):
${credits.map((c, i) => `
${i + 1}. ${c.banks?.name || "Bilinmeyen Banka"}
   - Kredi Türü: ${c.credit_types?.name || "Bilinmeyen"}
   - Kalan Borç: ${c.remaining_debt || 0} TL
   - Aylık Ödeme: ${c.monthly_payment || 0} TL
   - Faiz Oranı: %${c.interest_rate || 0}
   - Durum: ${c.status}
   - Başlangıç Tutarı: ${c.initial_amount || 0} TL
`).join('\n')}

GÖREV: Aşağıdaki JSON formatında detaylı bir risk analizi oluştur. Her alanı dikkatlice değerlendir ve Türk finans sistemi standartlarına göre analiz yap.

\`\`\`json
{
  "overallRiskScore": "Düşük Risk" veya "Orta Risk" veya "Yüksek Risk",
  "overallRiskColor": "emerald" veya "yellow" veya "red",
  "numericScore": 0-100 arası sayı (0=mükemmel, 100=çok riskli),
  "detailedExplanation": "3-4 cümle detaylı açıklama",
  "overallRiskSummary": "Genel durum özeti (2-3 cümle)",
  "dtiPercentage": Borç/Gelir oranı yüzdesi (sayı),
  "dtiAssessment": "İyi" veya "Orta" veya "İyileştirilmeli" veya "Yüksek",
  "dtiExplanation": "DTI oranı hakkında açıklama",
  "disposableIncome": Harcanabilir gelir tutarı (sayı),
  "cashFlowAssessment": "Pozitif" veya "Negatif" veya "Dengede",
  "cashFlowExplanation": "Nakit akışı açıklaması",
  "cashFlowSuggestions": "Nakit akışı iyileştirme önerileri",
  "creditHealthSummary": "Kredi sağlığı özeti",
  "keyRiskFactors": [
    {
      "factor": "Risk faktörü adı",
      "impact": "Etkisi",
      "severity": "Düşük" veya "Orta" veya "Yüksek",
      "detailedExplanation": "Detaylı açıklama",
      "mitigationTips": ["İpucu 1", "İpucu 2", "İpucu 3"]
    }
  ],
  "positiveFactors": [
    {
      "factor": "Pozitif faktör adı",
      "benefit": "Faydası",
      "detailedExplanation": "Detaylı açıklama",
      "enhancementTips": ["İpucu 1", "İpucu 2"]
    }
  ],
  "recommendations": [
    {
      "recommendation": "Öneri başlığı",
      "priority": "Düşük" veya "Orta" veya "Yüksek",
      "details": "Öneri detayları",
      "actionSteps": ["Adım 1", "Adım 2", "Adım 3"],
      "potentialImpact": "Potansiyel etki açıklaması"
    }
  ],
  "futureOutlook": {
    "shortTerm": "Kısa vadeli görünüm",
    "longTerm": "Uzun vadeli görünüm",
    "potentialChallenges": ["Zorluk 1", "Zorluk 2"],
    "opportunities": ["Fırsat 1", "Fırsat 2"]
  }
}
\`\`\`

ÖNEMLİ:
- Sadece geçerli JSON döndür, başka hiçbir metin ekleme
- Türk Lirası ve Türkiye finans sistemi standartlarına göre değerlendir
- Borç/Gelir oranı için %30 altı ideal, %30-40 arası kabul edilebilir, %40 üstü yüksek risk
- Gerçekçi ve uygulanabilir öneriler sun
- Her kullanıcının durumuna özel değerlendirme yap`

  // Retry mechanism for 503 errors
  let result
  let retryCount = 0
  const maxRetries = 3

  while (retryCount < maxRetries) {
    try {
      result = await model.generateContent(prompt)
      break // Success, exit retry loop
    } catch (error: any) {
      retryCount++
      if (error.message?.includes("503") || error.message?.includes("overloaded")) {
        if (retryCount >= maxRetries) {
          throw new Error("Gemini servisi şu anda aşırı yüklü. Lütfen birkaç dakika sonra tekrar deneyin.")
        }
        // Exponential backoff: wait 2s, 4s, 8s
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000))
      } else {
        throw error // Re-throw non-503 errors immediately
      }
    }
  }

  if (!result) {
    throw new Error("Risk analizi tamamlanamadı. Lütfen tekrar deneyin.")
  }

  const response = await result.response
  const text = response.text()

  // Clean and parse JSON
  let cleanedText = text.trim()
  if (cleanedText.startsWith("```json")) {
    cleanedText = cleanedText.replace(/```json\n?/g, "").replace(/```\n?/g, "")
  } else if (cleanedText.startsWith("```")) {
    cleanedText = cleanedText.replace(/```\n?/g, "")
  }
  cleanedText = cleanedText.trim()

  try {
    const analysis = JSON.parse(cleanedText)
    return analysis
  } catch (error) {
    console.error("[Gemini] JSON parse error:", error)
    console.error("[Gemini] Raw response:", text)
    throw new Error("Gemini analiz sonucu işlenemedi")
  }
}

function mergeGeminiAnalysisWithData(
  geminiAnalysis: any,
  financialProfile: FinancialProfile,
  creditsArray: any[]
): RiskAnalysisData {
  const monthlyIncome = financialProfile.monthly_income || 0
  const monthlyExpenses = financialProfile.monthly_expenses || 0
  const totalAssets = financialProfile.total_assets || 0
  const totalLiabilities = financialProfile.total_liabilities || 0
  const netWorth = totalAssets - totalLiabilities

  const totalMonthlyDebtPayments = creditsArray.reduce((sum, credit) => {
    return sum + (credit.monthly_payment || 0)
  }, 0)

  const totalDebtAmount = creditsArray.reduce((sum, credit) => sum + (credit.remaining_debt || 0), 0)

  // Create debt breakdown for charts
  const bankDebtMap = new Map<string, { name: string; amount: number; logo?: string }>()

  creditsArray.forEach((credit) => {
    const bankName = credit.banks?.name || "Diğer Bankalar"
    const existing = bankDebtMap.get(bankName) || { name: bankName, amount: 0, logo: credit.banks?.logo_url }
    existing.amount += credit.remaining_debt || 0
    bankDebtMap.set(bankName, existing)
  })

  const debtBreakdown = Array.from(bankDebtMap.values())
    .filter((bank) => bank.amount > 0)
    .map((bank, index) => ({
      name: bank.name,
      amount: bank.amount,
      color: CHART_COLORS[index % CHART_COLORS.length],
      logo: bank.logo,
    }))

  // Build final analysis data using Gemini analysis
  const analysisData: RiskAnalysisData = {
    overallRiskScore: {
      value: geminiAnalysis.overallRiskScore || "Orta Risk",
      color: (geminiAnalysis.overallRiskColor as "emerald" | "yellow" | "red") || "yellow",
      numericScore: geminiAnalysis.numericScore || 50,
      scoreMax: 100,
      detailedExplanation: geminiAnalysis.detailedExplanation || "Risk analizi tamamlandı.",
    },
    overallRiskSummary:
      geminiAnalysis.overallRiskSummary ||
      `Toplam ${creditsArray.length} krediniz bulunuyor. Aylık ${totalMonthlyDebtPayments.toLocaleString("tr-TR")} TL kredi ödemesi yapıyorsunuz.`,
    debtToIncomeRatio: {
      value: `%${geminiAnalysis.dtiPercentage || 0}`,
      assessment: geminiAnalysis.dtiAssessment || "Orta",
      explanation: geminiAnalysis.dtiExplanation || "Borç/gelir oranı analizi",
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
      disposableIncome: geminiAnalysis.disposableIncome || 0,
      assessment: geminiAnalysis.cashFlowAssessment || "Dengede",
      explanation: geminiAnalysis.cashFlowExplanation || "Nakit akışı analizi",
      suggestions: geminiAnalysis.cashFlowSuggestions
        ? [geminiAnalysis.cashFlowSuggestions]
        : ["Nakit akışınızı düzenli takip edin"],
    },
    keyRiskFactors: geminiAnalysis.keyRiskFactors || [],
    positiveFactors: geminiAnalysis.positiveFactors || [],
    recommendations: geminiAnalysis.recommendations || [],
    savingsAnalysis: {
      assessment: geminiAnalysis.disposableIncome > monthlyIncome * 0.2 ? "Yeterli" : "İyileştirilmeli",
      emergencyFundStatus:
        geminiAnalysis.disposableIncome > 0
          ? `${Math.floor(geminiAnalysis.disposableIncome / monthlyExpenses)} aylık gider karşılığı`
          : "Tasarruf yapamıyor",
      emergencyFundTarget: "6 aylık gider hedeflenmeli",
      suggestions: "Düzenli tasarruf planı oluşturun",
    },
    creditHealthSummary:
      geminiAnalysis.creditHealthSummary ||
      `${creditsArray.length} adet krediniz var. Toplam borç tutarınız ${totalDebtAmount.toLocaleString("tr-TR")} TL.`,
    futureOutlook: geminiAnalysis.futureOutlook || {
      shortTerm: "Mevcut durumunuz sürdürülebilir görünüyor",
      longTerm: "Uzun vadede finansal planlama yapabilirsiniz",
      potentialChallenges: [],
      opportunities: ["Finansal planlamayı geliştirin"],
    },
    chartsData: {
      debtBreakdown: debtBreakdown.length > 0 ? debtBreakdown : undefined,
    },
  }

  return analysisData
}
