import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: "Ödeme sistemi geçici olarak devre dışı bırakılmıştır. Abonelik için lütfen +90 543 203 53 09 numaralı telefondan iletişime geçin." },
    { status: 503 }
  )
}
