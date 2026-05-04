import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: "Ödeme sistemi geçici olarak devre dışı bırakılmıştır." },
    { status: 503 }
  )
}
