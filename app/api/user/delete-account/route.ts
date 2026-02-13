import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"

/**
 * KVKK Madde 7: Kişisel verilerin silinmesini isteme hakkı
 * Kullanıcının TÜM verilerini kalıcı olarak siler
 */
export async function DELETE(request: Request) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 })
    }

    // Admin client ile tüm verileri sil (RLS bypass)
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // KVKK m.7 uyarınca - Kullanıcının TÜM verilerini sil

    // Tüm ilişkili verileri sil (foreign key cascade ile bazıları otomatik silinebilir)
    await Promise.allSettled([
      // Kredi ve ödeme verileri
      supabaseAdmin.from("credits").delete().eq("user_id", user.id),
      supabaseAdmin.from("credit_cards").delete().eq("user_id", user.id),
      supabaseAdmin.from("accounts").delete().eq("user_id", user.id),
      supabaseAdmin.from("payment_plans").delete().eq("user_id", user.id),
      supabaseAdmin.from("bank_accounts").delete().eq("user_id", user.id),
      supabaseAdmin.from("payments").delete().eq("user_id", user.id),
      supabaseAdmin.from("payment_history").delete().eq("user_id", user.id),

      // Abonelik ve ödeme verileri
      supabaseAdmin.from("payment_transactions").delete().eq("user_id", user.id),
      supabaseAdmin.from("pending_subscriptions").delete().eq("user_id", user.id),
      supabaseAdmin.from("subscriptions").delete().eq("user_id", user.id),
      supabaseAdmin.from("subscription_usage").delete().eq("user_id", user.id),
      supabaseAdmin.from("billing_info").delete().eq("user_id", user.id),
      supabaseAdmin.from("invoices").delete().eq("user_id", user.id),

      // Analiz ve güvenlik verileri
      supabaseAdmin.from("risk_analyses").delete().eq("user_id", user.id),
      supabaseAdmin.from("refinancing_analyses").delete().eq("user_id", user.id),
      supabaseAdmin.from("banking_credentials").delete().eq("user_id", user.id),

      // Finansal profil ve bildirimler
      supabaseAdmin.from("financial_profiles").delete().eq("user_id", user.id),
      supabaseAdmin.from("notifications").delete().eq("user_id", user.id),

      // Son olarak profil
      supabaseAdmin.from("profiles").delete().eq("id", user.id),
    ])

    // Supabase Auth'dan kullanıcıyı sil (son adım)
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(user.id)

    if (deleteAuthError) {
      console.error("[delete-account] Auth deletion error:", deleteAuthError)
      return NextResponse.json({ error: "Hesap silme başarısız oldu" }, { status: 500 })
    }


    return NextResponse.json({
      success: true,
      message: "Hesabınız ve tüm verileriniz kalıcı olarak silindi (KVKK m.7)",
    })
  } catch (error) {
    console.error("[delete-account] Error:", error)
    return NextResponse.json({ error: "Hesap silme işlemi başarısız oldu" }, { status: 500 })
  }
}
