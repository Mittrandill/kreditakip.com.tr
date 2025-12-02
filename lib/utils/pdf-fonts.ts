import { jsPDF } from "jspdf"

/**
 * Roboto fontunu jsPDF'e yükler ve Türkçe karakter desteği sağlar
 * @param doc jsPDF instance
 */
export async function loadRobotoFont(doc: jsPDF): Promise<void> {
  try {
    // Roboto Regular font'u yükle
    const regularResponse = await fetch("/fonts/Roboto-Regular.ttf")
    if (!regularResponse.ok) {
      throw new Error("Roboto-Regular font yüklenemedi")
    }
    const regularArrayBuffer = await regularResponse.arrayBuffer()
    const regularBase64 = arrayBufferToBase64(regularArrayBuffer)

    // Roboto Bold font'u yükle
    const boldResponse = await fetch("/fonts/Roboto-Bold.ttf")
    if (!boldResponse.ok) {
      throw new Error("Roboto-Bold font yüklenemedi")
    }
    const boldArrayBuffer = await boldResponse.arrayBuffer()
    const boldBase64 = arrayBufferToBase64(boldArrayBuffer)

    // Roboto Italic font'u yükle
    const italicResponse = await fetch("/fonts/Roboto-Italic.ttf")
    if (!italicResponse.ok) {
      throw new Error("Roboto-Italic font yüklenemedi")
    }
    const italicArrayBuffer = await italicResponse.arrayBuffer()
    const italicBase64 = arrayBufferToBase64(italicArrayBuffer)

    // Roboto BoldItalic font'u yükle
    const boldItalicResponse = await fetch("/fonts/Roboto-BoldItalic.ttf")
    if (!boldItalicResponse.ok) {
      throw new Error("Roboto-BoldItalic font yüklenemedi")
    }
    const boldItalicArrayBuffer = await boldItalicResponse.arrayBuffer()
    const boldItalicBase64 = arrayBufferToBase64(boldItalicArrayBuffer)

    // jsPDF'e fontları ekle
    doc.addFileToVFS("Roboto-Regular.ttf", regularBase64)
    doc.addFont("Roboto-Regular.ttf", "Roboto", "normal")

    doc.addFileToVFS("Roboto-Bold.ttf", boldBase64)
    doc.addFont("Roboto-Bold.ttf", "Roboto", "bold")

    doc.addFileToVFS("Roboto-Italic.ttf", italicBase64)
    doc.addFont("Roboto-Italic.ttf", "Roboto", "italic")

    doc.addFileToVFS("Roboto-BoldItalic.ttf", boldItalicBase64)
    doc.addFont("Roboto-BoldItalic.ttf", "Roboto", "bolditalic")

    // Default font olarak Roboto'yu ayarla
    doc.setFont("Roboto", "normal")
  } catch (error) {
    console.error("Font yükleme hatası:", error)
    // Fallback: helvetica kullan
    doc.setFont("helvetica", "normal")
    throw error
  }
}

/**
 * ArrayBuffer'ı Base64'e çevirir
 * @param arrayBuffer
 * @returns Base64 string
 */
function arrayBufferToBase64(arrayBuffer: ArrayBuffer): string {
  const uint8Array = new Uint8Array(arrayBuffer)
  let binary = ""
  for (let i = 0; i < uint8Array.byteLength; i++) {
    binary += String.fromCharCode(uint8Array[i])
  }
  return btoa(binary)
}

/**
 * Türkçe karakter kontrolü - artık gereksiz olacak
 * Eski kod için backward compatibility
 * @deprecated Font yükledikten sonra bu fonksiyona gerek kalmayacak
 */
export function safeText(text: string | number | null | undefined): string {
  if (text === null || text === undefined) return ""
  return String(text)
}
