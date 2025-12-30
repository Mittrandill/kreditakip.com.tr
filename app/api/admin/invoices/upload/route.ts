import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { checkAdminAPI } from "@/lib/admin-check"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  // SECURITY: Check admin authentication
  const adminCheck = await checkAdminAPI(request)
  if (adminCheck) return adminCheck

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const formData = await request.formData()
    const file = formData.get("file") as File
    const invoiceId = formData.get("invoiceId") as string

    if (!file || !invoiceId) {
      return NextResponse.json({ error: "Missing file or invoiceId" }, { status: 400 })
    }

    // Get invoice to get user_id
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("user_id, invoice_number")
      .eq("id", invoiceId)
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Validate file type
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 })
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 10MB" }, { status: 400 })
    }

    // Extract invoice number from PDF filename (remove .pdf extension)
    const invoiceNumberFromFile = file.name.replace(/\.pdf$/i, "")

    // Clean filename for storage (remove Turkish characters and special chars)
    const cleanFileName = invoiceNumberFromFile
      .replace(/ğ/g, "g")
      .replace(/Ğ/g, "G")
      .replace(/ü/g, "u")
      .replace(/Ü/g, "U")
      .replace(/ş/g, "s")
      .replace(/Ş/g, "S")
      .replace(/ı/g, "i")
      .replace(/İ/g, "I")
      .replace(/ö/g, "o")
      .replace(/Ö/g, "O")
      .replace(/ç/g, "c")
      .replace(/Ç/g, "C")
      .replace(/[^a-zA-Z0-9-_]/g, "_") // Replace any other special chars with underscore

    // Upload to Supabase Storage
    const fileName = `${invoice.user_id}/${cleanFileName}-${Date.now()}.pdf`
    const { data, error } = await supabase.storage
      .from("invoices")
      .upload(fileName, file, {
        contentType: "application/pdf",
        upsert: true, // Allow overwriting
      })

    if (error) {
      console.error("Error uploading file:", error)
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("invoices").getPublicUrl(fileName)

    // Update invoice with file URL, invoice number from filename, and mark as ready
    const { data: updatedInvoice, error: updateError } = await supabase
      .from("invoices")
      .update({
        invoice_number: invoiceNumberFromFile, // PDF dosya adını fatura numarası yap
        file_url: publicUrl,
        file_name: file.name,
        status: "ready", // Fatura hazır - kullanıcı indirebilir
      })
      .eq("id", invoiceId)
      .select()
      .single()

    if (updateError) {
      console.error("[invoice-upload] Error updating invoice:", updateError)
      console.error("[invoice-upload] Full error details:", JSON.stringify(updateError, null, 2))
      return NextResponse.json({
        error: "Failed to update invoice",
        details: updateError.message
      }, { status: 500 })
    }

    // Revalidate the invoices page to clear Next.js cache
    revalidatePath("/admin/faturalar")

    return NextResponse.json({ url: publicUrl, path: data.path, invoice: updatedInvoice })
  } catch (error) {
    console.error("Error in POST /api/admin/invoices/upload:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
