import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * Webhook Cleanup Cron Job
 *
 * Veritabanı şişmesini önlemek için eski işlenmiş webhook olaylarını siler
 * Vercel Cron aracılığıyla haftalık çalışır
 *
 * İşlevler:
 * - 90 günden eski PayTR webhook'larını siler
 * - 90 günden eski Paddle webhook'larını siler
 * - Sadece işlenmiş (processed=true) kayıtları siler
 * - cleanup_jobs tablosunda takip edilir
 */
async function handler(request: NextRequest) {
  try {
    // Cron secret doğrulama
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      console.error("[webhook-cleanup] Yetkisiz istek")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    console.log("[webhook-cleanup] Temizlik başlatılıyor...")

    // PayTR webhook temizliği
    const { data: paytrDeleted, error: paytrError } = await supabase
      .rpc('cleanup_old_paytr_webhooks')

    if (paytrError) {
      console.error("[webhook-cleanup] PayTR temizlik hatası:", paytrError)
    } else {
      console.log(`[webhook-cleanup] PayTR: ${paytrDeleted || 0} kayıt silindi`)
    }

    // Paddle webhook temizliği
    const { data: paddleDeleted, error: paddleError } = await supabase
      .rpc('cleanup_old_paddle_webhooks')

    if (paddleError) {
      console.error("[webhook-cleanup] Paddle temizlik hatası:", paddleError)
    } else {
      console.log(`[webhook-cleanup] Paddle: ${paddleDeleted || 0} kayıt silindi`)
    }

    // Sonuçları topla
    const totalDeleted = (paytrDeleted || 0) + (paddleDeleted || 0)
    const hasErrors = paytrError || paddleError

    // Başarı mesajı
    console.log(`[webhook-cleanup] Temizlik tamamlandı: Toplam ${totalDeleted} kayıt silindi`)

    return NextResponse.json({
      success: !hasErrors,
      message: hasErrors
        ? "Webhook temizliği kısmen tamamlandı (bazı hatalar var)"
        : "Webhook temizliği başarıyla tamamlandı",
      deleted: {
        paytr: paytrDeleted || 0,
        paddle: paddleDeleted || 0,
        total: totalDeleted,
      },
      errors: {
        paytr: paytrError ? paytrError.message : null,
        paddle: paddleError ? paddleError.message : null,
      },
    })
  } catch (error: any) {
    console.error("[webhook-cleanup] Kritik hata:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "İç sunucu hatası",
      },
      { status: 500 },
    )
  }
}

// Hem GET (Vercel Cron) hem POST'u (GitHub Actions) destekle
export async function GET(request: NextRequest) {
  return handler(request)
}

export async function POST(request: NextRequest) {
  return handler(request)
}
