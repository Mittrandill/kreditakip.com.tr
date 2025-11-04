// Client-safe password utilities
// These functions don't use encryption and can be used anywhere

export function maskPassword(password: string): string {
  if (!password) return "••••••••"
  return "•".repeat(password.length)
}

export function generateRandomPassword(length: number = 16): string {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
  let password = ""
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)

  for (let i = 0; i < length; i++) {
    password += charset[array[i] % charset.length]
  }

  return password
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
