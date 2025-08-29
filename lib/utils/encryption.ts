// Simple and reliable encryption utilities
const ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || process.env.NEXT_PUBLIC_ENCRYPTION_KEY || "default-encryption-key-32-chars"

// Simple XOR encryption function
function xorEncrypt(text: string, key: string): string {
  let result = ""
  for (let i = 0; i < text.length; i++) {
    const textChar = text.charCodeAt(i)
    const keyChar = key.charCodeAt(i % key.length)
    result += String.fromCharCode(textChar ^ keyChar)
  }
  return result
}

// XOR decryption (same as encryption for XOR)
function xorDecrypt(encryptedText: string, key: string): string {
  return xorEncrypt(encryptedText, key) // XOR is symmetric
}

// Safe base64 encoding
function safeBase64Encode(str: string): string {
  try {
    return btoa(unescape(encodeURIComponent(str)))
  } catch (error) {
    console.error("Base64 encode error:", error)
    return btoa(str)
  }
}

// Safe base64 decoding
function safeBase64Decode(str: string): string {
  try {
    return decodeURIComponent(escape(atob(str)))
  } catch (error) {
    console.error("Base64 decode error:", error)
    return atob(str)
  }
}

export async function encryptSensitiveData(data: string): Promise<string> {
  try {
    if (!data || data.trim() === "") {
      return ""
    }

    // Step 1: XOR encrypt with key
    const encrypted = xorEncrypt(data, ENCRYPTION_KEY)

    // Step 2: Base64 encode for safe storage
    const encoded = safeBase64Encode(encrypted)

    return encoded
  } catch (error) {
    console.error("Encryption error:", error)
    throw new Error("Failed to encrypt password")
  }
}

export async function decryptSensitiveData(encryptedData: string): Promise<string> {
  try {
    if (!encryptedData || encryptedData.trim() === "") {
      return ""
    }

    // Step 1: Base64 decode
    const decoded = safeBase64Decode(encryptedData)

    // Step 2: XOR decrypt with key
    const decrypted = xorDecrypt(decoded, ENCRYPTION_KEY)

    return decrypted
  } catch (error) {
    console.error("Decryption error:", error)
    throw new Error("Failed to decrypt password")
  }
}

export function maskCardNumber(cardNumber: string): string {
  if (!cardNumber || cardNumber.length < 4) {
    return "**** **** **** ****"
  }

  const cleanNumber = cardNumber.replace(/[\s-]/g, "")
  const lastFour = cleanNumber.slice(-4)
  const maskedPart = "*".repeat(Math.max(0, cleanNumber.length - 4))
  const formatted = (maskedPart + lastFour).replace(/(.{4})/g, "$1 ").trim()
  return formatted
}

export function getCardBrand(cardNumber: string): string {
  if (!cardNumber) return "Bilinmeyen"

  const cleanNumber = cardNumber.replace(/[\s-]/g, "")

  if (cleanNumber.startsWith("4")) return "Visa"
  if (cleanNumber.startsWith("5") || cleanNumber.startsWith("2")) return "Mastercard"
  if (cleanNumber.startsWith("3")) return "American Express"
  if (cleanNumber.startsWith("6")) return "Discover"
  if (cleanNumber.startsWith("9792")) return "Troy"

  return "Bilinmeyen"
}

export function validateCardNumber(cardNumber: string): boolean {
  if (!cardNumber) return false

  const cleanNumber = cardNumber.replace(/[\s-]/g, "")

  if (!/^\d{13,19}$/.test(cleanNumber)) return false

  if (process.env.NODE_ENV === "development") {
    return true // Allow any format in development
  }

  return luhnCheck(cleanNumber)
}

export function formatCardNumber(cardNumber: string): string {
  const cleanNumber = cardNumber.replace(/[\s-]/g, "")
  return cleanNumber.replace(/(\d{4})(?=\d)/g, "$1 ")
}

export function validateExpiryDate(month: string | number, year: string | number): boolean {
  const monthNum = typeof month === "string" ? Number.parseInt(month, 10) : month
  const yearNum = typeof year === "string" ? Number.parseInt(year, 10) : year

  if (monthNum < 1 || monthNum > 12) return false

  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1

  const fullYear = yearNum < 100 ? 2000 + yearNum : yearNum

  if (process.env.NODE_ENV === "development") {
    if (fullYear >= currentYear - 10 && fullYear <= currentYear + 20) {
      return true
    }
  }

  if (fullYear < currentYear) return false
  if (fullYear === currentYear && monthNum < currentMonth) return false

  return true
}

function luhnCheck(cardNumber: string): boolean {
  let sum = 0
  let isEven = false

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

export function isDataEncrypted(data: string): boolean {
  try {
    atob(data)
    return data.length > 20
  } catch {
    return false
  }
}

export function sanitizeForLog(data: string): string {
  if (!data) return "[BOŞ]"
  if (data.length <= 4) return "[KISA_VERİ]"
  return data.substring(0, 2) + "***" + data.substring(data.length - 2)
}

export function validatePasswordStrength(password: string): {
  score: number
  feedback: string[]
  isStrong: boolean
} {
  const feedback: string[] = []
  let score = 0

  if (password.length >= 8) {
    score += 1
  } else {
    feedback.push("En az 8 karakter olmalı")
  }

  if (/[a-z]/.test(password)) {
    score += 1
  } else {
    feedback.push("Küçük harf içermeli")
  }

  if (/[A-Z]/.test(password)) {
    score += 1
  } else {
    feedback.push("Büyük harf içermeli")
  }

  if (/\d/.test(password)) {
    score += 1
  } else {
    feedback.push("Rakam içermeli")
  }

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1
  } else {
    feedback.push("Özel karakter içermeli")
  }

  return {
    score,
    feedback,
    isStrong: score >= 4,
  }
}
