import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai"

export const dynamic = "force-dynamic"
import { mapBankName } from "@/lib/utils/bank-mapper"
import { createServerClient } from "@/lib/supabase/server"

export const maxDuration = 60

// Gemini Structured Output Schema - PDF Kredi Ödeme Planı
const paymentPlanSchema = {
  description: "Kredi ödeme planı analiz sonucu",
  type: SchemaType.OBJECT as const,
  properties: {
    bankName: { type: SchemaType.STRING, description: "Banka adı", nullable: true },
    planName: { type: SchemaType.STRING, description: "Kredi türü (İhtiyaç, Konut, Taşıt, Ticari)", nullable: true },
    loanAmount: { type: SchemaType.NUMBER, description: "Kredi tutarı", nullable: true },
    totalPayback: { type: SchemaType.NUMBER, description: "Toplam geri ödeme", nullable: true },
    currency: { type: SchemaType.STRING, description: "Para birimi (TRY, USD, EUR)", nullable: true },
    interestRate: { type: SchemaType.NUMBER, description: "Aylık faiz oranı (örn: 5.23)", nullable: true },
    fees: { type: SchemaType.NUMBER, description: "Masraflar", nullable: true },
    loanTerm: { type: SchemaType.NUMBER, description: "Vade (ay)", nullable: true },
    monthlyPayment: { type: SchemaType.NUMBER, description: "Aylık taksit tutarı", nullable: true },
    isVariableRate: { type: SchemaType.BOOLEAN, description: "Değişken faizli mi?", nullable: true },
    variableRateInfo: { type: SchemaType.STRING, description: "Değişken faiz bilgisi", nullable: true },
    installments: {
      type: SchemaType.ARRAY,
      description: "Taksit listesi",
      items: {
        type: SchemaType.OBJECT as const,
        properties: {
          installmentNumber: { type: SchemaType.NUMBER, description: "Taksit numarası" },
          amount: { type: SchemaType.NUMBER, description: "Taksit tutarı", nullable: true },
          dueDate: { type: SchemaType.STRING, description: "Vade tarihi (YYYY-MM-DD)", nullable: true },
          description: { type: SchemaType.STRING, description: "Açıklama", nullable: true },
          isPaid: { type: SchemaType.BOOLEAN, description: "Ödenmiş mi?", nullable: true },
        },
        required: ["installmentNumber"],
      },
    },
  },
  required: ["bankName", "loanAmount", "installments", "interestRate"],
}

// Gelişmiş JSON temizleme ve düzeltme fonksiyonu
function cleanAndParseJSON(text: string) {
  try {
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
    try {
      return JSON.parse(cleanText)
    } catch (firstError: any) {
      cleanText = cleanText
        .replace(/,\s*}/g, "}")
        .replace(/,\s*]/g, "]")
        .replace(/([^,[{])\s*\n\s*([^,\]}])/g, "$1,$2")
      try {
        return JSON.parse(cleanText)
      } catch (secondError: any) {
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
        try {
          return JSON.parse(repairedText)
        } catch (finalError: any) {
          throw new Error("JSON formatı düzeltilemedi")
        }
      }
    }
  } catch (error: any) {
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

💰 FAİZ ORANI BELİRLEME (interestRate) - ULTRA DİKKAT! EN ÖNEMLİ BÖLÜM!

🚨 ÖNCELİK SIRASI (Yukarıdan aşağıya kontrol et):

1️⃣ **"AYLIK AKDİ FAİZ ORANI"** - EN YÜKSEK ÖNCELİK! ⭐⭐⭐
   - PDF'te "Aylık Akdi Faiz Oranı" yazısını ara
   - Hemen yanındaki % değerini al (örn: %5.23 → 5.23)
   - Bu değeri AYNEN kullan, ASLA değiştirme!
   - Örnek: "Aylık Akdi Faiz Oranı % 5,23" → interestRate: 5.23
   - Örnek: "Aylık Akdi Faiz Oranı % 3,45" → interestRate: 3.45
   - NOT: Virgül yerine nokta kullan (5,23 → 5.23)

2️⃣ **"AYLIK FAİZ ORANI"** veya **"AYLIK FAİZ"**
   - "Aylık Faiz Oranı", "Aylık Faiz", "Monthly Rate" ara
   - Yanındaki % değerini al
   - Doğrudan kullan

3️⃣ **"YILLIK FAİZ ORANI"** veya **"YILLIK FAİZ"**
   - "Yıllık Faiz", "Annual Rate" ara
   - Bulduğun değeri 12'ye böl
   - Örnek: %60.00 yıllık → 60 ÷ 12 = 5.0 aylık

4️⃣ **Değişken Faizli Krediler (TLREF/LIBOR)**
   - "TLREF + X%" veya "Gecelik TLREF + X" formatını ara
   - X değerini al (örn: "TLREF + 10,00%" → 10.0)
   - isVariableRate: true yap
   - variableRateInfo: "TLREF + X%" formatında kaydet

⚠️ YAYGIN HATALAR - BUNLARI YAPMA:
❌ %5.23'ü %0.4 olarak YAZMA! (En sık yapılan hata)
❌ Ondalık noktayı kaydırma (5.23 → 0.523 veya 52.3 HATALI!)
❌ Virgülü nokta yerine kullanma (JSON'da nokta olmalı)
❌ Yıllık ile aylık karıştırma

✅ DOĞRU ÖRNEKLER:
✓ "Aylık Akdi Faiz Oranı % 5,23" → interestRate: 5.23
✓ "Aylık Akdi Faiz Oranı % 3,89" → interestRate: 3.89
✓ "Aylık Akdi Faiz Oranı % 4,12" → interestRate: 4.12
✓ "Yıllık Faiz Oranı % 48,00" → 48 ÷ 12 = interestRate: 4.0

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
    const supabase = await createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 })
    }

    const { data: canUse, error: checkError } = await supabase.rpc("can_use_feature", {
      p_user_id: user.id,
      p_feature_type: "ocr_analysis",
    })

    if (checkError) {
      console.error("[v0] Feature check error:", checkError)
      return Response.json({ error: "Özellik kontrolü başarısız oldu" }, { status: 500 })
    }

    if (!canUse) {
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("plan_type")
        .eq("user_id", user.id)
        .eq("status", "active")
        .single()

      const { data: usage } = await supabase
        .from("usage_tracking")
        .select("used_count, limit_count")
        .eq("user_id", user.id)
        .eq("feature_type", "ocr_analysis")
        .single()

      return Response.json(
        {
          error: "Ücretsiz analiz hakkınız doldu",
          limitExceeded: true,
          usageInfo: {
            used: usage?.used_count || 0,
            limit: usage?.limit_count || 1,
            planType: subscription?.plan_type || "free",
          },
          upgradeMessage: "Premium üyelik ile sınırsız analiz yapabilirsiniz. Sadece 199₺/ay!",
        },
        { status: 403 },
      )
    }

    if (!process.env.GEMINI_API_KEY) {
      return Response.json({ error: "Google API anahtarı bulunamadı" }, { status: 500 })
    }

    const formData = await request.formData()
    const file = formData.get("pdf") as File

    if (!file) {
      return Response.json({ error: "PDF dosyası bulunamadı" }, { status: 400 })
    }

    // SECURITY FIX: Validate file type and size
    const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
    const ALLOWED_MIME_TYPES = ["application/pdf"]

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return Response.json({ error: "Sadece PDF dosyaları kabul edilir" }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return Response.json(
        { error: `Dosya boyutu çok büyük. Maksimum ${MAX_FILE_SIZE / 1024 / 1024}MB yüklenebilir` },
        { status: 413 },
      )
    }

    if (file.size === 0) {
      return Response.json({ error: "Dosya boş olamaz" }, { status: 400 })
    }

    const fileBuffer = await file.arrayBuffer()
    const base64Data = Buffer.from(fileBuffer).toString("base64")

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
        responseSchema: paymentPlanSchema,
        maxOutputTokens: 8192,
      },
    })

    // Retry mechanism for 503 errors
    let result
    let retryCount = 0
    const maxRetries = 3

    while (retryCount < maxRetries) {
      try {
        result = await model.generateContent([
          ULTRA_ADVANCED_PROMPT,
          {
            inlineData: {
              data: base64Data,
              mimeType: "application/pdf",
            },
          },
        ])
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
      throw new Error("PDF analizi tamamlanamadı. Lütfen tekrar deneyin.")
    }

    const response = await result.response
    const text = response.text()

    let paymentPlan: any
    try {
      // With structured output, Gemini returns clean JSON
      paymentPlan = JSON.parse(text)

      if (!paymentPlan || typeof paymentPlan !== "object") {
        throw new Error("Geçersiz veri yapısı: Ana obje yok veya obje değil.")
      }

      // Validate critical fields
      if (!paymentPlan.installments || !Array.isArray(paymentPlan.installments)) {
        throw new Error("Taksit bilgileri bulunamadı")
      }

      if (paymentPlan.bankName && typeof paymentPlan.bankName === "string") {
        paymentPlan.bankName = mapBankName(paymentPlan.bankName)
      } else {
        paymentPlan.bankName = paymentPlan.bankName || null
      }

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
        paymentPlan.planName = "İhtiyaç Kredisi"
      }

      if (paymentPlan.currency === "TL" || !paymentPlan.currency) {
        paymentPlan.currency = "TRY"
      }

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

      if (paymentPlan.interestRate !== null) {
        if (paymentPlan.interestRate > 5 && paymentPlan.interestRate <= 100) {
          paymentPlan.interestRate = Number.parseFloat((paymentPlan.interestRate / 12).toFixed(4))
        } else if (paymentPlan.interestRate > 100) {
          paymentPlan.interestRate = null
        } else if (paymentPlan.interestRate > 0 && paymentPlan.interestRate < 0.1) {
          paymentPlan.interestRate = Number.parseFloat((paymentPlan.interestRate * 100).toFixed(4))
        }
      }

      if (!paymentPlan.hasOwnProperty("isVariableRate")) {
        paymentPlan.isVariableRate = false
      }
      if (!paymentPlan.hasOwnProperty("variableRateInfo")) {
        paymentPlan.variableRateInfo = null
      }

      if (!Array.isArray(paymentPlan.installments)) {
        paymentPlan.installments = []
      }

      const today = new Date()
      today.setUTCHours(0, 0, 0, 0)

      paymentPlan.installments = paymentPlan.installments.map((installment: any, index: number) => {
        const res: {
          installmentNumber: number;
          amount: number | null;
          dueDate: string | null;
          description: string;
          isPaid: boolean;
        } = {
          installmentNumber: Number.isFinite(installment.installmentNumber) ? installment.installmentNumber : index + 1,
          amount: null,
          dueDate: null,
          description: typeof installment.description === "string" ? installment.description : `${index + 1}. Taksit`,
          isPaid: false,
        }

        if (installment.amount !== undefined && installment.amount !== null) {
          if (typeof installment.amount === "string") {
            const parsedAmount = Number.parseFloat(installment.amount.replace(/[^\d.,-]/g, "").replace(",", "."))
            res.amount = isNaN(parsedAmount) ? null : parsedAmount
          } else if (typeof installment.amount === "number") {
            res.amount = installment.amount
          }
        }

        if (installment.dueDate && typeof installment.dueDate === "string") {
          if (/^\d{1,2}[./-]\d{1,2}[./-]\d{4}$/.test(installment.dueDate)) {
            const parts = installment.dueDate.split(/[./-]/)
            const day = Number.parseInt(parts[0], 10)
            const month = Number.parseInt(parts[1], 10) - 1
            const year = Number.parseInt(parts[2], 10)
            const date = new Date(Date.UTC(year, month, day))
            if (!isNaN(date.getTime())) res.dueDate = date.toISOString().split("T")[0]
          } else if (/^\d{4}-\d{2}-\d{2}$/.test(installment.dueDate)) {
            const date = new Date(installment.dueDate + "T00:00:00Z")
            if (!isNaN(date.getTime())) res.dueDate = date.toISOString().split("T")[0]
          }
        }

        if (!res.dueDate) {
          res.dueDate = new Date(Date.now() + (index + 1) * 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
        }

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

      const zeroOrNullAmountInstallmentIndices: number[] = []
      const validAmountInstallments: number[] = []

      paymentPlan.installments.forEach((inst: any, index: number) => {
        if (inst.amount === 0 || inst.amount === null || inst.amount === undefined) {
          zeroOrNullAmountInstallmentIndices.push(index)
        } else if (inst.amount > 0) {
          validAmountInstallments.push(inst.amount)
        }
      })

      if (zeroOrNullAmountInstallmentIndices.length > 0 && paymentPlan.installments.length > 0) {
        let estimatedAmount = 0

        if (validAmountInstallments.length > 0) {
          const averageAmount =
            validAmountInstallments.reduce((sum, amount) => sum + amount, 0) / validAmountInstallments.length

          const recentInstallments = validAmountInstallments.slice(-Math.min(5, validAmountInstallments.length))
          const recentAverage = recentInstallments.reduce((sum, amount) => sum + amount, 0) / recentInstallments.length

          let growthFactor = 1.0
          if (paymentPlan.isVariableRate) {
            if (recentAverage > averageAmount) {
              growthFactor = recentAverage / averageAmount
              growthFactor = Math.min(growthFactor, 1.3)
            } else {
              growthFactor = 1.1
            }
          }

          estimatedAmount = Number.parseFloat((recentAverage * growthFactor).toFixed(2))
        } else if (paymentPlan.monthlyPayment && paymentPlan.monthlyPayment > 0) {
          const multiplier = paymentPlan.isVariableRate ? 1.15 : 1.0
          estimatedAmount = Number.parseFloat((paymentPlan.monthlyPayment * multiplier).toFixed(2))
        } else if (paymentPlan.loanAmount && paymentPlan.loanAmount > 0) {
          const multiplier = paymentPlan.isVariableRate ? 1.25 : 1.15
          const estimatedTotal = paymentPlan.loanAmount * multiplier
          estimatedAmount = Number.parseFloat((estimatedTotal / paymentPlan.installments.length).toFixed(2))
        }

        if (estimatedAmount > 0) {
          zeroOrNullAmountInstallmentIndices.forEach((index: number) => {
            paymentPlan.installments[index].amount = estimatedAmount
          })
        }
      }

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
        }
      } else if (paymentPlan.interestRate !== null && (paymentPlan.interestRate < 0 || paymentPlan.interestRate > 25)) {
        paymentPlan.interestRate = null
      }
    } catch (parseError: any) {
      console.error("[PDF Analysis] Structured output parse error:", parseError)
      console.error("[PDF Analysis] Response preview:", text.substring(0, 500))

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
          error: `PDF analizi tamamlanamadı. ${parseError.message}. Lütfen farklı bir PDF deneyin veya manuel giriş yapın.`,
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

    const { error: incrementError } = await supabase.rpc("increment_usage", {
      p_user_id: user.id,
      p_feature_type: "ocr_analysis",
    })

    if (incrementError) {
      console.error("[v0] Usage increment error:", incrementError)
    }

    return Response.json({
      success: true,
      paymentPlan: paymentPlan,
      processingTime: Date.now() - startTime,
      analysisVersion: "V2_STRUCTURED_OUTPUT_SCHEMA",
    })
  } catch (error: any) {
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
