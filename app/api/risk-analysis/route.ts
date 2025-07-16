import { NextResponse } from "next/server"
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai"
import type { Credit, FinancialProfile, Account, CreditCard } from "@/lib/types"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY!)

interface RiskAnalysisRequest {
  financialProfile: FinancialProfile | null
  credits: Credit[]
  accounts: Account[]
  creditCards: CreditCard[]
}

export async function POST(request: Request) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 })
  }

  try {
    const { financialProfile, credits, accounts, creditCards } = (await request.json()) as RiskAnalysisRequest

    if (!financialProfile) {
      return NextResponse.json({ error: "Finansal profil verisi eksik." }, { status: 400 })
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" })

    // Optimized generation config for speed
    const generationConfig = {
      temperature: 0.3,
      topK: 1,
      topP: 0.8,
      maxOutputTokens: 4096,
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

    // Kredi kartlarından toplam borç ve aylık minimum ödeme hesapla
    const totalCreditCardDebt = creditCards.reduce((sum, card) => sum + (card.current_debt || 0), 0)
    const totalCreditCardLimit = creditCards.reduce((sum, card) => sum + (card.credit_limit || 0), 0)
    const totalCreditCardMinPayments = creditCards.reduce((sum, card) => {
      const minPayment = ((card.current_debt || 0) * (card.minimum_payment_rate || 3)) / 100
      return sum + minPayment
    }, 0)

    // Hesaplardan toplam bakiye hesapla
    const totalAccountBalance = accounts.reduce((sum, account) => sum + (account.current_balance || 0), 0)
    const totalOverdraftUsed = accounts.reduce((sum, account) => {
      return sum + (account.current_balance < 0 ? Math.abs(account.current_balance) : 0)
    }, 0)

    // Toplam borç ve aylık ödemeler
    const totalDebt = totalDebtFromCredits + totalCreditCardDebt + totalOverdraftUsed
    const totalMonthlyDebtPayments = totalMonthlyPayments + totalCreditCardMinPayments

    // DTI hesapla
    const monthlyIncome = financialProfile.monthly_income || 0
    const dtiRatio = monthlyIncome > 0 ? (totalMonthlyDebtPayments / monthlyIncome) * 100 : 0

    // Kredi kartı kullanım oranı
    const creditCardUtilizationRate = totalCreditCardLimit > 0 ? (totalCreditCardDebt / totalCreditCardLimit) * 100 : 0

    // Finansal profil metni - tüm verilerle
    const financialProfileText = `
      Aylık Gelir: ${financialProfile.monthly_income || "N/A"} TRY
      Aylık Gider: ${financialProfile.monthly_expenses || "N/A"} TRY
      Toplam Varlık: ${financialProfile.total_assets || "N/A"} TRY
      Toplam Borç: ${totalDebt} TRY
      Aylık Toplam Borç Ödemesi: ${totalMonthlyDebtPayments} TRY
      Borç/Gelir Oranı: %${dtiRatio.toFixed(1)}
      İstihdam Durumu: ${financialProfile.employment_status || "N/A"}
      Konut Durumu: ${financialProfile.housing_status || "N/A"}
    `

    // Krediler detayı
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

    // Hesaplar detayı
    const accountsText =
      accounts.length > 0
        ? accounts
            .map((a) => {
              const bankName = a.banks?.name || "Bilinmeyen Banka"
              const accountType = a.account_type || "Bilinmeyen Tür"
              const balance = a.current_balance || 0
              const overdraftStatus = balance < 0 ? `(${Math.abs(balance)} TRY kredili mevduat kullanımı)` : ""
              return `${bankName} - ${accountType}: Bakiye ${balance} TRY ${overdraftStatus}, Para Birimi ${a.currency}`
            })
            .join(" | ")
        : "Kayıtlı hesap bulunmuyor"

    // Kredi kartları detayı
    const creditCardsText =
      creditCards.length > 0
        ? creditCards
            .map((cc) => {
              const bankName = cc.bank_name || "Bilinmeyen Banka"
              const cardType = cc.card_type || "Bilinmeyen Tür"
              const utilization = cc.credit_limit > 0 ? ((cc.current_debt / cc.credit_limit) * 100).toFixed(1) : "0"
              const minPayment = ((cc.current_debt || 0) * (cc.minimum_payment_rate || 3)) / 100
              return `${bankName} - ${cardType}: Limit ${cc.credit_limit} TRY, Borç ${cc.current_debt} TRY, Kullanım Oranı %${utilization}, Min. Ödeme ${minPayment} TRY, Faiz %${cc.interest_rate}`
            })
            .join(" | ")
        : "Kayıtlı kredi kartı bulunmuyor"

    // Enhanced prompt with comprehensive financial data
    const prompt = `
      Sen deneyimli bir finansal risk analisti ve kredi uzmanısın. Aşağıdaki kapsamlı finansal verileri analiz ederek detaylı ve gerçekçi bir risk değerlendirmesi yap.

      Finansal Profil: ${financialProfileText}
      
      Krediler (${credits.length} adet): ${creditsText}
      
      Banka Hesapları (${accounts.length} adet): ${accountsText}
      
      Kredi Kartları (${creditCards.length} adet): ${creditCardsText}

      KAPSAMLI FINANSAL DURUM:
      - Toplam Borç: ${totalDebt} TL (Krediler: ${totalDebtFromCredits} TL, Kredi Kartları: ${totalCreditCardDebt} TL, Kredili Mevduat: ${totalOverdraftUsed} TL)
      - Toplam Aylık Borç Ödemesi: ${totalMonthlyDebtPayments} TL
      - Toplam Hesap Bakiyesi: ${totalAccountBalance} TL
      - Kredi Kartı Kullanım Oranı: %${creditCardUtilizationRate.toFixed(1)}
      - Genel DTI Oranı: %${dtiRatio.toFixed(1)}

      KRİTİK RISK SKORU HESAPLAMA KURALLARI:
      - DTI %0-30: Düşük Risk (numericScore: 15-35, color: "emerald")
      - DTI %30-60: Orta Risk (numericScore: 40-65, color: "yellow")
      - DTI %60-100: Yüksek Risk (numericScore: 70-89, color: "red")
      - DTI %100+: Kritik Risk (numericScore: 90-99, color: "red")
      
      MEVCUT DTI: %${dtiRatio.toFixed(1)} - Bu orana göre risk skoru belirle!

      DETAYLI ANALİZ GEREKSİNİMLERİ:
      1. Tüm finansal araçları değerlendir (krediler, kredi kartları, hesaplar)
      2. Kredi kartı kullanım oranını (%${creditCardUtilizationRate.toFixed(1)}) dikkate al
      3. Hesap bakiyelerini ve kredili mevduat kullanımını analiz et
      4. Çeşitlendirilmiş borç portföyünün risklerini değerlendir
      5. Likidite durumunu hesap bakiyeleri ile analiz et
      6. Somut ve uygulanabilir öneriler ver

      JSON Formatı:
      {
        "overallRiskScore": {
          "value": "Düşük|Orta|Yüksek|Kritik",
          "color": "emerald|yellow|red",
          "numericScore": ${dtiRatio > 100 ? "minimum 90" : dtiRatio > 60 ? "minimum 70" : dtiRatio > 30 ? "40-65 arası" : "15-35 arası"},
          "scoreMax": 100,
          "detailedExplanation": "DTI %${dtiRatio.toFixed(1)}, kredi kartı kullanım oranı %${creditCardUtilizationRate.toFixed(1)} temelinde risk skorunun detaylı açıklaması"
        },
        "overallRiskSummary": "${credits.length} kredi, ${creditCards.length} kredi kartı, ${accounts.length} hesap, toplam ${totalDebt} TL borç, DTI %${dtiRatio.toFixed(1)} - Bu kapsamlı veriler ışığında genel risk durumu özeti",
        "debtToIncomeRatio": {
          "value": "%${dtiRatio.toFixed(1)}",
          "assessment": "${dtiRatio > 100 ? "Kritik" : dtiRatio > 60 ? "Yüksek" : dtiRatio > 30 ? "Orta" : "İyi"}",
          "explanation": "${totalMonthlyDebtPayments} TL aylık ödeme / ${monthlyIncome} TL gelir = %${dtiRatio.toFixed(1)} - Tüm borç türleri dahil detaylı değerlendirme",
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
          "monthlyCreditCardPayments": ${totalCreditCardMinPayments},
          "totalMonthlyDebtPayments": ${totalMonthlyDebtPayments},
          "disposableIncome": ${monthlyIncome - (financialProfile.monthly_expenses || 0) - totalMonthlyDebtPayments},
          "assessment": "${monthlyIncome - (financialProfile.monthly_expenses || 0) - totalMonthlyDebtPayments > 0 ? "Pozitif" : "Negatif"}",
          "explanation": "Tüm borç ödemeleri (krediler + kredi kartları) sonrası nakit akışı analizi",
          "suggestions": ["Nakit akışı iyileştirme önerisi 1", "Nakit akışı iyileştirme önerisi 2"]
        },
        "assetLiabilityAnalysis": {
          "totalAssets": ${(financialProfile.total_assets || 0) + totalAccountBalance},
          "totalLiabilities": ${totalDebt},
          "accountBalances": ${totalAccountBalance},
          "netWorth": ${(financialProfile.total_assets || 0) + totalAccountBalance - totalDebt},
          "assessment": "${(financialProfile.total_assets || 0) + totalAccountBalance - totalDebt > 0 ? "Pozitif" : "Negatif"}",
          "explanation": "Hesap bakiyeleri dahil net varlık durumu analizi"
        },
        "creditUtilization": {
          "overallUtilizationRate": "%${creditCardUtilizationRate.toFixed(1)}",
          "totalCreditLimit": ${totalCreditCardLimit},
          "totalCreditCardDebt": ${totalCreditCardDebt},
          "assessment": "${creditCardUtilizationRate > 80 ? "Yüksek" : creditCardUtilizationRate > 50 ? "Orta" : creditCardUtilizationRate > 30 ? "Kabul Edilebilir" : "İyi"}",
          "explanation": "Kredi kartı kullanım oranı analizi ve önerileri"
        },
        "liquidityAnalysis": {
          "totalAccountBalance": ${totalAccountBalance},
          "overdraftUsed": ${totalOverdraftUsed},
          "liquidityRatio": ${monthlyIncome > 0 ? (totalAccountBalance / monthlyIncome).toFixed(2) : "0"},
          "assessment": "${totalAccountBalance > monthlyIncome ? "İyi" : totalAccountBalance > 0 ? "Orta" : "Zayıf"}",
          "explanation": "Likidite durumu ve acil durum fonu analizi"
        },
        "keyRiskFactors": [
          {
            "factor": "En kritik risk faktörü (DTI, kredi kartı kullanımı, likidite vb.)",
            "impact": "Bu faktörün finansal duruma etkisi",
            "severity": "${dtiRatio > 100 || creditCardUtilizationRate > 80 ? "Kritik" : dtiRatio > 60 || creditCardUtilizationRate > 50 ? "Yüksek" : "Orta"}",
            "detailedExplanation": "Risk faktörünün detaylı açıklaması ve sonuçları",
            "mitigationTips": ["Somut çözüm önerisi 1", "Somut çözüm önerisi 2"]
          }
        ],
        "positiveFactors": [
          {
            "factor": "Güçlü yön (çeşitlendirilmiş portföy, hesap bakiyeleri vb.)",
            "benefit": "Bu faktörün pozitif etkisi",
            "detailedExplanation": "Pozitif faktörün detaylı açıklaması"
          }
        ],
        "recommendations": [
          {
            "recommendation": "En öncelikli tavsiye (kredi kartı borçları, hesap yönetimi vb.)",
            "priority": "Yüksek",
            "details": "Tavsiyenin detaylı açıklaması ve gerekçesi",
            "actionSteps": ["Somut adım 1", "Somut adım 2", "Somut adım 3"],
            "potentialImpact": "Bu tavsiyenin uygulanması durumunda beklenen iyileşme"
          }
        ],
        "savingsAnalysis": {
          "currentSavings": ${totalAccountBalance > 0 ? totalAccountBalance : 0},
          "assessment": "${totalAccountBalance > monthlyIncome * 3 ? "Yeterli" : totalAccountBalance > 0 ? "Geliştirilmeli" : "Yetersiz"}",
          "emergencyFundStatus": "Mevcut hesap bakiyeleri temelinde acil durum fonu durumu",
          "suggestions": "Hesap bakiyeleri ve borç yükü göz önünde bulundurularak tasarruf stratejisi"
        },
        "creditHealthSummary": "${credits.length} aktif kredi, ${creditCards.length} kredi kartı, ortalama faiz oranları ve ödeme performansı analizi",
        "futureOutlook": {
          "shortTerm": "Önümüzdeki 6-12 ay için beklentiler (kredi kartı ödemeleri, hesap yönetimi)",
          "longTerm": "2-5 yıllık finansal görünüm",
          "potentialChallenges": ["Karşılaşılabilecek zorluk 1", "Karşılaşılabilecek zorluk 2"],
          "opportunities": ["Fırsat 1", "Fırsat 2"]
        }
      }

      ÖNEMLİ: DTI %${dtiRatio.toFixed(1)} ve kredi kartı kullanım oranı %${creditCardUtilizationRate.toFixed(1)} olan bir durumda risk skoru gerçekçi olmalı!
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

      // Enhanced post-processing to ensure realistic risk scoring
      if (analysis.overallRiskScore) {
        let targetScore = 50
        let targetValue = "Orta"
        let targetColor = "yellow"

        // Consider both DTI and credit card utilization for risk scoring
        const combinedRiskFactor = Math.max(dtiRatio, creditCardUtilizationRate)

        if (combinedRiskFactor >= 100 || (dtiRatio >= 80 && creditCardUtilizationRate >= 80)) {
          targetScore = Math.floor(Math.random() * 10) + 90 // 90-99
          targetValue = "Kritik"
          targetColor = "red"
        } else if (combinedRiskFactor >= 60 || (dtiRatio >= 50 && creditCardUtilizationRate >= 60)) {
          targetScore = Math.floor(Math.random() * 20) + 70 // 70-89
          targetValue = "Yüksek"
          targetColor = "red"
        } else if (combinedRiskFactor >= 30 || (dtiRatio >= 25 && creditCardUtilizationRate >= 40)) {
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
