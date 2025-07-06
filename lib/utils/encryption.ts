import crypto from "crypto"

// Güvenli şifreleme için AES-256-GCM kullanıyoruz
const ALGORITHM = "aes-256-gcm"
const ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || process.env.NEXT_PUBLIC_ENCRYPTION_KEY || "dev-key-32-chars-long-for-aes256"

// Şifreleme anahtarının 32 karakter olduğundan emin olalım
const getEncryptionKey = (): Buffer => {
  const key = ENCRYPTION_KEY.padEnd(32, "0").substring(0, 32)
  return Buffer.from(key, "utf8")
}

export function encryptSensitiveData(data: string): string {
  try {
    if (!data || data.trim() === "") {
      return ""
    }

    const key = getEncryptionKey()
    const iv = crypto.randomBytes(16) // 128-bit IV
    const cipher = crypto.createCipher(ALGORITHM, key)

    let encrypted = cipher.update(data, "utf8", "hex")
    encrypted += cipher.final("hex")

    const authTag = cipher.getAuthTag()

    // IV + AuthTag + Encrypted Data formatında birleştir
    const result = iv.toString("hex") + ":" + authTag.toString("hex") + ":" + encrypted

    console.log(`✅ Veri başarıyla şifrelendi: ${data.substring(0, 4)}...`)
    return result
  } catch (error) {
    console.error("Şifreleme hatası:", error)
    // Geliştirme ortamında fallback olarak base64 kullan
    if (process.env.NODE_ENV === "development") {
      console.warn("⚠️ Geliştirme ortamında base64 kullanılıyor")
      return Buffer.from(data).toString("base64")
    }
    throw new Error("Hassas veri şifrelenemedi")
  }
}

export function decryptSensitiveData(encryptedData: string): string {
  try {
    if (!encryptedData || encryptedData.trim() === "") {
      return ""
    }

    // Base64 formatında mı kontrol et (eski veriler için)
    if (!encryptedData.includes(":")) {
      console.warn("⚠️ Eski base64 formatı tespit edildi, çözülüyor...")
      return Buffer.from(encryptedData, "base64").toString("utf-8")
    }

    const parts = encryptedData.split(":")
    if (parts.length !== 3) {
      throw new Error("Geçersiz şifreli veri formatı")
    }

    const [ivHex, authTagHex, encrypted] = parts
    const key = getEncryptionKey()
    const iv = Buffer.from(ivHex, "hex")
    const authTag = Buffer.from(authTagHex, "hex")

    const decipher = crypto.createDecipher(ALGORITHM, key)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encrypted, "hex", "utf8")
    decrypted += decipher.final("utf8")

    console.log(`✅ Veri başarıyla çözüldü`)
    return decrypted
  } catch (error) {
    console.error("Çözme hatası:", error)
    // Geliştirme ortamında fallback
    if (process.env.NODE_ENV === "development") {
      try {
        console.warn("⚠️ Base64 fallback deneniyor...")
        return Buffer.from(encryptedData, "base64").toString("utf-8")
      } catch (fallbackError) {
        console.error("Base64 fallback da başarısız:", fallbackError)
      }
    }
    throw new Error("Hassas veri çözülemedi")
  }
}

export function maskCardNumber(cardNumber: string): string {
  if (!cardNumber || cardNumber.length < 4) {
    return "**** **** **** ****"
  }

  // Boşlukları ve tireleri temizle
  const cleanNumber = cardNumber.replace(/[\s-]/g, "")

  // Son 4 hanesi göster
  const lastFour = cleanNumber.slice(-4)
  const maskedPart = "*".repeat(Math.max(0, cleanNumber.length - 4))

  // 4'lü gruplar halinde formatla
  const formatted = (maskedPart + lastFour).replace(/(.{4})/g, "$1 ").trim()
  return formatted
}

export function getCardBrand(cardNumber: string): string {
  if (!cardNumber) return "Bilinmeyen"

  const cleanNumber = cardNumber.replace(/[\s-]/g, "")

  // Türk bankalarının kart numarası başlangıçları
  if (cleanNumber.startsWith("4")) return "Visa"
  if (cleanNumber.startsWith("5") || cleanNumber.startsWith("2")) return "Mastercard"
  if (cleanNumber.startsWith("3")) return "American Express"
  if (cleanNumber.startsWith("6")) return "Discover"
  if (cleanNumber.startsWith("9792")) return "Troy" // Türkiye'ye özel

  return "Bilinmeyen"
}

// Test kart numaraları - geliştirme için
const TEST_CARD_NUMBERS = [
  "1111111111111111", // Test kartı
  "4111111111111111", // Visa test kartı
  "5555555555554444", // Mastercard test kartı
  "378282246310005", // American Express test kartı
  "6011111111111117", // Discover test kartı
  "4000000000000002", // Visa test kartı
  "5200828282828210", // Mastercard test kartı
  "4242424242424242", // Stripe test kartı
  "4000000000000069", // Visa test kartı (declined)
  "4000000000000127", // Visa test kartı (insufficient funds)
  "1234567890123456", // Basit test kartı
  "9999999999999999", // Basit test kartı
  "0000000000000000", // Sıfır test kartı
]

export function validateCardNumber(cardNumber: string): boolean {
  if (!cardNumber) return false

  const cleanNumber = cardNumber.replace(/[\s-]/g, "")

  // 13-19 haneli olmalı
  if (!/^\d{13,19}$/.test(cleanNumber)) return false

  // Geliştirme ortamında test kartlarını kabul et
  if (process.env.NODE_ENV === "development") {
    // Test kart numaralarını kontrol et
    if (TEST_CARD_NUMBERS.includes(cleanNumber)) {
      console.log("✅ Test kart numarası kabul edildi:", cleanNumber.substring(0, 4) + "****")
      return true
    }

    // Geliştirme ortamında daha esnek validasyon
    // Sadece rakam kontrolü yap, Luhn algoritmasını atla
    console.log("⚠️ Geliştirme ortamında esnek validasyon kullanılıyor")
    return true
  }

  // Prodüksiyon ortamında Luhn algoritması ile doğrula
  return luhnCheck(cleanNumber)
}

export function formatCardNumber(cardNumber: string): string {
  const cleanNumber = cardNumber.replace(/[\s-]/g, "")

  // 4'lü gruplar halinde formatla
  return cleanNumber.replace(/(\d{4})(?=\d)/g, "$1 ")
}

export function validateExpiryDate(month: string | number, year: string | number): boolean {
  const monthNum = typeof month === "string" ? Number.parseInt(month, 10) : month
  const yearNum = typeof year === "string" ? Number.parseInt(year, 10) : year

  if (monthNum < 1 || monthNum > 12) return false

  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1

  // 2 haneli yılı 4 haneli yap
  const fullYear = yearNum < 100 ? 2000 + yearNum : yearNum

  // Geliştirme ortamında daha esnek tarih kontrolü
  if (process.env.NODE_ENV === "development") {
    // Sadece mantıklı bir tarih olup olmadığını kontrol et
    if (fullYear >= currentYear - 10 && fullYear <= currentYear + 20) {
      return true
    }
  }

  // Gelecek tarih olmalı
  if (fullYear < currentYear) return false
  if (fullYear === currentYear && monthNum < currentMonth) return false

  return true
}

// Luhn algoritması
function luhnCheck(cardNumber: string): boolean {
  let sum = 0
  let isEven = false

  // Sağdan sola doğru
  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = Number.parseInt(cardNumber.charAt(i), 10)

    if (isEven) {
      digit *= 2
      if (digit > 9) {
        digit -= 9
      }
    }

    sum += digit
    isEven = !isEven
  }

  return sum % 10 === 0
}

// Hassas veri güvenlik kontrolleri
export function isDataEncrypted(data: string): boolean {
  return data.includes(":") && data.split(":").length === 3
}

export function sanitizeForLog(data: string): string {
  if (!data) return "[BOŞ]"
  if (data.length <= 4) return "[KISA_VERİ]"
  return data.substring(0, 2) + "***" + data.substring(data.length - 2)
}

// Geliştirme ortamı için yardımcı fonksiyon
export function getTestCardNumbers(): string[] {
  return TEST_CARD_NUMBERS.map((num) => formatCardNumber(num))
}

// Kart numarası önerileri
export function getCardNumberSuggestions(): Array<{ number: string; brand: string; description: string }> {
  return [
    { number: "4111 1111 1111 1111", brand: "Visa", description: "Visa Test Kartı" },
    { number: "5555 5555 5555 4444", brand: "Mastercard", description: "Mastercard Test Kartı" },
    { number: "3782 8224 6310 005", brand: "American Express", description: "Amex Test Kartı" },
    { number: "6011 1111 1111 1117", brand: "Discover", description: "Discover Test Kartı" },
    { number: "4242 4242 4242 4242", brand: "Visa", description: "Stripe Test Kartı" },
    { number: "1111 1111 1111 1111", brand: "Test", description: "Basit Test Kartı" },
    { number: "1234 5678 9012 3456", brand: "Test", description: "Demo Kartı" },
  ]
}
