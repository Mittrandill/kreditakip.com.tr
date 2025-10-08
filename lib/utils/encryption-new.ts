import * as ExpoCrypto from "expo-crypto"

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
  // btoa is available on web; for native, use global Buffer if polyfilled by expo-runtime; fallback
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
  const message = data
  const mac = await ExpoCrypto.digestStringAsync(ExpoCrypto.CryptoDigestAlgorithm.SHA256, `${key}:${message}`)
  const hex = mac
  const out = new Uint8Array(hex.length / 2)
  for (let i = 0; i < out.length; i++) {
    out[i] = Number.parseInt(hex.substr(i * 2, 2), 16)
  }
  return out
}

async function getRandomBytes(length: number): Promise<Uint8Array> {
  const arr = new Uint8Array(length)
  const rnd = await ExpoCrypto.getRandomBytesAsync(length)
  arr.set(rnd)
  return arr
}

export async function encryptAsync(plainText: string, key: string): Promise<string> {
  const iv = await getRandomBytes(16)
  const plain = toUtf8Bytes(plainText)
  const cipher = new Uint8Array(plain.length)
  let counter = 0
  let offset = 0
  while (offset < plain.length) {
    const blockKeyBytes = await hmacSha256(key, `${toBase64(iv)}:${counter}`)
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

export async function decryptAsync(cipherText: string, key: string): Promise<string> {
  const packed = fromBase64(cipherText)
  const iv = packed.slice(0, 16)
  const cipher = packed.slice(16)
  const plain = new Uint8Array(cipher.length)
  let counter = 0
  let offset = 0
  while (offset < cipher.length) {
    const blockKeyBytes = await hmacSha256(key, `${toBase64(iv)}:${counter}`)
    const blockLen = Math.min(blockKeyBytes.length, cipher.length - offset)
    for (let i = 0; i < blockLen; i++) {
      plain[offset + i] = cipher[offset + i] ^ blockKeyBytes[i]
    }
    offset += blockLen
    counter++
  }
  return fromUtf8Bytes(plain)
}

// Synchronous wrappers for convenience (use with care on large inputs)
export function encrypt(text: string, key: string): string {
  let out = ""
  let done = false
  encryptAsync(text, key)
    .then((r) => {
      out = r
      done = true
    })
    .catch(() => {
      out = ""
      done = true
    })
  const start = Date.now()
  while (!done && Date.now() - start < 50) {}
  if (!done) throw new Error("Encryption timeout")
  return out
}

export function decrypt(text: string, key: string): string {
  let out = ""
  let err: Error | null = null
  let done = false
  decryptAsync(text, key)
    .then((r) => {
      out = r
      done = true
    })
    .catch((e) => {
      err = e as Error
      done = true
    })
  const start = Date.now()
  while (!done && Date.now() - start < 50) {}
  if (!done) throw new Error("Decryption timeout")
  if (err) throw err
  return out
}
