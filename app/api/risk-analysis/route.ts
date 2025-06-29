import { NextResponse } from "next/server"
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai"
import type { Credit, FinancialProfile } from "@/lib/types"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY!)

interface RiskAnalysisRequest {
  financialProfile: FinancialProfile | null
  credits: Credit[]
}

export async function POST(request: Request) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 })
  }

  try {
    const { financialProfile, credits } = (await request.json()) as RiskAnalysisRequest

    if (!financialProfile) {
      return NextResponse.json({ error: "Finansal profil verisi eksik." }, { status: 400 })
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" })

    // Optimized generation config for speed
    const generationConfig = {
      temperature: 0.3, // Reduced from 0.7 for faster, more focused responses
      topK: 1,
      topP: 0.8, // Reduced from 1 for more focused output
      maxOutputTokens: 4096, // Reduced from 8192 for faster generation
      response_mime_type: "application/json",
    }

    const safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ]

    // Kredilerden toplam borç hesapla
    const totalDebtFromCredits = credits.reduce((sum, credit) => sum + credit.remaining_debt, 0)
    const totalMonthlyPayments = credits.reduce((sum, credit) => sum + credit.monthly_payment, 0)

    // DTI hesapla
    const monthlyIncome = financialProfile.monthly_income || 0
    const dtiRatio = monthlyIncome > 0 ? (totalMonthlyPayments / monthlyIncome) * 100 : 0

    // Simplified financial profile text - kredilerden hesaplanan değerlerle
    const financialProfileText = `
      Aylık Gelir: ${financialProfile.monthly_income || "N/A"} TRY
      Aylık Gider: ${financialProfile.monthly_expenses || "N/A"} TRY
      Toplam Varlık: ${financialProfile.total_assets || "N/A"} TRY
      Toplam Borç (Kredilerden): ${totalDebtFromCredits} TRY
      Aylık Kredi Ödemesi Toplamı: ${totalMonthlyPayments} TRY
      Borç/Gelir Oranı: %${dtiRatio.toFixed(1)}
      İstihdam Durumu: ${financialProfile.employment_status || "N/A"}
      Konut Durumu: ${financialProfile.housing_status || "N/A"}
      Kredi Sayısı: ${credits.length}
    `

    // Detailed credits text with more information
    const creditsText =
      credits.length > 0
        ? credits
            .map((c) => {
              const bankName = c.banks?.name || "Bilinmeyen Banka"
              const creditType = c.credit_types?.name || "Bilinmeyen Kredi"
              const progress = Math.round(
                ((c.total_installments - c.remaining_installments) / c.total_installments) * 100,
              )
              return `${bankName} - ${creditType}: Kalan Borç ${c.remaining_debt} TRY, Aylık Ödeme ${c.monthly_payment} TRY, İlerleme %${progress}, Faiz Oranı %${c.interest_rate}`
            })
            .join(" | ")
        : "Kayıtlı kredi bulunmuyor"

    // Enhanced prompt with realistic risk scoring
    const prompt = `
      Sen deneyimli bir finansal risk analisti ve kredi uzmanısın. Aşağıdaki gerçek kredi verilerini analiz ederek detaylı ve gerçekçi bir risk değerlendirmesi yap.

      Finansal Profil: ${financialProfileText}
      Detaylı Krediler: ${creditsText}

      KRİTİK RISK SKORU HESAPLAMA KURALLARI:
      - DTI %0-30: Düşük Risk (numericScore: 15-35, color: "emerald")
      - DTI %30-60: Orta Risk (numericScore: 40-65, color: "yellow")
      - DTI %60-100: Yüksek Risk (numericScore: 70-89, color: "red")
      - DTI %100+: Kritik Risk (numericScore: 90-99, color: "red")
      
      MEVCUT DTI: %${dtiRatio.toFixed(1)} - Bu orana göre risk skoru belirle!

      DETAYLI ANALİZ GEREKSİNİMLERİ:
      1. Gerçek kredi verilerini kullan (${credits.length} kredi, ${totalDebtFromCredits} TL borç)
      2. DTI oranını (%${dtiRatio.toFixed(1)}) merkeze al
      3. Kredi çeşitliliği ve faiz oranlarını değerlendir
      4. Nakit akış durumunu kredi ödemeleri ile hesapla
      5. Somut ve uygulanabilir öneriler ver
      6. Risk faktörlerini öncelik sırasına göre listele

      JSON Formatı:
      {
        "overallRiskScore": {
          "value": "Düşük|Orta|Yüksek|Kritik",
          "color": "emerald|yellow|red",
          "numericScore": ${dtiRatio > 100 ? "minimum 90" : dtiRatio > 60 ? "minimum 70" : dtiRatio > 30 ? "40-65 arası" : "15-35 arası"},
          "scoreMax": 100,
          "detailedExplanation": "DTI %${dtiRatio.toFixed(1)} temelinde risk skorunun detaylı açıklaması"
        },
        "overallRiskSummary": "${credits.length} kredi, ${totalDebtFromCredits} TL borç, DTI %${dtiRatio.toFixed(1)} - Bu veriler ışığında genel risk durumu özeti",
        "debtToIncomeRatio": {
          "value": "%${dtiRatio.toFixed(1)}",
          "assessment": "${dtiRatio > 100 ? "Kritik" : dtiRatio > 60 ? "Yüksek" : dtiRatio > 30 ? "Orta" : "İyi"}",
          "explanation": "${totalMonthlyPayments} TL aylık ödeme / ${monthlyIncome} TL gelir = %${dtiRatio.toFixed(1)} - Bu oran için detaylı değerlendirme",
          "benchmark": {
            "idealRange": "< %30",
            "warningRange": "%30-60",
            "criticalRange": "> %60"
          }
        },
        "cashFlowAnalysis": {
          "monthlyIncome": ${monthlyIncome},
          "monthlyExpenses": ${financialProfile.monthly_expenses || 0},
          "monthlyCreditPayments": ${totalMonthlyPayments},
          "disposableIncome": ${monthlyIncome - (financialProfile.monthly_expenses || 0) - totalMonthlyPayments},
          "assessment": "${monthlyIncome - (financialProfile.monthly_expenses || 0) - totalMonthlyPayments > 0 ? "Pozitif" : "Negatif"}",
          "explanation": "Kredi ödemeleri sonrası kalan nakit durumu analizi",
          "suggestions": ["Nakit akışı iyileştirme önerisi 1", "Nakit akışı iyileştirme önerisi 2"]
        },
        "assetLiabilityAnalysis": {
          "totalAssets": ${financialProfile.total_assets || 0},
          "totalLiabilities": ${totalDebtFromCredits},
          "netWorth": ${(financialProfile.total_assets || 0) - totalDebtFromCredits},
          "assessment": "${(financialProfile.total_assets || 0) - totalDebtFromCredits > 0 ? "Pozitif" : "Negatif"}",
          "explanation": "Kayıtlı krediler baz alınarak net varlık durumu"
        },
        "keyRiskFactors": [
          {
            "factor": "En kritik risk faktörü (DTI, nakit akış vb.)",
            "impact": "Bu faktörün finansal duruma etkisi",
            "severity": "${dtiRatio > 100 ? "Kritik" : dtiRatio > 60 ? "Yüksek" : "Orta"}",
            "detailedExplanation": "Risk faktörünün detaylı açıklaması ve sonuçları",
            "mitigationTips": ["Somut çözüm önerisi 1", "Somut çözüm önerisi 2"]
          }
        ],
        "positiveFactors": [
          {
            "factor": "Güçlü yön (varsa)",
            "benefit": "Bu faktörün pozitif etkisi",
            "detailedExplanation": "Pozitif faktörün detaylı açıklaması"
          }
        ],
        "recommendations": [
          {
            "recommendation": "En öncelikli tavsiye",
            "priority": "Yüksek",
            "details": "Tavsiyenin detaylı açıklaması ve gerekçesi",
            "actionSteps": ["Somut adım 1", "Somut adım 2", "Somut adım 3"],
            "potentialImpact": "Bu tavsiyenin uygulanması durumunda beklenen iyileşme"
          }
        ],
        "savingsAnalysis": {
          "assessment": "${monthlyIncome - (financialProfile.monthly_expenses || 0) - totalMonthlyPayments > 1000 ? "Yeterli" : "Yetersiz"}",
          "emergencyFundStatus": "Acil durum fonu durumu değerlendirmesi",
          "suggestions": "Kredi yükü göz önünde bulundurularak tasarruf stratejisi"
        },
        "creditHealthSummary": "${credits.length} aktif kredi, ortalama faiz oranı ve ödeme performansı analizi",
        "futureOutlook": {
          "shortTerm": "Önümüzdeki 6-12 ay için beklentiler",
          "longTerm": "2-5 yıllık finansal görünüm",
          "potentialChallenges": ["Karşılaşılabilecek zorluk 1", "Karşılaşılabilecek zorluk 2"],
          "opportunities": ["Fırsat 1", "Fırsat 2"]
        }
      }

      ÖNEMLİ: DTI %${dtiRatio.toFixed(1)} olan bir durumda risk skoru gerçekçi olmalı. %100'ün üstü DTI kritik durumdur ve 90+ skor almalıdır!
    `

    const result = await model.generateContent(prompt)
    const response = result.response
    const rawText = response.text()

    let jsonStringToParse = rawText
    const markdownMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/)
    if (markdownMatch && markdownMatch[1]) {
      jsonStringToParse = markdownMatch[1]
    } else {
      const firstBrace = rawText.indexOf("{")
      const lastBrace = rawText.lastIndexOf("}")
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonStringToParse = rawText.substring(firstBrace, lastBrace + 1)
      }
    }
    jsonStringToParse = jsonStringToParse.trim()

    let analysis
    try {
      analysis = JSON.parse(jsonStringToParse)

      // Enhanced post-processing to ensure realistic risk scoring based on DTI
      if (analysis.overallRiskScore) {
        let targetScore = 50
        let targetValue = "Orta"
        let targetColor = "yellow"

        // Realistic risk scoring based on DTI ratio
        if (dtiRatio >= 100) {
          targetScore = Math.floor(Math.random() * 10) + 90 // 90-99
          targetValue = "Kritik"
          targetColor = "red"
        } else if (dtiRatio >= 60) {
          targetScore = Math.floor(Math.random() * 20) + 70 // 70-89
          targetValue = "Yüksek"
          targetColor = "red"
        } else if (dtiRatio >= 30) {
          targetScore = Math.floor(Math.random() * 26) + 40 // 40-65
          targetValue = "Orta"
          targetColor = "yellow"
        } else {
          targetScore = Math.floor(Math.random() * 21) + 15 // 15-35
          targetValue = "Düşük"
          targetColor = "emerald"
        }

        // Force correct values
        analysis.overallRiskScore.numericScore = targetScore
        analysis.overallRiskScore.value = targetValue
        analysis.overallRiskScore.color = targetColor
        analysis.overallRiskScore.scoreMax = 100
      }

      // Ensure DTI assessment is correct
      if (analysis.debtToIncomeRatio) {
        analysis.debtToIncomeRatio.value = `%${dtiRatio.toFixed(1)}`
        if (dtiRatio >= 100) {
          analysis.debtToIncomeRatio.assessment = "Kritik"
        } else if (dtiRatio >= 60) {
          analysis.debtToIncomeRatio.assessment = "Yüksek"
        } else if (dtiRatio >= 30) {
          analysis.debtToIncomeRatio.assessment = "Orta"
        } else {
          analysis.debtToIncomeRatio.assessment = "İyi"
        }
      }
    } catch (parseError: any) {
      console.error("[SERVER] JSON parse error. String that failed to parse:", JSON.stringify(jsonStringToParse))
      console.error("[SERVER] Parse error details:", parseError)
      return NextResponse.json(
        {
          error: "Risk analizi yanıtı ayrıştırılamadı. Format hatası.",
          details: parseError.message,
          problematicString: jsonStringToParse,
        },
        { status: 500 },
      )
    }

    return NextResponse.json(analysis)
  } catch (error: any) {
    console.error("[SERVER] Error calling Gemini API or processing request:", error)
    if (error.response && error.response.data) {
      console.error("[SERVER] Gemini API Error Response:", error.response.data)
    }
    return NextResponse.json(
      { error: "Risk analizi oluşturulurken bir hata oluştu.", details: error.message },
      { status: 500 },
    )
  }
}
