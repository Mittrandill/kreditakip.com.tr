import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai"

export const dynamic = "force-dynamic"
import { mapBankName } from "@/lib/utils/bank-mapper"
import { createServerClient } from "@/lib/supabase/server"
import { rateLimit, getClientIp, RateLimits } from "@/lib/rate-limit"

export const maxDuration = 60

// Gemini Structured Output Schema - PDF Kredi Ödeme Planı
// ÖNEMLİ: Sayısal alanlar STRING olarak alınıyor (Türkçe virgül/nokta karışıklığı önlemi)
const paymentPlanSchema = {
  description: "Kredi ödeme planı analiz sonucu",
  type: SchemaType.OBJECT as const,
  properties: {
    bankName: { type: SchemaType.STRING as const, description: "Banka adı", nullable: true },
    planName: { type: SchemaType.STRING as const, description: "Kredi türü (İhtiyaç, Konut, Taşıt, Ticari)", nullable: true },
    loanAmount: { type: SchemaType.STRING as const, description: "Kredi tutarı (PDF'te göründüğü gibi, örn: '100.000,50' veya '100000.50')", nullable: true },
    totalPayback: { type: SchemaType.STRING as const, description: "Toplam geri ödeme (PDF'te göründüğü gibi)", nullable: true },
    currency: { type: SchemaType.STRING as const, description: "Para birimi (TRY, USD, EUR)", nullable: true },
    interestRate: { type: SchemaType.STRING as const, description: "Faiz oranı (PDF'te göründüğü gibi, örn: '%5,23' veya '5.23' veya '5,23')", nullable: true },
    fees: { type: SchemaType.STRING as const, description: "Masraflar (PDF'te göründüğü gibi)", nullable: true },
    loanTerm: { type: SchemaType.NUMBER as const, description: "Vade (ay)", nullable: true },
    monthlyPayment: { type: SchemaType.STRING as const, description: "Aylık taksit tutarı (PDF'te göründüğü gibi)", nullable: true },
    isVariableRate: { type: SchemaType.BOOLEAN as const, description: "Değişken faizli mi?", nullable: true },
    variableRateInfo: { type: SchemaType.STRING as const, description: "Değişken faiz bilgisi", nullable: true },
    installments: {
      type: SchemaType.ARRAY as const,
      description: "Taksit listesi",
      items: {
        type: SchemaType.OBJECT as const,
        properties: {
          installmentNumber: { type: SchemaType.NUMBER as const, description: "Taksit numarası" },
          amount: { type: SchemaType.STRING as const, description: "Taksit tutarı (PDF'te göründüğü gibi)", nullable: true },
          dueDate: { type: SchemaType.STRING as const, description: "Vade tarihi (YYYY-MM-DD)", nullable: true },
          description: { type: SchemaType.STRING as const, description: "Açıklama", nullable: true },
          isPaid: { type: SchemaType.BOOLEAN as const, description: "Ödenmiş mi?", nullable: true },
        },
        required: ["installmentNumber"],
      },
    },
  },
  required: ["bankName", "loanAmount", "installments", "interestRate"],
}

// Türkçe sayı formatını parse eden fonksiyon (virgül/nokta karışıklığı çözümü)
function parseTurkishNumber(value: string | number | null): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === "number") return value

  // String temizleme
  let cleanStr = value.toString().trim()

  // % işaretini ve harfleri temizle (Sadece rakam, nokta, virgül ve eksi kalsın)
  cleanStr = cleanStr.replace(/[^0-9.,-]/g, "")

  if (!cleanStr) return null

  // Olası formatlar: "1.234,56" (TR) veya "1,234.56" (US) veya "1,23" (TR)

  // Eğer sadece virgül varsa ve nokta yoksa -> Virgülü noktaya çevir (TR ondalık)
  if (cleanStr.includes(",") && !cleanStr.includes(".")) {
    cleanStr = cleanStr.replace(",", ".")
  }
  // Eğer hem nokta hem virgül varsa
  else if (cleanStr.includes(",") && cleanStr.includes(".")) {
    const lastDotIndex = cleanStr.lastIndexOf(".")
    const lastCommaIndex = cleanStr.lastIndexOf(",")

    // Son karakter virgülse, o ondalıktır (1.234,56)
    if (lastCommaIndex > lastDotIndex) {
      cleanStr = cleanStr.replace(/\./g, "").replace(",", ".")
    } else {
      // Son karakter noktaysa, o ondalıktır (1,234.56)
      cleanStr = cleanStr.replace(/,/g, "")
    }
  }

  const result = parseFloat(cleanStr)
  return isNaN(result) ? null : result
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

// SADELEŞT İRİLMİŞ PROMPT - Model sadece "göz" görevi yapar, hesaplama yapmaz
const ULTRA_ADVANCED_PROMPT = `Sen uzman bir kredi analisti ve PDF okuyucususun. PDF'teki verileri OLDUĞU GİBİ çıkar.

ÖNEMLİ: SEN SADECE "GÖZ" GÖREV İNDESİN - HESAP YAPMA, DÖNÜŞTÜRME YAPMA!
🎯 TEMEL KURALLAR:1. FAİZ ORANI (interestRate) - EN ÖNEMLİ!   - PDF'te "Aylık Akdi Faiz Oranı", "Aylık Faiz" veya "Kredi Faiz Oranı" ibarelerini ara   - Faiz oranını PDF'te NASIL görüyorsan TAM OLARAK öyle yaz   - ASLA nokta/virgül değiştirmeye çalışma, ASLA hesaplama yapma   - Örnekler:     * PDF'te "% 5,23" görüyorsan → "5,23" yaz     * PDF'te "5.23%" görüyorsan → "5.23" yaz     * PDF'te "%1,29" görüyorsan → "1,29" yaz   - Yıllık faiz görsen bile STRING olarak çıkar, biz hesaplarız2. TUTARLAR (loanAmount, totalPayback, fees, monthlyPayment, taksit tutarları):   - PDF'te göründüğü gibi yaz (virgül/nokta dahil)   - Örnekler:     * "100.000,50" → "100.000,50"     * "100000.50" → "100000.50"     * "5.432,12" → "5.432,12"3. KREDİ TÜRÜ (planName):   - "Konut Kredisi", "Mortgage", "Ev Kredisi" → "Konut Kredisi"   - "Taşıt Kredisi", "Araç Kredisi" → "Taşıt Kredisi"   - "İhtiyaç Kredisi", "Tüketici Kredisi" → "İhtiyaç Kredisi"   - "Ticari Kredi", "İşletme Kredisi", "KOBİ Kredisi" → "Ticari Kredi"   - Eğer kesin değilsen "İhtiyaç Kredisi" yaz4. TAKSİT LİSTESİ (installments):   - Her taksit satırını oku   - Taksit tutarını olduğu gibi yaz   - Vade tarihi: YYYY-MM-DD formatında   - Ödeme durumu (isPaid):     * "Tahsil Tarihi" dolu ise → true     * "Tahsil Referans No" varsa → true     * Boşsa → null5. DEĞİŞKEN FAİZ:   - "TLREF", "değişken faiz", "endeksli" kelimelerini ara   - Varsa isVariableRate: true   - variableRateInfo'ya formülü yaz (örn: "TLREF + 10,00%")⚡ YASAKLAR:❌ Sayıları dönüştürme❌ Virgül/nokta değiştirme❌ Hesaplama yapma❌ Yuvarlama yapma✅ SADECE GÖRDÜĞÜNÜ YAZ!Şimdi bu PDF'yi analiz et ve JSON çıktısı ver.`

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

    // Rate limiting - OCR is expensive!
    const rateLimitResult = rateLimit({
      identifier: `ocr:${user.id}`,
      ...RateLimits.EXPENSIVE
    })

    if (!rateLimitResult.success) {
      return Response.json(
        {
          error: "Çok fazla analiz talebi. Lütfen 1 saat sonra tekrar deneyin.",
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

    // Free kullanıcılar sınırsız analiz yapabilir, sadece kaydetme sınırlı
    // const { data: canUse, error: checkError } = await supabase.rpc("can_use_feature", {
    //   p_user_id: user.id,
    //   p_feature_type: "ocr_analysis",
    // })

    // if (checkError) {
    //   console.error("[v0] Feature check error:", checkError)
    //   return Response.json({ error: "Özellik kontrolü başarısız oldu" }, { status: 500 })
    // }

    // if (!canUse) {
    //   const { data: subscription } = await supabase
    //     .from("subscriptions")
    //     .select("plan_type")
    //     .eq("user_id", user.id)
    //     .eq("status", "active")
    //     .single()

    //   const { data: usage } = await supabase
    //     .from("usage_tracking")
    //     .select("used_count, limit_count")
    //     .eq("user_id", user.id)
    //     .eq("feature_type", "ocr_analysis")
    //     .single()

    //   return Response.json(
    //     {
    //       error: "Ücretsiz analiz hakkınız doldu",
    //       limitExceeded: true,
    //       usageInfo: {
    //         used: usage?.used_count || 0,
    //         limit: usage?.limit_count || 1,
    //         planType: subscription?.plan_type || "free",
    //       },
    //       upgradeMessage: "Premium üyelik ile sınırsız analiz yapabilirsiniz. Sadanya 199₺/ay!",
    //     },
    //     { status: 403 },
    //   )
    // }

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
      model: "gemini-2.5-pro",
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

      // ===== AKILLI SAYISAL PARSE İŞLEMLERİ =====
      // Model STRING döndürdü, şimdi bizim tarafımızda parse ediyoruz

      // 1. FAİZ ORANI - Özel İşlem (Yıllık/Aylık kontrolü)
      if (paymentPlan.interestRate) {
        let rawRate = parseTurkishNumber(paymentPlan.interestRate)

        if (rawRate !== null) {
          // Yıllık faiz kontrolü - 15'ten büyükse muhtemelen yıllık, 12'ye böl
          if (rawRate > 15) {
            rawRate = Number((rawRate / 12).toFixed(4))
          }
          // 0-1 arası ise (0.0523 gibi), yüzdeye çevir
          else if (rawRate > 0 && rawRate < 0.15) {
            rawRate = Number((rawRate * 100).toFixed(4))
          }
          paymentPlan.interestRate = rawRate
        }
      }

      // 2. Diğer sayısal alanları parse et
      const numericFields = ["loanAmount", "totalPayback", "fees", "monthlyPayment"]
      numericFields.forEach((field) => {
        if (paymentPlan[field]) {
          paymentPlan[field] = parseTurkishNumber(paymentPlan[field])
        }
      })

      // 3. Taksit tutarlarını parse et
      if (paymentPlan.installments && Array.isArray(paymentPlan.installments)) {
        paymentPlan.installments = paymentPlan.installments.map((inst: any) => ({
          ...inst,
          amount: inst.amount ? parseTurkishNumber(inst.amount) : null,
        }))
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

      // Faiz parse işlemi yukarıda yapıldı (301-316 arası)

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

    // OCR analizi sayısını artır (istatistik için) ve limit kontrolü yap
    const { data: canProceed, error: incrementError } = await supabase.rpc("increment_usage", {
      p_user_id: user.id,
      p_feature_type: "ocr_analysis",
    })

    if (incrementError) {
      console.error("[OCR] Usage increment error:", incrementError)
      return Response.json({
        error: "Kullanım takibi sırasında hata oluştu",
        debugError: incrementError.message
      }, { status: 500 })
    }

    // Eğer increment_usage FALSE döndürdüyse, limit dolmuş demektir
    if (canProceed === false) {
      return Response.json({
        error: "OCR analiz limitiniz dolmuş. Premium üyelik ile sınırsız analiz yapabilirsiniz.",
        limitExceeded: true,
        upgradeMessage: "Sadece 199₺/ay ile sınırsız OCR analizi yapın!",
      }, { status: 403 })
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
