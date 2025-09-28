import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
// Uses json5 for lenient JSON parsing when Gemini returns trailing commas or comments
import JSON5 from "json5"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

function cleanJsonString(str: string): string {
  // Remove any non-printable characters and normalize whitespace
  let cleaned = str.replace(/[\x00-\x1F\x7F-\x9F]/g, "")

  // Remove comments and fix common JSON issues
  cleaned = cleaned.replace(/\/\/.*$/gm, "") // Remove single line comments
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, "") // Remove multi-line comments
  cleaned = cleaned.replace(/,(\s*[}\]])/g, "$1") // Remove trailing commas
  cleaned = cleaned.replace(/([{,]\s*)(\w+):/g, '$1"$2":') // Quote unquoted keys
  cleaned = cleaned.replace(/:\s*'([^']*)'/g, ': "$1"') // Replace single quotes with double quotes

  return cleaned.trim()
}

function extractJsonFromResponse(response: string): any {
  // Locate a JSON-looking block – fenced or bare.
  const jsonMatch =
    response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/```[\s\S]*?```/) || response.match(/(\{[\s\S]*\})/)

  if (!jsonMatch) {
    throw new Error("No JSON block found in AI response")
  }

  const jsonStr = cleanJsonString(jsonMatch[1] || jsonMatch[0])

  // 1️⃣  Try strict JSON first
  try {
    return JSON.parse(jsonStr)
  } catch (strictErr) {
    console.warn("[SERVER] Strict JSON.parse failed, falling back to JSON5:", strictErr.message)
  }

  // 2️⃣  Try lenient JSON5 parsing
  try {
    const parsed = JSON5.parse(jsonStr)
    return parsed
  } catch (json5Err) {
    console.error("[SERVER] JSON5 parse error:", json5Err.message)
    throw new Error(`Both JSON.parse and JSON5.parse failed: ${json5Err}`)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { financialProfile, credits, marketRates } = await request.json()

    if (!financialProfile || !credits || credits.length === 0) {
      return NextResponse.json({ error: "Finansal profil ve kredi bilgileri gereklidir" }, { status: 400 })
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })

    const prompt = `
Sen Türkiye'nin en deneyimli finansal danışmanısın. Kullanıcının mevcut kredilerini analiz edip, güncel piyasa koşullarıyla karşılaştırarak en iyi refinansman önerilerini sunacaksın.

ÖNEMLİ: 
1. Mevcut kredileri güncel piyasa oranlarıyla MUTLAKA karşılaştır
2. Hangi bankadan hangi koşullarda yeni kredi alınabileceğini NET olarak belirt
3. Banka adlarını doğru eşleştir ve gerçek banka isimlerini kullan
4. Sadece Türkiye'de faaliyet gösteren bankaları öner

Finansal Profil:
- Aylık Gelir: ${financialProfile.monthly_income} TL
- Aylık Gider: ${financialProfile.monthly_expenses || 0} TL
- Toplam Varlık: ${financialProfile.total_assets || 0} TL
- Risk Toleransı: ${financialProfile.risk_tolerance || "Orta"}

Mevcut Krediler (${credits.length} adet):
${credits
  .map(
    (c: any, i: number) => `
${i + 1}. ${c.credit_type_name || "Kredi"} - ${c.bank_name || "Bilinmeyen Banka"}
   - Kalan Borç: ${c.remaining_debt || 0} TL
   - Aylık Ödeme: ${c.monthly_payment || 0} TL
   - Faiz Oranı: ${c.interest_rate || 0}%
   - Kalan Taksit: ${c.remaining_installments || 0}
   - Vade: ${c.remaining_installments || 0} ay
`,
  )
  .join("")}

Güncel Piyasa Oranları (2024):
- İhtiyaç Kredisi: %2.8-3.2 (Ziraat Bankası, İş Bankası, Garanti BBVA)
- Konut Kredisi: %1.9-2.3 (VakıfBank, Akbank, QNB Finansbank)
- Taşıt Kredisi: %2.2-2.8 (DenizBank, ING Bank, TEB)
- Ticari Kredi: %3.1-3.8 (Halkbank, Yapı Kredi, HSBC)

TÜRK BANKALARI LİSTESİ (sadece bunları kullan):
- Ziraat Bankası, İş Bankası, Garanti BBVA, VakıfBank, Halkbank, Akbank
- DenizBank, ING Bank, TEB, QNB Finansbank, Yapı Kredi, HSBC
- Fibabanka, Enpara.com, Şekerbank, Anadolubank, Turkish Bank
- Kuveyt Türk, Albaraka Türk, Ziraat Katılım, Vakıf Katılım

GÖREV: Her kredi için mevcut koşulları piyasa ile karşılaştır ve SOMUT öneriler sun.

Sadece JSON formatında yanıt ver (yorum satırı kullanma):

{
  "overallAssessment": {
    "refinancingPotential": "Yüksek|Orta|Düşük",
    "totalPotentialSavings": 0,
    "recommendedStrategy": "detaylı strateji açıklaması - mevcut durumu analiz et ve net öneriler sun",
    "urgencyLevel": "Acil|Yüksek|Orta|Düşük",
    "summary": "mevcut kredilerin durumu, piyasa ile karşılaştırma ve net tasarruf potansiyeli hakkında detaylı değerlendirme"
  },
  "individualCreditAnalysis": [
    {
      "creditId": "kredi_id",
      "bankName": "mevcut_banka",
      "creditType": "kredi_türü",
      "currentSituation": {
        "remainingDebt": 0,
        "currentRate": 0,
        "monthlyPayment": 0,
        "remainingMonths": 0
      },
      "refinancingOptions": [{
        "optionName": "Yeni Kredi Önerisi",
        "recommendedBank": "önerilen_banka_adı",
        "newRate": 0,
        "newTerm": 0,
        "newMonthlyPayment": 0,
        "totalSavings": 0,
        "monthlySavings": 0,
        "feasibility": "Yüksek|Orta|Düşük",
        "requirements": ["gereksinim1", "gereksinim2"],
        "comparisonDetails": "mevcut vs yeni kredi karşılaştırması"
      }],
      "priority": "Yüksek|Orta|Düşük",
      "netBenefit": "net fayda açıklaması"
    }
  ],
  "consolidationAnalysis": {
    "feasibility": "Yüksek|Orta|Düşük",
    "consolidatedLoanAmount": 0,
    "suggestedRate": 0,
    "suggestedTerm": 0,
    "newMonthlyPayment": 0,
    "totalSavings": 0,
    "recommendedBank": "önerilen_banka",
    "benefits": ["fayda1", "fayda2"],
    "risks": ["risk1", "risk2"]
  },
  "actionPlan": {
    "immediate": ["1. Önce X bankasıyla görüş", "2. Y bankasından teklif al"],
    "shortTerm": ["kısa_vadeli_adım1", "kısa_vadeli_adım2"],
    "longTerm": ["uzun_vadeli_adım1"],
    "expectedOutcome": "beklenen_net_sonuç_ve_tasarruf"
  },
  "alternativeStrategies": [{
    "strategy": "strateji_adı",
    "description": "açıklama",
    "expectedSavings": 0,
    "newMonthlyPayment": 0,
    "suitability": "uygunluk_değerlendirmesi"
  }]
}

UNUTMA: 
- Her öneride hangi bankadan hangi koşullarda kredi alınacağını NET belirt
- Sadece yukarıdaki Türk bankalarını kullan
- Gerçekçi değerlendirmeler yap ve banka adlarını doğru eşleştir!
`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    try {
      const analysisData = extractJsonFromResponse(text)

      // Validate required fields
      if (!analysisData.overallAssessment) {
        throw new Error("overallAssessment field missing")
      }

      if (analysisData.individualCreditAnalysis) {
        analysisData.individualCreditAnalysis = analysisData.individualCreditAnalysis.map((analysis: any) => {
          // Ensure bank names are properly formatted
          if (analysis.refinancingOptions) {
            analysis.refinancingOptions = analysis.refinancingOptions.map((option: any) => {
              // Validate and correct bank names
              const validBanks = [
                "Ziraat Bankası",
                "İş Bankası",
                "Garanti BBVA",
                "VakıfBank",
                "Halkbank",
                "Akbank",
                "DenizBank",
                "ING Bank",
                "TEB",
                "QNB Finansbank",
                "Yapı Kredi",
                "HSBC",
                "Fibabanka",
                "Enpara.com",
                "Şekerbank",
                "Anadolubank",
                "Turkish Bank",
                "Kuveyt Türk",
                "Albaraka Türk",
                "Ziraat Katılım",
                "Vakıf Katılım",
              ]

              if (option.recommendedBank && !validBanks.includes(option.recommendedBank)) {
                // Try to find a close match
                const normalizedRecommended = option.recommendedBank.toLowerCase()
                const matchedBank = validBanks.find(
                  (bank) =>
                    bank.toLowerCase().includes(normalizedRecommended) ||
                    normalizedRecommended.includes(bank.toLowerCase()),
                )
                if (matchedBank) {
                  option.recommendedBank = matchedBank
                } else {
                  option.recommendedBank = "Ziraat Bankası" // Default fallback
                }
              }

              return option
            })
          }
          return analysis
        })
      }

      return NextResponse.json(analysisData)
    } catch (parseError: any) {
      console.error("[SERVER] JSON Parse Error:", parseError)

      const totalCurrentPayment = credits.reduce((sum: number, c: any) => sum + (c.monthly_payment || 0), 0)
      const totalDebt = credits.reduce((sum: number, c: any) => sum + (c.remaining_debt || 0), 0)
      const avgCurrentRate = credits.reduce((sum: number, c: any) => sum + (c.interest_rate || 0), 0) / credits.length

      const getBestBankForRate = (rate: number) => {
        if (rate > 3.5) return "Ziraat Bankası"
        if (rate > 2.8) return "İş Bankası"
        return "Garanti BBVA"
      }

      const fallbackResponse = {
        overallAssessment: {
          refinancingPotential: avgCurrentRate > 3.5 ? "Yüksek" : avgCurrentRate > 2.5 ? "Orta" : "Düşük",
          totalPotentialSavings: Math.floor(totalCurrentPayment * 12 * 0.15),
          recommendedStrategy: `Mevcut kredilerinizin ortalama faiz oranı %${avgCurrentRate.toFixed(1)} seviyesinde. Güncel piyasa koşullarında ${avgCurrentRate > 3.0 ? "önemli tasarruf fırsatları" : "sınırlı tasarruf imkanları"} bulunmaktadır. ${credits.length > 1 ? "Kredilerinizi konsolide ederek" : "Mevcut kredinizi refinanse ederek"} aylık ödemelerinizi azaltabilir ve toplam faiz yükünüzü düşürebilirsiniz.`,
          urgencyLevel: avgCurrentRate > 4.0 ? "Yüksek" : avgCurrentRate > 3.0 ? "Orta" : "Düşük",
          summary: `${credits.length} adet kredinizin toplam borcu ${new Intl.NumberFormat("tr-TR").format(totalDebt)} TL ve aylık ödemeniz ${new Intl.NumberFormat("tr-TR").format(totalCurrentPayment)} TL. Mevcut ortalama faiz oranınız %${avgCurrentRate.toFixed(1)} iken, piyasa ortalaması %2.5-3.2 arasında değişmektedir. ${avgCurrentRate > 3.2 ? "Refinansman ile önemli tasarruf sağlayabilirsiniz." : "Mevcut koşullarınız piyasa ortalamasına yakın seviyede."}`,
        },
        individualCreditAnalysis: credits.map((credit: any) => {
          const currentRate = credit.interest_rate || 3.0
          const newRate = Math.max(1.8, currentRate - 0.8)
          const monthlySavings = Math.floor(((credit.monthly_payment || 1000) * (currentRate - newRate)) / currentRate)

          return {
            creditId: credit.id,
            bankName: credit.bank_name || "Bilinmeyen Banka",
            creditType: credit.credit_type_name || "Kredi",
            currentSituation: {
              remainingDebt: credit.remaining_debt || 0,
              currentRate: currentRate,
              monthlyPayment: credit.monthly_payment || 0,
              remainingMonths: credit.remaining_installments || 0,
            },
            refinancingOptions: [
              {
                optionName: "Düşük Faizli Refinansman",
                recommendedBank: getBestBankForRate(currentRate),
                newRate: newRate,
                newTerm: credit.remaining_installments || 36,
                newMonthlyPayment: (credit.monthly_payment || 1000) - monthlySavings,
                totalSavings: monthlySavings * (credit.remaining_installments || 36),
                monthlySavings: monthlySavings,
                feasibility: currentRate > 3.5 ? "Yüksek" : currentRate > 2.8 ? "Orta" : "Düşük",
                requirements: ["Düzenli gelir belgesi", "Kredi notu 600+", "3 aylık banka hesap özeti"],
                comparisonDetails: `Mevcut %${currentRate} faiz oranınız yerine %${newRate} ile aylık ${monthlySavings} TL tasarruf sağlayabilirsiniz`,
              },
            ],
            priority: currentRate > 3.5 ? "Yüksek" : "Orta",
            netBenefit: `Bu kredi için aylık ${monthlySavings} TL tasarruf ve ${credit.remaining_installments || 36} ay boyunca toplam ${monthlySavings * (credit.remaining_installments || 36)} TL fayda sağlayabilirsiniz`,
          }
        }),
        consolidationAnalysis: {
          feasibility: credits.length > 1 ? "Yüksek" : "Orta",
          consolidatedLoanAmount: totalDebt,
          suggestedRate: Math.max(2.2, avgCurrentRate - 0.6),
          suggestedTerm: 48,
          newMonthlyPayment: Math.floor(totalCurrentPayment * 0.85),
          totalSavings: Math.floor(totalCurrentPayment * 12 * 0.15),
          recommendedBank: "İş Bankası",
          benefits: [
            "Tek ödeme kolaylığı",
            "Düşük faiz oranı avantajı",
            "Uzun vade seçeneği",
            "Aylık ödeme yükünün azalması",
          ],
          risks: ["Toplam vade uzayabilir", "Erken ödeme cezası olabilir", "Teminat gereksinimleri değişebilir"],
        },
        actionPlan: {
          immediate: [
            `${getBestBankForRate(avgCurrentRate)}'ndan refinansman teklifi alın`,
            "Mevcut bankanızla koşul iyileştirme görüşmesi yapın",
            "Kredi notunuzu kontrol edin",
          ],
          shortTerm: [
            "En az 3 farklı bankadan teklif toplayın",
            "Gerekli belgeleri hazırlayın",
            "Koşulları detaylı karşılaştırın",
          ],
          longTerm: ["En uygun teklifi seçin ve başvuru yapın", "Refinansman işlemini tamamlayın"],
          expectedOutcome: `Refinansman ile aylık ödemelerinizde %${Math.floor(((totalCurrentPayment * 0.15) / totalCurrentPayment) * 100)} oranında azalma ve yıllık ${Math.floor(totalCurrentPayment * 12 * 0.15)} TL tasarruf beklenmektedir`,
        },
        alternativeStrategies: [
          {
            strategy: "Kısmi Erken Ödeme",
            description: "Mevcut kredilerin bir kısmını erken kapatarak faiz yükünü azaltın",
            expectedSavings: Math.floor(totalCurrentPayment * 6),
            newMonthlyPayment: Math.floor(totalCurrentPayment * 0.8),
            suitability: "Nakit rezerviniz varsa uygun bir seçenek",
          },
        ],
      }

      return NextResponse.json(fallbackResponse)
    }
  } catch (error: any) {
    console.error("[SERVER] Refinansman analysis error:", error)
    return NextResponse.json(
      {
        error: "Refinansman analizi oluşturulurken bir hata oluştu",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
