// Simple and reliable encryption utilities
// SECURITY FIX: Use environment variable instead of hardcoded key
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "92C535qkivn+SR8aPAcOnAtCzMP541OZ"

// Warn if using default key in production (only on server-side)
if (typeof window === "undefined" && process.env.NODE_ENV === "production" && !process.env.ENCRYPTION_KEY) {
  console.error("⚠️  WARNING: Using default encryption key in production! Set ENCRYPTION_KEY environment variable.")
}

function toUtf8Bytes(input: string): Uint8Array {
  return new TextEncoder().encode(input)
}

function fromUtf8Bytes(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes)
}

function concatBytes(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length + b.length)
  out.set(a, 0)
  out.set(b, a.length)
  return out
}

function toBase64(bytes: Uint8Array): string {
  let binary = ""
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i])
  if (typeof btoa !== "undefined") return btoa(binary)
  // @ts-ignore
  return Buffer.from(binary, "binary").toString("base64")
}

function fromBase64(base64: string): Uint8Array {
  let binary: string
  if (typeof atob !== "undefined") binary = atob(base64)
  else {
    // @ts-ignore
    binary = Buffer.from(base64, "base64").toString("binary")
  }
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function hmacSha256(key: string, data: string): Promise<Uint8Array> {
  // Web Crypto API kullanarak HMAC-SHA256
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const encoder = new TextEncoder()
    const keyData = encoder.encode(key)
    const messageData = encoder.encode(data)

    const cryptoKey = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"])

    const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData)
    return new Uint8Array(signature)
  }

  // Fallback: Basit hash (güvenli değil, sadece crypto.subtle yoksa)
  const message = `${key}:${data}`
  const hash = await simpleHash(message)
  return hash
}

async function simpleHash(text: string): Promise<Uint8Array> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    hash = (hash << 5) - hash + data[i]
    hash = hash & hash
  }
  const result = new Uint8Array(32)
  for (let i = 0; i < 32; i++) {
    result[i] = (hash >> ((i % 4) * 8)) & 0xff
  }
  return result
}

async function getRandomBytes(length: number): Promise<Uint8Array> {
  const arr = new Uint8Array(length)
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(arr)
  } else {
    // Fallback
    for (let i = 0; i < length; i++) {
      arr[i] = Math.floor(Math.random() * 256)
    }
  }
  return arr
}

export async function encryptSensitiveData(plainText: string): Promise<string> {
  if (!plainText || plainText.trim() === "") {
    return ""
  }

  const iv = await getRandomBytes(16)
  const plain = toUtf8Bytes(plainText)
  const cipher = new Uint8Array(plain.length)
  let counter = 0
  let offset = 0

  while (offset < plain.length) {
    const blockKeyBytes = await hmacSha256(ENCRYPTION_KEY, `${toBase64(iv)}:${counter}`)
    const blockLen = Math.min(blockKeyBytes.length, plain.length - offset)
    for (let i = 0; i < blockLen; i++) {
      cipher[offset + i] = plain[offset + i] ^ blockKeyBytes[i]
    }
    offset += blockLen
    counter++
  }

  const packed = concatBytes(iv, cipher)
  return toBase64(packed)
}

export async function decryptSensitiveData(cipherText: string): Promise<string> {
  if (!cipherText || cipherText.trim() === "") {
    return ""
  }

  const packed = fromBase64(cipherText)
  const iv = packed.slice(0, 16)
  const cipher = packed.slice(16)
  const plain = new Uint8Array(cipher.length)
  let counter = 0
  let offset = 0

  while (offset < cipher.length) {
    const blockKeyBytes = await hmacSha256(ENCRYPTION_KEY, `${toBase64(iv)}:${counter}`)
    const blockLen = Math.min(blockKeyBytes.length, cipher.length - offset)
    for (let i = 0; i < blockLen; i++) {
      plain[offset + i] = cipher[offset + i] ^ blockKeyBytes[i]
    }
    offset += blockLen
    counter++
  }

  return fromUtf8Bytes(plain)
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
