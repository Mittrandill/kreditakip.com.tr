import { GoogleGenerativeAI } from "@google/generative-ai"
import { mapBankName } from "@/lib/utils/bank-mapper"

export const maxDuration = 60

// Gelişmiş JSON temizleme ve düzeltme fonksiyonu
function cleanAndParseJSON(text: string) {
  try {
    console.log("Ham JSON uzunluğu:", text.length)
    let cleanText = text
      .replace(/```(?:json)?\s*/g, "")
      .replace(/```\s*/g, "")
      .trim()
    const start = cleanText.indexOf("{")
    const end = cleanText.lastIndexOf("}") + 1
    if (start !== -1 && end > start) {
      cleanText = cleanText.substring(start, end)
    }
    cleanText = cleanText.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "")
    cleanText = cleanText.replace(/,(\s*[}\]])/g, "$1").replace(/,(\s*,)/g, ",")
    cleanText = cleanText.replace(/}\s*{/g, "},{").replace(/]\s*\[/g, "],[")
    cleanText = cleanText.replace(/[\u0000-\u001F\u007F-\u009F]/g, "").replace(/\n\s*\n/g, "\n")
    console.log("Temizlenmiş JSON uzunluğu:", cleanText.length)
    try {
      return JSON.parse(cleanText)
    } catch (firstError: any) {
      console.log("İlk parse hatası:", firstError.message)
      cleanText = cleanText
        .replace(/,\s*}/g, "}")
        .replace(/,\s*]/g, "]")
        .replace(/([^,[{])\s*\n\s*([^,\]}])/g, "$1,$2")
      try {
        return JSON.parse(cleanText)
      } catch (secondError: any) {
        console.log("İkinci parse hatası:", secondError.message)
        const lines = cleanText.split("\n")
        const fixedLines = []
        let inArray = false
        let inObject = false
        for (let i = 0; i < lines.length; i++) {
          let line = lines[i].trim()
          if (!line) continue
          if (line.includes("[")) inArray = true
          if (line.includes("]")) inArray = false
          if (line.includes("{")) inObject = true
          if (line.includes("}")) inObject = false
          if (
            i < lines.length - 1 &&
            !line.endsWith(",") &&
            !line.endsWith("{") &&
            !line.endsWith("[") &&
            (inArray || inObject)
          ) {
            const nextLine = lines[i + 1]?.trim()
            if (nextLine && !nextLine.startsWith("}") && !nextLine.startsWith("]") && !line.endsWith(",")) {
              line += ","
            }
          }
          fixedLines.push(line)
        }
        const repairedText = fixedLines.join("\n")
        console.log("Onarılmış JSON:", repairedText.substring(0, 500) + "...")
        try {
          return JSON.parse(repairedText)
        } catch (finalError: any) {
          console.error("Final parse hatası:", finalError.message)
          console.error(
            "Sorunlu JSON bölümü:",
            repairedText.substring(
              Math.max(0, finalError.message.match(/\d+/)?.[0] - 100 || 0),
              (finalError.message.match(/\d+/)?.[0] || 0) + 100,
            ),
          )
          throw new Error("JSON formatı düzeltilemedi")
        }
      }
    }
  } catch (error: any) {
    console.error("JSON temizleme hatası:", error)
    throw new Error("JSON formatı geçersiz")
  }
}

// ULTRA DIAMOND PREMIUM PROMPT - Değişken faizli krediler için özel algoritma
const ULTRA_ADVANCED_PROMPT = `Sen bir kredi ödeme planı analiz uzmanısın. Bu PDF'yi analiz et ve SADECE geçerli JSON döndür:

{
"bankName": "Banka adı",
"planName": "Kredi türü",
"loanAmount": 100000,
"totalPayback": 120000,
"currency": "TRY",
"installments": [
  {
    "installmentNumber": 1,
    "amount": 5000,
    "dueDate": "2025-01-15",
    "isPaid": null
  }
],
"interestRate": 1.29,
"fees": 0,
"loanTerm": 24,
"monthlyPayment": 5000,
"isVariableRate": false,
"variableRateInfo": null
}

🎯 KRİTİK KURALLAR - MUTLAKA UYGULA:

📋 KREDİ TÜRÜ BELİRLEME (planName) - ÇOK ÖNEMLİ!
1. PDF'teki GERÇEK kredi türünü bul. Şu anahtar kelimeleri ara:
   - "Konut Kredisi", "Mortgage", "Ev Kredisi" → "Konut Kredisi"
   - "Taşıt Kredisi", "Araç Kredisi", "Otomobil Kredisi" → "Taşıt Kredisi"
   - "İhtiyaç Kredisi", "Tüketici Kredisi", "Bireysel Kredi" → "İhtiyaç Kredisi"
   - "Ticari Kredi", "İşletme Kredisi", "KOBİ Kredisi", "İşletme İhtiyaç Kredisi" → "Ticari Kredi"
   - "Tarım Kredisi", "Ziraat Kredisi" → "Tarım Kredisi"
   - "Eğitim Kredisi", "Öğrenim Kredisi" → "Eğitim Kredisi"

2. ⚠️ ASLA "Altyapı Proje Kredisi" YAZMA! Bu çok spesifik bir kredi türüdür.
3. Eğer kesin belirleyemezsen "İhtiyaç Kredisi" yaz.
4. PDF'te açıkça yazılan kredi türünü kullan.

💰 FAİZ ORANI BELİRLEME (interestRate) - ULTRA DİKKAT!
1. PDF'te "%" işareti ile yazılan AYLIK faiz oranını bul
2. Şu ifadeleri ara: "aylık faiz", "monthly rate", "faiz oranı %"
3. Eğer YILLIK faiz varsa (örn: %18.50), AYLIK'a çevir: 18.50 ÷ 12 = 1.54
4. Değişken faizli krediler için:
   - "TLREF + X%" formatını ara
   - "Gecelik TLREF + 10,00000" → 10.0 olarak kaydet
   - Mevcut TLREF oranını tahmin et (~%15) ve topla
   - isVariableRate: true yap
   - variableRateInfo: "TLREF + X%" formatında kaydet

🔢 DEĞİŞKEN FAİZLİ KREDİLER - ULTRA AKILLI ALGORİTMA!
1. PDF'te "değişken faiz", "TLREF", "endeksli faiz" varsa:
   - isVariableRate: true
   - variableRateInfo: Faiz formülünü kaydet (örn: "TLREF + 10.00%")
   - interestRate: Tahmini toplam aylık faiz (TLREF ~%15 + spread)

2. ⭐ DEĞİŞKEN FAİZLİ KREDİLERDE TAKSİT TUTARI HESAPLAMA - YENİ ULTRA ALGORİTMA:
   a) Önce taksit tutarı BELLİ OLAN taksitleri tespit et
   b) Bu taksitlerin ortalama tutarını hesapla
   c) Eğer son taksitlerde sadece "TLREF+X" yazıyorsa:
      - Önceki taksitlerin ortalamasını al
      - %5-15 arasında artış uygula (faiz artışı için)
      - Bu tutarı belirsiz taksitlere ata
   d) Eğer hiç taksit tutarı yoksa:
      - Kredi tutarı ÷ vade = temel taksit
      - Değişken faiz için %20-30 artış ekle

📅 TAKSİT ANALİZİ - DIAMOND LEVEL!
1. Her taksiti dikkatli incele
2. Taksit tutarı "0", boş veya sadece "TLREF+X" yazıyorsa:
   - Önceki taksitlerin pattern'ini analiz et
   - Son 3-5 taksittin ortalamasını al
   - Değişken faiz artışı için %5-15 ekle
3. Ödeme durumu tespiti:
   - "Tahsil Tarihi" dolu ise → isPaid: true
   - "Tahsil Referans No" varsa → isPaid: true
   - Vade tarihi geçmişse ve tahsil bilgisi yoksa → isPaid: false

🏦 BANKA ADI EŞLEŞTIRME:
- Tam banka adını bul
- "T.C.", "A.Ş.", "T.A.O." gibi ekleri temizle
- Yaygın kısaltmaları genişlet

📊 TUTAR HESAPLAMALARI:
1. Tüm tutarları number olarak kaydet
2. Para birimi sembollerini temizle
3. Virgül/nokta formatını düzelt
4. totalPayback = tüm taksitlerin toplamı
5. monthlyPayment = ortalama taksit tutarı

⚡ ÖZEL DURUMLAR:
1. Erken ödeme varsa: isPaid: true
2. Gecikmiş taksitler: isPaid: false
3. Belirsiz durumlar: isPaid: null
4. Vade tarihi formatı: YYYY-MM-DD

🎯 JSON KURALLARI:
- SADECE JSON döndür, başka hiçbir metin ekleme
- Virgül hatalarına dikkat et
- Tüm sayılar number tipinde
- Tarihler string formatında
- Boolean değerler true/false

💎 ULTRA GELİŞMİŞ ANALİZ:
1. PDF'nin her satırını oku
2. Tablolardaki verileri çıkar
3. Gizli bilgileri bul
4. Mantıklı tahminler yap
5. Eksik verileri akıllı algoritmalarla tamamla

🚀 DEĞİŞKEN FAİZ ÖZEL KURALLARI:
- Eğer taksit tutarı sadece "TLREF+X" ise, önceki taksitlerin ortalamasını %10 artırarak kullan
- Tahsil edilmiş taksitlerden pattern çıkar
- Belirsiz taksitler için makul tahminler yap
- Faiz artış trendini hesaba kat

Şimdi bu PDF'yi analiz et ve mükemmel JSON çıktısı ver!`

export async function POST(request: Request) {
  const startTime = Date.now()

  try {
    if (!process.env.GEMINI_API_KEY) {
      return Response.json({ error: "Google API anahtarı bulunamadı" }, { status: 500 })
    }

    const formData = await request.formData()
    const file = formData.get("pdf") as File

    if (!file) {
      return Response.json({ error: "PDF dosyası bulunamadı" }, { status: 400 })
    }

    console.log(`[${Date.now() - startTime}ms] PDF alındı:`, file.name, file.size, "bytes")

    const fileBuffer = await file.arrayBuffer()
    const base64Data = Buffer.from(fileBuffer).toString("base64")

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.05, // Daha deterministik sonuçlar için düşürüldü
        topK: 1,
        topP: 0.05, // Daha odaklı yanıtlar için düşürüldü
        maxOutputTokens: 8192,
      },
    })

    console.log(`[${Date.now() - startTime}ms] Gemini API çağrısı başlıyor... (ULTRA DIAMOND MODE)`)

    const result = await model.generateContent([
      ULTRA_ADVANCED_PROMPT,
      {
        inlineData: {
          data: base64Data,
          mimeType: "application/pdf",
        },
      },
    ])

    const response = await result.response
    const text = response.text()

    console.log(`[${Date.now() - startTime}ms] Gemini yanıtı alındı (DIAMOND EDITION)`)
    console.log("Ham yanıt ilk 500 karakter:", text.substring(0, 500))
    console.log("Ham yanıt son 500 karakter:", text.substring(Math.max(0, text.length - 500)))

    let paymentPlan
    try {
      paymentPlan = cleanAndParseJSON(text)
      console.log(`[${Date.now() - startTime}ms] JSON başarıyla parse edildi`)

      if (!paymentPlan || typeof paymentPlan !== "object") {
        throw new Error("Geçersiz veri yapısı: Ana obje yok veya obje değil.")
      }

      // 🏦 Banka adı eşleştirme - ULTRA GELİŞMİŞ
      if (paymentPlan.bankName && typeof paymentPlan.bankName === "string") {
        paymentPlan.bankName = mapBankName(paymentPlan.bankName)
        console.log("🏦 Banka eşleştirildi:", paymentPlan.bankName)
      } else {
        paymentPlan.bankName = paymentPlan.bankName || null
      }

      // 📋 Kredi türü kontrolü - DIAMOND LEVEL
      const forbiddenPlanNames = [
        "Altyapı Proje Kredisi",
        "Proje Finansmanı Kredisi",
        "Belirlenemeyen Kredi Türü",
        "Genel Kredi",
        "Standart Kredi",
      ]

      if (
        !paymentPlan.planName ||
        paymentPlan.planName.trim() === "" ||
        forbiddenPlanNames.includes(paymentPlan.planName)
      ) {
        console.warn(`⚠️ Kredi türü düzeltiliyor: "${paymentPlan.planName}" → "İhtiyaç Kredisi"`)
        paymentPlan.planName = "İhtiyaç Kredisi"
      }

      // 💰 Para birimi standardizasyonu
      if (paymentPlan.currency === "TL" || !paymentPlan.currency) {
        paymentPlan.currency = "TRY"
      }

      // 🔢 Sayısal alanları temizle ve doğrula - ULTRA PRECISION
      const numericFields: (keyof typeof paymentPlan)[] = [
        "loanAmount",
        "totalPayback",
        "interestRate",
        "fees",
        "loanTerm",
        "monthlyPayment",
      ]

      numericFields.forEach((field) => {
        if (paymentPlan[field] !== undefined && paymentPlan[field] !== null) {
          if (typeof paymentPlan[field] === "string") {
            const numValue = Number.parseFloat(
              paymentPlan[field]
                .toString()
                .replace(/[^\d.,-]/g, "")
                .replace(",", "."),
            )
            paymentPlan[field] = isNaN(numValue) ? null : numValue
          } else if (typeof paymentPlan[field] !== "number") {
            paymentPlan[field] = null
          }
        } else {
          paymentPlan[field] = null
        }
      })

      // 💎 Faiz oranı akıllı düzeltme - DIAMOND ALGORITHM
      if (paymentPlan.interestRate !== null) {
        // Yıllık faiz oranı tespiti ve düzeltmesi
        if (paymentPlan.interestRate > 5 && paymentPlan.interestRate <= 100) {
          console.warn(`📊 Yıllık faiz oranı tespit edildi: ${paymentPlan.interestRate}%. Aylığa çevriliyor.`)
          paymentPlan.interestRate = Number.parseFloat((paymentPlan.interestRate / 12).toFixed(4))
        }
        // Çok yüksek faiz oranı kontrolü
        else if (paymentPlan.interestRate > 100) {
          console.warn(`⚠️ Anormal faiz oranı: ${paymentPlan.interestRate}%. Null yapılıyor.`)
          paymentPlan.interestRate = null
        }
        // Çok düşük faiz oranı kontrolü (promil olabilir)
        else if (paymentPlan.interestRate > 0 && paymentPlan.interestRate < 0.1) {
          console.warn(
            `📈 Çok düşük faiz oranı tespit edildi: ${paymentPlan.interestRate}%. Promil olabilir, %100 ile çarpılıyor.`,
          )
          paymentPlan.interestRate = Number.parseFloat((paymentPlan.interestRate * 100).toFixed(4))
        }
      }

      // 🔄 Değişken faiz kontrolü - YENİ ÖZELLİK
      if (!paymentPlan.hasOwnProperty("isVariableRate")) {
        paymentPlan.isVariableRate = false
      }
      if (!paymentPlan.hasOwnProperty("variableRateInfo")) {
        paymentPlan.variableRateInfo = null
      }

      // 📅 Taksitler dizisi kontrolü ve düzeltme - ULTRA SMART
      if (!Array.isArray(paymentPlan.installments)) {
        paymentPlan.installments = []
      }

      const today = new Date()
      today.setUTCHours(0, 0, 0, 0)

      paymentPlan.installments = paymentPlan.installments.map((installment: any, index: number) => {
        const res = {
          installmentNumber: Number.isFinite(installment.installmentNumber) ? installment.installmentNumber : index + 1,
          amount: null,
          dueDate: null,
          description: typeof installment.description === "string" ? installment.description : `${index + 1}. Taksit`,
          isPaid: false,
        }

        // 💰 Taksit tutarı işleme - DIAMOND PRECISION
        if (installment.amount !== undefined && installment.amount !== null) {
          if (typeof installment.amount === "string") {
            const parsedAmount = Number.parseFloat(installment.amount.replace(/[^\d.,-]/g, "").replace(",", "."))
            res.amount = isNaN(parsedAmount) ? null : parsedAmount
          } else if (typeof installment.amount === "number") {
            res.amount = installment.amount
          }
        }

        // 📅 Vade tarihi işleme - ULTRA FORMAT
        if (installment.dueDate && typeof installment.dueDate === "string") {
          // DD.MM.YYYY veya DD/MM/YYYY formatı
          if (/^\d{1,2}[./-]\d{1,2}[./-]\d{4}$/.test(installment.dueDate)) {
            const parts = installment.dueDate.split(/[./-]/)
            const day = Number.parseInt(parts[0], 10)
            const month = Number.parseInt(parts[1], 10) - 1
            const year = Number.parseInt(parts[2], 10)
            const date = new Date(Date.UTC(year, month, day))
            if (!isNaN(date.getTime())) res.dueDate = date.toISOString().split("T")[0]
          }
          // YYYY-MM-DD formatı
          else if (/^\d{4}-\d{2}-\d{2}$/.test(installment.dueDate)) {
            const date = new Date(installment.dueDate + "T00:00:00Z")
            if (!isNaN(date.getTime())) res.dueDate = date.toISOString().split("T")[0]
          }
        }

        // Vade tarihi yoksa tahmini oluştur
        if (!res.dueDate) {
          res.dueDate = new Date(Date.now() + (index + 1) * 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
        }

        // 💎 Ödeme durumu akıllı belirleme - DIAMOND LOGIC
        if (typeof installment.isPaid === "boolean") {
          res.isPaid = installment.isPaid
        } else if (res.dueDate) {
          const dueDateObj = new Date(res.dueDate + "T00:00:00Z")
          if (!isNaN(dueDateObj.getTime())) {
            res.isPaid = dueDateObj <= today
          } else {
            res.isPaid = false
          }
        } else {
          res.isPaid = false
        }

        return res
      })

      // 🚀 ULTRA AKILLI TAKSİT TUTARI HESAPLAMA - DEĞİŞKEN FAİZ ÖZEL ALGORİTMA
      const zeroOrNullAmountInstallmentIndices: number[] = []
      const validAmountInstallments: number[] = []

      paymentPlan.installments.forEach((inst: any, index: number) => {
        if (inst.amount === 0 || inst.amount === null || inst.amount === undefined) {
          zeroOrNullAmountInstallmentIndices.push(index)
        } else if (inst.amount > 0) {
          validAmountInstallments.push(inst.amount)
        }
      })

      console.log("💎 Taksit analizi:")
      console.log("- Geçerli taksit sayısı:", validAmountInstallments.length)
      console.log("- Eksik taksit sayısı:", zeroOrNullAmountInstallmentIndices.length)
      console.log("- Değişken faiz:", paymentPlan.isVariableRate)

      if (zeroOrNullAmountInstallmentIndices.length > 0 && paymentPlan.installments.length > 0) {
        let estimatedAmount = 0

        // 🎯 ULTRA AKILLI ALGORİTMA - Değişken faizli krediler için özel hesaplama
        if (validAmountInstallments.length > 0) {
          // Mevcut taksitlerin ortalamasını al
          const averageAmount =
            validAmountInstallments.reduce((sum, amount) => sum + amount, 0) / validAmountInstallments.length

          // Son 3-5 taksittin trendini analiz et
          const recentInstallments = validAmountInstallments.slice(-Math.min(5, validAmountInstallments.length))
          const recentAverage = recentInstallments.reduce((sum, amount) => sum + amount, 0) / recentInstallments.length

          // Değişken faizli krediler için artış faktörü
          let growthFactor = 1.0
          if (paymentPlan.isVariableRate) {
            // Son taksitler daha yüksekse trend artışını hesapla
            if (recentAverage > averageAmount) {
              growthFactor = recentAverage / averageAmount
              growthFactor = Math.min(growthFactor, 1.3) // Maksimum %30 artış
            } else {
              growthFactor = 1.1 // Varsayılan %10 artış
            }
            console.log("📈 Değişken faiz artış faktörü:", growthFactor)
          }

          estimatedAmount = Number.parseFloat((recentAverage * growthFactor).toFixed(2))
          console.log("🎯 Hesaplanan taksit tutarı (trend bazlı):", estimatedAmount)
        }
        // Alternatif hesaplama - monthlyPayment varsa
        else if (paymentPlan.monthlyPayment && paymentPlan.monthlyPayment > 0) {
          const multiplier = paymentPlan.isVariableRate ? 1.15 : 1.0
          estimatedAmount = Number.parseFloat((paymentPlan.monthlyPayment * multiplier).toFixed(2))
          console.log("💰 Hesaplanan taksit tutarı (monthlyPayment bazlı):", estimatedAmount)
        }
        // Son çare - loanAmount'tan hesapla
        else if (paymentPlan.loanAmount && paymentPlan.loanAmount > 0) {
          const multiplier = paymentPlan.isVariableRate ? 1.25 : 1.15
          const estimatedTotal = paymentPlan.loanAmount * multiplier
          estimatedAmount = Number.parseFloat((estimatedTotal / paymentPlan.installments.length).toFixed(2))
          console.log("🔮 Hesaplanan taksit tutarı (loanAmount bazlı):", estimatedAmount)
        }

        // Hesaplanan tutarı eksik taksitlere ata
        if (estimatedAmount > 0) {
          zeroOrNullAmountInstallmentIndices.forEach((index: number) => {
            paymentPlan.installments[index].amount = estimatedAmount
            console.log(`✅ ${index + 1}. taksit tutarı güncellendi:`, estimatedAmount)
          })
        }
      }

      // 📊 Toplam değerleri yeniden hesapla - FINAL CALCULATION
      if (paymentPlan.installments.length > 0) {
        paymentPlan.loanTerm = paymentPlan.installments.length
        paymentPlan.totalPayback = paymentPlan.installments.reduce(
          (sum: number, inst: any) => sum + (inst.amount || 0),
          0,
        )
        if (paymentPlan.installments.length > 0 && paymentPlan.totalPayback > 0) {
          paymentPlan.monthlyPayment = Number.parseFloat(
            (paymentPlan.totalPayback / paymentPlan.installments.length).toFixed(2),
          )
        } else {
          paymentPlan.monthlyPayment = null
        }
      }

      // 💎 Faiz oranı son kontrol ve hesaplama - DIAMOND FINAL CHECK
      if (
        paymentPlan.interestRate === null &&
        paymentPlan.loanAmount &&
        paymentPlan.loanAmount > 0 &&
        paymentPlan.totalPayback &&
        paymentPlan.totalPayback > paymentPlan.loanAmount &&
        paymentPlan.loanTerm &&
        paymentPlan.loanTerm > 0
      ) {
        const totalInterest = paymentPlan.totalPayback - paymentPlan.loanAmount
        if (paymentPlan.loanTerm > 0) {
          const calculatedMonthlyRate = (totalInterest / paymentPlan.loanAmount / paymentPlan.loanTerm) * 100
          paymentPlan.interestRate = Number.parseFloat(calculatedMonthlyRate.toFixed(4))
          console.log("🧮 Faiz oranı hesaplandı:", paymentPlan.interestRate)
        }
      } else if (paymentPlan.interestRate !== null && (paymentPlan.interestRate < 0 || paymentPlan.interestRate > 25)) {
        console.warn(`⚠️ Anormal aylık faiz oranı: ${paymentPlan.interestRate}%. Null yapılıyor.`)
        paymentPlan.interestRate = null
      }

      console.log("✅ ULTRA DIAMOND ANALYSIS COMPLETED!")
      console.log("📋 Kredi Türü:", paymentPlan.planName)
      console.log("🏦 Banka:", paymentPlan.bankName)
      console.log("💰 Faiz Oranı:", paymentPlan.interestRate)
      console.log("🔄 Değişken Faiz:", paymentPlan.isVariableRate)
      console.log("📊 Taksit Sayısı:", paymentPlan.installments.length)
      console.log("💎 Toplam Geri Ödeme:", paymentPlan.totalPayback)
    } catch (parseError: any) {
      console.error("❌ JSON parse veya veri işleme hatası:", parseError)
      paymentPlan = {
        bankName: null,
        planName: "İhtiyaç Kredisi",
        loanAmount: null,
        totalPayback: null,
        currency: "TRY",
        installments: [],
        interestRate: null,
        fees: null,
        loanTerm: 0,
        monthlyPayment: null,
        isVariableRate: false,
        variableRateInfo: null,
      }
      return Response.json(
        {
          error: `PDF analizi tamamlanamadı. Veri formatı hatası: ${parseError.message}. Lütfen farklı bir PDF deneyin veya manuel giriş yapın.`,
          fallbackPlan: paymentPlan,
          debugInfo: {
            parseError: parseError.message,
            rawTextLength: text.length,
            rawTextPreview: text.substring(0, 200),
          },
        },
        { status: 422 },
      )
    }

    console.log(`[${Date.now() - startTime}ms] �� DIAMOND ULTRA ANALYSIS COMPLETED`)
    return Response.json({
      success: true,
      paymentPlan: paymentPlan,
      processingTime: Date.now() - startTime,
      analysisVersion: "V0DEV_DIAMOND_ULTRA_PRO_PLUS_VARIABLE_RATE",
    })
  } catch (error: any) {
    console.error("💥 PDF analiz genel hatası:", error)
    if (error instanceof Error) {
      if (error.message.includes("API_KEY"))
        return Response.json({ error: "Google API anahtarı geçersiz veya eksik" }, { status: 401 })
      if (error.message.includes("quota"))
        return Response.json({ error: "API kotası aşıldı. Lütfen daha sonra tekrar deneyin." }, { status: 429 })
      return Response.json({ error: `PDF analizi hatası: ${error.message}` }, { status: 500 })
    }
    return Response.json({ error: "PDF analizi sırasında bilinmeyen bir hata oluştu" }, { status: 500 })
  }
}
