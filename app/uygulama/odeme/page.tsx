"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ExternalLink, Crown, Sparkles, AlertCircle } from "lucide-react"
import Link from "next/link"
import { SHOPIER_CHECKOUT_URLS } from "@/lib/shopier-client"

const PLAN_LABELS: Record<string, { name: string; price: string; period: string; icon: React.ReactNode }> = {
  "premium-yearly":  { name: "Premium Yıllık",  price: "3.830₺", period: "/ yıl",  icon: <Crown className="h-5 w-5 text-amber-400" /> },
  "premium-monthly": { name: "Premium Aylık",   price: "399₺",   period: "/ ay",   icon: <Crown className="h-5 w-5 text-amber-400" /> },
  "pro-yearly":      { name: "Pro Yıllık",       price: "1.910₺", period: "/ yıl",  icon: <Sparkles className="h-5 w-5 text-blue-400" /> },
  "pro-monthly":     { name: "Pro Aylık",        price: "199₺",   period: "/ ay",   icon: <Sparkles className="h-5 w-5 text-blue-400" /> },
}

export default function PaymentPage() {
  const searchParams = useSearchParams()
  const planId = searchParams.get("plan") ?? ""
  const [shopierUrl, setShopierUrl] = useState<string | null>(null)
  const plan = PLAN_LABELS[planId] ?? null

  useEffect(() => {
    setShopierUrl(SHOPIER_CHECKOUT_URLS[planId] ?? null)
  }, [planId])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4">
      <Card className="w-full max-w-md bg-black/20 border-white/10 backdrop-blur-xl">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            {plan?.icon ?? <Crown className="h-8 w-8 text-emerald-400" />}
          </div>
          <CardTitle className="text-white text-2xl">
            {plan ? plan.name : "Abonelik Satın Al"}
          </CardTitle>
          {plan && (
            <p className="text-emerald-400 text-2xl font-bold mt-1">
              {plan.price}
              <span className="text-white/60 text-base font-normal ml-1">{plan.period}</span>
            </p>
          )}
          <p className="text-white/60 text-sm mt-2">
            Shopier güvenli ödeme sayfasına yönlendirileceksiniz.
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {shopierUrl ? (
            <>
              <a
                href={shopierUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg py-4 font-semibold text-lg transition-colors shadow-lg"
              >
                <ExternalLink className="h-5 w-5" />
                Shopier ile Satın Al
              </a>

              <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <AlertCircle className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-blue-300 text-xs">
                  Ödeme tamamlandıktan sonra aboneliğiniz otomatik olarak aktif olacaktır.
                  Birkaç dakika içinde yansımaz ise sayfayı yenileyin.
                </p>
              </div>
            </>
          ) : (
            <div className="text-center text-white/60 py-4">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-amber-400" />
              <p>Geçersiz plan seçimi. Lütfen tekrar deneyin.</p>
            </div>
          )}

          <Link href="/uygulama/premium">
            <Button
              variant="outline"
              className="w-full bg-black/20 border-white/10 text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Planlara Dön
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
