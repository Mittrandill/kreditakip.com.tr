import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"
import type { FinancialProfile, RiskAnalysisData } from "@/lib/types"
import { createClient } from "@supabase/supabase-js"
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai"
import { rateLimit, RateLimits } from "@/lib/rate-limit"

const CHART_COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#F97316", "#84CC16"]

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

// Gemini Structured Output Schema - JSON parse hatalarını önler
const riskAnalysisSchema = {
  description: "Kapsamlı Finansal Risk Analizi Raporu",
  type: SchemaType.OBJECT as const,
  properties: {
    overallRiskScore: {
      type: SchemaType.STRING as const,
      format: "enum" as const,
      description: "Genel risk durumu (Düşük Risk, Orta Risk, Yüksek Risk)",
      enum: ["Düşük Risk", "Orta Risk", "Yüksek Risk"] as string[]
    },
    overallRiskColor: {
      type: SchemaType.STRING as const,
      format: "enum" as const,
      description: "Risk rengi (emerald, yellow, red)",
      enum: ["emerald", "yellow", "red"] as string[]
    },
    numericScore: { type: SchemaType.NUMBER as const, description: "0-100 arası risk puanı (0 en iyi, 100 en riskli)" },
    detailedExplanation: { type: SchemaType.STRING as const, description: "Risk durumunun detaylı açıklaması" },
    overallRiskSummary: { type: SchemaType.STRING as const, description: "Yönetici özeti (2-3 cümle)" },
    dtiPercentage: { type: SchemaType.NUMBER as const, description: "Borç/Gelir oranı yüzdesi (Örn: 35.5)" },
    dtiAssessment: { type: SchemaType.STRING as const, description: "DTI değerlendirmesi (İyi, Makul, Kritik)" },
    dtiExplanation: { type: SchemaType.STRING as const, description: "DTI durumunun açıklaması" },
    disposableIncome: { type: SchemaType.NUMBER as const, description: "Harcanabilir gelir tutarı" },
    cashFlowAssessment: { type: SchemaType.STRING as const, description: "Nakit akışı durumu (Pozitif/Negatif)" },
    cashFlowExplanation: { type: SchemaType.STRING as const },
    cashFlowSuggestions: { type: SchemaType.STRING as const, description: "Nakit akışı için ana öneri" },
    creditHealthSummary: { type: SchemaType.STRING as const },
    keyRiskFactors: {
      type: SchemaType.ARRAY as const,
      description: "Tespit edilen risk faktörleri",
      items: {
        type: SchemaType.OBJECT as const,
        properties: {
          factor: { type: SchemaType.STRING as const },
          impact: { type: SchemaType.STRING as const },
          severity: { type: SchemaType.STRING as const, format: "enum" as const, enum: ["Düşük", "Orta", "Yüksek"] as string[] },
          detailedExplanation: { type: SchemaType.STRING as const },
          mitigationTips: { type: SchemaType.ARRAY as const, items: { type: SchemaType.STRING as const } }
        },
        required: ["factor", "severity", "mitigationTips"]
      }
    },
    positiveFactors: {
      type: SchemaType.ARRAY as const,
      description: "Tespit edilen olumlu faktörler",
      items: {
        type: SchemaType.OBJECT as const,
        properties: {
          factor: { type: SchemaType.STRING as const },
          benefit: { type: SchemaType.STRING as const },
          detailedExplanation: { type: SchemaType.STRING as const },
          enhancementTips: { type: SchemaType.ARRAY as const, items: { type: SchemaType.STRING as const } }
        }
      }
    },
    recommendations: {
      type: SchemaType.ARRAY as const,
      description: "Aksiyon önerileri",
      items: {
        type: SchemaType.OBJECT as const,
        properties: {
          recommendation: { type: SchemaType.STRING as const },
          priority: { type: SchemaType.STRING as const, format: "enum" as const, enum: ["Düşük", "Orta", "Yüksek"] as string[] },
          details: { type: SchemaType.STRING as const },
          actionSteps: { type: SchemaType.ARRAY as const, items: { type: SchemaType.STRING as const } },
          potentialImpact: { type: SchemaType.STRING as const }
        },
        required: ["recommendation", "priority", "actionSteps"]
      }
    },
    futureOutlook: {
      type: SchemaType.OBJECT as const,
      properties: {
        shortTerm: { type: SchemaType.STRING as const },
        longTerm: { type: SchemaType.STRING as const },
        potentialChallenges: { type: SchemaType.ARRAY as const, items: { type: SchemaType.STRING as const } },
        opportunities: { type: SchemaType.ARRAY as const, items: { type: SchemaType.STRING as const } }
      }
    }
  },
  required: ["overallRiskScore", "numericScore", "dtiPercentage", "recommendations", "keyRiskFactors"]
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "Kullanıcı ID gereklidir" }, { status: 400 })
    }

    // Rate limiting - AI analysis is expensive!
    const rateLimitResult = rateLimit({
      identifier: `risk-analysis:${userId}`,
      ...RateLimits.EXPENSIVE
    })

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: "Çok fazla risk analizi talebi. Lütfen 1 saat sonra tekrar deneyin.",
          retryAfter: rateLimitResult.reset
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
            'Retry-After': rateLimitResult.reset.toString()
          }
        }
      )
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
              "Premium üyelik ile AI Finansal Sağlık Özeti ve tüm özelliklere sınırsız erişim sağlayabilirsiniz. Sadece 199₺/ay!",
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

    let analysisData
    try {
      analysisData = await performComprehensiveRiskAnalysis(userId, financialProfile)
    } catch (analysisError: any) {
      console.error("[v0] Risk analysis failed, using emergency fallback:", analysisError)

      // Emergency fallback: create basic analysis without Gemini
      const { data: credits } = await supabaseAdmin
        .from("credits")
        .select("monthly_payment, remaining_debt")
        .eq("user_id", userId)

      const creditsArray = credits || []
      const fallbackAnalysis = createFallbackAnalysis(financialProfile, creditsArray)

      // Convert to full analysis data structure
      const monthlyIncome = financialProfile.monthly_income || 0
      const monthlyExpenses = financialProfile.monthly_expenses || 0
      const totalMonthlyDebtPayments = creditsArray.reduce((sum: number, credit: any) => sum + (credit.monthly_payment || 0), 0)

      analysisData = {
        overallRiskScore: {
          value: fallbackAnalysis.overallRiskScore,
          color: fallbackAnalysis.overallRiskColor,
          numericScore: fallbackAnalysis.numericScore,
          scoreMax: 100,
          detailedExplanation: fallbackAnalysis.detailedExplanation,
        },
        overallRiskSummary: fallbackAnalysis.overallRiskSummary,
        debtToIncomeRatio: {
          value: `%${fallbackAnalysis.dtiPercentage}`,
          assessment: fallbackAnalysis.dtiAssessment,
          explanation: fallbackAnalysis.dtiExplanation,
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
          disposableIncome: fallbackAnalysis.disposableIncome,
          assessment: fallbackAnalysis.cashFlowAssessment,
          explanation: fallbackAnalysis.cashFlowExplanation,
          suggestions: [fallbackAnalysis.cashFlowSuggestions],
        },
        keyRiskFactors: fallbackAnalysis.keyRiskFactors,
        positiveFactors: fallbackAnalysis.positiveFactors,
        recommendations: fallbackAnalysis.recommendations,
        savingsAnalysis: {
          assessment: "İyileştirilmeli",
          emergencyFundStatus: "Bilinmiyor",
          emergencyFundTarget: "6 aylık gider hedeflenmeli",
          suggestions: "Düzenli tasarruf planı oluşturun",
        },
        creditHealthSummary: fallbackAnalysis.creditHealthSummary,
        futureOutlook: fallbackAnalysis.futureOutlook,
        chartsData: {},
      }
    }

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
    console.error("[v0] Risk analysis critical error:", error)
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
  let geminiAnalysis
  try {
    geminiAnalysis = await analyzeRiskWithGemini(financialProfile, creditsArray)
  } catch (error: any) {
    console.error("[Risk Analysis] Gemini analysis failed:", error)
    // Create fallback analysis with basic calculations
    geminiAnalysis = createFallbackAnalysis(financialProfile, creditsArray)
  }

  // Merge Gemini analysis with calculated data
  return mergeGeminiAnalysisWithData(geminiAnalysis, financialProfile, creditsArray)
}

// Create fallback analysis when Gemini fails
function createFallbackAnalysis(financialProfile: FinancialProfile, credits: any[]): any {
  const monthlyIncome = financialProfile.monthly_income || 0
  const monthlyExpenses = financialProfile.monthly_expenses || 0
  const totalMonthlyDebtPayments = credits.reduce((sum, credit) => sum + (credit.monthly_payment || 0), 0)

  const dtiPercentage = monthlyIncome > 0 ? (totalMonthlyDebtPayments / monthlyIncome) * 100 : 0
  const disposableIncome = monthlyIncome - monthlyExpenses - totalMonthlyDebtPayments

  let dtiAssessment = "İyi"
  let overallRiskScore = "Düşük Risk"
  let overallRiskColor = "emerald"
  let numericScore = 30

  if (dtiPercentage > 40) {
    dtiAssessment = "Yüksek"
    overallRiskScore = "Yüksek Risk"
    overallRiskColor = "red"
    numericScore = 75
  } else if (dtiPercentage > 30) {
    dtiAssessment = "İyileştirilmeli"
    overallRiskScore = "Orta Risk"
    overallRiskColor = "yellow"
    numericScore = 50
  }

  return {
    overallRiskScore,
    overallRiskColor,
    numericScore,
    detailedExplanation: `Mevcut finansal durumunuz ${overallRiskScore.toLowerCase()} düzeyinde. Borç/gelir oranınız %${dtiPercentage.toFixed(1)} seviyesinde.`,
    overallRiskSummary: `${credits.length} adet krediniz bulunuyor. Aylık toplam ${totalMonthlyDebtPayments.toLocaleString("tr-TR")} TL kredi ödemesi yapıyorsunuz.`,
    dtiPercentage: parseFloat(dtiPercentage.toFixed(1)),
    dtiAssessment,
    dtiExplanation: `Borç/gelir oranınız %${dtiPercentage.toFixed(1)} seviyesinde. ${dtiAssessment === "İyi" ? "İdeal seviyedesiniz." : "İyileştirme gerekiyor."}`,
    disposableIncome,
    cashFlowAssessment: disposableIncome > 0 ? "Pozitif" : "Negatif",
    cashFlowExplanation: disposableIncome > 0 ? "Gelirleriniz giderlerinizi karşılıyor." : "Giderleriniz gelirinizden fazla.",
    cashFlowSuggestions: "Düzenli bütçe takibi yapın ve gereksiz harcamaları azaltın.",
    creditHealthSummary: `${credits.length} adet aktif krediniz var. Düzenli ödemelerinize devam edin.`,
    keyRiskFactors: dtiPercentage > 30 ? [{
      factor: "Yüksek Borç/Gelir Oranı",
      impact: "Finansal esnekliğinizi kısıtlıyor",
      severity: dtiPercentage > 40 ? "Yüksek" : "Orta",
      detailedExplanation: "Borç ödemeleriniz gelirinizin önemli bir kısmını oluşturuyor.",
      mitigationTips: ["Ek gelir kaynakları araştırın", "Kredileri birleştirmeyi değerlendirin", "Gereksiz harcamaları azaltın"]
    }] : [],
    positiveFactors: dtiPercentage < 30 ? [{
      factor: "Sağlıklı Borç/Gelir Oranı",
      benefit: "Finansal esnekliğiniz yüksek",
      detailedExplanation: "Borç yükünüz kontrol altında.",
      enhancementTips: ["Bu durumu koruyun", "Tasarruf yapın"]
    }] : [],
    recommendations: [{
      recommendation: "Bütçe Planlaması",
      priority: "Yüksek",
      details: "Aylık gelir ve giderlerinizi düzenli takip edin.",
      actionSteps: ["Harcamalarınızı kategorilere ayırın", "Gereksiz abonelikleri iptal edin", "Acil durum fonu oluşturun"],
      potentialImpact: "Finansal kontrolünüzü artırır"
    }],
    futureOutlook: {
      shortTerm: "Mevcut ödemelerinize devam etmeniz durumunda durumunuz sürdürülebilir",
      longTerm: "Düzenli tasarruf ile finansal güvenliğinizi artırabilirsiniz",
      potentialChallenges: dtiPercentage > 30 ? ["Yüksek borç yükü"] : [],
      opportunities: ["Acil durum fonu oluşturma", "Yatırım fırsatlarını değerlendirme"]
    }
  }
}

async function analyzeRiskWithGemini(financialProfile: FinancialProfile, credits: any[]): Promise<any> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
      responseSchema: riskAnalysisSchema,
    },
  })

  const profile = financialProfile as any // Cast to any to access all fields

  const prompt = `Sen uzman bir finansal risk analistisin. Aşağıdaki verileri kullanarak Türk finans sistemi standartlarına göre kapsamlı bir risk değerlendirmesi yap.

📊 FİNANSAL PROFİL:
• Aylık Gelir: ${profile.monthly_income || 0} TL
• Aylık Giderler: ${profile.monthly_expenses || 0} TL
• Varlıklar: ${profile.total_assets || 0} TL
• Yükümlülükler: ${profile.total_liabilities || 0} TL
• İstihdam: ${profile.employment_status || "Belirtilmemiş"} (${profile.employment_duration_months || 0} ay)

💳 AKTİF KREDİLER (${credits.length} adet):
${credits
  .map(
    (c, i) => `${i + 1}. ${c.banks?.name || "Banka"}: ${c.remaining_debt || 0} TL borç, ${c.monthly_payment || 0} TL/ay, Faiz: %${c.interest_rate || 0}`,
  )
  .join("\n")}

🎯 DEĞERLENDİRME KRİTERLERİ:
• Borç/Gelir Oranı (DTI): %30 altı ideal, %30-40 makul, %40 üstü riskli
• Nakit Akışı: Gelir - Gider - Borç Ödemeleri
• Yüksek faizli krediler ve ödeme yükü oranını özellikle değerlendir
• Kişiye özel, uygulanabilir öneriler sun

Risk skorunu 0-100 arasında belirle (0=mükemmel, 100=çok riskli).`

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

  // With structured output, Gemini should return clean JSON directly
  try {
    // Try to parse the response text as JSON
    const text = response.text()

    // Check if response contains error message
    if (text.includes("An error occurred") || text.includes("error") || text.includes("Error")) {
      console.error("[Gemini] API returned error message:", text.substring(0, 300))
      throw new Error("Gemini API hata döndü")
    }

    const analysis = JSON.parse(text)

    // Validate required fields
    if (!analysis.overallRiskScore || typeof analysis.dtiPercentage !== "number") {
      console.error("[Gemini] Analysis missing required fields:", analysis)
      throw new Error("Incomplete analysis data")
    }

    return analysis
  } catch (error: any) {
    console.error("[Gemini] Response processing error:", error)
    console.error("[Gemini] Raw response (first 500 chars):", response.text().substring(0, 500))

    // Check if it's a JSON parse error
    if (error.message?.includes("JSON") || error.message?.includes("token")) {
      throw new Error("Gemini API beklenmeyen format döndü. Lütfen tekrar deneyin.")
    }

    throw new Error(`Risk analizi işlenemedi: ${error.message}`)
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
