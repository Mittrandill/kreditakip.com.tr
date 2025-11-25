import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export const dynamic = 'force-dynamic'

/**
 * KVKK Madde 11(d): Kişisel verilerin bir kopyasını talep etme hakkı
 * Kullanıcının tüm verilerini JSON formatında indirmesini sağlar
 */
export async function GET(request: Request) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 })
    }

    // Kullanıcının TÜM verilerini topla (KVKK m.11 uyarınca)
    const [profile, credits, accounts, payments, subscriptions, riskAnalyses, financialProfiles, usage] =
      await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("credits").select("*").eq("user_id", user.id),
        supabase.from("bank_accounts").select("*").eq("user_id", user.id),
        supabase.from("payments").select("*").eq("user_id", user.id),
        supabase.from("subscriptions").select("*").eq("user_id", user.id),
        supabase.from("risk_analyses").select("*").eq("user_id", user.id),
        supabase.from("financial_profiles").select("*").eq("user_id", user.id),
        supabase.from("usage_tracking").select("*").eq("user_id", user.id),
      ])

    // KVKK uyumlu veri export formatı
    const exportData = {
      exportInfo: {
        exportDate: new Date().toISOString(),
        exportedBy: user.email,
        dataProtectionRight: "KVKK Madde 11(d) - Kişisel verilerin bir kopyasını talep etme hakkı",
        format: "JSON",
      },
      personalData: {
        userId: user.id,
        email: user.email,
        profile: profile.data,
        createdAt: user.created_at,
        emailConfirmedAt: user.email_confirmed_at,
        lastSignInAt: user.last_sign_in_at,
      },
      financialData: {
        credits: credits.data || [],
        bankAccounts: accounts.data || [],
        financialProfiles: financialProfiles.data || [],
      },
      transactionData: {
        payments: payments.data || [],
        subscriptions: subscriptions.data || [],
      },
      analysisData: {
        riskAnalyses: riskAnalyses.data || [],
      },
      usageData: {
        tracking: usage.data || [],
      },
      metadata: {
        totalRecords: {
          credits: credits.data?.length || 0,
          bankAccounts: accounts.data?.length || 0,
          payments: payments.data?.length || 0,
          subscriptions: subscriptions.data?.length || 0,
          riskAnalyses: riskAnalyses.data?.length || 0,
          financialProfiles: financialProfiles.data?.length || 0,
          usageTracking: usage.data?.length || 0,
        },
      },
    }

    // JSON olarak indir
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="kreditakip-verilerim-${new Date().toISOString().split("T")[0]}.json"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    })
  } catch (error) {
    console.error("[export-data] Error:", error)
    return NextResponse.json({ error: "Veri export işlemi başarısız oldu" }, { status: 500 })
  }
}
