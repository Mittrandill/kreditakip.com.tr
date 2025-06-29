// Simple masking functions for display purposes
// In production, you would use proper encryption for storing sensitive data

export function maskAccountNumber(accountNumber: string): string {
  if (!accountNumber || accountNumber.length < 4) {
    return "****"
  }

  const visibleDigits = accountNumber.slice(-4)
  const maskedPart = "*".repeat(Math.max(0, accountNumber.length - 4))

  return maskedPart + visibleDigits
}

export function maskCardNumber(cardNumber: string): string {
  if (!cardNumber || cardNumber.length < 4) {
    return "**** **** **** ****"
  }

  // Remove any spaces or dashes
  const cleanNumber = cardNumber.replace(/[\s-]/g, "")

  if (cleanNumber.length < 4) {
    return "**** **** **** ****"
  }

  const lastFour = cleanNumber.slice(-4)
  return `**** **** **** ${lastFour}`
}

export function maskIban(iban: string): string {
  if (!iban || iban.length < 4) {
    return "TR** **** **** **** **** **"
  }

  const cleanIban = iban.replace(/\s/g, "").toUpperCase()

  if (cleanIban.length < 4) {
    return "TR** **** **** **** **** **"
  }

  const countryCode = cleanIban.slice(0, 2)
  const lastFour = cleanIban.slice(-4)
  const middlePart = "*".repeat(Math.max(0, cleanIban.length - 6))

  return `${countryCode}** ${middlePart} ${lastFour}`.replace(/(.{4})/g, "$1 ").trim()
}

// For production use, implement proper encryption/decryption
export function encryptSensitiveData(data: string): string {
  // This is a placeholder - implement proper encryption
  return data
}

export function decryptSensitiveData(encryptedData: string): string {
  // This is a placeholder - implement proper decryption
  return encryptedData
}
