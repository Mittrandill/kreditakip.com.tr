// Simple and reliable encryption utilities
// SECURITY FIX: Use environment variable instead of hardcoded key
const PRIMARY_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || process.env.ENCRYPTION_KEY

if (!PRIMARY_KEY) {
  throw new Error(
    `🔐 ENCRYPTION_KEY bulunamadı! .env dosyasına NEXT_PUBLIC_ENCRYPTION_KEY veya ENCRYPTION_KEY ekleyin.\nÖrnek: NEXT_PUBLIC_ENCRYPTION_KEY="your-secure-random-key-here"`
  )
}

const FALLBACK_KEY_1 = process.env.NEXT_PUBLIC_ENCRYPTION_KEY_FALLBACK_1
const FALLBACK_KEY_2 = process.env.NEXT_PUBLIC_ENCRYPTION_KEY_FALLBACK_2

const FALLBACK_KEYS: string[] = [PRIMARY_KEY, FALLBACK_KEY_1, FALLBACK_KEY_2].filter(Boolean) as string[]

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
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
  let result = ""
  let i

  for (i = 0; i < bytes.length - 2; i += 3) {
    const a = bytes[i]
    const b = bytes[i + 1]
    const c = bytes[i + 2]

    result += chars[a >> 2]
    result += chars[((a & 3) << 4) | (b >> 4)]
    result += chars[((b & 15) << 2) | (c >> 6)]
    result += chars[c & 63]
  }

  if (i < bytes.length) {
    const a = bytes[i]
    const b = i + 1 < bytes.length ? bytes[i + 1] : 0

    result += chars[a >> 2]
    result += chars[((a & 3) << 4) | (b >> 4)]
    result += i + 1 < bytes.length ? chars[(b & 15) << 2] : "="
    result += "="
  }

  return result
}

function fromBase64(base64: string): Uint8Array {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
  const lookup = new Uint8Array(256)
  for (let i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i
  }

  const len = base64.length
  let bufferLength = base64.length * 0.75
  if (base64[len - 1] === "=") {
    bufferLength--
    if (base64[len - 2] === "=") {
      bufferLength--
    }
  }

  const bytes = new Uint8Array(bufferLength)
  let p = 0

  for (let i = 0; i < len; i += 4) {
    const encoded1 = lookup[base64.charCodeAt(i)]
    const encoded2 = lookup[base64.charCodeAt(i + 1)]
    const encoded3 = lookup[base64.charCodeAt(i + 2)]
    const encoded4 = lookup[base64.charCodeAt(i + 3)]

    bytes[p++] = (encoded1 << 2) | (encoded2 >> 4)
    if (p < bufferLength) bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2)
    if (p < bufferLength) bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63)
  }

  return bytes
}

async function sha256(data: Uint8Array): Promise<Uint8Array> {
  const K = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98,
    0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
    0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8,
    0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819,
    0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
    0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7,
    0xc67178f2,
  ])

  const rightRotate = (value: number, amount: number) => (value >>> amount) | (value << (32 - amount))

  const paddingSize = data.length % 64 < 56 ? 64 - (data.length % 64) : 128 - (data.length % 64)
  const padded = new Uint8Array(data.length + paddingSize)
  padded.set(data)
  padded[data.length] = 0x80

  const bitLength = data.length * 8
  const buffer = new ArrayBuffer(padded.length)
  const bufferView = new Uint8Array(buffer)
  bufferView.set(padded)
  const view = new DataView(buffer)
  view.setUint32(padded.length - 8, 0, false)
  view.setUint32(padded.length - 4, bitLength >>> 0, false)

  let h0 = 0x6a09e667,
    h1 = 0xbb67ae85,
    h2 = 0x3c6ef372,
    h3 = 0xa54ff53a
  let h4 = 0x510e527f,
    h5 = 0x9b05688c,
    h6 = 0x1f83d9ab,
    h7 = 0x5be0cd19

  for (let i = 0; i < bufferView.length; i += 64) {
    const w = new Uint32Array(64)
    for (let j = 0; j < 16; j++) {
      w[j] = view.getUint32(i + j * 4, false)
    }

    for (let j = 16; j < 64; j++) {
      const s0 = rightRotate(w[j - 15], 7) ^ rightRotate(w[j - 15], 18) ^ (w[j - 15] >>> 3)
      const s1 = rightRotate(w[j - 2], 17) ^ rightRotate(w[j - 2], 19) ^ (w[j - 2] >>> 10)
      w[j] = (w[j - 16] + s0 + w[j - 7] + s1) >>> 0
    }

    let a = h0,
      b = h1,
      c = h2,
      d = h3,
      e = h4,
      f = h5,
      g = h6,
      h = h7

    for (let j = 0; j < 64; j++) {
      const S1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)
      const ch = (e & f) ^ (~e & g)
      const temp1 = (h + S1 + ch + K[j] + w[j]) >>> 0
      const S0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)
      const maj = (a & b) ^ (a & c) ^ (b & c)
      const temp2 = (S0 + maj) >>> 0

      h = g
      g = f
      f = e
      e = (d + temp1) >>> 0
      d = c
      c = b
      b = a
      a = (temp1 + temp2) >>> 0
    }

    h0 = (h0 + a) >>> 0
    h1 = (h1 + b) >>> 0
    h2 = (h2 + c) >>> 0
    h3 = (h3 + d) >>> 0
    h4 = (h4 + e) >>> 0
    h5 = (h5 + f) >>> 0
    h6 = (h6 + g) >>> 0
    h7 = (h7 + h) >>> 0
  }

  const hash = new Uint8Array(32)
  const hashView = new DataView(hash.buffer)
  hashView.setUint32(0, h0, false)
  hashView.setUint32(4, h1, false)
  hashView.setUint32(8, h2, false)
  hashView.setUint32(12, h3, false)
  hashView.setUint32(16, h4, false)
  hashView.setUint32(20, h5, false)
  hashView.setUint32(24, h6, false)
  hashView.setUint32(28, h7, false)

  return hash
}

async function hmacSha256Fallback(key: string, data: string): Promise<Uint8Array> {
  const encoder = new TextEncoder()
  const keyBytes = encoder.encode(key)
  const messageBytes = encoder.encode(data)

  const blockSize = 64
  const keyBlock = new Uint8Array(blockSize)

  if (keyBytes.length > blockSize) {
    const hashedKey = await sha256(keyBytes)
    keyBlock.set(hashedKey)
  } else {
    keyBlock.set(keyBytes)
  }

  const oKeyPad = new Uint8Array(blockSize + 32)
  const iKeyPad = new Uint8Array(blockSize + messageBytes.length)

  for (let i = 0; i < blockSize; i++) {
    oKeyPad[i] = keyBlock[i] ^ 0x5c
    iKeyPad[i] = keyBlock[i] ^ 0x36
  }

  iKeyPad.set(messageBytes, blockSize)
  const innerHash = await sha256(iKeyPad)

  oKeyPad.set(innerHash, blockSize)
  const hmac = await sha256(oKeyPad)

  return hmac
}

async function hmacSha256(key: string, data: string): Promise<Uint8Array> {
  return hmacSha256Fallback(key, data)
}

async function getRandomBytes(length: number): Promise<Uint8Array> {
  const arr = new Uint8Array(length)
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(arr)
  } else {
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
    const blockKeyBytes = await hmacSha256(PRIMARY_KEY as string, `${toBase64(iv)}:${counter}`)
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

  try {
    const packed = fromBase64(cipherText)

    if (packed.length < 16) {
      throw new Error("Invalid cipher text")
    }

    const iv = packed.slice(0, 16)
    const cipher = packed.slice(16)
    const plain = new Uint8Array(cipher.length)

    // Try each key in order
    for (const key of FALLBACK_KEYS) {
      try {
        let counter = 0
        let offset = 0
        for (let i = 0; i < plain.length; i++) plain[i] = 0

        while (offset < cipher.length) {
          const blockKeyBytes = await hmacSha256(key, `${toBase64(iv)}:${counter}`)
          const blockLen = Math.min(blockKeyBytes.length, cipher.length - offset)
          for (let i = 0; i < blockLen; i++) {
            plain[offset + i] = cipher[offset + i] ^ blockKeyBytes[i]
          }
          offset += blockLen
          counter++
        }

        const result = fromUtf8Bytes(plain)

        // Validate decryption result
        if (typeof result === "string" && result.length > 0 && result.length < 10000) {
          const printableCount = Array.from(result).filter((c) => {
            const code = c.charCodeAt(0)
            return (code >= 32 && code <= 126) || code >= 128
          }).length

          const printableRatio = printableCount / result.length

          if (printableRatio > 0.9) {
            return result
          }
        }
      } catch {
        continue
      }
    }

    throw new Error("Decryption failed with all keys")
  } catch (error) {
    console.error("[Crypto] Decryption failed:", error)
    throw error
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
    return true
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
    if (!data || typeof data !== "string") return false
    const bytes = fromBase64(data)
    return bytes.length > 20
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
